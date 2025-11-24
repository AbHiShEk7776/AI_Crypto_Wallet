import { useState, useCallback } from 'react';
import { nlpAPI } from '@services/api';
import toast from 'react-hot-toast';
import { parseError } from '@utils/formatters';

/**
 * Custom hook for chat/NLP operations
 * Manages conversation state and intent parsing
 */

export const useChat = () => {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Hi! I'm your crypto wallet assistant powered by AI. How can I help you today?"
    }
  ]);
  const [loading, setLoading] = useState(false);
  const [ollamaHealth, setOllamaHealth] = useState(null);

  /**
   * Check if Ollama is running
   */
  const checkOllamaHealth = useCallback(async () => {
    try {
      const { data } = await nlpAPI.checkHealth();
      setOllamaHealth(data);

      if (!data.running) {
        toast.error('AI service is offline. Please start Ollama.');
      } else if (!data.modelAvailable) {
        toast.error(`Model ${data.model} not found. Please install it.`);
      }

      return data;
    } catch (error) {
      console.error('Ollama health check failed:', error);
      setOllamaHealth({ running: false });
      return { running: false };
    }
  }, []);

  /**
   * Send message and get AI response
   */
  const sendMessage = useCallback(async (userMessage) => {
    if (!userMessage.trim()) return;

    // Add user message
    const newUserMessage = { role: 'user', content: userMessage };
    setMessages((prev) => [...prev, newUserMessage]);
    setLoading(true);

    try {
      // Get conversation history (last 4 messages)
      const history = messages.slice(-4);

      // Parse intent using AI
      const { data } = await nlpAPI.parseIntent(userMessage, history);

      let responseMessage;

      if (!data.success) {
        responseMessage = {
          role: 'assistant',
          content: data.error || "I couldn't understand that. Can you rephrase?"
        };
      } else if (data.intent === 'conversation') {
        responseMessage = {
          role: 'assistant',
          content: data.response
        };
      } else {
        // Return structured intent for handling by caller
        return {
          success: true,
          intent: data.intent,
          parameters: data.parameters,
          explanation: data.explanation,
          requiresConfirmation: data.requiresConfirmation,
          confidence: data.confidence
        };
      }

      setMessages((prev) => [...prev, responseMessage]);
      return { success: true, message: responseMessage };

    } catch (error) {
      console.error('Message send error:', error);
      const errorMessage = {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please make sure the AI service is running.'
      };
      setMessages((prev) => [...prev, errorMessage]);
      toast.error(parseError(error));
      return { success: false, error: parseError(error) };
    } finally {
      setLoading(false);
    }
  }, [messages]);

  /**
   * Add assistant message manually
   */
  const addAssistantMessage = useCallback((content) => {
    setMessages((prev) => [...prev, { role: 'assistant', content }]);
  }, []);

  /**
   * Clear conversation
   */
  const clearMessages = useCallback(() => {
    setMessages([
      {
        role: 'assistant',
        content: "Conversation cleared. How can I help you?"
      }
    ]);
  }, []);

  return {
    messages,
    loading,
    ollamaHealth,
    sendMessage,
    addAssistantMessage,
    clearMessages,
    checkOllamaHealth
  };
};
