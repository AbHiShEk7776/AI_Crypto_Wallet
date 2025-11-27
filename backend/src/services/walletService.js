import { ethers } from 'ethers';
import * as bip39 from 'bip39';
import { NETWORKS, ERC20_ABI } from '../config/constants.js';
import encryptionService from '../utils/encryption.js';
import logger from '../utils/logger.js';
import providerFactory from '../utils/providerFactory.js';
/**
 * Wallet Service
 * Handles all wallet-related operations: generation, recovery, balances, history
 * Uses BIP39 for mnemonic generation and Ethers.js for blockchain interactions
 */

class WalletService {
  constructor() {
    // Use providerFactory instead of creating providers directly
    this.providerFactory = providerFactory;
  }

  /**
   * Get provider for network
   */
  getProvider(network = 'sepolia') {
    return this.providerFactory.getProvider(network);
  }

  /**
   * Generate new wallet with retry logic
   */
  async generateWallet() {
    try {
      logger.info('Generating new wallet');

      // Generate mnemonic (12 words)
      const mnemonic = bip39.generateMnemonic(128);

      // Create wallet from mnemonic
      const wallet = ethers.Wallet.fromPhrase(mnemonic);

      logger.info('Wallet generated successfully', {
        address: wallet.address
      });

      return {
        address: wallet.address,
        privateKey: wallet.privateKey,
        mnemonic: mnemonic
      };
    } catch (error) {
      logger.error('Wallet generation failed', { error: error.message });
      throw new Error(`Wallet generation failed: ${error.message}`);
    }
  }

  /**
   * Recover wallet from mnemonic with validation
   */
  async recoverWallet(mnemonic) {
    try {
      logger.info('Recovering wallet from mnemonic');

      // Validate mnemonic
      if (!mnemonic || typeof mnemonic !== 'string') {
        throw new Error('Invalid mnemonic format');
      }

      const cleanedMnemonic = mnemonic.trim().toLowerCase();

      if (!bip39.validateMnemonic(cleanedMnemonic)) {
        throw new Error('Invalid mnemonic phrase. Please check your words and try again.');
      }

      // Recover wallet
      const wallet = ethers.Wallet.fromPhrase(cleanedMnemonic);

      logger.info('Wallet recovered successfully', {
        address: wallet.address
      });

      return {
        address: wallet.address,
        privateKey: wallet.privateKey
      };
    } catch (error) {
      logger.error('Wallet recovery failed', { error: error.message });
      throw new Error(`Wallet recovery failed: ${error.message}`);
    }
  }

  /**
   * Get native balance with retry
   */
  async getNativeBalance(address, network = 'sepolia') {
  try {
    logger.info(`Getting balance for ${address} on ${network}`);

    // Use retry wrapper
    const balance = await this.providerFactory.withRetry(
      network,
      async (provider) => {
        return await provider.getBalance(address);
      }
    );

    const balanceEth = ethers.formatEther(balance);

    return {
      balance: balanceEth,
      balanceWei: balance.toString(),
      symbol: 'ETH',
      decimals: 18,
      network: network
    };
  } catch (error) {
    logger.error('Balance fetch failed:', {
      address,
      network,
      error: error.message
    });

    throw new Error(`Balance fetch failed: ${error.message}`);
  }
}
 /**
   * ========================================
   * AGENTIC AI METHODS - NEW
   * ========================================
   */

  /**
   * Get wallet balance for AI agent
   * Simplified wrapper for getNativeBalance
   */
  async getBalance(address, network = 'sepolia') {
    try {
      const result = await this.getNativeBalance(address, network);
      return {
        formatted: `${result.balance} ${result.symbol}`,
        value: result.balance,
        symbol: result.symbol,
        network: network,
        wei: result.balanceWei
      };
    } catch (error) {
      logger.error('AI getBalance failed:', error);
      throw error;
    }
  }

