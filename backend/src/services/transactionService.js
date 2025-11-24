import { ethers } from 'ethers';
import { NETWORKS, GAS_LIMITS, CONFIRMATION_BLOCKS } from '../config/constants.js';
import logger from '../utils/logger.js';
import providerFactory from '../utils/providerFactory.js';


/**
 * Transaction Service
 * Handles all transaction operations: gas estimation, simulation, sending, tracking
 */

class TransactionService {
  constructor() {
    this.providerFactory = providerFactory;
  }

  getProvider(network = 'sepolia') {
    return this.providerFactory.getProvider(network);
  }

  /**
   * Estimate gas for a transaction
   * Provides accurate gas estimates before sending transaction
   * @param {Object} txParams - Transaction parameters
   * @param {string} network - Network name
   * @returns {Object} Gas estimation details
   */
  async estimateGas(txParams, network = 'sepolia') {
    try {
      const provider = this.getProvider(network);
      if (!provider) {
        throw new Error(`Unsupported network: ${network}`);
      }

      logger.info('Estimating gas', { txParams, network });

      // Build transaction object
      const tx = {
        from: txParams.from,
        to: txParams.to,
        value: txParams.value ? ethers.parseEther(txParams.value) : 0n,
        data: txParams.data || '0x'
      };

      // Estimate gas limit
      const gasEstimate = await provider.estimateGas(tx);

      // Get current fee data (EIP-1559)
      const feeData = await provider.getFeeData();

      // Calculate total cost estimates
      const maxFeePerGas = feeData.maxFeePerGas || feeData.gasPrice || 0n;
      const maxPriorityFeePerGas = feeData.maxPriorityFeePerGas || 0n;

      // Add 20% buffer to gas estimate for safety
      const gasLimitWithBuffer = (gasEstimate * 120n) / 100n;

      // Calculate costs
      const estimatedCostWei = gasLimitWithBuffer * maxFeePerGas;
      const estimatedCostEth = ethers.formatEther(estimatedCostWei);

      // Calculate different speed options
      const speeds = {
        slow: {
          maxFeePerGas: (maxFeePerGas * 80n) / 100n, // 80% of current
          maxPriorityFeePerGas: (maxPriorityFeePerGas * 80n) / 100n,
          estimatedTime: '~5 minutes'
        },
        standard: {
          maxFeePerGas: maxFeePerGas,
          maxPriorityFeePerGas: maxPriorityFeePerGas,
          estimatedTime: '~2 minutes'
        },
        fast: {
          maxFeePerGas: (maxFeePerGas * 120n) / 100n, // 120% of current
          maxPriorityFeePerGas: (maxPriorityFeePerGas * 120n) / 100n,
          estimatedTime: '~30 seconds'
        }
      };

      return {
        gasLimit: gasLimitWithBuffer.toString(),
        gasEstimate: gasEstimate.toString(),
        maxFeePerGas: maxFeePerGas.toString(),
        maxFeePerGasGwei: ethers.formatUnits(maxFeePerGas, 'gwei'),
        maxPriorityFeePerGas: maxPriorityFeePerGas.toString(),
        maxPriorityFeePerGasGwei: ethers.formatUnits(maxPriorityFeePerGas, 'gwei'),
        estimatedCost: estimatedCostEth,
        estimatedCostWei: estimatedCostWei.toString(),
        speeds: {
          slow: {
            ...speeds.slow,
            maxFeePerGas: speeds.slow.maxFeePerGas.toString(),
            maxPriorityFeePerGas: speeds.slow.maxPriorityFeePerGas.toString(),
            cost: ethers.formatEther(gasLimitWithBuffer * speeds.slow.maxFeePerGas)
          },
          standard: {
            ...speeds.standard,
            maxFeePerGas: speeds.standard.maxFeePerGas.toString(),
            maxPriorityFeePerGas: speeds.standard.maxPriorityFeePerGas.toString(),
            cost: estimatedCostEth
          },
          fast: {
            ...speeds.fast,
            maxFeePerGas: speeds.fast.maxFeePerGas.toString(),
            maxPriorityFeePerGas: speeds.fast.maxPriorityFeePerGas.toString(),
            cost: ethers.formatEther(gasLimitWithBuffer * speeds.fast.maxFeePerGas)
          }
        }
      };
    } catch (error) {
      logger.error('Gas estimation failed', {
        txParams,
        network,
        error: error.message
      });
      throw new Error(`Gas estimation failed: ${error.message}`);
    }
  }

