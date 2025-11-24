/**
 * Contact Schema
 * Stores user's saved wallet contacts with aliases
 */

export const ContactSchema = {
  _id: 'ObjectId',
  userId: 'ObjectId',  // Owner of this contact
  
  // Contact Details
  alias: 'string',          // Custom name (e.g., "Alice", "Bob's Wallet")
  walletAddress: 'string',  // The contact's wallet address
  
  // Optional Metadata
  notes: 'string',          // Optional notes about the contact
  tags: ['string'],         // Tags like "friend", "family", "business"
  favorite: 'boolean',      // Is this a favorite contact?
  
  // Transaction Stats (calculated)
  lastTransactionDate: 'Date',
  totalSent: 'string',      // Total amount sent to this contact
  totalReceived: 'string',  // Total amount received from this contact
  transactionCount: 'number',
  
  // Timestamps
  createdAt: 'Date',
  updatedAt: 'Date'
};

// Indexes:
// - userId (for querying user's contacts)
// - walletAddress + userId (unique - can't save same address twice)
// - alias (for search)
