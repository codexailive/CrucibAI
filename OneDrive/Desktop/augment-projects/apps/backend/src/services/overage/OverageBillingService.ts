import { PrismaClient } from '@prisma/client';
import Stripe from 'stripe';

const prisma = new PrismaClient();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-08-16',
});

export class OverageBillingService {
  async processMonthlyOverageBilling() {
    const pendingCharges = await prisma.overageCharge.findMany({
      where: { status: 'pending' },
      include: { user: true }
    });

    for (const charge of pendingCharges) {
      try {
        // Create Stripe invoice item
        await stripe.invoiceItems.create({
          customer: charge.user.stripeCustomerId || 'cus_default',
          amount: Math.round(charge.amount * 100),
          currency: 'usd',
          description: `${charge.type} overage (${charge.units} units @ $${charge.rate})`
        });

        // Mark as billed
        await prisma.overageCharge.update({
          where: { id: charge.id },
          data: { status: 'billed' }
        });
      } catch (error) {
        console.error(`Failed to bill overage for user ${charge.userId}:`, error);
        
        // Mark as failed
        await prisma.overageCharge.update({
          where: { id: charge.id },
          data: { status: 'failed' }
        });
      }
    }
  }

  async getUserOverageCharges(userId: string) {
    return await prisma.overageCharge.findMany({
      where: { userId },
      orderBy: { billedAt: 'desc' }
    });
  }

  async getUserUsageAlerts(userId: string) {
    return await prisma.usageAlert.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });
  }
}
