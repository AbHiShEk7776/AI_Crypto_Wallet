import express from 'express';
import contactController from '../controllers/contactController.js';
import { contactValidation } from '../middleware/validator.js';
import { generalLimiter } from '../middleware/rateLimiter.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = express.Router();

// All contact routes require authentication
router.use(authMiddleware);

// Add new contact
router.post(
  '/',
  generalLimiter,
  contactValidation.add,
  asyncHandler(contactController.addContact)
);

// Get all contacts
router.get(
  '/',
  generalLimiter,
  asyncHandler(contactController.getContacts)
);

// Get contact by ID
router.get(
  '/:id',
  generalLimiter,
  asyncHandler(contactController.getContactById)
);

// Update contact
router.put(
  '/:id',
  generalLimiter,
  contactValidation.update,
  asyncHandler(contactController.updateContact)
);

// Delete contact
router.delete(
  '/:id',
  generalLimiter,
  asyncHandler(contactController.deleteContact)
);

// Get transactions with a contact
router.get(
  '/:id/transactions',
  generalLimiter,
  asyncHandler(contactController.getContactTransactions)
);

export default router;
