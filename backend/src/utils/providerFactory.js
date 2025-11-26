import { ethers } from 'ethers';
import { NETWORKS } from '../config/constants.js';
import logger from './logger.js';

class ProviderFactory {
  constructor() {
    this.providers = {};
    this.currentIndex = {};
    this.initializeProviders();
  }

  initializeProviders() {
    Object.entries(NETWORKS).forEach(([key, network]) => {
      if (!network.rpcUrls || network.rpcUrls.length === 0) {
        logger.warn(`No RPC URLs configured for ${network.name}`);
        return;
      }

      // Store all RPC URLs for manual fallback
      this.providers[network.name] = network.rpcUrls.map(url => ({
        url,
        provider: null, // Lazy initialization
        chainId: network.chainId,
        name: network.name
      }));

      this.currentIndex[network.name] = 0;

      logger.info(` Configured ${network.rpcUrls.length} RPCs for ${network.name}`);
    });
  }

  /**
   * Get a working provider with automatic fallback
   */
  getProvider(networkName = 'sepolia') {
    const providers = this.providers[networkName];
    
    if (!providers || providers.length === 0) {
      throw new Error(`No providers configured for network: ${networkName}`);
    }

    // Try to get current provider
    let currentIdx = this.currentIndex[networkName];
    let providerConfig = providers[currentIdx];

    // Lazy initialize provider if not already done
    if (!providerConfig.provider) {
      try {
        providerConfig.provider = new ethers.JsonRpcProvider(
          providerConfig.url,
          {
            chainId: providerConfig.chainId,
            name: providerConfig.name,
            ensAddress: null // Disable ENS to speed up
          },
          {
            staticNetwork: true // Don't auto-detect network
          }
        );
        logger.info(`Initialized provider: ${providerConfig.url}`);
      } catch (error) {
        logger.error(`Failed to init provider ${providerConfig.url}:`, error.message);
        // Try next provider
        return this.getNextProvider(networkName);
      }
    }

    return providerConfig.provider;
  }

  /**
   * Switch to next provider on failure
   */
  getNextProvider(networkName) {
    const providers = this.providers[networkName];
    const currentIdx = this.currentIndex[networkName];

    // Move to next provider
    const nextIdx = (currentIdx + 1) % providers.length;
    this.currentIndex[networkName] = nextIdx;

    logger.warn(`Switching to backup RPC [${nextIdx}] for ${networkName}`);

    // Reset the provider instance to force re-initialization
    providers[nextIdx].provider = null;

    return this.getProvider(networkName);
  }

  /**
   * Manual retry wrapper for provider calls
   */
  async withRetry(networkName, operation, maxRetries = 3) {
    let lastError;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const provider = this.getProvider(networkName);
        return await operation(provider);
      } catch (error) {
        lastError = error;
        logger.warn(`Provider call failed (attempt ${attempt + 1}/${maxRetries}):`, error.message);
        
        if (attempt < maxRetries - 1) {
          // Try next provider
          this.getNextProvider(networkName);
        }
      }
    }

    throw lastError;
  }

  getHealthStatus() {
    const status = {};
    
    Object.entries(this.providers).forEach(([networkName, providers]) => {
      status[networkName] = {
        totalRPCs: providers.length,
        currentIndex: this.currentIndex[networkName],
        currentRPC: providers[this.currentIndex[networkName]].url
      };
    });

    return status;
  }
}

const providerFactory = new ProviderFactory();
export default providerFactory;
