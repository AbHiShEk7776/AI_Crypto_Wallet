import Groq from 'groq-sdk';
import transactionService from '../services/transactionService.js';
import transactionHistoryService from '../services/transactionHistoryService.js';
import walletService from '../services/walletService.js';
import contactService from '../services/contactService.js';
import logger from '../utils/logger.js';
import database from '../config/database.js';
import { ObjectId } from 'mongodb';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

const MODEL_NAME = process.env.GROQ_MODEL || 'llama-3.1-8b-instant';

class NLPController {
  /**
   * Main agentic chat handler - executes actions directly
   */
  async chat(req, res) {
    try {
      const { message, conversationHistory = [] } = req.body;
      const user = req.user;

      console.log('🤖 Agentic AI processing:', message);

      // Get user's contacts for reference
      const contacts = await this.getUserContactsForPrompt(user.id);

      // Enhanced system prompt for autonomous execution
      const systemPrompt = this.buildAgenticPrompt(user, contacts);

      const messages = [
        { role: 'system', content: systemPrompt },
        ...conversationHistory.slice(-5).map(msg => ({
          role: msg.role,
          content: msg.content
        })),
        { role: 'user', content: message }
      ];

      // Get AI response
      const completion = await groq.chat.completions.create({
        messages,
        model: MODEL_NAME,
        temperature: 0.7,
        max_tokens: 300,
        stream: false
      });

      const aiResponse = completion.choices[0].message.content;
      console.log('🤖 AI Response:', aiResponse);

      // Parse intent and parameters
      const intent = aiResponse.match(/INTENT:\s*(\w+)/i)?.[1]?.toLowerCase();
      const paramsMatch = aiResponse.match(/PARAMETERS:\s*(\{[^}]+\})/i)?.[1];
      let parameters = {};
      
      if (paramsMatch) {
        try {
          parameters = JSON.parse(paramsMatch);
        } catch (e) {
          console.error('Failed to parse parameters:', e);
        }
      }
      
      const explanation = aiResponse.match(/EXPLANATION:\s*(.+?)(?=\n\n|INTENT:|$)/is)?.[1]?.trim() || aiResponse;

      // Execute action autonomously based on intent
      let executionResult = null;
      
      if (intent) {
        executionResult = await this.executeAction(intent, parameters, user);
      }

      res.json({
        success: true,
        response: explanation,
        intent,
        parameters,
        executionResult,
        executed: !!executionResult
      });

    } catch (error) {
      console.error('❌ Agentic AI error:', error);
      
      res.status(500).json({
        success: false,
        error: error.message || 'AI processing failed'
      });
    }
  }

  /**
   * Get user contacts for AI prompt
   */
  async getUserContactsForPrompt(userId) {
    try {
      const db = database.getDb();
      const contactsCollection = db.collection('contacts');
      
      const contacts = await contactsCollection
        .find({ userId: new ObjectId(userId) })
        .limit(20)
        .toArray();

      return contacts.map(c => ({
        name: c.name,
        address: c.address
      }));
    } catch (error) {
      console.error('Error fetching contacts:', error);
      return [];
    }
  }

  /**
   * Build agentic system prompt
   */
  buildAgenticPrompt(user, contacts) {
    const contactsList = contacts.length > 0 
      ? contacts.map(c => `- ${c.name}: ${c.address}`).join('\n')
      : 'No saved contacts';

    return `You are an AUTONOMOUS crypto wallet AI agent. You don't just detect intent - you EXECUTE actions directly.

USER CONTEXT:
- User ID: ${user.id}
- Wallet: ${user.walletAddress}
- Network: ${user.network || 'sepolia'}

USER'S SAVED CONTACTS:
${contactsList}

YOUR CAPABILITIES AS AN AUTONOMOUS AGENT:

1. CHECK_BALANCE - Check and return wallet balance
   Example: "What's my balance?" → You fetch and return the balance
   Required: None

2. SEND_CRYPTO - Execute cryptocurrency transfer
   Example: "Send 0.1 ETH to 0x123..." → You execute the transaction
   Example: "Send 0.1 ETH to Alice password: mypass" → Resolve Alice from contacts
   Required: recipient (0x... or contact name), amount, token (default: ETH), password
   Note: User MUST provide password in message for security

3. SWAP_TOKENS - Execute token swap
   Example: "Swap 1 ETH for USDC password: mypass" → You execute the swap
   Required: fromToken, toToken, amount, password
   Note: Not implemented yet, return error

4. TRANSACTION_HISTORY - Fetch and return transaction history
   Example: "Show last 5 transactions"

   IMPORTANT:
   - You MUST NOT invent or list any transactions in EXPLANATION.
   - You MUST NOT output bullet lists, hashes, addresses, or amounts.
   - Your EXPLANATION should only say what you are doing, for example:
     "Fetching your last 5 transactions."
   - The application (backend + frontend) will build the actual list
     from real database data. You only provide:
       • INTENT
       • PARAMETERS
       • a short EXPLANATION with NO list.


5. VIEW_CONTACTS - Fetch and display saved contacts
   Example: "Show my contacts" → You fetch and list contacts

6. ADD_CONTACT - Save a new contact
   Example: "Save 0x123... as Alice" → You save the contact
   Required: address, name

7. EXPLAIN - Explain concepts (no execution)
   Example: "What is gas?" → You explain

CONTACT NAME RESOLUTION:
- If user mentions a contact name (e.g., "Send to Alice"), look it up in their contacts
- Replace contact name with actual address in parameters
- If contact not found, ask user for the address

CRITICAL SECURITY RULES:
- For SEND_CRYPTO and SWAP_TOKENS, user MUST include password in message
- If password missing, ask for it explicitly with format: "password: your_password"
- Never execute transactions without password verification
- Always confirm execution before responding

RESPONSE FORMAT:
INTENT: <action_name>
PARAMETERS: {"param1": "value1", "password": "user_password"}
EXPLANATION: I'm executing <action> now. <result or status>

EXAMPLES:

User: "What's my balance?"
INTENT: check_balance
PARAMETERS: {}
EXPLANATION: Let me check your balance now.

User: "Send 0.5 ETH to 0xABC123... password: mypass123"
INTENT: send_crypto
PARAMETERS: {"recipient": "0xABC123...", "amount": "0.5", "token": "ETH", "password": "mypass123"}
EXPLANATION: I'm sending 0.5 ETH to that address now. Transaction will be executed immediately.

User: "Send 0.1 ETH to Alice password: mypass"
INTENT: send_crypto
PARAMETERS: {"recipient": "Alice", "amount": "0.1", "token": "ETH", "password": "mypass"}
EXPLANATION: I'm sending 0.1 ETH to Alice now. Transaction will be executed immediately.

User: "Send 0.1 ETH to 0x456..."
INTENT: send_crypto
PARAMETERS: {"recipient": "0x456...", "amount": "0.1", "token": "ETH"}
EXPLANATION: To execute this transaction, please provide your wallet password. Reply with: "password: your_password"

User: "Show my last 5 transactions"
INTENT: transaction_history
PARAMETERS: {"limit": 5}
EXPLANATION: Fetching your last 5 transactions now.

User: "Show my contacts"
INTENT: view_contacts
PARAMETERS: {}
EXPLANATION: Let me show you your saved contacts.

User: "Save 0xABC123... as Bob"
INTENT: add_contact
PARAMETERS: {"address": "0xABC123...", "name": "Bob"}
EXPLANATION: I'm saving Bob to your contacts now.

Be concise, autonomous, and secure. Always execute actions when you have required parameters.`;
  }

  /**
   * Execute action autonomously
   */
  async executeAction(intent, parameters, user) {
    console.log('⚡ Executing action:', intent, parameters);

    try {
      switch (intent) {
        case 'check_balance':
          return await this.executeCheckBalance(user);

        case 'send_crypto':
          return await this.executeSendCrypto(parameters, user);

        case 'swap_tokens':
          return await this.executeSwapTokens(parameters, user);

        case 'transaction_history':
          return await this.executeGetHistory(parameters, user);

        case 'view_contacts':
          return await this.executeGetContacts(user);

        case 'add_contact':
          return await this.executeAddContact(parameters, user);

        default:
          return null;
      }
    } catch (error) {
      console.error('❌ Action execution failed:', error);
      return {
        action: intent,
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Resolve contact name to address
   */
  async resolveContactAddress(nameOrAddress, userId) {
    // If it's already an address, return it
    if (nameOrAddress.startsWith('0x') && nameOrAddress.length === 42) {
      return nameOrAddress;
    }

    // Otherwise, look up in contacts
    try {
      const db = database.getDb();
      const contactsCollection = db.collection('contacts');
      
      const contact = await contactsCollection.findOne({
        userId: new ObjectId(userId),
        name: { $regex: new RegExp(`^${nameOrAddress}$`, 'i') }
      });

      if (contact) {
        console.log(`✅ Resolved contact "${nameOrAddress}" to ${contact.address}`);
        return contact.address;
      }

      throw new Error(`Contact "${nameOrAddress}" not found. Please provide a valid address or save this contact first.`);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Execute: Check Balance
   */
  async executeCheckBalance(user) {
    try {
      const balance = await walletService.getBalance(
        user.walletAddress,
        user.network || 'sepolia'
      );

      return {
        action: 'check_balance',
        success: true,
        data: {
          balance: balance.formatted,
          value: balance.value,
          network: user.network,
          address: user.walletAddress
        },
        message: `Your balance is ${balance.formatted}`
      };
    } catch (error) {
      return {
        action: 'check_balance',
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Execute: Send Crypto
   */
  async executeSendCrypto(parameters, user) {
    let { recipient, amount, token = 'ETH', password } = parameters;

    // Validate required parameters
    if (!recipient || !amount) {
      return {
        action: 'send_crypto',
        success: false,
        error: 'Missing required parameters: recipient and amount'
      };
    }

    if (!password) {
      return {
        action: 'send_crypto',
        success: false,
        error: 'Password required for transaction. Please include: password: your_password',
        requiresPassword: true
      };
    }

    try {
      // Resolve contact name to address if needed
      recipient = await this.resolveContactAddress(recipient, user.id);

      // Get private key with password
      const privateKey = await walletService.getPrivateKey(user.id, password);

      // Execute transaction
      const result = await walletService.sendTransaction(
        privateKey,
        {
          to: recipient,
          value: amount
        },
        user.network || 'sepolia'
      );

      // Log transaction for both parties
      await transactionHistoryService.logTransactionForBoth(
        user.id,
        user.walletAddress,
        recipient,
        result,
        user.network
      );

      return {
        action: 'send_crypto',
        success: true,
        data: {
          hash: result.hash,
          from: user.walletAddress,
          to: recipient,
          amount,
          token,
          network: user.network,
          blockNumber: result.blockNumber
        },
        message: `Successfully sent ${amount} ${token} to ${recipient.substring(0, 10)}...`
      };
    } catch (error) {
      return {
        action: 'send_crypto',
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Execute: Swap Tokens
   */
  async executeSwapTokens(parameters, user) {
    const { fromToken, toToken, amount, password } = parameters;

    if (!fromToken || !toToken || !amount) {
      return {
        action: 'swap_tokens',
        success: false,
        error: 'Missing required parameters: fromToken, toToken, amount'
      };
    }

    if (!password) {
      return {
        action: 'swap_tokens',
        success: false,
        error: 'Password required for swap. Please include: password: your_password',
        requiresPassword: true
      };
    }

    // Swap functionality not implemented yet
    return {
      action: 'swap_tokens',
      success: false,
      error: 'Token swap functionality is not implemented yet. Coming soon!'
    };
  }

  /**
   * Execute: Get Transaction History
   */
  /**
 * Execute: Get Transaction History
 */
// nlpController.js
async executeGetHistory(parameters, user) {
  const { limit = 10, type = null } = parameters;

  try {
    const result = await transactionHistoryService.getUserTransactions(
      user.id,
      {
        limit: parseInt(limit),
        type,
        skip: 0
      }
    );

    const txs = result?.transactions || [];

    if (txs.length === 0) {
      return {
        action: 'transaction_history',
        success: true,
        data: {
          transactions: [],
          total: 0,
          showing: 0
        },
        message: 'No transactions found.'
      };
    }

    const formattedTransactions = txs.map(tx => {
      const hash = typeof tx.hash === 'string' ? tx.hash : 'N/A';
      const from = typeof tx.from === 'string' ? tx.from : '';
      const to = typeof tx.to === 'string' ? tx.to : '';

      let date = 'Unknown';
      try {
        if (typeof tx.timestamp === 'number') {
          date = new Date(tx.timestamp ).toLocaleString();
        } else if (tx.timestamp instanceof Date) {
          date = tx.timestamp.toLocaleString();
        } else if (tx.createdAt) {
          date = new Date(tx.createdAt).toLocaleString();
        }
      } catch (_) {}

      return {
        hashShort: hash !== 'N/A'
          ? `${hash.slice(0, 10)}...${hash.slice(-8)}`
          : 'N/A',
        hashFull: hash,
        type: tx.type || 'unknown',
        fromShort: from
          ? `${from.slice(0, 10)}...${from.slice(-8)}`
          : 'N/A',
        toShort: to
          ? `${to.slice(0, 10)}...${to.slice(-8)}`
          : 'N/A',
        value: tx.value || '0',
        token: tx.token || 'ETH',
        status: tx.status || 'unknown',
        date,
        network: tx.network || 'sepolia'
      };
    });

    return {
      action: 'transaction_history',
      success: true,
      data: {
        transactions: formattedTransactions,
        total: result.total ?? formattedTransactions.length,
        showing: formattedTransactions.length
      },
      message: 'Transaction history fetched successfully.'
    };
  } catch (error) {
    console.error('Error fetching transaction history:', error);
    return {
      action: 'transaction_history',
      success: false,
      error: error.message
    };
  }
}



  /**
   * Execute: Get Contacts
   */
  /**
 * Get user contacts for AI prompt
 */
async getUserContactsForPrompt(userId) {
  try {
    const db = database.getDb();
    const contactsCollection = db.collection('contacts');
    
    const contacts = await contactsCollection
      .find({ userId: new ObjectId(userId) })
      .limit(20)
      .toArray();

    return contacts.map(c => ({
      name: c.alias,  // Changed from c.name
      address: c.walletAddress  // Changed from c.address
    }));
  } catch (error) {
    console.error('Error fetching contacts:', error);
    return [];
  }
}

/**
 * Resolve contact name to address
 */
async resolveContactAddress(nameOrAddress, userId) {
  // If it's already an address, return it
  if (nameOrAddress.startsWith('0x') && nameOrAddress.length === 42) {
    return nameOrAddress;
  }

  // Otherwise, look up in contacts
  try {
    const db = database.getDb();
    const contactsCollection = db.collection('contacts');
    
    const contact = await contactsCollection.findOne({
      userId: new ObjectId(userId),
      alias: { $regex: new RegExp(`^${nameOrAddress}$`, 'i') }  // Changed from name to alias
    });

    if (contact) {
      console.log(`✅ Resolved contact "${nameOrAddress}" to ${contact.walletAddress}`);
      return contact.walletAddress;  // Changed from address to walletAddress
    }

    throw new Error(`Contact "${nameOrAddress}" not found. Please provide a valid address or save this contact first.`);
  } catch (error) {
    throw error;
  }
}

/**
 * Execute: Get Contacts
 */
async executeGetContacts(user) {
  try {
    const db = database.getDb();
    const contactsCollection = db.collection('contacts');
    
    const contacts = await contactsCollection
      .find({ userId: new ObjectId(user.id) })
      .toArray();

    console.log('📋 Raw contacts from DB:', contacts); // Debug log

    if (!contacts || contacts.length === 0) {
      return {
        action: 'view_contacts',
        success: true,
        data: {
          contacts: [],
          count: 0
        },
        message: 'You have no saved contacts yet. Add one with: "Save 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb as Alice"'
      };
    }

    // Filter out invalid contacts and format valid ones
    const formattedContacts = contacts
      .filter(c => c && c.alias && c.walletAddress)  // Changed from name and address
      .map(c => {
        try {
          // Validate address format
          if (!c.walletAddress || typeof c.walletAddress !== 'string' || c.walletAddress.length < 10) {
            console.warn('Invalid contact address:', c);
            return null;
          }

          return {
            name: c.alias,  // Changed from c.name
            address: c.walletAddress,  // Changed from c.address
            displayAddress: c.walletAddress.length >= 42 
              ? c.walletAddress.substring(0, 10) + '...' + c.walletAddress.substring(c.walletAddress.length - 8)
              : c.walletAddress,
            network: c.network || 'sepolia',
            notes: c.notes || '',
            favorite: c.favorite || false
          };
        } catch (err) {
          console.error('Error formatting contact:', c, err);
          return null;
        }
      })
      .filter(c => c !== null); // Remove null entries

    if (formattedContacts.length === 0) {
      return {
        action: 'view_contacts',
        success: true,
        data: {
          contacts: [],
          count: 0
        },
        message: 'You have contacts saved, but they appear to be invalid. Please add valid contacts with: "Save 0x... as Name"'
      };
    }

    return {
      action: 'view_contacts',
      success: true,
      data: {
        contacts: formattedContacts,
        count: formattedContacts.length
      },
      message: `You have ${formattedContacts.length} saved contact${formattedContacts.length !== 1 ? 's' : ''}.`
    };
  } catch (error) {
    console.error('Error fetching contacts:', error);
    return {
      action: 'view_contacts',
      success: false,
      error: `Failed to fetch contacts: ${error.message}`
    };
  }
}

/**
 * Execute: Add Contact
 */
async executeAddContact(parameters, user) {
  const { address, name } = parameters;

  if (!address || !name) {
    return {
      action: 'add_contact',
      success: false,
      error: 'Missing required parameters: address and name'
    };
  }

  // Validate Ethereum address
  if (!address.startsWith('0x') || address.length !== 42) {
    return {
      action: 'add_contact',
      success: false,
      error: 'Invalid Ethereum address format'
    };
  }

  try {
    const db = database.getDb();
    const contactsCollection = db.collection('contacts');

    // Check if contact already exists
    const existing = await contactsCollection.findOne({
      userId: new ObjectId(user.id),
      $or: [
        { alias: { $regex: new RegExp(`^${name}$`, 'i') } },  // Changed from name to alias
        { walletAddress: address.toLowerCase() }  // Changed from address to walletAddress
      ]
    });

    if (existing) {
      return {
        action: 'add_contact',
        success: false,
        error: `A contact with this name or address already exists.`
      };
    }

    // Add new contact with your schema
    const contact = {
      userId: new ObjectId(user.id),
      alias: name,  // Changed from name to alias
      walletAddress: address.toLowerCase(),  // Changed from address to walletAddress
      notes: '',
      tags: [],
      favorite: false,
      lastTransactionDate: null,
      totalSent: '0',
      totalReceived: '0',
      transactionCount: 0,
      network: user.network || 'sepolia',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await contactsCollection.insertOne(contact);

    return {
      action: 'add_contact',
      success: true,
      data: {
        name: name,
        address: address.substring(0, 10) + '...' + address.substring(address.length - 8)
      },
      message: `Saved ${name} (${address.substring(0, 10)}...) to your contacts.`
    };
  } catch (error) {
    return {
      action: 'add_contact',
      success: false,
      error: error.message
    };
  }
}

  /**
   * Health check
   */
  async health(req, res) {
    res.json({
      success: true,
      running: true,
      modelAvailable: !!process.env.GROQ_API_KEY,
      service: 'Groq Agentic AI',
      model: MODEL_NAME,
      mode: 'autonomous'
    });
  }
}

export default new NLPController();
