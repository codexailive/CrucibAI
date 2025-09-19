import { PrismaClient } from '@prisma/client';
import { Router } from 'express';
import { StripeService } from '../services/billing/StripeService';

const router = Router();
const prisma = new PrismaClient();
const stripeService = new StripeService();

// Get user's subscription
router.get('/subscription', async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const subscription = await prisma.userSubscription.findUnique({
      where: { userId: req.user.id }
    });

    res.json(subscription);
  } catch (error) {
    console.error('Error getting subscription:', error);
    res.status(500).json({ error: 'Failed to get subscription' });
  }
});

// Get available subscription plans
router.get('/plans', async (req, res) => {
  try {
    const plans = await prisma.subscription.findMany({
      where: { isActive: true },
      orderBy: { amount: 'asc' }
    });

    res.json(plans);
  } catch (error) {
    console.error('Error getting plans:', error);
    res.status(500).json({ error: 'Failed to get plans' });
  }
});

// Create subscription
router.post('/subscription', async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { priceId, paymentMethodId } = req.body;

    // Get or create Stripe customer
    const user = await prisma.user.findUnique({
      where: { id: req.user.id }
    });

    let customerId = user?.stripeCustomerId;
    if (!customerId) {
      const customer = await stripeService.createCustomer(user?.email || '', user?.name || '');
      customerId = customer.id;

      // Update user with Stripe customer ID
      await prisma.user.update({
        where: { id: req.user.id },
        data: { stripeCustomerId: customerId }
      });
    }

    const subscription = await stripeService.createSubscription(
      customerId,
      priceId
    );

    res.json(subscription);
  } catch (error) {
    console.error('Error creating subscription:', error);
    res.status(500).json({ error: 'Failed to create subscription' });
  }
});

// Update subscription
router.put('/subscription', async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { subscriptionId, priceId } = req.body;

    const subscription = await stripeService.updateSubscription(
      subscriptionId,
      priceId
    );

    res.json(subscription);
  } catch (error) {
    console.error('Error updating subscription:', error);
    res.status(500).json({ error: 'Failed to update subscription' });
  }
});

// Cancel subscription
router.delete('/subscription', async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { subscriptionId } = req.body;

    const subscription = await stripeService.cancelSubscription(subscriptionId);

    res.json(subscription);
  } catch (error) {
    console.error('Error cancelling subscription:', error);
    res.status(500).json({ error: 'Failed to cancel subscription' });
  }
});

// Get payment methods
router.get('/payment-methods', async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // In a real implementation, you would get payment methods from Stripe
    res.json([]);
  } catch (error) {
    console.error('Error getting payment methods:', error);
    res.status(500).json({ error: 'Failed to get payment methods' });
  }
});

// Get invoices
router.get('/invoices', async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const invoices = await prisma.invoice.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' }
    });

    res.json(invoices);
  } catch (error) {
    console.error('Error getting invoices:', error);
    res.status(500).json({ error: 'Failed to get invoices' });
  }
});

// Get usage tracking
router.get('/usage', async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { startDate, endDate } = req.query;

    const whereClause: any = {
      userId: req.user.id
    };

    if (startDate && endDate) {
      whereClause.timestamp = {
        gte: new Date(startDate as string),
        lte: new Date(endDate as string)
      };
    }

    const usage = await prisma.usageTracking.findMany({
      where: whereClause,
      orderBy: { timestamp: 'desc' },
      take: 100
    });

    // Group by provider and type
    const groupedUsage = usage.reduce((acc, item) => {
      const key = `${item.provider}-${item.type}`;
      if (!acc[key]) {
        acc[key] = {
          provider: item.provider,
          type: item.type,
          totalAmount: 0,
          totalCost: 0,
          count: 0
        };
      }
      acc[key].totalAmount += item.amount;
      acc[key].totalCost += item.cost;
      acc[key].count += 1;
      return acc;
    }, {} as any);

    res.json({
      usage: Object.values(groupedUsage),
      rawUsage: usage
    });
  } catch (error) {
    console.error('Error getting usage:', error);
    res.status(500).json({ error: 'Failed to get usage' });
  }
});

// Create payment intent for one-time payment
router.post('/payment-intent', async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { amount, currency = 'usd' } = req.body;

    const paymentIntent = await stripeService.createPaymentIntent(
      amount,
      currency
    );

    res.json({
      clientSecret: paymentIntent.client_secret
    });
  } catch (error) {
    console.error('Error creating payment intent:', error);
    res.status(500).json({ error: 'Failed to create payment intent' });
  }
});

export default router;
