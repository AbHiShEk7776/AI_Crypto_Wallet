import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Get auth token helper - use 'auth_token' to match your store
const getAuthHeader = () => {
  const token = localStorage.getItem('auth_token');
  if (!token) {
    throw new Error('No authentication token found');
  }
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
};

const nlpAPI = {
  // Check AI service health (no auth needed)
  checkHealth: async () => {
    try {
      console.log('🔍 Checking NLP service health...');
      return await axios.get(`${API_URL}/nlp/health`);
    } catch (error) {
      console.error('Health check error:', error);
      throw error;
    }
  },

  // Send chat message (requires auth)
  chat: async (message, conversationHistory = []) => {
    try {
      const headers = getAuthHeader();
      console.log('💬 Sending chat message...');
      
      return await axios.post(
        `${API_URL}/nlp/chat`,
        {
          message,
          conversationHistory: conversationHistory.slice(-5) // Only send last 5 messages
        },
        { 
          headers,
          timeout: 15000 // 15 second timeout
        }
      );
    } catch (error) {
      console.error('❌ Chat API error:', error.response?.data || error.message);
      throw error;
    }
  },

  // Extract intent using regex fallback (requires auth)
  extractIntent: async (message) => {
    try {
      const headers = getAuthHeader();
      return await axios.post(
        `${API_URL}/nlp/extract-intent`,
        { message },
        { headers, timeout: 5000 }
      );
    } catch (error) {
      console.error('Extract intent error:', error.response?.data || error.message);
      throw error;
    }
  }
};

export default nlpAPI;
