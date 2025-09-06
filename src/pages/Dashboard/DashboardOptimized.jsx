import React, { memo, lazy, Suspense, useMemo, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import LoadingSpinner from '../../components/LoadingSpinner';

// Lazy load heavy components
const StatCard = lazy(() => import('./components/StatCard'));
const QuickActionsGrid = lazy(() => import('./components/QuickActionsGrid'));
const RecentActivity = lazy(() => import('./components/RecentActivity'));
const TeamMembersPanel = lazy(() => import('./components/TeamMembersPanel'));

// Optimized loading spinner component
const OptimizedLoadingSpinner = memo(({ message = "Loading..." }) => (
  <div className="flex items-center justify-center py-8">
    <div className="text-center">
      <div className="w-6 h-6 border-2 border-white/20 border-t-purple-500 rounded-full animate-spin mx-auto mb-2"></div>
      <p className="text-white/60 text-sm">{message}</p>
    </div>
  </div>
));

OptimizedLoadingSpinner.displayName = 'OptimizedLoadingSpinner';

// Error Boundary Component
class DashboardErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Dashboard Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
          <div className="text-center p-8">
            <div className="text-red-400 mb-4">Something went wrong loading the dashboard</div>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Memoized Header Component
const DashboardHeader = memo(({ userData, onLogout, onSearch }) => (
  <nav className="bg-white/5 backdrop-blur-xl border-b border-white/10 sticky top-0 z-40">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex justify-between h-16">
        <div className="flex items-center">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 bg-clip-text text-transparent">
            CrewConnect
          </h1>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search..."
              onChange={onSearch}
              className="bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500/50 w-64"
            />
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
              {userData?.photoURL ? (
                <img
                  src={userData.photoURL}
                  alt="Profile"
                  className="w-8 h-8 rounded-full object-cover"
                />
              ) : (
                <span className="text-white text-sm font-bold">
                  {userData?.displayName?.[0] || 'U'}
                </span>
              )}
            </div>
            <span className="text-white font-medium">
              {userData?.displayName || 'User'}
            </span>
            <button
              onClick={onLogout}
              className="p-2 text-gray-400 hover:text-white transition-colors"
              title="Logout"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  </nav>
));

DashboardHeader.displayName = 'DashboardHeader';

// Optimized Welcome Section
const WelcomeSection = memo(({ userData, stats }) => {
  const currentHour = new Date().getHours();
  const greeting = useMemo(() => {
    if (currentHour < 12) return 'Good morning';
    if (currentHour < 17) return 'Good afternoon';
    return 'Good evening';
  }, [currentHour]);

  return (
    <div className="mb-8">
      <h2 className="text-3xl font-bold text-white mb-2">
        {greeting}, {userData?.displayName || 'User'}!
      </h2>
      <p className="text-gray-300">
        You have {stats.totalGroups} active groups and {stats.recentActivity} recent activities
      </p>
    </div>
  );
});

WelcomeSection.displayName = 'WelcomeSection';

// Main Dashboard Component with Performance Optimizations
const OptimizedDashboard = () => {
  const { currentUser, userProfile, logout } = useAuth();
  const navigate = useNavigate();

  // Memoized user data to prevent unnecessary re-renders
  const userData = useMemo(() => {
    if (!currentUser) return null;
    
    return {
      displayName: userProfile?.displayName || userProfile?.username || currentUser?.displayName || 'User',
      email: currentUser?.email,
      photoURL: userProfile?.profilePicture?.url || userProfile?.profilePictureUrl || currentUser?.photoURL,
      uid: currentUser?.uid,
      isOnline: true
    };
  }, [currentUser, userProfile]);

  // Memoized stats data
  const stats = useMemo(() => ({
    totalGroups: 0,
    totalMessages: 0,
    onlineMembers: 1,
    recentActivity: 0
  }), []);

  // Memoized quick actions
  const quickActions = useMemo(() => [
    {
      title: "Create Group",
      description: "Start a new group chat",
      color: "from-blue-500 to-blue-600",
      onClick: () => navigate("/groups")
    },
    {
      title: "Join Group", 
      description: "Find and join existing groups",
      color: "from-green-500 to-green-600",
      onClick: () => navigate("/discover")
    },
    {
      title: "Invitations",
      description: "Manage group invitations",
      color: "from-orange-500 to-orange-600", 
      onClick: () => navigate("/invitations")
    },
    {
      title: "View Profile",
      description: "Edit your profile settings",
      color: "from-purple-500 to-purple-600",
      onClick: () => navigate("/profile")
    }
  ], [navigate]);

  // Optimized event handlers
  const handleLogout = useCallback(async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  }, [logout, navigate]);

  const handleSearch = useCallback((e) => {
    // Implement search functionality
    console.log('Search:', e.target.value);
  }, []);

  // Early return for unauthenticated users
  if (!currentUser || !userData) {
    return <LoadingSpinner message="Authenticating..." />;
  }

  return (
    <DashboardErrorBoundary>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        {/* Optimized Header */}
        <DashboardHeader 
          userData={userData}
          onLogout={handleLogout}
          onSearch={handleSearch}
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Welcome Section */}
          <WelcomeSection userData={userData} stats={stats} />

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Suspense fallback={<OptimizedLoadingSpinner message="Loading stats..." />}>
              {[
                { title: "Total Groups", value: stats.totalGroups, color: "text-blue-500" },
                { title: "Messages Sent", value: stats.totalMessages, color: "text-green-500" },
                { title: "Online Members", value: stats.onlineMembers, color: "text-purple-500" },
                { title: "Recent Activity", value: stats.recentActivity, color: "text-orange-500" }
              ].map((stat, index) => (
                <StatCard key={index} {...stat} />
              ))}
            </Suspense>
          </div>

          {/* Quick Actions */}
          <div className="mb-8">
            <h3 className="text-xl font-semibold text-white mb-4">Quick Actions</h3>
            <Suspense fallback={<OptimizedLoadingSpinner message="Loading actions..." />}>
              <QuickActionsGrid actions={quickActions} />
            </Suspense>
          </div>

          {/* Recent Activity Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Suspense fallback={<OptimizedLoadingSpinner message="Loading activity..." />}>
              <RecentActivity />
            </Suspense>
            
            <Suspense fallback={<OptimizedLoadingSpinner message="Loading team data..." />}>
              <TeamMembersPanel />
            </Suspense>
          </div>
        </div>
      </div>
    </DashboardErrorBoundary>
  );
};

export default OptimizedDashboard;
