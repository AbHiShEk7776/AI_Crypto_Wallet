import { MongoClient } from 'mongodb';
import logger from '../utils/logger.js';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DB_NAME = process.env.DB_NAME || 'crypto_wallet';

class Database {
  constructor() {
    this.client = null;
    this.db = null;
  }

  async connect() {
    try {
      logger.info('Connecting to MongoDB...');
      
      this.client = new MongoClient(MONGODB_URI);
      await this.client.connect();
      this.db = this.client.db(DB_NAME);
      
      // Create indexes
      await this.createIndexes();
      
      logger.info('MongoDB connected successfully');
      return this.db;
    } catch (error) {
      logger.error('MongoDB connection failed:', error);
      throw error;
    }
  }

  async createIndexes() {
    try {
      // Users collection indexes
      await this.db.collection('users').createIndex({ email: 1 }, { unique: true });
      await this.db.collection('users').createIndex({ walletAddress: 1 }, { unique: true, sparse: true });
      await this.db.collection('users').createIndex({ phone: 1 }, { sparse: true });
      
      // Sessions collection indexes
      await this.db.collection('sessions').createIndex({ userId: 1 });
      await this.db.collection('sessions').createIndex({ token: 1 }, { unique: true });
      await this.db.collection('sessions').createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
      
      logger.info('Database indexes created');
    } catch (error) {
      logger.warn('Index creation warning:', error.message);
    }
  }

  getDb() {
    if (!this.db) {
      throw new Error('Database not connected. Call connect() first.');
    }
    return this.db;
  }

  async close() {
    if (this.client) {
      await this.client.close();
      logger.info('MongoDB connection closed');
    }
  }
}

const database = new Database();
export default database;
