import { ethers } from 'ethers';
import logger from '../utils/logger.js';

/**
 * Demo/Mock Transaction Service
 * Simulates blockchain operations without real network calls
 * Perfect for testing and demos without needing testnet ETH or RPC providers
 */

class DemoService {
 constructor() {
  // Mock balances for demo accounts
  this.mockBalances = new Map();
  
  // Mock transaction history
  this.mockTransactions = new Map();
  
  // Initialize with some demo data
  this.initializeDemoData();
}

/**
 * Initialize demo data with sample balances and transactions
 */
initializeDemoData() {
  // Demo addresses with pre-set balances
  const demoAddresses = [
    '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
    '0xdAC17F958D2ee523a2206206994597C13D831ec7',
    '0x156f058C67A22f96076CE8DabE14d40a90f971eE'
  ];

  demoAddresses.forEach(address => {
    this.mockBalances.set(address.toLowerCase(), {
      ETH: '2.5',
      USDC: '1000',
      DAI: '500'
    });
    
    this.mockTransactions.set(address.toLowerCase(), []);
  });

  logger.info('Demo service initialized with mock data');
}

/**
 * Get mock balance for an address
 */
async getDemoBalance(address, tokenSymbol = 'ETH') {
  const addr = address.toLowerCase();
  
  // If address not in map, initialize with random balance
  if (!this.mockBalances.has(addr)) {
    this.mockBalances.set(addr, {
      ETH: (2 + Math.random() * 3).toFixed(4), // 2-5 ETH
      USDC: (500 + Math.random() * 1500).toFixed(2), // 500-2000 USDC
      DAI: (300 + Math.random() * 700).toFixed(2) // 300-1000 DAI
    });
    
    logger.info(`Initialized demo balance for new address: ${addr}`, {
      balances: this.mockBalances.get(addr)
    });
  }

  const balances = this.mockBalances.get(addr);
  const balance = balances[tokenSymbol] || '0';

  return {
    balance,
    balanceWei: ethers.parseEther(balance).toString(),
    symbol: tokenSymbol,
    decimals: 18,
    network: 'demo'
  };
}

  /**
   * Simulate sending a transaction
   */
  async sendDemoTransaction(from, to, value, token = 'ETH') {
    const fromAddr = from.toLowerCase();
    const toAddr = to.toLowerCase();

    logger.info('Demo transaction:', { from: fromAddr, to: toAddr, value, token });

    // Check balance
    const fromBalance = await this.getDemoBalance(fromAddr, token);
    if (parseFloat(fromBalance.balance) < parseFloat(value)) {
      throw new Error('Insufficient balance for demo transaction');
    }

    // Generate mock transaction hash
    const txHash = '0x' + ethers.hexlify(ethers.randomBytes(32)).slice(2);

    // Update balances
    const fromBalances = this.mockBalances.get(fromAddr);
    fromBalances[token] = (parseFloat(fromBalances[token]) - parseFloat(value)).toFixed(4);

    if (!this.mockBalances.has(toAddr)) {
      this.mockBalances.set(toAddr, { ETH: '0', USDC: '0', DAI: '0' });
    }
    const toBalances = this.mockBalances.get(toAddr);
    toBalances[token] = (parseFloat(toBalances[token] || 0) + parseFloat(value)).toFixed(4);

    // Create transaction record
    const transaction = {
      hash: txHash,
      from: from,
      to: to,
      value: value,
      valueWei: ethers.parseEther(value).toString(),
      gasUsed: '21000',
      effectiveGasPrice: '20000000000',
      status: 'success',
      blockNumber: Math.floor(Math.random() * 1000000) + 18000000,
      blockHash: '0x' + ethers.hexlify(ethers.randomBytes(32)).slice(2),
      confirmations: 1,
      timestamp: Math.floor(Date.now() / 1000),
      token
    };

    // Add to transaction history
    if (!this.mockTransactions.has(fromAddr)) {
      this.mockTransactions.set(fromAddr, []);
    }
    this.mockTransactions.get(fromAddr).unshift(transaction);

    if (!this.mockTransactions.has(toAddr)) {
      this.mockTransactions.set(toAddr, []);
    }
    this.mockTransactions.get(toAddr).unshift({
      ...transaction,
      type: 'received'
    });

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    return transaction;
  }

