import express from 'express';
import dappController from '../controllers/dappController.js';
import { dappValidation } from '../middleware/validator.js';
import { generalLimiter } from '../middleware/rateLimiter.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = express.Router();

// Get swap quote
router.post(
  '/swap/quote',
  generalLimiter,
  dappValidation.swap,
  asyncHandler(dappController.getSwapQuote)
);

// Build swap transaction
router.post(
  '/swap/build',
  generalLimiter,
  dappValidation.swap,
  asyncHandler(dappController.buildSwapTransaction)
);

// Estimate swap gas
router.post(
  '/swap/estimate-gas',
  generalLimiter,
  asyncHandler(dappController.estimateSwapGas)
);

// Build approval transaction
router.post(
  '/approve/build',
  generalLimiter,
  asyncHandler(dappController.buildApprovalTransaction)
);

// Check allowance
router.post(
  '/approve/check',
  generalLimiter,
  asyncHandler(dappController.checkAllowance)
);

// Get token info
router.post(
  '/token/info',
  generalLimiter,
  asyncHandler(dappController.getTokenInfo)
);

export default router;
