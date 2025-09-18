import { PrismaClient } from '@prisma/client';
import { Request, Response } from 'express';

const prisma = new PrismaClient();

// Stripe webhook signature verification (mock for now)
const verifyStripeSignature = (payload: string, signature: string): boolean => {
  // In production, use actual Stripe signature verification
  // const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
  // return stripe.webhooks.constructEvent(payload, signature, process.env.STRIPE_WEBHOOK_SECRET);
  return true; // Mock verification
};

export async function stripeWebhook(req: Request, res: Response): Promise<void> {
  try {
    const signature = req.headers['stripe-signature'] as string;
    const payload = JSON.stringify(req.body);

    // Verify webhook signature
    if (!verifyStripeSignature(payload, signature)) {
      res.status(400).json({ error: 'Invalid signature' });
      return;
    }

    const event = req.body;

    // Log the webhook event
    await prisma.auditLogEntry.create({
      data: {
        eventId: `stripe_webhook_${event.id || Date.now()}`,
        action: 'stripe_webhook_received',
        userId: 'system',
        data: JSON.stringify({
          type: event.type,
          eventId: event.id,
          created: event.created
        })
      }
    });

    // Handle different event types
    switch (event.type) {
      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object);
        break;

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object);
        break;

      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object);
        break;

      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object);
        break;

      case 'customer.created':
        await handleCustomerCreated(event.data.object);
        break;

      case 'customer.updated':
        await handleCustomerUpdated(event.data.object);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.status(200).json({ received: true });
  } catch (error) {
    console.error('Stripe webhook error:', error);
    res.status(500).json({ 
      error: 'Webhook processing failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

async function handleSubscriptionCreated(subscription: any): Promise<void> {
  try {
    const customerId = subscription.customer;
    const subscriptionId = subscription.id;
    const priceId = subscription.items.data[0]?.price?.id;
    
    // Find user by Stripe customer ID
    const user = await prisma.user.findFirst({
      where: { stripeCustomerId: customerId }
    });

    if (!user) {
      console.error(`User not found for Stripe customer: ${customerId}`);
      return;
    }

    // Map Stripe price ID to our tier
    const tierMapping: { [key: string]: string } = {
      'price_discovery': 'Discovery',
      'price_starter': 'Starter',
      'price_professional': 'Professional',
      'price_team': 'Team',
      'price_enterprise': 'Enterprise',
      'price_scale': 'Scale',
      'price_unlimited': 'Unlimited'
    };

    const tier = tierMapping[priceId] || 'Discovery';

    // Create or update subscription
    await prisma.userSubscription.upsert({
      where: { userId: user.id },
      update: {
        tier,
        stripeSubscriptionId: subscriptionId,
        status: subscription.status,
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        updatedAt: new Date()
      },
      create: {
        userId: user.id,
        tier,
        stripeSubscriptionId: subscriptionId,
        status: subscription.status,
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        nextBillingDate: new Date(subscription.current_period_end * 1000)
      }
    });

    console.log(`Subscription created for user ${user.id}: ${tier}`);
  } catch (error) {
    console.error('Error handling subscription created:', error);
  }
}

async function handleSubscriptionUpdated(subscription: any): Promise<void> {
  try {
    const subscriptionId = subscription.id;
    
    // Update subscription
    await prisma.userSubscription.updateMany({
      where: { stripeSubscriptionId: subscriptionId },
      data: {
        status: subscription.status,
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        updatedAt: new Date()
      }
    });

    console.log(`Subscription updated: ${subscriptionId}`);
  } catch (error) {
    console.error('Error handling subscription updated:', error);
  }
}

async function handleSubscriptionDeleted(subscription: any): Promise<void> {
  try {
    const subscriptionId = subscription.id;
    
    // Update subscription status
    await prisma.userSubscription.updateMany({
      where: { stripeSubscriptionId: subscriptionId },
      data: {
        status: 'canceled',
        updatedAt: new Date()
      }
    });

    console.log(`Subscription deleted: ${subscriptionId}`);
  } catch (error) {
    console.error('Error handling subscription deleted:', error);
  }
}

async function handlePaymentSucceeded(invoice: any): Promise<void> {
  try {
    const customerId = invoice.customer;
    const subscriptionId = invoice.subscription;
    const amountPaid = invoice.amount_paid / 100; // Convert from cents

    // Log successful payment
    await prisma.auditLogEntry.create({
      data: {
        eventId: `payment_success_${invoice.id}`,
        action: 'payment_succeeded',
        userId: 'system',
        data: JSON.stringify({
          customerId,
          subscriptionId,
          amount: amountPaid,
          currency: invoice.currency,
          invoiceId: invoice.id
        })
      }
    });

    console.log(`Payment succeeded: $${amountPaid} for customer ${customerId}`);
  } catch (error) {
    console.error('Error handling payment succeeded:', error);
  }
}

async function handlePaymentFailed(invoice: any): Promise<void> {
  try {
    const customerId = invoice.customer;
    const subscriptionId = invoice.subscription;
    const amountDue = invoice.amount_due / 100; // Convert from cents

    // Log failed payment
    await prisma.auditLogEntry.create({
      data: {
        eventId: `payment_failed_${invoice.id}`,
        action: 'payment_failed',
        userId: 'system',
        data: JSON.stringify({
          customerId,
          subscriptionId,
          amount: amountDue,
          currency: invoice.currency,
          invoiceId: invoice.id,
          attemptCount: invoice.attempt_count
        })
      }
    });

    // TODO: Send notification to user about failed payment
    // TODO: Implement retry logic or subscription suspension

    console.log(`Payment failed: $${amountDue} for customer ${customerId}`);
  } catch (error) {
    console.error('Error handling payment failed:', error);
  }
}

async function handleCustomerCreated(customer: any): Promise<void> {
  try {
    const customerId = customer.id;
    const email = customer.email;

    // Find user by email and update with Stripe customer ID
    if (email) {
      await prisma.user.updateMany({
        where: { email },
        data: { stripeCustomerId: customerId }
      });

      console.log(`Customer created: ${customerId} for email ${email}`);
    }
  } catch (error) {
    console.error('Error handling customer created:', error);
  }
}

async function handleCustomerUpdated(customer: any): Promise<void> {
  try {
    const customerId = customer.id;
    
    // Log customer update
    await prisma.auditLogEntry.create({
      data: {
        eventId: `customer_updated_${customerId}`,
        action: 'customer_updated',
        userId: 'system',
        data: JSON.stringify({
          customerId,
          email: customer.email,
          name: customer.name
        })
      }
    });

    console.log(`Customer updated: ${customerId}`);
  } catch (error) {
    console.error('Error handling customer updated:', error);
  }
}
