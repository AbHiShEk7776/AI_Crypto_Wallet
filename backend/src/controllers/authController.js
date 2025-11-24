import authService from '../services/authService.js';
import logger from '../utils/logger.js';
import { RESPONSE_CODES } from '../config/constants.js';
import emailService from '../services/emailService.js'; 

class AuthController {
  /**
   * Register new user
   * POST /api/auth/register
   */
  async register(req, res, next) {
    try {
      const { email, password, name, phone } = req.body;

      logger.info('Registration request', { email, name });

      const result = await authService.register({
        email,
        password,
        name,
        phone
      });
      // Send welcome email (non-blocking)
    emailService.sendWelcomeEmail({
      name: result.user.name,
      email: result.user.email,
      walletAddress: result.user.walletAddress
    }).catch(error => {
      logger.error('Failed to send welcome email:', error);
      // Don't fail signup if email fails
    });

      res.status(RESPONSE_CODES.CREATED).json({
        success: true,
        message: 'Account created successfully',
        ...result
      });
    } catch (error) {
      logger.error('Registration error:', error);
      res.status(RESPONSE_CODES.BAD_REQUEST).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Login user
   * POST /api/auth/login
   */
  async login(req, res, next) {
    try {
      const { email, password } = req.body;

      logger.info('Login request', { email });

      const result = await authService.login(email, password);

      res.status(RESPONSE_CODES.SUCCESS).json({
        success: true,
        message: 'Logged in successfully',
        ...result
      });
    } catch (error) {
      logger.error('Login error:', error);
      res.status(RESPONSE_CODES.BAD_REQUEST).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Logout user
   * POST /api/auth/logout
   */
  async logout(req, res, next) {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');

      if (token) {
        await authService.logout(token);
      }

      res.status(RESPONSE_CODES.SUCCESS).json({
        success: true,
        message: 'Logged out successfully'
      });
    } catch (error) {
      logger.error('Logout error:', error);
      next(error);
    }
  }

  /**
   * Get current user
   * GET /api/auth/me
   */
  async getCurrentUser(req, res, next) {
    try {
      res.status(RESPONSE_CODES.SUCCESS).json({
        success: true,
        user: req.user
      });
    } catch (error) {
      logger.error('Get current user error:', error);
      next(error);
    }
  }
}

export default new AuthController();
