import express from 'express';
import Groq from 'groq-sdk';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { generalLimiter } from '../middleware/rateLimiter.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = express.Router();

// Initialize Groq client
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

const MODEL_NAME = process.env.GROQ_MODEL || 'llama-3.1-8b-instant';

// Health check endpoint
router.get(
  '/health',
  generalLimiter,
  asyncHandler(async (req, res) => {
    try {
      const hasApiKey = !!process.env.GROQ_API_KEY;
      
      res.json({
        success: true,
        running: true,
        modelAvailable: hasApiKey,
        service: 'Groq',
        model: MODEL_NAME
      });
    } catch (error) {
      res.json({
        success: true,
        running: false,
        modelAvailable: false,
        error: 'Groq API key not configured'
      });
    }
  })
);

// Chat endpoint with Groq
router.post(
  '/chat',
  authMiddleware,
  generalLimiter,
  asyncHandler(async (req, res) => {
    const { message, conversationHistory = [] } = req.body;
    
    console.log('💬 NLP Chat request:', message.substring(0, 50) + '...');
    
    // Enhanced system prompt for action initiation
    const systemPrompt = `You are an intelligent crypto wallet assistant that helps users perform blockchain operations.

USER CONTEXT:
- Wallet Network: ${req.user?.network || 'sepolia'}
- User ID: ${req.user?.id}

YOUR CAPABILITIES:
You can help users with these ACTIONS:

1. CHECK_BALANCE - Check wallet balance
   Examples: "What's my balance?" "How much ETH do I have?" "Check my wallet"

2. SEND_CRYPTO - Send cryptocurrency to an address
   Examples: "Send 0.1 ETH to 0x123..." "Transfer 5 USDC to Alice"
   Required: recipient address, amount, token

3. SWAP_TOKENS - Swap one token for another
   Examples: "Swap 1 ETH for USDC" "Exchange 100 USDC to DAI"
   Required: fromToken, toToken, amount

4. TRANSACTION_HISTORY - View past transactions
   Examples: "Show my transactions" "Transaction history" "Recent activity"

5. VIEW_CONTACTS - Show saved contacts
   Examples: "Show my contacts" "List saved addresses" "My address book"

6. EXPLAIN - Explain blockchain concepts
   Examples: "What is gas?" "Explain smart contracts" "What is DeFi?"

RESPONSE FORMAT:
When user wants to perform an action, respond EXACTLY in this format:

INTENT: <action_name>
PARAMETERS: {"param1": "value1", "param2": "value2"}
EXPLANATION: <brief friendly explanation>

When user asks a general question, just respond conversationally.

IMPORTANT RULES:
- Always extract Ethereum addresses (0x followed by 40 hex characters)
- Always extract amounts with token symbols (ETH, USDC, DAI, etc.)
- Be concise (under 80 words)
- Confirm the action before execution
- If required parameters are missing, ask for them
- Use lowercase for intent names
- Use proper JSON format for parameters

EXAMPLE RESPONSES:

User: "Send 0.5 ETH to 0xABC123def456..."
Assistant:
INTENT: send_crypto
PARAMETERS: {"recipient": "0xABC123def456...", "amount": "0.5", "token": "ETH"}
EXPLANATION: I'll help you send 0.5 ETH to that address. Please confirm this transaction in the next step.

User: "What's my balance?"
Assistant:
INTENT: check_balance
PARAMETERS: {}
EXPLANATION: Let me check your wallet balance for you.

User: "Swap 2 ETH for USDC"
Assistant:
INTENT: swap_tokens
PARAMETERS: {"fromToken": "ETH", "toToken": "USDC", "amount": "2"}
EXPLANATION: I'll help you swap 2 ETH for USDC. Let me get you the best exchange rate.

User: "Show my recent transactions"
Assistant:
INTENT: transaction_history
PARAMETERS: {}
EXPLANATION: Here's your recent transaction history.

User: "What is gas fee?"
Assistant: Gas fees are the transaction costs paid to blockchain miners for processing your transactions. Think of it like a service fee that varies based on network congestion.`;

    // Build messages array
    const messages = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory.slice(-5).map(msg => ({
        role: msg.role,
        content: msg.content
      })),
      { role: 'user', content: message }
    ];

    try {
      console.log('🤖 Calling Groq API with', MODEL_NAME);
      const startTime = Date.now();
      
      // Call Groq API
      const completion = await groq.chat.completions.create({
        messages: messages,
        model: MODEL_NAME,
        temperature: 0.7,
        max_tokens: 250,
        top_p: 0.9,
        stream: false
      });

      const duration = Date.now() - startTime;
      console.log(`✅ Groq response received in ${duration}ms`);

      const aiResponse = completion.choices[0].message.content;
      console.log('🤖 AI Response:', aiResponse.substring(0, 100) + '...');

      // Parse intent if present
      const intentMatch = aiResponse.match(/INTENT:\s*(\w+)/i);
      const paramsMatch = aiResponse.match(/PARAMETERS:\s*(\{[^}]+\})/i);
      const explanationMatch = aiResponse.match(/EXPLANATION:\s*(.+?)(?=\n\n|INTENT:|$)/is);

      let intent = null;
      let parameters = {};
      let explanation = aiResponse;

      if (intentMatch) {
        intent = intentMatch[1].toLowerCase();
        console.log('🎯 Detected intent:', intent);
        
        if (paramsMatch) {
          try {
            parameters = JSON.parse(paramsMatch[1]);
            console.log('📋 Extracted parameters:', parameters);
          } catch (e) {
            console.log('⚠️ Failed to parse parameters:', e.message);
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
        processingTime: duration,
        model: MODEL_NAME
      });

    } catch (error) {
      console.error('❌ Groq API error:', error.message);
      
      if (error.status === 401) {
        return res.status(500).json({
          success: false,
          error: 'Invalid Groq API key. Please check your configuration.'
        });
      }
      
      if (error.status === 429) {
        return res.status(429).json({
          success: false,
          error: 'Rate limit exceeded. Please try again in a moment.'
        });
      }

      if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
        return res.status(503).json({
          success: false,
          error: 'Unable to reach AI service. Please check your internet connection.'
        });
      }
      
      res.status(500).json({
        success: false,
        error: 'AI service temporarily unavailable. Please try again.'
      });
    }
  })
);

