import { ethers } from 'ethers';
import logger from '../utils/logger.js';
import providerFactory from '../utils/providerFactory.js';

/**
 * Swap Service
 * Handles DEX swaps using Uniswap V2 on Sepolia
 */

// Uniswap V2 Contract Addresses on Sepolia
const UNISWAP_V2_ROUTER_ADDRESS = '0xC532a74256D3Db42D0Bf7a0400fEFDbad7694008'; // Sepolia
const WETH_ADDRESS = '0x7b79995e5f793A07Bc00c21412e50Ecae098E7f9'; // WETH on Sepolia

// Common test token addresses on Sepolia
const TEST_TOKENS = {
  WETH: '0x7b79995e5f793A07Bc00c21412e50Ecae098E7f9',
  DAI: '0x68194a729C2450ad26072b3D33ADaCbcef39D574', // DAI testnet
  USDC: '0x94a9D9AC8a22534E3FaCa9F4e7F2E2cf85d5E4C8', // USDC testnet (example)
};

// Uniswap V2 Router ABI (minimal)
const ROUTER_ABI = [
  'function getAmountsOut(uint amountIn, address[] memory path) public view returns (uint[] memory amounts)',
  'function swapExactETHForTokens(uint amountOutMin, address[] calldata path, address to, uint deadline) external payable returns (uint[] memory amounts)',
  'function swapExactTokensForETH(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)',
  'function swapExactTokensForTokens(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)',
  'function WETH() external pure returns (address)'
];

// ERC20 ABI (minimal)
const ERC20_ABI = [
  'function approve(address spender, uint256 amount) external returns (bool)',
  'function allowance(address owner, address spender) external view returns (uint256)',
  'function balanceOf(address account) external view returns (uint256)',
  'function decimals() external view returns (uint8)',
  'function symbol() external view returns (string)'
];

class SwapService {
  constructor() {
    this.providerFactory = providerFactory;
  }

  getProvider(network = 'sepolia') {
    return this.providerFactory.getProvider(network);
  }

  /**
   * Get swap quote (price estimate)
   */
  async getQuote(fromToken, toToken, amountIn, network = 'sepolia') {
    try {
      const provider = this.getProvider(network);
      const router = new ethers.Contract(
        UNISWAP_V2_ROUTER_ADDRESS,
        ROUTER_ABI,
        provider
      );

      // Convert token symbols to addresses
      const fromAddress = fromToken === 'ETH' ? WETH_ADDRESS : TEST_TOKENS[fromToken];
      const toAddress = toToken === 'ETH' ? WETH_ADDRESS : TEST_TOKENS[toToken];

      if (!fromAddress || !toAddress) {
        throw new Error('Unsupported token');
      }

      // Get decimals
      let fromDecimals = 18; // ETH/WETH default
      if (fromToken !== 'ETH') {
        const tokenContract = new ethers.Contract(fromAddress, ERC20_ABI, provider);
        fromDecimals = await tokenContract.decimals();
      }

      // Convert amount to wei
      const amountInWei = ethers.parseUnits(amountIn.toString(), fromDecimals);

      // Build swap path
      const path = [fromAddress, toAddress];

      // Get amounts out
      const amounts = await router.getAmountsOut(amountInWei, path);
      const amountOut = amounts[1];

      // Get output token decimals
      let toDecimals = 18;
      if (toToken !== 'ETH') {
        const tokenContract = new ethers.Contract(toAddress, ERC20_ABI, provider);
        toDecimals = await tokenContract.decimals();
      }

      // Calculate price impact and rate
      const amountOutFormatted = ethers.formatUnits(amountOut, toDecimals);
      const rate = parseFloat(amountOutFormatted) / parseFloat(amountIn);

      // Calculate minimum amount with 0.5% slippage
      const slippage = 0.005; // 0.5%
      const minAmountOut = (amountOut * BigInt(Math.floor((1 - slippage) * 10000))) / 10000n;

      logger.info('Swap quote calculated', {
        fromToken,
        toToken,
        amountIn,
        amountOut: amountOutFormatted,
        rate
      });

      return {
        fromToken,
        toToken,
        amountIn: amountIn.toString(),
        amountOut: amountOutFormatted,
        minAmountOut: ethers.formatUnits(minAmountOut, toDecimals),
        rate: rate.toString(),
        path,
        priceImpact: '0.5%', // Simplified
        gasFee: '~0.002 ETH' // Estimate
      };
    } catch (error) {
      logger.error('Quote calculation failed:', error);
      throw new Error(`Quote failed: ${error.message}`);
    }
  }

  /**
   * Check if token allowance is sufficient
   */
  async checkAllowance(tokenAddress, ownerAddress, network = 'sepolia') {
    try {
      const provider = this.getProvider(network);
      const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
      
      const allowance = await tokenContract.allowance(
        ownerAddress,
        UNISWAP_V2_ROUTER_ADDRESS
      );

      return allowance;
    } catch (error) {
      logger.error('Allowance check failed:', error);
      throw error;
    }
  }

