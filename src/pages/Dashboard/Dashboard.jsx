import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import crewConnectService from '../../services/crewConnectService';
import NotificationDropdown from '../../components/NotificationDropdown/NotificationDropdown';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../../config/firebase';
import {
  Users,
  MessageCircle,
  Calendar,
  Settings,
  LogOut,
  Search,
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
  const [userGroups, setUserGroups] = useState([]);
  const [recentMessages, setRecentMessages] = useState([]);
  const [pendingInvitations, setPendingInvitations] = useState(0);
  const [showProfileEdit, setShowProfileEdit] = useState(false);
  const [stats, setStats] = useState({
    totalGroups: 0,
    totalMessages: 0,
    onlineMembers: 0,
    recentActivity: 0
  });
  const [statsHistory, setStatsHistory] = useState({
    groupsLastWeek: 0,
    messagesYesterday: 0,
    activityLastHour: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      console.log('Dashboard useEffect triggered, currentUser:', currentUser?.uid);
      
      if (!currentUser?.uid) {
        console.log('No current user, setting loading to false');
        setLoading(false);
        return;
      }

      try {
        console.log('Setting loading to true and fetching dashboard data');
        setLoading(true);
        
        // Set basic user data immediately 
        const basicUserData = {
          displayName: currentUser.displayName || currentUser.email?.split('@')[0] || 'User',
          email: currentUser.email,
          photoURL: currentUser.photoURL,
          uid: currentUser.uid,
          isOnline: true
        };
        
        setUserData(basicUserData);
        console.log('Basic user data set:', basicUserData);

        // Fetch user's groups
        const userGroups = await crewConnectService.getUserCrews();
        setUserGroups(userGroups);
        console.log('User groups fetched:', userGroups);

        // Fetch pending invitations and recent messages in parallel
        const [invitationsResult, ...messageResults] = await Promise.allSettled([
          crewConnectService.getUserInvitations('pending'),
          ...userGroups.slice(0, 3).map(group => 
            crewConnectService.getCrewMessages(group.id, 1)
          )
        ]);

        // Handle invitations result
        if (invitationsResult.status === 'fulfilled') {
          const pendingCount = invitationsResult.value.length;
          setPendingInvitations(pendingCount);
          console.log('Pending invitations count:', pendingCount);
        } else {
          console.warn('Failed to fetch invitations:', invitationsResult.reason);
          setPendingInvitations(0);
        }

        // Handle message results
        const recentMessages = [];
        messageResults.forEach((result, index) => {
          if (result.status === 'fulfilled' && result.value.length > 0) {
            const group = userGroups[index];
            const latestMessage = result.value[0];
            recentMessages.push({
              groupId: group.id,
              groupName: group.name,
              lastMessage: {
                sender: {
                  displayName: latestMessage.sender?.displayName || 'Unknown'
                },
                content: latestMessage.content || 'No messages yet'
              },
              onlineCount: group.members?.filter(m => m.isOnline)?.length || 0,
              timestamp: latestMessage.sentAt?.toDate ? latestMessage.sentAt.toDate() : new Date(latestMessage.sentAt)
            });
          } else if (index < userGroups.length) {
            // Group has no messages or failed to load
            const group = userGroups[index];
            recentMessages.push({
              groupId: group.id,
              groupName: group.name,
              lastMessage: {
                sender: { displayName: '' },
                content: 'No messages yet'
              },
              onlineCount: group.members?.filter(m => m.isOnline)?.length || 0,
              timestamp: new Date(0) // Very old date so it appears last
            });
          }
        });

        // Sort by timestamp (most recent first)
        const sortedMessages = recentMessages
          .sort((a, b) => b.timestamp - a.timestamp)
          .slice(0, 10);
        
        setRecentMessages(sortedMessages);
        console.log('Recent messages fetched:', sortedMessages);

        // Calculate real stats
        const totalMessages = recentMessages.length;
        let onlineMembers = 1; // At least the current user
        let recentActivity = 0;
        
        // Count online members and recent activity from groups
        for (const group of userGroups) {
          try {
            const members = await crewConnectService.getCrewMembers(group.id);
            onlineMembers += members.filter(member => 
              member.isOnline && member.uid !== currentUser.uid
            ).length;
            
            // Count recent activity (messages in last 24 hours)
            const groupMessages = await crewConnectService.getCrewMessages(group.id, 50);
            const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
            const recentGroupActivity = groupMessages.filter(msg => {
              const msgDate = msg.sentAt?.toDate ? msg.sentAt.toDate() : new Date(msg.sentAt);
              return msgDate > oneDayAgo;
            }).length;
            recentActivity += recentGroupActivity;
          } catch (error) {
            console.warn(`Failed to fetch data for group ${group.id}:`, error);
          }
        }
        
        setStats({
          totalGroups: userGroups.length,
          totalMessages: totalMessages,
          onlineMembers: Math.max(1, onlineMembers), // At least 1 (current user)
          recentActivity: recentActivity
        });
        
        console.log('Dashboard stats calculated:', {
          totalGroups: userGroups.length,
          totalMessages: totalMessages,
          onlineMembers: Math.max(1, onlineMembers),
          recentActivity: recentActivity
        });
        
      } catch (error) {
        console.error('Error in dashboard data fetch:', error);
        // Set fallback data on error
        setUserGroups([]);
        setRecentMessages([]);
        setStats({
          totalGroups: 0,
          totalMessages: 0,
          onlineMembers: 1,
          recentActivity: 0
        });
      } finally {
        console.log('Setting loading to false');
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [currentUser?.uid]);

  // Real-time invitation listener
  useEffect(() => {
    if (!currentUser?.uid) return;

    console.log('Setting up invitation listener for user:', currentUser.uid);
    
    // Simple query without orderBy to avoid composite index requirement
    const invitationsQuery = query(
      collection(db, 'invitations'),
      where('invitedUserId', '==', currentUser.uid)
    );

    const unsubscribe = onSnapshot(invitationsQuery, (snapshot) => {
      console.log('🔔 DEBUG: Real-time listener triggered, total docs:', snapshot.size);
      
      // Filter for pending status in memory to avoid composite index
      const pendingInvitations = snapshot.docs.filter(doc => {
        const data = doc.data();
        console.log('🔔 DEBUG: Document:', { id: doc.id, status: data.status, invitedUserId: data.invitedUserId });
        return data.status === 'pending';
      });
      
      const pendingCount = pendingInvitations.length;
      console.log('🔔 DEBUG: Pending invitations after filtering:', pendingCount);
      setPendingInvitations(pendingCount);
    }, (error) => {
      console.warn('Error in invitation listener:', error);
    });

    return () => {
      console.log('Cleaning up invitation listener');
      unsubscribe();
    };
  }, [currentUser?.uid]);

  const handleLogout = async () => {
    try {
      console.log('Logging out...');
      await logout();
      console.log('Logout successful, navigating to login');
      navigate('/login', { replace: true });
    } catch (error) {
      console.error('Failed to logout:', error);
      // Force navigation even if logout fails
      navigate('/login', { replace: true });
    }
  };

  const quickActions = useMemo(() => [
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
      onClick: () => navigate('/discover')
    },
    {
      title: 'Invitations',
      description: `Manage group invitations${pendingInvitations > 0 ? ` (${pendingInvitations} pending)` : ''}`,
      icon: User,
      color: 'from-orange-500 to-orange-600',
      onClick: () => navigate('/invitations'),
      badge: pendingInvitations > 0 ? pendingInvitations : null
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
  ], [pendingInvitations, navigate]);

  const getGroupsTrend = () => {
    const newGroups = stats.totalGroups - statsHistory.groupsLastWeek;
    return newGroups > 0 ? `+${newGroups} this week` : 'No new groups';
  };

  const getMessagesTrend = () => {
    const newMessages = stats.totalMessages - statsHistory.messagesYesterday;
    return newMessages > 0 ? `+${newMessages} recent` : 'No recent messages';
  };

  const getActivityTrend = () => {
    const newActivity = stats.recentActivity - statsHistory.activityLastHour;
    return stats.recentActivity > 0 ? `${stats.recentActivity} today` : 'No recent activity';
  };

  const statCards = [
    {
      title: 'Total Groups',
      value: stats.totalGroups,
      icon: Users,
      color: 'text-blue-500',
      bg: 'bg-blue-500/10',
      trend: getGroupsTrend()
    },
    {
      title: 'Messages Sent',
      value: stats.totalMessages,
      icon: MessageCircle,
      color: 'text-green-500',
      bg: 'bg-green-500/10',
      trend: getMessagesTrend()
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
      trend: getActivityTrend()
    }
  ];

  if (loading || !userData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-white/20 border-t-purple-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white/60">Loading dashboard...</p>
        </div>
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
              
              <NotificationDropdown />
              
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                  {userData?.photoURL ? (
                    <img
                      src={userData?.photoURL}
                      alt="Profile"
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <User className="w-4 h-4 text-white" />
                  )}
                </div>
                <span className="text-white font-medium">
                  {userData?.displayName || currentUser?.email}
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
            Welcome back, {userData?.displayName || currentUser?.email?.split('@')[0] || 'User'}!
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
                className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-6 text-left hover:bg-white/10 transition-all duration-200 hover:scale-[1.02] group relative"
              >
                {action.badge && (
                  <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold">
                    {action.badge > 99 ? '99+' : action.badge}
                  </div>
                )}
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
              {recentMessages.length > 0 ? (
                recentMessages.map((groupData, index) => (
                  <div 
                    key={index} 
                    className="flex items-center space-x-3 p-3 hover:bg-white/5 rounded-lg transition-colors cursor-pointer"
                    onClick={() => navigate(`/chat/${groupData.groupId}`)}
                  >
                    <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                      <MessageCircle className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="text-white text-sm font-medium">{groupData.groupName}</p>
                      <p className="text-gray-400 text-xs truncate max-w-48">
                        {groupData.lastMessage?.sender?.displayName}: {groupData.lastMessage?.content || 'No messages yet'}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="w-2 h-2 bg-green-400 rounded-full inline-block"></span>
                      <p className="text-gray-500 text-xs mt-1">{groupData.onlineCount} online</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <MessageCircle className="w-12 h-12 text-gray-500 mx-auto mb-3" />
                  <p className="text-gray-400 text-sm">No recent messages</p>
                  <button 
                    onClick={() => navigate('/groups')}
                    className="mt-2 text-blue-400 hover:text-blue-300 text-sm underline"
                  >
                    Join a group to start chatting
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
            <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
              <Users className="w-5 h-5 mr-2 text-green-400" />
              Your Groups
            </h3>
            <div className="space-y-4">
              {userGroups.length > 0 ? (
                userGroups.slice(0, 3).map((group, index) => (
                  <div 
                    key={group.id} 
                    className="flex items-center justify-between p-3 hover:bg-white/5 rounded-lg transition-colors cursor-pointer"
                    onClick={() => navigate(`/chat/${group.id}`)}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-teal-500 rounded-full flex items-center justify-center">
                        {group.membership?.role === 'admin' ? (
                          <Shield className="w-5 h-5 text-white" />
                        ) : (
                          <Users className="w-5 h-5 text-white" />
                        )}
                      </div>
                      <div>
                        <p className="text-white text-sm font-medium">{group.name}</p>
                        <p className="text-gray-400 text-xs">
                          {group.membership?.role} • {group.description?.substring(0, 30)}...
                        </p>
                      </div>
                    </div>
                    <span className="text-xs text-green-400">
                      {group.isPublic ? 'Public' : 'Private'}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 text-gray-500 mx-auto mb-3" />
                  <p className="text-gray-400 text-sm">You haven't joined any groups yet</p>
                  <button 
                    onClick={() => navigate('/groups')}
                    className="mt-2 text-blue-400 hover:text-blue-300 text-sm underline"
                  >
                    Browse groups to join
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
