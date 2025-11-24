import express from 'express';
import axios from 'axios';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { generalLimiter } from '../middleware/rateLimiter.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = express.Router();

// Ollama configuration
const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
const MODEL_NAME = process.env.OLLAMA_MODEL || 'llama3.2:latest';

// Health check endpoint (no auth required)
router.get(
  '/health',
  generalLimiter,
  asyncHandler(async (req, res) => {
    try {
      const response = await axios.get(`${OLLAMA_URL}/api/tags`);
      const models = response.data.models || [];
      const modelAvailable = models.some(m => m.name.includes('llama'));
      
      res.json({
        success: true,
        running: true,
        modelAvailable,
        models: models.map(m => m.name)
      });
    } catch (error) {
      res.json({
        success: true,
        running: false,
        modelAvailable: false,
        error: 'Ollama not running'
      });
    }
  })
);

// Chat endpoint with intent extraction (protected)
router.post(
  '/chat',
  authMiddleware,
  generalLimiter,
  asyncHandler(async (req, res) => {
    const { message, conversationHistory = [] } = req.body;
    
    console.log('💬 NLP Chat request:', message);
    
    // Build context-aware prompt
    const systemPrompt = `You are a helpful cryptocurrency wallet assistant. You help users with:
- Checking their wallet balance
- Sending crypto transactions
- Swapping tokens
- Explaining blockchain concepts
- Providing transaction history

IMPORTANT: Detect the user's intent and respond accordingly. For actionable requests (send, swap, check balance), extract parameters.

User wallet context:
- Network: ${req.user?.network || 'sepolia'}
- Has active wallet: true

Response format:
If the user wants to perform an action, include:
INTENT: <action_name>
PARAMETERS: <json_object>
EXPLANATION: <friendly explanation>

Otherwise just provide a helpful conversational response.`;

    // Prepare messages for Ollama
    const messages = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory.map(msg => ({
        role: msg.role,
        content: msg.content
      })),
      { role: 'user', content: message }
    ];

    try {
      // Call Ollama API
      const ollamaResponse = await axios.post(
        `${OLLAMA_URL}/api/chat`,
        {
          model: MODEL_NAME,
          messages: messages,
          stream: false,
          options: {
            temperature: 0.7,
            top_p: 0.9
          }
        },
        { timeout: 30000 }
      );

      const aiResponse = ollamaResponse.data.message.content;
      console.log('🤖 AI Response:', aiResponse);

      // Parse intent if present
      const intentMatch = aiResponse.match(/INTENT:\s*(\w+)/);
      const paramsMatch = aiResponse.match(/PARAMETERS:\s*(\{[^}]+\})/);
      const explanationMatch = aiResponse.match(/EXPLANATION:\s*(.+?)(?=\n\n|$)/s);

      let intent = null;
      let parameters = {};
      let explanation = aiResponse;

      if (intentMatch) {
        intent = intentMatch[1];
        
        if (paramsMatch) {
          try {
            parameters = JSON.parse(paramsMatch[1]);
          } catch (e) {
            console.log('Failed to parse parameters:', e);
          }
        }
        
        if (explanationMatch) {
          explanation = explanationMatch[1].trim();
        }
      }

      res.json({
        success: true,
        response: explanation,
        intent: intent,
        parameters: parameters,
        raw: aiResponse
      });

    } catch (error) {
      console.error('❌ NLP Chat error:', error.message);
      
      if (error.code === 'ECONNREFUSED') {
        return res.status(503).json({
          success: false,
          error: 'Ollama is not running. Please start it with: ollama serve'
        });
      }
      
      throw error; // Let asyncHandler catch it
    }
  })
);

// Extract intent from user message (fallback) - protected
router.post(
  '/extract-intent',
  authMiddleware,
  generalLimiter,
  asyncHandler(async (req, res) => {
    const { message } = req.body;
    
    // Simple regex-based intent detection as fallback
    const intents = {
      check_balance: /balance|how much|funds|wallet/i,
      send_crypto: /send|transfer|pay/i,
      swap_tokens: /swap|exchange|trade/i,
      transaction_history: /history|transactions|past/i,
      explain: /what is|explain|tell me about/i
    };

    let detectedIntent = null;
    for (const [intent, pattern] of Object.entries(intents)) {
      if (pattern.test(message)) {
        detectedIntent = intent;
        break;
      }
    }

    // Extract parameters
    const parameters = {};
    
    // Extract Ethereum address
    const addressMatch = message.match(/0x[a-fA-F0-9]{40}/);
    if (addressMatch) {
      parameters.recipient = addressMatch[0];
    }

    // Extract amount
    const amountMatch = message.match(/(\d+\.?\d*)\s*(ETH|USDC|DAI)/i);
    if (amountMatch) {
      parameters.amount = amountMatch[1];
      parameters.token = amountMatch[2].toUpperCase();
    }

    res.json({
      success: true,
      intent: detectedIntent,
      parameters: parameters
    });
  })
);

export default router;
