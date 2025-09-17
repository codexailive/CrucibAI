import { PrismaClient } from '@prisma/client';
import Stripe from 'stripe';
import {
  getTierPrice,
  getAllTierNames,
  ANNUAL_DISCOUNT_PERCENTAGE
} from '../../config/pricing';

const prisma = new PrismaClient();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-08-16',
});

export class SubscriptionService {
  async createSubscription(userId: string, tier: string, billingCycle: 'monthly' | 'annual' = 'monthly') {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { subscription: true }
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Validate tier
    const validTiers = getAllTierNames();
    if (!validTiers.includes(tier)) {
      throw new Error(`Invalid tier. Valid tiers: ${validTiers.join(', ')}`);
    }

    // Get pricing for the tier
    const price = getTierPrice(tier, billingCycle);
    const annualDiscount = billingCycle === 'annual' ? ANNUAL_DISCOUNT_PERCENTAGE : 0;

    // Free tier doesn't need Stripe subscription
    if (tier === 'Discovery') {
      const subscriptionData = {
        userId,
        tier,
        status: 'active',
        billingCycle,
        nextBillingDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
        annualDiscount,
        autoRenew: false,
        stripeSubscriptionId: null
      };

      if (user.subscription) {
        await prisma.userSubscription.update({
          where: { id: user.subscription.id },
          data: subscriptionData
        });
      } else {
        await prisma.userSubscription.create({
          data: subscriptionData
        });
      }

      return { subscriptionId: null, clientSecret: null };
    }
    const nextBillingDate = new Date();
    nextBillingDate.setMonth(nextBillingDate.getMonth() + (billingCycle === 'annual' ? 12 : 1));

    // Create or update Stripe subscription
    let stripeSubscription;
    if (user.stripeCustomerId) {
      // Update existing subscription
      const subscriptions = await stripe.subscriptions.list({
        customer: user.stripeCustomerId,
        status: 'active'
      });

      if (subscriptions.data.length > 0) {
        // Cancel existing subscription
        await stripe.subscriptions.update(subscriptions.data[0].id, {
          cancel_at_period_end: true
        });
      }
    }

    // Create new subscription
    const product = await stripe.products.create({
      name: `CrucibleAI ${tier} - ${billingCycle}`,
      metadata: { tier, billingCycle }
    });

    const stripePrice = await stripe.prices.create({
      product: product.id,
      unit_amount: Math.round(price * 100),
      currency: 'usd',
      recurring: {
        interval: billingCycle === 'annual' ? 'year' : 'month'
      }
    });

    if (!user.stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { userId }
      });

      await prisma.user.update({
        where: { id: userId },
        data: { stripeCustomerId: customer.id }
      });

      user.stripeCustomerId = customer.id;
    }

    stripeSubscription = await stripe.subscriptions.create({
      customer: user.stripeCustomerId,
      items: [{ price: stripePrice.id }],
      payment_behavior: 'default_incomplete',
      expand: ['latest_invoice.payment_intent']
    });

    // Update or create subscription record
    const subscriptionData = {
      userId,
      tier,
      status: 'active',
      billingCycle,
      nextBillingDate,
      annualDiscount,
      autoRenew: true,
      stripeSubscriptionId: stripeSubscription.id
    };

    if (user.subscription) {
      await prisma.userSubscription.update({
        where: { id: user.subscription.id },
        data: subscriptionData
      });
    } else {
      await prisma.userSubscription.create({
        data: subscriptionData
      });
    }

    return {
      subscriptionId: stripeSubscription.id,
      clientSecret: (stripeSubscription.latest_invoice as any).payment_intent.client_secret
    };
  }

  async updateSubscription(userId: string, newTier: string, newBillingCycle?: 'monthly' | 'annual') {
    const subscription = await prisma.userSubscription.findUnique({
      where: { userId },
      include: { user: true }
    });

    if (!subscription || !subscription.user.stripeCustomerId) {
      throw new Error('No active subscription found');
    }

    // Cancel current subscription and create new one
    if (!subscription.stripeSubscriptionId) {
      throw new Error('No Stripe subscription ID found');
    }
    await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
      cancel_at_period_end: true
    });

    return await this.createSubscription(userId, newTier, (newBillingCycle || subscription.billingCycle) as 'monthly' | 'annual');
  }

  async cancelSubscription(userId: string) {
    const subscription = await prisma.userSubscription.findUnique({
      where: { userId }
    });

    if (!subscription) {
      throw new Error('No subscription found');
    }

    // Cancel in Stripe
    if (!subscription.stripeSubscriptionId) {
      throw new Error('No Stripe subscription ID found');
    }
    await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
      cancel_at_period_end: true
    });

    // Update in database
    await prisma.userSubscription.update({
      where: { id: subscription.id },
      data: {
        autoRenew: false,
        status: 'canceling'
      }
    });

    return { success: true };
  }

  async processRenewals() {
    const expiringSubscriptions = await prisma.userSubscription.findMany({
      where: {
        autoRenew: true,
        status: 'active',
        nextBillingDate: {
          lte: new Date(new Date().setDate(new Date().getDate() + 7)) // Within 7 days
        },
        renewalReminderSent: false
      }
    });

    for (const subscription of expiringSubscriptions) {
      // Send renewal reminder
      await this.sendRenewalReminder(subscription.userId, subscription.nextBillingDate);
      
      await prisma.userSubscription.update({
        where: { id: subscription.id },
        data: { renewalReminderSent: true }
      });
    }

    const dueSubscriptions = await prisma.userSubscription.findMany({
      where: {
        autoRenew: true,
        status: 'active',
        nextBillingDate: {
          lte: new Date()
        }
      }
    });

    for (const subscription of dueSubscriptions) {
      try {
        // Process renewal with Stripe
        if (!subscription.stripeSubscriptionId) {
          continue;
        }
        const stripeSubscription = await stripe.subscriptions.retrieve(subscription.stripeSubscriptionId);
        
        if (stripeSubscription.status === 'active') {
          // Update next billing date
          const nextDate = new Date();
          nextDate.setMonth(nextDate.getMonth() + (subscription.billingCycle === 'annual' ? 12 : 1));
          
          await prisma.userSubscription.update({
            where: { id: subscription.id },
            data: {
              nextBillingDate: nextDate,
              renewalReminderSent: false
            }
          });
        } else {
          // Handle failed renewal
          await prisma.userSubscription.update({
            where: { id: subscription.id },
            data: { status: 'payment_failed' }
          });
          
          await this.sendPaymentFailedNotification(subscription.userId);
        }
      } catch (error) {
        console.error(`Failed to renew subscription for user ${subscription.userId}:`, error);
      }
    }
  }

  private async sendRenewalReminder(userId: string, renewalDate: Date) {
    // Implementation for email notification
    console.log(`Renewal reminder sent to user ${userId} for ${renewalDate}`);
  }

  private async sendPaymentFailedNotification(userId: string) {
    // Implementation for payment failure notification
    console.log(`Payment failed notification sent to user ${userId}`);
  }
}
