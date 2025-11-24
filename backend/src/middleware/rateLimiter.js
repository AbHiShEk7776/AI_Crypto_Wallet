import rateLimit from 'express-rate-limit';
import { ERROR_MESSAGES, RESPONSE_CODES } from '../config/constants.js';

/**
 * Rate limiting middleware to prevent abuse
 * Different limits for different endpoints
 */

// General API rate limiter (100 requests per 15 minutes)
export const generalLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: {
    success: false,
    error: ERROR_MESSAGES.RATE_LIMIT_EXCEEDED
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(RESPONSE_CODES.FORBIDDEN).json({
      success: false,
      error: ERROR_MESSAGES.RATE_LIMIT_EXCEEDED,
      retryAfter: req.rateLimit.resetTime
    });
  }
});

// Strict limiter for transaction endpoints (10 per 15 minutes)
export const transactionLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: {
    success: false,
    error: 'Too many transactions - please wait before sending more'
  },
  skipSuccessfulRequests: false
});

// NLP endpoint limiter (50 per 15 minutes)
export const nlpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  message: {
    success: false,
    error: 'Too many AI requests - please slow down'
  }
});

// Wallet creation limiter (5 per hour)
export const walletCreationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: {
    success: false,
    error: 'Too many wallet creation attempts'
  }
});
