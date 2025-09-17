import { PrismaClient } from '@prisma/client';
import Stripe from 'stripe';
import { getDeploymentPrice } from '../../config/pricing';

const prisma = new PrismaClient();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-08-16',
});

export class DeploymentPurchaseService {
  async purchaseAdditionalDeployments(userId: string, tier: string, quantity: number) {
    // Calculate price based on tier using the new pricing configuration
    const pricePerDeployment = getDeploymentPrice(tier);
    const totalPrice = pricePerDeployment * quantity;
    
    // Create Stripe payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(totalPrice * 100), // Convert to cents
      currency: 'usd',
      metadata: {
        userId,
        tier,
        quantity: quantity.toString(),
        type: 'deployment_purchase',
        pricePerDeployment: pricePerDeployment.toString()
      }
    });

    // Create purchase record
    await prisma.deploymentPurchase.create({
      data: {
        userId,
        tier,
        quantity,
        price: totalPrice,
        status: 'pending',
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year
      }
    });

    const price = getDeploymentPrice(tier);
    return { clientSecret: paymentIntent.client_secret, price };
  }

  async confirmPurchase(userId: string, paymentIntentId: string) {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    
    if (paymentIntent.status === 'succeeded') {
      await prisma.deploymentPurchase.updateMany({
        where: {
          userId,
          status: 'pending'
        },
        data: {
          status: 'active'
        }
      });
      
      return { success: true };
    }
    
    return { success: false };
  }

  async getUserDeployments(userId: string) {
    const purchases = await prisma.deploymentPurchase.findMany({
      where: { userId, status: 'active' },
      // include: { activeDeployments: true } // Commented out - relation doesn't exist
    });

    return purchases;
  }
}