  /**
   * Get decrypted private key for transaction signing
   * Used by AI agent for autonomous transactions
   * @param {string} userId - User ID
   * @param {string} password - User's wallet password
   * @returns {string} Decrypted private key
   */
  async getPrivateKey(userId, password) {
    try {
      logger.info('Retrieving private key for user', { userId });

      // Get user from database
      const db = database.getDb();
      const usersCollection = db.collection('users');
      
      const user = await usersCollection.findOne({
        _id: new (require('mongodb').ObjectId)(userId)
      });

      if (!user) {
        throw new Error('User not found');
      }

      if (!user.encryptedPrivateKey) {
        throw new Error('No encrypted private key found for user');
      }

      // Decrypt private key using AES
      const decrypted = CryptoJS.AES.decrypt(
        user.encryptedPrivateKey,
        password
      ).toString(CryptoJS.enc.Utf8);

      if (!decrypted || !decrypted.startsWith('0x')) {
        throw new Error('Invalid password - decryption failed');
      }

      logger.info('Private key retrieved successfully', { userId });

      return decrypted;
    } catch (error) {
      logger.error('Private key retrieval failed:', {
        userId,
        error: error.message
      });
      throw new Error(`Private key retrieval failed: ${error.message}`);
    }
  }

  /**
   * Create a wallet instance from private key
   * Used by AI agent for signing transactions
   * @param {string} privateKey - Decrypted private key
   * @param {string} network - Network name
   * @returns {ethers.Wallet} Connected wallet instance
   */
  createWalletInstance(privateKey, network = 'sepolia') {
    try {
      const provider = this.getProvider(network);
      const wallet = new ethers.Wallet(privateKey, provider);
      
      logger.info('Wallet instance created', {
        address: wallet.address,
        network
      });

      return wallet;
    } catch (error) {
      logger.error('Wallet instance creation failed:', error);
      throw new Error(`Wallet instance creation failed: ${error.message}`);
    }
  }

  /**
   * Send transaction (used by AI agent)
   * @param {string} privateKey - Decrypted private key
   * @param {Object} txParams - Transaction parameters
   * @param {string} network - Network name
   * @returns {Object} Transaction result
   */
  async sendTransaction(privateKey, txParams, network = 'sepolia') {
    try {
      logger.info('AI Agent: Sending transaction', {
        to: txParams.to,
        value: txParams.value,
        network
      });

      // Create wallet instance
      const wallet = this.createWalletInstance(privateKey, network);

      // Prepare transaction
      const tx = {
        to: txParams.to,
        value: ethers.parseEther(txParams.value.toString()),
        gasLimit: txParams.gasLimit || 21000,
      };

      // Get current gas prices
      const feeData = await wallet.provider.getFeeData();
      
      // Add EIP-1559 gas parameters
      if (feeData.maxFeePerGas) {
        tx.maxFeePerGas = feeData.maxFeePerGas;
        tx.maxPriorityFeePerGas = feeData.maxPriorityFeePerGas;
      } else {
        tx.gasPrice = feeData.gasPrice;
      }

      logger.info('Transaction prepared', {
        from: wallet.address,
        to: tx.to,
        value: ethers.formatEther(tx.value)
      });

      // Send transaction
      const txResponse = await wallet.sendTransaction(tx);
      
      logger.info('Transaction sent', {
        hash: txResponse.hash
      });

      // Wait for confirmation
      const receipt = await txResponse.wait();

      logger.info('Transaction confirmed', {
        hash: receipt.hash,
        blockNumber: receipt.blockNumber,
        status: receipt.status
      });

      return {
        hash: receipt.hash,
        from: wallet.address,
        to: txParams.to,
        value: txParams.value,
        blockNumber: receipt.blockNumber,
        blockHash: receipt.blockHash,
        gasUsed: receipt.gasUsed.toString(),
        effectiveGasPrice: receipt.gasPrice ? receipt.gasPrice.toString() : receipt.effectiveGasPrice?.toString(),
        status: receipt.status === 1 ? 'success' : 'failed',
        network: network
      };
    } catch (error) {
      logger.error('Transaction failed:', {
        error: error.message,
        code: error.code
      });

      // Handle specific errors
      if (error.code === 'INSUFFICIENT_FUNDS') {
        throw new Error('Insufficient funds for transaction and gas');
      } else if (error.code === 'NONCE_EXPIRED') {
        throw new Error('Transaction nonce expired. Please try again');
      } else if (error.code === 'REPLACEMENT_UNDERPRICED') {
        throw new Error('Gas price too low. Please try again with higher gas');
      }

      throw new Error(`Transaction failed: ${error.message}`);
    }
  }

