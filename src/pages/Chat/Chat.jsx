import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useParams, Link } from 'react-router-dom';
import crewConnectService from '../../services/crewConnectService';
import {
  Send,
  ArrowLeft,
  Users,
  Phone,
  Video,
  MoreVertical,
  Paperclip,
  Smile,
  User,
  Settings,
  Search,
  Hash,
  Lock,
  Globe,
  AlertCircle,
  X,
} from 'lucide-react';

const Chat = () => {
  const { currentUser } = useAuth();
  const { groupId } = useParams();
  const messagesEndRef = useRef(null);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [groupInfo, setGroupInfo] = useState(null);
  const [groupMembers, setGroupMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [showMembers, setShowMembers] = useState(false);

  // Input handler to prevent focus loss
  const handleMessageChange = useCallback((e) => {
    setMessage(e.target.value);
  }, []);

  useEffect(() => {
    if (!groupId) {
      setError('No group selected');
      setLoading(false);
      return;
    }

    const initializeChat = async () => {
      try {
        setLoading(true);
        setError('');

        // Get user's groups to find this specific group
        const userGroups = await crewConnectService.getUserCrews();
        const currentGroup = userGroups.find(group => group.id === groupId);
        
        if (!currentGroup) {
          setError('Group not found or you do not have access to this group');
          return;
        }

        setGroupInfo(currentGroup);

        // Get group members
        const members = await crewConnectService.getCrewMembers(groupId);
        setGroupMembers(members);

        // Get messages
        const groupMessages = await crewConnectService.getCrewMessages(groupId);
        setMessages(groupMessages);

        // Set up real-time listener for new messages
        const unsubscribe = crewConnectService.subscribeToCrewMessages(groupId, (newMessages) => {
          setMessages(newMessages);
          setTimeout(scrollToBottom, 100); // Small delay to ensure messages are rendered
        });

        return () => unsubscribe && unsubscribe();
      } catch (error) {
        console.error('Error initializing chat:', error);
        setError('Failed to load chat. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    const cleanup = initializeChat();
    return () => {
      if (cleanup && typeof cleanup.then === 'function') {
        cleanup.then(cleanupFn => cleanupFn && cleanupFn());
      }
    };
  }, [groupId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!message.trim() || sending) return;

    try {
      setSending(true);
      setError('');
      
      await crewConnectService.sendMessage(groupId, message.trim());
      setMessage('');
      
    } catch (error) {
      console.error('Error sending message:', error);
      setError('Failed to send message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const formatMessageTime = (timestamp) => {
    if (!timestamp) return '';
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-white/20 border-t-purple-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white/60">Loading chat...</p>
        </div>
      </div>
    );
  }

  if (error && !groupInfo) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">Unable to Load Chat</h2>
          <p className="text-gray-400 mb-4">{error}</p>
          <Link 
            to="/dashboard" 
            className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-6 py-3 rounded-lg font-medium hover:from-blue-600 hover:to-purple-600 transition-colors"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const onlineMembers = groupMembers.filter(member => member.user.isOnline);

  return (
    <div className="h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex flex-col">
      {/* Header */}
      <div className="bg-white/5 backdrop-blur-xl border-b border-white/10 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link to="/groups" className="text-gray-400 hover:text-white transition-colors">
              <ArrowLeft className="w-6 h-6" />
            </Link>
            
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                {groupInfo?.avatarUrl ? (
                  <img
                    src={groupInfo.avatarUrl}
                    alt={groupInfo.name}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <Hash className="w-5 h-5 text-white" />
                )}
              </div>
              
              <div>
                <h1 className="text-lg font-semibold text-white flex items-center space-x-2">
                  <span>{groupInfo?.name}</span>
                  {groupInfo?.isPublic === false ? (
                    <Lock className="w-4 h-4 text-yellow-400" />
                  ) : (
                    <Globe className="w-4 h-4 text-green-400" />
                  )}
                </h1>
                <p className="text-sm text-gray-400">
                  {groupMembers.length} members • {onlineMembers.length} online
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowMembers(true)}
              className="p-2 text-gray-400 hover:text-white transition-colors"
              title="View members"
            >
              <Users className="w-5 h-5" />
            </button>
            
            <button className="p-2 text-gray-400 hover:text-white transition-colors">
              <MoreVertical className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-500/10 border-b border-red-500/20 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-red-400" />
            <span className="text-red-300 text-sm">{error}</span>
          </div>
          <button onClick={() => setError('')} className="text-red-400 hover:text-red-300">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Hash className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Welcome to #{groupInfo?.name}!</h3>
            <p className="text-gray-400">This is the beginning of your conversation in this group.</p>
          </div>
        ) : (
          messages.map((msg, index) => {
            const isOwnMessage = msg.senderId === currentUser?.uid || msg.sender?.firebaseUID === currentUser?.uid;
            const showAvatar = index === 0 || messages[index - 1].senderId !== msg.senderId;
            
            return (
              <div key={msg.id} className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} space-x-3`}>
                {!isOwnMessage && (
                  <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
                    {showAvatar ? (
                      msg.sender?.profilePictureUrl ? (
                        <img
                          src={msg.sender.profilePictureUrl}
                          alt={msg.sender.displayName}
                          className="w-8 h-8 object-cover"
                        />
                      ) : (
                        <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                          <User className="w-4 h-4 text-white" />
                        </div>
                      )
                    ) : (
                      <div className="w-8 h-8" /> // Spacer
                    )}
                  </div>
                )}
                
                <div className={`max-w-xs lg:max-w-md ${isOwnMessage ? 'mr-2' : 'ml-0'}`}>
                  {!isOwnMessage && showAvatar && (
                    <p className="text-xs text-gray-400 mb-1 ml-1">
                      {msg.sender?.displayName || msg.sender?.username || 'Unknown User'}
                    </p>
                  )}
                  
                  <div
                    className={`rounded-2xl px-4 py-2 ${
                      isOwnMessage
                        ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white'
                        : 'bg-white/10 text-white backdrop-blur-sm'
                    }`}
                  >
                    <p className="text-sm">{msg.content}</p>
                  </div>
                  
                  <p className={`text-xs text-gray-500 mt-1 ${isOwnMessage ? 'text-right mr-1' : 'ml-1'}`}>
                    {formatMessageTime(msg.sentAt)}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="p-4 bg-white/5 backdrop-blur-xl border-t border-white/10">
        <form onSubmit={handleSendMessage} className="flex items-center space-x-3">
          <div className="flex-1 relative">
            <input
              type="text"
              value={message}
              onChange={handleMessageChange}
              placeholder={`Message #${groupInfo?.name}`}
              disabled={sending}
              className="w-full bg-white/5 border border-white/10 rounded-full px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500/50 disabled:opacity-50"
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
            >
              <Smile className="w-5 h-5" />
            </button>
          </div>
          
          <button
            type="submit"
            disabled={!message.trim() || sending}
            className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white hover:from-blue-600 hover:to-purple-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {sending ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </form>
      </div>

      {/* Members Sidebar */}
      {showMembers && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-end z-50">
          <div className="w-80 h-full bg-slate-800/90 backdrop-blur-xl border-l border-white/10 overflow-y-auto">
            <div className="p-4 border-b border-white/10">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">Members ({groupMembers.length})</h3>
                <button
                  onClick={() => setShowMembers(false)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            <div className="p-4 space-y-3">
              {groupMembers.map((member) => (
                <div key={member.user.id} className="flex items-center space-x-3">
                  <div className="relative">
                    {member.user.profilePictureUrl ? (
                      <img
                        src={member.user.profilePictureUrl}
                        alt={member.user.displayName}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-white" />
                      </div>
                    )}
                    {member.user.isOnline && (
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-slate-800 rounded-full"></div>
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <p className="text-white font-medium">{member.user.displayName || member.user.username}</p>
                    <p className="text-xs text-gray-400 capitalize">{member.role}</p>
                  </div>
                  
                  <div className="text-right">
                    {member.user.isOnline ? (
                      <span className="text-xs text-green-400">Online</span>
                    ) : (
                      <span className="text-xs text-gray-500">Offline</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Chat;
