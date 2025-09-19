import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import { EventEmitter } from 'events';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

export interface SecurityEvent {
  id: string;
  type: 'authentication' | 'authorization' | 'data_access' | 'system_change' | 'threat_detected';
  severity: 'low' | 'medium' | 'high' | 'critical';
  userId?: string;
  ipAddress: string;
  userAgent: string;
  resource: string;
  action: string;
  result: 'success' | 'failure' | 'blocked';
  metadata: Record<string, any>;
  timestamp: Date;
}

export interface ComplianceStandard {
  id: string;
  name: string;
  version: string;
  requirements: ComplianceRequirement[];
  enabled: boolean;
}

export interface ComplianceRequirement {
  id: string;
  title: string;
  description: string;
  category: string;
  mandatory: boolean;
  status: 'compliant' | 'non_compliant' | 'partial' | 'not_applicable';
  evidence: string[];
  lastChecked: Date;
  nextCheck: Date;
}

export interface AuditLog {
  id: string;
  userId: string;
  action: string;
  resource: string;
  resourceId?: string;
  oldValue?: any;
  newValue?: any;
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
  metadata: Record<string, any>;
}

export interface ThreatDetection {
  id: string;
  type: 'brute_force' | 'sql_injection' | 'xss' | 'ddos' | 'data_exfiltration' | 'anomalous_behavior';
  severity: 'low' | 'medium' | 'high' | 'critical';
  source: string;
  target: string;
  description: string;
  indicators: string[];
  mitigationActions: string[];
  status: 'detected' | 'investigating' | 'mitigated' | 'false_positive';
  timestamp: Date;
}

export interface DataEncryption {
  algorithm: 'AES-256-GCM' | 'RSA-2048' | 'ChaCha20-Poly1305';
  keyId: string;
  encryptedData: string;
  iv?: string;
  tag?: string;
  metadata: Record<string, any>;
}

export class SecurityComplianceService extends EventEmitter {
  private encryptionKeys = new Map<string, Buffer>();
  private activeThreats = new Map<string, ThreatDetection>();
  private complianceStandards = new Map<string, ComplianceStandard>();

  constructor() {
    super();
    this.initializeComplianceStandards();
    this.startThreatMonitoring();
  }

  // Authentication & Authorization
  async authenticateUser(
    email: string,
    password: string,
    ipAddress: string,
    userAgent: string
  ): Promise<{ success: boolean; token?: string; user?: any; mfaRequired?: boolean }> {
    const startTime = Date.now();
    
    try {
      // Check for brute force attempts
      const recentFailures = await this.getRecentAuthFailures(email, ipAddress);
      if (recentFailures >= 5) {
        await this.logSecurityEvent({
          type: 'authentication',
          severity: 'high',
          ipAddress,
          userAgent,
          resource: 'auth',
          action: 'login_blocked',
          result: 'blocked',
          metadata: { email, reason: 'brute_force_protection', failures: recentFailures },
        });
        return { success: false };
      }

      // Authenticate user
      const user = await prisma.user.findUnique({
        where: { email },
        include: { subscription: true },
      });

      if (!user || !await this.verifyPassword(password, user.encrypted_password)) {
        await this.logSecurityEvent({
          type: 'authentication',
          severity: 'medium',
          ipAddress,
          userAgent,
          resource: 'auth',
          action: 'login_failed',
          result: 'failure',
          metadata: { email, reason: 'invalid_credentials' },
        });
        return { success: false };
      }

      // Check if MFA is required
      if (user.mfaEnabled) {
        await this.logSecurityEvent({
          type: 'authentication',
          severity: 'low',
          userId: user.id,
          ipAddress,
          userAgent,
          resource: 'auth',
          action: 'mfa_required',
          result: 'success',
          metadata: { email },
        });
        return { success: true, mfaRequired: true, user };
      }

      // Generate JWT token
      const token = this.generateJWT(user);

      // Update last login
      await prisma.user.update({
        where: { id: user.id },
        data: { lastActiveAt: new Date() },
      });

      await this.logSecurityEvent({
        type: 'authentication',
        severity: 'low',
        userId: user.id,
        ipAddress,
        userAgent,
        resource: 'auth',
        action: 'login_success',
        result: 'success',
        metadata: { email, duration: Date.now() - startTime },
      });

      return { success: true, token, user };
    } catch (error) {
      await this.logSecurityEvent({
        type: 'authentication',
        severity: 'high',
        ipAddress,
        userAgent,
        resource: 'auth',
        action: 'login_error',
        result: 'failure',
        metadata: { email, error: (error as Error).message },
      });
      throw error;
    }
  }

