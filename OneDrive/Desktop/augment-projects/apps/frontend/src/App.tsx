
import { useEffect, useState } from 'react';
import AdvancedAnalyticsDashboard from './components/analytics/AdvancedAnalyticsDashboard';
import ARVREditor from './components/arvr/ARVREditor';
import ResponsiveDashboard from './components/dashboard/ResponsiveDashboard';
import AdvancedCodeEditor from './components/editor/AdvancedCodeEditor';
import UltimateLandingPage from './components/landing/UltimateLandingPage';
import MarketplaceHub from './components/marketplace/MarketplaceHub';
import CompetitiveComparison from './components/pricing/CompetitiveComparison';
import OveragePricing from './components/pricing/OveragePricing';
import PricingTable from './components/pricing/PricingTable';

type AppView = 'landing' | 'dashboard' | 'editor' | 'analytics' | 'marketplace' | 'arvr' | 'pricing';
type UserRole = 'developer' | 'non-technical' | 'admin';
type DeviceType = 'desktop' | 'tablet' | 'mobile';

function App() {
  const [currentView, setCurrentView] = useState<AppView>('landing');
  const [userRole, setUserRole] = useState<UserRole>('developer');
  const [deviceType, setDeviceType] = useState<DeviceType>('desktop');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Detect device type
    const detectDeviceType = () => {
      const width = window.innerWidth;
      if (width < 768) {
        setDeviceType('mobile');
      } else if (width < 1024) {
        setDeviceType('tablet');
      } else {
        setDeviceType('desktop');
      }
    };

    detectDeviceType();
    window.addEventListener('resize', detectDeviceType);
    return () => window.removeEventListener('resize', detectDeviceType);
  }, []);

  const handleLogin = (role: UserRole) => {
    setUserRole(role);
    setIsAuthenticated(true);
    setCurrentView('dashboard');
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentView('landing');
  };

  const renderNavigation = () => {
    if (!isAuthenticated || currentView === 'landing') return null;

    return (
      <nav className="fixed top-4 right-4 z-50 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-2">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setCurrentView('dashboard')}
            className={`px-3 py-2 rounded text-sm font-medium transition-colors ${
              currentView === 'dashboard'
                ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            Dashboard
          </button>
          <button
            onClick={() => setCurrentView('editor')}
            className={`px-3 py-2 rounded text-sm font-medium transition-colors ${
              currentView === 'editor'
                ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            Editor
          </button>
          <button
            onClick={() => setCurrentView('analytics')}
            className={`px-3 py-2 rounded text-sm font-medium transition-colors ${
              currentView === 'analytics'
                ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            Analytics
          </button>
          <button
            onClick={() => setCurrentView('marketplace')}
            className={`px-3 py-2 rounded text-sm font-medium transition-colors ${
              currentView === 'marketplace'
                ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            Marketplace
          </button>
          <button
            onClick={() => setCurrentView('arvr')}
            className={`px-3 py-2 rounded text-sm font-medium transition-colors ${
              currentView === 'arvr'
                ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            AR/VR
          </button>
          <button
            onClick={() => setCurrentView('pricing')}
            className={`px-3 py-2 rounded text-sm font-medium transition-colors ${
              currentView === 'pricing'
                ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            Pricing
          </button>
          <button
            onClick={handleLogout}
            className="px-3 py-2 rounded text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          >
            Logout
          </button>
        </div>
      </nav>
    );
  };

  const renderCurrentView = () => {
    switch (currentView) {
      case 'landing':
        return <UltimateLandingPage />;

      case 'dashboard':
        return <ResponsiveDashboard userRole={userRole} deviceType={deviceType} />;

      case 'editor':
        return <AdvancedCodeEditor />;

      case 'analytics':
        return <AdvancedAnalyticsDashboard />;

      case 'marketplace':
        return <MarketplaceHub />;

      case 'arvr':
        return <ARVREditor projectId="demo-project" onSceneUpdate={(scene) => console.log('Scene updated:', scene)} />;

      case 'pricing':
        return (
          <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <div className="container mx-auto px-4 py-8">
              <header className="text-center mb-12">
                <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
                  CrucibleAI Pricing
                </h1>
                <p className="text-xl text-gray-600 dark:text-gray-400">
                  Choose the perfect plan for your needs
                </p>
              </header>

              <div className="space-y-16">
                <section>
                  <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-8">
                    Choose Your Plan
                  </h2>
                  <PricingTable />
                </section>

                <section>
                  <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-8">
                    Transparent Overage Pricing
                  </h2>
                  <OveragePricing />
                </section>

                <section>
                  <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-8">
                    Why Choose CrucibleAI?
                  </h2>
                  <CompetitiveComparison />
                </section>
              </div>
            </div>
          </div>
        );

      default:
        return <UltimateLandingPage />;
    }
  };

  return (
    <div className="min-h-screen">
      {renderNavigation()}

      {/* Login Modal for Landing Page */}
      {currentView === 'landing' && (
        <div className="fixed top-4 left-4 z-50 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
            Quick Demo Access
          </h3>
          <div className="space-y-2">
            <button
              onClick={() => handleLogin('developer')}
              className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              Login as Developer
            </button>
            <button
              onClick={() => handleLogin('non-technical')}
              className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              Login as Business User
            </button>
            <button
              onClick={() => handleLogin('admin')}
              className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              Login as Admin
            </button>
          </div>
        </div>
      )}

      {renderCurrentView()}
    </div>
  );
}

export default App;