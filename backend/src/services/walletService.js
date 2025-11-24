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
