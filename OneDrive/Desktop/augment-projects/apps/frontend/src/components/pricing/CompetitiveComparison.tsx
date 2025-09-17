import React from 'react';

interface CompetitorComparison {
  competitor: string;
  price: string;
  features: string;
  crucibaiEquivalent: string;
  crucibaiPrice: string;
  crucibaiFeatures: string;
  valueProposition: string;
}

const COMPETITIVE_DATA: CompetitorComparison[] = [
  {
    competitor: 'Cursor',
    price: '$20/mo',
    features: 'Code completion only',
    crucibaiEquivalent: 'Starter',
    crucibaiPrice: '$29/mo',
    crucibaiFeatures: 'Full AI platform + quantum + AR/VR + deployments',
    valueProposition: '45% more value with 10x more features'
  },
  {
    competitor: 'Replit',
    price: '$20/mo',
    features: 'Basic hosting + IDE',
    crucibaiEquivalent: 'Starter',
    crucibaiPrice: '$29/mo',
    crucibaiFeatures: 'AI + quantum computing + advanced deployments',
    valueProposition: 'Next-gen AI development platform'
  },
  {
    competitor: 'Vercel Pro',
    price: '$20/mo',
    features: 'Hosting only',
    crucibaiEquivalent: 'Professional',
    crucibaiPrice: '$59/mo',
    crucibaiFeatures: 'Complete AI development + hosting + quantum',
    valueProposition: 'Full-stack AI solution vs hosting-only'
  },
  {
    competitor: 'GitHub Team',
    price: '$44/mo',
    features: 'Code hosting + basic CI/CD',
    crucibaiEquivalent: 'Business',
    crucibaiPrice: '$149/mo',
    crucibaiFeatures: 'AI orchestration + quantum + team collaboration',
    valueProposition: '10x more AI capabilities for modern development'
  }
];

interface SupportComparison {
  tier: string;
  responseTime: string;
  channels: string[];
  features: string[];
}

const SUPPORT_LEVELS: SupportComparison[] = [
  {
    tier: 'Discovery (Free)',
    responseTime: 'Best effort',
    channels: ['Community forum'],
    features: ['Community support', 'Documentation', 'Tutorials']
  },
  {
    tier: 'Starter',
    responseTime: '48 hours',
    channels: ['Email'],
    features: ['Email support', 'Knowledge base', 'Video tutorials']
  },
  {
    tier: 'Professional',
    responseTime: '24 hours',
    channels: ['Priority email'],
    features: ['Priority support', 'Advanced documentation', 'Best practices guide']
  },
  {
    tier: 'Business',
    responseTime: '12 hours',
    channels: ['Priority email'],
    features: ['Business support', 'Implementation guidance', 'Training resources']
  },
  {
    tier: 'Team',
    responseTime: '4 hours',
    channels: ['Phone', 'Email'],
    features: ['Phone support', 'Team onboarding', 'Custom training']
  },
  {
    tier: 'Enterprise',
    responseTime: '1 hour',
    channels: ['Dedicated manager', 'Phone', 'Email'],
    features: ['Dedicated account manager', 'Custom SLA', 'Priority escalation']
  },
  {
    tier: 'Unlimited',
    responseTime: '15 minutes',
    channels: ['24/7 phone', 'Dedicated manager'],
    features: ['24/7 support', 'White-glove service', 'Custom enterprise agreement']
  }
];

const CompetitiveComparison: React.FC = () => {
  return (
    <div className="competitive-comparison max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold mb-4">Why Choose CrucibleAI?</h2>
        <p className="text-lg text-gray-600">
          Compare our comprehensive AI platform with traditional development tools
        </p>
      </div>

      {/* Competitive Comparison Table */}
      <div className="mb-16">
        <h3 className="text-2xl font-bold mb-8">Competitive Positioning</h3>
        <div className="overflow-x-auto">
          <table className="w-full bg-white rounded-lg shadow-sm border border-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left font-semibold">Competitor</th>
                <th className="px-6 py-4 text-left font-semibold">Their Offering</th>
                <th className="px-6 py-4 text-left font-semibold">CrucibleAI Equivalent</th>
                <th className="px-6 py-4 text-left font-semibold">Value Proposition</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {COMPETITIVE_DATA.map((comparison, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="font-semibold">{comparison.competitor}</div>
                    <div className="text-sm text-gray-600">{comparison.price}</div>
                    <div className="text-xs text-gray-500 mt-1">{comparison.features}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-600">
                      Limited to {comparison.features.toLowerCase()}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-semibold text-blue-600">{comparison.crucibaiEquivalent}</div>
                    <div className="text-sm font-medium">{comparison.crucibaiPrice}</div>
                    <div className="text-xs text-gray-600 mt-1">{comparison.crucibaiFeatures}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-green-600">
                      {comparison.valueProposition}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Support Comparison */}
      <div className="mb-16">
        <h3 className="text-2xl font-bold mb-8">Support Levels</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {SUPPORT_LEVELS.map((support, index) => (
            <div
              key={index}
              className={`bg-white rounded-lg border-2 p-6 ${
                support.tier === 'Professional' 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-200'
              }`}
            >
              <h4 className="font-bold text-lg mb-2">{support.tier}</h4>
              <div className="mb-4">
                <div className="text-sm font-medium text-gray-700">Response Time</div>
                <div className="text-lg font-semibold text-blue-600">{support.responseTime}</div>
              </div>
              
              <div className="mb-4">
                <div className="text-sm font-medium text-gray-700 mb-2">Channels</div>
                <div className="flex flex-wrap gap-1">
                  {support.channels.map((channel, idx) => (
                    <span
                      key={idx}
                      className="inline-block bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded"
                    >
                      {channel}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <div className="text-sm font-medium text-gray-700 mb-2">Features</div>
                <ul className="text-xs text-gray-600 space-y-1">
                  {support.features.map((feature, idx) => (
                    <li key={idx}>• {feature}</li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Value Proposition */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-8">
        <h3 className="text-2xl font-bold mb-6 text-center">The CrucibleAI Advantage</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🚀</span>
            </div>
            <h4 className="font-bold mb-2">Complete Platform</h4>
            <p className="text-sm text-gray-600">
              AI orchestration, quantum computing, AR/VR, and deployment - all in one platform
            </p>
          </div>
          
          <div className="text-center">
            <div className="w-16 h-16 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">⚡</span>
            </div>
            <h4 className="font-bold mb-2">Future-Ready</h4>
            <p className="text-sm text-gray-600">
              Built for next-generation AI development with quantum and multimodal capabilities
            </p>
          </div>
          
          <div className="text-center">
            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">💎</span>
            </div>
            <h4 className="font-bold mb-2">Premium Value</h4>
            <p className="text-sm text-gray-600">
              Enterprise-grade features at competitive prices with transparent, fair billing
            </p>
          </div>
        </div>
      </div>

      {/* Migration Support */}
      <div className="mt-12 text-center">
        <h3 className="text-xl font-bold mb-4">Seamless Migration</h3>
        <p className="text-gray-600 mb-6">
          Switching from another platform? We'll help you migrate with zero downtime.
        </p>
        <div className="inline-flex items-center space-x-4 text-sm">
          <span className="flex items-center">
            <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
            Free migration assistance
          </span>
          <span className="flex items-center">
            <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
            6-month grandfathering for existing customers
          </span>
          <span className="flex items-center">
            <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
            Dedicated onboarding support
          </span>
        </div>
      </div>
    </div>
  );
};

export default CompetitiveComparison;
