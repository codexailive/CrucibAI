import { Router, Request, Response } from 'express';
import { 
  PRICING_TIERS, 
  OVERAGE_RATES, 
  DEPLOYMENT_PRICING,
  getTierPrice,
  getTierLimits,
  getAllTierNames,
  calculateOverage,
  getDeploymentPrice
} from '../config/pricing';
import { SubscriptionService } from '../services/billing/SubscriptionService';
import { UsageLimitsService } from '../services/usage/UsageLimitsService';

const router = Router();
const subscriptionService = new SubscriptionService();
const usageLimitsService = new UsageLimitsService();

/**
 * GET /api/pricing/tiers
 * Get all pricing tiers with their limits and features
 */
router.get('/tiers', (req: Request, res: Response) => {
  try {
    const billingCycle = req.query.billing as 'monthly' | 'annual' || 'monthly';
    
    const tiers = Object.values(PRICING_TIERS).map(tier => ({
      ...tier,
      currentPrice: billingCycle === 'annual' ? tier.annualPrice : tier.monthlyPrice,
      billingCycle,
      savings: billingCycle === 'annual' ? {
        amount: (tier.monthlyPrice * 12) - tier.annualPrice,
        percentage: tier.monthlyPrice > 0 ? Math.round(((tier.monthlyPrice * 12 - tier.annualPrice) / (tier.monthlyPrice * 12)) * 100) : 0
      } : null
    }));

    res.json({
      success: true,
      data: {
        tiers,
        billingCycle,
        currency: 'USD'
      }
    });
  } catch (error) {
    console.error('Error fetching pricing tiers:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch pricing tiers'
    });
  }
});

/**
 * GET /api/pricing/overage-rates
 * Get current overage rates for all services
 */
router.get('/overage-rates', (_req: Request, res: Response) => {
  try {
    res.json({
      success: true,
      data: {
        rates: OVERAGE_RATES,
        currency: 'USD',
        billingFrequency: 'monthly'
      }
    });
  } catch (error) {
    console.error('Error fetching overage rates:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch overage rates'
    });
  }
});

/**
 * GET /api/pricing/deployment-pricing
 * Get deployment pricing for all tiers
 */
router.get('/deployment-pricing', (_req: Request, res: Response) => {
  try {
    const deploymentPricing = Object.entries(DEPLOYMENT_PRICING).map(([tier, price]) => ({
      tier,
      pricePerMonth: price,
      currency: 'USD',
      includes: [
        '24/7 hosting with 99.9% uptime SLA',
        'Auto-scaling (up to 5 instances)',
        'SSL certificate and custom domain support',
        'Global CDN with 100GB bandwidth/month',
        'Automatic backups and zero-downtime deploys'
      ]
    }));

    res.json({
      success: true,
      data: deploymentPricing
    });
  } catch (error) {
    console.error('Error fetching deployment pricing:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch deployment pricing'
    });
  }
});

/**
 * POST /api/pricing/calculate-overage
 * Calculate overage costs for given usage
 */
router.post('/calculate-overage', (req: Request, res: Response) => {
  try {
    const { tier, usage } = req.body;

    if (!tier || !usage) {
      return res.status(400).json({
        success: false,
        error: 'Tier and usage data are required'
      });
    }

    const limits = getTierLimits(tier);
    const calculations = {
      aiCalls: calculateOverage(usage.aiCalls || 0, limits.aiCalls, OVERAGE_RATES.aiCallsPerCall),
      quantum: calculateOverage(usage.quantum || 0, limits.quantumSimulations, OVERAGE_RATES.quantumPerSimulation),
      arVr: calculateOverage(usage.arVr || 0, limits.arVrMinutes, OVERAGE_RATES.arVrPerMinute),
      storage: calculateOverage(usage.storage || 0, limits.storageGB, OVERAGE_RATES.storagePerGBPerMonth),
      bandwidth: calculateOverage(usage.bandwidth || 0, limits.bandwidth, OVERAGE_RATES.bandwidthPerGB)
    };

    const totalOverageCost = Object.values(calculations).reduce((sum, calc) => sum + calc.cost, 0);

    res.json({
      success: true,
      data: {
        tier,
        limits,
        usage,
        calculations,
        totalOverageCost,
        currency: 'USD'
      }
    });
  } catch (error) {
    console.error('Error calculating overage:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to calculate overage costs'
    });
  }
  return;
});

