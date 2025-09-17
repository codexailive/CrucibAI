import Stripe from 'stripe';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class StripeService {
  private stripe: Stripe | null = null;

  constructor() {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey || secretKey === 'sk_test_your_stripe_secret_key_here') {
      console.warn('Stripe secret key not configured, using mock responses');
    } else {
      this.stripe = new Stripe(secretKey, {
        apiVersion: '2023-08-16',
        typescript: true,
      });
    }
  }

  async createCustomer(email: string, name: string, metadata?: Record<string, string>): Promise<{
    id: string;
    email: string;
    name: string;
  }> {
    if (!this.stripe) {
      // Mock response when Stripe is not configured
      return {
        id: `cus_mock_${Date.now()}`,
        email,
        name
      };
    }

    try {
      const customer = await this.stripe.customers.create({
        email,
        name,
        metadata: metadata || {}
      });

      return {
        id: customer.id,
        email: customer.email || email,
        name: customer.name || name
      };
    } catch (error) {
      console.error('Stripe create customer error:', error);
      throw new Error(`Failed to create Stripe customer: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async createSubscription(customerId: string, priceId: string, options: {
    trialPeriodDays?: number;
    metadata?: Record<string, string>;
  } = {}): Promise<{
    id: string;
    status: string;
    currentPeriodStart: Date;
    currentPeriodEnd: Date;
    clientSecret?: string;
  }> {
    if (!this.stripe) {
      // Mock response when Stripe is not configured
      const now = new Date();
      const endDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days from now
      
      return {
        id: `sub_mock_${Date.now()}`,
        status: 'active',
        currentPeriodStart: now,
        currentPeriodEnd: endDate,
        clientSecret: `pi_mock_${Date.now()}_secret_mock`
      };
    }

    try {
      const subscription = await this.stripe.subscriptions.create({
        customer: customerId,
        items: [{ price: priceId }],
        trial_period_days: options.trialPeriodDays,
        metadata: options.metadata || {},
        payment_behavior: 'default_incomplete',
        payment_settings: { save_default_payment_method: 'on_subscription' },
        expand: ['latest_invoice.payment_intent'],
      });

      const invoice = subscription.latest_invoice as Stripe.Invoice;
      const paymentIntent = invoice?.payment_intent as Stripe.PaymentIntent;

      return {
        id: subscription.id,
        status: subscription.status,
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        clientSecret: paymentIntent?.client_secret || undefined
      };
    } catch (error) {
      console.error('Stripe create subscription error:', error);
      throw new Error(`Failed to create subscription: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async updateSubscription(subscriptionId: string, options: {
    priceId?: string;
    quantity?: number;
    metadata?: Record<string, string>;
  }): Promise<{
    id: string;
    status: string;
    currentPeriodStart: Date;
    currentPeriodEnd: Date;
  }> {
    if (!this.stripe) {
      // Mock response when Stripe is not configured
      const now = new Date();
      const endDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      
      return {
        id: subscriptionId,
        status: 'active',
        currentPeriodStart: now,
        currentPeriodEnd: endDate
      };
    }

    try {
      const updateData: Stripe.SubscriptionUpdateParams = {};
      
      if (options.priceId) {
        const subscription = await this.stripe.subscriptions.retrieve(subscriptionId);
        updateData.items = [{
          id: subscription.items.data[0].id,
          price: options.priceId,
          quantity: options.quantity || 1
        }];
      }

      if (options.metadata) {
        updateData.metadata = options.metadata;
      }

      const subscription = await this.stripe.subscriptions.update(subscriptionId, updateData);

      return {
        id: subscription.id,
        status: subscription.status,
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000)
      };
    } catch (error) {
      console.error('Stripe update subscription error:', error);
      throw new Error(`Failed to update subscription: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async cancelSubscription(subscriptionId: string, immediately: boolean = false): Promise<{
    id: string;
    status: string;
    canceledAt?: Date;
    cancelAtPeriodEnd: boolean;
  }> {
    if (!this.stripe) {
      // Mock response when Stripe is not configured
      return {
        id: subscriptionId,
        status: immediately ? 'canceled' : 'active',
        canceledAt: immediately ? new Date() : undefined,
        cancelAtPeriodEnd: !immediately
      };
    }

    try {
      const subscription = await this.stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: !immediately
      });

      if (immediately) {
        await this.stripe.subscriptions.cancel(subscriptionId);
      }

      return {
        id: subscription.id,
        status: subscription.status,
        canceledAt: subscription.canceled_at ? new Date(subscription.canceled_at * 1000) : undefined,
        cancelAtPeriodEnd: subscription.cancel_at_period_end
      };
    } catch (error) {
      console.error('Stripe cancel subscription error:', error);
      throw new Error(`Failed to cancel subscription: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async createPaymentIntent(amount: number, currency: string = 'usd', options: {
    customerId?: string;
    metadata?: Record<string, string>;
    description?: string;
  } = {}): Promise<{
    id: string;
    clientSecret: string;
    status: string;
  }> {
    if (!this.stripe) {
      // Mock response when Stripe is not configured
      return {
        id: `pi_mock_${Date.now()}`,
        clientSecret: `pi_mock_${Date.now()}_secret_mock`,
        status: 'requires_payment_method'
      };
    }

    try {
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency,
        customer: options.customerId,
        metadata: options.metadata || {},
        description: options.description,
        automatic_payment_methods: { enabled: true }
      });

      return {
        id: paymentIntent.id,
        clientSecret: paymentIntent.client_secret!,
        status: paymentIntent.status
      };
    } catch (error) {
      console.error('Stripe create payment intent error:', error);
      throw new Error(`Failed to create payment intent: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getCustomer(customerId: string): Promise<{
    id: string;
    email: string;
    name: string;
    subscriptions: Array<{
      id: string;
      status: string;
      currentPeriodStart: Date;
      currentPeriodEnd: Date;
    }>;
  } | null> {
    if (!this.stripe) {
      // Mock response when Stripe is not configured
      return {
        id: customerId,
        email: 'mock@example.com',
        name: 'Mock Customer',
        subscriptions: []
      };
    }

    try {
      const customer = await this.stripe.customers.retrieve(customerId, {
        expand: ['subscriptions']
      });

      if (customer.deleted) {
        return null;
      }

      const subscriptions = (customer as Stripe.Customer).subscriptions?.data.map(sub => ({
        id: sub.id,
        status: sub.status,
        currentPeriodStart: new Date(sub.current_period_start * 1000),
        currentPeriodEnd: new Date(sub.current_period_end * 1000)
      })) || [];

      return {
        id: customer.id,
        email: (customer as Stripe.Customer).email || '',
        name: (customer as Stripe.Customer).name || '',
        subscriptions
      };
    } catch (error) {
      console.error('Stripe get customer error:', error);
      return null;
    }
  }

  async handleWebhook(payload: string, signature: string): Promise<{
    type: string;
    data: any;
  } | null> {
    if (!this.stripe) {
      console.warn('Stripe webhook received but Stripe is not configured');
      return null;
    }

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error('Stripe webhook secret not configured');
      return null;
    }

    try {
      const event = this.stripe.webhooks.constructEvent(payload, signature, webhookSecret);
      
      return {
        type: event.type,
        data: event.data.object
      };
    } catch (error) {
      console.error('Stripe webhook error:', error);
      return null;
    }
  }

  // Check if the service is properly configured
  isConfigured(): boolean {
    return !!this.stripe;
  }
}

export default new StripeService();
