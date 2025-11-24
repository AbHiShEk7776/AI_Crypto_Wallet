import { body, param,validationResult } from 'express-validator';
import { ethers } from 'ethers';
import { RESPONSE_CODES } from '../config/constants.js';

export const validate = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.status(RESPONSE_CODES.BAD_REQUEST).json({
      success: false,
      error: 'Validation failed',
      details: errors.array().map(err => ({
        field: err.path,
        message: err.msg
      }))
    });
  }
  
  next();
};

// FIXED: More robust address validator
const isEthereumAddress = (value) => {
  if (!value) {
    throw new Error('Address is required');
  }
  
  // Clean and convert to lowercase for validation
  const cleaned = String(value).trim().toLowerCase();
  
  // Basic format check
  if (cleaned.length !== 42) {
    throw new Error(`Address must be 42 characters (got ${cleaned.length})`);
  }
  
  if (!cleaned.startsWith('0x')) {
    throw new Error('Address must start with 0x');
  }
  
  // Check hex characters
  const hexPart = cleaned.slice(2);
  if (!/^[0-9a-f]{40}$/.test(hexPart)) {
    throw new Error('Address contains invalid characters');
  }
  
  // Validate using ethers with lowercase (more permissive)
  try {
    ethers.getAddress(cleaned);
    return true;
  } catch (error) {
    throw new Error('Invalid Ethereum address checksum');
  }
};

const isValidAmount = (value) => {
  const num = parseFloat(value);
  if (isNaN(num) || num <= 0) {
    throw new Error('Amount must be a positive number');
  }
  return true;
};

const isValidMnemonic = (value) => {
  const wordCount = value.trim().split(/\s+/).length;
  if (![12, 15, 18, 21, 24].includes(wordCount)) {
    throw new Error('Mnemonic must be 12, 15, 18, 21, or 24 words');
  }
  return true;
};

export const walletValidation = {
  recover: [
    body('mnemonic')
      .trim()
      .notEmpty().withMessage('Recovery phrase is required')
      .custom(isValidMnemonic),
    validate
  ],
  
  balance: [
    body('address')
      .trim()
      .notEmpty().withMessage('Address is required')
      .custom(isEthereumAddress),
    // REMOVED: customSanitizer (was causing errors)
    body('network')
      .optional()
      .trim()
      .toLowerCase()
      .isIn(['sepolia', 'ethereum', 'polygon']).withMessage('Invalid network'),
    body('tokenAddress')
      .optional({values:'null'})
      .trim()
      .custom(isEthereumAddress),
    // REMOVED: customSanitizer
    validate
  ]
};

export const transactionValidation = {
  send: [
    body('txParams.to')
      .trim()
      .notEmpty().withMessage('Recipient address is required')
      .custom(isEthereumAddress),
    // REMOVED: customSanitizer
    body('txParams.value')
      .notEmpty().withMessage('Amount is required')
      .custom(isValidAmount),
    body('network')
      .optional()
      .isIn(['sepolia', 'ethereum', 'polygon']).withMessage('Invalid network'),
    validate
  ],
  
  estimate: [
    body('txParams.from')
      .trim()
      .notEmpty().withMessage('Sender address is required')
      .custom(isEthereumAddress),
    body('txParams.to')
      .trim()
      .notEmpty().withMessage('Recipient address is required')
      .custom(isEthereumAddress),
    validate
  ]
};

export const nlpValidation = {
  parse: [
    body('message')
      .trim()
      .notEmpty().withMessage('Message is required')
      .isLength({ min: 1, max: 500 }).withMessage('Message must be 1-500 characters'),
    body('history')
      .optional()
      .isArray().withMessage('History must be an array'),
    validate
  ]
};

export const dappValidation = {
  swap: [
    body('fromToken')
      .trim()
      .notEmpty().withMessage('Source token is required'),
    body('toToken')
      .trim()
      .notEmpty().withMessage('Destination token is required'),
    body('amount')
      .notEmpty().withMessage('Amount is required')
      .custom(isValidAmount),
    body('slippage')
      .optional()
      .isFloat({ min: 0, max: 50 }).withMessage('Slippage must be 0-50%'),
    validate
  ]
};
export const contactValidation = {
  add: [
    body('alias')
      .trim()
      .notEmpty().withMessage('Alias is required')
      .isLength({ min: 1, max: 50 }).withMessage('Alias must be 1-50 characters'),
    
    body('walletAddress')
      .trim()
      .notEmpty().withMessage('Wallet address is required')
      .custom(isEthereumAddress),
    
    body('notes')
      .optional()
      .trim()
      .isLength({ max: 500 }).withMessage('Notes must be less than 500 characters'),
    
    body('tags')
      .optional()
      .isArray().withMessage('Tags must be an array'),
    
    body('favorite')
      .optional()
      .isBoolean().withMessage('Favorite must be a boolean'),
    
    validate
  ],
  
  update: [
    param('id')
      .isMongoId().withMessage('Invalid contact ID'),
    
    body('alias')
      .optional()
      .trim()
      .notEmpty().withMessage('Alias cannot be empty')
      .isLength({ min: 1, max: 50 }).withMessage('Alias must be 1-50 characters'),
    
    body('notes')
      .optional()
      .trim()
      .isLength({ max: 500 }).withMessage('Notes must be less than 500 characters'),
    
    body('tags')
      .optional()
      .isArray().withMessage('Tags must be an array'),
    
    body('favorite')
      .optional()
      .isBoolean().withMessage('Favorite must be a boolean'),
    
    validate
  ]
};