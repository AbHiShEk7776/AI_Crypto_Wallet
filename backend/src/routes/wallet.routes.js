import express from 'express';
import walletController from '../controllers/walletController.js';
import { walletValidation } from '../middleware/validator.js';
import { generalLimiter, walletCreationLimiter } from '../middleware/rateLimiter.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = express.Router();
router.use((req, res, next) => {
  console.log('\n=== WALLET ROUTE DEBUG ===');
  console.log('Path:', req.path);
  console.log('Method:', req.method);
  console.log('Body:', JSON.stringify(req.body, null, 2));
  console.log('Query:', req.query);
  console.log('==========================\n');
  next();
});

// Generate new wallet
router.post(
  '/generate',
  walletCreationLimiter,
  asyncHandler(walletController.generateWallet)
);

// Recover wallet from mnemonic
router.post(
  '/recover',
  generalLimiter,
  walletValidation.recover,
  asyncHandler(walletController.recoverWallet)
);

// Get balance

router.post(
  '/balance',
  generalLimiter,
  walletValidation.balance,
  asyncHandler(walletController.getBalance)
);

// Get transaction history
router.post(
  '/history',
  generalLimiter,
  walletValidation.balance, // Reuse address validation
  asyncHandler(walletController.getHistory)
);

// Get gas prices
router.get(
  '/gas-prices/:network',
  generalLimiter,
  asyncHandler(walletController.getGasPrices)
);

// Derive multiple addresses
router.post(
  '/derive',
  generalLimiter,
  asyncHandler(walletController.deriveAddresses)
);

export default router;
