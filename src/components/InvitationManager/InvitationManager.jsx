import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import crewConnectService from '../../services/crewConnectService';
import { 
  Bell, 
  Check, 
  X, 
  User, 
  Users, 
  Mail, 
  Clock,
  UserPlus,
  UserCheck
} from 'lucide-react';

const InvitationManager = () => {
  const { currentUser } = useAuth();
  const [invitations, setInvitations] = useState([]);
  const [joinRequests, setJoinRequests] = useState([]);
  const [activeTab, setActiveTab] = useState('received'); // received, sent
  const [loading, setLoading] = useState(true);
  const [userGroups, setUserGroups] = useState([]);

  useEffect(() => {
    if (currentUser) {
      fetchInvitationsAndRequests();
      fetchUserGroups();
    }
  }, [currentUser]);

  const fetchUserGroups = async () => {
    try {
      const groups = await crewConnectService.getUserCrews();
      setUserGroups(groups);
    } catch (error) {
      console.error('Error fetching user groups:', error);
    }
  };

  const fetchInvitationsAndRequests = async () => {
    try {
      setLoading(true);
      
      // Get received invitations
      const receivedInvitations = await crewConnectService.getUserInvitations('pending');
      setInvitations(receivedInvitations);

      // Get join requests for owned groups
      const allRequests = [];
      const groups = await crewConnectService.getUserCrews();
      
      for (const group of groups) {
        // Only fetch requests for groups where user is owner/admin
        try {
          const requests = await crewConnectService.getJoinRequests(group.id, 'pending');
          allRequests.push(...requests.map(req => ({ ...req, groupName: group.name })));
        } catch (error) {
          // User might not have permission for this group
          console.log(`No permission to view requests for ${group.name}`);
        }
      }
      
      setJoinRequests(allRequests);
    } catch (error) {
      console.error('Error fetching invitations and requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInvitation = async (invitationId, action) => {
    try {
      await crewConnectService.handleInvitation(invitationId, action);
      
      // Remove from list
      setInvitations(prev => prev.filter(inv => inv.id !== invitationId));
      
      // Show success message
      if (action === 'accepted') {
        alert('Successfully joined the group!');
        fetchUserGroups(); // Refresh groups
      } else {
        alert('Invitation declined');
      }
    } catch (error) {
      console.error('Error handling invitation:', error);
      alert(error.message);
    }
  };

  const handleJoinRequest = async (requestId, action) => {
    try {
      await crewConnectService.handleJoinRequest(requestId, action);
      
      // Remove from list
      setJoinRequests(prev => prev.filter(req => req.id !== requestId));
      
      // Show success message
      if (action === 'approved') {
        alert('Join request approved!');
      } else {
        alert('Join request rejected');
      }
    } catch (error) {
      console.error('Error handling join request:', error);
      alert(error.message);
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Unknown time';
    
    let date;
    if (timestamp.toDate) {
      date = timestamp.toDate();
    } else {
      date = new Date(timestamp);
    }
    
    return date.toLocaleDateString() + ' at ' + date.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
          <Bell className="w-6 h-6 mr-3 text-blue-400" />
          Invitations & Requests
        </h2>

        {/* Tabs */}
        <div className="flex space-x-1 mb-6 bg-white/5 rounded-lg p-1">
          <button
            onClick={() => setActiveTab('received')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'received'
                ? 'bg-blue-500 text-white'
                : 'text-gray-300 hover:text-white hover:bg-white/10'
            }`}
          >
            <UserCheck className="w-4 h-4 inline mr-2" />
            Received ({invitations.length})
          </button>
          <button
            onClick={() => setActiveTab('sent')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'sent'
                ? 'bg-blue-500 text-white'
                : 'text-gray-300 hover:text-white hover:bg-white/10'
            }`}
          >
            <UserPlus className="w-4 h-4 inline mr-2" />
            Requests to Approve ({joinRequests.length})
          </button>
        </div>

        {/* Content */}
        {activeTab === 'received' ? (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white mb-4">Group Invitations</h3>
            {invitations.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <Mail className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No pending invitations</p>
              </div>
            ) : (
              invitations.map((invitation) => (
                <div key={invitation.id} className="bg-white/5 rounded-lg p-4 border border-white/10">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                          <Users className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h4 className="text-white font-semibold">{invitation.crewName}</h4>
                          <p className="text-gray-400 text-sm">
                            Invited by {invitation.inviterName} as {invitation.role}
                          </p>
                        </div>
                      </div>
                      
                      {invitation.message && (
                        <p className="text-gray-300 text-sm mb-3 ml-13">
                          "{invitation.message}"
                        </p>
                      )}
                      
                      <div className="flex items-center text-gray-500 text-xs ml-13">
                        <Clock className="w-3 h-3 mr-1" />
                        {formatDate(invitation.createdAt)}
                      </div>
                    </div>
                    
                    <div className="flex space-x-2 ml-4">
                      <button
                        onClick={() => handleInvitation(invitation.id, 'accepted')}
                        className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-medium transition-colors"
                      >
                        <Check className="w-4 h-4 inline mr-1" />
                        Accept
                      </button>
                      <button
                        onClick={() => handleInvitation(invitation.id, 'declined')}
                        className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition-colors"
                      >
                        <X className="w-4 h-4 inline mr-1" />
                        Decline
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white mb-4">Join Requests to Approve</h3>
            {joinRequests.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <UserPlus className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No pending join requests</p>
              </div>
            ) : (
              joinRequests.map((request) => (
                <div key={request.id} className="bg-white/5 rounded-lg p-4 border border-white/10">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-pink-500 rounded-full flex items-center justify-center">
                          {request.userAvatar ? (
                            <img 
                              src={request.userAvatar} 
                              alt={request.userName} 
                              className="w-10 h-10 rounded-full object-cover" 
                            />
                          ) : (
                            <User className="w-5 h-5 text-white" />
                          )}
                        </div>
                        <div>
                          <h4 className="text-white font-semibold">{request.userName}</h4>
                          <p className="text-gray-400 text-sm">
                            {request.userEmail} • wants to join {request.groupName}
                          </p>
                        </div>
                      </div>
                      
                      {request.message && (
                        <p className="text-gray-300 text-sm mb-3 ml-13">
                          "{request.message}"
                        </p>
                      )}
                      
                      <div className="flex items-center text-gray-500 text-xs ml-13">
                        <Clock className="w-3 h-3 mr-1" />
                        {formatDate(request.createdAt)}
                      </div>
                    </div>
                    
                    <div className="flex space-x-2 ml-4">
                      <button
                        onClick={() => handleJoinRequest(request.id, 'approved')}
                        className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-medium transition-colors"
                      >
                        <Check className="w-4 h-4 inline mr-1" />
                        Approve
                      </button>
                      <button
                        onClick={() => handleJoinRequest(request.id, 'rejected')}
                        className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition-colors"
                      >
                        <X className="w-4 h-4 inline mr-1" />
                        Reject
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default InvitationManager;
