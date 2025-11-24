import nlpService from '../services/nlpService.js';
import logger from '../utils/logger.js';
import { RESPONSE_CODES } from '../config/constants.js';

/**
 * NLP Controller
 * Handles natural language processing requests
 */

class NLPController {
  /**
   * Parse user message intent
   * POST /api/nlp/parse
   */
  async parseIntent(req, res, next) {
    try {
      const { message, history } = req.body;

      logger.info('Parse intent request', {
        messageLength: message.length,
        historyLength: history?.length || 0
      });

      const result = await nlpService.parseIntent(message, history || []);

      res.status(RESPONSE_CODES.SUCCESS).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Check Ollama health status
   * GET /api/nlp/health
   */
  async checkHealth(req, res, next) {
    try {
      logger.info('NLP health check request');

      const health = await nlpService.checkOllamaHealth();

      res.status(RESPONSE_CODES.SUCCESS).json({
        success: true,
        ...health
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new NLPController();
