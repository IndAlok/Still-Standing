import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useParams, Link } from 'react-router-dom';
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
} from 'lucide-react';

const Chat = () => {
  const { currentUser } = useAuth();
  const { groupId } = useParams();
  const messagesEndRef = useRef(null);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [onlineMembers, setOnlineMembers] = useState([]);

  // Mock data - replace with Firebase real-time data
  const groupInfo = {
    id: groupId || '1',
    name: 'Tech Team',
    description: 'Daily discussions about development and technology',
    memberCount: 12,
    isPrivate: false,
    members: [
      { id: '1', name: 'John Doe', avatar: null, isOnline: true, lastSeen: null },
      { id: '2', name: 'Jane Smith', avatar: null, isOnline: true, lastSeen: null },
      { id: '3', name: 'Mike Johnson', avatar: null, isOnline: false, lastSeen: '2 hours ago' },
      { id: '4', name: 'Sarah Wilson', avatar: null, isOnline: true, lastSeen: null },
    ]
  };

  const mockMessages = [
    {
      id: '1',
      senderId: '2',
      senderName: 'Jane Smith',
      senderAvatar: null,
      content: 'Hey everyone! How are you doing today?',
      timestamp: new Date(Date.now() - 3600000),
      type: 'text'
    },
    {
      id: '2',
      senderId: currentUser?.uid,
      senderName: 'You',
      senderAvatar: currentUser?.photoURL,
      content: 'Doing great! Working on the new feature',
      timestamp: new Date(Date.now() - 3000000),
      type: 'text'
    },
    {
      id: '3',
      senderId: '1',
      senderName: 'John Doe',
      senderAvatar: null,
      content: 'That sounds awesome! Let me know if you need any help',
      timestamp: new Date(Date.now() - 1800000),
      type: 'text'
    },
    {
      id: '4',
      senderId: '4',
      senderName: 'Sarah Wilson',
      senderAvatar: null,
      content: 'I just finished the UI designs for the dashboard',
      timestamp: new Date(Date.now() - 600000),
      type: 'text'
    }
  ];

  useEffect(() => {
    setMessages(mockMessages);
    setOnlineMembers(groupInfo.members.filter(member => member.isOnline));
  }, [groupId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    const newMessage = {
      id: Date.now().toString(),
      senderId: currentUser.uid,
      senderName: 'You',
      senderAvatar: currentUser.photoURL,
      content: message,
      timestamp: new Date(),
      type: 'text'
    };

    setMessages(prev => [...prev, newMessage]);
    setMessage('');
    
    // TODO: Send message to Firebase
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const isOwnMessage = (senderId) => senderId === currentUser?.uid;

  const MessageBubble = ({ msg, isOwn, showAvatar }) => (
    <div className={`flex items-end space-x-2 mb-4 ${isOwn ? 'justify-end' : 'justify-start'}`}>
      {!isOwn && showAvatar && (
        <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
          {msg.senderAvatar ? (
            <img
              src={msg.senderAvatar}
              alt={msg.senderName}
              className="w-8 h-8 rounded-full object-cover"
            />
          ) : (
            <User className="w-4 h-4 text-white" />
          )}
        </div>
      )}
      
      {!isOwn && !showAvatar && <div className="w-8" />}
      
      <div className={`max-w-xs lg:max-w-md xl:max-w-lg ${isOwn ? 'order-1' : ''}`}>
        {!isOwn && showAvatar && (
          <p className="text-xs text-gray-400 mb-1 ml-1">{msg.senderName}</p>
        )}
        
        <div
          className={`px-4 py-2 rounded-2xl ${
            isOwn
              ? 'bg-blue-600 text-white rounded-br-md'
              : 'bg-white/10 text-white rounded-bl-md'
          }`}
        >
          <p className="text-sm">{msg.content}</p>
        </div>
        
        <p className={`text-xs text-gray-500 mt-1 ${isOwn ? 'text-right' : 'text-left'} px-1`}>
          {formatTime(msg.timestamp)}
        </p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex">
      {/* Sidebar - Members List */}
      <div className="hidden lg:block w-64 bg-white/5 backdrop-blur-xl border-r border-white/10">
        <div className="p-4 border-b border-white/10">
          <h3 className="text-lg font-semibold text-white mb-2">Members</h3>
          <p className="text-sm text-gray-400">{groupInfo.memberCount} total</p>
        </div>
        
        <div className="p-4">
          <div className="space-y-3">
            {groupInfo.members.map((member) => (
              <div key={member.id} className="flex items-center space-x-3 p-2 hover:bg-white/5 rounded-lg transition-colors">
                <div className="relative">
                  <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                    {member.avatar ? (
                      <img
                        src={member.avatar}
                        alt={member.name}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    ) : (
                      <User className="w-4 h-4 text-white" />
                    )}
                  </div>
                  {member.isOnline && (
                    <span className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-slate-900"></span>
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium truncate">{member.name}</p>
                  <p className="text-xs text-gray-400">
                    {member.isOnline ? 'Online' : `Last seen ${member.lastSeen}`}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Chat Header */}
        <div className="bg-white/5 backdrop-blur-xl border-b border-white/10 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link
                to="/groups"
                className="p-2 hover:bg-white/10 rounded-lg transition-colors lg:hidden"
              >
                <ArrowLeft className="w-5 h-5 text-white" />
              </Link>
              
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
                  <Hash className="w-5 h-5 text-white" />
                </div>
                
                <div>
                  <div className="flex items-center space-x-2">
                    <h1 className="text-lg font-semibold text-white">{groupInfo.name}</h1>
                    {groupInfo.isPrivate ? (
                      <Lock className="w-4 h-4 text-yellow-400" />
                    ) : (
                      <Globe className="w-4 h-4 text-green-400" />
                    )}
                  </div>
                  <p className="text-sm text-gray-400">
                    {onlineMembers.length} of {groupInfo.memberCount} online
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <button className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
                <Search className="w-5 h-5" />
              </button>
              <button className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
                <Phone className="w-5 h-5" />
              </button>
              <button className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
                <Video className="w-5 h-5" />
              </button>
              <button className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
                <MoreVertical className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Hash className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Welcome to #{groupInfo.name}</h3>
            <p className="text-gray-400 mb-4">{groupInfo.description}</p>
            <p className="text-sm text-gray-500">This is the beginning of your conversation.</p>
          </div>
          
          {messages.map((msg, index) => {
            const isOwn = isOwnMessage(msg.senderId);
            const prevMessage = messages[index - 1];
            const showAvatar = !prevMessage || prevMessage.senderId !== msg.senderId || isOwn;
            
            return (
              <MessageBubble
                key={msg.id}
                msg={msg}
                isOwn={isOwn}
                showAvatar={showAvatar}
              />
            );
          })}
          
          {isTyping && (
            <div className="flex items-center space-x-2 text-gray-400 text-sm">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
              <span>Someone is typing...</span>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <div className="bg-white/5 backdrop-blur-xl border-t border-white/10 p-4">
          <form onSubmit={handleSendMessage} className="flex items-end space-x-3">
            <button
              type="button"
              className="p-2 text-gray-400 hover:text-white transition-colors"
            >
              <Paperclip className="w-5 h-5" />
            </button>
            
            <div className="flex-1 relative">
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage(e);
                  }
                }}
                placeholder={`Message #${groupInfo.name}`}
                rows="1"
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 pr-12 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none max-h-32"
                style={{ minHeight: '48px' }}
              />
              
              <button
                type="button"
                className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 text-gray-400 hover:text-white transition-colors"
              >
                <Smile className="w-5 h-5" />
              </button>
            </div>
            
            <button
              type="submit"
              disabled={!message.trim()}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-white p-3 rounded-xl transition-colors disabled:cursor-not-allowed"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Chat;
