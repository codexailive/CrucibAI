import React, { useEffect, useState } from 'react';

interface AnalyticsData {
  usageAnalytics: {
    totalUsers: number;
    activeUsers: number;
    aiCallsTotal: number;
    quantumSimulationsTotal: number;
    arvrMinutesTotal: number;
    deploymentsTotal: number;
    storageUsedGB: number;
    bandwidthUsedGB: number;
    topFeatures: Array<{ feature: string; usage: number }>;
    userGrowthRate: number;
    retentionRate: number;
  };
  performanceMetrics: {
    averageResponseTime: number;
    uptime: number;
    errorRate: number;
    throughput: number;
    cpuUsage: number;
    memoryUsage: number;
    diskUsage: number;
    networkLatency: number;
    apiEndpointMetrics: Array<{
      endpoint: string;
      avgResponseTime: number;
      requestCount: number;
      errorCount: number;
    }>;
  };
  businessIntelligence: {
    totalRevenue: number;
    monthlyRecurringRevenue: number;
    averageRevenuePerUser: number;
    customerLifetimeValue: number;
    churnRate: number;
    conversionRate: number;
    revenueByTier: Array<{ tier: string; revenue: number; users: number }>;
    overageRevenue: number;
    forecastedRevenue: number;
    costAnalysis: {
      totalCosts: number;
      profitMargin: number;
      costPerUser: number;
    };
  };
  predictiveInsights: {
    userGrowthForecast: Array<{ month: string; predictedUsers: number; confidence: number }>;
    revenueForecast: Array<{ month: string; predictedRevenue: number; confidence: number }>;
    churnPrediction: Array<{ userId: string; churnProbability: number; riskFactors: string[] }>;
    usageAnomalies: Array<{ type: string; severity: 'low' | 'medium' | 'high'; description: string }>;
    recommendedActions: Array<{ action: string; impact: string; priority: number }>;
  };
}

