/**
 * Application-wide constants and configurations
 * This file centralizes all configuration values for easy management
 */

export const NETWORKS = {
  SEPOLIA: {
    name: 'sepolia',
    chainId: 11155111,
    rpcUrls: [
      'https://ethereum-sepolia-rpc.publicnode.com',      // ✅ Working (1665ms)
      'https://sepolia.gateway.tenderly.co',              // ✅ Working (1667ms)
      'https://rpc2.sepolia.org',                         // ⚠️ Slow but backup
      'https://1rpc.io/sepolia',                          // New alternative
      'https://sepolia.drpc.org',                         // New alternative
    ],
    blockExplorer: 'https://sepolia.etherscan.io',
    nativeCurrency: {
      name: 'Sepolia ETH',
      symbol: 'ETH',
      decimals: 18
    }
  },
  ETHEREUM: {
    name: 'ethereum',
    chainId: 1,
    rpcUrls: [
      'https://ethereum-rpc.publicnode.com',              // ✅ Working (2033ms)
      'https://eth.llamarpc.com',                         // ✅ Working (2148ms)
      'https://rpc.flashbots.net',                        // New alternative
      'https://eth.drpc.org',                             // New alternative
    ],
    blockExplorer: 'https://etherscan.io',
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18
    }
  },
  POLYGON: {
    name: 'polygon',
    chainId: 137,
    rpcUrls: [
      'https://polygon-rpc.com',                          // ✅ Working (2080ms)
      'https://polygon-bor-rpc.publicnode.com',           // ✅ Working (2419ms)
      'https://polygon.drpc.org',                         // New alternative
      'https://polygon.llamarpc.com',                     // New alternative
    ],
    blockExplorer: 'https://polygonscan.com',
    nativeCurrency: {
      name: 'MATIC',
      symbol: 'MATIC',
      decimals: 18
    }
  }
};



// Uniswap V2 Router addresses (Sepolia testnet)
export const UNISWAP_V2_ROUTER = {
  sepolia: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D',
  ethereum: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D'
};

// Common ERC-20 token addresses (Sepolia testnet)
export const TOKENS = {
  sepolia: {
    USDC: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238',
    DAI: '0x3e622317f8C93f7328350cF0B56d9eD4C620C5d6',
    WETH: '0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14'
  }
};

// ERC-20 Token ABI (minimal interface)
export const ERC20_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)',
  'function name() view returns (string)',
  'function transfer(address to, uint amount) returns (bool)',
  'function approve(address spender, uint256 amount) returns (bool)',
  'function allowance(address owner, address spender) view returns (uint256)'
];

// Uniswap V2 Router ABI (minimal interface)
export const UNISWAP_V2_ROUTER_ABI = [
  'function getAmountsOut(uint amountIn, address[] memory path) public view returns (uint[] memory amounts)',
  'function swapExactETHForTokens(uint amountOutMin, address[] calldata path, address to, uint deadline) external payable returns (uint[] memory amounts)',
  'function swapExactTokensForETH(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)',
  'function swapExactTokensForTokens(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)'
];

// Transaction confirmation times (in blocks)
export const CONFIRMATION_BLOCKS = {
  LOW_VALUE: 1,      // < $10
  MEDIUM_VALUE: 3,   // $10-$1000
  HIGH_VALUE: 6      // > $1000
};

// Gas limits for different operations
export const GAS_LIMITS = {
  ETH_TRANSFER: 21000n,
  ERC20_TRANSFER: 65000n,
  ERC20_APPROVE: 50000n,
  UNISWAP_SWAP: 200000n,
  CONTRACT_DEPLOYMENT: 3000000n
};

// API response codes
export const RESPONSE_CODES = {
  SUCCESS: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_ERROR: 500,
  SERVICE_UNAVAILABLE: 503
};

// Error messages
export const ERROR_MESSAGES = {
  INVALID_ADDRESS: 'Invalid Ethereum address format',
  INVALID_AMOUNT: 'Invalid amount - must be a positive number',
  INSUFFICIENT_BALANCE: 'Insufficient balance for transaction',
  INVALID_MNEMONIC: 'Invalid recovery phrase',
  NETWORK_ERROR: 'Network error - please try again',
  TRANSACTION_FAILED: 'Transaction failed',
  OLLAMA_OFFLINE: 'AI service is offline - please check Ollama server',
  RATE_LIMIT_EXCEEDED: 'Too many requests - please try again later'
};
