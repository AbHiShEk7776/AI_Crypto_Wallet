import logger from '../utils/logger.js';
import { RESPONSE_CODES } from '../config/constants.js';

/**
 * Global error handling middleware
 * Catches all errors and formats consistent error responses
 */

class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Express error handling middleware
 */
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log error
  logger.error('Error occurred:', {
    message: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip
  });

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    error = new AppError('Resource not found', RESPONSE_CODES.NOT_FOUND);
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    error = new AppError('Duplicate field value entered', RESPONSE_CODES.BAD_REQUEST);
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message).join(', ');
    error = new AppError(message, RESPONSE_CODES.BAD_REQUEST);
  }

  // Ethers errors
  if (err.code === 'INSUFFICIENT_FUNDS') {
    error = new AppError('Insufficient funds for transaction', RESPONSE_CODES.BAD_REQUEST);
  }

  if (err.code === 'INVALID_ARGUMENT') {
    error = new AppError('Invalid transaction parameters', RESPONSE_CODES.BAD_REQUEST);
  }

  // Default error response
  res.status(error.statusCode || RESPONSE_CODES.INTERNAL_ERROR).json({
    success: false,
    error: error.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

/**
 * Async handler wrapper to catch promise rejections
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

export { AppError, errorHandler, asyncHandler };
