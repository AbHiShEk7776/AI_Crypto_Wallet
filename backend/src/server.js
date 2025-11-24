import 'dotenv/config'; 
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import fs from 'fs';
import path from 'path';

// Database and Auth
import database from './config/database.js';
import authService from './services/authService.js';
import transactionHistoryService from './services/transactionHistoryService.js';
import contactService from './services/contactService.js';

// Import routes
import authRoutes from './routes/auth.routes.js';
import walletRoutes from './routes/wallet.routes.js';
import transactionRoutes from './routes/transaction.routes.js';
import nlpRoutes from './routes/nlp.routes.js';
import dappRoutes from './routes/dapp.routes.js';
import demoRoutes from './routes/demo.routes.js';
import contactRoutes from './routes/contact.routes.js'

// Import middleware  
import { errorHandler } from './middleware/errorHandler.js';
import { generalLimiter } from './middleware/rateLimiter.js';

// Import utilities
import logger from './utils/logger.js';
import providerFactory from './utils/providerFactory.js';

/**
 * Express application setup
 * Natural Language Powered Crypto Wallet Backend
 */

const app = express();
const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || 'localhost';

// Create logs directory if it doesn't exist
const logsDir = 'logs';
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir);
}

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// CORS configuration
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use((req, res, next) => {
  // Only log API requests (skip health checks, static files, etc.)
  if (req.path.startsWith('/api/')) {
    console.log('\n╔══════════════════════════════════════════════════╗');
    console.log('║           GLOBAL REQUEST DEBUG                   ║');
    console.log('╚══════════════════════════════════════════════════╝');
    console.log('🕒 Time:', new Date().toLocaleString());
    console.log('🔧 Method:', req.method);
    console.log('📍 Full URL:', req.originalUrl);
    console.log('📍 Path:', req.path);
    console.log('📦 Body:', JSON.stringify(req.body, null, 2));
    // Only log body for POST/PUT/PATCH requests
if (req.method !== 'GET' && req.body) {
  console.log('📦 Body:', JSON.stringify(req.body, null, 2));
  console.log('📋 Body Keys:', Object.keys(req.body));
}

// Log query params for GET requests
if (req.method === 'GET' && req.query && Object.keys(req.query).length > 0) {
  console.log('❓ Query Params:', JSON.stringify(req.query, null, 2));
}

    console.log('🌐 IP:', req.ip);
    console.log('═══════════════════════════════════════════════════\n');
  }
  next();
});

// Compression middleware
app.use(compression());

// Request logging middleware
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('user-agent')
  });
  next();
});

// API routes
app.use('/api/auth', generalLimiter, authRoutes);  // Auth routes FIRST

app.use('/api/wallet', generalLimiter, walletRoutes);
app.use('/api/transaction', generalLimiter, transactionRoutes);
app.use('/api/nlp', generalLimiter, nlpRoutes);
app.use('/api/dapp', generalLimiter, dappRoutes);
app.use('/api/demo', generalLimiter, demoRoutes);
app.use('/api/contacts', generalLimiter, contactRoutes); 

// Health check endpoint
app.get('/health', (req, res) => {
  const rpcHealth = providerFactory.getHealthStatus();
  
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    rpcHealth: rpcHealth,
    database: database.db ? 'connected' : 'disconnected'
  });
});

// API documentation endpoint
app.get('/api', (req, res) => {
  res.json({
    name: 'Natural Language Crypto Wallet API',
    version: '1.0.0',
    description: 'RESTful API for conversational crypto wallet operations',
    endpoints: {
      auth: '/api/auth',
      wallet: '/api/wallet',
      transaction: '/api/transaction',
      nlp: '/api/nlp',
      dapp: '/api/dapp',
      demo: '/api/demo'
    },
    documentation: 'https://github.com/yourusername/crypto-wallet-nlp'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    path: req.path
  });
});

// Global error handler (must be last)
app.use(errorHandler);

// Initialize and start server
let server;

const startServer = async () => {
  try {
    logger.info('🔧 Starting server initialization...');
    
    // 1. Connect to MongoDB
    logger.info('📦 Connecting to MongoDB...');
    await database.connect();
    logger.info('✅ MongoDB connected successfully');
    
    // 2. Initialize auth service
    logger.info('🔐 Initializing authentication service...');
    await authService.initialize();
    logger.info('✅ Auth service initialized');
    
    // 3. Initialize transaction history service
    logger.info('📜 Initializing transaction history service...');
    await transactionHistoryService.initialize();
    logger.info('✅ Transaction history service initialized');
     logger.info('👥 Initializing contact service...');
    await contactService.initialize();
    logger.info('✅ Contact service initialized');
    
    // 4. Start Express server
    server = app.listen(PORT, HOST, () => {
      logger.info('');
      logger.info('╔════════════════════════════════════════════════╗');
      logger.info('║   🚀 Server Started Successfully!             ║');
      logger.info('╚════════════════════════════════════════════════╝');
      logger.info(`📍 URL: http://${HOST}:${PORT}`);
      logger.info(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`✅ Ready to accept connections`);
      logger.info('');
    });
    
  } catch (error) {
    logger.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};


// Graceful shutdown
const gracefulShutdown = async (signal) => {
  logger.info(`${signal} signal received: closing HTTP server`);
  
  if (server) {
    server.close(async () => {
      logger.info('HTTP server closed');
      
      // Close database connection
      try {
        await database.close();
        logger.info('Database connection closed');
      } catch (error) {
        logger.error('Error closing database:', error);
      }
      
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Uncaught exception handler
process.on('uncaughtException', (error) => {
  logger.error('❌ Uncaught Exception:', error);
  logger.error('Stack:', error.stack);
  process.exit(1);
});

// Unhandled promise rejection handler
process.on('unhandledRejection', (reason, promise) => {
  logger.error('❌ Unhandled Rejection at:', promise);
  logger.error('Reason:', reason);
  process.exit(1);
});

// Start the server
startServer();

export default app;
