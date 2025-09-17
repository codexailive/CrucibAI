import React from 'react';

interface OverageRate {
  service: string;
  rate: string;
  unit: string;
  description: string;
}

const OVERAGE_RATES: OverageRate[] = [
  {
    service: 'AI Calls',
    rate: '$0.05',
    unit: 'per call',
    description: 'Additional AI API calls beyond your plan limit'
  },
  {
    service: 'Quantum Simulations',
    rate: '$2.00',
    unit: 'per simulation',
    description: 'Quantum computing tasks beyond your plan limit'
  },
  {
    service: 'AR/VR Minutes',
    rate: '$0.50',
    unit: 'per minute',
    description: 'Extended AR/VR session time beyond your plan limit'
  },
  {
    service: 'Storage',
    rate: '$0.10',
    unit: 'per GB/month',
    description: 'Additional storage beyond your plan allocation'
  },
  {
    service: 'Bandwidth',
    rate: '$0.10',
    unit: 'per GB',
    description: 'Data transfer beyond 100GB per deployment'
  }
];

interface DeploymentPricing {
  tier: string;
  price: string;
  description: string;
}

const DEPLOYMENT_PRICING: DeploymentPricing[] = [
  {
    tier: 'Starter/Professional',
    price: '$20',
    description: 'Additional deployments for individual plans'
  },
  {
    tier: 'Business',
    price: '$18',
    description: 'Volume discount for business teams'
  },
  {
    tier: 'Team',
    price: '$15',
    description: 'Better rates for larger teams'
  },
  {
    tier: 'Enterprise',
    price: '$12',
    description: 'Enterprise-grade deployment pricing'
  },
  {
    tier: 'Unlimited',
    price: '$10',
    description: 'Best rates for unlimited tier customers'
  }
];

const OveragePricing: React.FC = () => {
  return (
    <div className="overage-pricing-container max-w-6xl mx-auto p-6">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold mb-4">Transparent Overage Pricing</h2>
        <p className="text-lg text-gray-600">
          Only pay for what you use beyond your plan limits. No surprises, no hidden fees.
        </p>
      </div>

      {/* Usage Overages */}
      <div className="mb-12">
        <h3 className="text-2xl font-bold mb-6">Usage Overages</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {OVERAGE_RATES.map((rate) => (
            <div
              key={rate.service}
              className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-lg font-semibold">{rate.service}</h4>
                <div className="text-right">
                  <div className="text-xl font-bold text-blue-600">{rate.rate}</div>
                  <div className="text-sm text-gray-500">{rate.unit}</div>
                </div>
              </div>
              <p className="text-gray-600 text-sm">{rate.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Additional Deployments */}
      <div className="mb-12">
        <h3 className="text-2xl font-bold mb-6">Additional Deployments</h3>
        <div className="bg-gray-50 rounded-lg p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {DEPLOYMENT_PRICING.map((deployment) => (
              <div
                key={deployment.tier}
                className="bg-white rounded-lg p-4 border border-gray-200"
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold">{deployment.tier}</h4>
                  <span className="text-lg font-bold text-green-600">
                    {deployment.price}/mo
                  </span>
                </div>
                <p className="text-sm text-gray-600">{deployment.description}</p>
              </div>
            ))}
          </div>
          
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h4 className="font-semibold text-blue-900 mb-2">What's Included in Each Deployment:</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>✓ 24/7 hosting with 99.9% uptime SLA</li>
              <li>✓ Auto-scaling (up to 5 instances)</li>
              <li>✓ SSL certificate and custom domain support</li>
              <li>✓ Global CDN with 100GB bandwidth/month</li>
              <li>✓ Automatic backups and zero-downtime deploys</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Fair Use Policy */}
      <div className="mb-12">
        <h3 className="text-2xl font-bold mb-6">Fair Use Policy</h3>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h4 className="font-semibold text-yellow-900 mb-3">Unlimited Tier Limits</h4>
          <p className="text-yellow-800 mb-4">
            While called "Unlimited", reasonable limits apply to ensure fair usage for all customers:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-yellow-800">
            <div>
              <ul className="space-y-1">
                <li>• 50,000 AI calls/month</li>
                <li>• 1,000 quantum simulations/month</li>
                <li>• 2,000 AR/VR minutes/month</li>
              </ul>
            </div>
            <div>
              <ul className="space-y-1">
                <li>• 100 deployments</li>
                <li>• 5TB storage</li>
                <li>• Unlimited team members</li>
              </ul>
            </div>
          </div>
          <p className="text-yellow-800 mt-4 text-sm">
            Exceeding these limits requires a custom enterprise agreement. Contact our sales team for details.
          </p>
        </div>
      </div>

      {/* Billing Information */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-xl font-bold mb-4">Billing Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
          <div>
            <h4 className="font-semibold mb-2">Overage Billing</h4>
            <ul className="space-y-1 text-gray-600">
              <li>• Overages are billed monthly in arrears</li>
              <li>• You'll receive alerts at 80% and 90% of limits</li>
              <li>• Detailed usage reports available in dashboard</li>
              <li>• No surprise charges - transparent tracking</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-2">Annual Savings</h4>
            <ul className="space-y-1 text-gray-600">
              <li>• Save 16.7% with annual billing (2 months free)</li>
              <li>• Existing customers get 6-month grandfathering</li>
              <li>• Loyalty discount: 20% off for 1+ year customers</li>
              <li>• Easy plan changes with prorated billing</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OveragePricing;
