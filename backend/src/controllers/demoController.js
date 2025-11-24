import demoService from '../services/demoService.js';
import logger from '../utils/logger.js';
import { RESPONSE_CODES } from '../config/constants.js';

/**
 * Demo Controller
 * Handles demo/mock transaction requests
 */

class DemoController {
  /**
   * Get demo balance
   */
  async getDemoBalance(req, res, next) {
    try {
      const { address, token } = req.body;

      logger.info('Demo balance request', { address, token });

      const balance = await demoService.getDemoBalance(address, token || 'ETH');

      res.status(RESPONSE_CODES.SUCCESS).json({
        success: true,
        balance,
        demo: true
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Send demo transaction
   */
  async sendDemoTransaction(req, res, next) {
    try {
      const { from, to, value, token } = req.body;

      logger.info('Demo transaction request', { from, to, value, token });

      const transaction = await demoService.sendDemoTransaction(
        from,
        to,
        value,
        token || 'ETH'
      );

      res.status(RESPONSE_CODES.SUCCESS).json({
        success: true,
        transaction,
        demo: true
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get demo transaction history
   */
  async getDemoHistory(req, res, next) {
    try {
      const { address, limit } = req.body;

      logger.info('Demo history request', { address, limit });

      const transactions = await demoService.getDemoTransactionHistory(
        address,
        limit || 10
      );

      res.status(RESPONSE_CODES.SUCCESS).json({
        success: true,
        transactions,
        demo: true
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get demo swap quote
   */
  async getDemoSwapQuote(req, res, next) {
    try {
      const { fromToken, toToken, amount } = req.body;

      logger.info('Demo swap quote request', { fromToken, toToken, amount });

      const quote = await demoService.getDemoSwapQuote(fromToken, toToken, amount);

      res.status(RESPONSE_CODES.SUCCESS).json({
        success: true,
        quote,
        demo: true
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Simulate demo swap
   */
  async simulateDemoSwap(req, res, next) {
    try {
      const { from, fromToken, toToken, amount } = req.body;

      logger.info('Demo swap request', { from, fromToken, toToken, amount });

      const transaction = await demoService.simulateDemoSwap(
        from,
        fromToken,
        toToken,
        amount
      );

      res.status(RESPONSE_CODES.SUCCESS).json({
        success: true,
        transaction,
        demo: true
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Estimate demo gas
   */
  async estimateDemoGas(req, res, next) {
    try {
      const { txParams } = req.body;

      const gasEstimate = await demoService.estimateDemoGas(txParams);

      res.status(RESPONSE_CODES.SUCCESS).json({
        success: true,
        gasEstimate,
        demo: true
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new DemoController();
