import { ethers } from 'ethers';
import { NETWORKS, UNISWAP_V2_ROUTER, UNISWAP_V2_ROUTER_ABI, TOKENS, ERC20_ABI } from '../config/constants.js';
import logger from '../utils/logger.js';
import providerFactory from '../utils/providerFactory.js';


/**
 * DApp Service
 * Handles decentralized application interactions (Uniswap swaps, lending protocols, etc.)
 */

class DAppService {
  constructor() {
    this.providerFactory = providerFactory;
  }

  getProvider(network = 'sepolia') {
    return this.providerFactory.getProvider(network);
  }


  /**
   * Get swap quote from Uniswap V2
   * Calculates expected output for a given input
   * @param {string} fromToken - Source token symbol (ETH, USDC, DAI)
   * @param {string} toToken - Destination token symbol
   * @param {string} amount - Amount to swap
   * @param {string} network - Network name
   * @returns {Object} Swap quote details
   */
  async getSwapQuote(fromToken, toToken, amount, network = 'sepolia') {
    try {
      const provider = this.getProvider[network];
      if (!provider) {
        throw new Error(`Unsupported network: ${network}`);
      }

      logger.info('Getting swap quote', { fromToken, toToken, amount, network });

      // Get router address
      const routerAddress = UNISWAP_V2_ROUTER[network];
      if (!routerAddress) {
        throw new Error(`Uniswap not available on ${network}`);
      }

      // Create router contract instance
      const router = new ethers.Contract(
        routerAddress,
        UNISWAP_V2_ROUTER_ABI,
        provider
      );

      // Build token path
      const path = this.buildSwapPath(fromToken, toToken, network);

      // Convert amount to wei (smallest unit)
      const amountIn = ethers.parseEther(amount);

      // Get amounts out from Uniswap
      const amounts = await router.getAmountsOut(amountIn, path);

      // Calculate price impact (simplified)
      const amountOut = amounts[amounts.length - 1];
      const expectedPrice = parseFloat(amount) / parseFloat(ethers.formatEther(amountOut));
      const priceImpact = 0.3; // Simplified - in production, compare with pool reserves

      // Calculate minimum amount with slippage (0.5% default)
      const slippage = 0.5;
      const minAmountOut = (amountOut * BigInt(Math.floor((100 - slippage) * 100))) / 10000n;

      return {
        fromToken,
        toToken,
        amountIn: amount,
        amountInWei: amountIn.toString(),
        amountOut: ethers.formatEther(amountOut),
        amountOutWei: amountOut.toString(),
        minAmountOut: ethers.formatEther(minAmountOut),
        minAmountOutWei: minAmountOut.toString(),
        path: path,
        priceImpact: priceImpact.toFixed(2) + '%',
        exchangeRate: `1 ${fromToken} = ${(parseFloat(ethers.formatEther(amountOut)) / parseFloat(amount)).toFixed(6)} ${toToken}`,
        network
      };
    } catch (error) {
      logger.error('Swap quote failed', {
        fromToken,
        toToken,
        amount,
        network,
        error: error.message
      });
      throw new Error(`Swap quote failed: ${error.message}`);
    }
  }

  /**
   * Build token swap path for Uniswap
   * @param {string} fromToken - Source token
   * @param {string} toToken - Destination token
   * @param {string} network - Network name
   * @returns {Array} Token path
   */
  buildSwapPath(fromToken, toToken, network) {
    const tokens = TOKENS[network] || {};

    const getTokenAddress = (symbol) => {
      if (symbol === 'ETH') {
        return tokens.WETH || ethers.ZeroAddress;
      }
      return tokens[symbol] || ethers.ZeroAddress;
    };

    const fromAddress = getTokenAddress(fromToken);
    const toAddress = getTokenAddress(toToken);

    // Direct path if both tokens exist
    if (fromAddress !== ethers.ZeroAddress && toAddress !== ethers.ZeroAddress) {
      return [fromAddress, toAddress];
    }

    // Path through WETH if one is ETH
    if (fromToken === 'ETH') {
      return [tokens.WETH, toAddress];
    }
    if (toToken === 'ETH') {
      return [fromAddress, tokens.WETH];
    }

    throw new Error(`Cannot build swap path for ${fromToken} -> ${toToken}`);
  }

  /**
   * Build swap transaction data
   * @param {string} fromToken - Source token
   * @param {string} toToken - Destination token
   * @param {string} amount - Amount to swap
   * @param {string} recipient - Recipient address
   * @param {number} slippage - Slippage tolerance (%)
   * @param {string} network - Network name
   * @returns {Object} Transaction data
   */
  async buildSwapTransaction(fromToken, toToken, amount, recipient, slippage = 0.5, network = 'sepolia') {
    try {
      logger.info('Building swap transaction', {
        fromToken,
        toToken,
        amount,
        recipient,
        slippage,
        network
      });

      // Get quote first
      const quote = await this.getSwapQuote(fromToken, toToken, amount, network);

      // Get router address
      const routerAddress = UNISWAP_V2_ROUTER[network];
      const provider = this.getProvider[network];

      // Create router contract instance
      const router = new ethers.Contract(
        routerAddress,
        UNISWAP_V2_ROUTER_ABI,
        provider
      );

      // Calculate deadline (20 minutes from now)
      const deadline = Math.floor(Date.now() / 1000) + 60 * 20;

      // Calculate minimum amount out with user's slippage
      const amountOutMin = (BigInt(quote.amountOutWei) * BigInt(Math.floor((100 - slippage) * 100))) / 10000n;

      let txData;
      let value = 0n;

      // Build transaction based on token types
      if (fromToken === 'ETH') {
        // Swap ETH for Tokens
        txData = router.interface.encodeFunctionData('swapExactETHForTokens', [
          amountOutMin,
          quote.path,
          recipient,
          deadline
        ]);
        value = BigInt(quote.amountInWei);
      } else if (toToken === 'ETH') {
        // Swap Tokens for ETH
        txData = router.interface.encodeFunctionData('swapExactTokensForETH', [
          BigInt(quote.amountInWei),
          amountOutMin,
          quote.path,
          recipient,
          deadline
        ]);
      } else {
        // Swap Tokens for Tokens
        txData = router.interface.encodeFunctionData('swapExactTokensForTokens', [
          BigInt(quote.amountInWei),
          amountOutMin,
          quote.path,
          recipient,
          deadline
        ]);
      }

      return {
        to: routerAddress,
        data: txData,
        value: value.toString(),
        quote: quote,
        requiresApproval: fromToken !== 'ETH', // ERC20 tokens need approval first
        deadline: deadline
      };
    } catch (error) {
      logger.error('Swap transaction build failed', {
        fromToken,
        toToken,
        amount,
        error: error.message
      });
      throw new Error(`Swap transaction build failed: ${error.message}`);
    }
  }

