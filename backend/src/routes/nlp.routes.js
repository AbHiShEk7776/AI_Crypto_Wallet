import express from 'express';
import nlpController from '../controllers/nlpController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { generalLimiter } from '../middleware/rateLimiter.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = express.Router();

// Health check
router.get(
  '/health',
  generalLimiter,
  asyncHandler(nlpController.health.bind(nlpController))
);

// Agentic chat endpoint - executes actions directly
router.post(
  '/chat',
  authMiddleware,
  generalLimiter,
  asyncHandler(nlpController.chat.bind(nlpController))
);

export default router;
