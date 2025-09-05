import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import crewConnectService from '../../services/crewConnectService';
import {
  Search,
  Users,
  Globe,
  Lock,
  Plus,
  UserPlus,
  Check,
  Clock,
  ArrowLeft
} from 'lucide-react';

const Discover = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [publicGroups, setPublicGroups] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [pendingRequests, setPendingRequests] = useState(new Set());
  const [joinedGroups, setJoinedGroups] = useState(new Set());

  useEffect(() => {
    if (currentUser) {
      fetchPublicGroups();
      fetchUserMemberships();
    }
  }, [currentUser]);

  const fetchUserMemberships = async () => {
    try {
      const userGroups = await crewConnectService.getUserCrews();
      const groupIds = new Set(userGroups.map(group => group.id));
      setJoinedGroups(groupIds);
    } catch (error) {
      console.error('Error fetching user memberships:', error);
    }
  };

  const fetchPublicGroups = async () => {
    try {
      setLoading(true);
      // Get all public crews - we'll need to add this method to the service
      const groups = await crewConnectService.getPublicCrews();
      setPublicGroups(groups);
    } catch (error) {
      console.error('Error fetching public groups:', error);
      setPublicGroups([]);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinRequest = async (groupId) => {
    try {
      setPendingRequests(prev => new Set([...prev, groupId]));
      
      const result = await crewConnectService.requestToJoinCrew(groupId, 'I would like to join this group.');
      
      if (result.status === 'pending') {
        alert('Join request sent! The group owner will review your request.');
      } else {
        alert('Successfully joined the group!');
        setJoinedGroups(prev => new Set([...prev, groupId]));
      }
    } catch (error) {
      console.error('Error sending join request:', error);
      alert(error.message);
      setPendingRequests(prev => {
        const newSet = new Set(prev);
        newSet.delete(groupId);
        return newSet;
      });
    }
  };

  const filteredGroups = publicGroups.filter(group =>
    group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    group.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getButtonState = (group) => {
    if (joinedGroups.has(group.id)) {
      return { text: 'Joined', disabled: true, className: 'bg-green-500 cursor-not-allowed', icon: Check };
    }
    
    if (pendingRequests.has(group.id)) {
      return { text: 'Pending', disabled: true, className: 'bg-yellow-500 cursor-not-allowed', icon: Clock };
    }
    
    return { text: 'Request to Join', disabled: false, className: 'bg-blue-500 hover:bg-blue-600', icon: UserPlus };
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/groups')}
              className="p-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-white">Discover Groups</h1>
              <p className="text-gray-400">Find and join public groups</p>
            </div>
          </div>
          
          <button
            onClick={() => navigate('/groups')}
            className="px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg font-medium hover:from-blue-600 hover:to-purple-600 transition-colors"
          >
            <Plus className="w-4 h-4 inline mr-2" />
            Create Group
          </button>
        </div>

        {/* Search */}
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/10 p-6 mb-8">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search groups..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20"
            />
          </div>
        </div>

        {/* Groups Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredGroups.length === 0 ? (
              <div className="col-span-full text-center py-16">
                <Users className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">No Groups Found</h3>
                <p className="text-gray-400">
                  {searchTerm ? 'Try a different search term' : 'No public groups available yet'}
                </p>
              </div>
            ) : (
              filteredGroups.map((group) => {
                const buttonState = getButtonState(group);
                const ButtonIcon = buttonState.icon;
                
                return (
                  <div key={group.id} className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/10 p-6 hover:bg-white/15 transition-colors">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                          <Users className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-white">{group.name}</h3>
                          <div className="flex items-center space-x-2 text-sm text-gray-400">
                            {group.isPublic ? (
                              <Globe className="w-4 h-4 text-green-400" />
                            ) : (
                              <Lock className="w-4 h-4 text-yellow-400" />
                            )}
                            <span>{group.members?.length || 0} members</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <p className="text-gray-300 text-sm mb-4 line-clamp-3">
                      {group.description || 'No description available'}
                    </p>

                    <div className="flex items-center justify-between">
                      <div className="text-xs text-gray-500">
                        Created by {group.createdBy?.displayName || 'Unknown'}
                      </div>
                      
                      <button
                        onClick={() => !buttonState.disabled && handleJoinRequest(group.id)}
                        disabled={buttonState.disabled}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${buttonState.className}`}
                      >
                        <ButtonIcon className="w-4 h-4 inline mr-1" />
                        {buttonState.text}
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Discover;
