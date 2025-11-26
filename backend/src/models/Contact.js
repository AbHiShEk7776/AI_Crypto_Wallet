/**
 * Contact Schema
 * Stores user's saved wallet contacts with aliases
 */

export const ContactSchema = {
  _id: 'ObjectId',
  userId: 'ObjectId',  
  
  // Contact Details
  alias: 'string',          
  walletAddress: 'string',  
  
  // Optional Metadata
  notes: 'string',          
  tags: ['string'],         
  favorite: 'boolean',    
  
  // Transaction Stats (calculated)
  lastTransactionDate: 'Date',
  totalSent: 'string',      
  totalReceived: 'string',  
  transactionCount: 'number',
  
  // Timestamps
  createdAt: 'Date',
  updatedAt: 'Date'
};

// Indexes:
// - userId (for querying user's contacts)
// - walletAddress + userId (unique - can't save same address twice)
// - alias (for search)
