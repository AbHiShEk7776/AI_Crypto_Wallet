import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useChat } from '@hooks/useChat';
import toast from 'react-hot-toast';
import { Send, Bot, User, Loader, Trash2, CheckCircle } from 'lucide-react';

export default function ChatInterface({ 
  onSendTransaction, 
  onSwapTokens, 
  onViewBalance,
  onViewHistory,
  onViewContacts 
}) {
  const navigate = useNavigate();
  const { messages, loading, sendMessage, aiHealth, checkHealth, clearChat } = useChat();
  
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);

  // Check AI health on mount
  useEffect(() => {
    checkHealth();
  }, [checkHealth]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle send message
  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userInput = input.trim();
    setInput('');

    // Send message to AI
    const result = await sendMessage(userInput);

    // Handle detected intents and initiate actions
    if (result && result.intent) {
      console.log(' Detected intent:', result.intent);
      console.log(' Parameters:', result.parameters);

      // Show processing time
      if (result.processingTime) {
        console.log(`⚡ Processed in ${result.processingTime}ms`);
      }

      // Route to appropriate action
      switch (result.intent) {
        case 'check_balance':
          handleCheckBalance();
          break;

        case 'send_crypto':
          handleInitiateSend(result.parameters);
          break;

        case 'swap_tokens':
          handleInitiateSwap(result.parameters);
          break;

        case 'transaction_history':
          handleShowHistory();
          break;

        case 'view_contacts':
          handleShowContacts();
          break;

        case 'explain':
          // Just show the AI response (already in messages)
          break;

        default:
          console.log(' Unknown intent:', result.intent);
          break;
      }
    }
  };

  // Action handlers
  const handleCheckBalance = () => {
    if (onViewBalance) {
      onViewBalance();
    } else {
      navigate('/dashboard');
      toast.success('Checking your balance...');
    }
  };

  const handleInitiateSend = (params) => {
    if (onSendTransaction) {
      onSendTransaction({
        recipient: params.recipient || '',
        amount: params.amount || '',
        token: params.token || 'ETH'
      });
      toast.success('Opening send transaction...');
    } else {
      navigate('/send', { 
        state: { 
          recipient: params.recipient,
          amount: params.amount,
          token: params.token 
        }
      });
    }
  };

  const handleInitiateSwap = (params) => {
    if (onSwapTokens) {
      onSwapTokens({
        fromToken: params.fromToken || 'ETH',
        toToken: params.toToken || 'USDC',
        amount: params.amount || ''
      });
      toast.success('Opening token swap...');
    } else {
      navigate('/swap', { 
        state: { 
          fromToken: params.fromToken,
          toToken: params.toToken,
          amount: params.amount 
        }
      });
    }
  };

  const handleShowHistory = () => {
    if (onViewHistory) {
      onViewHistory();
    } else {
      navigate('/transactions');
      toast.success('Loading transaction history...');
    }
  };

  const handleShowContacts = () => {
    if (onViewContacts) {
      onViewContacts();
    } else {
      navigate('/contacts');
      toast.success('Loading contacts...');
    }
  };

  // Handle key press
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10 bg-white/5 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center">
            <Bot className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-white font-semibold">AI Assistant</h3>
            <div className="flex items-center gap-2">
              {aiHealth?.running ? (
                <>
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-xs text-green-400">Online</span>
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
        
        <button
          onClick={clearChat}
          className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          title="Clear chat"
        >
          <Trash2 className="w-5 h-5 text-white/70" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.role === 'assistant' && (
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center flex-shrink-0">
                <Bot className="w-5 h-5 text-white" />
              </div>
            )}
            
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                msg.role === 'user'
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white'
                  : 'bg-white/10 text-white border border-white/10'
              }`}
            >
              <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
            </div>

            {msg.role === 'user' && (
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center flex-shrink-0">
                <User className="w-5 h-5 text-white" />
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex gap-3 justify-start">
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div className="bg-white/10 rounded-2xl px-4 py-3 border border-white/10">
              <div className="flex items-center gap-2">
                <Loader className="w-4 h-4 animate-spin text-indigo-400" />
                <span className="text-sm text-white/70">Thinking...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-white/10 bg-white/5 backdrop-blur-sm">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask me anything about your wallet..."
            className="flex-1 bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            disabled={loading}
          />
          <button
            onClick={handleSend}
            disabled={loading || !input.trim()}
            className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-all duration-200 flex items-center gap-2"
          >
            {loading ? (
              <Loader className="w-5 h-5 text-white animate-spin" />
            ) : (
              <Send className="w-5 h-5 text-white" />
            )}
          </button>
        </div>

        {/* Quick actions */}
        <div className="flex flex-wrap gap-2 mt-3">
          <button
            onClick={() => setInput("What's my balance?")}
            className="px-3 py-1.5 text-xs bg-white/5 hover:bg-white/10 text-white/70 rounded-lg transition-colors"
          >
            Check Balance
          </button>
          <button
            onClick={() => setInput("Show my transaction history")}
            className="px-3 py-1.5 text-xs bg-white/5 hover:bg-white/10 text-white/70 rounded-lg transition-colors"
          >
            View History
          </button>
          <button
            onClick={() => setInput("Show my contacts")}
            className="px-3 py-1.5 text-xs bg-white/5 hover:bg-white/10 text-white/70 rounded-lg transition-colors"
          >
            My Contacts
          </button>
        </div>
      </div>
    </div>
  );
}
