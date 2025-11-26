import transactionService from '../services/transactionService.js';
import logger from '../utils/logger.js';
import { RESPONSE_CODES } from '../config/constants.js';
import authService from '../services/authService.js';
import transactionHistoryService from '../services/transactionHistoryService.js'; 
import contactService from '../services/contactService.js';
import emailService from '../services/emailService.js'; 

/**
 * Transaction Controller
 * Handles HTTP requests for transaction operations
 */

class TransactionController {
  /**
   * Estimate gas for transaction
   * POST /api/transaction/estimate-gas
   */
  async estimateGas(req, res, next) {
    try {
      const { txParams, network } = req.body;

      logger.info('Estimate gas request', { txParams, network });

      const gasEstimate = await transactionService.estimateGas(txParams, network);

      res.status(RESPONSE_CODES.SUCCESS).json({
        success: true,
        gasEstimate
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Simulate transaction
   * POST /api/transaction/simulate
   */
  async simulateTransaction(req, res, next) {
    try {
      const { txParams, network } = req.body;

      logger.info('Simulate transaction request', { txParams, network });

      const simulation = await transactionService.simulateTransaction(txParams, network);

      res.status(RESPONSE_CODES.SUCCESS).json({
        success: true,
        simulation
      });
    } catch (error) {
      next(error);
    }
  }
  /**
 * Send transaction using password (no private key in request)
 * POST /api/transaction/send-with-password
 */
async sendWithPassword(req, res, next) {
  try {
    const { password, txParams, network } = req.body;
    const userId = req.user.id;
    const userWalletAddress = req.user.walletAddress;

    console.log('\n🔐 === SEND WITH PASSWORD ===');
    console.log('User ID:', userId);
    console.log('Wallet:', userWalletAddress);
    console.log('To:', txParams.to);
    console.log('Value:', txParams.value);
    console.log('============================\n');

    if (!password) {
      return res.status(RESPONSE_CODES.BAD_REQUEST).json({
        success: false,
        error: 'Password is required'
      });
    }

    // Get private key using password
    logger.info('Retrieving private key with password');
    const privateKey = await authService.getWalletPrivateKey(userId, password);

    // Send transaction
    logger.info('Sending transaction with decrypted key');
    const result = await transactionService.sendTransaction(
      privateKey,
      txParams,
      network
    );

    // === LOG FOR BOTH SENDER AND RECIPIENT ===
    try {
      await transactionHistoryService.logTransactionForBoth(
        userId,
        userWalletAddress,
        txParams.to,
        {
          ...result,
          value: txParams.value
        },
        network
      );
      logger.info('Transaction logged for both parties');

      // Update contact stats for sender
      try {
        await contactService.updateContactStats(userId, txParams.to, {
          ...result,
          type: 'sent'
        });
      } catch (contactError) {
        logger.warn('Failed to update contact stats:', contactError);
      }

      // Send email notifications
      emailService.sendTransactionNotification(req.user, {
        ...result,
        type: 'sent',
        to: txParams.to,
        value: txParams.value
      }).catch(error => {
        logger.error('Failed to send email:', error);
      });

    } catch (logError) {
      // Don't fail the transaction if logging fails
      logger.error('Failed to log transaction:', logError);
    }

    res.status(RESPONSE_CODES.SUCCESS).json({
      success: true,
      transaction: result
    });

  } catch (error) {
    logger.error('Send with password failed:', error);
    res.status(RESPONSE_CODES.BAD_REQUEST).json({
      success: false,
      error: error.message
    });
  }
}


/**
 * Get transaction history for authenticated user
 * GET /api/transaction/history
 */
async getHistory(req, res, next) {
  try {
    const userId = req.user.id;
    const { 
      limit, 
      skip, 
      network, 
      type,
      contactAddress,
      startDate,
      endDate,
      minAmount,
      maxAmount,
      status,
      search,
      sortBy,
      sortOrder
    } = req.query;

    console.log('\n📜 === GET TRANSACTION HISTORY ===');
    console.log('User ID:', userId);
    console.log('Filters:', { 
      limit, 
      skip, 
      network, 
      type, 
      contactAddress,
      startDate,
      endDate,
      search
    });
    console.log('==================================\n');

    logger.info('Get transaction history', { 
      userId, 
      filters: req.query 
    });

    // Ensure service is initialized
    if (!transactionHistoryService.collection) {
      logger.warn('Transaction service not initialized, initializing now...');
      await transactionHistoryService.initialize();
    }

    const history = await transactionHistoryService.getUserTransactions(
      userId,
      {
        limit: parseInt(limit) || 50,
        skip: parseInt(skip) || 0,
        network,
        type,
        contactAddress,
        startDate,
        endDate,
        minAmount: minAmount ? parseFloat(minAmount) : null,
        maxAmount: maxAmount ? parseFloat(maxAmount) : null,
        status,
        search,
        sortBy: sortBy || 'timestamp',
        sortOrder: sortOrder || 'desc'
      }
    );

    res.status(RESPONSE_CODES.SUCCESS).json({
      success: true,
      ...history
    });
  } catch (error) {
    logger.error('Get history failed:', error);
    logger.error('Stack:', error.stack);
    
    res.status(RESPONSE_CODES.SERVER_ERROR).json({
      success: false,
      error: error.message || 'Failed to fetch transaction history'
    });
  }
}




  /**
   * Send transaction
   * POST /api/transaction/send
   */
  async sendTransaction(req, res, next) {
    try {
      const { privateKey, txParams, network } = req.body;
      

      logger.info('Send transaction request', {
        to: txParams.to,
        value: txParams.value,
        network
      });

      const result = await transactionService.sendTransaction(
        privateKey,
        txParams,
        network
      );

      res.status(RESPONSE_CODES.SUCCESS).json({
        success: true,
        transaction: result
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get transaction receipt
   * POST /api/transaction/receipt
   */
  async getReceipt(req, res, next) {
    try {
      const { txHash, network } = req.body;

      logger.info('Get receipt request', { txHash, network });

      const receipt = await transactionService.getTransactionReceipt(txHash, network);

      res.status(RESPONSE_CODES.SUCCESS).json({
        success: true,
        receipt
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get nonce for address
   * POST /api/transaction/nonce
   */
  async getNonce(req, res, next) {
    try {
      const { address, network } = req.body;

      logger.info('Get nonce request', { address, network });

      const nonce = await transactionService.getNonce(address, network);

      res.status(RESPONSE_CODES.SUCCESS).json({
        success: true,
        nonce
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Cancel pending transaction
   * POST /api/transaction/cancel
   */
  async cancelTransaction(req, res, next) {
    try {
      const { privateKey, nonce, network } = req.body;

      logger.info('Cancel transaction request', { nonce, network });

      const result = await transactionService.cancelTransaction(
        privateKey,
        nonce,
        network
      );

      res.status(RESPONSE_CODES.SUCCESS).json({
        success: true,
        result
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new TransactionController();
