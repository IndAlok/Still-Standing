import React, { memo, useState, useEffect } from 'react';
import { MessageCircle, Users } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const RecentActivity = memo(() => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [recentMessages, setRecentMessages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading recent messages
    const timer = setTimeout(() => {
      setRecentMessages([
        {
          groupId: '1',
          groupName: 'React Developers',
          lastMessage: {
            sender: { displayName: 'John Doe' },
            content: 'Hey everyone! Working on a new project...'
          },
          timestamp: '2 min ago',
          onlineCount: 5
        },
        {
          groupId: '2', 
          groupName: 'Python Enthusiasts',
          lastMessage: {
            sender: { displayName: 'Jane Smith' },
            content: 'Check out this amazing ML model I built!'
          },
          timestamp: '15 min ago',
          onlineCount: 3
        }
      ]);
      setLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, [currentUser]);

  if (loading) {
    return (
      <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
        <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
          <MessageCircle className="w-5 h-5 mr-2 text-blue-400" />
          Recent Messages
        </h3>
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="animate-pulse">
              <div className="flex items-center space-x-3 p-3 bg-white/5 rounded-lg">
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
                <p className="text-white text-sm font-medium">
                  {groupData.groupName}
                </p>
                <p className="text-gray-400 text-xs truncate max-w-48">
                  {groupData.lastMessage?.sender?.displayName}:{" "}
                  {groupData.lastMessage?.content || "No messages yet"}
                </p>
              </div>
              <div className="text-right">
                <p className="text-gray-500 text-xs">{groupData.timestamp}</p>
                <div className="flex items-center justify-end space-x-1 mt-1">
                  <span className="w-2 h-2 bg-green-400 rounded-full inline-block"></span>
                  <p className="text-gray-500 text-xs">
                    {groupData.onlineCount} online
                  </p>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8">
            <MessageCircle className="w-12 h-12 text-gray-500 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">No recent messages</p>
            <button
              onClick={() => navigate("/groups")}
              className="mt-2 text-blue-400 hover:text-blue-300 text-sm underline"
            >
              Join a group to start chatting
            </button>
          </div>
        )}
      </div>
    </div>
  );
});

RecentActivity.displayName = 'RecentActivity';

export default RecentActivity;
