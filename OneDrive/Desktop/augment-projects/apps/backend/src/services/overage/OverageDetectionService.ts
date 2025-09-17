import { PrismaClient } from '@prisma/client';
import { AdvancedCreditsService } from '../credits/AdvancedCreditsService';
import { OVERAGE_RATES, getTierLimits, calculateOverage } from '../../config/pricing';

const prisma = new PrismaClient();

export class OverageDetectionService {
  private creditsService = new AdvancedCreditsService();

  async checkAllUsersForOverages() {
    const users = await prisma.user.findMany({
      include: { subscription: true }
    });

    for (const user of users) {
      if (!user.subscription) continue;
      
      // Check AI calls
      await this.checkUsageAgainstLimit(user, 'ai_calls');
      
      // Check quantum usage
      await this.checkUsageAgainstLimit(user, 'quantum');
      
      // Check storage
      await this.checkUsageAgainstLimit(user, 'storage');
    }
  }

  private async checkUsageAgainstLimit(user: any, type: string) {
    // Get tier limits from the new pricing configuration
    const tierLimits = getTierLimits(user.subscription.tier);

    let limit: number;
    let rate: number;

    switch (type) {
      case 'ai_calls':
        limit = tierLimits.aiCalls;
        rate = OVERAGE_RATES.aiCallsPerCall;
        break;
      case 'quantum':
        limit = tierLimits.quantumSimulations;
        rate = OVERAGE_RATES.quantumPerSimulation;
        break;
      case 'ar_vr':
        limit = tierLimits.arVrMinutes;
        rate = OVERAGE_RATES.arVrPerMinute;
        break;
      case 'storage':
        limit = tierLimits.storageGB;
        rate = OVERAGE_RATES.storagePerGBPerMonth;
        break;
      default:
        return; // Unknown type
    }

    // Get current usage for the user
    const currentUsage = await this.creditsService.getCurrentUsage(user.id, type);
    const usagePercentage = currentUsage.current / limit;

    // Create alerts at thresholds
    if (usagePercentage >= 0.8 && usagePercentage < 0.9) {
      await this.createAlert(user.id, type, 0.8, `You've used 80% of your ${type} limit`);
    } else if (usagePercentage >= 0.9 && usagePercentage < 1.0) {
      await this.createAlert(user.id, type, 0.9, `You've used 90% of your ${type} limit`);
    } else if (usagePercentage >= 1.0) {
      await this.createAlert(user.id, type, 1.0, `You've exceeded your ${type} limit`);
      
      // Create overage charge using the new pricing structure
      const { overage, cost } = calculateOverage(currentUsage.current, limit, rate);

      if (overage > 0) {
        await this.createOverageCharge(user.id, type, cost, overage, rate);
      }
    }
  }

  private async createAlert(userId: string, type: string, threshold: number, message: string) {
    // Check if alert already exists for this threshold
    const existingAlert = await prisma.usageAlert.findFirst({
      where: {
        userId,
        type,
        threshold,
        read: false
      }
    });

    if (!existingAlert) {
      await prisma.usageAlert.create({
        data: {
          userId,
          type,
          threshold,
          message
        }
      });

      // Send notification (email, in-app, etc.)
      await this.sendNotification(userId, message);
    }
  }

  private async createOverageCharge(userId: string, type: string, amount: number, units: number, rate: number) {
    await prisma.overageCharge.create({
      data: {
        userId,
        type,
        amount,
        units,
        rate,
        status: 'pending'
      }
    });

    // Process payment with Stripe
    await this.processOveragePayment(userId, amount);
  }



  private async sendNotification(userId: string, message: string) {
    // Implementation for email/in-app notification
    console.log(`Notification to ${userId}: ${message}`);
  }

  private async processOveragePayment(userId: string, amount: number) {
    // Implementation for Stripe payment processing
    console.log(`Processing overage payment of $${amount} for user ${userId}`);
  }
}
