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
    this.usersCollection = null;
  }

  async initialize() {
    this.db = database.getDb();
    if (!this.db) {
      throw new Error('Database not connected');
    }
    this.collection = this.db.collection('transactions');
    this.usersCollection = this.db.collection('users'); 

    // Create indexes
    await this.createIndexes();
  }

  async createIndexes() {
    try {
      await this.collection.createIndex({ userId: 1 });
      await this.collection.createIndex({ walletAddress: 1 });
      await this.collection.createIndex({ hash: 1 }); 
      await this.collection.createIndex({ timestamp: -1 });
      await this.collection.createIndex({ network: 1 });
      await this.collection.createIndex({ createdAt: -1 });
      await this.collection.createIndex({ type: 1 });
        
    await this.collection.createIndex(
      { userId: 1, hash: 1, type: 1 },
      { unique: true }
    );

   

      logger.info('Transaction indexes created');
    } catch (error) {
      logger.warn('Transaction index creation warning:', error.message);
    }
  }

  /**
   * Log a new transaction for a single user
   */
  async logTransaction(userId, walletAddress, txData) {
    try {
      const transaction = {
        userId: new ObjectId(userId),
        walletAddress,

        
        from: txData.from ? txData.from.toLowerCase() : null,
        to: txData.to ? txData.to.toLowerCase() : null,

        hash: txData.hash,
        value: txData.value,
        valueWei: txData.valueWei || null,

        gasUsed: txData.gasUsed,
        effectiveGasPrice: txData.effectiveGasPrice,
        gasCost: txData.gasCost || null,

        status: txData.status,
        type: txData.type || 'sent',

        blockNumber: txData.blockNumber,
        blockHash: txData.blockHash,
        confirmations: txData.confirmations || 1,
        network: txData.network || 'sepolia',

        token: txData.token || 'ETH',
        tokenAddress: txData.tokenAddress || null,

        timestamp: txData.timestamp || Math.floor(Date.now() / 1000),
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const result = await this.collection.insertOne(transaction);

      logger.info('Transaction logged', {
        txId: result.insertedId,
        hash: txData.hash,
        userId,
        type: txData.type
      });

      return {
        ...transaction,
        _id: result.insertedId
      };
    } catch (error) {
      if (error.code === 11000) {
        logger.warn('Transaction already logged for this user:', {
          hash: txData.hash,
          userId,
          type: txData.type
        });
        return null;
      }

      logger.error('Failed to log transaction:', error);
      throw error;
    }
  }

  /**
   * Log transaction for BOTH sender and recipient with case-insensitive recipient lookup
   */
  async logTransactionForBoth(senderUserId, senderWallet, recipientWallet, txData, network) {
    try {
      const results = { sender: null, recipient: null };

      
      results.sender = await this.logTransaction(
        senderUserId,
        senderWallet,
        {
          ...txData,
          network,
          type: 'sent',
          from: senderWallet,
          to: recipientWallet
        }
      );
      logger.info(' Transaction logged for sender:', senderUserId);

      if (!this.usersCollection) {
        await this.initialize();
      }

      // Case-insensitive find for recipient using regex
      const recipient = await this.usersCollection.findOne({
        walletAddress: { $regex: `^${recipientWallet}$`, $options: 'i' }
      });

      if (recipient) {
        logger.info(' Recipient is a user, logging received transaction');

        results.recipient = await this.logTransaction(
          recipient._id.toString(),
          recipient.walletAddress,
          {
            ...txData,
            network,
            type: 'received',
            from: senderWallet,
            to: recipientWallet
          }
        );
        logger.info(' Transaction logged for recipient:', recipient._id);
      } else {
        logger.info(' Recipient is not a user of this app');
      }

      return results;
    } catch (error) {
      logger.error('Failed to log transaction for both parties:', error);
      // Don't fail main logic if logging fails
      return { sender: null, recipient: null };
    }
  }

  /**
   * Get transaction history for user including both sent and received (default)
   */
  async getUserTransactions(userId, options = {}) {
    try {
      if (!this.collection) {
        logger.warn('Transaction collection not initialized, initializing now...');
        await this.initialize();
      }

      const {
        limit = 50,
        skip = 0,
        network = null,
        type = null,
        contactAddress = null,
        startDate = null,
        endDate = null,
        minAmount = null,
        maxAmount = null,
        status = null,
        search = null,
        sortBy = 'timestamp',
        sortOrder = 'desc'
      } = options;

      const query = { userId: new ObjectId(userId) };

     
      if (type) {
        query.type = Array.isArray(type) ? { $in: type } : type;
      } else {
        query.type = { $in: ['sent', 'received'] };
      }

      if (network) query.network = network;

      if (contactAddress)
        query.$or = [
          { to: contactAddress.toLowerCase() },
          { from: contactAddress.toLowerCase() }
        ];

      if (startDate || endDate) {
        query.timestamp = {};
        if (startDate) query.timestamp.$gte = new Date(startDate).getTime() / 1000;
        if (endDate) query.timestamp.$lte = new Date(endDate).getTime() / 1000;
      }

      if (minAmount || maxAmount) {
        query.value = {};
        if (minAmount) query.value.$gte = minAmount.toString();
        if (maxAmount) query.value.$lte = maxAmount.toString();
      }

      if (status) query.status = status;

      if (search)
        query.$or = [
          { hash: { $regex: search, $options: 'i' } },
          { to: { $regex: search, $options: 'i' } },
          { from: { $regex: search, $options: 'i' } }
        ];

      logger.info('Querying transactions with filters', {
        userId,
        type,
        network,
        limit,
        skip
      });

      const sortDirection = sortOrder === 'asc' ? 1 : -1;
      const sortOptions = {};
      sortOptions[sortBy] = sortDirection;

      const transactions = await this.collection
        .find(query)
        .sort(sortOptions)
        .limit(limit)
        .skip(skip)
        .toArray();

      const total = await this.collection.countDocuments(query);

      logger.info(`Found ${transactions.length} transactions (total: ${total})`);

      return {
        transactions,
        total,
        limit,
        skip,
        filters: options
      };
    } catch (error) {
      logger.error('Failed to get user transactions:', error);
      throw error;
    }
  }

  /**
   * Get single transaction by hash and userId
   */
  async getTransactionByHash(userId, hash) {
    try {
      return await this.collection.findOne({
        userId: new ObjectId(userId),
        hash
      });
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
      const result = await this.collection.updateMany(
        { hash },
        {
          $set: {
            ...updates,
            updatedAt: new Date()
          }
        }
      );

      logger.info(`Updated ${result.modifiedCount} transactions with hash ${hash}`);
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
            _id: '$type',
            count: { $sum: 1 },
            totalValue: {
              $sum: {
                $convert: {
                  input: '$value',
                  to: 'double',
                  onError: 0
                }
              }
            }
          }
        }
      ];

      const stats = await this.collection.aggregate(pipeline).toArray();

      const statusPipeline = [
        { $match: { userId: new ObjectId(userId) } },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ];

      const statusStats = await this.collection.aggregate(statusPipeline).toArray();

      return {
        totalTransactions: stats.reduce((sum, s) => sum + s.count, 0),
        sent: stats.find(s => s._id === 'sent')?.count || 0,
        received: stats.find(s => s._id === 'received')?.count || 0,
        swaps: stats.find(s => s._id === 'swap')?.count || 0,
        successful: statusStats.find(s => s._id === 'success')?.count || 0,
        failed: statusStats.find(s => s._id === 'failed')?.count || 0,
        pending: statusStats.find(s => s._id === 'pending')?.count || 0
      };
    } catch (error) {
      logger.error('Failed to get user stats:', error);
      throw error;
    }
  }

  /**
   * Get transactions between two addresses
   */
  async getTransactionsBetweenAddresses(address1, address2, options = {}) {
    try {
      const { limit = 20, skip = 0 } = options;

      const query = {
        $or: [
          { from: address1.toLowerCase(), to: address2.toLowerCase() },
          { from: address2.toLowerCase(), to: address1.toLowerCase() }
        ]
      };

      const transactions = await this.collection
        .find(query)
        .sort({ timestamp: -1 })
        .limit(limit)
        .skip(skip)
        .toArray();

      const total = await this.collection.countDocuments(query);

      return { transactions, total };
    } catch (error) {
      logger.error('Failed to get transactions between addresses:', error);
      throw error;
    }
  }
}

const transactionHistoryService = new TransactionHistoryService();
export default transactionHistoryService;
