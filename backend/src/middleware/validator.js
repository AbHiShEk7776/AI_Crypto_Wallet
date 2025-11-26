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


const isEthereumAddress = (value) => {
  if (!value) {
    throw new Error('Address is required');
  }
  
 
  const cleaned = String(value).trim().toLowerCase();
  
  if (cleaned.length !== 42) {
    throw new Error(`Address must be 42 characters (got ${cleaned.length})`);
  }
  
  if (!cleaned.startsWith('0x')) {
    throw new Error('Address must start with 0x');
  }
  

  const hexPart = cleaned.slice(2);
  if (!/^[0-9a-f]{40}$/.test(hexPart)) {
    throw new Error('Address contains invalid characters');
  }
  
 
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
    
    body('network')
      .optional()
      .trim()
      .toLowerCase()
      .isIn(['sepolia', 'ethereum', 'polygon']).withMessage('Invalid network'),
    body('tokenAddress')
      .optional({values:'null'})
      .trim()
      .custom(isEthereumAddress),
    
    validate
  ]
};

export const transactionValidation = {
  send: [
    body('txParams.to')
      .trim()
      .notEmpty().withMessage('Recipient address is required')
      .custom(isEthereumAddress),
   
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

// export const dappValidation = {
//   swap: [
//     body('fromToken')
//       .trim()
//       .notEmpty().withMessage('Source token is required'),
//     body('toToken')
//       .trim()
//       .notEmpty().withMessage('Destination token is required'),
//     body('amount')
//       .notEmpty().withMessage('Amount is required')
//       .custom(isValidAmount),
//     body('slippage')
//       .optional()
//       .isFloat({ min: 0, max: 50 }).withMessage('Slippage must be 0-50%'),
//     validate
//   ]
// };
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
export const dappValidation = {
  swapQuote: [
    body('fromToken')
      .trim()
      .notEmpty().withMessage('From token is required')
      .isString(),
    
    body('toToken')
      .trim()
      .notEmpty().withMessage('To token is required')
      .isString(),
    
    body('amount')
      .notEmpty().withMessage('Amount is required')
      .isString(),
    
    body('network')
      .optional()
      .isString()
      .toLowerCase()
      .isIn(['sepolia', 'ethereum', 'polygon']),
    
    validate
  ],
  
  executeSwap: [
    body('password')
      .notEmpty().withMessage('Password is required'),
    
    body('swapParams')
      .isObject().withMessage('Swap parameters required'),
    
    body('swapParams.fromToken')
      .trim()
      .notEmpty().withMessage('From token is required'),
    
    body('swapParams.toToken')
      .trim()
      .notEmpty().withMessage('To token is required'),
    
    body('swapParams.amountIn')
      .notEmpty().withMessage('Amount is required'),
    
    body('swapParams.minAmountOut')
      .notEmpty().withMessage('Minimum output amount is required'),
    
    body('network')
      .optional()
      .isString(),
    
    validate
  ],
  
  approveToken: [
    body('password')
      .notEmpty().withMessage('Password is required'),
    
    body('tokenAddress')
      .trim()
      .notEmpty().withMessage('Token address is required')
      .custom(isEthereumAddress),
    
    body('amount')
      .optional()
      .isString(),
    
    body('network')
      .optional()
      .isString(),
    
    validate
  ],
  
  buildSwap: [
    body('fromToken')
      .trim()
      .notEmpty().withMessage('From token is required'),
    
    body('toToken')
      .trim()
      .notEmpty().withMessage('To token is required'),
    
    body('amount')
      .notEmpty().withMessage('Amount is required'),
    
    body('recipient')
      .trim()
      .notEmpty().withMessage('Recipient is required')
      .custom(isEthereumAddress),
    
    body('slippage')
      .optional()
      .isFloat({ min: 0, max: 50 }),
    
    validate
  ],
  
  buildApproval: [
    body('tokenAddress')
      .trim()
      .notEmpty().withMessage('Token address is required')
      .custom(isEthereumAddress),
    
    body('spender')
      .trim()
      .notEmpty().withMessage('Spender address is required')
      .custom(isEthereumAddress),
    
    body('amount')
      .optional()
      .isString(),
    
    validate
  ],
  
  checkAllowance: [
    body('tokenAddress')
      .trim()
      .notEmpty().withMessage('Token address is required')
      .custom(isEthereumAddress),
    
    body('owner')
      .trim()
      .notEmpty().withMessage('Owner address is required')
      .custom(isEthereumAddress),
    
    body('spender')
      .trim()
      .notEmpty().withMessage('Spender address is required')
      .custom(isEthereumAddress),
    
    validate
  ],
  
  tokenInfo: [
    body('tokenAddress')
      .trim()
      .notEmpty().withMessage('Token address is required')
      .custom(isEthereumAddress),
    
    body('network')
      .optional()
      .isString(),
    
    validate
  ],
  
  tokenBalance: [
    body('address')
      .trim()
      .notEmpty().withMessage('Address is required')
      .custom(isEthereumAddress),
    
    body('tokenAddress')
      .optional()
      .isString(),
    
    body('network')
      .optional()
      .isString(),
    
    validate
  ]
};