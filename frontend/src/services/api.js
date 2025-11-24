import axios from 'axios';

/**
 * API Service
 * Centralized API calls to backend
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const API_TIMEOUT = parseInt(import.meta.env.VITE_API_TIMEOUT) || 30000;

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Add timestamp to prevent caching
    config.params = {
      ...config.params,
      _t: Date.now()
    };
    // Add Authorization if available
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)

);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.error || error.message || 'Network error';
    return Promise.reject(new Error(message));
  }
);
// Auth APIs
export const authAPI = {
  // Registration -- expects: { email, password, name, phone }
  register: (userData) => api.post('/auth/register', userData),

  // Login -- expects: { email, password }
  login: (credentials) => api.post('/auth/login', credentials),

  // Logout (no params, uses JWT Bearer from interceptor)
  logout: () => api.post('/auth/logout'),

  // Get currently authenticated user info
  getCurrentUser: () => api.get('/auth/me')
};


// Wallet APIs
export const walletAPI = {
  generate: () => api.post('/wallet/generate'),

  recover: (mnemonic) => api.post('/wallet/recover', { mnemonic }),

  getBalance: (address, network = 'sepolia', tokenAddress = null) => {
    const body = { address, network };
    if (tokenAddress) {
      body.tokenAddress = tokenAddress;  // Only add if not null
    }
    return api.post('/wallet/balance', body);
  },


  getHistory: (address, network = 'sepolia', limit = 10) =>
    api.post('/wallet/history', { address, network, limit }),

  getGasPrices: (network = 'sepolia') =>
    api.get(`/wallet/gas-prices/${network}`),

  deriveAddresses: (mnemonic, count = 5) =>
    api.post('/wallet/derive', { mnemonic, count })
};

// Transaction APIs
export const transactionAPI = {
  estimateGas: (txParams, network = 'sepolia') =>
    api.post('/transaction/estimate-gas', { txParams, network }),

  simulate: (txParams, network = 'sepolia') =>
    api.post('/transaction/simulate', { txParams, network }),

  send: (privateKey, txParams, network = 'sepolia') =>
    api.post('/transaction/send', { privateKey, txParams, network }),

  getReceipt: (txHash, network = 'sepolia') =>
    api.post('/transaction/receipt', { txHash, network }),

  getNonce: (address, network = 'sepolia') =>
    api.post('/transaction/nonce', { address, network }),
  sendWithPassword: (password, txParams, network = 'sepolia') =>
    api.post('/transaction/send-with-password', { password, txParams, network }),
   getHistory: (params = {}) =>
    api.get('/transaction/history', { params }),

  cancel: (privateKey, nonce, network = 'sepolia') =>
    api.post('/transaction/cancel', { privateKey, nonce, network })
};

// NLP APIs
export const nlpAPI = {
  parseIntent: (message, history = []) =>
    api.post('/nlp/parse', { message, history }),

  checkHealth: () => api.get('/nlp/health')
};

// DApp APIs
export const dappAPI = {
  getSwapQuote: (fromToken, toToken, amount, network = 'sepolia') =>
    api.post('/dapp/swap/quote', { fromToken, toToken, amount, network }),

  buildSwapTx: (fromToken, toToken, amount, recipient, slippage = 0.5, network = 'sepolia') =>
    api.post('/dapp/swap/build', { fromToken, toToken, amount, recipient, slippage, network }),

  estimateSwapGas: (fromToken, toToken, amount, from, network = 'sepolia') =>
    api.post('/dapp/swap/estimate-gas', { fromToken, toToken, amount, from, network }),

  buildApprovalTx: (tokenAddress, spender, amount, network = 'sepolia') =>
    api.post('/dapp/approve/build', { tokenAddress, spender, amount, network }),

  checkAllowance: (tokenAddress, owner, spender, network = 'sepolia') =>
    api.post('/dapp/approve/check', { tokenAddress, owner, spender, network }),

  getTokenInfo: (tokenAddress, network = 'sepolia') =>
    api.post('/dapp/token/info', { tokenAddress, network })
};
export const demoAPI = {
  getBalance: (address, token = 'ETH') =>
    api.post('/demo/balance', { address, token }),

  getHistory: (address, limit = 10) =>
    api.post('/demo/history', { address, limit }),

  send: (from, to, value, token = 'ETH') =>
    api.post('/demo/send', { from, to, value, token }),

  getSwapQuote: (fromToken, toToken, amount) =>
    api.post('/demo/swap/quote', { fromToken, toToken, amount }),

  executeSwap: (from, fromToken, toToken, amount) =>
    api.post('/demo/swap/execute', { from, fromToken, toToken, amount }),

  estimateGas: (txParams) =>
    api.post('/demo/estimate-gas', { txParams })
};
// Contact APIs
export const contactAPI = {
  // Get all contacts
  getAll: (params = {}) => api.get('/contacts', { params }),
  
  // Add new contact
  add: (contactData) => api.post('/contacts', contactData),
  
  // Get contact by ID
  getById: (id) => api.get(`/contacts/${id}`),
  
  // Update contact
  update: (id, updates) => api.put(`/contacts/${id}`, updates),
  
  // Delete contact
  delete: (id) => api.delete(`/contacts/${id}`),
  
  // Get transactions with a contact
  getTransactions: (id, limit = 20) => 
    api.get(`/contacts/${id}/transactions`, { params: { limit } }),
  
  // Search contacts
  search: (query) => api.get('/contacts', { params: { search: query } }),
  
  // Get favorite contacts
  getFavorites: () => api.get('/contacts', { params: { favorite: true } })
};
export const swapAPI = {
  // Get supported tokens
  getTokens: () => api.get('/dapp/tokens'),
  
  // Get swap quote
  getQuote: (fromToken, toToken, amount, network = 'sepolia') =>
    api.post('/dapp/swap/quote', { fromToken, toToken, amount, network }),
  
  // Execute swap with password
  executeSwap: (password, swapParams, network = 'sepolia') =>
    api.post('/dapp/swap/execute', { password, swapParams, network }),
  
  // Estimate gas for swap
  estimateGas: (fromToken, toToken, amount, from, network = 'sepolia') =>
    api.post('/dapp/swap/estimate-gas', { fromToken, toToken, amount, from, network }),
  
  // Get token info
  getTokenInfo: (tokenAddress, network = 'sepolia') =>
    api.post('/dapp/token/info', { tokenAddress, network }),
  
  // Get token balance
  getTokenBalance: (address, tokenAddress, network = 'sepolia') =>
    api.post('/dapp/token/balance', { address, tokenAddress, network }),
  
  // Check token allowance
  checkAllowance: (tokenAddress, owner, spender, network = 'sepolia') =>
    api.post('/dapp/approve/check', { tokenAddress, owner, spender, network }),
  
  // Approve token
  approveToken: (password, tokenAddress, amount, network = 'sepolia') =>
    api.post('/dapp/approve/execute', { password, tokenAddress, amount, network })
};



export default api;
