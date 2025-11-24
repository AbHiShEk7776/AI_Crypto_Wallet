import express from 'express';
import dappController from '../controllers/dappController.js';
import { dappValidation } from '../middleware/validator.js';
import { generalLimiter } from '../middleware/rateLimiter.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = express.Router();

// Public routes (no auth required)
// Get supported tokens
router.get(
  '/tokens',
  generalLimiter,
  asyncHandler(dappController.getSupportedTokens)
);

// Get swap quote
router.post(
  '/swap/quote',
  generalLimiter,
  dappValidation.swapQuote,
  asyncHandler(dappController.getSwapQuote)
);

// Estimate swap gas
router.post(
  '/swap/estimate-gas',
  generalLimiter,
  dappValidation.swapQuote,
  asyncHandler(dappController.estimateSwapGas)
);

// Get token info
router.post(
  '/token/info',
  generalLimiter,
  dappValidation.tokenInfo,
  asyncHandler(dappController.getTokenInfo)
);

// Get token balance
router.post(
  '/token/balance',
  generalLimiter,
  dappValidation.tokenBalance,
  asyncHandler(dappController.getTokenBalance)
);

// Check token allowance
router.post(
  '/approve/check',
  generalLimiter,
  dappValidation.checkAllowance,
  asyncHandler(dappController.checkAllowance)
);

// Protected routes (auth required)
// Execute swap
router.post(
  '/swap/execute',
  authMiddleware,
  generalLimiter,
  dappValidation.executeSwap,
  asyncHandler(dappController.executeSwap)
);

// Approve token
router.post(
  '/approve/execute',
  authMiddleware,
  generalLimiter,
  dappValidation.approveToken,
  asyncHandler(dappController.approveToken)
);

// Build transactions (unsigned - for advanced users)
router.post(
  '/swap/build',
  generalLimiter,
  dappValidation.buildSwap,
  asyncHandler(dappController.buildSwapTransaction)
);

router.post(
  '/approve/build',
  generalLimiter,
  dappValidation.buildApproval,
  asyncHandler(dappController.buildApprovalTransaction)
);

export default router;