  /**
   * Get mock transaction history
   */
  async getDemoTransactionHistory(address, limit = 10) {
    const addr = address.toLowerCase();
    
    if (!this.mockTransactions.has(addr)) {
      // Generate some random demo transactions
      const demoTxs = [];
      for (let i = 0; i < Math.min(limit, 5); i++) {
        const isSent = Math.random() > 0.5;
        demoTxs.push({
          hash: '0x' + ethers.hexlify(ethers.randomBytes(32)).slice(2),
          from: isSent ? address : '0x' + ethers.hexlify(ethers.randomBytes(20)).slice(2),
          to: isSent ? '0x' + ethers.hexlify(ethers.randomBytes(20)).slice(2) : address,
          value: (Math.random() * 0.5).toFixed(4),
          timestamp: Math.floor(Date.now() / 1000) - (i * 3600),
          blockNumber: 18000000 + i,
          status: 'confirmed',
          type: isSent ? 'sent' : 'received'
        });
      }
      this.mockTransactions.set(addr, demoTxs);
    }

    const txs = this.mockTransactions.get(addr) || [];
    return txs.slice(0, limit);
  }

  /**
   * Simulate token swap
   */
  async simulateDemoSwap(from, fromToken, toToken, amount) {
    const addr = from.toLowerCase();

    logger.info('Demo swap:', { from: addr, fromToken, toToken, amount });

    // Mock exchange rates
    const rates = {
      'ETH->USDC': 2000,
      'USDC->ETH': 0.0005,
      'ETH->DAI': 2000,
      'DAI->ETH': 0.0005,
      'USDC->DAI': 1,
      'DAI->USDC': 1
    };

    const rateKey = `${fromToken}->${toToken}`;
    const rate = rates[rateKey] || 1;
    const outputAmount = (parseFloat(amount) * rate * 0.997).toFixed(4); // 0.3% fee

    // Check balance
    const balance = await this.getDemoBalance(addr, fromToken);
    if (parseFloat(balance.balance) < parseFloat(amount)) {
      throw new Error(`Insufficient ${fromToken} balance for swap`);
    }

    // Update balances
    const balances = this.mockBalances.get(addr);
    balances[fromToken] = (parseFloat(balances[fromToken]) - parseFloat(amount)).toFixed(4);
    balances[toToken] = (parseFloat(balances[toToken] || 0) + parseFloat(outputAmount)).toFixed(4);

    // Generate swap transaction
    const txHash = '0x' + ethers.hexlify(ethers.randomBytes(32)).slice(2);

    const swapTx = {
      hash: txHash,
      from: from,
      to: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D', // Uniswap router (mock)
      fromToken,
      toToken,
      amountIn: amount,
      amountOut: outputAmount,
      status: 'success',
      timestamp: Math.floor(Date.now() / 1000),
      type: 'swap'
    };

    // Add to history
    if (!this.mockTransactions.has(addr)) {
      this.mockTransactions.set(addr, []);
    }
    this.mockTransactions.get(addr).unshift(swapTx);

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    return swapTx;
  }

  /**
   * Get swap quote (instant, no RPC needed)
   */
  async getDemoSwapQuote(fromToken, toToken, amount) {
    const rates = {
      'ETH->USDC': 2000,
      'USDC->ETH': 0.0005,
      'ETH->DAI': 2000,
      'DAI->ETH': 0.0005,
      'USDC->DAI': 1,
      'DAI->USDC': 1
    };

    const rateKey = `${fromToken}->${toToken}`;
    const rate = rates[rateKey] || 1;
    const outputAmount = (parseFloat(amount) * rate * 0.997).toFixed(6);
    const minOutput = (parseFloat(outputAmount) * 0.995).toFixed(6);

    return {
      fromToken,
      toToken,
      amountIn: amount,
      amountOut: outputAmount,
      minAmountOut: minOutput,
      priceImpact: '0.3%',
      exchangeRate: `1 ${fromToken} = ${rate} ${toToken}`,
      network: 'demo'
    };
  }

  /**
   * Estimate gas (instant mock)
   */
  async estimateDemoGas(txParams) {
    return {
      gasLimit: '21000',
      gasEstimate: '21000',
      maxFeePerGas: '20000000000',
      maxFeePerGasGwei: '20',
      maxPriorityFeePerGas: '2000000000',
      maxPriorityFeePerGasGwei: '2',
      estimatedCost: '0.00042',
      estimatedCostWei: '420000000000000'
    };
  }
}

export default new DemoService();
