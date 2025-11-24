import express from 'express';
import demoController from '../controllers/demoController.js';
import { generalLimiter } from '../middleware/rateLimiter.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = express.Router();

// Demo balance
router.post(
  '/balance',
  generalLimiter,
  asyncHandler(demoController.getDemoBalance)
);

// Demo transaction
router.post(
  '/send',
  generalLimiter,
  asyncHandler(demoController.sendDemoTransaction)
);

// Demo history
router.post(
  '/history',
  generalLimiter,
  asyncHandler(demoController.getDemoHistory)
);

// Demo swap quote
router.post(
  '/swap/quote',
  generalLimiter,
  asyncHandler(demoController.getDemoSwapQuote)
);

// Demo swap
router.post(
  '/swap/execute',
  generalLimiter,
  asyncHandler(demoController.simulateDemoSwap)
);

// Demo gas estimate
router.post(
  '/estimate-gas',
  generalLimiter,
  asyncHandler(demoController.estimateDemoGas)
);

export default router;
