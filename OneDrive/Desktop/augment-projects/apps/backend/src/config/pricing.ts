export interface PricingTier {
  name: string;
  monthlyPrice: number;
  annualPrice: number;
  limits: {
    aiCalls: number;
    quantumSimulations: number;
    arVrMinutes: number;
    deployments: number;
    storageGB: number;
    teamSize: number;
    bandwidth: number; // GB per deployment
  };
  features: string[];
  supportType: string;
  supportResponseTime: string;
}

export interface OverageRates {
  aiCallsPerCall: number;
  quantumPerSimulation: number;
  arVrPerMinute: number;
  storagePerGBPerMonth: number;
  bandwidthPerGB: number;
}

export interface DeploymentPricing {
  [tier: string]: number; // Price per deployment per month
}

export const PRICING_TIERS: Record<string, PricingTier> = {
  Discovery: {
    name: 'Discovery',
    monthlyPrice: 0,
    annualPrice: 0,
    limits: {
      aiCalls: 20,
      quantumSimulations: 0,
      arVrMinutes: 0,
      deployments: 0,
      storageGB: 0.1, // 100MB
      teamSize: 1,
      bandwidth: 0,
    },
    features: [
      'Basic AI assistance',
      'Community forum access',
      '100MB storage',
      'Single user',
    ],
    supportType: 'Community forum',
    supportResponseTime: 'Best effort',
  },
  Starter: {
    name: 'Starter',
    monthlyPrice: 29,
    annualPrice: 290, // 2 months free (16.7% discount)
    limits: {
      aiCalls: 250,
      quantumSimulations: 2,
      arVrMinutes: 5,
      deployments: 1,
      storageGB: 3,
      teamSize: 1,
      bandwidth: 100,
    },
    features: [
      '250 AI calls/month',
      '2 quantum simulations',
      '5 minutes AR/VR',
      '1 deployment',
      '3GB storage',
      'SSL certificate',
      'Auto-scaling (up to 5 instances)',
      'Global CDN',
      'Custom domain support',
      'Automatic backups',
      'Zero-downtime deploys',
    ],
    supportType: 'Email',
    supportResponseTime: '48 hours',
  },
  Professional: {
    name: 'Professional',
    monthlyPrice: 59,
    annualPrice: 590,
    limits: {
      aiCalls: 500,
      quantumSimulations: 5,
      arVrMinutes: 20,
      deployments: 2,
      storageGB: 10,
      teamSize: 1,
      bandwidth: 100,
    },
    features: [
      '500 AI calls/month',
      '5 quantum simulations',
      '20 minutes AR/VR',
      '2 deployments',
      '10GB storage',
      'Priority support',
      'Advanced analytics',
      'API access',
      'All Starter features',
    ],
    supportType: 'Email',
    supportResponseTime: '24 hours',
  },
  Business: {
    name: 'Business',
    monthlyPrice: 149,
    annualPrice: 1490,
    limits: {
      aiCalls: 1200,
      quantumSimulations: 20,
      arVrMinutes: 60,
      deployments: 5,
      storageGB: 50,
      teamSize: 5,
      bandwidth: 100,
    },
    features: [
      '1,200 AI calls/month',
      '20 quantum simulations',
      '60 minutes AR/VR',
      '5 deployments',
      '50GB storage',
      'Team collaboration (5 users)',
      'Advanced security',
      'Compliance tools',
      'All Professional features',
    ],
    supportType: 'Priority email',
    supportResponseTime: '12 hours',
  },
  Team: {
    name: 'Team',
    monthlyPrice: 399,
    annualPrice: 3990,
    limits: {
      aiCalls: 3000,
      quantumSimulations: 50,
      arVrMinutes: 150,
      deployments: 10,
      storageGB: 200,
      teamSize: 20,
      bandwidth: 100,
    },
    features: [
      '3,000 AI calls/month',
      '50 quantum simulations',
      '150 minutes AR/VR',
      '10 deployments',
      '200GB storage',
      'Team collaboration (20 users)',
      'Advanced workflows',
      'Custom integrations',
      'All Business features',
    ],
    supportType: 'Phone + email',
    supportResponseTime: '4 hours',
  },
  Enterprise: {
    name: 'Enterprise',
    monthlyPrice: 999,
    annualPrice: 9990,
    limits: {
      aiCalls: 10000,
      quantumSimulations: 200,
      arVrMinutes: 500,
      deployments: 25,
      storageGB: 1000, // 1TB
      teamSize: -1, // Unlimited
      bandwidth: 100,
    },
    features: [
      '10,000 AI calls/month',
      '200 quantum simulations',
      '500 minutes AR/VR',
      '25 deployments',
      '1TB storage',
      'Unlimited team size',
      'Dedicated account manager',
      'Custom SLA',
      'On-premise deployment',
      'All Team features',
    ],
    supportType: 'Dedicated manager',
    supportResponseTime: '1 hour',
  },
  Unlimited: {
    name: 'Unlimited',
    monthlyPrice: 2499,
    annualPrice: 24990,
    limits: {
      aiCalls: 50000,
      quantumSimulations: 1000,
      arVrMinutes: 2000,
      deployments: 100,
      storageGB: 5000, // 5TB
      teamSize: -1, // Unlimited
      bandwidth: 100,
    },
    features: [
      '50,000 AI calls/month',
      '1,000 quantum simulations',
      '2,000 minutes AR/VR',
      '100 deployments',
      '5TB storage',
      'Unlimited team size',
      '24/7 phone support',
      'White-label options',
      'Custom enterprise agreement',
      'All Enterprise features',
    ],
    supportType: '24/7 phone',
    supportResponseTime: '15 minutes',
  },
};

export const OVERAGE_RATES: OverageRates = {
  aiCallsPerCall: 0.05,
  quantumPerSimulation: 2.00,
  arVrPerMinute: 0.50,
  storagePerGBPerMonth: 0.10,
  bandwidthPerGB: 0.10,
};

export const DEPLOYMENT_PRICING: DeploymentPricing = {
  Starter: 20,
  Professional: 20,
  Business: 18,
  Team: 15,
  Enterprise: 12,
  Unlimited: 10,
};

export const ANNUAL_DISCOUNT_PERCENTAGE = 16.7; // 2 months free

export function getTierLimits(tierName: string) {
  return PRICING_TIERS[tierName]?.limits || PRICING_TIERS.Discovery.limits;
}

export function getTierPrice(tierName: string, billingCycle: 'monthly' | 'annual' = 'monthly') {
  const tier = PRICING_TIERS[tierName];
  if (!tier) return 0;
  
  return billingCycle === 'annual' ? tier.annualPrice : tier.monthlyPrice;
}

export function getDeploymentPrice(tierName: string): number {
  return DEPLOYMENT_PRICING[tierName] || DEPLOYMENT_PRICING.Starter;
}

export function calculateOverage(
  usage: number,
  limit: number,
  ratePerUnit: number
): { overage: number; cost: number } {
  const overage = Math.max(0, usage - limit);
  const cost = overage * ratePerUnit;
  return { overage, cost };
}

export function isUnlimitedTeamSize(tierName: string): boolean {
  const tier = PRICING_TIERS[tierName];
  return tier?.limits.teamSize === -1;
}

export function getAllTierNames(): string[] {
  return Object.keys(PRICING_TIERS);
}

export function getTierFeatures(tierName: string): string[] {
  return PRICING_TIERS[tierName]?.features || [];
}
