import React, { useEffect, useRef, useState } from 'react';
import { useChat } from '@hooks/useChat';
import useWalletStore from '@store/walletStore';
import { demoAPI, walletAPI } from '@services/api';
import toast from 'react-hot-toast';
import { Send, Mic, AlertCircle, Zap, Sparkles, Bot, User, Loader } from 'lucide-react';
import { formatNumber } from '@utils/formatters';

export default function ChatInterface() {
  const { wallet, network, balance, demoMode } = useWalletStore();
  const { messages, loading, sendMessage, checkOllamaHealth, ollamaHealth, addAssistantMessage } = useChat();
  const [input, setInput] = useState('');
  const endRef = useRef(null);

  useEffect(() => {
    checkOllamaHealth();
  }, [checkOllamaHealth]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSend = async () => {
    if (!input.trim()) return;
    const content = input.trim();
    setInput('');

    const result = await sendMessage(content);
    
    if (result?.intent) {
      if (result.intent === 'check_balance') {
        try {
          const api = demoMode ? demoAPI : walletAPI;
          const { data } = await api.getBalance(wallet.address, network);
          
          if (data.success) {
            const bal = parseFloat(data.balance.balance);
            const usd = (bal * 2000).toFixed(2);
            addAssistantMessage(
              `Your current balance is **${formatNumber(bal, 6)} ETH** (≈ $${usd} USD) on ${network}${demoMode ? ' (demo)' : ''}.`
            );
          }
        } catch (e) {
          addAssistantMessage(`I couldn't fetch your balance right now. Error: ${e.message}`);
        }
      } else if (result.intent === 'send_crypto') {
        const { amount, token, recipient } = result.parameters;
        addAssistantMessage(
          `Got it! You want to send **${amount} ${token}** to **${recipient.slice(0, 10)}...${recipient.slice(-6)}**.\n\n` +
          `${demoMode ? '🎮 Demo mode is active, so this will be a simulated transaction.' : '⚠️ This is a real transaction.'}\n\n` +
          `Please go to the **Send** screen to review and confirm this transaction.`
        );
      } else if (result.intent === 'swap_tokens') {
        const { amount, from_token, to_token } = result.parameters;
        addAssistantMessage(
          `Perfect! I'll help you swap **${amount} ${from_token}** to **${to_token}**.\n\n` +
          `${demoMode ? '🎮 Demo mode: This will use mock exchange rates.' : '⚠️ Live swap using Uniswap.'}\n\n` +
          `Head to the **Swap** screen to get a quote and execute the swap.`
        );
      } else if (result.intent === 'explain_transaction') {
        addAssistantMessage(
          `Transaction explanation feature is coming soon! For now, you can view transactions on Etherscan:\n\n` +
          `https://sepolia.etherscan.io/tx/${result.parameters.tx_hash}`
        );
      } else if (result.intent === 'get_market_forecast') {
        addAssistantMessage(
          `📊 Market prediction features (Phase 5-6) are under development!\n\n` +
          `This will include:\n` +
          `• Price forecasting using LSTM/Transformer models\n` +
          `• Implied volatility predictions\n` +
          `• Sentiment analysis from news/social media\n\n` +
          `Stay tuned! 🚀`
        );
      } else {
        addAssistantMessage(result.explanation || 'Action understood. Let me know if you need help!');
      }
    }
  };

  const suggestedQuestions = [
    "What's my balance?",
    "Send 0.01 ETH to 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
    "Swap 0.1 ETH to USDC",
    "What can you do?",
    "How do I send crypto?"
  ];

  const handleSuggestion = (question) => {
    setInput(question);
  };

  return (
    <div className="min-h-screen pb-20">
      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="glass-dark rounded-3xl shadow-dark-lg h-[85vh] flex flex-col border border-white/10 overflow-hidden animate-fade-in">
          
          {/* Header */}
          <div className="p-6 border-b border-white/10 bg-gradient-to-r from-indigo-500/10 to-purple-500/10">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 gradient-primary rounded-xl flex items-center justify-center">
                    <Sparkles className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">AI Wallet Assistant</h2>
                    <p className="text-sm text-white/60 flex items-center gap-2">
                      {network} • {wallet.address.slice(0, 8)}...{wallet.address.slice(-6)}
                      {demoMode && (
                        <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 text-xs rounded-full flex items-center gap-1">
                          <Zap className="w-3 h-3" />
                          Demo
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Status Indicators */}
              <div className="flex items-center gap-3">
                {ollamaHealth && (!ollamaHealth.running || !ollamaHealth.modelAvailable) ? (
                  <div className="px-3 py-2 bg-red-500/20 rounded-xl border border-red-500/30 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-red-400" />
                    <div className="text-left">
                      <p className="text-xs font-semibold text-red-300">AI Offline</p>
                      <p className="text-xs text-red-400">Start Ollama</p>
                    </div>
                  </div>
                ) : (
                  <div className="px-3 py-2 bg-green-500/20 rounded-xl border border-green-500/30 flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="text-xs font-semibold text-green-300">AI Ready</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-black/20">
            {/* Welcome & Suggestions */}
            {messages.length === 1 && (
              <div className="glass-light rounded-2xl p-6 border border-white/10 mb-6 animate-fade-in">
                <div className="flex items-center gap-3 mb-4">
                  <Bot className="w-8 h-8 text-indigo-400" />
                  <div>
                    <p className="font-bold text-white text-lg">Hi there! 👋</p>
                    <p className="text-sm text-white/70">I'm your AI wallet assistant. Try asking:</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {suggestedQuestions.map((q, i) => (
                    <button
                      key={i}
                      onClick={() => handleSuggestion(q)}
                      className="text-left text-sm bg-white/5 hover:bg-white/10 border border-white/10 hover:border-indigo-500/50 px-4 py-3 rounded-xl transition-all duration-300 text-white/90 hover:text-white group"
                    >
                      <span className="flex items-center gap-2">
                        <Sparkles className="w-3 h-3 text-indigo-400 group-hover:text-indigo-300" />
                        {q}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Chat Messages */}
            {messages.map((m, i) => (
              <div 
                key={i} 
                className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}
              >
                {m.role === 'assistant' && (
                  <div className="w-8 h-8 gradient-primary rounded-xl flex items-center justify-center mr-3 flex-shrink-0 mt-1">
                    <Bot className="w-5 h-5 text-white" />
                  </div>
                )}
                
                <div 
                  className={`px-5 py-3 rounded-2xl max-w-[75%] shadow-lg ${
                    m.role === 'user' 
                      ? 'gradient-blue text-white' 
                      : 'glass-light border border-white/10 text-white'
                  }`}
                  style={{ whiteSpace: 'pre-wrap' }}
                >
                  {m.content.split('**').map((part, idx) => 
                    idx % 2 === 0 ? part : <strong key={idx} className="font-bold">{part}</strong>
                  )}
                </div>

                {m.role === 'user' && (
                  <div className="w-8 h-8 bg-white/10 rounded-xl flex items-center justify-center ml-3 flex-shrink-0 mt-1 border border-white/20">
                    <User className="w-5 h-5 text-white" />
                  </div>
                )}
              </div>
            ))}
            
            {/* Loading */}
            {loading && (
              <div className="flex justify-start animate-fade-in">
                <div className="w-8 h-8 gradient-primary rounded-xl flex items-center justify-center mr-3 flex-shrink-0">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <div className="glass-light border border-white/10 px-5 py-4 rounded-2xl">
                  <div className="flex gap-2">
                    <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={endRef} />
          </div>

          {/* Input Area */}
          <div className="p-6 border-t border-white/10 bg-gradient-to-r from-indigo-500/5 to-purple-500/5">
            <div className="flex gap-3">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                placeholder="Ask me anything... (e.g., 'What's my balance?' or 'Send 0.1 ETH to 0x...')"
                className="flex-1 bg-white/5 border border-white/10 px-5 py-4 rounded-xl text-white placeholder-white/40 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition"
                disabled={loading}
              />
              
              <button 
                onClick={() => toast('Voice input coming soon! 🎤')} 
                className="px-4 py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all duration-300 group"
                title="Voice input (coming soon)"
              >
                <Mic className="w-5 h-5 text-white/70 group-hover:text-white" />
              </button>
              
              <button 
                onClick={handleSend}
                disabled={loading || !input.trim()}
                className="px-6 py-4 gradient-primary text-white rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-xl flex items-center gap-2 font-semibold group"
              >
                {loading ? (
                  <Loader className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Send className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
                    Send
                  </>
                )}
              </button>
            </div>
            
            {demoMode && (
              <div className="mt-3 flex items-start gap-2 px-4 py-2 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                <Zap className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-300">
                  Demo mode active: All actions are simulated. Toggle off in the navbar for real blockchain transactions.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
