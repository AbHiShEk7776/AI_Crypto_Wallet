import dappService from '../services/dappService.js';
import authService from '../services/authService.js';
import swapService from '../services/swapService.js';
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
        network || 'sepolia'
      );

      res.status(RESPONSE_CODES.SUCCESS).json({
        success: true,
        quote
      });
    } catch (error) {
      logger.error('Get swap quote failed:', error);
      res.status(RESPONSE_CODES.BAD_REQUEST).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Execute swap with password
   * POST /api/dapp/swap/execute
   */
  async executeSwap(req, res, next) {
    try {
      const { password, swapParams, network } = req.body;
      const userId = req.user.id;

      logger.info('Execute swap request', {
        userId,
        fromToken: swapParams.fromToken,
        toToken: swapParams.toToken,
        amount: swapParams.amountIn
      });

      if (!password) {
        return res.status(RESPONSE_CODES.BAD_REQUEST).json({
          success: false,
          error: 'Password is required'
        });
      }

      // Get private key
      const privateKey = await authService.getWalletPrivateKey(userId, password);

      // Execute swap using SwapService
      const result = await swapService.executeSwap(
        privateKey,
        swapParams,
        network || 'sepolia'
      );

      res.status(RESPONSE_CODES.SUCCESS).json({
        success: true,
        swap: result
      });
    } catch (error) {
      logger.error('Execute swap failed:', error);
      res.status(RESPONSE_CODES.BAD_REQUEST).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Build swap transaction (unsigned)
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
        slippage || 0.5,
        network || 'sepolia'
      );

      res.status(RESPONSE_CODES.SUCCESS).json({
        success: true,
        transaction
      });
    } catch (error) {
      logger.error('Build swap transaction failed:', error);
      next(error);
    }
  }

  /**
   * Approve token with password
   * POST /api/dapp/approve/execute
   */
  async approveToken(req, res, next) {
    try {
      const { password, tokenAddress, amount, network } = req.body;
      const userId = req.user.id;

      logger.info('Token approval request', {
        userId,
        token: tokenAddress
      });

      if (!password) {
        return res.status(RESPONSE_CODES.BAD_REQUEST).json({
          success: false,
          error: 'Password is required'
        });
      }

      const privateKey = await authService.getWalletPrivateKey(userId, password);

      const result = await swapService.approveToken(
        privateKey,
        tokenAddress,
        amount || 'unlimited',
        network || 'sepolia'
      );

      res.status(RESPONSE_CODES.SUCCESS).json({
        success: true,
        approval: result
      });
    } catch (error) {
      logger.error('Token approval failed:', error);
      res.status(RESPONSE_CODES.BAD_REQUEST).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Build approval transaction (unsigned)
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
        network || 'sepolia'
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
        network || 'sepolia'
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

      const tokenInfo = await dappService.getTokenInfo(
        tokenAddress, 
        network || 'sepolia'
      );

      res.status(RESPONSE_CODES.SUCCESS).json({
        success: true,
        token: tokenInfo
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get supported tokens
   * GET /api/dapp/tokens
   */
  async getSupportedTokens(req, res, next) {
    try {
      const tokens = dappService.getSupportedTokens();

      res.status(RESPONSE_CODES.SUCCESS).json({
        success: true,
        ...tokens
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
        network || 'sepolia'
      );

      res.status(RESPONSE_CODES.SUCCESS).json({
        success: true,
        gasEstimate
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get token balance
   * POST /api/dapp/token/balance
   */
  async getTokenBalance(req, res, next) {
    try {
      const { address, tokenAddress, network } = req.body;

      const balance = await dappService.getTokenBalance(
        address,
        tokenAddress,
        network || 'sepolia'
      );

      res.status(RESPONSE_CODES.SUCCESS).json({
        success: true,
        ...balance
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new DAppController();
