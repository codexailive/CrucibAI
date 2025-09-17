import React, { useState, useEffect } from 'react';
import { Search, Filter, Star, Download, Shield, Zap, Code, Database, Cloud, Users, BarChart, Lock, Package } from 'lucide-react';

interface Plugin {
  id: string;
  name: string;
  displayName: string;
  description: string;
  version: string;
  author: {
    name: string;
    verified: boolean;
  };
  category: string;
  tags: string[];
  pricing: {
    type: 'free' | 'paid' | 'freemium';
    price?: number;
  };
  assets: {
    icon: string;
    screenshots: string[];
  };
  stats: {
    downloads: number;
    rating: number;
    reviewCount: number;
  };
  status: string;
}

interface Integration {
  id: string;
  displayName: string;
  description: string;
  provider: string;
  category: string;
  features: string[];
  status: string;
}

const MarketplaceHub: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'plugins' | 'integrations' | 'extensions'>('plugins');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [plugins, setPlugins] = useState<Plugin[]>([]);
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [installedPlugins, setInstalledPlugins] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadMarketplaceData();
  }, []);

  const loadMarketplaceData = async () => {
    setLoading(true);
    try {
      // Mock data - in production, fetch from API
      const mockPlugins: Plugin[] = [
        {
          id: 'ai-assistant-pro',
          name: 'ai-assistant-pro',
          displayName: 'AI Assistant Pro',
          description: 'Advanced AI assistant with multi-modal capabilities and custom training',
          version: '2.1.0',
          author: { name: 'CrucibleAI Team', verified: true },
          category: 'ai',
          tags: ['ai', 'assistant', 'multimodal', 'training'],
          pricing: { type: 'paid', price: 29.99 },
          assets: {
            icon: '🤖',
            screenshots: ['screenshot1.png', 'screenshot2.png'],
          },
          stats: { downloads: 15420, rating: 4.8, reviewCount: 342 },
          status: 'approved',
        },
        {
          id: 'quantum-optimizer',
          name: 'quantum-optimizer',
          displayName: 'Quantum Optimizer',
          description: 'Advanced quantum optimization algorithms for complex problem solving',
          version: '1.5.2',
          author: { name: 'QuantumLab', verified: true },
          category: 'quantum',
          tags: ['quantum', 'optimization', 'algorithms', 'performance'],
          pricing: { type: 'freemium' },
          assets: {
            icon: '⚛️',
            screenshots: ['quantum1.png', 'quantum2.png'],
          },
          stats: { downloads: 8760, rating: 4.6, reviewCount: 156 },
          status: 'approved',
        },
        {
          id: 'arvr-studio',
          name: 'arvr-studio',
          displayName: 'AR/VR Studio Pro',
          description: 'Professional AR/VR development tools with real-time collaboration',
          version: '3.0.1',
          author: { name: 'ImmersiveTech', verified: true },
          category: 'arvr',
          tags: ['ar', 'vr', '3d', 'collaboration', 'webxr'],
          pricing: { type: 'paid', price: 49.99 },
          assets: {
            icon: '🥽',
            screenshots: ['arvr1.png', 'arvr2.png'],
          },
          stats: { downloads: 5230, rating: 4.9, reviewCount: 89 },
          status: 'approved',
        },
        {
          id: 'deployment-manager',
          name: 'deployment-manager',
          displayName: 'Deployment Manager',
          description: 'Advanced deployment automation with multi-cloud support',
          version: '1.8.0',
          author: { name: 'DevOps Solutions', verified: false },
          category: 'deployment',
          tags: ['deployment', 'automation', 'cloud', 'devops'],
          pricing: { type: 'free' },
          assets: {
            icon: '🚀',
            screenshots: ['deploy1.png', 'deploy2.png'],
          },
          stats: { downloads: 12100, rating: 4.4, reviewCount: 203 },
          status: 'approved',
        },
        {
          id: 'team-sync',
          name: 'team-sync',
          displayName: 'Team Sync',
          description: 'Enhanced team collaboration with real-time code sharing',
          version: '2.3.1',
          author: { name: 'CollabTools', verified: true },
          category: 'collaboration',
          tags: ['collaboration', 'team', 'sync', 'realtime'],
          pricing: { type: 'freemium' },
          assets: {
            icon: '👥',
            screenshots: ['team1.png', 'team2.png'],
          },
          stats: { downloads: 9870, rating: 4.7, reviewCount: 178 },
          status: 'approved',
        },
        {
          id: 'analytics-dashboard',
          name: 'analytics-dashboard',
          displayName: 'Analytics Dashboard Pro',
          description: 'Advanced analytics and reporting with custom visualizations',
          version: '1.4.3',
          author: { name: 'DataViz Inc', verified: true },
          category: 'analytics',
          tags: ['analytics', 'dashboard', 'visualization', 'reporting'],
          pricing: { type: 'paid', price: 19.99 },
          assets: {
            icon: '📊',
            screenshots: ['analytics1.png', 'analytics2.png'],
          },
          stats: { downloads: 6540, rating: 4.5, reviewCount: 124 },
          status: 'approved',
        },
      ];

      const mockIntegrations: Integration[] = [
        {
          id: 'openai',
          displayName: 'OpenAI',
          description: 'Connect to OpenAI API for advanced AI capabilities',
          provider: 'OpenAI',
          category: 'ai_provider',
          features: ['Chat Completions', 'Embeddings', 'Fine-tuning'],
          status: 'active',
        },
        {
          id: 'aws',
          displayName: 'Amazon Web Services',
          description: 'Connect to AWS services for cloud deployment and quantum computing',
          provider: 'Amazon',
          category: 'cloud_service',
          features: ['Quantum Computing (Braket)', 'Lambda Functions', 'S3 Storage'],
          status: 'active',
        },
        {
          id: 'anthropic',
          displayName: 'Anthropic Claude',
          description: 'Integrate with Anthropic Claude for advanced AI conversations',
          provider: 'Anthropic',
          category: 'ai_provider',
          features: ['Claude API', 'Constitutional AI', 'Long Context'],
          status: 'active',
        },
        {
          id: 'google-cloud',
          displayName: 'Google Cloud Platform',
          description: 'Connect to Google Cloud services for AI and infrastructure',
          provider: 'Google',
          category: 'cloud_service',
          features: ['Vertex AI', 'Cloud Functions', 'BigQuery'],
          status: 'active',
        },
        {
          id: 'stripe',
          displayName: 'Stripe',
          description: 'Payment processing and subscription management',
          provider: 'Stripe',
          category: 'other',
          features: ['Payment Processing', 'Subscriptions', 'Webhooks'],
          status: 'active',
        },
        {
          id: 'mongodb',
          displayName: 'MongoDB',
          description: 'Connect to MongoDB for document database storage',
          provider: 'MongoDB',
          category: 'database',
          features: ['Document Storage', 'Atlas Cloud', 'Aggregation'],
          status: 'active',
        },
      ];

      setPlugins(mockPlugins);
      setIntegrations(mockIntegrations);
      setInstalledPlugins(new Set(['ai-assistant-pro', 'deployment-manager']));
    } catch (error) {
      console.error('Failed to load marketplace data:', error);
    } finally {
      setLoading(false);
    }
  };

  const categories = [
    { id: 'all', name: 'All Categories', icon: Package },
    { id: 'ai', name: 'AI & ML', icon: Zap },
    { id: 'quantum', name: 'Quantum', icon: Shield },
    { id: 'arvr', name: 'AR/VR', icon: Code },
    { id: 'deployment', name: 'Deployment', icon: Cloud },
    { id: 'collaboration', name: 'Collaboration', icon: Users },
    { id: 'analytics', name: 'Analytics', icon: BarChart },
    { id: 'security', name: 'Security', icon: Lock },
  ];

  const integrationCategories = [
    { id: 'all', name: 'All Integrations' },
    { id: 'ai_provider', name: 'AI Providers' },
    { id: 'cloud_service', name: 'Cloud Services' },
    { id: 'database', name: 'Databases' },
    { id: 'other', name: 'Other' },
  ];

  const filteredPlugins = plugins.filter(plugin => {
    const matchesSearch = plugin.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         plugin.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         plugin.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = selectedCategory === 'all' || plugin.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const filteredIntegrations = integrations.filter(integration => {
    const matchesSearch = integration.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         integration.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || integration.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleInstallPlugin = async (pluginId: string) => {
    try {
      // Simulate installation
      console.log(`Installing plugin: ${pluginId}`);
      await new Promise(resolve => setTimeout(resolve, 1000));
      setInstalledPlugins(prev => new Set([...prev, pluginId]));
    } catch (error) {
      console.error('Failed to install plugin:', error);
    }
  };

  const handleUninstallPlugin = async (pluginId: string) => {
    try {
      // Simulate uninstallation
      console.log(`Uninstalling plugin: ${pluginId}`);
      await new Promise(resolve => setTimeout(resolve, 500));
      setInstalledPlugins(prev => {
        const newSet = new Set(prev);
        newSet.delete(pluginId);
        return newSet;
      });
    } catch (error) {
      console.error('Failed to uninstall plugin:', error);
    }
  };

  const getCategoryIcon = (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId);
    return category ? category.icon : Package;
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Marketplace Hub
              </h1>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Discover plugins, integrations, and extensions for CrucibleAI
              </p>
            </div>
            
            <div className="flex items-center space-x-4">
              <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors">
                Publish Plugin
              </button>
            </div>
          </div>
          
          {/* Tab Navigation */}
          <div className="flex space-x-8">
            {[
              { key: 'plugins', label: 'Plugins', icon: '🔌' },
              { key: 'integrations', label: 'Integrations', icon: '🔗' },
              { key: 'extensions', label: 'Extensions', icon: '⚡' },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.key
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder={`Search ${activeTab}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div className="flex items-center space-x-4">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              {(activeTab === 'integrations' ? integrationCategories : categories).map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            
            <button className="flex items-center space-x-2 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-600">
              <Filter className="w-4 h-4" />
              <span>Filters</span>
            </button>
          </div>
        </div>

        {/* Content */}
        {activeTab === 'plugins' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPlugins.map((plugin) => {
              const isInstalled = installedPlugins.has(plugin.id);
              const CategoryIcon = getCategoryIcon(plugin.category);
              
              return (
                <div
                  key={plugin.id}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-md transition-shadow"
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="text-3xl">{plugin.assets.icon}</div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            {plugin.displayName}
                          </h3>
                          <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                            <span>{plugin.author.name}</span>
                            {plugin.author.verified && (
                              <Shield className="w-4 h-4 text-blue-500" />
                            )}
                          </div>
                        </div>
                      </div>
                      <CategoryIcon className="w-5 h-5 text-gray-400" />
                    </div>
                    
                    <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 line-clamp-2">
                      {plugin.description}
                    </p>
                    
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                        <div className="flex items-center space-x-1">
                          <Star className="w-4 h-4 text-yellow-400 fill-current" />
                          <span>{plugin.stats.rating}</span>
                          <span>({plugin.stats.reviewCount})</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Download className="w-4 h-4" />
                          <span>{plugin.stats.downloads.toLocaleString()}</span>
                        </div>
                      </div>
                      
                      <div className="text-sm">
                        {plugin.pricing.type === 'free' && (
                          <span className="text-green-600 dark:text-green-400 font-medium">Free</span>
                        )}
                        {plugin.pricing.type === 'paid' && (
                          <span className="text-blue-600 dark:text-blue-400 font-medium">
                            {formatPrice(plugin.pricing.price!)}
                          </span>
                        )}
                        {plugin.pricing.type === 'freemium' && (
                          <span className="text-purple-600 dark:text-purple-400 font-medium">Freemium</span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-2 mb-4">
                      {plugin.tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs rounded-full"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                    
                    <div className="flex space-x-2">
                      {isInstalled ? (
                        <>
                          <button
                            onClick={() => handleUninstallPlugin(plugin.id)}
                            className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md text-sm font-medium transition-colors"
                          >
                            Uninstall
                          </button>
                          <button className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-md text-sm font-medium hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors">
                            Configure
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => handleInstallPlugin(plugin.id)}
                            className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium transition-colors"
                          >
                            Install
                          </button>
                          <button className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-md text-sm font-medium hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors">
                            Details
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {activeTab === 'integrations' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredIntegrations.map((integration) => (
              <div
                key={integration.id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {integration.displayName}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        by {integration.provider}
                      </p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      integration.status === 'active'
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                    }`}>
                      {integration.status}
                    </span>
                  </div>
                  
                  <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">
                    {integration.description}
                  </p>
                  
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Features:</h4>
                    <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                      {integration.features.slice(0, 3).map((feature, index) => (
                        <li key={index} className="flex items-center space-x-2">
                          <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div className="flex space-x-2">
                    <button className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium transition-colors">
                      Connect
                    </button>
                    <button className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-md text-sm font-medium hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors">
                      Learn More
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'extensions' && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">⚡</div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Extension Points
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Discover extension points to customize and extend CrucibleAI functionality
            </p>
            <button className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium transition-colors">
              View Documentation
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MarketplaceHub;
