import swapService from '../services/swapService.js';
import authService from '../services/authService.js';
import logger from '../utils/logger.js';
import { RESPONSE_CODES } from '../config/constants.js';

/**
 * Swap Controller
 * Handles HTTP requests for token swaps
 */

class SwapController {
  /**
   * Get swap quote
   * POST /api/swap/quote
   */
  async getQuote(req, res, next) {
    try {
      const { fromToken, toToken, amountIn, network } = req.body;

      logger.info('Get swap quote', { fromToken, toToken, amountIn });

      const quote = await swapService.getQuote(
        fromToken,
        toToken,
        amountIn,
        network || 'sepolia'
      );

      res.status(RESPONSE_CODES.SUCCESS).json({
        success: true,
        quote
      });
    } catch (error) {
      logger.error('Get quote failed:', error);
      res.status(RESPONSE_CODES.BAD_REQUEST).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Execute swap with password
   * POST /api/swap/execute
   */
  async executeSwap(req, res, next) {
    try {
      const { password, swapParams, network } = req.body;
      const userId = req.user.id;

      logger.info('Execute swap', {
        userId,
        fromToken: swapParams.fromToken,
        toToken: swapParams.toToken
      });

      if (!password) {
        return res.status(RESPONSE_CODES.BAD_REQUEST).json({
          success: false,
          error: 'Password is required'
        });
      }

      // Get private key
      const privateKey = await authService.getWalletPrivateKey(userId, password);

      // Check if approval needed (if swapping tokens)
      if (swapParams.fromToken !== 'ETH') {
        
      }

      // Execute swap
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
   * Get supported tokens
   * GET /api/swap/tokens
   */
  async getSupportedTokens(req, res, next) {
    try {
      const tokens = swapService.getSupportedTokens();

      res.status(RESPONSE_CODES.SUCCESS).json({
        success: true,
        ...tokens
      });
    } catch (error) {
      logger.error('Get tokens failed:', error);
      next(error);
    }
  }

  /**
   * Approve token spending
   * POST /api/swap/approve
   */
  async approveToken(req, res, next) {
    try {
      const { password, tokenAddress, amount, network } = req.body;
      const userId = req.user.id;

      const privateKey = await authService.getWalletPrivateKey(userId, password);

      const result = await swapService.approveToken(
        privateKey,
        tokenAddress,
        amount,
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
}

export default new SwapController();
