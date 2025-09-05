import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Link } from 'react-router-dom';
import crewConnectService from '../../services/crewConnectService';
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
  X,
  Check,
  AlertCircle,
} from 'lucide-react';

const Groups = () => {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState('my-groups');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [myGroups, setMyGroups] = useState([]);
  const [publicGroups, setPublicGroups] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form states
  const [createForm, setCreateForm] = useState({
    name: '',
    description: '',
    isPrivate: false,
    category: 'General'
  });

  // Input handlers to prevent focus loss
  const handleSearchChange = useCallback((e) => {
    setSearchQuery(e.target.value);
  }, []);

  const handleCreateFormNameChange = useCallback((e) => {
    setCreateForm(prev => ({ ...prev, name: e.target.value }));
  }, []);

  const handleCreateFormDescriptionChange = useCallback((e) => {
    setCreateForm(prev => ({ ...prev, description: e.target.value }));
  }, []);

  const handleSetPublicGroup = useCallback(() => {
    setCreateForm(prev => ({ ...prev, isPrivate: false }));
  }, []);

  const handleSetPrivateGroup = useCallback(() => {
    setCreateForm(prev => ({ ...prev, isPrivate: true }));
  }, []);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      
      if (activeTab === 'my-groups') {
        const groups = await crewConnectService.getUserCrews();
        setMyGroups(groups);
      } else {
        const groups = await crewConnectService.getPublicCrews();
        setPublicGroups(groups);
      }
    } catch (error) {
      console.error('Error fetching groups:', error);
      setError('Failed to load groups. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    try {
      setError('');
      setLoading(true);
      
      if (!createForm.name.trim() || !createForm.description.trim()) {
        setError('Name and description are required');
        return;
      }

      await crewConnectService.createCrew(
        createForm.name.trim(),
        createForm.description.trim(),
        !createForm.isPrivate // isPublic is opposite of isPrivate
      );
      
      setSuccess('Group created successfully!');
      setShowCreateModal(false);
      setCreateForm({
        name: '',
        description: '',
        isPrivate: false,
        category: 'General'
      });
      
      // Refresh my groups
      if (activeTab === 'my-groups') {
        await fetchData();
      }
      
    } catch (error) {
      console.error('Error creating group:', error);
      setError(error.message || 'Failed to create group');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinGroup = async (groupId) => {
    try {
      setError('');
      setLoading(true);
      
      await crewConnectService.joinCrew(groupId);
      setSuccess('Successfully joined the group!');
      
      // Refresh data
      await fetchData();
      
    } catch (error) {
      console.error('Error joining group:', error);
      setError(error.message || 'Failed to join group');
    } finally {
      setLoading(false);
    }
  };

  const filteredGroups = (activeTab === 'my-groups' ? myGroups : publicGroups).filter(group =>
    group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    group.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const GroupCard = ({ group, showJoinButton = false }) => {
    const isUserMember = activeTab === 'my-groups';
    const memberCount = group.memberCount || 0;
    
    return (
      <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-6 hover:bg-white/10 transition-all duration-200">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
              {group.avatarUrl ? (
                <img
                  src={group.avatarUrl}
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
                {group.isPublic === false ? (
                  <Lock className="w-4 h-4 text-yellow-400" />
                ) : (
                  <Globe className="w-4 h-4 text-green-400" />
                )}
                {group.membership?.role === 'admin' && <Crown className="w-4 h-4 text-yellow-400" />}
                {group.membership?.role === 'moderator' && <Shield className="w-4 h-4 text-blue-400" />}
              </div>
              <p className="text-gray-400 text-sm mb-2">{group.description}</p>
              <div className="flex items-center space-x-4 text-xs text-gray-500">
                <span className="flex items-center space-x-1">
                  <Users className="w-3 h-3" />
                  <span>{memberCount} members</span>
                </span>
                {isUserMember && group.recentMessages && (
                  <span className="flex items-center space-x-1">
                    <MessageCircle className="w-3 h-3" />
                    <span>{group.recentMessages} messages</span>
                  </span>
                )}
                {group.createdAt && (
                  <span className="flex items-center space-x-1">
                    <Calendar className="w-3 h-3" />
                    <span>{new Date(group.createdAt?.toDate ? group.createdAt.toDate() : group.createdAt).toLocaleDateString()}</span>
                  </span>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {showJoinButton && (
              <button
                onClick={() => handleJoinGroup(group.id)}
                disabled={loading}
                className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-4 py-2 rounded-lg font-medium hover:from-blue-600 hover:to-purple-600 transition-colors disabled:opacity-50"
              >
                {loading ? 'Joining...' : 'Join'}
              </button>
            )}
            
            {isUserMember && (
              <Link
                to={`/chat/${group.id}`}
                className="bg-gradient-to-r from-green-500 to-teal-500 text-white px-4 py-2 rounded-lg font-medium hover:from-green-600 hover:to-teal-600 transition-colors flex items-center space-x-2"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Chat</span>
              </Link>
            )}
          </div>
        </div>
        
        {isUserMember && group.lastActivity && (
          <div className="border-t border-white/10 pt-3">
            <p className="text-xs text-gray-500">
              Last activity: {group.lastActivity}
            </p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <div className="bg-white/5 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Link to="/dashboard" className="text-gray-400 hover:text-white transition-colors">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 bg-clip-text text-transparent">
                Groups
              </h1>
            </div>
            
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-4 py-2 rounded-lg font-medium hover:from-blue-600 hover:to-purple-600 transition-colors flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Create Group</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error/Success Messages */}
        {error && (
          <div className="mb-6 bg-red-500/10 border border-red-500/20 rounded-lg p-4 flex items-center space-x-3">
            <AlertCircle className="w-5 h-5 text-red-400" />
            <span className="text-red-300">{error}</span>
            <button onClick={() => setError('')} className="ml-auto text-red-400 hover:text-red-300">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {success && (
          <div className="mb-6 bg-green-500/10 border border-green-500/20 rounded-lg p-4 flex items-center space-x-3">
            <Check className="w-5 h-5 text-green-400" />
            <span className="text-green-300">{success}</span>
            <button onClick={() => setSuccess('')} className="ml-auto text-green-400 hover:text-green-300">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex space-x-1 p-1 bg-white/5 backdrop-blur-xl rounded-lg border border-white/10 mb-6 w-fit">
          <button
            onClick={() => setActiveTab('my-groups')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'my-groups'
                ? 'bg-blue-500 text-white'
                : 'text-gray-300 hover:text-white'
            }`}
          >
            My Groups
          </button>
          <button
            onClick={() => setActiveTab('discover')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'discover'
                ? 'bg-blue-500 text-white'
                : 'text-gray-300 hover:text-white'
            }`}
          >
            Discover
          </button>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search groups..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-3 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500/50 w-full"
            />
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-white/20 border-t-purple-500 rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredGroups.length > 0 ? (
              filteredGroups.map((group) => (
                <GroupCard
                  key={group.id}
                  group={group}
                  showJoinButton={activeTab === 'discover'}
                />
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <Users className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">
                  {activeTab === 'my-groups' ? 'No groups joined yet' : 'No groups found'}
                </h3>
                <p className="text-gray-400 mb-4">
                  {activeTab === 'my-groups' 
                    ? 'Join some groups to get started with conversations' 
                    : 'Try adjusting your search or check back later'
                  }
                </p>
                {activeTab === 'my-groups' && (
                  <button
                    onClick={() => setActiveTab('discover')}
                    className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-6 py-3 rounded-lg font-medium hover:from-blue-600 hover:to-purple-600 transition-colors"
                  >
                    Discover Groups
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Create Group Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-800/90 backdrop-blur-xl rounded-2xl border border-white/10 w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white">Create New Group</h2>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateGroup} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Group Name
                  </label>
                  <input
                    type="text"
                    value={createForm.name}
                    onChange={handleCreateFormNameChange}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    placeholder="Enter group name..."
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Description
                  </label>
                  <textarea
                    value={createForm.description}
                    onChange={handleCreateFormDescriptionChange}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500/50 h-24 resize-none"
                    placeholder="Describe your group..."
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Privacy
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="radio"
                        name="privacy"
                        checked={!createForm.isPrivate}
                        onChange={handleSetPublicGroup}
                        className="text-blue-500 focus:ring-blue-500/50"
                      />
                      <div className="flex items-center space-x-2">
                        <Globe className="w-4 h-4 text-green-400" />
                        <span className="text-gray-300">Public - Anyone can join</span>
                      </div>
                    </label>
                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="radio"
                        name="privacy"
                        checked={createForm.isPrivate}
                        onChange={handleSetPrivateGroup}
                        className="text-blue-500 focus:ring-blue-500/50"
                      />
                      <div className="flex items-center space-x-2">
                        <Lock className="w-4 h-4 text-yellow-400" />
                        <span className="text-gray-300">Private - Invite only</span>
                      </div>
                    </label>
                  </div>
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 bg-white/5 border border-white/10 text-white px-4 py-3 rounded-lg font-medium hover:bg-white/10 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-gradient-to-r from-blue-500 to-purple-500 text-white px-4 py-3 rounded-lg font-medium hover:from-blue-600 hover:to-purple-600 transition-colors disabled:opacity-50"
                  >
                    {loading ? 'Creating...' : 'Create Group'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Groups;
