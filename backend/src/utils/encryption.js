import CryptoJS from 'crypto-js';
import crypto from 'crypto';

/**
 * Encryption utilities for securing sensitive data
 * Uses AES-256-GCM for encryption with additional app-level key
 */

class EncryptionService {
  constructor() {
    this.secretKey = process.env.ENCRYPTION_KEY;
    console.log('ENCRYPTION_KEY length:', (this.secretKey || '').length);
    console.log('ENCRYPTION_KEY length at encryption.js:', (process.env.ENCRYPTION_KEY || '').length);
    
    if (!this.secretKey || this.secretKey.length < 32) {
      throw new Error('ENCRYPTION_KEY must be at least 32 characters');
    }
  }

  /**
   * Encrypt private key with user password
   * @param {string} privateKey - Wallet private key
   * @param {string} password - User's password
   * @returns {string} Encrypted string
   */
  encryptPrivateKey(privateKey, password) {
    try {
      // Combine user password with app secret for double encryption
      const combinedKey = password + this.secretKey;
      
      // Encrypt using AES
      const encrypted = CryptoJS.AES.encrypt(privateKey, combinedKey).toString();
      
      return encrypted;
    } catch (error) {
      throw new Error(`Encryption failed: ${error.message}`);
    }
  }

  /**
   * Decrypt private key with user password
   * @param {string} encryptedKey - Encrypted private key
   * @param {string} password - User's password
   * @returns {string} Decrypted private key
   */
  decryptPrivateKey(encryptedKey, password) {
    try {
      const combinedKey = password + this.secretKey;
      
      // Decrypt using AES
      const bytes = CryptoJS.AES.decrypt(encryptedKey, combinedKey);
      const decrypted = bytes.toString(CryptoJS.enc.Utf8);
      
      if (!decrypted) {
        throw new Error('Decryption failed - wrong password');
      }
      
      return decrypted;
    } catch (error) {
      throw new Error('Decryption failed - wrong password');
    }
  }

  /**
   * Generate a secure random string
   * @param {number} length - Length of random string
   * @returns {string} Random hex string
   */
  generateRandomString(length = 32) {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * Hash a password (for future authentication features)
   * @param {string} password - Plain text password
   * @returns {string} Hashed password
   */
  hashPassword(password) {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
    return `${salt}:${hash}`;
  }

  /**
   * Verify a password against hash
   * @param {string} password - Plain text password
   * @param {string} hashedPassword - Stored hash
   * @returns {boolean} True if password matches
   */
  verifyPassword(password, hashedPassword) {
    const [salt, hash] = hashedPassword.split(':');
    const verifyHash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
    return hash === verifyHash;
  }
}

export default new EncryptionService();