// Fallback regex-based intent extraction (no AI needed)
router.post(
  '/extract-intent',
  authMiddleware,
  generalLimiter,
  asyncHandler(async (req, res) => {
    const { message } = req.body;
    
    console.log('🔍 Regex intent extraction for:', message);
    
    const intents = {
      check_balance: /balance|how much|funds|wallet balance|my balance/i,
      send_crypto: /send|transfer|pay/i,
      swap_tokens: /swap|exchange|trade/i,
      transaction_history: /history|transactions|past|recent|activity/i,
      view_contacts: /contacts|address book|saved addresses/i,
      explain: /what is|explain|tell me about|how does|define/i
    };

    let detectedIntent = null;
    for (const [intent, pattern] of Object.entries(intents)) {
      if (pattern.test(message)) {
        detectedIntent = intent;
        break;
      }
    }

    const parameters = {};
    
    // Extract Ethereum address
    const addressMatch = message.match(/0x[a-fA-F0-9]{40}/);
    if (addressMatch) {
      parameters.recipient = addressMatch[0];
    }

    // Extract amount and token
    const amountMatch = message.match(/(\d+\.?\d*)\s*(ETH|USDC|DAI|MATIC|BNB)/i);
    if (amountMatch) {
      parameters.amount = amountMatch[1];
      parameters.token = amountMatch[2].toUpperCase();
    }

    // Extract swap tokens
    const swapMatch = message.match(/(ETH|USDC|DAI|MATIC)\s+(?:for|to)\s+(ETH|USDC|DAI|MATIC)/i);
    if (swapMatch) {
      parameters.fromToken = swapMatch[1].toUpperCase();
      parameters.toToken = swapMatch[2].toUpperCase();
    }

    console.log('🎯 Regex detected:', { intent: detectedIntent, parameters });

    res.json({
      success: true,
      intent: detectedIntent,
      parameters: parameters,
      method: 'regex'
    });
  })
);

export default router;