  /**
   * Simulate transaction before sending (free alternative to Tenderly)
   * Uses eth_call to test if transaction will succeed
   * @param {Object} txParams - Transaction parameters
   * @param {string} network - Network name
   * @returns {Object} Simulation result
   */
  async simulateTransaction(txParams, network = 'sepolia') {
    try {
      const provider = this.getProvider(network);
      if (!provider) {
        throw new Error(`Unsupported network: ${network}`);
      }

      logger.info('Simulating transaction', { txParams, network });

      const tx = {
        from: txParams.from,
        to: txParams.to,
        value: txParams.value ? ethers.parseEther(txParams.value) : 0n,
        data: txParams.data || '0x'
      };

      // Use eth_call to simulate (doesn't cost gas, just tests execution)
      const result = await provider.call(tx);

      // Estimate gas for the transaction
      const gasEstimate = await provider.estimateGas(tx);

      return {
        success: true,
        result: result,
        gasUsed: gasEstimate.toString(),
        message: 'Transaction will succeed',
        willRevert: false
      };
    } catch (error) {
      // Transaction will revert
      logger.warn('Transaction simulation failed', {
        txParams,
        network,
        error: error.message
      });

      return {
        success: false,
        result: null,
        gasUsed: '0',
        error: error.message,
        message: 'Transaction will revert',
        willRevert: true,
        reason: this.parseRevertReason(error)
      };
    }
  }

  /**
   * Parse revert reason from error message
   * @param {Error} error - Error object
   * @returns {string} Human-readable revert reason
   */
  parseRevertReason(error) {
    const message = error.message || '';
    
    // Common revert reasons
    if (message.includes('insufficient funds')) {
      return 'Insufficient balance to complete transaction';
    }
    if (message.includes('gas required exceeds allowance')) {
      return 'Gas limit too low';
    }
    if (message.includes('nonce too low')) {
      return 'Transaction nonce conflict';
    }
    if (message.includes('replacement transaction underpriced')) {
      return 'Gas price too low to replace pending transaction';
    }
    
    // Try to extract custom revert message
    const revertMatch = message.match(/reverted with reason string '(.+)'/);
    if (revertMatch) {
      return revertMatch[1];
    }
    
    return 'Transaction will fail';
  }

