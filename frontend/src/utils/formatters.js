import { ethers } from 'ethers';

/**
 * Utility functions for formatting data
 */

/**
 * Shorten Ethereum address
 * @param {string} address - Full Ethereum address
 * @param {number} chars - Number of chars to show on each side
 * @returns {string} Shortened address
 */
export const shortenAddress = (address, chars = 4) => {
  if (!address) return '';
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
};

/**
 * Format number with commas
 * @param {number|string} num - Number to format
 * @param {number} decimals - Decimal places
 * @returns {string} Formatted number
 */
export const formatNumber = (num, decimals = 4) => {
  const number = parseFloat(num);
  if (isNaN(number)) return '0';
  
  return number.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals
  });
};

/**
 * Format timestamp to readable date
 * @param {number} timestamp - Unix timestamp
 * @returns {string} Formatted date
 */
export const formatDate = (timestamp) => {
  const date = new Date(timestamp * 1000);
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

/**
 * Format balance with token symbol
 * @param {string|number} balance - Balance amount
 * @param {string} symbol - Token symbol
 * @param {number} decimals - Decimal places
 * @returns {string} Formatted balance
 */
export const formatBalance = (balance, symbol = 'ETH', decimals = 4) => {
  return `${formatNumber(balance, decimals)} ${symbol}`;
};

/**
 * Format USD value
 * @param {number} value - USD value
 * @returns {string} Formatted USD value
 */
export const formatUSD = (value) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(value);
};

/**
 * Parse error message for user display
 * @param {Error} error - Error object
 * @returns {string} User-friendly error message
 */
export const parseError = (error) => {
  const message = error?.message || error?.toString() || 'Unknown error';
  
  // Common error patterns
  if (message.includes('insufficient funds')) {
    return 'Insufficient balance for this transaction';
  }
  if (message.includes('user rejected')) {
    return 'Transaction was cancelled';
  }
  if (message.includes('nonce')) {
    return 'Transaction nonce error - please try again';
  }
  if (message.includes('gas')) {
    return 'Gas estimation failed - check transaction parameters';
  }
  
  return message;
};

/**
 * Copy text to clipboard
 * @param {string} text - Text to copy
 * @returns {Promise<boolean>} Success status
 */
/**
 * Copy text to clipboard
 */
export const copyToClipboard = async (text) => {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    } else {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        document.execCommand('copy');
        document.body.removeChild(textArea);
        return true;
      } catch (err) {
        document.body.removeChild(textArea);
        return false;
      }
    }
  } catch (error) {
    console.error('Copy failed:', error);
    return false;
  }
};


/**
 * Validate Ethereum address
 * @param {string} address - Address to validate
 * @returns {boolean} Is valid
 */
/**
 * Validate Ethereum address
 * @param {string} address - Address to validate
 * @returns {boolean} Is valid
 */
export const isValidAddress = (address) => {
  if (!address || typeof address !== 'string') return false;
  
  // Remove whitespace
  address = address.trim();
  
  // Check basic format: 0x followed by 40 hex characters
  if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
    return false;
  }
  
  // Additional check: use ethers validation
  try {
    return ethers.isAddress(address);
  } catch {
    return false;
  }
};


/**
 * Get explorer URL for transaction
 * @param {string} hash - Transaction hash
 * @param {string} network - Network name
 * @returns {string} Explorer URL
 */
export const getExplorerUrl = (hash, network = 'sepolia') => {
  const explorers = {
    sepolia: 'https://sepolia.etherscan.io',
    ethereum: 'https://etherscan.io',
    polygon: 'https://polygonscan.com'
  };
  
  return `${explorers[network] || explorers.sepolia}/tx/${hash}`;
};

/**
 * Get relative time string
 * @param {number} timestamp - Unix timestamp
 * @returns {string} Relative time (e.g., "5 minutes ago")
 */
export const getRelativeTime = (timestamp) => {
  const seconds = Math.floor((Date.now() - timestamp * 1000) / 1000);
  
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
  return `${Math.floor(seconds / 86400)} days ago`;
};