  /**
   * Estimate gas for transaction
   * @param {string} from - Sender address
   * @param {string} to - Recipient address
   * @param {string} value - Amount in ETH
   * @param {string} network - Network name
   * @returns {Object} Gas estimation
   */
  async estimateGas(from, to, value, network = 'sepolia') {
    try {
      const provider = this.getProvider(network);

      const gasEstimate = await provider.estimateGas({
        from,
        to,
        value: ethers.parseEther(value.toString())
      });

      const feeData = await provider.getFeeData();

      const gasCost = gasEstimate * (feeData.gasPrice || feeData.maxFeePerGas);
      const gasCostEth = ethers.formatEther(gasCost);

      return {
        gasLimit: gasEstimate.toString(),
        gasPrice: feeData.gasPrice?.toString(),
        gasPriceGwei: feeData.gasPrice ? ethers.formatUnits(feeData.gasPrice, 'gwei') : null,
        maxFeePerGas: feeData.maxFeePerGas?.toString(),
        maxPriorityFeePerGas: feeData.maxPriorityFeePerGas?.toString(),
        estimatedCost: gasCostEth,
        estimatedCostWei: gasCost.toString()
      };
    } catch (error) {
      logger.error('Gas estimation failed:', error);
      throw new Error(`Gas estimation failed: ${error.message}`);
    }
  }

  /**
   * Validate Ethereum address
   * @param {string} address - Address to validate
   * @returns {boolean} True if valid
   */
  isValidAddress(address) {
    try {
      return ethers.isAddress(address);
    } catch {
      return false;
    }
  }

  /**
   * Get transaction by hash
   * @param {string} hash - Transaction hash
   * @param {string} network - Network name
   * @returns {Object} Transaction details
   */
  async getTransaction(hash, network = 'sepolia') {
    try {
      const provider = this.getProvider(network);
      const tx = await provider.getTransaction(hash);
      
      if (!tx) {
        throw new Error('Transaction not found');
      }

      const receipt = await provider.getTransactionReceipt(hash);

      return {
        hash: tx.hash,
        from: tx.from,
        to: tx.to,
        value: ethers.formatEther(tx.value),
        valueWei: tx.value.toString(),
        blockNumber: tx.blockNumber,
        blockHash: tx.blockHash,
        gasPrice: tx.gasPrice?.toString(),
        gasLimit: tx.gasLimit.toString(),
        gasUsed: receipt?.gasUsed.toString(),
        status: receipt?.status === 1 ? 'success' : 'failed',
        confirmations: receipt?.confirmations,
        timestamp: tx.timestamp
      };
    } catch (error) {
      logger.error('Get transaction failed:', error);
      throw new Error(`Get transaction failed: ${error.message}`);
    }
  }


  /**
   * Get ERC-20 token balance
   * @param {string} address - Wallet address
   * @param {string} tokenAddress - Token contract address
   * @param {string} network - Network name
   * @returns {Object} Token balance information
   */
  async getTokenBalance(address, tokenAddress, network = 'sepolia') {
    try {
      const provider = this.getProvider[network];
      if (!provider) {
        throw new Error(`Unsupported network: ${network}`);
      }
      
      logger.info('Fetching token balance', { 
        address, 
        tokenAddress, 
        network 
      });
      
      // Create contract instance with ERC-20 ABI
      const tokenContract = new ethers.Contract(
        tokenAddress,
        ERC20_ABI,
        provider
      );
      
      // Fetch token details in parallel for efficiency
      const [balance, symbol, decimals, name] = await Promise.all([
        tokenContract.balanceOf(address),
        tokenContract.symbol(),
        tokenContract.decimals(),
        tokenContract.name()
      ]);
      
      // Convert balance to human-readable format
      const balanceFormatted = ethers.formatUnits(balance, decimals);
      
      return {
        balance: balanceFormatted,
        balanceRaw: balance.toString(),
        symbol: symbol,
        decimals: Number(decimals),
        name: name,
        tokenAddress: tokenAddress,
        network: network
      };
    } catch (error) {
      logger.error('Token balance fetch failed', { 
        address,
        tokenAddress,
        network,
        error: error.message 
      });
      throw new Error(`Token balance fetch failed: ${error.message}`);
    }
  }

