import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Link } from 'react-router-dom';
import {
  Users,
  Plus,
  Search,
  Filter,
  ArrowLeft,
  Lock,
  Globe,
  MessageCircle,
  Calendar,
  User,
  Settings,
  Crown,
  Shield,
  Eye,
  UserPlus,
} from 'lucide-react';

const Groups = () => {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState('my-groups');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);

  // Mock data - replace with Firebase queries
  const myGroups = [
    {
      id: 1,
      name: 'Tech Team',
      description: 'Daily discussions about development and technology',
      memberCount: 12,
      isPrivate: false,
      role: 'admin',
      lastActivity: '2 hours ago',
      avatar: null,
      recentMessages: 23
    },
    {
      id: 2,
      name: 'Project Alpha',
      description: 'Secret project collaboration space',
      memberCount: 6,
      isPrivate: true,
      role: 'owner',
      lastActivity: '5 minutes ago',
      avatar: null,
      recentMessages: 45
    },
    {
      id: 3,
      name: 'Coffee Chat',
      description: 'Casual conversations and coffee recommendations',
      memberCount: 28,
      isPrivate: false,
      role: 'member',
      lastActivity: '1 day ago',
      avatar: null,
      recentMessages: 12
    }
  ];

  const publicGroups = [
    {
      id: 4,
      name: 'Web Developers',
      description: 'Community for web developers to share knowledge',
      memberCount: 156,
      isPrivate: false,
      category: 'Technology',
      createdAt: new Date('2024-01-15'),
      avatar: null
    },
    {
      id: 5,
      name: 'Book Club',
      description: 'Monthly book discussions and recommendations',
      memberCount: 42,
      isPrivate: false,
      category: 'Literature',
      createdAt: new Date('2024-02-01'),
      avatar: null
    },
    {
      id: 6,
      name: 'Fitness Enthusiasts',
      description: 'Share workout routines and fitness tips',
      memberCount: 89,
      isPrivate: false,
      category: 'Health',
      createdAt: new Date('2024-01-20'),
      avatar: null
    }
  ];

  const [createForm, setCreateForm] = useState({
    name: '',
    description: '',
    isPrivate: false,
    category: 'General'
  });

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    // TODO: Implement Firebase group creation
    console.log('Creating group:', createForm);
    setShowCreateModal(false);
    setCreateForm({
      name: '',
      description: '',
      isPrivate: false,
      category: 'General'
    });
  };

  const handleJoinGroup = async (groupId) => {
    // TODO: Implement Firebase group joining
    console.log('Joining group:', groupId);
    setShowJoinModal(false);
  };

  const GroupCard = ({ group, showJoinButton = false }) => (
    <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-6 hover:bg-white/10 transition-all duration-200">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
            {group.avatar ? (
              <img
                src={group.avatar}
                alt={group.name}
                className="w-12 h-12 rounded-lg object-cover"
              />
            ) : (
              <Users className="w-6 h-6 text-white" />
            )}
          </div>
          
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-1">
              <h3 className="font-semibold text-white">{group.name}</h3>
              {group.isPrivate ? (
                <Lock className="w-4 h-4 text-yellow-400" />
              ) : (
                <Globe className="w-4 h-4 text-green-400" />
              )}
              {group.role === 'owner' && <Crown className="w-4 h-4 text-yellow-400" />}
              {group.role === 'admin' && <Shield className="w-4 h-4 text-blue-400" />}
            </div>
            <p className="text-gray-400 text-sm line-clamp-2">{group.description}</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {showJoinButton ? (
            <button
              onClick={() => handleJoinGroup(group.id)}
              className="flex items-center space-x-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-lg text-sm transition-colors"
            >
              <UserPlus className="w-4 h-4" />
              <span>Join</span>
            </button>
          ) : (
            <Link
              to={`/chat/${group.id}`}
              className="flex items-center space-x-1 bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-lg text-sm transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Chat</span>
            </Link>
          )}
          
          <button className="p-1 text-gray-400 hover:text-white transition-colors">
            <Eye className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      <div className="flex items-center justify-between text-sm text-gray-400">
        <div className="flex items-center space-x-4">
          <span className="flex items-center">
            <User className="w-4 h-4 mr-1" />
            {group.memberCount} members
          </span>
          
          {group.lastActivity && (
            <span className="flex items-center">
              <MessageCircle className="w-4 h-4 mr-1" />
              {group.lastActivity}
            </span>
          )}
          
          {group.category && (
            <span className="bg-white/10 px-2 py-1 rounded-full text-xs">
              {group.category}
            </span>
          )}
        </div>
        
        {group.recentMessages && (
          <span className="text-blue-400">{group.recentMessages} new</span>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <div className="bg-white/5 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link
                to="/dashboard"
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-white" />
              </Link>
              <h1 className="text-2xl font-bold text-white">Groups</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search groups..."
                  className="bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500/50 w-64"
                />
              </div>
              
              <button className="p-2 text-gray-400 hover:text-white transition-colors">
                <Filter className="w-5 h-5" />
              </button>
              
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Create Group</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="flex space-x-1 bg-white/5 backdrop-blur-xl rounded-lg p-1 mb-8 w-fit">
          <button
            onClick={() => setActiveTab('my-groups')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'my-groups'
                ? 'bg-blue-600 text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            My Groups
          </button>
          <button
            onClick={() => setActiveTab('discover')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'discover'
                ? 'bg-blue-600 text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Discover
          </button>
        </div>

        {/* Content */}
        <div className="space-y-6">
          {activeTab === 'my-groups' && (
            <>
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-white">Your Groups</h2>
                <span className="text-gray-400 text-sm">{myGroups.length} groups</span>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {myGroups.map((group) => (
                  <GroupCard key={group.id} group={group} />
                ))}
              </div>
            </>
          )}

          {activeTab === 'discover' && (
            <>
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-white">Public Groups</h2>
                <span className="text-gray-400 text-sm">{publicGroups.length} groups available</span>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {publicGroups.map((group) => (
                  <GroupCard key={group.id} group={group} showJoinButton />
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Create Group Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl border border-white/10 p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-white">Create New Group</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1 text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleCreateGroup} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Group Name</label>
                <input
                  type="text"
                  value={createForm.name}
                  onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                  className="w-full bg-white/5 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  placeholder="Enter group name"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
                <textarea
                  value={createForm.description}
                  onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                  rows={3}
                  className="w-full bg-white/5 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none"
                  placeholder="Describe your group"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Category</label>
                <select
                  value={createForm.category}
                  onChange={(e) => setCreateForm({ ...createForm, category: e.target.value })}
                  className="w-full bg-white/5 border border-white/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                >
                  <option value="General">General</option>
                  <option value="Technology">Technology</option>
                  <option value="Business">Business</option>
                  <option value="Education">Education</option>
                  <option value="Entertainment">Entertainment</option>
                  <option value="Health">Health</option>
                  <option value="Sports">Sports</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              
              <div className="flex items-center justify-between">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={createForm.isPrivate}
                    onChange={(e) => setCreateForm({ ...createForm, isPrivate: e.target.checked })}
                    className="rounded border-white/20 bg-white/5 text-blue-600 focus:ring-blue-500/50"
                  />
                  <span className="text-sm text-gray-300">Private Group</span>
                </label>
                <Lock className="w-4 h-4 text-yellow-400" />
              </div>
              
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors"
                >
                  Create Group
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Groups;
