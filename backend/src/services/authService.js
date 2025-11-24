import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { ethers } from 'ethers';
import * as bip39 from 'bip39';
import database from '../config/database.js';
import logger from '../utils/logger.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production-please';
const JWT_EXPIRES_IN = '7d';

class AuthService {
  constructor() {
    this.db = null;
  }

  async initialize() {
    this.db = database.getDb();
  }

  /**
   * Register new user with wallet creation
   */
  async register(userData) {
    try {
      const { email, password, name, phone } = userData;

      // Validate required fields
      if (!email || !password || !name) {
        throw new Error('Missing required fields: email, password, name');
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        throw new Error('Invalid email format');
      }

      // Validate password strength
      if (password.length < 8) {
        throw new Error('Password must be at least 8 characters long');
      }

      // Check if user already exists
      const existingUser = await this.db.collection('users').findOne({ email: email.toLowerCase() });
      if (existingUser) {
        throw new Error('User already exists with this email');
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, 10);

      // Generate new wallet
      logger.info('Generating wallet for new user...');
      const mnemonic = bip39.generateMnemonic(128); // 12 words
      const wallet = ethers.Wallet.fromPhrase(mnemonic);

      // Encrypt wallet data with user password
      const encryptedPrivateKey = await this.encryptData(wallet.privateKey, password);
      const encryptedMnemonic = await this.encryptData(mnemonic, password);

      // Create user document
      const user = {
        email: email.toLowerCase(),
        passwordHash,
        name,
        phone: phone || null,
        walletAddress: wallet.address,
        encryptedPrivateKey,
        emailNotifications: {
        transactions: true,
        lowBalance: true,
        weeklySummary: true
      },
        encryptedMnemonic,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastLogin: new Date(),
        role: 'user',
        isActive: true
      };

      const result = await this.db.collection('users').insertOne(user);

      logger.info('User registered successfully', { 
        userId: result.insertedId, 
        email,
        walletAddress: wallet.address 
      });

      // Generate JWT token
      const token = this.generateToken(result.insertedId, email);

      // Create session
      await this.createSession(result.insertedId, token);

      return {
        token,
        user: {
          id: result.insertedId,
          email: user.email,
          name: user.name,
          phone: user.phone,
          walletAddress: user.walletAddress
        },
        wallet: {
          address: wallet.address
        },
        mnemonic // Send this ONCE for user to save
      };
    } catch (error) {
      logger.error('Registration failed:', error);
      throw error;
    }
  }

  /**
   * Login user
   */
  async login(email, password) {
    try {
      // Find user
      const user = await this.db.collection('users').findOne({ 
        email: email.toLowerCase() 
      });

      if (!user) {
        throw new Error('Invalid email or password');
      }

      if (!user.isActive) {
        throw new Error('Account is suspended');
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.passwordHash);
      if (!isValidPassword) {
        throw new Error('Invalid email or password');
      }

      // Update last login
      await this.db.collection('users').updateOne(
        { _id: user._id },
        { 
          $set: { lastLogin: new Date() },
          $inc: { loginCount: 1 }
        }
      );

      // Generate token
      const token = this.generateToken(user._id, user.email);

      // Create session
      await this.createSession(user._id, token);

      logger.info('User logged in', { userId: user._id, email });

      return {
        token,
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          phone: user.phone,
          walletAddress: user.walletAddress
        },
        wallet: {
          address: user.walletAddress
        }
      };
    } catch (error) {
      logger.error('Login failed:', error);
      throw error;
    }
  }

  /**
   * Get wallet private key (requires password)
   */
  async getWalletPrivateKey(userId, password) {
    try {
      const user = await this.db.collection('users').findOne({ _id: userId });
      if (!user) {
        throw new Error('User not found');
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.passwordHash);
      if (!isValidPassword) {
        throw new Error('Invalid password');
      }

      // Decrypt private key
      const privateKey = await this.decryptData(user.encryptedPrivateKey, password);

      return privateKey;
    } catch (error) {
      logger.error('Private key retrieval failed:', error);
      throw error;
    }
  }

  /**
   * Simple encryption (password-based)
   */
  async encryptData(data, password) {
    // In production, use proper encryption library like crypto
    // For now, simple base64 encoding with password salt
    const salt = await bcrypt.genSalt(10);
    const combined = `${salt}:${data}`;
    return Buffer.from(combined).toString('base64');
  }

  /**
   * Simple decryption
   */
  async decryptData(encryptedData, password) {
    try {
      const decoded = Buffer.from(encryptedData, 'base64').toString('utf8');
      const parts = decoded.split(':');
      if (parts.length !== 2) {
        throw new Error('Invalid encrypted data format');
      }
      return parts[1]; // Return the actual data
    } catch (error) {
      throw new Error('Decryption failed');
    }
  }

  /**
   * Generate JWT token
   */
  generateToken(userId, email) {
    return jwt.sign(
      { 
        userId: userId.toString(), 
        email 
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );
  }

  /**
   * Verify JWT token
   */
  verifyToken(token) {
    try {
      return jwt.verify(token, JWT_SECRET);
    } catch (error) {
      throw new Error('Invalid or expired token');
    }
  }

  /**
   * Create session
   */
  async createSession(userId, token) {
    const session = {
      userId: userId.toString(),
      token,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    };

    await this.db.collection('sessions').insertOne(session);
  }

  /**
   * Logout (invalidate session)
   */
  async logout(token) {
    await this.db.collection('sessions').deleteOne({ token });
    logger.info('User logged out');
  }

  /**
   * Verify session
   */
  async verifySession(token) {
    const session = await this.db.collection('sessions').findOne({ token });
    if (!session) {
      return null;
    }

    if (new Date() > session.expiresAt) {
      await this.db.collection('sessions').deleteOne({ token });
      return null;
    }

    return session;
  }
}

const authService = new AuthService();
export default authService;
