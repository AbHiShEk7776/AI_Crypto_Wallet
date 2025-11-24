import { ethers } from 'ethers';
import logger from '../utils/logger.js';
import providerFactory from '../utils/providerFactory.js';
import swapService from './swapService.js';

/**
 * DApp Service
 * Handles DEX interactions and smart contract operations
 */

// Uniswap V2 addresses on Sepolia
const UNISWAP_V2_ROUTER_ADDRESS = '0xC532a74256D3Db42D0Bf7a0400fEFDbad7694008';
const UNISWAP_V2_FACTORY_ADDRESS = '0x7E0987E5b3a30e3f2828572Bc5dE7a3348d0b1B1';

// Test token addresses on Sepolia
const TOKENS = {
  WETH: '0x7b79995e5f793A07Bc00c21412e50Ecae098E7f9',
  DAI: '0x68194a729C2450ad26072b3D33ADaCbcef39D574',
  USDC: '0x94a9D9AC8a22534E3FaCa9F4e7F2E2cf85d5E4C8',
  USDT: '0xaA8E23Fb1079EA71e0a56F48a2aA51851D8433D0'
};

// ABIs
const ERC20_ABI = [
  'function approve(address spender, uint256 amount) external returns (bool)',
  'function allowance(address owner, address spender) external view returns (uint256)',
  'function balanceOf(address account) external view returns (uint256)',
  'function decimals() external view returns (uint8)',
  'function symbol() external view returns (string)',
  'function name() external view returns (string)',
  'function totalSupply() external view returns (uint256)'
];

const ROUTER_ABI = [
  'function getAmountsOut(uint amountIn, address[] memory path) public view returns (uint[] memory amounts)',
  'function swapExactETHForTokens(uint amountOutMin, address[] calldata path, address to, uint deadline) external payable returns (uint[] memory amounts)',
  'function swapExactTokensForETH(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)',
  'function swapExactTokensForTokens(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)'
];

class DAppService {
  constructor() {
    this.providerFactory = providerFactory;
  }

  getProvider(network = 'sepolia') {
    return this.providerFactory.getProvider(network);
  }

  /**
   * Get token address by symbol
   */
  getTokenAddress(symbol) {
    if (symbol === 'ETH') return 'native';
    return TOKENS[symbol] || null;
  }

  /**
   * Get swap quote using SwapService
   */
  async getSwapQuote(fromToken, toToken, amount, network = 'sepolia') {
    try {
      logger.info('Getting swap quote', { fromToken, toToken, amount });

      // Use the SwapService for quotes
      const quote = await swapService.getQuote(fromToken, toToken, amount, network);

      return quote;
    } catch (error) {
      logger.error('Get swap quote failed:', error);
      throw new Error(`Failed to get quote: ${error.message}`);
    }
  }

  /**
   * Build swap transaction (unsigned)
   */
  async buildSwapTransaction(fromToken, toToken, amount, recipient, slippage = 0.5, network = 'sepolia') {
    try {
      const provider = this.getProvider(network);
      const router = new ethers.Contract(
        UNISWAP_V2_ROUTER_ADDRESS,
        ROUTER_ABI,
        provider
      );

      const fromAddress = fromToken === 'ETH' ? TOKENS.WETH : this.getTokenAddress(fromToken);
      const toAddress = toToken === 'ETH' ? TOKENS.WETH : this.getTokenAddress(toToken);

      if (!fromAddress || !toAddress) {
        throw new Error('Invalid token');
      }

      // Get decimals
      let fromDecimals = 18;
      if (fromToken !== 'ETH') {
        const tokenContract = new ethers.Contract(fromAddress, ERC20_ABI, provider);
        fromDecimals = await tokenContract.decimals();
      }

      const amountInWei = ethers.parseUnits(amount.toString(), fromDecimals);
      const path = [fromAddress, toAddress];

      // Get expected output
      const amounts = await router.getAmountsOut(amountInWei, path);
      const amountOut = amounts[1];

      // Calculate min output with slippage
      const slippageBps = Math.floor(slippage * 100); // 0.5% = 50 bps
      const minAmountOut = (amountOut * BigInt(10000 - slippageBps)) / 10000n;

      const deadline = Math.floor(Date.now() / 1000) + 60 * 20; // 20 minutes

      // Build transaction data
      let txData;
      let value = 0n;

      if (fromToken === 'ETH') {
        // ETH to Token
        txData = router.interface.encodeFunctionData('swapExactETHForTokens', [
          minAmountOut,
          path,
          recipient,
          deadline
        ]);
        value = amountInWei;
      } else if (toToken === 'ETH') {
        // Token to ETH
        txData = router.interface.encodeFunctionData('swapExactTokensForETH', [
          amountInWei,
          minAmountOut,
          path,
          recipient,
          deadline
        ]);
      } else {
        // Token to Token
        txData = router.interface.encodeFunctionData('swapExactTokensForTokens', [
          amountInWei,
          minAmountOut,
          path,
          recipient,
          deadline
        ]);
      }

      // Estimate gas
      const gasEstimate = await provider.estimateGas({
        to: UNISWAP_V2_ROUTER_ADDRESS,
        data: txData,
        value: value,
        from: recipient
      });

      logger.info('Swap transaction built', {
        fromToken,
        toToken,
        amountIn: amount,
        gasEstimate: gasEstimate.toString()
      });

      return {
        to: UNISWAP_V2_ROUTER_ADDRESS,
        data: txData,
        value: value.toString(),
        gasLimit: gasEstimate.toString(),
        fromToken,
        toToken,
        amountIn: amount,
        minAmountOut: ethers.formatUnits(minAmountOut, 18),
        path,
        deadline
      };
    } catch (error) {
      logger.error('Build swap transaction failed:', error);
      throw new Error(`Failed to build transaction: ${error.message}`);
    }
  }

