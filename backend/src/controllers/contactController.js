import contactService from '../services/contactService.js';
import logger from '../utils/logger.js';
import { RESPONSE_CODES } from '../config/constants.js';

/**
 * Contact Controller
 * Handles HTTP requests for contact management
 */

class ContactController {
  /**
   * Add new contact
   * POST /api/contacts
   */
  async addContact(req, res, next) {
    try {
      const userId = req.user.id;
      const { alias, walletAddress, notes, tags, favorite } = req.body;

      logger.info('Add contact request', { userId, alias, walletAddress });

      const contact = await contactService.addContact(userId, {
        alias,
        walletAddress,
        notes,
        tags,
        favorite
      });

      res.status(RESPONSE_CODES.CREATED).json({
        success: true,
        contact
      });
    } catch (error) {
      logger.error('Add contact failed:', error);
      res.status(RESPONSE_CODES.BAD_REQUEST).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Get all contacts
   * GET /api/contacts
   */
  async getContacts(req, res, next) {
    try {
      const userId = req.user.id;
      const { search, favorite, tags } = req.query;

      logger.info('Get contacts request', { userId });

      const contacts = await contactService.getUserContacts(userId, {
        search,
        favorite: favorite === 'true' ? true : null,
        tags: tags ? tags.split(',') : null
      });

      res.status(RESPONSE_CODES.SUCCESS).json({
        success: true,
        contacts
      });
    } catch (error) {
      logger.error('Get contacts failed:', error);
      next(error);
    }
  }

  /**
   * Get contact by ID
   * GET /api/contacts/:id
   */
  async getContactById(req, res, next) {
    try {
      const userId = req.user.id;
      const { id } = req.params;

      const contact = await contactService.collection.findOne({
        _id: new ObjectId(id),
        userId: new ObjectId(userId)
      });

      if (!contact) {
        return res.status(RESPONSE_CODES.NOT_FOUND).json({
          success: false,
          error: 'Contact not found'
        });
      }

      res.status(RESPONSE_CODES.SUCCESS).json({
        success: true,
        contact
      });
    } catch (error) {
      logger.error('Get contact failed:', error);
      next(error);
    }
  }

  /**
   * Update contact
   * PUT /api/contacts/:id
   */
  async updateContact(req, res, next) {
    try {
      const userId = req.user.id;
      const { id } = req.params;
      const updates = req.body;

      logger.info('Update contact request', { userId, contactId: id });

      const success = await contactService.updateContact(userId, id, updates);

      if (!success) {
        return res.status(RESPONSE_CODES.NOT_FOUND).json({
          success: false,
          error: 'Contact not found or no changes made'
        });
      }

      res.status(RESPONSE_CODES.SUCCESS).json({
        success: true,
        message: 'Contact updated successfully'
      });
    } catch (error) {
      logger.error('Update contact failed:', error);
      next(error);
    }
  }

  /**
   * Delete contact
   * DELETE /api/contacts/:id
   */
  async deleteContact(req, res, next) {
    try {
      const userId = req.user.id;
      const { id } = req.params;

      logger.info('Delete contact request', { userId, contactId: id });

      const success = await contactService.deleteContact(userId, id);

      if (!success) {
        return res.status(RESPONSE_CODES.NOT_FOUND).json({
          success: false,
          error: 'Contact not found'
        });
      }

      res.status(RESPONSE_CODES.SUCCESS).json({
        success: true,
        message: 'Contact deleted successfully'
      });
    } catch (error) {
      logger.error('Delete contact failed:', error);
      next(error);
    }
  }

  /**
   * Get transactions with a contact
   * GET /api/contacts/:id/transactions
   */
  async getContactTransactions(req, res, next) {
    try {
      const userId = req.user.id;
      const { id } = req.params;
      const { limit } = req.query;

      logger.info('Get contact transactions', { userId, contactId: id });

      const result = await contactService.getContactTransactions(
        userId,
        id,
        parseInt(limit) || 20
      );

      res.status(RESPONSE_CODES.SUCCESS).json({
        success: true,
        ...result
      });
    } catch (error) {
      logger.error('Get contact transactions failed:', error);
      next(error);
    }
  }
}

export default new ContactController();
