import React, { useEffect, useRef, useState } from 'react';
import { useChat } from '@hooks/useChat';
import useWalletStore from '@store/walletStore';
import { demoAPI, walletAPI } from '@services/api';
import toast from 'react-hot-toast';
import { Send, Mic, AlertCircle, Zap, Sparkles } from 'lucide-react';
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
      // Handle specific intents with live data
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
    <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl h-[80vh] flex flex-col">
      {/* Header */}
      <div className="p-6 border-b flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold">Chat with Your Wallet</h2>
            <Sparkles className="w-5 h-5 text-indigo-600" />
          </div>
          <p className="text-sm text-gray-600 mt-1">
            Network: {network} | Address: {wallet.address.slice(0, 10)}...
            {demoMode && <span className="ml-2 text-amber-600">(Demo Mode)</span>}
          </p>
        </div>
        
        {ollamaHealth && (!ollamaHealth.running || !ollamaHealth.modelAvailable) && (
          <div className="text-red-600 text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            <div>
              <p className="font-medium">AI Offline</p>
              <p className="text-xs">Start Ollama: <code>ollama serve</code></p>
            </div>
          </div>
        )}

        {demoMode && ollamaHealth?.running && (
          <div className="text-amber-600 text-sm flex items-center gap-2">
            <Zap className="w-4 h-4" />
            <span>Demo Mode Active</span>
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.length === 1 && (
          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <p className="font-medium text-gray-900 mb-2">Try asking:</p>
            <div className="flex flex-wrap gap-2">
              {suggestedQuestions.map((q, i) => (
                <button
                  key={i}
                  onClick={() => handleSuggestion(q)}
                  className="text-xs bg-white border hover:bg-gray-50 px-3 py-2 rounded-lg transition"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div 
              className={`px-4 py-3 rounded-2xl max-w-[80%] ${
                m.role === 'user' 
                  ? 'bg-indigo-600 text-white' 
                  : 'bg-gray-100 text-gray-900'
              }`}
              style={{ whiteSpace: 'pre-wrap' }}
            >
              {m.content.split('**').map((part, idx) => 
                idx % 2 === 0 ? part : <strong key={idx}>{part}</strong>
              )}
            </div>
          </div>
        ))}
        
        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 text-gray-900 px-4 py-3 rounded-2xl">
              <div className="flex gap-2">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={endRef} />
      </div>

      {/* Input */}
      <div className="p-6 border-t">
        <div className="flex gap-3">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
            placeholder="Ask me anything... (e.g., 'What's my balance?' or 'Send 0.1 ETH to 0x...')"
            className="flex-1 border px-4 py-3 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            disabled={loading}
          />
          <button 
            onClick={() => toast('Voice input coming soon! 🎤')} 
            className="px-4 py-3 rounded-xl bg-gray-100 hover:bg-gray-200 transition"
          >
            <Mic className="w-5 h-5" />
          </button>
          <button 
            onClick={handleSend}
            disabled={loading || !input.trim()}
            className="px-4 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
        
        {demoMode && (
          <p className="text-xs text-amber-600 mt-2">
            💡 Demo mode: All actions are simulated. Toggle off in the navbar for real blockchain transactions.
          </p>
        )}
      </div>
    </div>
  );
}