  /**
   * Build token approval transaction
   */
  async buildApprovalTransaction(tokenAddress, spender, amount, network = 'sepolia') {
    try {
      const provider = this.getProvider(network);
      const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);

      // Use max approval for convenience (common practice)
      const approvalAmount = amount === 'unlimited' 
        ? ethers.MaxUint256 
        : ethers.parseUnits(amount.toString(), 18);

      const txData = tokenContract.interface.encodeFunctionData('approve', [
        spender,
        approvalAmount
      ]);

      logger.info('Approval transaction built', {
        token: tokenAddress,
        spender,
        amount
      });

      return {
        to: tokenAddress,
        data: txData,
        value: '0',
        token: tokenAddress,
        spender,
        amount: approvalAmount.toString()
      };
    } catch (error) {
      logger.error('Build approval transaction failed:', error);
      throw new Error(`Failed to build approval: ${error.message}`);
    }
  }

  /**
   * Check token allowance
   */
  async checkAllowance(tokenAddress, owner, spender, network = 'sepolia') {
    try {
      const provider = this.getProvider(network);
      const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);

      const allowance = await tokenContract.allowance(owner, spender);
      const decimals = await tokenContract.decimals();

      const allowanceFormatted = ethers.formatUnits(allowance, decimals);
      const isApproved = allowance > 0n;

      logger.info('Allowance checked', {
        token: tokenAddress,
        owner,
        spender,
        allowance: allowanceFormatted,
        isApproved
      });

      return {
        allowance: allowanceFormatted,
        allowanceWei: allowance.toString(),
        isApproved,
        spender
      };
    } catch (error) {
      logger.error('Check allowance failed:', error);
      throw new Error(`Failed to check allowance: ${error.message}`);
    }
  }

  /**
   * Get token information
   */
  async getTokenInfo(tokenAddress, network = 'sepolia') {
    try {
      const provider = this.getProvider(network);
      const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);

      const [name, symbol, decimals, totalSupply] = await Promise.all([
        tokenContract.name(),
        tokenContract.symbol(),
        tokenContract.decimals(),
        tokenContract.totalSupply()
      ]);

      logger.info('Token info retrieved', {
        address: tokenAddress,
        symbol,
        name
      });

      return {
        address: tokenAddress,
        name,
        symbol,
        decimals,
        totalSupply: ethers.formatUnits(totalSupply, decimals),
        network
      };
    } catch (error) {
      logger.error('Get token info failed:', error);
      throw new Error(`Failed to get token info: ${error.message}`);
    }
  }

  /**
   * Estimate gas for swap
   */
  async estimateSwapGas(fromToken, toToken, amount, from, network = 'sepolia') {
    try {
      const tx = await this.buildSwapTransaction(
        fromToken,
        toToken,
        amount,
        from,
        0.5,
        network
      );

      const provider = this.getProvider(network);
      const gasEstimate = await provider.estimateGas({
        to: tx.to,
        data: tx.data,
        value: tx.value,
        from
      });

      const feeData = await provider.getFeeData();
      const gasCost = gasEstimate * (feeData.maxFeePerGas || feeData.gasPrice);

      return {
        gasLimit: gasEstimate.toString(),
        gasPrice: feeData.maxFeePerGas?.toString() || feeData.gasPrice?.toString(),
        gasCost: ethers.formatEther(gasCost),
        gasCostWei: gasCost.toString()
      };
    } catch (error) {
      logger.error('Estimate swap gas failed:', error);
      throw new Error(`Failed to estimate gas: ${error.message}`);
    }
  }

  /**
   * Get supported tokens
   */
  getSupportedTokens() {
    return {
      tokens: [
        { 
          symbol: 'ETH', 
          name: 'Ethereum', 
          address: 'native', 
          decimals: 18,
          logo: '⟠'
        },
        { 
          symbol: 'WETH', 
          name: 'Wrapped Ether', 
          address: TOKENS.WETH, 
          decimals: 18,
          logo: '⟠'
        },
        { 
          symbol: 'DAI', 
          name: 'Dai Stablecoin', 
          address: TOKENS.DAI, 
          decimals: 18,
          logo: '◈'
        },
        { 
          symbol: 'USDC', 
          name: 'USD Coin', 
          address: TOKENS.USDC, 
          decimals: 6,
          logo: '$'
        },
        { 
          symbol: 'USDT', 
          name: 'Tether USD', 
          address: TOKENS.USDT, 
          decimals: 6,
          logo: '₮'
        }
      ]
    };
  }

  /**
   * Get token balance
   */
  async getTokenBalance(address, tokenAddress, network = 'sepolia') {
    try {
      const provider = this.getProvider(network);
      
      if (tokenAddress === 'native' || !tokenAddress) {
        // Get ETH balance
        const balance = await provider.getBalance(address);
        return {
          balance: ethers.formatEther(balance),
          balanceWei: balance.toString(),
          symbol: 'ETH',
          decimals: 18
        };
      }

      // Get ERC20 balance
      const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
      const [balance, decimals, symbol] = await Promise.all([
        tokenContract.balanceOf(address),
        tokenContract.decimals(),
        tokenContract.symbol()
      ]);

      return {
        balance: ethers.formatUnits(balance, decimals),
        balanceWei: balance.toString(),
        symbol,
        decimals
      };
    } catch (error) {
      logger.error('Get token balance failed:', error);
      throw error;
    }
  }
}

const dappService = new DAppService();
export default dappService;
