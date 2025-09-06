import React, { memo, useState, useEffect } from 'react';
import { Users, UserPlus, User, Eye } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const TeamMembersPanel = memo(() => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading team members
    const timer = setTimeout(() => {
      setTeamMembers([
        {
          uid: '1',
          displayName: 'Alice Johnson',
          domain: 'Frontend',
          groupName: 'React Developers',
          isOnline: true,
          profilePicture: null
        },
        {
          uid: '2',
          displayName: 'Bob Smith', 
          domain: 'Backend',
          groupName: 'Python Enthusiasts',
          isOnline: false,
          profilePicture: null
        },
        {
          uid: '3',
          displayName: 'Carol Williams',
          domain: 'AI/ML',
          groupName: 'Data Scientists',
          isOnline: true,
          profilePicture: null
        }
      ]);
      setLoading(false);
    }, 600);

    return () => clearTimeout(timer);
  }, [currentUser]);

  const handleViewProfile = (memberId) => {
    navigate(`/profile/${memberId}`);
  };

  if (loading) {
    return (
      <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-400" />
            Team Members
          </h3>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="animate-pulse">
              <div className="flex items-center space-x-3 p-3 bg-white/5 rounded-xl">
                <div className="w-10 h-10 bg-gray-600 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-600 rounded w-24 mb-2"></div>
                  <div className="h-3 bg-gray-700 rounded w-32"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <Users className="w-5 h-5 text-blue-400" />
          Team Members ({teamMembers.length})
        </h3>
        <button
          onClick={() => navigate("/groups")}
          className="text-blue-400 hover:text-blue-300 text-sm flex items-center gap-1 hover:underline"
        >
          <UserPlus className="w-4 h-4" />
          Find more
        </button>
      </div>
      
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {teamMembers.length > 0 ? (
          teamMembers.map((member) => (
            <div
              key={member.uid}
              className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-all duration-200 cursor-pointer group"
              onClick={() => handleViewProfile(member.uid)}
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center overflow-hidden">
                  {member.profilePicture ? (
                    <img
                      src={member.profilePicture}
                      alt={member.displayName}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <User className="w-5 h-5 text-white" />
                  )}
                </div>
                <div>
                  <p className="text-white text-sm font-medium">
                    {member.displayName}
                  </p>
                  <p className="text-gray-400 text-xs">
                    {member.domain} • {member.groupName}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${member.isOnline ? 'bg-green-400' : 'bg-gray-500'}`}></div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleViewProfile(member.uid);
                  }}
                  className="opacity-0 group-hover:opacity-100 transition-opacity text-cyan-400 hover:text-cyan-300 p-1 hover:bg-cyan-500/10 rounded"
                  title="View Profile"
                >
                  <Eye className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8">
            <Users className="w-12 h-12 text-gray-500 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">
              No team members yet
            </p>
            <p className="text-gray-500 text-xs mt-1">
              Join groups to connect with team members
            </p>
          </div>
        )}
      </div>
    </div>
  );
});

TeamMembersPanel.displayName = 'TeamMembersPanel';

export default TeamMembersPanel;
