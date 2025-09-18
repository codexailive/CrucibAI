import { EventEmitter } from 'events';
import { PrismaClient } from '@prisma/client';

export interface AutoFixRequest {
  userId: string;
  projectId?: string;
  errorType: string;
  errorMessage: string;
  codeContext: string;
  filePath: string;
  lineNumber?: number;
}

export interface AutoFixResponse {
  success: boolean;
  fixApplied: boolean;
  originalCode: string;
  fixedCode?: string;
  explanation?: string;
  requiresApproval: boolean;
  riskLevel: 'low' | 'medium' | 'high';
  confidence: number;
}

export interface PermissionLevel {
  userId: string;
  autoFixEnabled: boolean;
  maxRiskLevel: 'low' | 'medium' | 'high';
  requiresApproval: boolean;
  allowedErrorTypes: string[];
}

export class PermissionBasedAutoFix extends EventEmitter {
  private prisma: PrismaClient;
  private userPermissions: Map<string, PermissionLevel> = new Map();

  constructor() {
    super();
    this.prisma = new PrismaClient();
    this.initializeDefaultPermissions();
  }

  private initializeDefaultPermissions(): void {
    // Default permission levels for different user types
    const defaultPermissions: PermissionLevel = {
      userId: 'default',
      autoFixEnabled: true,
      maxRiskLevel: 'low',
      requiresApproval: true,
      allowedErrorTypes: [
        'typescript_error',
        'import_error',
        'syntax_error',
        'type_mismatch',
        'missing_dependency'
      ]
    };

    this.userPermissions.set('default', defaultPermissions);
  }

  async setUserPermissions(userId: string, permissions: Partial<PermissionLevel>): Promise<void> {
    const existing = this.userPermissions.get(userId) || this.userPermissions.get('default')!;
    const updated: PermissionLevel = {
      ...existing,
      ...permissions,
      userId
    };
    
    this.userPermissions.set(userId, updated);
    this.emit('permissionsUpdated', { userId, permissions: updated });
  }

  async getUserPermissions(userId: string): Promise<PermissionLevel> {
    return this.userPermissions.get(userId) || this.userPermissions.get('default')!;
  }

  async requestAutoFix(request: AutoFixRequest): Promise<AutoFixResponse> {
    const permissions = await this.getUserPermissions(request.userId);

    // Check if auto-fix is enabled for user
    if (!permissions.autoFixEnabled) {
      return {
        success: false,
        fixApplied: false,
        originalCode: request.codeContext,
        explanation: 'Auto-fix is disabled for this user',
        requiresApproval: true,
        riskLevel: 'high',
        confidence: 0
      };
    }

    // Check if error type is allowed
    if (!permissions.allowedErrorTypes.includes(request.errorType)) {
      return {
        success: false,
        fixApplied: false,
        originalCode: request.codeContext,
        explanation: `Auto-fix not allowed for error type: ${request.errorType}`,
        requiresApproval: true,
        riskLevel: 'high',
        confidence: 0
      };
    }

    // Analyze the fix and determine risk level
    const analysis = await this.analyzeFix(request);
    
    // Check if risk level is within user's permissions
    if (this.getRiskLevelValue(analysis.riskLevel) > this.getRiskLevelValue(permissions.maxRiskLevel)) {
      return {
        success: false,
        fixApplied: false,
        originalCode: request.codeContext,
        explanation: `Fix risk level (${analysis.riskLevel}) exceeds user permission (${permissions.maxRiskLevel})`,
        requiresApproval: true,
        riskLevel: analysis.riskLevel,
        confidence: analysis.confidence
      };
    }

    // Generate the fix
    const fix = await this.generateFix(request);

    // Determine if approval is required
    const requiresApproval = permissions.requiresApproval || 
                           analysis.riskLevel !== 'low' || 
                           analysis.confidence < 0.8;

    const response: AutoFixResponse = {
      success: true,
      fixApplied: !requiresApproval,
      originalCode: request.codeContext,
      fixedCode: fix.code,
      explanation: fix.explanation,
      requiresApproval,
      riskLevel: analysis.riskLevel,
      confidence: analysis.confidence
    };

    // Log the auto-fix attempt
    await this.logAutoFixAttempt(request, response);

    this.emit('autoFixRequested', {
      userId: request.userId,
      errorType: request.errorType,
      fixApplied: response.fixApplied,
      requiresApproval
    });

    return response;
  }

