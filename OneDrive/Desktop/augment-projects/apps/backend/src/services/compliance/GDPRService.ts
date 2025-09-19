import { PrismaClient } from '@prisma/client';
import { createHash } from 'crypto';

const prisma = new PrismaClient();

export class GDPRService {
  /**
   * Export all user data for GDPR compliance
   */
  async exportUserData(userId: string): Promise<{
    personal_data: any;
    usage_data: any;
    billing_data: any;
    support_data: any;
    export_date: string;
  }> {
    try {
      // Get user personal data
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          subscription: true,
          usageTracking: true,
          quantumJobs: true,
          arvrSessions: true,
          supportTickets: {
            include: {
              replies: true
            }
          },
          payments: true,
          auditLogs: true
        }
      });

      if (!user) {
        throw new Error('User not found');
      }

      // Prepare export data
      const exportData = {
        personal_data: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          createdAt: user.createdAt,
          lastLoginAt: user.lastLoginAt,
          preferences: user.preferences,
          encryptionSettings: user.encryptionSettings
        },
        usage_data: {
          quantumJobs: user.quantumJobs.map((job: any) => ({
            id: job.id,
            type: job.type,
            status: job.status,
            createdAt: job.createdAt,
            completedAt: job.completedAt
          })),
          arvrSessions: user.arvrSessions.map((session: any) => ({
            id: session.id,
            sessionType: session.sessionType,
            duration: session.duration,
            createdAt: session.createdAt
          })),
          usageTracking: user.usageTracking.map((usage: any) => ({
            provider: usage.provider,
            service: usage.service,
            amount: usage.amount,
            cost: usage.cost,
            timestamp: usage.timestamp
          }))
        },
        billing_data: {
          subscription: user.subscription ? {
            id: user.subscription.id,
            tier: user.subscription.tier,
            status: user.subscription.status,
            billingCycle: user.subscription.billingCycle,
            currentPeriodStart: user.subscription.currentPeriodStart,
            currentPeriodEnd: user.subscription.currentPeriodEnd
          } : null,
          payments: user.payments.map((payment: any) => ({
            id: payment.id,
            amount: payment.amount,
            status: payment.status,
            createdAt: payment.createdAt
          }))
        },
        support_data: {
          tickets: user.supportTickets.map((ticket: any) => ({
            id: ticket.id,
            subject: ticket.subject,
            status: ticket.status,
            priority: ticket.priority,
            createdAt: ticket.createdAt,
            replies: ticket.replies.map((reply: any) => ({
              id: reply.id,
              message: reply.message,
              isFromUser: reply.isFromUser,
              createdAt: reply.createdAt
            }))
          }))
        },
        export_date: new Date().toISOString()
      };

      // Log the export request
      await prisma.auditLog.create({
        data: {
          eventId: `export_${userId}_${Date.now()}`,
          userId,
          action: 'data_export',
          data: JSON.stringify({ exportedAt: new Date() })
        }
      });

      return exportData;
    } catch (error) {
      console.error('Error exporting user data:', error);
      throw new Error('Failed to export user data');
    }
  }

  /**
   * Delete all user data (Right to be forgotten)
   */
  async deleteUserData(userId: string, reason: string = 'user_request'): Promise<void> {
    try {
      // First, anonymize data that needs to be retained for legal/business reasons
      await this.anonymizeUserData(userId);

      // Delete user data in correct order (respecting foreign key constraints)
      await prisma.$transaction(async (tx) => {
        // Delete related data first
        await tx.ticketReply.deleteMany({ where: { ticket: { userId } } });
        await tx.supportTicket.deleteMany({ where: { userId } });
        await tx.usageTracking.deleteMany({ where: { userId } });
        await tx.quantumJob.deleteMany({ where: { userId } });
        await tx.aRVRSession.deleteMany({ where: { userId } });
        await tx.overageCharge.deleteMany({ where: { userId } });
        await tx.payment.deleteMany({ where: { userId } });
        await tx.userSubscription.deleteMany({ where: { userId } });
        await tx.auditLog.deleteMany({ where: { userId } });
        
        // Finally delete the user
        await tx.user.delete({ where: { id: userId } });
      });

      // Log the deletion (in a separate system or anonymized log)
      console.log(`User data deleted: ${userId}, reason: ${reason}, timestamp: ${new Date().toISOString()}`);
    } catch (error) {
      console.error('Error deleting user data:', error);
      throw new Error('Failed to delete user data');
    }
  }

  /**
   * Anonymize user data while preserving business analytics
   */
  async anonymizeUserData(userId: string): Promise<void> {
    try {
      const anonymizedId = this.generateAnonymousId(userId);
      const anonymizedEmail = `anonymous_${anonymizedId}@deleted.local`;

      await prisma.user.update({
        where: { id: userId },
        data: {
          email: anonymizedEmail,
          name: 'Anonymous User',
          preferences: undefined,
          encryptionSettings: undefined,
          stripeCustomerId: null,
          lastLoginAt: null
        }
      });

      // Anonymize audit logs but keep them for security purposes
      await prisma.auditLog.updateMany({
        where: { userId },
        data: {
          data: JSON.stringify({ anonymized: true, originalUserId: anonymizedId })
        }
      });
    } catch (error) {
      console.error('Error anonymizing user data:', error);
      throw new Error('Failed to anonymize user data');
    }
  }

  /**
   * Record user consent
   */
  async recordConsent(
    userId: string,
    consentType: 'data_processing' | 'marketing' | 'analytics' | 'cookies',
    consentGiven: boolean,
    ipAddress: string
  ): Promise<void> {
    try {
      await prisma.dataConsent.create({
        data: {
          userId,
          consentType,
          consentGiven,
          ipAddress,
          timestamp: new Date()
        }
      });
    } catch (error) {
      console.error('Error recording consent:', error);
      throw new Error('Failed to record consent');
    }
  }

  /**
   * Get user consent status
   */
  async getUserConsent(userId: string): Promise<Record<string, boolean>> {
    try {
      const consents = await prisma.dataConsent.findMany({
        where: { userId },
        orderBy: { timestamp: 'desc' },
        distinct: ['consentType']
      });

      const consentMap: Record<string, boolean> = {};
      consents.forEach(consent => {
        consentMap[consent.consentType] = consent.consentGiven;
      });

      return consentMap;
    } catch (error) {
      console.error('Error getting user consent:', error);
      throw new Error('Failed to get user consent');
    }
  }

  /**
   * Report data breach
   */
  async reportDataBreach(
    description: string,
    affectedUsers: string[],
    dataTypes: string[],
    severity: 'low' | 'medium' | 'high' | 'critical'
  ): Promise<string> {
    try {
      const breach = await prisma.dataBreach.create({
        data: {
          description,
          affectedUsers,
          dataTypes,
          severity,
          discoveredAt: new Date(),
          mitigationSteps: []
        }
      });

      // Notify affected users (implement email notification)
      await this.notifyAffectedUsers(affectedUsers, breach.id);

      // If high or critical severity, notify authorities within 72 hours
      if (['high', 'critical'].includes(severity)) {
        await this.scheduleAuthorityNotification(breach.id);
      }

      return breach.id;
    } catch (error) {
      console.error('Error reporting data breach:', error);
      throw new Error('Failed to report data breach');
    }
  }

  /**
   * Generate data processing report
   */
  async generateDataProcessingReport(): Promise<{
    totalUsers: number;
    activeUsers: number;
    dataRetentionCompliance: boolean;
    consentCompliance: number;
    breachesLast12Months: number;
  }> {
    try {
      const totalUsers = await prisma.user.count();
      
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const activeUsers = await prisma.user.count({
        where: {
          lastLoginAt: {
            gte: thirtyDaysAgo
          }
        }
      });

      const usersWithConsent = await prisma.dataConsent.groupBy({
        by: ['userId'],
        where: {
          consentType: 'data_processing',
          consentGiven: true
        }
      }).then(results => results.length);

      const consentCompliance = totalUsers > 0 ? (usersWithConsent / totalUsers) * 100 : 100;

      const twelveMonthsAgo = new Date();
      twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

      const breachesLast12Months = await prisma.dataBreach.count({
        where: {
          discoveredAt: {
            gte: twelveMonthsAgo
          }
        }
      });

      return {
        totalUsers,
        activeUsers,
        dataRetentionCompliance: true, // Implement actual check
        consentCompliance: Math.round(consentCompliance),
        breachesLast12Months
      };
    } catch (error) {
      console.error('Error generating data processing report:', error);
      throw new Error('Failed to generate data processing report');
    }
  }

  private generateAnonymousId(userId: string): string {
    return createHash('sha256').update(userId + process.env.JWT_SECRET).digest('hex').substring(0, 16);
  }

  private async notifyAffectedUsers(userIds: string[], breachId: string): Promise<void> {
    // Implement email notification to affected users
    console.log(`Notifying ${userIds.length} users about data breach ${breachId}`);
  }

  private async scheduleAuthorityNotification(breachId: string): Promise<void> {
    // Implement notification to data protection authorities
    console.log(`Scheduling authority notification for breach ${breachId}`);
  }
}
