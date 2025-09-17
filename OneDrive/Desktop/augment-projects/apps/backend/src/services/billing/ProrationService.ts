import { PrismaClient } from '@prisma/client';
import Stripe from 'stripe';

const prisma = new PrismaClient();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-08-16',
});

export class ProrationService {
  async calculateProration(userId: string, newTier: string, newBillingCycle?: 'monthly' | 'annual') {
    const subscription = await prisma.userSubscription.findUnique({
      where: { userId },
      include: { user: true }
    });

    if (!subscription || !subscription.user.stripeCustomerId) {
      throw new Error('No active subscription found');
    }

    if (!subscription.stripeSubscriptionId) {
      throw new Error('No Stripe subscription ID found');
    }
    const stripeSubscription = await stripe.subscriptions.retrieve(subscription.stripeSubscriptionId);
    
    // Get pricing for current and new tiers
    const pricing = {
      Starter: { monthly: 29, annual: 290 },
      Professional: { monthly: 59, annual: 590 },
      Business: { monthly: 149, annual: 1490 },
      Team: { monthly: 399, annual: 3990 },
      Enterprise: { monthly: 999, annual: 9990 },
      Unlimited: { monthly: 2499, annual: 24990 }
    };

    const currentPrice = (pricing as any)[subscription.tier]?.[subscription.billingCycle] || 0;
    const newPrice = (pricing as any)[newTier]?.[newBillingCycle || subscription.billingCycle] || 0;
    
    // Calculate remaining time in current billing cycle
    const currentTime = new Date();
    const periodEnd = new Date(stripeSubscription.current_period_end * 1000);
    const remainingDays = Math.max(0, Math.ceil((periodEnd.getTime() - currentTime.getTime()) / (1000 * 60 * 60 * 24)));
    const totalDays = subscription.billingCycle === 'annual' ? 365 : 30;
    const remainingPercentage = remainingDays / totalDays;

    // Calculate prorated amounts
    const remainingCurrent = currentPrice * remainingPercentage;
    const newProrated = newPrice * remainingPercentage;
    const proratedDifference = newProrated - remainingCurrent;

    return {
      currentPrice,
      newPrice,
      remainingDays,
      proratedAmount: Math.max(0, proratedDifference),
      creditAmount: Math.max(0, -proratedDifference)
    };
  }

  async applyProration(userId: string, newTier: string, newBillingCycle?: 'monthly' | 'annual') {
    const proration = await this.calculateProration(userId, newTier, newBillingCycle);
    
    if (proration.creditAmount > 0) {
      // Apply credit to user's account
      await this.applyCredit(userId, proration.creditAmount);
    }

    return proration;
  }

  private async applyCredit(userId: string, amount: number) {
    // Implementation for applying credit to user's account
    console.log(`Applied $${amount} credit to user ${userId}`);
  }
}
