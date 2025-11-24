import dappService from '../services/dappService.js';
import logger from '../utils/logger.js';
import { RESPONSE_CODES } from '../config/constants.js';

/**
 * DApp Controller
 * Handles decentralized application interaction requests
 */

class DAppController {
  /**
   * Get swap quote
   * POST /api/dapp/swap/quote
   */
  async getSwapQuote(req, res, next) {
    try {
      const { fromToken, toToken, amount, network } = req.body;

      logger.info('Get swap quote request', {
        fromToken,
        toToken,
        amount,
        network
      });

      const quote = await dappService.getSwapQuote(
        fromToken,
        toToken,
        amount,
        network
      );

      res.status(RESPONSE_CODES.SUCCESS).json({
        success: true,
        quote
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Build swap transaction
   * POST /api/dapp/swap/build
   */
  async buildSwapTransaction(req, res, next) {
    try {
      const { fromToken, toToken, amount, recipient, slippage, network } = req.body;

      logger.info('Build swap transaction request', {
        fromToken,
        toToken,
        amount,
        recipient,
        slippage,
        network
      });

      const transaction = await dappService.buildSwapTransaction(
        fromToken,
        toToken,
        amount,
        recipient,
        slippage,
        network
      );

      res.status(RESPONSE_CODES.SUCCESS).json({
        success: true,
        transaction
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Build approval transaction
   * POST /api/dapp/approve/build
   */
  async buildApprovalTransaction(req, res, next) {
    try {
      const { tokenAddress, spender, amount, network } = req.body;

      logger.info('Build approval transaction request', {
        tokenAddress,
        spender,
        amount,
        network
      });

      const transaction = await dappService.buildApprovalTransaction(
        tokenAddress,
        spender,
        amount,
        network
      );

      res.status(RESPONSE_CODES.SUCCESS).json({
        success: true,
        transaction
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Check token allowance
   * POST /api/dapp/approve/check
   */
  async checkAllowance(req, res, next) {
    try {
      const { tokenAddress, owner, spender, network } = req.body;

      logger.info('Check allowance request', {
        tokenAddress,
        owner,
        spender,
        network
      });

      const allowance = await dappService.checkAllowance(
        tokenAddress,
        owner,
        spender,
        network
      );

      res.status(RESPONSE_CODES.SUCCESS).json({
        success: true,
        ...allowance
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get token information
   * POST /api/dapp/token/info
   */
  async getTokenInfo(req, res, next) {
    try {
      const { tokenAddress, network } = req.body;

      logger.info('Get token info request', {
        tokenAddress,
        network
      });

      const tokenInfo = await dappService.getTokenInfo(tokenAddress, network);

      res.status(RESPONSE_CODES.SUCCESS).json({
        success: true,
        token: tokenInfo
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Estimate gas for swap
   * POST /api/dapp/swap/estimate-gas
   */
  async estimateSwapGas(req, res, next) {
    try {
      const { fromToken, toToken, amount, from, network } = req.body;

      logger.info('Estimate swap gas request', {
        fromToken,
        toToken,
        amount,
        from,
        network
      });

      const gasEstimate = await dappService.estimateSwapGas(
        fromToken,
        toToken,
        amount,
        from,
        network
      );

      res.status(RESPONSE_CODES.SUCCESS).json({
        success: true,
        gasEstimate
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new DAppController();
