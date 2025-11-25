import { useState, useCallback, useRef } from 'react';
import nlpAPI from '../services/nlpAPI';
import toast from 'react-hot-toast';

export const useChat = () => {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Hi! I'm your crypto wallet assistant. I can help you:\n\n• Check your balance\n• Send transactions\n• Swap tokens\n• View transaction history\n• Manage contacts\n\nWhat would you like to do?"
    }
  ]);
  const [loading, setLoading] = useState(false);
  const [aiHealth, setAiHealth] = useState(null);
  const timeoutRef = useRef(null);

  // Check AI service health
  const checkHealth = useCallback(async () => {
    try {
      const { data } = await nlpAPI.checkHealth();
      setAiHealth(data);
      console.log('✅ AI Health:', data);
    } catch (error) {
      setAiHealth({
        running: false,
        modelAvailable: false
      });
      console.error('❌ Health check failed:', error);
    }
  }, []);

  // Send message to AI
  const sendMessage = useCallback(async (content) => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      toast.error('Please login to use the chat');
      return null;
    }

    const userMessage = { role: 'user', content };
    setMessages(prev => [...prev, userMessage]);
    setLoading(true);

    // Show "thinking" indicator after 2 seconds
    timeoutRef.current = setTimeout(() => {
      toast('🤖 AI is thinking...', {
        duration: 3000,
        icon: '⏳'
      });
    }, 2000);

    try {
      console.log('📤 Sending message to AI...');
      
      const { data } = await nlpAPI.chat(content, messages);

      // Clear timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      if (data.success) {
        const assistantMessage = {
          role: 'assistant',
          content: data.response
        };
        setMessages(prev => [...prev, assistantMessage]);

        console.log('✅ AI Response:', data);

        // Return intent and parameters for action handling
        return {
          intent: data.intent,
          parameters: data.parameters,
          explanation: data.response,
          processingTime: data.processingTime
        };
      }
    } catch (error) {
      // Clear timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      console.error('❌ Chat error:', error);
      
      let errorMsg = 'Sorry, I encountered an error. Please try again.';
      
      if (error.response?.status === 401) {
        errorMsg = '🔒 Authentication failed. Please login again.';
        toast.error('Session expired');
      } else if (error.response?.status === 503) {
        errorMsg = '🤖 AI service is currently unavailable. Please try again later.';
        toast.error('AI service unavailable');
      } else if (error.response?.status === 429) {
        errorMsg = '⏱️ Too many requests. Please wait a moment and try again.';
        toast.error('Rate limit exceeded');
      } else if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
        errorMsg = '⏱️ Request timed out. Please try again.';
        toast.error('Request timeout');
      } else if (error.message === 'No authentication token found') {
        errorMsg = '🔒 Please login to use the chat.';
        toast.error('Please login first');
      }
      
      const errorMessage = {
        role: 'assistant',
        content: errorMsg
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    }

    return null;
  }, [messages]);

  // Add assistant message manually
  const addAssistantMessage = useCallback((content) => {
    setMessages(prev => [...prev, { role: 'assistant', content }]);
  }, []);

  // Clear conversation
  const clearChat = useCallback(() => {
    setMessages([
      {
        role: 'assistant',
        content: "Chat cleared! How can I help you?"
      }
    ]);
  }, []);

  return {
    messages,
    loading,
    sendMessage,
    aiHealth,
    checkHealth,
    addAssistantMessage,
    clearChat
  };
};