  /**
   * Get transaction history for an address
   * Note: For production, use indexing services like Etherscan API or The Graph
   * This is a simplified version scanning recent blocks
   * @param {string} address - Wallet address
   * @param {string} network - Network name
   * @param {number} limit - Maximum transactions to return
   * @returns {Array} Transaction history
   */
  async getTransactionHistory(address, network = 'sepolia', limit = 10) {
    try {
      const provider = this.getProvider[network];
      if (!provider) {
        throw new Error(`Unsupported network: ${network}`);
      }
      
      logger.info('Fetching transaction history', { 
        address, 
        network, 
        limit 
      });
      
      const transactions = [];
      const latestBlock = await provider.getBlockNumber();
      const addressLower = address.toLowerCase();
      
      // Scan recent blocks (limited to prevent long execution times)
      // In production: Use Etherscan API, Alchemy, or indexer
      const blocksToScan = Math.min(1000, latestBlock);
      
      for (let i = 0; i < blocksToScan && transactions.length < limit; i++) {
        try {
          const blockNumber = latestBlock - i;
          
          // Fetch block with transactions (prefetch=true)
          const block = await provider.getBlock(blockNumber, true);
          
          if (!block || !block.transactions) continue;
          
          // Filter transactions involving this address
          for (const tx of block.transactions) {
            if (
              tx.from?.toLowerCase() === addressLower ||
              tx.to?.toLowerCase() === addressLower
            ) {
              transactions.push({
                hash: tx.hash,
                from: tx.from,
                to: tx.to,
                value: ethers.formatEther(tx.value || 0),
                valueWei: tx.value?.toString(),
                gasPrice: tx.gasPrice?.toString(),
                nonce: tx.nonce,
                timestamp: block.timestamp,
                blockNumber: block.number,
                type: tx.from?.toLowerCase() === addressLower ? 'sent' : 'received',
                status: 'confirmed'
              });
              
              if (transactions.length >= limit) break;
            }
          }
        } catch (blockError) {
          // Skip blocks that fail to fetch
          logger.warn(`Failed to fetch block ${latestBlock - i}`, {
            error: blockError.message
          });
        }
      }
      
      logger.info(`Found ${transactions.length} transactions`, {
        address,
        network
      });
      
      return transactions;
    } catch (error) {
      logger.error('Transaction history fetch failed', {
        address,
        network,
        error: error.message
      });
      throw new Error(`Transaction history fetch failed: ${error.message}`);
    }
  }

  /**
   * Get current gas prices for a network
   * @param {string} network - Network name
   * @returns {Object} Gas price information
   */
  async getGasPrices(network = 'sepolia') {
    try {
      const provider = this.getProvider[network];
      if (!provider) {
        throw new Error(`Unsupported network: ${network}`);
      }
      
      // Get current fee data (EIP-1559)
      const feeData = await provider.getFeeData();
      
      return {
        maxFeePerGas: feeData.maxFeePerGas?.toString(),
        maxFeePerGasGwei: feeData.maxFeePerGas 
          ? ethers.formatUnits(feeData.maxFeePerGas, 'gwei')
          : null,
        maxPriorityFeePerGas: feeData.maxPriorityFeePerGas?.toString(),
        maxPriorityFeePerGasGwei: feeData.maxPriorityFeePerGas
          ? ethers.formatUnits(feeData.maxPriorityFeePerGas, 'gwei')
          : null,
        gasPrice: feeData.gasPrice?.toString(),
        gasPriceGwei: feeData.gasPrice
          ? ethers.formatUnits(feeData.gasPrice, 'gwei')
          : null
      };
    } catch (error) {
      logger.error('Gas price fetch failed', {
        network,
        error: error.message
      });
      throw new Error(`Gas price fetch failed: ${error.message}`);
    }
  }

  /**
   * Derive multiple addresses from a single mnemonic (HD Wallet)
   * Useful for generating multiple accounts
   * @param {string} mnemonic - BIP39 mnemonic
   * @param {number} count - Number of addresses to derive
   * @returns {Array} List of derived wallets
   */
  async deriveAddresses(mnemonic, count = 5) {
    try {
      if (!bip39.validateMnemonic(mnemonic)) {
        throw new Error('Invalid mnemonic');
      }
      
      const addresses = [];
      
      // Ethereum derivation path: m/44'/60'/0'/0/index
      for (let i = 0; i < count; i++) {
        const path = `m/44'/60'/0'/0/${i}`;
        const wallet = ethers.HDNodeWallet.fromPhrase(mnemonic, path);
        
        addresses.push({
          index: i,
          path: path,
          address: wallet.address,
          publicKey: wallet.publicKey
        });
      }
      
      return addresses;
    } catch (error) {
      logger.error('Address derivation failed', {
        error: error.message
      });
      throw new Error(`Address derivation failed: ${error.message}`);
    }
  }
}

export default new WalletService();
