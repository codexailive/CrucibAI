import { Router, Request, Response } from 'express';
import stripeService from '../services/integrations/StripeService';

const router = Router();

// Stripe webhook endpoint
router.post('/stripe', async (req: Request, res: Response) => {
  try {
    const signature = req.headers['stripe-signature'] as string;
    
    if (!signature) {
      return res.status(400).json({ error: 'Missing stripe-signature header' });
    }

    // Get raw body for webhook verification
    const payload = JSON.stringify(req.body);
    
    // Handle the webhook using StripeService
    const event = await stripeService.handleWebhook(payload, signature);
    
    if (!event) {
      return res.status(400).json({ error: 'Invalid webhook payload' });
    }

    // Process different webhook event types
    switch (event.type) {
      case 'customer.subscription.created':
        console.log('Subscription created:', event.data);
        // Handle subscription creation
        break;
        
      case 'customer.subscription.updated':
        console.log('Subscription updated:', event.data);
        // Handle subscription updates
        break;
        
      case 'customer.subscription.deleted':
        console.log('Subscription deleted:', event.data);
        // Handle subscription cancellation
        break;
        
      case 'invoice.payment_succeeded':
        console.log('Payment succeeded:', event.data);
        // Handle successful payment
        break;
        
      case 'invoice.payment_failed':
        console.log('Payment failed:', event.data);
        // Handle failed payment
        break;
        
      default:
        console.log('Unhandled webhook event type:', event.type);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Stripe webhook error:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Webhook processing failed' 
    });
  }
});

export default router;
