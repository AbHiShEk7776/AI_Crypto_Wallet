import express from 'express';
import nlpController from '../controllers/nlpController.js';
import { nlpValidation } from '../middleware/validator.js';
import { nlpLimiter } from '../middleware/rateLimiter.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = express.Router();

// Parse natural language intent
router.post(
  '/parse',
  nlpLimiter,
  nlpValidation.parse,
  asyncHandler(nlpController.parseIntent)
);

// Health check for Ollama
router.get(
  '/health',
  asyncHandler(nlpController.checkHealth)
);

export default router;
