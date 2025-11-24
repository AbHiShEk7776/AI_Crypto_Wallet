import { useState, useCallback } from 'react';
import nlpAPI from '@services/nlpAPI';

export const useChat = () => {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'Hi! I\'m your crypto wallet assistant. I can help you check balances, send transactions, swap tokens, and more. What would you like to do?'
    }
  ]);
  const [loading, setLoading] = useState(false);
  const [ollamaHealth, setOllamaHealth] = useState(null);

  const checkOllamaHealth = useCallback(async () => {
    try {
      const { data } = await nlpAPI.checkHealth();
      setOllamaHealth(data);
    } catch (error) {
      setOllamaHealth({
        running: false,
        modelAvailable: false
      });
    }
  }, []);

  const sendMessage = useCallback(async (content) => {
    // Add user message
    const userMessage = { role: 'user', content };
    setMessages(prev => [...prev, userMessage]);
    setLoading(true);

    try {
      // Send to NLP backend
      const { data } = await nlpAPI.chat(content, messages);

      if (data.success) {
        // Add assistant response
        const assistantMessage = {
          role: 'assistant',
          content: data.response
        };
        setMessages(prev => [...prev, assistantMessage]);

        // Return intent and parameters for UI handling
        return {
          intent: data.intent,
          parameters: data.parameters,
          explanation: data.response
        };
      }
    } catch (error) {
      const errorMessage = {
        role: 'assistant',
        content: error.response?.data?.error || 'Sorry, I encountered an error. Please try again.'
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }

    return null;
  }, [messages]);

  const addAssistantMessage = useCallback((content) => {
    setMessages(prev => [...prev, { role: 'assistant', content }]);
  }, []);

  return {
    messages,
    loading,
    sendMessage,
    ollamaHealth,
    checkOllamaHealth,
    addAssistantMessage
  };
};
