import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
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
  // Check Ollama health
  checkHealth: async () => {
    return await axios.get(`${API_URL}/nlp/health`);
  },

  // Send chat message
  chat: async (message, conversationHistory = []) => {
    const token = localStorage.getItem('auth_token');
    return await axios.post(
      `${API_URL}/nlp/chat`,
      {
        message,
        conversationHistory
      },
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );
  },

  // Extract intent (fallback)
  extractIntent: async (message) => {
    const token = localStorage.getItem('auth_token');
    return await axios.post(
      `${API_URL}/nlp/extract-intent`,
      { message },
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );
  }
};

export default nlpAPI;