const AdvancedAnalyticsDashboard: React.FC = () => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'usage' | 'performance' | 'business' | 'predictive'>('usage');
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d' | '90d'>('30d');
  const [realTimeMetrics] = useState<any[]>([]);

  useEffect(() => {
    loadAnalyticsData();
    const interval = setInterval(loadRealTimeMetrics, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, [timeRange]);

  const loadAnalyticsData = async () => {
    setLoading(true);
    try {
      // Simulate API calls
      const mockData: AnalyticsData = {
        usageAnalytics: {
          totalUsers: 2150,
          activeUsers: 1890,
          aiCallsTotal: 125000,
          quantumSimulationsTotal: 3200,
          arvrMinutesTotal: 15600,
          deploymentsTotal: 890,
          storageUsedGB: 2500,
          bandwidthUsedGB: 1200,
          topFeatures: [
            { feature: 'AI Orchestration', usage: 45.2 },
            { feature: 'Code Generation', usage: 32.1 },
            { feature: 'Quantum Computing', usage: 18.7 },
            { feature: 'AR/VR Development', usage: 15.3 },
            { feature: 'Team Collaboration', usage: 12.8 },
          ],
          userGrowthRate: 15.3,
          retentionRate: 85.5,
        },
        performanceMetrics: {
          averageResponseTime: 245,
          uptime: 99.97,
          errorRate: 0.03,
          throughput: 1250,
          cpuUsage: 65.2,
          memoryUsage: 72.8,
          diskUsage: 45.1,
          networkLatency: 12.5,
          apiEndpointMetrics: [
            { endpoint: '/api/ai/orchestrate', avgResponseTime: 1250, requestCount: 15420, errorCount: 12 },
            { endpoint: '/api/quantum/optimize', avgResponseTime: 3200, requestCount: 2340, errorCount: 3 },
            { endpoint: '/api/arvr/scene', avgResponseTime: 890, requestCount: 8760, errorCount: 8 },
            { endpoint: '/api/deployment/deploy', avgResponseTime: 5600, requestCount: 1230, errorCount: 2 },
          ],
        },
        businessIntelligence: {
          totalRevenue: 125000,
          monthlyRecurringRevenue: 45000,
          averageRevenuePerUser: 89.50,
          customerLifetimeValue: 1250,
          churnRate: 3.2,
          conversionRate: 12.5,
          revenueByTier: [
            { tier: 'Discovery', revenue: 0, users: 1250 },
            { tier: 'Starter', revenue: 8700, users: 300 },
            { tier: 'Professional', revenue: 17700, users: 300 },
            { tier: 'Business', revenue: 22350, users: 150 },
            { tier: 'Team', revenue: 31920, users: 80 },
            { tier: 'Enterprise', revenue: 39960, users: 40 },
            { tier: 'Unlimited', revenue: 24990, users: 10 },
          ],
          overageRevenue: 8750,
          forecastedRevenue: 52000,
          costAnalysis: {
            totalCosts: 50000,
            profitMargin: 60.0,
            costPerUser: 22.50,
          },
        },
        predictiveInsights: {
          userGrowthForecast: [
            { month: 'Jan', predictedUsers: 2000, confidence: 0.85 },
            { month: 'Feb', predictedUsers: 2150, confidence: 0.80 },
            { month: 'Mar', predictedUsers: 2300, confidence: 0.75 },
            { month: 'Apr', predictedUsers: 2450, confidence: 0.70 },
            { month: 'May', predictedUsers: 2600, confidence: 0.65 },
            { month: 'Jun', predictedUsers: 2750, confidence: 0.60 },
          ],
          revenueForecast: [
            { month: 'Jan', predictedRevenue: 45000, confidence: 0.82 },
            { month: 'Feb', predictedRevenue: 48500, confidence: 0.78 },
            { month: 'Mar', predictedRevenue: 52000, confidence: 0.74 },
            { month: 'Apr', predictedRevenue: 55500, confidence: 0.70 },
            { month: 'May', predictedRevenue: 59000, confidence: 0.66 },
            { month: 'Jun', predictedRevenue: 62500, confidence: 0.62 },
          ],
          churnPrediction: [
            { userId: 'user_123', churnProbability: 0.75, riskFactors: ['Low usage', 'No recent logins', 'Support tickets'] },
            { userId: 'user_456', churnProbability: 0.65, riskFactors: ['Decreased usage', 'Billing issues'] },
            { userId: 'user_789', churnProbability: 0.55, riskFactors: ['Feature complaints', 'Competitor interest'] },
          ],
          usageAnomalies: [
            { type: 'Unusual spike', severity: 'medium', description: 'AI calls increased 300% in last hour' },
            { type: 'Service degradation', severity: 'high', description: 'Quantum service response time increased 500%' },
            { type: 'Geographic anomaly', severity: 'low', description: 'Unusual traffic from new region' },
          ],
          recommendedActions: [
            { action: 'Optimize quantum service performance', impact: 'Reduce response time by 40%', priority: 1 },
            { action: 'Implement user retention campaign', impact: 'Reduce churn by 15%', priority: 2 },
            { action: 'Add new AI providers', impact: 'Increase reliability by 25%', priority: 3 },
          ],
        },
      };

      setData(mockData);
    } catch (error) {
      console.error('Failed to load analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadRealTimeMetrics = async () => {
    // Simulate real-time metrics
    const newMetrics = [
      { name: 'CPU Usage', value: Math.random() * 100, timestamp: new Date() },
      { name: 'Memory Usage', value: Math.random() * 100, timestamp: new Date() },
      { name: 'Active Users', value: Math.floor(Math.random() * 100) + 1800, timestamp: new Date() },
    ];
    // Real-time metrics update disabled for now
    // setRealTimeMetrics(prev => [...prev.slice(-20), ...newMetrics]);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('en-US').format(value);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return '#ef4444';
      case 'medium': return '#f59e0b';
      case 'low': return '#10b981';
      default: return '#6b7280';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-500">Failed to load analytics data</div>
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
                Advanced Analytics Dashboard
              </h1>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Comprehensive insights into your CrucibleAI platform
              </p>
            </div>
            
            <div className="flex items-center space-x-4">
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="24h">Last 24 Hours</option>
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
                <option value="90d">Last 90 Days</option>
              </select>
              
              <button
                onClick={loadAnalyticsData}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
              >
                Refresh
              </button>
            </div>
          </div>
          
          {/* Tab Navigation */}
          <div className="flex space-x-8">
            {[
              { key: 'usage', label: 'Usage Analytics', icon: '📊' },
              { key: 'performance', label: 'Performance', icon: '⚡' },
              { key: 'business', label: 'Business Intelligence', icon: '💰' },
              { key: 'predictive', label: 'Predictive Insights', icon: '🔮' },
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

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Usage Analytics Tab */}
        {activeTab === 'usage' && (
          <div className="space-y-8">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-md flex items-center justify-center">
                      <span className="text-blue-600 dark:text-blue-400">👥</span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Users</p>
                    <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                      {formatNumber(data.usageAnalytics.totalUsers)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-md flex items-center justify-center">
                      <span className="text-green-600 dark:text-green-400">🟢</span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Active Users</p>
                    <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                      {formatNumber(data.usageAnalytics.activeUsers)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-md flex items-center justify-center">
                      <span className="text-purple-600 dark:text-purple-400">🧠</span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">AI Calls</p>
                    <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                      {formatNumber(data.usageAnalytics.aiCallsTotal)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-indigo-100 dark:bg-indigo-900 rounded-md flex items-center justify-center">
                      <span className="text-indigo-600 dark:text-indigo-400">⚛️</span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Quantum Simulations</p>
                    <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                      {formatNumber(data.usageAnalytics.quantumSimulationsTotal)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Top Features Chart */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Top Features Usage</h3>
              <div className="h-[300px] bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600 mb-2">
                    {data.usageAnalytics.topFeatures.length} Features
                  </div>
                  <div className="text-gray-600 dark:text-gray-400">
                    Usage Analytics Chart
                  </div>
                </div>
              </div>
            </div>

            {/* Growth Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">User Growth Rate</h3>
                <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                  +{data.usageAnalytics.userGrowthRate}%
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">vs previous period</p>
              </div>

              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Retention Rate</h3>
                <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                  {data.usageAnalytics.retentionRate}%
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">user retention</p>
              </div>
            </div>
          </div>
        )}

        {/* Performance Tab */}
        {activeTab === 'performance' && (
          <div className="space-y-8">
            {/* System Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Response Time</h3>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                  {data.performanceMetrics.averageResponseTime}ms
                </p>
              </div>

              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Uptime</h3>
                <p className="text-2xl font-semibold text-green-600 dark:text-green-400">
                  {data.performanceMetrics.uptime}%
                </p>
              </div>

              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Error Rate</h3>
                <p className="text-2xl font-semibold text-red-600 dark:text-red-400">
                  {data.performanceMetrics.errorRate}%
                </p>
              </div>

              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Throughput</h3>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                  {formatNumber(data.performanceMetrics.throughput)}/min
                </p>
              </div>
            </div>

            {/* API Endpoint Performance */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">API Endpoint Performance</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Endpoint
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Avg Response Time
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Requests
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Errors
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {data.performanceMetrics.apiEndpointMetrics.map((endpoint, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                          {endpoint.endpoint}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {endpoint.avgResponseTime}ms
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {formatNumber(endpoint.requestCount)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {endpoint.errorCount}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Real-time System Metrics */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Real-time System Metrics</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {data.performanceMetrics.cpuUsage.toFixed(1)}%
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">CPU Usage</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {data.performanceMetrics.memoryUsage.toFixed(1)}%
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Memory Usage</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                    {data.performanceMetrics.diskUsage.toFixed(1)}%
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Disk Usage</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Business Intelligence Tab */}
        {activeTab === 'business' && (
          <div className="space-y-8">
            {/* Revenue Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Revenue</h3>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                  {formatCurrency(data.businessIntelligence.totalRevenue)}
                </p>
              </div>

              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">MRR</h3>
                <p className="text-2xl font-semibold text-green-600 dark:text-green-400">
                  {formatCurrency(data.businessIntelligence.monthlyRecurringRevenue)}
                </p>
              </div>

              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">ARPU</h3>
                <p className="text-2xl font-semibold text-blue-600 dark:text-blue-400">
                  {formatCurrency(data.businessIntelligence.averageRevenuePerUser)}
                </p>
              </div>

              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">CLV</h3>
                <p className="text-2xl font-semibold text-purple-600 dark:text-purple-400">
                  {formatCurrency(data.businessIntelligence.customerLifetimeValue)}
                </p>
              </div>
            </div>

            {/* Revenue by Tier */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Revenue by Tier</h3>
              <div className="h-[300px] bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600 mb-2">
                    {formatCurrency(data.businessIntelligence.revenueByTier.reduce((sum: number, item: any) => sum + item.revenue, 0))}
                  </div>
                  <div className="text-gray-600 dark:text-gray-400">
                    Total Revenue by Tier
                  </div>
                </div>
              </div>
            </div>

            {/* Cost Analysis */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Cost Analysis</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                    {formatCurrency(data.businessIntelligence.costAnalysis.totalCosts)}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Total Costs</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {data.businessIntelligence.costAnalysis.profitMargin.toFixed(1)}%
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Profit Margin</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {formatCurrency(data.businessIntelligence.costAnalysis.costPerUser)}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Cost per User</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Predictive Insights Tab */}
        {activeTab === 'predictive' && (
          <div className="space-y-8">
            {/* Forecasts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">User Growth Forecast</h3>
                <div className="h-[250px] bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600 mb-2">
                      {data.predictiveInsights.userGrowthForecast[data.predictiveInsights.userGrowthForecast.length - 1]?.predictedUsers || 0}
                    </div>
                    <div className="text-gray-600 dark:text-gray-400">
                      Predicted Users (Next Month)
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Revenue Forecast</h3>
                <div className="h-[250px] bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600 mb-2">
                      {formatCurrency(data.predictiveInsights.revenueForecast[data.predictiveInsights.revenueForecast.length - 1]?.predictedRevenue || 0)}
                    </div>
                    <div className="text-gray-600 dark:text-gray-400">
                      Predicted Revenue (Next Month)
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Usage Anomalies */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Usage Anomalies</h3>
              <div className="space-y-4">
                {data.predictiveInsights.usageAnomalies.map((anomaly, index) => (
                  <div key={index} className="flex items-center space-x-4 p-4 rounded-lg bg-gray-50 dark:bg-gray-700">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: getSeverityColor(anomaly.severity) }}
                    ></div>
                    <div className="flex-1">
                      <div className="font-medium text-gray-900 dark:text-white">{anomaly.type}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">{anomaly.description}</div>
                    </div>
                    <div className="text-sm font-medium text-gray-500 dark:text-gray-400 capitalize">
                      {anomaly.severity}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recommended Actions */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Recommended Actions</h3>
              <div className="space-y-4">
                {data.predictiveInsights.recommendedActions.map((action, index) => (
                  <div key={index} className="flex items-center justify-between p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                    <div className="flex-1">
                      <div className="font-medium text-gray-900 dark:text-white">{action.action}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">{action.impact}</div>
                    </div>
                    <div className="text-sm font-medium text-blue-600 dark:text-blue-400">
                      Priority {action.priority}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdvancedAnalyticsDashboard;
