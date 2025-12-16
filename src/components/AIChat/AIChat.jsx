import React, { useState, useRef, useEffect } from 'react';
import { geminiService } from '../../services/geminiService';
import { useAuth } from '../../contexts/AuthContext';
import { Bot, Send, X, Sparkles, Loader2, Trash2, Minimize2, Maximize2 } from 'lucide-react';

const AIChat = ({ crewId, crewName, teamMembers, onClose, isMinimized, onToggleMinimize }) => {
  const { userProfile } = useAuth();
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'assistant',
      content: `Hi! I'm CrewBot, your AI assistant. I can help you find teammates, analyze skills, and answer questions about collaboration. What can I help you with?`,
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const context = {
        crewId,
        crewName,
        userSkills: userProfile?.skills?.map(s => s.name) || [],
        teamMembers: teamMembers?.map(m => ({
          name: m.displayName || m.username,
          skills: m.skills?.map(s => s.name)
        }))
      };

      const result = await geminiService.chat(input.trim(), context);

      const botMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: result.success ? result.response : 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, something went wrong. Please try again.',
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearChat = () => {
    geminiService.clearConversation(crewId || 'general');
    setMessages([{
      id: 'welcome',
      role: 'assistant',
      content: `Chat cleared! How can I help you?`,
      timestamp: new Date()
    }]);
  };

  const quickActions = [
    { label: 'Find teammates', prompt: 'Help me find teammates for my project' },
    { label: 'Skill gaps', prompt: 'What skills is our team missing?' },
    { label: 'Team tips', prompt: 'Give me tips for effective team collaboration' }
  ];

  if (isMinimized) {
    return (
      <div 
        onClick={onToggleMinimize}
        className="fixed bottom-4 right-4 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full p-4 cursor-pointer shadow-lg hover:shadow-xl transition-all z-50 flex items-center gap-2"
      >
        <Bot className="w-6 h-6 text-white" />
        <span className="text-white font-medium">CrewBot</span>
        <Sparkles className="w-4 h-4 text-yellow-300" />
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 w-96 h-[500px] bg-slate-900/95 backdrop-blur-xl rounded-2xl border border-white/20 shadow-2xl flex flex-col z-50">
      <div className="flex items-center justify-between p-4 border-b border-white/10 bg-gradient-to-r from-purple-600/20 to-blue-600/20 rounded-t-2xl">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-r from-purple-500 to-blue-500 p-2 rounded-lg">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-white font-semibold flex items-center gap-2">
              CrewBot
              <Sparkles className="w-4 h-4 text-yellow-400" />
            </h3>
            <p className="text-gray-400 text-xs">AI-powered assistant</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleClearChat}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors text-gray-400 hover:text-white"
            title="Clear chat"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <button
            onClick={onToggleMinimize}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors text-gray-400 hover:text-white"
          >
            <Minimize2 className="w-4 h-4" />
          </button>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors text-gray-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                msg.role === 'user'
                  ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white'
                  : 'bg-white/10 text-gray-200'
              }`}
            >
              <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
              <span className="text-xs opacity-50 mt-1 block">
                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white/10 rounded-2xl px-4 py-3 flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-purple-400" />
              <span className="text-gray-400 text-sm">Thinking...</span>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {messages.length === 1 && (
        <div className="px-4 pb-2">
          <p className="text-gray-500 text-xs mb-2">Quick actions:</p>
          <div className="flex flex-wrap gap-2">
            {quickActions.map((action, idx) => (
              <button
                key={idx}
                onClick={() => setInput(action.prompt)}
                className="text-xs bg-white/5 hover:bg-white/10 text-gray-300 px-3 py-1 rounded-full transition-colors"
              >
                {action.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="p-4 border-t border-white/10">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask CrewBot anything..."
            className="flex-1 bg-white/10 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 text-sm"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="bg-gradient-to-r from-purple-600 to-blue-600 p-3 rounded-xl text-white hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIChat;
