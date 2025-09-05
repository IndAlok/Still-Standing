import React, { useState, useEffect } from 'react';
import { 
  Users, 
  MessageCircle, 
  Code, 
  Award, 
  TrendingUp, 
  Calendar,
  Activity,
  Clock,
  Star,
  Target
} from 'lucide-react';
import { profileService } from '../services/profileService';

const ProfileStats = ({ userId }) => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('all'); // all, month, week

  useEffect(() => {
    const loadStats = async () => {
      if (!userId) return;
      
      setLoading(true);
      try {
        const userStats = await profileService.getUserStats(userId);
        setStats(userStats);
      } catch (error) {
        console.error('Failed to load user stats:', error);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, [userId, timeRange]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Profile Statistics</h2>
          <p className="text-slate-400">Loading your activity data...</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="bg-slate-700/30 rounded-xl p-6 animate-pulse">
              <div className="w-8 h-8 bg-slate-600 rounded-lg mb-4"></div>
              <div className="w-20 h-8 bg-slate-600 rounded mb-2"></div>
              <div className="w-24 h-4 bg-slate-600 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const statCards = [
    {
      icon: Users,
      label: 'Groups Joined',
      value: stats?.groupsJoined || 0,
      color: 'blue',
      change: '+2 this month'
    },
    {
      icon: MessageCircle,
      label: 'Messages Sent',
      value: stats?.messagesSent || 0,
      color: 'green',
      change: '+15 this week'
    },
    {
      icon: Code,
      label: 'Projects',
      value: stats?.projectsCompleted || 0,
      color: 'purple',
      change: '+1 this month'
    },
    {
      icon: Award,
      label: 'Skill Endorsements',
      value: stats?.skillEndorsements || 0,
      color: 'amber',
      change: '+3 this month'
    },
    {
      icon: TrendingUp,
      label: 'Profile Views',
      value: Math.floor(Math.random() * 50) + 20, // Mock data
      color: 'cyan',
      change: '+8 this week'
    },
    {
      icon: Activity,
      label: 'Activity Score',
      value: Math.floor(Math.random() * 100) + 50, // Mock data
      color: 'emerald',
      change: '+12 points'
    }
  ];

  const getColorClasses = (color) => {
    const colors = {
      blue: {
        bg: 'bg-blue-500/20',
        text: 'text-blue-400',
        border: 'border-blue-500/30'
      },
      green: {
        bg: 'bg-green-500/20',
        text: 'text-green-400',
        border: 'border-green-500/30'
      },
      purple: {
        bg: 'bg-purple-500/20',
        text: 'text-purple-400',
        border: 'border-purple-500/30'
      },
      amber: {
        bg: 'bg-amber-500/20',
        text: 'text-amber-400',
        border: 'border-amber-500/30'
      },
      cyan: {
        bg: 'bg-cyan-500/20',
        text: 'text-cyan-400',
        border: 'border-cyan-500/30'
      },
      emerald: {
        bg: 'bg-emerald-500/20',
        text: 'text-emerald-400',
        border: 'border-emerald-500/30'
      }
    };
    return colors[color] || colors.blue;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Profile Statistics</h2>
          <p className="text-slate-400">Track your activity and engagement on the platform</p>
        </div>
        
        {/* Time Range Selector */}
        <div className="flex bg-slate-700/30 rounded-lg p-1">
          {[
            { id: 'all', label: 'All Time' },
            { id: 'month', label: 'This Month' },
            { id: 'week', label: 'This Week' }
          ].map(range => (
            <button
              key={range.id}
              onClick={() => setTimeRange(range.id)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                timeRange === range.id
                  ? 'bg-cyan-500/20 text-cyan-300'
                  : 'text-slate-400 hover:text-slate-300'
              }`}
            >
              {range.label}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((stat, index) => {
          const colors = getColorClasses(stat.color);
          const IconComponent = stat.icon;
          
          return (
            <div
              key={index}
              className="bg-slate-700/30 backdrop-blur-sm rounded-xl p-6 border border-slate-600/50 hover:border-slate-500/50 transition-all duration-200"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-xl ${colors.bg} border ${colors.border}`}>
                  <IconComponent className={colors.text} size={24} />
                </div>
                <div className="text-right">
                  <div className={`text-2xl font-bold text-white mb-1`}>
                    {stat.value.toLocaleString()}
                  </div>
                  <div className="text-xs text-green-400 flex items-center gap-1">
                    <TrendingUp size={12} />
                    {stat.change}
                  </div>
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-white mb-1">{stat.label}</h3>
                <div className="w-full bg-slate-600/50 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${colors.bg.replace('/20', '/60')} transition-all duration-1000`}
                    style={{ width: `${Math.min((stat.value / 100) * 100, 100)}%` }}
                  ></div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Activity Timeline */}
      <div className="bg-slate-700/30 rounded-xl p-6 border border-slate-600/50">
        <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
          <Clock size={20} />
          Recent Activity
        </h3>
        
        <div className="space-y-4">
          {[
            {
              icon: Users,
              action: 'Joined "React Developers" group',
              time: '2 hours ago',
              color: 'blue'
            },
            {
              icon: MessageCircle,
              action: 'Sent 5 messages in chat',
              time: '4 hours ago',
              color: 'green'
            },
            {
              icon: Code,
              action: 'Updated skills preferences',
              time: '1 day ago',
              color: 'purple'
            },
            {
              icon: Star,
              action: 'Received skill endorsement',
              time: '2 days ago',
              color: 'amber'
            },
            {
              icon: Target,
              action: 'Completed profile setup',
              time: '3 days ago',
              color: 'cyan'
            }
          ].map((activity, index) => {
            const colors = getColorClasses(activity.color);
            const IconComponent = activity.icon;
            
            return (
              <div key={index} className="flex items-center gap-4 p-4 bg-slate-600/30 rounded-lg">
                <div className={`p-2 rounded-lg ${colors.bg} border ${colors.border}`}>
                  <IconComponent className={colors.text} size={16} />
                </div>
                <div className="flex-1">
                  <p className="text-white font-medium">{activity.action}</p>
                  <p className="text-slate-400 text-sm">{activity.time}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Goals & Achievements */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Goals */}
        <div className="bg-slate-700/30 rounded-xl p-6 border border-slate-600/50">
          <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
            <Target size={20} />
            Weekly Goals
          </h3>
          
          <div className="space-y-4">
            {[
              { goal: 'Join 2 new groups', progress: 50, current: 1, target: 2 },
              { goal: 'Send 20 messages', progress: 75, current: 15, target: 20 },
              { goal: 'Complete profile', progress: 90, current: 9, target: 10 }
            ].map((goal, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-white font-medium">{goal.goal}</span>
                  <span className="text-slate-400">{goal.current}/{goal.target}</span>
                </div>
                <div className="w-full bg-slate-600/50 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-cyan-500 to-blue-500 h-2 rounded-full transition-all duration-1000"
                    style={{ width: `${goal.progress}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Achievements */}
        <div className="bg-slate-700/30 rounded-xl p-6 border border-slate-600/50">
          <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
            <Award size={20} />
            Recent Achievements
          </h3>
          
          <div className="space-y-4">
            {[
              { 
                title: 'First Group', 
                description: 'Joined your first group', 
                icon: '🎉',
                date: '2 days ago'
              },
              { 
                title: 'Profile Complete', 
                description: 'Completed your profile setup', 
                icon: '✨',
                date: '3 days ago'
              },
              { 
                title: 'Resume Upload', 
                description: 'Uploaded and parsed your resume', 
                icon: '📄',
                date: '1 week ago'
              }
            ].map((achievement, index) => (
              <div key={index} className="flex items-center gap-4 p-4 bg-slate-600/30 rounded-lg">
                <div className="text-2xl">{achievement.icon}</div>
                <div className="flex-1">
                  <h4 className="text-white font-medium">{achievement.title}</h4>
                  <p className="text-slate-400 text-sm">{achievement.description}</p>
                  <p className="text-slate-500 text-xs mt-1">{achievement.date}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Last Active */}
      <div className="bg-slate-700/30 rounded-xl p-6 border border-slate-600/50 text-center">
        <Calendar className="text-cyan-400 mx-auto mb-3" size={24} />
        <p className="text-slate-300">
          Last active: <span className="text-white font-medium">
            {stats?.lastActive ? new Date(stats.lastActive).toLocaleString() : 'Just now'}
          </span>
        </p>
      </div>
    </div>
  );
};

export default ProfileStats;
