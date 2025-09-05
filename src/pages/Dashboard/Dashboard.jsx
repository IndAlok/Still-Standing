import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  MessageCircle,
  Calendar,
  Settings,
  LogOut,
  Search,
  Bell,
  Plus,
  User,
  Shield,
  Activity,
  TrendingUp,
  UserPlus,
  MessageSquare,
} from 'lucide-react';

const Dashboard = () => {
  const { currentUser, logout, getUserData } = useAuth();
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const [stats, setStats] = useState({
    totalGroups: 0,
    totalMessages: 0,
    onlineMembers: 0,
    recentActivity: 0
  });

  useEffect(() => {
    const fetchUserData = async () => {
      if (currentUser) {
        const data = await getUserData();
        setUserData(data);
        // Mock stats for now
        setStats({
          totalGroups: 5,
          totalMessages: 142,
          onlineMembers: 23,
          recentActivity: 8
        });
      }
    };

    fetchUserData();
  }, [currentUser, getUserData]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Failed to logout:', error);
    }
  };

  const quickActions = [
    {
      title: 'Create Group',
      description: 'Start a new group chat',
      icon: Plus,
      color: 'from-blue-500 to-blue-600',
      onClick: () => navigate('/groups')
    },
    {
      title: 'Join Group',
      description: 'Find and join existing groups',
      icon: UserPlus,
      color: 'from-green-500 to-green-600',
      onClick: () => navigate('/groups')
    },
    {
      title: 'Start Chat',
      description: 'Begin a conversation',
      icon: MessageSquare,
      color: 'from-purple-500 to-purple-600',
      onClick: () => navigate('/chat')
    },
    {
      title: 'Settings',
      description: 'Manage your account',
      icon: Settings,
      color: 'from-orange-500 to-orange-600',
      onClick: () => navigate('/settings')
    }
  ];

  const statCards = [
    {
      title: 'Total Groups',
      value: stats.totalGroups,
      icon: Users,
      color: 'text-blue-500',
      bg: 'bg-blue-500/10',
      trend: '+2 this week'
    },
    {
      title: 'Messages Sent',
      value: stats.totalMessages,
      icon: MessageCircle,
      color: 'text-green-500',
      bg: 'bg-green-500/10',
      trend: '+23 today'
    },
    {
      title: 'Online Members',
      value: stats.onlineMembers,
      icon: Activity,
      color: 'text-purple-500',
      bg: 'bg-purple-500/10',
      trend: 'Active now'
    },
    {
      title: 'Recent Activity',
      value: stats.recentActivity,
      icon: TrendingUp,
      color: 'text-orange-500',
      bg: 'bg-orange-500/10',
      trend: 'Last hour'
    }
  ];

  if (!userData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-white/20 border-t-purple-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Navigation Header */}
      <nav className="bg-white/5 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 bg-clip-text text-transparent">
                CrewConnect
              </h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search..."
                  className="bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500/50 w-64"
                />
              </div>
              
              <button className="p-2 text-gray-400 hover:text-white transition-colors relative">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
              
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                  {userData.photoURL ? (
                    <img
                      src={userData.photoURL}
                      alt="Profile"
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <User className="w-4 h-4 text-white" />
                  )}
                </div>
                <span className="text-white font-medium">
                  {userData.displayName || currentUser.email}
                </span>
                <button
                  onClick={handleLogout}
                  className="p-2 text-gray-400 hover:text-white transition-colors"
                  title="Logout"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-white mb-2">
            Welcome back, {userData.displayName || 'User'}!
          </h2>
          <p className="text-gray-400">
            Here's what's happening with your groups and conversations.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statCards.map((stat, index) => (
            <div
              key={index}
              className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6 hover:bg-white/10 transition-all duration-200"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-gray-400 text-sm font-medium">{stat.title}</p>
                  <p className="text-2xl font-bold text-white mt-1">{stat.value}</p>
                  <p className="text-xs text-gray-500 mt-1">{stat.trend}</p>
                </div>
                <div className={`p-3 rounded-xl ${stat.bg}`}>
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold text-white mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action, index) => (
              <button
                key={index}
                onClick={action.onClick}
                className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-6 text-left hover:bg-white/10 transition-all duration-200 hover:scale-[1.02] group"
              >
                <div className={`w-12 h-12 bg-gradient-to-r ${action.color} rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-200`}>
                  <action.icon className="w-6 h-6 text-white" />
                </div>
                <h4 className="text-white font-semibold mb-2">{action.title}</h4>
                <p className="text-gray-400 text-sm">{action.description}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
            <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
              <MessageCircle className="w-5 h-5 mr-2 text-blue-400" />
              Recent Messages
            </h3>
            <div className="space-y-4">
              {[1, 2, 3].map((_, index) => (
                <div key={index} className="flex items-center space-x-3 p-3 hover:bg-white/5 rounded-lg transition-colors">
                  <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-white text-sm font-medium">Group Chat #{index + 1}</p>
                    <p className="text-gray-400 text-xs">Last message 2 minutes ago</p>
                  </div>
                  <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
            <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
              <Users className="w-5 h-5 mr-2 text-green-400" />
              Your Groups
            </h3>
            <div className="space-y-4">
              {[1, 2, 3].map((_, index) => (
                <div key={index} className="flex items-center justify-between p-3 hover:bg-white/5 rounded-lg transition-colors">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-teal-500 rounded-full flex items-center justify-center">
                      <Shield className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-white text-sm font-medium">Tech Team</p>
                      <p className="text-gray-400 text-xs">12 members</p>
                    </div>
                  </div>
                  <span className="text-xs text-green-400">Active</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
