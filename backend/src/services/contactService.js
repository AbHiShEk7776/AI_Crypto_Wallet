import database from '../config/database.js';
import logger from '../utils/logger.js';
import { ObjectId } from 'mongodb';

/**
 * Contact Service
 * Manages user contacts and wallet address aliases
 */

class ContactService {
  constructor() {
    this.db = null;
    this.collection = null;
  }

  async initialize() {
    try {
      this.db = database.getDb();
      
      if (!this.db) {
        throw new Error('Database not connected');
      }
      
      this.collection = this.db.collection('contacts');
      
      // Create indexes
      await this.createIndexes();
      
      logger.info('✅ Contact service initialized');
    } catch (error) {
      logger.error('❌ Failed to initialize contact service:', error);
      throw error;
    }
  }

  async createIndexes() {
    try {
      await this.collection.createIndex({ userId: 1 });
      await this.collection.createIndex({ userId: 1, walletAddress: 1 }, { unique: true });
      await this.collection.createIndex({ alias: 1 });
      await this.collection.createIndex({ favorite: 1 });
      await this.collection.createIndex({ createdAt: -1 });
      
      logger.info('Contact indexes created');
    } catch (error) {
      logger.warn('Contact index creation warning:', error.message);
    }
  }

  /**
   * Add a new contact
   */
  async addContact(userId, contactData) {
    try {
      // Validate wallet address format
      if (!contactData.walletAddress || !contactData.walletAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
        throw new Error('Invalid wallet address format');
      }

      const contact = {
        userId: new ObjectId(userId),
        alias: contactData.alias,
        walletAddress: contactData.walletAddress.toLowerCase(),
        notes: contactData.notes || '',
        tags: contactData.tags || [],
        favorite: contactData.favorite || false,
        
        // Stats (initialize to zero)
        lastTransactionDate: null,
        totalSent: '0',
        totalReceived: '0',
        transactionCount: 0,
        
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const result = await this.collection.insertOne(contact);
      
      logger.info('Contact added', {
        contactId: result.insertedId,
        userId,
        alias: contactData.alias
      });

      return {
        ...contact,
        _id: result.insertedId
      };
    } catch (error) {
      if (error.code === 11000) {
        throw new Error('Contact already exists with this wallet address');
      }
      logger.error('Failed to add contact:', error);
      throw error;
    }
  }

  /**
   * Get all contacts for a user
   */
  async getUserContacts(userId, options = {}) {
    try {
      if (!this.collection) {
        await this.initialize();
      }

      const {
        search = null,
        favorite = null,
        tags = null
      } = options;

      const query = { userId: new ObjectId(userId) };
      
      // Search by alias or address
      if (search) {
        query.$or = [
          { alias: { $regex: search, $options: 'i' } },
          { walletAddress: { $regex: search, $options: 'i' } }
        ];
      }
      
      // Filter favorites
      if (favorite !== null) {
        query.favorite = favorite;
      }
      
      // Filter by tags
      if (tags && tags.length > 0) {
        query.tags = { $in: tags };
      }

      const contacts = await this.collection
        .find(query)
        .sort({ favorite: -1, alias: 1 })
        .toArray();

      return contacts;
    } catch (error) {
      logger.error('Failed to get user contacts:', error);
      throw error;
    }
  }

  /**
   * Get contact by wallet address
   */
  async getContactByAddress(userId, walletAddress) {
    try {
      return await this.collection.findOne({
        userId: new ObjectId(userId),
        walletAddress: walletAddress.toLowerCase()
      });
    } catch (error) {
      logger.error('Failed to get contact:', error);
      throw error;
    }
  }

  /**
   * Get contact by alias
   */
  async getContactByAlias(userId, alias) {
    try {
      return await this.collection.findOne({
        userId: new ObjectId(userId),
        alias: { $regex: `^${alias}$`, $options: 'i' }
      });
    } catch (error) {
      logger.error('Failed to get contact by alias:', error);
      throw error;
    }
  }

  /**
   * Update contact
   */
  async updateContact(userId, contactId, updates) {
    try {
      const allowedUpdates = ['alias', 'notes', 'tags', 'favorite'];
      const filteredUpdates = {};
      
      Object.keys(updates).forEach(key => {
        if (allowedUpdates.includes(key)) {
          filteredUpdates[key] = updates[key];
        }
      });

      filteredUpdates.updatedAt = new Date();

      const result = await this.collection.updateOne(
        {
          _id: new ObjectId(contactId),
          userId: new ObjectId(userId)
        },
        { $set: filteredUpdates }
      );

      return result.modifiedCount > 0;
    } catch (error) {
      logger.error('Failed to update contact:', error);
      throw error;
    }
  }

  /**
   * Delete contact
   */
  async deleteContact(userId, contactId) {
    try {
      const result = await this.collection.deleteOne({
        _id: new ObjectId(contactId),
        userId: new ObjectId(userId)
      });

      return result.deletedCount > 0;
    } catch (error) {
      logger.error('Failed to delete contact:', error);
      throw error;
    }
  }

  /**
   * Update transaction stats for a contact
   */
  async updateContactStats(userId, walletAddress, txData) {
    try {
      const contact = await this.getContactByAddress(userId, walletAddress);
      
      if (!contact) {
        return; // Not a saved contact, skip
      }

      const isSent = txData.type === 'sent';
      const amount = parseFloat(txData.value) || 0;

      await this.collection.updateOne(
        { _id: contact._id },
        {
          $set: {
            lastTransactionDate: new Date(txData.timestamp * 1000),
            updatedAt: new Date()
          },
          $inc: {
            transactionCount: 1,
            [isSent ? 'totalSent' : 'totalReceived']: amount
          }
        }
      );

      logger.info('Contact stats updated', {
        contactId: contact._id,
        alias: contact.alias
      });
    } catch (error) {
      logger.error('Failed to update contact stats:', error);
      // Don't throw - this is non-critical
    }
  }

  /**
   * Get transactions with a specific contact
   */
  async getContactTransactions(userId, contactId, limit = 20) {
    try {
      const contact = await this.collection.findOne({
        _id: new ObjectId(contactId),
        userId: new ObjectId(userId)
      });

      if (!contact) {
        throw new Error('Contact not found');
      }

      // Get transactions from transaction history service
      const transactionsDb = this.db.collection('transactions');
      
      const transactions = await transactionsDb
        .find({
          userId: new ObjectId(userId),
          $or: [
            { to: contact.walletAddress },
            { from: contact.walletAddress }
          ]
        })
        .sort({ timestamp: -1 })
        .limit(limit)
        .toArray();

      return {
        contact,
        transactions
      };
    } catch (error) {
      logger.error('Failed to get contact transactions:', error);
      throw error;
    }
  }
}

const contactService = new ContactService();
export default contactService;
