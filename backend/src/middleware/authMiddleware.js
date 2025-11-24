import authService from '../services/authService.js';
import database from '../config/database.js';
import logger from '../utils/logger.js';
import { RESPONSE_CODES } from '../config/constants.js';
import { ObjectId } from 'mongodb';

/**
 * JWT Authentication Middleware
 */
export const authMiddleware = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(RESPONSE_CODES.UNAUTHORIZED).json({
        success: false,
        error: 'No token provided'
      });
    }

    const token = authHeader.replace('Bearer ', '');

    // Verify token
    const decoded = authService.verifyToken(token);

    // Verify session exists
    const session = await authService.verifySession(token);
    if (!session) {
      return res.status(RESPONSE_CODES.UNAUTHORIZED).json({
        success: false,
        error: 'Invalid or expired session'
      });
    }

    // Get user from database
    const db = database.getDb();
    const user = await db.collection('users').findOne({ 
      _id: new ObjectId(decoded.userId) 
    });

    if (!user) {
      return res.status(RESPONSE_CODES.UNAUTHORIZED).json({
        success: false,
        error: 'User not found'
      });
    }

    if (!user.isActive) {
      return res.status(RESPONSE_CODES.FORBIDDEN).json({
        success: false,
        error: 'Account is suspended'
      });
    }

    // Attach user to request
    req.user = {
      id: user._id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      walletAddress: user.walletAddress,
      role: user.role
    };

    next();
  } catch (error) {
    logger.error('Auth middleware error:', error);
    return res.status(RESPONSE_CODES.UNAUTHORIZED).json({
      success: false,
      error: 'Authentication failed'
    });
  }
};
