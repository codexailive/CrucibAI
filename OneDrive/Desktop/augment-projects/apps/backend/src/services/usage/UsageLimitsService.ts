import { PrismaClient } from '@prisma/client';
import { getTierLimits, isUnlimitedTeamSize } from '../../config/pricing';

const prisma = new PrismaClient();

export interface UsageCheck {
  allowed: boolean;
  reason?: string;
  currentUsage: number;
  limit: number;
  remaining: number;
}

export class UsageLimitsService {
  
  /**
   * Check if user can make an AI call
   */
  async canMakeAiCall(userId: string): Promise<UsageCheck> {
    const user = await this.getUserWithSubscription(userId);
    const limits = getTierLimits(user.subscription?.tier || 'Discovery');
    const currentUsage = await this.getCurrentAiCallUsage(userId);
    
    const remaining = Math.max(0, limits.aiCalls - currentUsage);
    const allowed = currentUsage < limits.aiCalls;
    
    return {
      allowed,
      reason: allowed ? undefined : `AI call limit exceeded. Upgrade your plan or wait for next billing cycle.`,
      currentUsage,
      limit: limits.aiCalls,
      remaining
    };
  }

  /**
   * Check if user can run a quantum simulation
   */
  async canRunQuantumSimulation(userId: string): Promise<UsageCheck> {
    const user = await this.getUserWithSubscription(userId);
    const limits = getTierLimits(user.subscription?.tier || 'Discovery');
    const currentUsage = await this.getCurrentQuantumUsage(userId);
    
    const remaining = Math.max(0, limits.quantumSimulations - currentUsage);
    const allowed = currentUsage < limits.quantumSimulations;
    
    return {
      allowed,
      reason: allowed ? undefined : `Quantum simulation limit exceeded. Upgrade your plan or wait for next billing cycle.`,
      currentUsage,
      limit: limits.quantumSimulations,
      remaining
    };
  }

  /**
   * Check if user can use AR/VR for specified minutes
   */
  async canUseArVr(userId: string, requestedMinutes: number = 1): Promise<UsageCheck> {
    const user = await this.getUserWithSubscription(userId);
    const limits = getTierLimits(user.subscription?.tier || 'Discovery');
    const currentUsage = await this.getCurrentArVrUsage(userId);
    
    const remaining = Math.max(0, limits.arVrMinutes - currentUsage);
    const allowed = (currentUsage + requestedMinutes) <= limits.arVrMinutes;
    
    return {
      allowed,
      reason: allowed ? undefined : `AR/VR time limit exceeded. You need ${requestedMinutes} minutes but only have ${remaining} remaining.`,
      currentUsage,
      limit: limits.arVrMinutes,
      remaining
    };
  }

  /**
   * Check if user can create a new deployment
   */
  async canCreateDeployment(userId: string): Promise<UsageCheck> {
    const user = await this.getUserWithSubscription(userId);
    const limits = getTierLimits(user.subscription?.tier || 'Discovery');
    const currentUsage = await this.getCurrentDeploymentCount(userId);
    
    const remaining = Math.max(0, limits.deployments - currentUsage);
    const allowed = currentUsage < limits.deployments;
    
    return {
      allowed,
      reason: allowed ? undefined : `Deployment limit exceeded. You have ${currentUsage}/${limits.deployments} deployments. Upgrade your plan or purchase additional deployments.`,
      currentUsage,
      limit: limits.deployments,
      remaining
    };
  }

  /**
   * Check if user can store additional data
   */
  async canStoreData(userId: string, additionalGB: number = 0): Promise<UsageCheck> {
    const user = await this.getUserWithSubscription(userId);
    const limits = getTierLimits(user.subscription?.tier || 'Discovery');
    const currentUsage = await this.getCurrentStorageUsage(userId);
    
    const remaining = Math.max(0, limits.storageGB - currentUsage);
    const allowed = (currentUsage + additionalGB) <= limits.storageGB;
    
    return {
      allowed,
      reason: allowed ? undefined : `Storage limit exceeded. You need ${additionalGB}GB but only have ${remaining}GB remaining.`,
      currentUsage,
      limit: limits.storageGB,
      remaining
    };
  }