/**
 * GET /api/pricing/tier/:tierName
 * Get detailed information about a specific tier
 */
router.get('/tier/:tierName', (req: Request, res: Response) => {
  try {
    const { tierName } = req.params;
    const billingCycle = req.query.billing as 'monthly' | 'annual' || 'monthly';

    const tier = PRICING_TIERS[tierName];
    if (!tier) {
      return res.status(404).json({
        success: false,
        error: 'Tier not found'
      });
    }

    const currentPrice = getTierPrice(tierName, billingCycle);
    const deploymentPrice = getDeploymentPrice(tierName);

    res.json({
      success: true,
      data: {
        ...tier,
        currentPrice,
        billingCycle,
        deploymentPrice,
        savings: billingCycle === 'annual' && tier.monthlyPrice > 0 ? {
          amount: (tier.monthlyPrice * 12) - tier.annualPrice,
          percentage: Math.round(((tier.monthlyPrice * 12 - tier.annualPrice) / (tier.monthlyPrice * 12)) * 100)
        } : null
      }
    });
  } catch (error) {
    console.error('Error fetching tier details:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch tier details'
    });
  }
  return;
});

/**
 * POST /api/pricing/create-subscription
 * Create a new subscription for a user
 */
router.post('/create-subscription', async (req: Request, res: Response) => {
  try {
    const { userId, tier, billingCycle = 'monthly' } = req.body;

    if (!userId || !tier) {
      return res.status(400).json({
        success: false,
        error: 'User ID and tier are required'
      });
    }

    // Validate tier
    const validTiers = getAllTierNames();
    if (!validTiers.includes(tier)) {
      return res.status(400).json({
        success: false,
        error: `Invalid tier. Valid options: ${validTiers.join(', ')}`
      });
    }

    const result = await subscriptionService.createSubscription(userId, tier, billingCycle);

    return res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error creating subscription:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create subscription'
    });
  }
  return;
});

/**
 * GET /api/pricing/usage-limits/:userId
 * Get usage limits and current usage for a user
 */
router.get('/usage-limits/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const usageSummary = await usageLimitsService.getUsageSummary(userId);

    res.json({
      success: true,
      data: usageSummary
    });
  } catch (error) {
    console.error('Error fetching usage limits:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch usage limits'
    });
  }
  return;
});

/**
 * POST /api/pricing/check-usage
 * Check if a user can perform a specific action
 */
router.post('/check-usage', async (req: Request, res: Response) => {
  try {
    const { userId, action, params = {} } = req.body;

    if (!userId || !action) {
      return res.status(400).json({
        success: false,
        error: 'User ID and action are required'
      });
    }

    let result;
    switch (action) {
      case 'ai_call':
        result = await usageLimitsService.canMakeAiCall(userId);
        break;
      case 'quantum_simulation':
        result = await usageLimitsService.canRunQuantumSimulation(userId);
        break;
      case 'ar_vr':
        result = await usageLimitsService.canUseArVr(userId, params.minutes);
        break;
      case 'deployment':
        result = await usageLimitsService.canCreateDeployment(userId);
        break;
      case 'storage':
        result = await usageLimitsService.canStoreData(userId, params.additionalGB);
        break;
      case 'team_member':
        result = await usageLimitsService.canAddTeamMember(userId);
        break;
      default:
        return res.status(400).json({
          success: false,
          error: 'Invalid action. Valid actions: ai_call, quantum_simulation, ar_vr, deployment, storage, team_member'
        });
    }

    res.json({
      success: true,
      data: {
        action,
        ...result
      }
    });
  } catch (error) {
    console.error('Error checking usage:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to check usage'
    });
  }
  return;
});

export default router;