  async verifyMFA(
    userId: string,
    code: string,
    ipAddress: string,
    userAgent: string
  ): Promise<{ success: boolean; token?: string }> {
    try {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) return { success: false };

      // Verify TOTP code (simplified implementation)
      const isValidCode = await this.verifyTOTP(user.mfaSecret!, code);
      
      if (!isValidCode) {
        await this.logSecurityEvent({
          type: 'authentication',
          severity: 'medium',
          userId,
          ipAddress,
          userAgent,
          resource: 'mfa',
          action: 'mfa_failed',
          result: 'failure',
          metadata: { reason: 'invalid_code' },
        });
        return { success: false };
      }

      const token = this.generateJWT(user);

      await this.logSecurityEvent({
        type: 'authentication',
        severity: 'low',
        userId,
        ipAddress,
        userAgent,
        resource: 'mfa',
        action: 'mfa_success',
        result: 'success',
        metadata: {},
      });

      return { success: true, token };
    } catch (error) {
      await this.logSecurityEvent({
        type: 'authentication',
        severity: 'high',
        userId,
        ipAddress,
        userAgent,
        resource: 'mfa',
        action: 'mfa_error',
        result: 'failure',
        metadata: { error: (error as Error).message },
      });
      return { success: false };
    }
  }

  async authorizeAction(
    userId: string,
    resource: string,
    action: string,
    context: Record<string, any> = {}
  ): Promise<{ authorized: boolean; reason?: string }> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { subscription: true },
      });

      if (!user) {
        return { authorized: false, reason: 'User not found' };
      }

      // Check subscription limits
      if (resource === 'ai_calls' && action === 'create') {
        const usage = await this.getUserUsage(userId, 'AI_CALLS');
        const limit = this.getSubscriptionLimit(user.subscription?.tier || 'Discovery', 'AI_CALLS');
        
        if (usage >= limit) {
          await this.logSecurityEvent({
            type: 'authorization',
            severity: 'low',
            userId,
            ipAddress: context.ipAddress || 'unknown',
            userAgent: context.userAgent || 'unknown',
            resource,
            action,
            result: 'blocked',
            metadata: { reason: 'usage_limit_exceeded', usage, limit },
          });
          return { authorized: false, reason: 'Usage limit exceeded' };
        }
      }

      // Role-based access control
      const hasPermission = await this.checkPermission(user, resource, action);
      if (!hasPermission) {
        await this.logSecurityEvent({
          type: 'authorization',
          severity: 'medium',
          userId,
          ipAddress: context.ipAddress || 'unknown',
          userAgent: context.userAgent || 'unknown',
          resource,
          action,
          result: 'blocked',
          metadata: { reason: 'insufficient_permissions' },
        });
        return { authorized: false, reason: 'Insufficient permissions' };
      }

      return { authorized: true };
    } catch (error) {
      await this.logSecurityEvent({
        type: 'authorization',
        severity: 'high',
        userId,
        ipAddress: context.ipAddress || 'unknown',
        userAgent: context.userAgent || 'unknown',
        resource,
        action,
        result: 'failure',
        metadata: { error: (error as Error).message },
      });
      return { authorized: false, reason: 'Authorization error' };
    }
  }

  // Data Encryption
  async encryptData(data: string, algorithm: DataEncryption['algorithm'] = 'AES-256-GCM'): Promise<DataEncryption> {
    try {
      const keyId = this.generateKeyId();
      const key = this.getOrCreateEncryptionKey(keyId);

      switch (algorithm) {
        case 'AES-256-GCM': {
          const iv = crypto.randomBytes(16);
          const cipher = crypto.createCipher('aes-256-gcm', key);
          cipher.setAAD(Buffer.from(keyId));
          
          let encrypted = cipher.update(data, 'utf8', 'hex');
          encrypted += cipher.final('hex');
          const tag = cipher.getAuthTag();

          return {
            algorithm,
            keyId,
            encryptedData: encrypted,
            iv: iv.toString('hex'),
            tag: tag.toString('hex'),
            metadata: { timestamp: new Date().toISOString() },
          };
        }
        default:
          throw new Error(`Unsupported encryption algorithm: ${algorithm}`);
      }
    } catch (error) {
      this.emit('encryptionError', { error, algorithm, dataLength: data.length });
      throw error;
    }
  }

  async decryptData(encryptedData: DataEncryption): Promise<string> {
    try {
      const key = this.getEncryptionKey(encryptedData.keyId);
      if (!key) {
        throw new Error('Encryption key not found');
      }

      switch (encryptedData.algorithm) {
        case 'AES-256-GCM': {
          const decipher = crypto.createDecipher('aes-256-gcm', key);
          decipher.setAAD(Buffer.from(encryptedData.keyId));
          if (encryptedData.tag) {
            decipher.setAuthTag(Buffer.from(encryptedData.tag, 'hex'));
          }

          let decrypted = decipher.update(encryptedData.encryptedData, 'hex', 'utf8');
          decrypted += decipher.final('utf8');
          return decrypted;
        }
        default:
          throw new Error(`Unsupported decryption algorithm: ${encryptedData.algorithm}`);
      }
    } catch (error) {
      this.emit('decryptionError', { error, keyId: encryptedData.keyId });
      throw error;
    }
  }

  // Audit Logging
  async logAuditEvent(auditLog: Omit<AuditLog, 'id' | 'timestamp'>): Promise<void> {
    const log: AuditLog = {
      ...auditLog,
      id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
      timestamp: new Date(),
    };

    // In production, store in secure audit database
    console.log('Audit Log:', log);
    
    this.emit('auditLogged', log);
  }

  async getAuditLogs(
    filters: {
      userId?: string;
      resource?: string;
      action?: string;
      startDate?: Date;
      endDate?: Date;
    },
    limit: number = 100
  ): Promise<AuditLog[]> {
    // In production, query from audit database with proper filtering
    return [];
  }

  // Compliance Management
  async checkCompliance(standardId: string): Promise<{
    standard: ComplianceStandard;
    overallStatus: 'compliant' | 'non_compliant' | 'partial';
    score: number;
    issues: ComplianceRequirement[];
  }> {
    const standard = this.complianceStandards.get(standardId);
    if (!standard) {
      throw new Error(`Compliance standard not found: ${standardId}`);
    }

    const compliantRequirements = standard.requirements.filter(r => r.status === 'compliant').length;
    const totalRequirements = standard.requirements.filter(r => r.status !== 'not_applicable').length;
    const score = (compliantRequirements / totalRequirements) * 100;

    const issues = standard.requirements.filter(r => 
      r.status === 'non_compliant' || r.status === 'partial'
    );

    let overallStatus: 'compliant' | 'non_compliant' | 'partial';
    if (score === 100) {
      overallStatus = 'compliant';
    } else if (score >= 80) {
      overallStatus = 'partial';
    } else {
      overallStatus = 'non_compliant';
    }

    return { standard, overallStatus, score, issues };
  }

  async generateComplianceReport(standardIds: string[]): Promise<{
    reportId: string;
    generatedAt: Date;
    standards: Array<{
      id: string;
      name: string;
      status: string;
      score: number;
      issues: number;
    }>;
    overallScore: number;
    recommendations: string[];
  }> {
    const reportId = `compliance_report_${Date.now()}`;
    const standards = [];
    let totalScore = 0;

    for (const standardId of standardIds) {
      const compliance = await this.checkCompliance(standardId);
      standards.push({
        id: standardId,
        name: compliance.standard.name,
        status: compliance.overallStatus,
        score: compliance.score,
        issues: compliance.issues.length,
      });
      totalScore += compliance.score;
    }

    const overallScore = totalScore / standardIds.length;
    const recommendations = this.generateComplianceRecommendations(standards);

    return {
      reportId,
      generatedAt: new Date(),
      standards,
      overallScore,
      recommendations,
    };
  }

  // Threat Detection
  async detectThreat(
    type: ThreatDetection['type'],
    source: string,
    target: string,
    indicators: string[],
    metadata: Record<string, any> = {}
  ): Promise<ThreatDetection> {
    const threat: ThreatDetection = {
      id: `threat_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
      type,
      severity: this.calculateThreatSeverity(type, indicators),
      source,
      target,
      description: this.generateThreatDescription(type, indicators),
      indicators,
      mitigationActions: this.generateMitigationActions(type),
      status: 'detected',
      timestamp: new Date(),
    };

    this.activeThreats.set(threat.id, threat);

    // Auto-mitigation for high/critical threats
    if (threat.severity === 'high' || threat.severity === 'critical') {
      await this.autoMitigateThreat(threat);
    }

    await this.logSecurityEvent({
      type: 'threat_detected',
      severity: threat.severity,
      ipAddress: source,
      userAgent: 'system',
      resource: target,
      action: 'threat_detection',
      result: 'success',
      metadata: { threatId: threat.id, threatType: type, indicators },
    });

    this.emit('threatDetected', threat);
    return threat;
  }

  async mitigateThreat(threatId: string, actions: string[]): Promise<void> {
    const threat = this.activeThreats.get(threatId);
    if (!threat) {
      throw new Error('Threat not found');
    }

    threat.status = 'mitigated';
    threat.mitigationActions = actions;

    await this.logSecurityEvent({
      type: 'threat_detected',
      severity: 'low',
      ipAddress: threat.source,
      userAgent: 'system',
      resource: threat.target,
      action: 'threat_mitigated',
      result: 'success',
      metadata: { threatId, actions },
    });

    this.emit('threatMitigated', threat);
  }

  // Helper Methods
  private async logSecurityEvent(event: Omit<SecurityEvent, 'id' | 'timestamp'>): Promise<void> {
    const securityEvent: SecurityEvent = {
      ...event,
      id: `security_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
      timestamp: new Date(),
    };

    // In production, store in security event database
    console.log('Security Event:', securityEvent);
    
    this.emit('securityEvent', securityEvent);
  }

  private async getRecentAuthFailures(email: string, ipAddress: string): Promise<number> {
    // In production, query actual failure count from database
    return Math.floor(Math.random() * 3);
  }

  private async verifyPassword(password: string, hash: string): Promise<boolean> {
    // In production, use proper password hashing (bcrypt, argon2, etc.)
    return crypto.createHash('sha256').update(password).digest('hex') === hash;
  }

  private generateJWT(user: any): string {
    return jwt.sign(
      {
        userId: user.id,
        email: user.email,
        tier: user.userSubscription?.tier || 'Discovery',
      },
      process.env.JWT_SECRET || 'default-secret',
      { expiresIn: '24h' }
    );
  }

  private async verifyTOTP(secret: string, code: string): Promise<boolean> {
    // In production, implement proper TOTP verification
    return code.length === 6 && /^\d+$/.test(code);
  }

  private async getUserUsage(userId: string, type: string): Promise<number> {
    // In production, query actual usage from database
    return Math.floor(Math.random() * 100);
  }

  private getSubscriptionLimit(tier: string, type: string): number {
    const limits: Record<string, Record<string, number>> = {
      Discovery: { AI_CALLS: 20 },
      Starter: { AI_CALLS: 250 },
      Professional: { AI_CALLS: 500 },
      Business: { AI_CALLS: 1200 },
      Team: { AI_CALLS: 3000 },
      Enterprise: { AI_CALLS: 10000 },
      Unlimited: { AI_CALLS: 50000 },
    };
    return limits[tier]?.[type] || 0;
  }

  private async checkPermission(user: any, resource: string, action: string): Promise<boolean> {
    // In production, implement proper RBAC
    return true;
  }

  private generateKeyId(): string {
    return `key_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
  }

  private getOrCreateEncryptionKey(keyId: string): Buffer {
    if (!this.encryptionKeys.has(keyId)) {
      const key = crypto.randomBytes(32);
      this.encryptionKeys.set(keyId, key);
    }
    return this.encryptionKeys.get(keyId)!;
  }

  private getEncryptionKey(keyId: string): Buffer | null {
    return this.encryptionKeys.get(keyId) || null;
  }

  private initializeComplianceStandards(): void {
    // SOC2 Type II
    this.complianceStandards.set('soc2', {
      id: 'soc2',
      name: 'SOC 2 Type II',
      version: '2017',
      enabled: true,
      requirements: [
        {
          id: 'cc1.1',
          title: 'Control Environment',
          description: 'Management establishes structures, reporting lines, and appropriate authorities',
          category: 'Common Criteria',
          mandatory: true,
          status: 'compliant',
          evidence: ['org_chart.pdf', 'policies.pdf'],
          lastChecked: new Date(),
          nextCheck: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        },
        // Add more requirements...
      ],
    });

    // HIPAA
    this.complianceStandards.set('hipaa', {
      id: 'hipaa',
      name: 'HIPAA',
      version: '2013',
      enabled: true,
      requirements: [
        {
          id: 'hipaa_164.312',
          title: 'Technical Safeguards',
          description: 'Implement technical safeguards for PHI',
          category: 'Security',
          mandatory: true,
          status: 'compliant',
          evidence: ['encryption_policy.pdf', 'access_controls.pdf'],
          lastChecked: new Date(),
          nextCheck: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
        // Add more requirements...
      ],
    });

    // GDPR
    this.complianceStandards.set('gdpr', {
      id: 'gdpr',
      name: 'GDPR',
      version: '2018',
      enabled: true,
      requirements: [
        {
          id: 'gdpr_art32',
          title: 'Security of Processing',
          description: 'Implement appropriate technical and organizational measures',
          category: 'Security',
          mandatory: true,
          status: 'compliant',
          evidence: ['security_measures.pdf', 'risk_assessment.pdf'],
          lastChecked: new Date(),
          nextCheck: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
        },
        // Add more requirements...
      ],
    });
  }

  private startThreatMonitoring(): void {
    // Monitor for brute force attacks
    setInterval(() => {
      this.monitorBruteForceAttacks();
    }, 60000); // Every minute

    // Monitor for anomalous behavior
    setInterval(() => {
      this.monitorAnomalousBehavior();
    }, 300000); // Every 5 minutes
  }

  private async monitorBruteForceAttacks(): Promise<void> {
    // In production, analyze authentication logs for patterns
    const suspiciousIPs = ['192.168.1.100', '10.0.0.50'];
    
    for (const ip of suspiciousIPs) {
      if (Math.random() < 0.1) { // 10% chance of detection
        await this.detectThreat(
          'brute_force',
          ip,
          'authentication_service',
          ['multiple_failed_logins', 'short_time_interval'],
          { failureCount: Math.floor(Math.random() * 20) + 10 }
        );
      }
    }
  }

  private async monitorAnomalousBehavior(): Promise<void> {
    // In production, use ML models to detect anomalies
    if (Math.random() < 0.05) { // 5% chance of detection
      await this.detectThreat(
        'anomalous_behavior',
        'user_12345',
        'api_endpoints',
        ['unusual_access_pattern', 'off_hours_activity'],
        { confidence: 0.85 }
      );
    }
  }

  private calculateThreatSeverity(type: ThreatDetection['type'], indicators: string[]): ThreatDetection['severity'] {
    const severityMap: Record<ThreatDetection['type'], ThreatDetection['severity']> = {
      brute_force: 'medium',
      sql_injection: 'high',
      xss: 'medium',
      ddos: 'high',
      data_exfiltration: 'critical',
      anomalous_behavior: 'low',
    };

    let baseSeverity = severityMap[type];
    
    // Increase severity based on indicators
    if (indicators.includes('admin_access') || indicators.includes('sensitive_data')) {
      if (baseSeverity === 'low') baseSeverity = 'medium';
      else if (baseSeverity === 'medium') baseSeverity = 'high';
      else if (baseSeverity === 'high') baseSeverity = 'critical';
    }

    return baseSeverity;
  }

  private generateThreatDescription(type: ThreatDetection['type'], indicators: string[]): string {
    const descriptions: Record<ThreatDetection['type'], string> = {
      brute_force: 'Multiple failed authentication attempts detected',
      sql_injection: 'SQL injection attack attempt detected',
      xss: 'Cross-site scripting attack detected',
      ddos: 'Distributed denial of service attack detected',
      data_exfiltration: 'Potential data exfiltration detected',
      anomalous_behavior: 'Unusual user behavior pattern detected',
    };

    return `${descriptions[type]}. Indicators: ${indicators.join(', ')}`;
  }

  private generateMitigationActions(type: ThreatDetection['type']): string[] {
    const actions: Record<ThreatDetection['type'], string[]> = {
      brute_force: ['Block IP address', 'Increase authentication delays', 'Notify user'],
      sql_injection: ['Block request', 'Update WAF rules', 'Review code'],
      xss: ['Sanitize input', 'Update CSP headers', 'Block malicious content'],
      ddos: ['Rate limit requests', 'Enable DDoS protection', 'Scale infrastructure'],
      data_exfiltration: ['Block data access', 'Revoke credentials', 'Investigate immediately'],
      anomalous_behavior: ['Monitor closely', 'Require additional authentication', 'Log activities'],
    };

    return actions[type] || ['Monitor and investigate'];
  }

  private async autoMitigateThreat(threat: ThreatDetection): Promise<void> {
    const actions = [];

    switch (threat.type) {
      case 'brute_force':
        actions.push('IP blocked automatically');
        break;
      case 'sql_injection':
        actions.push('Request blocked by WAF');
        break;
      case 'ddos':
        actions.push('Rate limiting enabled');
        break;
      default:
        actions.push('Threat logged for investigation');
    }

    await this.mitigateThreat(threat.id, actions);
  }

  private generateComplianceRecommendations(standards: any[]): string[] {
    const recommendations = [];

    for (const standard of standards) {
      if (standard.score < 100) {
        recommendations.push(`Improve ${standard.name} compliance (current: ${standard.score.toFixed(1)}%)`);
      }
      if (standard.issues > 0) {
        recommendations.push(`Address ${standard.issues} compliance issues in ${standard.name}`);
      }
    }

    if (recommendations.length === 0) {
      recommendations.push('All compliance standards are meeting requirements');
    }

    return recommendations;
  }
}

export default SecurityComplianceService;