  /**
   * Check if user can add team members
   */
  async canAddTeamMember(userId: string): Promise<UsageCheck> {
    const user = await this.getUserWithSubscription(userId);
    const limits = getTierLimits(user.subscription?.tier || 'Discovery');
    const currentUsage = await this.getCurrentTeamSize(userId);
    
    // Check if unlimited team size
    if (isUnlimitedTeamSize(user.subscription?.tier || 'Discovery')) {
      return {
        allowed: true,
        currentUsage,
        limit: -1, // Unlimited
        remaining: -1
      };
    }
    
    const remaining = Math.max(0, limits.teamSize - currentUsage);
    const allowed = currentUsage < limits.teamSize;
    
    return {
      allowed,
      reason: allowed ? undefined : `Team size limit exceeded. You have ${currentUsage}/${limits.teamSize} team members. Upgrade your plan to add more members.`,
      currentUsage,
      limit: limits.teamSize,
      remaining
    };
  }

  /**
   * Get comprehensive usage summary for a user
   */
  async getUsageSummary(userId: string) {
    const user = await this.getUserWithSubscription(userId);
    const limits = getTierLimits(user.subscription?.tier || 'Discovery');
    
    const [aiCalls, quantum, arVr, deployments, storage, teamSize] = await Promise.all([
      this.getCurrentAiCallUsage(userId),
      this.getCurrentQuantumUsage(userId),
      this.getCurrentArVrUsage(userId),
      this.getCurrentDeploymentCount(userId),
      this.getCurrentStorageUsage(userId),
      this.getCurrentTeamSize(userId)
    ]);

    return {
      tier: user.subscription?.tier || 'Discovery',
      limits,
      usage: {
        aiCalls: { current: aiCalls, limit: limits.aiCalls, percentage: (aiCalls / limits.aiCalls) * 100 },
        quantum: { current: quantum, limit: limits.quantumSimulations, percentage: (quantum / limits.quantumSimulations) * 100 },
        arVr: { current: arVr, limit: limits.arVrMinutes, percentage: (arVr / limits.arVrMinutes) * 100 },
        deployments: { current: deployments, limit: limits.deployments, percentage: (deployments / limits.deployments) * 100 },
        storage: { current: storage, limit: limits.storageGB, percentage: (storage / limits.storageGB) * 100 },
        teamSize: { 
          current: teamSize, 
          limit: limits.teamSize, 
          percentage: limits.teamSize === -1 ? 0 : (teamSize / limits.teamSize) * 100,
          unlimited: limits.teamSize === -1
        }
      }
    };
  }

  // Private helper methods
  private async getUserWithSubscription(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { subscription: true }
    });
    
    if (!user) {
      throw new Error('User not found');
    }
    
    return user;
  }

  private async getCurrentAiCallUsage(userId: string): Promise<number> {
    // This would typically query a usage tracking table
    // For now, return a mock value
    return 0;
  }

  private async getCurrentQuantumUsage(userId: string): Promise<number> {
    // This would typically query quantum job history
    return 0;
  }

  private async getCurrentArVrUsage(userId: string): Promise<number> {
    // This would typically query AR/VR session history
    return 0;
  }

  private async getCurrentDeploymentCount(userId: string): Promise<number> {
    try {
      return await prisma.activeDeployment.count({
        where: { userId, status: 'active' }
      });
    } catch {
      return 0;
    }
  }

  private async getCurrentStorageUsage(userId: string): Promise<number> {
    // This would typically calculate storage usage across all user data
    return 0;
  }

  private async getCurrentTeamSize(userId: string): Promise<number> {
    // This would typically count team members
    return 1; // At least the user themselves
  }
}
