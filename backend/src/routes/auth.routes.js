import express from 'express';
import authController from '../controllers/authController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { generalLimiter } from '../middleware/rateLimiter.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = express.Router();

// Public routes
router.post(
  '/register',
  generalLimiter,
  asyncHandler(authController.register)
);

router.post(
  '/login',
  generalLimiter,
  asyncHandler(authController.login)
);

// Protected routes
router.post(
  '/logout',
  authMiddleware,
  asyncHandler(authController.logout)
);

router.get(
  '/me',
  authMiddleware,
  asyncHandler(authController.getCurrentUser)
);

export default router;
