import database from '../config/database.js';
import logger from '../utils/logger.js';
import { ObjectId } from 'mongodb';

/**
 * Transaction History Service
 * Manages transaction logging and retrieval
 */

class TransactionHistoryService {
  constructor() {
    this.db = null;
    this.collection = null;
  }

  async initialize() {
    this.db = database.getDb();
      if (!this.db) {
      throw new Error('Database not connected');
    }
    this.collection = this.db.collection('transactions');
    
    // Create indexes
    await this.createIndexes();
  }

  async createIndexes() {
    try {
      await this.collection.createIndex({ userId: 1 });
      await this.collection.createIndex({ walletAddress: 1 });
      await this.collection.createIndex({ hash: 1 }, { unique: true });
      await this.collection.createIndex({ timestamp: -1 });
      await this.collection.createIndex({ network: 1 });
      await this.collection.createIndex({ createdAt: -1 });
      
      logger.info('Transaction indexes created');
    } catch (error) {
      logger.warn('Transaction index creation warning:', error.message);
    }
  }

  /**
   * Log a new transaction
   */
  async logTransaction(userId, walletAddress, txData) {
    try {
      const transaction = {
        userId: new ObjectId(userId),
        walletAddress,
        
        // Transaction details
        hash: txData.hash,
        from: txData.from,
        to: txData.to,
        value: txData.value,
        valueWei: txData.valueWei || null,
        
        // Gas & fees
        gasUsed: txData.gasUsed,
        effectiveGasPrice: txData.effectiveGasPrice,
        gasCost: txData.gasCost || null,
        
        // Status
        status: txData.status,
        type: txData.type || 'sent',
        
        // Blockchain data
        blockNumber: txData.blockNumber,
        blockHash: txData.blockHash,
        confirmations: txData.confirmations || 1,
        network: txData.network || 'sepolia',
        
        // Token
        token: txData.token || 'ETH',
        tokenAddress: txData.tokenAddress || null,
        
        // Metadata
        timestamp: txData.timestamp || Math.floor(Date.now() / 1000),
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const result = await this.collection.insertOne(transaction);
      
      logger.info('Transaction logged', {
        txId: result.insertedId,
        hash: txData.hash,
        userId
      });

      return {
        ...transaction,
        _id: result.insertedId
      };
    } catch (error) {
      // If duplicate hash, just log warning (transaction already exists)
      if (error.code === 11000) {
        logger.warn('Transaction already logged:', txData.hash);
        return null;
      }
      
      logger.error('Failed to log transaction:', error);
      throw error;
    }
  }

  /**
   * Get transaction history for user
   */
  async getUserTransactions(userId, options = {}) {
    try {
      const {
        limit = 50,
        skip = 0,
        network = null,
        type = null
      } = options;

      const query = { userId: new ObjectId(userId) };
      
      if (network) {
        query.network = network;
      }
      
      if (type) {
        query.type = type;
      }

      const transactions = await this.collection
        .find(query)
        .sort({ timestamp: -1 })
        .limit(limit)
        .skip(skip)
        .toArray();

      const total = await this.collection.countDocuments(query);

      return {
        transactions,
        total,
        limit,
        skip
      };
    } catch (error) {
      logger.error('Failed to get user transactions:', error);
      throw error;
    }
  }

  /**
   * Get single transaction by hash
   */
  async getTransactionByHash(hash) {
    try {
      return await this.collection.findOne({ hash });
    } catch (error) {
      logger.error('Failed to get transaction:', error);
      throw error;
    }
  }

  /**
   * Update transaction status (e.g., confirmations)
   */
  async updateTransaction(hash, updates) {
    try {
      const result = await this.collection.updateOne(
        { hash },
        { 
          $set: {
            ...updates,
            updatedAt: new Date()
          }
        }
      );

      return result.modifiedCount > 0;
    } catch (error) {
      logger.error('Failed to update transaction:', error);
      throw error;
    }
  }

  /**
   * Get transaction stats for user
   */
  async getUserStats(userId) {
    try {
      const pipeline = [
        { $match: { userId: new ObjectId(userId) } },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            totalValue: { $sum: { $toDouble: '$value' } }
          }
        }
      ];

      const stats = await this.collection.aggregate(pipeline).toArray();

      return {
        totalTransactions: stats.reduce((sum, s) => sum + s.count, 0),
        successful: stats.find(s => s._id === 'success')?.count || 0,
        failed: stats.find(s => s._id === 'failed')?.count || 0,
        pending: stats.find(s => s._id === 'pending')?.count || 0
      };
    } catch (error) {
      logger.error('Failed to get user stats:', error);
      throw error;
    }
  }
}

const transactionHistoryService = new TransactionHistoryService();
export default transactionHistoryService;
