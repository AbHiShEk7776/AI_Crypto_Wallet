import React, { useState, useEffect, useRef } from 'react';
import { useChat } from '../hooks/useChat';
import toast from 'react-hot-toast';
import { 
  Send, 
  Bot, 
  User, 
  Loader, 
  Trash2, 
  X, 
  Minimize2, 
  Maximize2,
  MessageCircle,
  Shield
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function FloatingChat() {
  const navigate = useNavigate();
  const { messages, loading, sendMessage, aiHealth, checkHealth, clearChat } = useChat();
  
  const [input, setInput] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [position, setPosition] = useState({ x: 20, y: 20 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  
  const messagesEndRef = useRef(null);
  const chatRef = useRef(null);
  const dragRef = useRef(null);

  // Check AI health on mount
  useEffect(() => {
    checkHealth();
  }, [checkHealth]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (isOpen && !isMinimized) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isMinimized]);

  // Handle dragging
  const handleMouseDown = (e) => {
    if (e.target === dragRef.current || dragRef.current?.contains(e.target)) {
      setIsDragging(true);
      const rect = chatRef.current.getBoundingClientRect();
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
    }
  };

  const handleMouseMove = (e) => {
    if (isDragging) {
      const newX = e.clientX - dragOffset.x;
      const newY = e.clientY - dragOffset.y;
      
      // Keep within viewport bounds
      const maxX = window.innerWidth - (chatRef.current?.offsetWidth || 400);
      const maxY = window.innerHeight - (chatRef.current?.offsetHeight || 600);
      
      setPosition({
        x: Math.max(0, Math.min(newX, maxX)),
        y: Math.max(0, Math.min(newY, maxY))
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, dragOffset]);

  // Handle send message
  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userInput = input.trim();
    setInput('');

    // Send message to AI (autonomous execution)
    const result = await sendMessage(userInput);

    // AI handles everything autonomously now
    if (result && result.executed && result.executionResult) {
      const execution = result.executionResult;
      
      if (execution.success) {
        // Show success notification based on action
        switch (execution.action) {
          case 'send_crypto':
            toast.success(`Transaction sent! Hash: ${execution.data.hash.substring(0, 10)}...`);
            break;
          case 'swap_tokens':
            toast.success(`Swap executed! ${execution.data.amountOut} ${execution.data.toToken} received`);
            break;
          case 'check_balance':
            toast.success(`Balance: ${execution.data.balance}`);
            break;
          default:
            toast.success(execution.message);
        }
      } else {
        toast.error(execution.error);
      }
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Toggle chat window
  const toggleChat = () => {
    setIsOpen(!isOpen);
    if (isMinimized) setIsMinimized(false);
  };

  // Toggle minimize
  const toggleMinimize = () => {
    setIsMinimized(!isMinimized);
  };

  return (
    <>
      {/* Floating Button - Always visible */}
      {!isOpen && (
        <button
          onClick={toggleChat}
          className="fixed bottom-6 right-6 z-50 w-16 h-16 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 hover:scale-110 group"
          title="Open AI Assistant"
        >
          <MessageCircle className="w-8 h-8 text-white" />
          {aiHealth?.running && (
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white animate-pulse" />
          )}
          <div className="absolute -top-2 -left-2 w-20 h-20 bg-purple-500/20 rounded-full blur-xl group-hover:bg-purple-500/30 transition-all" />
        </button>
      )}

      {/* Floating Chat Window */}
      {isOpen && (
        <div
          ref={chatRef}
          style={{
            position: 'fixed',
            left: `${position.x}px`,
            top: `${position.y}px`,
            zIndex: 1000,
            width: isMinimized ? '320px' : '400px',
            height: isMinimized ? 'auto' : '600px',
            transition: isDragging ? 'none' : 'all 0.3s ease'
          }}
          className="bg-gray-900 rounded-2xl shadow-2xl border border-white/10 overflow-hidden flex flex-col"
        >
          {/* Header - Draggable */}
          <div
            ref={dragRef}
            onMouseDown={handleMouseDown}
            className="flex items-center justify-between p-4 border-b border-white/10 bg-gradient-to-r from-purple-600/20 to-pink-600/20 backdrop-blur-sm cursor-move select-none"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                <Bot className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-white font-semibold flex items-center gap-2">
                  AI Agent
                  <span className="text-xs bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full">
                    Autonomous
                  </span>
                </h3>
                <div className="flex items-center gap-2">
                  {aiHealth?.running ? (
                    <>
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                      <span className="text-xs text-green-400">Executing</span>
                    </>
                  ) : (
                    <>
                      <div className="w-2 h-2 bg-red-500 rounded-full" />
                      <span className="text-xs text-red-400">Offline</span>
                    </>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={clearChat}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                title="Clear chat"
              >
                <Trash2 className="w-4 h-4 text-white/70" />
              </button>
              <button
                onClick={toggleMinimize}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                title={isMinimized ? "Expand" : "Minimize"}
              >
                {isMinimized ? (
                  <Maximize2 className="w-4 h-4 text-white/70" />
                ) : (
                  <Minimize2 className="w-4 h-4 text-white/70" />
                )}
              </button>
              <button
                onClick={toggleChat}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                title="Close"
              >
                <X className="w-4 h-4 text-white/70" />
              </button>
            </div>
          </div>

          {/* Content - Only show when not minimized */}
          {!isMinimized && (
            <>
              {/* Security Notice */}
              <div className="p-2 bg-yellow-500/10 border-b border-yellow-500/20">
                <div className="flex items-start gap-2 text-xs text-yellow-300">
                  <Shield className="w-3 h-3 flex-shrink-0 mt-0.5" />
                  <p>Include "password: your_password" for transactions</p>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gradient-to-b from-gray-900 to-gray-800">
                {messages.map((msg, index) => (
                  <div
                    key={index}
                    className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    {msg.role === 'assistant' && (
                      <div className="w-7 h-7 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                        <Bot className="w-4 h-4 text-white" />
                      </div>
                    )}
                    
                    <div
                      className={`max-w-[75%] rounded-xl px-3 py-2 text-sm ${
                        msg.role === 'user'
                          ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white'
                          : 'bg-white/10 text-white border border-white/10'
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    </div>

                    {msg.role === 'user' && (
                      <div className="w-7 h-7 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center flex-shrink-0">
                        <User className="w-4 h-4 text-white" />
                      </div>
                    )}
                  </div>
                ))}

                {loading && (
                  <div className="flex gap-2 justify-start">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                      <Bot className="w-4 h-4 text-white" />
                    </div>
                    <div className="bg-white/10 rounded-xl px-3 py-2 border border-white/10">
                      <div className="flex items-center gap-2">
                        <Loader className="w-3 h-3 animate-spin text-purple-400" />
                        <span className="text-xs text-white/70">Executing...</span>
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="p-3 border-t border-white/10 bg-gray-900">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Ask me anything..."
                    className="flex-1 bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    disabled={loading}
                  />
                  <button
                    onClick={handleSend}
                    disabled={loading || !input.trim()}
                    className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-all duration-200"
                  >
                    {loading ? (
                      <Loader className="w-4 h-4 text-white animate-spin" />
                    ) : (
                      <Send className="w-4 h-4 text-white" />
                    )}
                  </button>
                </div>

                {/* Quick actions */}
                <div className="flex flex-wrap gap-1 mt-2">
                  <button
                    onClick={() => setInput("What's my balance?")}
                    className="px-2 py-1 text-xs bg-white/5 hover:bg-white/10 text-white/70 rounded transition-colors"
                  >
                    Balance
                  </button>
                  <button
                    onClick={() => setInput("Show last 5 transactions")}
                    className="px-2 py-1 text-xs bg-white/5 hover:bg-white/10 text-white/70 rounded transition-colors"
                  >
                    History
                  </button>
                  <button
                    onClick={() => setInput("Show my contacts")}
                    className="px-2 py-1 text-xs bg-white/5 hover:bg-white/10 text-white/70 rounded transition-colors"
                  >
                    Contacts
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}