  private async analyzeFix(request: AutoFixRequest): Promise<{
    riskLevel: 'low' | 'medium' | 'high';
    confidence: number;
  }> {
    // Simple risk analysis based on error type and context
    let riskLevel: 'low' | 'medium' | 'high' = 'low';
    let confidence = 0.9;

    // Higher risk for certain error types
    if (request.errorType.includes('security') || request.errorType.includes('auth')) {
      riskLevel = 'high';
      confidence = 0.6;
    } else if (request.errorType.includes('database') || request.errorType.includes('api')) {
      riskLevel = 'medium';
      confidence = 0.7;
    }

    // Lower confidence for complex code contexts
    if (request.codeContext.length > 1000) {
      confidence *= 0.8;
    }

    // Adjust risk based on file type
    if (request.filePath.includes('config') || request.filePath.includes('env')) {
      riskLevel = 'high';
      confidence *= 0.7;
    }

    return { riskLevel, confidence };
  }

  private async generateFix(request: AutoFixRequest): Promise<{
    code: string;
    explanation: string;
  }> {
    // Mock fix generation - in production, use AI to generate actual fixes
    let fixedCode = request.codeContext;
    let explanation = '';

    switch (request.errorType) {
      case 'typescript_error':
        explanation = 'Added missing type annotations and fixed type mismatches';
        // Simple mock fix
        fixedCode = request.codeContext.replace(/: any/g, ': string');
        break;
      
      case 'import_error':
        explanation = 'Fixed import paths and added missing imports';
        // Mock fix for import errors
        if (request.errorMessage.includes('Cannot find module')) {
          const moduleName = request.errorMessage.match(/'([^']+)'/)?.[1];
          if (moduleName) {
            fixedCode = `import ${moduleName} from '${moduleName}';\n${request.codeContext}`;
          }
        }
        break;
      
      case 'missing_dependency':
        explanation = 'Added missing dependency installation command';
        fixedCode = `// Run: npm install ${request.errorMessage.match(/module '([^']+)'/)?.[1] || 'missing-package'}\n${request.codeContext}`;
        break;
      
      default:
        explanation = `Applied automatic fix for ${request.errorType}`;
        break;
    }

    return { code: fixedCode, explanation };
  }

  private getRiskLevelValue(level: 'low' | 'medium' | 'high'): number {
    switch (level) {
      case 'low': return 1;
      case 'medium': return 2;
      case 'high': return 3;
      default: return 3;
    }
  }

  private async logAutoFixAttempt(request: AutoFixRequest, response: AutoFixResponse): Promise<void> {
    try {
      await this.prisma.auditLogEntry.create({
        data: {
          eventId: `autofix_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
          action: 'auto_fix_attempt',
          userId: request.userId,
          data: JSON.stringify({
            errorType: request.errorType,
            filePath: request.filePath,
            fixApplied: response.fixApplied,
            riskLevel: response.riskLevel,
            confidence: response.confidence,
            requiresApproval: response.requiresApproval
          })
        }
      });
    } catch (error) {
      console.error('Failed to log auto-fix attempt:', error);
    }
  }

  async getAutoFixHistory(userId: string, limit: number = 50): Promise<any[]> {
    try {
      const history = await this.prisma.auditLogEntry.findMany({
        where: {
          userId,
          action: 'auto_fix_attempt'
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: limit
      });

      return history.map(entry => ({
        id: entry.id,
        timestamp: entry.createdAt,
        data: JSON.parse(entry.data || '{}')
      }));
    } catch (error) {
      console.error('Failed to get auto-fix history:', error);
      return [];
    }
  }
}
