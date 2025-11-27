import { useState, useCallback, useRef } from 'react';
import nlpAPI from '../services/nlpAPI';
import toast from 'react-hot-toast';

export const useChat = () => {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Hi! I'm your autonomous AI wallet agent. I can execute actions directly:\n\n• Check balance\n• Send transactions (with password)\n• Swap tokens (with password)\n• View history\n• Manage contacts\n\nJust tell me what to do!"
    }
  ]);
  const [loading, setLoading] = useState(false);
  const [aiHealth, setAiHealth] = useState(null);
  const timeoutRef = useRef(null);

  const checkHealth = useCallback(async () => {
    try {
      const { data } = await nlpAPI.checkHealth();
      setAiHealth(data);
    } catch (error) {
      setAiHealth({ running: false });
    }
  }, []);

  const sendMessage = useCallback(async (content) => {
  const token = localStorage.getItem('auth_token');
  if (!token) {
    toast.error('Please login to use the AI agent');
    return null;
  }

  const userMessage = { role: 'user', content };
  setMessages(prev => [...prev, userMessage]);
  setLoading(true);

  timeoutRef.current = setTimeout(() => {
    toast('🤖 AI is processing...', {
      duration: 3000,
      icon: '⚡'
    });
  }, 2000);

  try {
    const { data } = await nlpAPI.chat(content, messages);

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    if (data.success) {
      let responseContent = data.response;
      const exec = data.executionResult;

      // If action was executed, add execution results
      if (data.executed && exec) {
        const result = exec;

        // ⚠️ Special case: for transaction_history, ignore model text completely
        if (result.action === 'transaction_history') {
          const txs = result.data?.transactions || [];

          if (txs.length === 0) {
            responseContent = 'No transactions found.'; // backend already decided this
          } else {
            responseContent = result.message || 'Transaction history fetched successfully.';
            responseContent += `\n\n📊 Transaction History (${txs.length}):`;

            txs.forEach((tx, i) => {
              const icon = tx.type === 'received' ? '📥' :
                           tx.type === 'swap' ? '🔄' : '📤';
              const sign = tx.type === 'received' ? '+' : '-';

              responseContent += `\n\n${i + 1}. ${icon} ${tx.type.toUpperCase()} ${sign}${tx.value} ${tx.token}`;
              responseContent += `\n   From: ${tx.fromShort}`;
              responseContent += `\n   To:   ${tx.toShort}`;
              responseContent += `\n   Hash: ${tx.hashShort}`;
              responseContent += `\n   Time: ${tx.date}`;
              responseContent += `\n   Status: ${tx.status}`;
            });
          }
        } else if (result.success) {
          // Original branches for other actions stay as‑is
          responseContent += `\n\n✅ ${result.message}`;

          if (result.action === 'check_balance') {
            responseContent += `\n\n💰 Balance: ${result.data.balance}`;
            responseContent += `\n📍 Network: ${result.data.network}`;
          } 
          else if (result.action === 'send_crypto') {
            responseContent += `\n\n📤 Transaction Details:`;
            responseContent += `\n• Hash: ${result.data.hash.substring(0, 20)}...`;
            responseContent += `\n• To: ${result.data.to.substring(0, 10)}...`;
            responseContent += `\n• Amount: ${result.data.amount} ${result.data.token}`;
            responseContent += `\n• Block: ${result.data.blockNumber}`;
          } 
          else if (result.action === 'view_contacts') {
            if (result.data.count > 0) {
              responseContent += `\n\n👥 Your Contacts (${result.data.count}):`;
              result.data.contacts.forEach((contact, i) => {
                responseContent += `\n${i + 1}. ${contact.name}`;
                responseContent += `\n   📍 ${contact.displayAddress}`;
              });
              responseContent += `\n\n💡 Tip: Send ETH using contact names like "Send 0.1 ETH to ${result.data.contacts[0].name}"`;
            } else {
              responseContent += `\n\n👥 No contacts saved yet.`;
              responseContent += `\n\n💡 Add a contact: "Save 0x... as Name"`;
            }
          }
          else if (result.action === 'add_contact') {
            responseContent += `\n\n✅ Contact Added:`;
            responseContent += `\n• Name: ${result.data.name}`;
            responseContent += `\n• Address: ${result.data.address}`;
          }

        } else {
          responseContent += `\n\n❌ Error: ${result.error}`;
        }
      }

      const assistantMessage = {
        role: 'assistant',
        content: responseContent
      };
      setMessages(prev => [...prev, assistantMessage]);

      return {
        intent: data.intent,
        parameters: data.parameters,
        executionResult: data.executionResult,
        executed: data.executed
      };
    }
  } catch (error) {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    console.error('❌ Chat error:', error);
    
    let errorMsg = 'Sorry, I encountered an error.';
    
    if (error.response?.status === 401) {
      errorMsg = '🔒 Please login again.';
      toast.error('Session expired');
    }
    
    setMessages(prev => [...prev, { role: 'assistant', content: errorMsg }]);
  } finally {
    setLoading(false);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  }

  return null;
}, [messages]);


  const clearChat = useCallback(() => {
    setMessages([
      {
        role: 'assistant',
        content: "Chat cleared! What would you like me to do?"
      }
    ]);
  }, []);

  return {
    messages,
    loading,
    sendMessage,
    aiHealth,
    checkHealth,
    clearChat
  };
};
