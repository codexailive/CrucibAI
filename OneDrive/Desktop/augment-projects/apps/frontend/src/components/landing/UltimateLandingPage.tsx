import React, { useEffect, useState } from 'react';

const UltimateLandingPage: React.FC = () => {
  const [activeFeature, setActiveFeature] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
    const interval = setInterval(() => {
      setActiveFeature(prev => (prev + 1) % 8);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const features = [
    {
      title: 'Advanced AI Orchestration',
      description: 'Multimodal AI conductor with voice, video, document processing across 15+ providers',
      icon: '🧠',
      category: 'AI',
      highlights: ['Voice Commands', 'Video Analysis', 'Document Processing', 'Multi-Provider Routing'],
      demo: 'https://demo.crucibleai.com/ai-orchestration'
    },
    {
      title: 'Quantum Computing Platform',
      description: 'Full quantum development suite with circuit design and AWS Braket integration',
      icon: '⚛️',
      category: 'Quantum',
      highlights: ['Circuit Designer', 'QAOA & VQE', 'Quantum ML', 'Real Hardware Access'],
      demo: 'https://demo.crucibleai.com/quantum'
    },
    {
      title: 'AR/VR Development Studio',
      description: 'Immersive 3D development with real-time collaboration and cross-platform deployment',
      icon: '🥽',
      category: 'XR',
      highlights: ['3D Scene Editor', 'Real-time Collaboration', 'WebXR Support', 'Multi-platform Deploy'],
      demo: 'https://demo.crucibleai.com/arvr'
    },
    {
      title: 'Enterprise Deployment Engine',
      description: 'Zero-downtime deployments with auto-scaling and multi-cloud support',
      icon: '🚀',
      category: 'DevOps',
      highlights: ['Zero Downtime', 'Auto-scaling', 'Multi-cloud', 'Advanced Monitoring'],
      demo: 'https://demo.crucibleai.com/deployment'
    },
    {
      title: 'Team Collaboration Hub',
      description: 'Real-time code collaboration with voice chat and advanced project management',
      icon: '👥',
      category: 'Collaboration',
      highlights: ['Live Coding', 'Voice Chat', 'Code Reviews', 'Project Management'],
      demo: 'https://demo.crucibleai.com/collaboration'
    },
    {
      title: 'Advanced Analytics Dashboard',
      description: 'Comprehensive analytics with business intelligence and predictive insights',
      icon: '📊',
      category: 'Analytics',
      highlights: ['Usage Analytics', 'Performance Monitoring', 'Business Intelligence', 'Predictive Insights'],
      demo: 'https://demo.crucibleai.com/analytics'
    },
    {
      title: 'Security & Compliance Suite',
      description: 'Enterprise-grade security with automated compliance and threat protection',
      icon: '🔒',
      category: 'Security',
      highlights: ['Automated Compliance', 'Audit Logging', 'Threat Protection', 'Data Encryption'],
      demo: 'https://demo.crucibleai.com/security'
    },
    {
      title: 'Marketplace & Extensions',
      description: 'Rich ecosystem of plugins, integrations, and third-party developer tools',
      icon: '🛍️',
      category: 'Ecosystem',
      highlights: ['Plugin Marketplace', 'Custom Extensions', 'API Integrations', 'Developer Tools'],
      demo: 'https://demo.crucibleai.com/marketplace'
    }
  ];

  const pricingTiers = [
    {
      name: 'Discovery',
      price: 'Free',
      description: 'Perfect for getting started',
      features: ['20 AI Calls', '100MB Storage', '1 Project', 'Community Support'],
      highlight: false
    },
    {
      name: 'Starter',
      price: '$29',
      description: 'For small projects',
      features: ['250 AI Calls', '2 Quantum Simulations', '5 AR/VR Minutes', '1 Deployment', '3GB Storage'],
      highlight: false
    },
    {
      name: 'Professional',
      price: '$59',
      description: 'For growing applications',
      features: ['500 AI Calls', '5 Quantum Simulations', '20 AR/VR Minutes', '2 Deployments', '10GB Storage'],
      highlight: true
    },
    {
      name: 'Business',
      price: '$149',
      description: 'Team collaboration',
      features: ['1,200 AI Calls', '20 Quantum Simulations', '60 AR/VR Minutes', '5 Deployments', '50GB Storage', '5 Team Members'],
      highlight: false
    },
    {
      name: 'Enterprise',
      price: '$999',
      description: 'Enterprise scale',
      features: ['10,000 AI Calls', '200 Quantum Simulations', '500 AR/VR Minutes', '25 Deployments', '1TB Storage', 'Unlimited Team'],
      highlight: false
    },
    {
      name: 'Unlimited',
      price: '$2,499',
      description: 'Maximum power',
      features: ['50,000 AI Calls', '1,000 Quantum Simulations', '2,000 AR/VR Minutes', '100 Deployments', '5TB Storage', 'White-glove Support'],
      highlight: false
    }
  ];

  const stats = [
    { number: '50,000+', label: 'AI Calls/Month', icon: '🤖' },
    { number: '1,000+', label: 'Quantum Simulations', icon: '⚛️' },
    { number: '2,000+', label: 'AR/VR Minutes', icon: '🥽' },
    { number: '100+', label: 'Deployments', icon: '🚀' },
    { number: '99.99%', label: 'Uptime SLA', icon: '⚡' },
    { number: '15+', label: 'AI Providers', icon: '🔗' }
  ];

  return (
    <div className={`ultimate-landing ${isVisible ? 'visible' : ''}`}>
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-black/80 backdrop-blur-md border-b border-purple-500/20">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center font-bold text-xl">
              C
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              CrucibleAI
            </span>
            <span className="px-2 py-1 bg-gradient-to-r from-green-500 to-blue-500 text-white text-xs rounded-full font-bold">
              v3.0
            </span>
          </div>
          
          <div className="hidden md:flex space-x-8">
            <a href="#features" className="text-gray-300 hover:text-white transition">Features</a>
            <a href="#pricing" className="text-gray-300 hover:text-white transition">Pricing</a>
            <a href="#demo" className="text-gray-300 hover:text-white transition">Demo</a>
            <a href="#enterprise" className="text-gray-300 hover:text-white transition">Enterprise</a>
          </div>
          
          <div className="flex items-center space-x-4">
            <button className="px-4 py-2 text-gray-300 hover:text-white transition">
              Sign In
            </button>
            <button className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg font-semibold transition">
              Start Free
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero-section min-h-screen flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 via-purple-900/20 to-pink-900/20"></div>
        <div className="absolute inset-0 bg-gray-900/10 opacity-20"></div>
        
        <div className="container mx-auto px-6 text-center relative z-10">
          <div className="mb-8">
            <span className="inline-block px-4 py-2 bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/30 rounded-full text-blue-300 text-sm font-semibold mb-6">
              🚀 Now with Quantum Computing & AR/VR Development
            </span>
          </div>
          
          <h1 className="text-6xl md:text-8xl font-black mb-8 leading-tight">
            <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              Build the Future
            </span>
            <br />
            <span className="text-white">
              with CrucibleAI
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl text-gray-300 mb-12 max-w-4xl mx-auto leading-relaxed">
            The world's most advanced AI development platform. Combine AI orchestration, quantum computing, 
            AR/VR development, and enterprise collaboration in one unified platform.
          </p>
          
          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 mb-12 max-w-6xl mx-auto">
            {stats.map((stat, index) => (
              <div key={index} className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 text-center">
                <div className="text-2xl mb-2">{stat.icon}</div>
                <div className="text-2xl font-bold text-white mb-1">{stat.number}</div>
                <div className="text-sm text-gray-400">{stat.label}</div>
              </div>
            ))}
          </div>
          
          <div className="flex flex-col md:flex-row gap-6 justify-center items-center">
            <button className="group px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl font-bold text-lg shadow-2xl transition-all duration-300 transform hover:scale-105">
              <span className="flex items-center space-x-2">
                <span>🚀 Start Building Now</span>
                <span className="group-hover:translate-x-1 transition-transform">→</span>
              </span>
              <div className="text-sm opacity-80 mt-1">Free tier • No credit card required</div>
            </button>
            
            <button className="group px-8 py-4 bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/20 text-white rounded-xl font-bold text-lg transition-all duration-300">
              <span className="flex items-center space-x-2">
                <span>🎮 Interactive Demo</span>
                <span className="group-hover:translate-x-1 transition-transform">→</span>
              </span>
              <div className="text-sm opacity-80 mt-1">See all features in action</div>
            </button>
            
            <button className="group px-8 py-4 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white rounded-xl font-bold text-lg shadow-2xl transition-all duration-300">
              <span className="flex items-center space-x-2">
                <span>💰 View Pricing</span>
                <span className="group-hover:translate-x-1 transition-transform">→</span>
              </span>
              <div className="text-sm opacity-80 mt-1">From $0 to $2,499/month</div>
            </button>
          </div>
        </div>
      </section>

      {/* Features Showcase */}
      <section id="features" className="py-24 bg-gradient-to-b from-black to-gray-900">
        <div className="container mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-5xl md:text-6xl font-black mb-6">
              <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Revolutionary Features
              </span>
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Everything you need to build next-generation AI applications, from prototype to production
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className={`feature-card group cursor-pointer transition-all duration-500 ${
                  activeFeature === index ? 'active' : ''
                }`}
                onClick={() => setActiveFeature(index)}
              >
                <div className="bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-sm border border-white/10 rounded-2xl p-8 h-full hover:border-purple-500/50 transition-all duration-300 group-hover:transform group-hover:scale-105">
                  <div className="flex items-center justify-between mb-6">
                    <div className="text-5xl">{feature.icon}</div>
                    <span className="px-3 py-1 bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/30 rounded-full text-blue-300 text-xs font-semibold">
                      {feature.category}
                    </span>
                  </div>
                  
                  <h3 className="text-2xl font-bold text-white mb-4 group-hover:text-purple-300 transition-colors">
                    {feature.title}
                  </h3>
                  
                  <p className="text-gray-300 mb-6 leading-relaxed">
                    {feature.description}
                  </p>
                  
                  <div className="flex flex-wrap gap-2 mb-6">
                    {feature.highlights.map((highlight, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 bg-white/10 text-white text-xs rounded-full border border-white/20"
                      >
                        {highlight}
                      </span>
                    ))}
                  </div>
                  
                  <button className="w-full py-3 bg-gradient-to-r from-blue-600/80 to-purple-600/80 hover:from-blue-600 hover:to-purple-600 text-white rounded-lg font-semibold transition-all duration-300 group-hover:shadow-lg">
                    Try Live Demo →
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 bg-gradient-to-b from-gray-900 to-black">
        <div className="container mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-5xl md:text-6xl font-black mb-6">
              <span className="bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">
                Simple, Transparent Pricing
              </span>
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Choose the perfect plan for your needs. Scale as you grow with no hidden fees.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
            {pricingTiers.map((tier, index) => (
              <div
                key={index}
                className={`pricing-card ${tier.highlight ? 'highlighted' : ''}`}
              >
                <div className={`bg-gradient-to-br ${
                  tier.highlight 
                    ? 'from-blue-500/20 to-purple-500/20 border-purple-500/50' 
                    : 'from-white/5 to-white/10 border-white/10'
                } backdrop-blur-sm border rounded-2xl p-6 h-full relative overflow-hidden`}>
                  {tier.highlight && (
                    <div className="absolute top-0 right-0 bg-gradient-to-r from-blue-500 to-purple-500 text-white px-3 py-1 text-xs font-bold rounded-bl-lg">
                      POPULAR
                    </div>
                  )}
                  
                  <div className="text-center mb-6">
                    <h3 className="text-xl font-bold text-white mb-2">{tier.name}</h3>
                    <div className="text-3xl font-black text-white mb-2">
                      {tier.price}
                      {tier.price !== 'Free' && <span className="text-lg text-gray-400">/mo</span>}
                    </div>
                    <p className="text-gray-400 text-sm">{tier.description}</p>
                  </div>
                  
                  <ul className="space-y-3 mb-6">
                    {tier.features.map((feature, idx) => (
                      <li key={idx} className="flex items-center text-sm text-gray-300">
                        <span className="text-green-400 mr-2">✓</span>
                        {feature}
                      </li>
                    ))}
                  </ul>
                  
                  <button className={`w-full py-3 rounded-lg font-semibold transition-all duration-300 ${
                    tier.highlight
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg'
                      : 'bg-white/10 hover:bg-white/20 text-white border border-white/20'
                  }`}>
                    {tier.price === 'Free' ? 'Get Started' : 'Choose Plan'}
                  </button>
                </div>
              </div>
            ))}
          </div>
          
          <div className="text-center mt-12">
            <p className="text-gray-400 mb-4">
              All plans include our core features. Enterprise plans include dedicated support and custom integrations.
            </p>
            <button className="px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg font-semibold transition-all duration-300">
              Compare All Features →
            </button>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-r from-blue-900 via-purple-900 to-pink-900">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-5xl md:text-6xl font-black text-white mb-8">
            Ready to Build the Future?
          </h2>
          <p className="text-xl text-gray-200 mb-12 max-w-3xl mx-auto">
            Join thousands of developers and companies already building next-generation applications with CrucibleAI.
          </p>
          
          <div className="flex flex-col md:flex-row gap-6 justify-center items-center">
            <button className="px-12 py-4 bg-white text-gray-900 rounded-xl font-bold text-xl shadow-2xl hover:bg-gray-100 transition-all duration-300 transform hover:scale-105">
              Start Free Trial
            </button>
            <button className="px-12 py-4 bg-transparent border-2 border-white text-white rounded-xl font-bold text-xl hover:bg-white hover:text-gray-900 transition-all duration-300">
              Schedule Demo
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-black border-t border-gray-800">
        <div className="container mx-auto px-6 text-center">
          <div className="flex items-center justify-center space-x-3 mb-6">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center font-bold">
              C
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              CrucibleAI
            </span>
          </div>
          <p className="text-gray-400 mb-4">
            The world's most advanced AI development platform
          </p>
          <p className="text-gray-500 text-sm">
            © {new Date().getFullYear()} CrucibleAI. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default UltimateLandingPage;
