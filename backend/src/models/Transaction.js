/**
 * Transaction Schema
 * Stores all user transaction history
 */

export const TransactionSchema = {
  _id: 'ObjectId',
  userId: 'ObjectId',  // Reference to users collection
  walletAddress: 'string',
  
  // Transaction Details
  hash: 'string',
  from: 'string',
  to: 'string',
  value: 'string',
  valueWei: 'string',
  
  // Gas & Fees
  gasUsed: 'string',
  effectiveGasPrice: 'string',
  gasCost: 'string',
  
  // Status
  status: 'string',  // 'success', 'failed', 'pending'
  type: 'string',    // 'sent', 'received', 'swap', 'contract'
  
  // Blockchain Data
  blockNumber: 'number',
  blockHash: 'string',
  confirmations: 'number',
  network: 'string',  // 'sepolia', 'ethereum', etc.
  
  // Token (if applicable)
  token: 'string',    // 'ETH', 'DAI', etc.
  tokenAddress: 'string',
  
  // Metadata
  timestamp: 'number',
  createdAt: 'Date',
  updatedAt: 'Date'
};

// Indexes needed:
// - userId (for querying user's transactions)
// - walletAddress (for querying wallet transactions)
// - hash (for lookups)
// - timestamp (for sorting)
// - network (for filtering)
