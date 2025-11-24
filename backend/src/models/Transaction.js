import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  hash: {
    type: String,
    required: true,
    index: true
  },
  from: {
    type: String,
    required: true,
    lowercase: true
  },
  to: {
    type: String,
    required: true,
    lowercase: true
  },
  value: {
    type: String,
    required: true
  },
  valueWei: String,
  type: {
    type: String,
    enum: ['sent', 'received', 'swap'],
    required: true,
    index: true
  },
  status: {
    type: String,
    enum: ['pending', 'success', 'failed'],
    default: 'pending',
    index: true
  },
  network: {
    type: String,
    required: true,
    index: true
  },
  token: {
    type: String,
    default: 'ETH'
  },
  gasUsed: String,
  gasPrice: String,
  blockNumber: Number,
  blockHash: String,
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },
  
  // For swaps
  fromToken: String,
  toToken: String,
  amountIn: String,
  amountOut: String
}, {
  timestamps: true
});

// Compound indexes for efficient queries
transactionSchema.index({ userId: 1, timestamp: -1 });
transactionSchema.index({ userId: 1, type: 1 });
transactionSchema.index({ hash: 1 });

export default mongoose.model('Transaction', transactionSchema);
