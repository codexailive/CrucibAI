import React, { useState } from 'react';

interface PricingTier {
  name: string;
  monthlyPrice: number;
  annualPrice: number;
  popular?: boolean;
  limits: {
    aiCalls: number;
    quantumSimulations: number;
    arVrMinutes: number;
    deployments: number;
    storageGB: number;
    teamSize: number | string;
  };
  features: string[];
  supportType: string;
  supportResponseTime: string;
}

const PRICING_TIERS: PricingTier[] = [
  {
    name: 'Discovery',
    monthlyPrice: 0,
    annualPrice: 0,
    limits: {
      aiCalls: 20,
      quantumSimulations: 0,
      arVrMinutes: 0,
      deployments: 0,
      storageGB: 0.1,
      teamSize: 1,
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
  {
    name: 'Starter',
    monthlyPrice: 29,
    annualPrice: 290,
    limits: {
      aiCalls: 250,
      quantumSimulations: 2,
      arVrMinutes: 5,
      deployments: 1,
      storageGB: 3,
      teamSize: 1,
    },
    features: [
      '250 AI calls/month',
      '2 quantum simulations',
      '5 minutes AR/VR',
      '1 deployment',
      '3GB storage',
      'SSL certificate',
      'Auto-scaling',
      'Global CDN',
      'Custom domain support',
      'Automatic backups',
      'Zero-downtime deploys',
    ],
    supportType: 'Email',
    supportResponseTime: '48 hours',
  },
  {
    name: 'Professional',
    monthlyPrice: 59,
    annualPrice: 590,
    popular: true,
    limits: {
      aiCalls: 500,
      quantumSimulations: 5,
      arVrMinutes: 20,
      deployments: 2,
      storageGB: 10,
      teamSize: 1,
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
  {
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
  {
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
  {
    name: 'Enterprise',
    monthlyPrice: 999,
    annualPrice: 9990,
    limits: {
      aiCalls: 10000,
      quantumSimulations: 200,
      arVrMinutes: 500,
      deployments: 25,
      storageGB: 1000,
      teamSize: 'Unlimited',
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
  {
    name: 'Unlimited',
    monthlyPrice: 2499,
    annualPrice: 24990,
    limits: {
      aiCalls: 50000,
      quantumSimulations: 1000,
      arVrMinutes: 2000,
      deployments: 100,
      storageGB: 5000,
      teamSize: 'Unlimited',
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
];

const PricingTable: React.FC = () => {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');

  const formatPrice = (tier: PricingTier) => {
    const price = billingCycle === 'annual' ? tier.annualPrice : tier.monthlyPrice;
    if (price === 0) return 'Free';
    
    if (billingCycle === 'annual') {
      const monthlyEquivalent = price / 12;
      return `$${monthlyEquivalent.toFixed(0)}/mo`;
    }
    
    return `$${price}/mo`;
  };

  const formatStorage = (gb: number) => {
    if (gb < 1) return `${Math.round(gb * 1000)}MB`;
    if (gb >= 1000) return `${gb / 1000}TB`;
    return `${gb}GB`;
  };

  const handleSelectPlan = (tierName: string) => {
    // This would typically integrate with your subscription system
    console.log(`Selected plan: ${tierName} (${billingCycle})`);
  };

  return (
    <div className="pricing-container">
      <div className="text-center mb-8">
        <h2 className="text-4xl font-bold mb-4">Choose Your Plan</h2>
        <p className="text-xl text-gray-600 mb-6">
          Scale your AI development with our flexible pricing tiers
        </p>
        
        {/* Billing Toggle */}
        <div className="inline-flex items-center bg-gray-100 rounded-lg p-1">
          <button
            className={`px-4 py-2 rounded-md transition-colors ${
              billingCycle === 'monthly' 
                ? 'bg-white shadow-sm text-gray-900' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
            onClick={() => setBillingCycle('monthly')}
          >
            Monthly
          </button>
          <button
            className={`px-4 py-2 rounded-md transition-colors ${
              billingCycle === 'annual' 
                ? 'bg-white shadow-sm text-gray-900' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
            onClick={() => setBillingCycle('annual')}
          >
            Annual
            <span className="ml-2 text-sm text-green-600 font-medium">Save 16.7%</span>
          </button>
        </div>
      </div>

      {/* Pricing Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-6">
        {PRICING_TIERS.map((tier) => (
          <div
            key={tier.name}
            className={`pricing-card relative rounded-2xl border-2 p-6 ${
              tier.popular
                ? 'border-blue-500 bg-blue-50 scale-105'
                : 'border-gray-200 bg-white hover:border-gray-300'
            } transition-all duration-200`}
          >
            {tier.popular && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                  Most Popular
                </span>
              </div>
            )}

            <div className="text-center mb-6">
              <h3 className="text-xl font-bold mb-2">{tier.name}</h3>
              <div className="text-3xl font-bold mb-1">
                {formatPrice(tier)}
              </div>
              {billingCycle === 'annual' && tier.monthlyPrice > 0 && (
                <div className="text-sm text-gray-500">
                  ${tier.annualPrice}/year
                </div>
              )}
            </div>

            {/* Key Limits */}
            <div className="space-y-2 mb-6 text-sm">
              <div className="flex justify-between">
                <span>AI Calls</span>
                <span className="font-medium">{tier.limits.aiCalls.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Quantum</span>
                <span className="font-medium">{tier.limits.quantumSimulations}</span>
              </div>
              <div className="flex justify-between">
                <span>AR/VR</span>
                <span className="font-medium">{tier.limits.arVrMinutes} min</span>
              </div>
              <div className="flex justify-between">
                <span>Deployments</span>
                <span className="font-medium">{tier.limits.deployments}</span>
              </div>
              <div className="flex justify-between">
                <span>Storage</span>
                <span className="font-medium">{formatStorage(tier.limits.storageGB)}</span>
              </div>
              <div className="flex justify-between">
                <span>Team Size</span>
                <span className="font-medium">{tier.limits.teamSize}</span>
              </div>
            </div>

            {/* Support Info */}
            <div className="text-xs text-gray-600 mb-6">
              <div className="font-medium">{tier.supportType}</div>
              <div>{tier.supportResponseTime}</div>
            </div>

            {/* CTA Button */}
            <button
              onClick={() => handleSelectPlan(tier.name)}
              className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
                tier.name === 'Discovery'
                  ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  : tier.popular
                  ? 'bg-blue-500 text-white hover:bg-blue-600'
                  : 'bg-gray-900 text-white hover:bg-gray-800'
              }`}
            >
              {tier.name === 'Discovery' ? 'Get Started Free' : 'Choose Plan'}
            </button>
          </div>
        ))}
      </div>

      {/* Additional Info */}
      <div className="mt-12 text-center text-sm text-gray-600">
        <p className="mb-2">
          All plans include 24/7 hosting, auto-scaling, SSL certificates, and global CDN.
        </p>
        <p>
          Need more? Contact us for custom enterprise solutions.
        </p>
      </div>
    </div>
  );
};

export default PricingTable;
