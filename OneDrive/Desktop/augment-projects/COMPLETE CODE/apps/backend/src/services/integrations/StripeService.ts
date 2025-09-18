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
        apiVersion: '2025-08-27.basil',
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