  /**
   * Approve token spending
   */
  async approveToken(privateKey, tokenAddress, amount, network = 'sepolia') {
    try {
      const provider = this.getProvider(network);
      const wallet = new ethers.Wallet(privateKey, provider);
      const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, wallet);

      // Approve unlimited (common practice)
      const approvalAmount = ethers.MaxUint256;

      logger.info('Approving token spending', {
        token: tokenAddress,
        router: UNISWAP_V2_ROUTER_ADDRESS
      });

      const tx = await tokenContract.approve(UNISWAP_V2_ROUTER_ADDRESS, approvalAmount);
      const receipt = await tx.wait();

      logger.info('Token approved', {
        hash: receipt.hash,
        status: receipt.status
      });

      return {
        hash: receipt.hash,
        status: receipt.status === 1 ? 'success' : 'failed',
        message: 'Token approved for swapping'
      };
    } catch (error) {
      logger.error('Token approval failed:', error);
      throw new Error(`Approval failed: ${error.message}`);
    }
  }

  /**
   * Execute swap
   */
  async executeSwap(privateKey, swapParams, network = 'sepolia') {
    try {
      const { fromToken, toToken, amountIn, minAmountOut } = swapParams;

      const provider = this.getProvider(network);
      const wallet = new ethers.Wallet(privateKey, provider);
      const router = new ethers.Contract(
        UNISWAP_V2_ROUTER_ADDRESS,
        ROUTER_ABI,
        wallet
      );

      const fromAddress = fromToken === 'ETH' ? WETH_ADDRESS : TEST_TOKENS[fromToken];
      const toAddress = toToken === 'ETH' ? WETH_ADDRESS : TEST_TOKENS[toToken];

      const path = [fromAddress, toAddress];
      const deadline = Math.floor(Date.now() / 1000) + 60 * 20; // 20 minutes

      let tx, receipt;

      // ETH to Token
      if (fromToken === 'ETH') {
        const amountInWei = ethers.parseEther(amountIn.toString());
        const minAmountOutWei = ethers.parseUnits(minAmountOut.toString(), 18);

        logger.info('Executing ETH → Token swap', {
          amountIn,
          minAmountOut,
          path
        });

        tx = await router.swapExactETHForTokens(
          minAmountOutWei,
          path,
          wallet.address,
          deadline,
          { value: amountInWei }
        );

        receipt = await tx.wait();
      }
      // Token to ETH
      else if (toToken === 'ETH') {
        const tokenContract = new ethers.Contract(fromAddress, ERC20_ABI, provider);
        const decimals = await tokenContract.decimals();
        const amountInWei = ethers.parseUnits(amountIn.toString(), decimals);
        const minAmountOutWei = ethers.parseEther(minAmountOut.toString());

        logger.info('Executing Token → ETH swap', {
          amountIn,
          minAmountOut,
          path
        });

        tx = await router.swapExactTokensForETH(
          amountInWei,
          minAmountOutWei,
          path,
          wallet.address,
          deadline
        );

        receipt = await tx.wait();
      }
      // Token to Token
      else {
        const tokenContract = new ethers.Contract(fromAddress, ERC20_ABI, provider);
        const decimals = await tokenContract.decimals();
        const amountInWei = ethers.parseUnits(amountIn.toString(), decimals);
        
        const toContract = new ethers.Contract(toAddress, ERC20_ABI, provider);
        const toDecimals = await toContract.decimals();
        const minAmountOutWei = ethers.parseUnits(minAmountOut.toString(), toDecimals);

        logger.info('Executing Token → Token swap', {
          amountIn,
          minAmountOut,
          path
        });

        tx = await router.swapExactTokensForTokens(
          amountInWei,
          minAmountOutWei,
          path,
          wallet.address,
          deadline
        );

        receipt = await tx.wait();
      }

      logger.info('Swap executed successfully', {
        hash: receipt.hash,
        from: fromToken,
        to: toToken
      });

      return {
        hash: receipt.hash,
        from: receipt.from,
        to: receipt.to,
        fromToken,
        toToken,
        amountIn,
        gasUsed: receipt.gasUsed.toString(),
        effectiveGasPrice: receipt.gasPrice?.toString(),
        status: receipt.status === 1 ? 'success' : 'failed',
        blockNumber: receipt.blockNumber,
        timestamp: Date.now()
      };
    } catch (error) {
      logger.error('Swap execution failed:', error);
      throw new Error(`Swap failed: ${error.message}`);
    }
  }

  /**
   * Get supported tokens
   */
  getSupportedTokens() {
    return {
      tokens: [
        { symbol: 'ETH', name: 'Ethereum', address: 'native', decimals: 18 },
        { symbol: 'WETH', name: 'Wrapped Ether', address: TEST_TOKENS.WETH, decimals: 18 },
        { symbol: 'DAI', name: 'Dai Stablecoin', address: TEST_TOKENS.DAI, decimals: 18 },
        { symbol: 'USDC', name: 'USD Coin', address: TEST_TOKENS.USDC, decimals: 6 }
      ]
    };
  }
}

const swapService = new SwapService();
export default swapService;