  /**
   * Send transaction to blockchain
   * @param {string} privateKey - Sender's private key
   * @param {Object} txParams - Transaction parameters
   * @param {string} network - Network name
   * @returns {Object} Transaction receipt
   */
  async sendTransaction(privateKey, txParams, network = 'sepolia') {
    try {
      const provider = this.getProvider(network);
      if (!provider) {
        throw new Error(`Unsupported network: ${network}`);
      }

      logger.info('Sending transaction', {
        to: txParams.to,
        value: txParams.value,
        network
      });

      // Create wallet instance
      const wallet = new ethers.Wallet(privateKey, provider);

      // Build transaction
      const tx = {
        to: txParams.to,
        value: txParams.value ? ethers.parseEther(txParams.value) : 0n,
        data: txParams.data || '0x'
      };

      // Add gas parameters if provided, otherwise let ethers estimate
      if (txParams.gasLimit) {
        tx.gasLimit = BigInt(txParams.gasLimit);
      }
      if (txParams.maxFeePerGas) {
        tx.maxFeePerGas = BigInt(txParams.maxFeePerGas);
      }
      if (txParams.maxPriorityFeePerGas) {
        tx.maxPriorityFeePerGas = BigInt(txParams.maxPriorityFeePerGas);
      }

      // Send transaction
      const txResponse = await wallet.sendTransaction(tx);

      logger.info('Transaction sent', {
        hash: txResponse.hash,
        from: txResponse.from,
        to: txResponse.to
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
        from: receipt.from,
        to: receipt.to,
        value: ethers.formatEther(txResponse.value || 0),
        gasUsed: receipt.gasUsed.toString(),
        effectiveGasPrice: receipt.gasPrice?.toString(),
        status: receipt.status === 1 ? 'success' : 'failed',
        blockNumber: receipt.blockNumber,
        blockHash: receipt.blockHash,
        confirmations: 1,
        timestamp: Date.now()
      };
    } catch (error) {
      logger.error('Transaction failed', {
        txParams,
        network,
        error: error.message
      });
      throw new Error(`Transaction failed: ${error.message}`);
    }
  }

  /**
   * Get transaction receipt by hash
   * @param {string} txHash - Transaction hash
   * @param {string} network - Network name
   * @returns {Object} Transaction receipt or status
   */
  async getTransactionReceipt(txHash, network = 'sepolia') {
    try {
      const provider = this.getProvider(network);
      if (!provider) {
        throw new Error(`Unsupported network: ${network}`);
      }

      logger.info('Fetching transaction receipt', { txHash, network });

      // Get receipt
      const receipt = await provider.getTransactionReceipt(txHash);

      if (!receipt) {
        // Transaction is pending
        return {
          hash: txHash,
          status: 'pending',
          message: 'Transaction is pending confirmation'
        };
      }

      // Get current block number for confirmations
      const currentBlock = await provider.getBlockNumber();
      const confirmations = currentBlock - receipt.blockNumber + 1;

      return {
        hash: receipt.hash,
        from: receipt.from,
        to: receipt.to,
        gasUsed: receipt.gasUsed.toString(),
        effectiveGasPrice: receipt.gasPrice?.toString(),
        status: receipt.status === 1 ? 'success' : 'failed',
        blockNumber: receipt.blockNumber,
        blockHash: receipt.blockHash,
        confirmations: confirmations,
        logsCount: receipt.logs.length
      };
    } catch (error) {
      logger.error('Receipt fetch failed', {
        txHash,
        network,
        error: error.message
      });
      throw new Error(`Receipt fetch failed: ${error.message}`);
    }
  }

  /**
   * Get nonce for address (for manual nonce management)
   * @param {string} address - Wallet address
   * @param {string} network - Network name
   * @returns {number} Current nonce
   */
  async getNonce(address, network = 'sepolia') {
    try {
      const provider = this.getProvider(network);
      const nonce = await provider.getTransactionCount(address, 'latest');
      return nonce;
    } catch (error) {
      logger.error('Nonce fetch failed', {
        address,
        network,
        error: error.message
      });
      throw new Error(`Nonce fetch failed: ${error.message}`);
    }
  }

  /**
   * Cancel pending transaction by sending 0 ETH to self with higher gas
   * @param {string} privateKey - Wallet private key
   * @param {number} nonce - Nonce of transaction to cancel
   * @param {string} network - Network name
   * @returns {Object} Cancellation transaction receipt
   */
  async cancelTransaction(privateKey, nonce, network = 'sepolia') {
    try {
      const provider = this.getProvider(network);
      const wallet = new ethers.Wallet(privateKey, provider);

      // Get current fee data
      const feeData = await provider.getFeeData();

      // Send 0 ETH to self with 150% gas price to replace pending tx
      const tx = {
        to: wallet.address,
        value: 0n,
        nonce: nonce,
        maxFeePerGas: (feeData.maxFeePerGas * 150n) / 100n,
        maxPriorityFeePerGas: (feeData.maxPriorityFeePerGas * 150n) / 100n
      };

      const txResponse = await wallet.sendTransaction(tx);
      const receipt = await txResponse.wait();

      return {
        hash: receipt.hash,
        status: 'cancelled',
        message: 'Transaction cancelled successfully'
      };
    } catch (error) {
      logger.error('Transaction cancellation failed', {
        nonce,
        network,
        error: error.message
      });
      throw new Error(`Cancellation failed: ${error.message}`);
    }
  }

  /**
   * Speed up pending transaction by resubmitting with higher gas
   * @param {string} privateKey - Wallet private key
   * @param {Object} originalTx - Original transaction parameters
   * @param {string} network - Network name
   * @returns {Object} New transaction receipt
   */
  async speedUpTransaction(privateKey, originalTx, network = 'sepolia') {
    try {
      const provider = this.getProvider(network);
      const wallet = new ethers.Wallet(privateKey, provider);

      // Get current fee data
      const feeData = await provider.getFeeData();

      // Resubmit with 150% gas price
      const tx = {
        ...originalTx,
        maxFeePerGas: (feeData.maxFeePerGas * 150n) / 100n,
        maxPriorityFeePerGas: (feeData.maxPriorityFeePerGas * 150n) / 100n
      };

      const txResponse = await wallet.sendTransaction(tx);
      const receipt = await txResponse.wait();

      return {
        hash: receipt.hash,
        status: 'success',
        message: 'Transaction sped up successfully'
      };
    } catch (error) {
      logger.error('Transaction speed up failed', {
        error: error.message
      });
      throw new Error(`Speed up failed: ${error.message}`);
    }
  }
}

export default new TransactionService();
