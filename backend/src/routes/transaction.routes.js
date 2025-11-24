import express from 'express';
import transactionController from '../controllers/transactionController.js';
import { transactionValidation } from '../middleware/validator.js';
import { generalLimiter, transactionLimiter } from '../middleware/rateLimiter.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get(
  '/history',
  authMiddleware,
  asyncHandler(transactionController.getHistory)
);
// Estimate gas
router.post(
  '/estimate-gas',
  generalLimiter,
  transactionValidation.estimate,
  asyncHandler(transactionController.estimateGas)
);

// Simulate transaction
router.post(
  '/simulate',
  generalLimiter,
  transactionValidation.estimate,
  asyncHandler(transactionController.simulateTransaction)
);
//send with password
router.post(
  '/send-with-password',
  authMiddleware,  // Requires JWT token
  transactionLimiter,
  asyncHandler(transactionController.sendWithPassword)
);
// Send transaction
router.post(
  '/send',
  transactionLimiter,
  transactionValidation.send,
  asyncHandler(transactionController.sendTransaction)
);

// Get transaction receipt
router.post(
  '/receipt',
  generalLimiter,
  asyncHandler(transactionController.getReceipt)
);

// Get nonce
router.post(
  '/nonce',
  generalLimiter,
  asyncHandler(transactionController.getNonce)
);

// Cancel transaction
router.post(
  '/cancel',
  transactionLimiter,
  asyncHandler(transactionController.cancelTransaction)
);

export default router;
