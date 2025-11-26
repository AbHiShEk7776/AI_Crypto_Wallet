import walletService from '../services/walletService.js';
import encryptionService from '../utils/encryption.js';
import logger from '../utils/logger.js';
import { RESPONSE_CODES } from '../config/constants.js';

/**
 * Wallet Controller
 * Handles HTTP requests for wallet operations
 */

class WalletController {
  /**
   * Generate new wallet
   * POST /api/wallet/generate
   */
  async generateWallet(req, res, next) {
    try {
      logger.info('Generate wallet request received');

      const wallet = await walletService.generateWallet();

      res.status(RESPONSE_CODES.CREATED).json({
        success: true,
        message: 'Wallet created successfully',
        wallet: {
          address: wallet.address,
          mnemonic: wallet.mnemonic,
          privateKey: wallet.privateKey
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Recover wallet from mnemonic
   * POST /api/wallet/recover
   */
  async recoverWallet(req, res, next) {
    try {
      const { mnemonic } = req.body;

      logger.info('Recover wallet request received');

      const wallet = await walletService.recoverWallet(mnemonic);

      res.status(RESPONSE_CODES.SUCCESS).json({
        success: true,
        message: 'Wallet recovered successfully',
        wallet: {
          address: wallet.address,
          privateKey: wallet.privateKey
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get wallet balance
   * POST /api/wallet/balance
   */
  async getBalance(req, res, next) {
    try {
      const { address, network, tokenAddress } = req.body;
      

      

      logger.info('Get balance request', { address, network, tokenAddress });

      let balance;

      if (tokenAddress) {
        // Get ERC-20 token balance
        balance = await walletService.getTokenBalance(address, tokenAddress, network);
      } else {
        // Get native token balance (ETH)
        balance = await walletService.getNativeBalance(address, network);
      }

      res.status(RESPONSE_CODES.SUCCESS).json({
        success: true,
        balance
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get transaction history
   * POST /api/wallet/history
   */
  async getHistory(req, res, next) {
    try {
      const { address, network, limit } = req.body;

      logger.info('Get history request', { address, network, limit });

      const transactions = await walletService.getTransactionHistory(
        address,
        network,
        limit || 10
      );

      res.status(RESPONSE_CODES.SUCCESS).json({
        success: true,
        transactions,
        count: transactions.length
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get gas prices
   * GET /api/wallet/gas-prices/:network
   */
  async getGasPrices(req, res, next) {
    try {
      const { network } = req.params;

      logger.info('Get gas prices request', { network });

      const gasPrices = await walletService.getGasPrices(network);

      res.status(RESPONSE_CODES.SUCCESS).json({
        success: true,
        gasPrices,
        network
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Derive multiple addresses from mnemonic
   * POST /api/wallet/derive
   */
  async deriveAddresses(req, res, next) {
    try {
      const { mnemonic, count } = req.body;

      logger.info('Derive addresses request', { count });

      const addresses = await walletService.deriveAddresses(mnemonic, count || 5);

      res.status(RESPONSE_CODES.SUCCESS).json({
        success: true,
        addresses
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new WalletController();
