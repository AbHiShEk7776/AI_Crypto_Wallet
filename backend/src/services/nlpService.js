import axios from 'axios';
import { ethers } from 'ethers';
import { ERROR_MESSAGES } from '../config/constants.js';
import logger from '../utils/logger.js';

/**
 * NLP Service using Ollama (Local LLM)
 * Parses natural language commands into structured wallet actions
 * Uses Llama 3.1 running locally via Ollama
 */

class NLPService {
  constructor() {
    this.ollamaUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
    this.model = process.env.OLLAMA_MODEL || 'llama3.1:8b';
    this.timeout = parseInt(process.env.OLLAMA_TIMEOUT) || 30000;

    // System prompt defines AI behavior and available functions
    this.systemPrompt = `You are WalletGPT, a helpful and secure cryptocurrency wallet assistant.

Your job is to understand user requests about cryptocurrency operations and convert them into structured JSON function calls.

AVAILABLE FUNCTIONS:
1. check_balance - Check wallet balance
   Parameters: { address?: string, token?: string }
   
2. send_crypto - Send cryptocurrency to an address
   Parameters: { token: string, amount: string, recipient: string }
   
3. swap_tokens - Swap one token for another
   Parameters: { from_token: string, to_token: string, amount: string, slippage?: number }
   
4. explain_transaction - Explain what a transaction does
   Parameters: { tx_hash: string }
   
5. get_market_forecast - Get price forecast for a token
   Parameters: { token: string, horizon?: string }

SECURITY RULES:
- ALWAYS validate Ethereum addresses (must start with 0x and be 42 characters)
- REJECT any request that seems suspicious or unclear
- NEVER execute transactions without explicit user confirmation
- Ask for clarification if amount or recipient is ambiguous

RESPONSE FORMAT:
Always respond with valid JSON in this exact format:
{
  "function": "function_name",
  "parameters": { ...params },
  "explanation": "Brief explanation of what you'll do",
  "confidence": 0.95,
  "requires_confirmation": true
}

For conversational messages (greetings, questions, etc.), respond with:
{
  "function": "conversation",
  "response": "Your friendly response here",
  "confidence": 0.9
}

EXAMPLES:
User: "What's my balance?"
Response: {"function": "check_balance", "parameters": {}, "explanation": "Check your wallet balance", "confidence": 0.95, "requires_confirmation": false}

User: "Send 0.1 ETH to 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"
Response: {"function": "send_crypto", "parameters": {"token": "ETH", "amount": "0.1", "recipient": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"}, "explanation": "Send 0.1 ETH to 0x742d...bEb", "confidence": 0.95, "requires_confirmation": true}

User: "Swap 100 USDC to DAI"
Response: {"function": "swap_tokens", "parameters": {"from_token": "USDC", "to_token": "DAI", "amount": "100"}, "explanation": "Swap 100 USDC for DAI", "confidence": 0.9, "requires_confirmation": true}

Be helpful, secure, and always prioritize user safety.`;
  }