  /**
   * Build ERC-20 token approval transaction
   * Required before swapping ERC-20 tokens
   * @param {string} tokenAddress - Token contract address
   * @param {string} spender - Spender address (usually router)
   * @param {string} amount - Amount to approve
   * @param {string} network - Network name
   * @returns {Object} Approval transaction data
   */
  async buildApprovalTransaction(tokenAddress, spender, amount, network = 'sepolia') {
    try {
      logger.info('Building approval transaction', {
        tokenAddress,
        spender,
        amount,
        network
      });

      const provider = this.getProvider[network];

      // Create token contract instance
      const token = new ethers.Contract(
        tokenAddress,
        ERC20_ABI,
        provider
      );

      // Get token decimals
      const decimals = await token.decimals();

      // Convert amount to smallest unit
      const amountWei = ethers.parseUnits(amount, decimals);

      // Encode approval function call
      const txData = token.interface.encodeFunctionData('approve', [
        spender,
        amountWei
      ]);

      return {
        to: tokenAddress,
        data: txData,
        value: '0',
        amount: amount,
        amountWei: amountWei.toString(),
        spender: spender
      };
    } catch (error) {
      logger.error('Approval transaction build failed', {
        tokenAddress,
        spender,
        amount,
        error: error.message
      });
      throw new Error(`Approval transaction build failed: ${error.message}`);
    }
  }

  /**
   * Check token allowance for a spender
   * @param {string} tokenAddress - Token contract address
   * @param {string} owner - Token owner address
   * @param {string} spender - Spender address
   * @param {string} network - Network name
   * @returns {string} Current allowance
   */
  async checkAllowance(tokenAddress, owner, spender, network = 'sepolia') {
    try {
      const provider = this.getProvider[network];

      const token = new ethers.Contract(
        tokenAddress,
        ERC20_ABI,
        provider
      );

      const allowance = await token.allowance(owner, spender);
      const decimals = await token.decimals();

      return {
        allowance: ethers.formatUnits(allowance, decimals),
        allowanceWei: allowance.toString(),
        hasAllowance: allowance > 0n
      };
    } catch (error) {
      logger.error('Allowance check failed', {
        tokenAddress,
        owner,
        spender,
        error: error.message
      });
      throw new Error(`Allowance check failed: ${error.message}`);
    }
  }

  /**
   * Get token information
   * @param {string} tokenAddress - Token contract address
   * @param {string} network - Network name
   * @returns {Object} Token details
   */
  async getTokenInfo(tokenAddress, network = 'sepolia') {
    try {
      const provider = this.getProvider[network];

      const token = new ethers.Contract(
        tokenAddress,
        ERC20_ABI,
        provider
      );

      const [name, symbol, decimals] = await Promise.all([
        token.name(),
        token.symbol(),
        token.decimals()
      ]);

      return {
        address: tokenAddress,
        name,
        symbol,
        decimals: Number(decimals),
        network
      };
    } catch (error) {
      logger.error('Token info fetch failed', {
        tokenAddress,
        network,
        error: error.message
      });
      throw new Error(`Token info fetch failed: ${error.message}`);
    }
  }

  /**
   * Estimate gas for swap transaction
   * @param {string} fromToken - Source token
   * @param {string} toToken - Destination token
   * @param {string} amount - Amount to swap
   * @param {string} from - Sender address
   * @param {string} network - Network name
   * @returns {Object} Gas estimate
   */
  async estimateSwapGas(fromToken, toToken, amount, from, network = 'sepolia') {
    try {
      const swapTx = await this.buildSwapTransaction(
        fromToken,
        toToken,
        amount,
        from,
        0.5,
        network
      );

      const provider = this.getProvider[network];

      const gasEstimate = await provider.estimateGas({
        from: from,
        to: swapTx.to,
        data: swapTx.data,
        value: swapTx.value
      });

      const feeData = await provider.getFeeData();

      return {
        gasLimit: gasEstimate.toString(),
        maxFeePerGas: feeData.maxFeePerGas?.toString(),
        estimatedCost: ethers.formatEther(
          gasEstimate * (feeData.maxFeePerGas || 0n)
        )
      };
    } catch (error) {
      logger.error('Swap gas estimation failed', {
        fromToken,
        toToken,
        amount,
        error: error.message
      });
      throw new Error(`Swap gas estimation failed: ${error.message}`);
    }
  }
}

export default new DAppService();
