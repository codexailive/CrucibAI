import {
    BarChart3,
    Bell,
    Cloud,
    Code,
    Database,
    Home,
    Menu,
    Monitor,
    Palette,
    Search,
    Settings,
    Shield,
    Smartphone,
    Tablet,
    Users,
    X
} from 'lucide-react';
import React, { useEffect, useState } from 'react';

interface DashboardProps {
  userRole: 'developer' | 'non-technical' | 'admin';
  deviceType: 'desktop' | 'tablet' | 'mobile';
}

interface Widget {
  id: string;
  title: string;
  type: 'metric' | 'chart' | 'list' | 'progress';
  data: any;
  size: 'small' | 'medium' | 'large';
  position: { x: number; y: number };
}

const ResponsiveDashboard: React.FC<DashboardProps> = ({ userRole, deviceType }) => {
  const [sidebarOpen, setSidebarOpen] = useState(deviceType === 'desktop');
  const [widgets, setWidgets] = useState<Widget[]>([]);
  const [activeView, setActiveView] = useState('overview');
  const [notifications] = useState(3);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadDashboardData();
    
    // Handle responsive behavior
    const handleResize = () => {
      const width = window.innerWidth;
      if (width < 768) {
        setSidebarOpen(false);
      } else if (width >= 1024) {
        setSidebarOpen(true);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const loadDashboardData = async () => {
    // Mock data based on user role
    const mockWidgets: Widget[] = userRole === 'developer' 
      ? [
          {
            id: '1',
            title: 'API Calls Today',
            type: 'metric',
            data: { value: 1247, change: '+12%' },
            size: 'small',
            position: { x: 0, y: 0 },
          },
          {
            id: '2',
            title: 'Code Deployments',
            type: 'chart',
            data: { 
              labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
              values: [12, 19, 8, 15, 22]
            },
            size: 'medium',
            position: { x: 1, y: 0 },
          },
          {
            id: '3',
            title: 'Recent Commits',
            type: 'list',
            data: [
              { title: 'Fix authentication bug', time: '2 hours ago' },
              { title: 'Add new API endpoint', time: '4 hours ago' },
              { title: 'Update documentation', time: '6 hours ago' },
            ],
            size: 'medium',
            position: { x: 0, y: 1 },
          },
          {
            id: '4',
            title: 'System Performance',
            type: 'progress',
            data: { 
              cpu: 65, 
              memory: 78, 
              disk: 45,
              network: 32
            },
            size: 'large',
            position: { x: 1, y: 1 },
          },
        ]
      : [
          {
            id: '1',
            title: 'Active Projects',
            type: 'metric',
            data: { value: 8, change: '+2 this week' },
            size: 'small',
            position: { x: 0, y: 0 },
          },
          {
            id: '2',
            title: 'Project Progress',
            type: 'chart',
            data: { 
              labels: ['Planning', 'Development', 'Testing', 'Deployed'],
              values: [2, 3, 2, 1]
            },
            size: 'medium',
            position: { x: 1, y: 0 },
          },
          {
            id: '3',
            title: 'Recent Updates',
            type: 'list',
            data: [
              { title: 'Website redesign completed', time: '1 day ago' },
              { title: 'Mobile app launched', time: '3 days ago' },
              { title: 'Database migration finished', time: '1 week ago' },
            ],
            size: 'medium',
            position: { x: 0, y: 1 },
          },
          {
            id: '4',
            title: 'Team Activity',
            type: 'progress',
            data: { 
              design: 85, 
              development: 92, 
              testing: 67,
              deployment: 78
            },
            size: 'large',
            position: { x: 1, y: 1 },
          },
        ];

    setWidgets(mockWidgets);
  };

  const navigationItems = userRole === 'developer' 
    ? [
        { id: 'overview', label: 'Overview', icon: Home },
        { id: 'code', label: 'Code Editor', icon: Code },
        { id: 'apis', label: 'APIs', icon: Database },
        { id: 'deployments', label: 'Deployments', icon: Cloud },
        { id: 'monitoring', label: 'Monitoring', icon: BarChart3 },
        { id: 'security', label: 'Security', icon: Shield },
        { id: 'settings', label: 'Settings', icon: Settings },
      ]
    : [
        { id: 'overview', label: 'Dashboard', icon: Home },
        { id: 'projects', label: 'Projects', icon: Palette },
        { id: 'team', label: 'Team', icon: Users },
        { id: 'analytics', label: 'Analytics', icon: BarChart3 },
        { id: 'settings', label: 'Settings', icon: Settings },
      ];

  const renderWidget = (widget: Widget) => {
    const sizeClasses = {
      small: deviceType === 'mobile' ? 'col-span-1' : 'col-span-1',
      medium: deviceType === 'mobile' ? 'col-span-2' : 'col-span-2',
      large: deviceType === 'mobile' ? 'col-span-2' : 'col-span-3',
    };

    return (
      <div
        key={widget.id}
        className={`${sizeClasses[widget.size]} bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6`}
      >
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          {widget.title}
        </h3>
        
        {widget.type === 'metric' && (
          <div>
            <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2">
              {widget.data.value}
            </div>
            <div className="text-sm text-green-600 dark:text-green-400">
              {widget.data.change}
            </div>
          </div>
        )}
        
        {widget.type === 'chart' && (
          <div className="space-y-2">
            {widget.data.labels.map((label: string, index: number) => (
              <div key={label} className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">{label}</span>
                <div className="flex items-center space-x-2">
                  <div className="w-20 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full" 
                      style={{ width: `${(widget.data.values[index] / Math.max(...widget.data.values)) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {widget.data.values[index]}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {widget.type === 'list' && (
          <div className="space-y-3">
            {widget.data.map((item: any, index: number) => (
              <div key={index} className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    {item.title}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {item.time}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {widget.type === 'progress' && (
          <div className="space-y-4">
            {Object.entries(widget.data).map(([key, value]) => (
              <div key={key}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600 dark:text-gray-400 capitalize">{key}</span>
                  <span className="text-gray-900 dark:text-white">{String(value)}%</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-300" 
                    style={{ width: `${value}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const getDeviceIcon = () => {
    switch (deviceType) {
      case 'mobile': return <Smartphone className="w-4 h-4" />;
      case 'tablet': return <Tablet className="w-4 h-4" />;
      default: return <Monitor className="w-4 h-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
      {/* Sidebar */}
      <div className={`${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-800 shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0`}>
        
        {/* Sidebar Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">C</span>
            </div>
            <span className="text-lg font-semibold text-gray-900 dark:text-white">
              CrucibleAI
            </span>
          </div>
          
          {deviceType !== 'desktop' && (
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setActiveView(item.id)}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                  activeView === item.id
                    ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* User Info */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">U</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {userRole === 'developer' ? 'Developer' : 'User'}
              </div>
              <div className="flex items-center space-x-1 text-xs text-gray-500 dark:text-gray-400">
                {getDeviceIcon()}
                <span className="capitalize">{deviceType}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center space-x-4">
              {deviceType !== 'desktop' && (
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <Menu className="w-5 h-5" />
                </button>
              )}
              
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white capitalize">
                {activeView}
              </h1>
            </div>

            <div className="flex items-center space-x-4">
              {/* Search - Hidden on mobile */}
              {deviceType !== 'mobile' && (
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              )}

              {/* Notifications */}
              <button className="relative p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                <Bell className="w-5 h-5" />
                {notifications > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {notifications}
                  </span>
                )}
              </button>

              {/* Settings */}
              <button className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                <Settings className="w-5 h-5" />
              </button>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <main className="flex-1 overflow-auto p-4">
          {activeView === 'overview' && (
            <div className={`grid gap-6 ${
              deviceType === 'mobile' 
                ? 'grid-cols-2' 
                : deviceType === 'tablet' 
                  ? 'grid-cols-3' 
                  : 'grid-cols-4'
            }`}>
              {widgets.map(renderWidget)}
            </div>
          )}

          {activeView === 'code' && userRole === 'developer' && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Code Editor
              </h2>
              <div className="bg-gray-900 rounded-lg p-4 font-mono text-sm text-green-400">
                <div className="mb-2">// Welcome to CrucibleAI Code Editor</div>
                <div className="mb-2">console.log("Hello, World!");</div>
                <div className="mb-2"></div>
                <div className="mb-2">function fibonacci(n) {`{`}</div>
                <div className="mb-2">  if (n &lt;= 1) return n;</div>
                <div className="mb-2">  return fibonacci(n - 1) + fibonacci(n - 2);</div>
                <div className="mb-2">{`}`}</div>
                <div className="mb-2"></div>
                <div>console.log("Fibonacci(10):", fibonacci(10));</div>
              </div>
            </div>
          )}

          {activeView === 'projects' && userRole === 'non-technical' && (
            <div className="space-y-6">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                  Your Projects
                </h2>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {['Website Redesign', 'Mobile App', 'Marketing Campaign'].map((project, index) => (
                    <div key={project} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                      <h3 className="font-medium text-gray-900 dark:text-white mb-2">{project}</h3>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${(index + 1) * 30}%` }}
                        ></div>
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {(index + 1) * 30}% complete
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Placeholder for other views */}
          {!['overview', 'code', 'projects'].includes(activeView) && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 capitalize">
                {activeView}
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                This section is under development. More features coming soon!
              </p>
            </div>
          )}
        </main>
      </div>

      {/* Mobile Overlay */}
      {sidebarOpen && deviceType !== 'desktop' && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default ResponsiveDashboard;