  /**
   * Parse user message using Ollama LLM
   * @param {string} userMessage - User's natural language input
   * @param {Array} conversationHistory - Previous messages for context
   * @returns {Object} Parsed intent and parameters
   */
  async parseIntent(userMessage, conversationHistory = []) {
    try {
      logger.info('Parsing intent with Ollama', {
        message: userMessage.substring(0, 50),
        historyLength: conversationHistory.length
      });

      // Build conversation context
      const messages = [
        { role: 'system', content: this.systemPrompt }
      ];

      // Add recent conversation history (last 4 messages for context)
      const recentHistory = conversationHistory.slice(-4);
      messages.push(...recentHistory);

      // Add current user message
      messages.push({ role: 'user', content: userMessage });

      // Call Ollama API
      const response = await axios.post(
        `${this.ollamaUrl}/api/chat`,
        {
          model: this.model,
          messages: messages,
          stream: false,
          format: 'json', // Force JSON output
          options: {
            temperature: 0.1, // Low temperature for consistent output
            top_p: 0.9,
            num_predict: 500 // Max tokens to generate
          }
        },
        {
          timeout: this.timeout,
          headers: { 'Content-Type': 'application/json' }
        }
      );

      const assistantMessage = response.data.message.content;

      logger.info('Ollama response received', {
        responseLength: assistantMessage.length
      });

      // Parse JSON response
      let parsedResponse;
      try {
        parsedResponse = JSON.parse(assistantMessage);
      } catch (parseError) {
        logger.warn('Failed to parse JSON from Ollama, using fallback', {
          response: assistantMessage.substring(0, 100)
        });
        // Fallback to keyword-based parsing
        return this.fallbackParsing(userMessage);
      }

      // Handle conversation response
      if (parsedResponse.function === 'conversation') {
        return {
          success: true,
          intent: 'conversation',
          response: parsedResponse.response,
          confidence: parsedResponse.confidence || 0.8
        };
      }

      // Map function name to intent
      const functionMap = {
        'check_balance': 'check_balance',
        'send_crypto': 'send_crypto',
        'swap_tokens': 'swap_tokens',
        'explain_transaction': 'explain_transaction',
        'get_market_forecast': 'get_market_forecast'
      };

      const intent = functionMap[parsedResponse.function];

      if (!intent) {
        return {
          success: false,
          error: 'I didn\'t understand that command. Can you rephrase?',
          needsClarification: true
        };
      }

      // Validate parameters
      const validation = this.validateParameters(intent, parsedResponse.parameters);
      if (!validation.valid) {
        return {
          success: false,
          error: validation.error,
          needsClarification: true
        };
      }

      logger.info('Intent parsed successfully', {
        intent,
        confidence: parsedResponse.confidence
      });

      return {
        success: true,
        intent: intent,
        parameters: parsedResponse.parameters,
        confidence: parsedResponse.confidence || 0.9,
        explanation: parsedResponse.explanation || this.explainIntent(intent, parsedResponse.parameters),
        requiresConfirmation: parsedResponse.requires_confirmation !== false
      };

    } catch (error) {
      logger.error('Ollama parsing failed', {
        error: error.message,
        code: error.code
      });

      // Check if Ollama is offline
      if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
        return {
          success: false,
          error: ERROR_MESSAGES.OLLAMA_OFFLINE,
          needsClarification: false
        };
      }

      // Fallback to simple keyword matching
      return this.fallbackParsing(userMessage);
    }
  }

  /**
   * Fallback parsing using keyword matching (when Ollama fails)
   * @param {string} message - User message
   * @returns {Object} Parsed intent
   */
  fallbackParsing(message) {
    const lowerMsg = message.toLowerCase();

    logger.info('Using fallback parsing');

    // Check balance
    if (lowerMsg.includes('balance') || lowerMsg.includes('how much')) {
      return {
        success: true,
        intent: 'check_balance',
        parameters: {},
        confidence: 0.7,
        explanation: 'Check your wallet balance',
        requiresConfirmation: false
      };
    }

    // Send crypto
    if (lowerMsg.includes('send') || lowerMsg.includes('transfer')) {
      const amountMatch = message.match(/(\d+\.?\d*)\s*(eth|usdc|dai)/i);
      const addressMatch = message.match(/0x[a-fA-F0-9]{40}/);

      if (amountMatch && addressMatch) {
        return {
          success: true,
          intent: 'send_crypto',
          parameters: {
            token: amountMatch[2].toUpperCase(),
            amount: amountMatch[1],
            recipient: addressMatch[0]
          },
          confidence: 0.75,
          explanation: `Send ${amountMatch[1]} ${amountMatch[2]} to ${addressMatch[0].substring(0, 10)}...`,
          requiresConfirmation: true
        };
      }

      return {
        success: false,
        error: 'Please specify amount and recipient address. Example: "Send 0.1 ETH to 0x..."',
        needsClarification: true
      };
    }

    // Swap
    if (lowerMsg.includes('swap') || lowerMsg.includes('exchange')) {
      const swapMatch = message.match(/(\d+\.?\d*)\s*(\w+)\s+(?:to|for)\s+(\w+)/i);
      if (swapMatch) {
        return {
          success: true,
          intent: 'swap_tokens',
          parameters: {
            from_token: swapMatch[2].toUpperCase(),
            to_token: swapMatch[3].toUpperCase(),
            amount: swapMatch[1]
          },
          confidence: 0.7,
          explanation: `Swap ${swapMatch[1]} ${swapMatch[2]} for ${swapMatch[3]}`,
          requiresConfirmation: true
        };
      }

      return {
        success: false,
        error: 'Please specify tokens to swap. Example: "Swap 100 USDC to DAI"',
        needsClarification: true
      };
    }

    // Default: conversation
    return {
      success: true,
      intent: 'conversation',
      response: "I'm sorry, I didn't quite understand that. I can help you:\n• Check your balance\n• Send crypto\n• Swap tokens\n\nWhat would you like to do?",
      confidence: 0.6
    };
  }

  /**
   * Validate extracted parameters
   * @param {string} intent - Function name
   * @param {Object} params - Parameters object
   * @returns {Object} Validation result
   */
  validateParameters(intent, params) {
    try {
      switch (intent) {
        case 'send_crypto':
          if (!params.recipient) {
            return { valid: false, error: 'Recipient address is required' };
          }
          if (!ethers.isAddress(params.recipient)) {
            return { valid: false, error: ERROR_MESSAGES.INVALID_ADDRESS };
          }
          if (!params.amount || isNaN(parseFloat(params.amount)) || parseFloat(params.amount) <= 0) {
            return { valid: false, error: ERROR_MESSAGES.INVALID_AMOUNT };
          }
          if (!params.token) {
            return { valid: false, error: 'Token type is required (e.g., ETH, USDC)' };
          }
          break;

        case 'check_balance':
          if (params.address && !ethers.isAddress(params.address)) {
            return { valid: false, error: ERROR_MESSAGES.INVALID_ADDRESS };
          }
          break;

        case 'swap_tokens':
          if (!params.from_token || !params.to_token) {
            return { valid: false, error: 'Both source and destination tokens are required' };
          }
          if (!params.amount || isNaN(parseFloat(params.amount)) || parseFloat(params.amount) <= 0) {
            return { valid: false, error: ERROR_MESSAGES.INVALID_AMOUNT };
          }
          if (params.slippage && (params.slippage < 0 || params.slippage > 50)) {
            return { valid: false, error: 'Slippage must be between 0-50%' };
          }
          break;

        case 'explain_transaction':
          if (!params.tx_hash || !params.tx_hash.startsWith('0x') || params.tx_hash.length !== 66) {
            return { valid: false, error: 'Invalid transaction hash format' };
          }
          break;
      }

      return { valid: true };
    } catch (error) {
      return { valid: false, error: 'Parameter validation failed' };
    }
  }

  /**
   * Generate human-readable explanation of intent
   * @param {string} intent - Function name
   * @param {Object} params - Parameters
   * @returns {string} Explanation text
   */
  explainIntent(intent, params) {
    switch (intent) {
      case 'send_crypto':
        return `Send ${params.amount} ${params.token} to ${params.recipient.slice(0, 6)}...${params.recipient.slice(-4)}`;
      case 'check_balance':
        return `Check ${params.token || 'ETH'} balance${params.address ? ' for ' + params.address.slice(0, 6) + '...' : ''}`;
      case 'swap_tokens':
        return `Swap ${params.amount} ${params.from_token} to ${params.to_token}${params.slippage ? ` with ${params.slippage}% slippage` : ''}`;
      case 'explain_transaction':
        return `Explain transaction ${params.tx_hash.slice(0, 10)}...`;
      case 'get_market_forecast':
        return `Get price forecast for ${params.token}`;
      default:
        return 'Process your request';
    }
  }

  /**
   * Check if Ollama is running and model is available
   * @returns {Object} Health status
   */
  async checkOllamaHealth() {
    try {
      const response = await axios.get(`${this.ollamaUrl}/api/tags`, {
        timeout: 5000
      });

      const models = response.data.models || [];
      const hasModel = models.some(m => m.name === this.model);

      return {
        running: true,
        modelAvailable: hasModel,
        availableModels: models.map(m => m.name),
        model: this.model
      };
    } catch (error) {
      return {
        running: false,
        error: 'Ollama server not running. Please start it with: ollama serve',
        expectedModel: this.model
      };
    }
  }
}

export default new NLPService();
