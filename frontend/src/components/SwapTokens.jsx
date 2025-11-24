import React, { useState, useEffect } from 'react';
import useWalletStore from '@store/walletStore';
import { swapAPI, demoAPI } from '@services/api';
import toast from 'react-hot-toast';
import { getExplorerUrl } from '@utils/formatters';
import { 
  ArrowLeftRight, 
  Loader, 
  CheckCircle, 
  Zap, 
  Settings,
  AlertCircle,
  RefreshCw
} from 'lucide-react';

export default function SwapTokens() {
  const { wallet, network, addTransaction, demoMode, balance, isAuthenticated } = useWalletStore();
  
  const [tokens, setTokens] = useState([]);
  const [fromToken, setFromToken] = useState('ETH');
  const [toToken, setToToken] = useState('DAI');
  const [fromAmount, setFromAmount] = useState('0.01');
  const [toAmount, setToAmount] = useState('0');
  
  const [slippage, setSlippage] = useState(0.5);
  const [showSettings, setShowSettings] = useState(false);
  const [quote, setQuote] = useState(null);
  const [loading, setLoading] = useState(false);
  const [swapping, setSwapping] = useState(false);
  const [swapHash, setSwapHash] = useState(null);
  
  const [needsApproval, setNeedsApproval] = useState(false);
  const [approving, setApproving] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [password, setPassword] = useState('');

  // Fetch supported tokens on mount
  useEffect(() => {
    if (!demoMode) {
      fetchTokens();
    }
  }, [demoMode]);

  // Get quote when amount/tokens change
  useEffect(() => {
    if (fromAmount && parseFloat(fromAmount) > 0) {
      const timer = setTimeout(() => {
        getQuote();
      }, 500); // Debounce
      
      return () => clearTimeout(timer);
    } else {
      setQuote(null);
      setToAmount('0');
    }
  }, [fromAmount, fromToken, toToken]);

  const fetchTokens = async () => {
    try {
      const { data } = await swapAPI.getTokens();
      if (data.success) {
        setTokens(data.tokens);
      }
    } catch (error) {
      console.error('Failed to fetch tokens:', error);
      // Fallback to default tokens
      setTokens([
        { symbol: 'ETH', name: 'Ethereum', logo: '⟠' },
        { symbol: 'DAI', name: 'Dai Stablecoin', logo: '◈' },
        { symbol: 'USDC', name: 'USD Coin', logo: '$' }
      ]);
    }
  };

  const getQuote = async () => {
    if (!fromAmount || parseFloat(fromAmount) <= 0) return;
    
    try {
      setLoading(true);
      setQuote(null);

      if (demoMode) {
        // Demo mode - instant quote
        const { data } = await demoAPI.getSwapQuote(fromToken, toToken, fromAmount);
        if (data.success) {
          setQuote(data.quote);
          setToAmount(data.quote.amountOut);
          toast.success('Quote fetched (demo)');
        }
      } else {
        // Real Uniswap quote
        const { data } = await swapAPI.getQuote(fromToken, toToken, fromAmount, network);
        if (data.success) {
          setQuote(data.quote);
          setToAmount(data.quote.amountOut);
          
          // Check if approval needed for token swaps
          if (fromToken !== 'ETH') {
            await checkApproval();
          } else {
            setNeedsApproval(false);
          }
        }
      }
    } catch (error) {
      console.error('Quote error:', error);
      const errorMsg = error.response?.data?.error || error.message || 'Quote failed';
      toast.error(errorMsg);
      setQuote(null);
      setToAmount('0');
    } finally {
      setLoading(false);
    }
  };

  const checkApproval = async () => {
    if (fromToken === 'ETH' || demoMode) {
      setNeedsApproval(false);
      return;
    }
    
    try {
      const tokenInfo = tokens.find(t => t.symbol === fromToken);
      if (!tokenInfo || tokenInfo.address === 'native') return;
      
      const ROUTER_ADDRESS = '0xC532a74256D3Db42D0Bf7a0400fEFDbad7694008';
      
      const { data } = await swapAPI.checkAllowance(
        tokenInfo.address,
        wallet.address,
        ROUTER_ADDRESS,
        network
      );
      
      if (data.success) {
        const allowance = parseFloat(data.allowance);
        const required = parseFloat(fromAmount);
        setNeedsApproval(allowance < required);
      }
    } catch (error) {
      console.error('Allowance check failed:', error);
      setNeedsApproval(true); // Assume approval needed on error
    }
  };

  const handleApprove = async () => {
    if (!password) {
      return toast.error('Please enter your password');
    }
    
    try {
      setApproving(true);
      const tokenInfo = tokens.find(t => t.symbol === fromToken);
      
      const loadingToast = toast.loading('Approving token...');
      
      const { data } = await swapAPI.approveToken(
        password,
        tokenInfo.address,
        'unlimited',
        network
      );
      
      toast.dismiss(loadingToast);
      
      if (data.success) {
        toast.success(`${fromToken} approved successfully!`);
        setNeedsApproval(false);
        setShowPasswordModal(false);
        setPassword('');
      }
    } catch (error) {
      toast.dismiss();
      const errorMsg = error.response?.data?.error || 'Approval failed';
      toast.error(errorMsg);
    } finally {
      setApproving(false);
    }
  };

  const executeSwap = async () => {
    if (!quote) {
      return toast.error('Get a quote first');
    }

    if (!password && !demoMode) {
      return toast.error('Please enter your password');
    }

    if (parseFloat(fromAmount) <= 0) {
      return toast.error('Amount must be greater than 0');
    }

    try {
      setSwapping(true);
      setSwapHash(null);

      if (demoMode) {
        // Demo mode - instant swap
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        const fakeHash = '0x' + Array.from({length: 64}, () => 
          Math.floor(Math.random() * 16).toString(16)
        ).join('');
        
        const demoTx = {
          hash: fakeHash,
          from: wallet.address,
          to: wallet.address,
          fromToken,
          toToken,
          amountIn: fromAmount,
          amountOut: toAmount,
          timestamp: Math.floor(Date.now() / 1000),
          blockNumber: Math.floor(Math.random() * 1000000) + 18000000,
          status: 'success',
          type: 'swap',
          token: `${fromToken}→${toToken}`
        };
        
        addTransaction(demoTx);
        setSwapHash(fakeHash);
        toast.success(`✅ Swapped ${fromAmount} ${fromToken} for ${toAmount} ${toToken}!`);
        
        // Reset
        setFromAmount('0.01');
        setToAmount('0');
        setQuote(null);
        
      } else {
        // Real Uniswap swap
        const loadingToast = toast.loading('Executing swap...');
        
        const swapParams = {
          fromToken,
          toToken,
          amountIn: fromAmount,
          minAmountOut: quote.minAmountOut
        };
        
        const { data } = await swapAPI.executeSwap(
          password,
          swapParams,
          network
        );
        
        toast.dismiss(loadingToast);
        
        if (data.success) {
          const txData = {
            ...data.swap,
            type: 'swap',
            token: `${fromToken}→${toToken}`
          };
          
          addTransaction(txData);
          setSwapHash(data.swap.hash);
          
          toast.success(
            <div>
              Swap executed! 
              <a 
                className="underline ml-2" 
                href={getExplorerUrl(data.swap.hash, network)} 
                target="_blank" 
                rel="noreferrer"
              >
                View
              </a>
            </div>,
            { duration: 7000 }
          );
          
          console.log('✅ Swap successful:', data.swap.hash);
          
          // Reset
          setFromAmount('0.01');
          setToAmount('0');
          setQuote(null);
          setShowPasswordModal(false);
          setPassword('');
        }
      }
    } catch (error) {
      toast.dismiss();
      const errorMsg = error.response?.data?.error || error.message || 'Swap failed';
      toast.error(errorMsg);
      console.error('❌ Swap error:', error);
    } finally {
      setSwapping(false);
    }
  };

  const swapPair = () => {
    setFromToken(toToken);
    setToToken(fromToken);
    setFromAmount(toAmount || '0.01');
    setToAmount(fromAmount);
    setQuote(null);
  };

  const PasswordModal = () => (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 max-w-md w-full">
        <h3 className="text-xl font-bold mb-4">
          {needsApproval ? `Approve ${fromToken}` : 'Confirm Swap'}
        </h3>
        <p className="text-gray-600 mb-4 text-sm">
          {needsApproval 
            ? `You need to approve ${fromToken} spending on Uniswap router before swapping.` 
            : `Swap ${fromAmount} ${fromToken} for approximately ${toAmount} ${toToken}`}
        </p>
        
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500"
            autoFocus
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                needsApproval ? handleApprove() : executeSwap();
              }
            }}
          />
        </div>
        
        <div className="flex gap-3">
          <button
            onClick={() => {
              setShowPasswordModal(false);
              setPassword('');
            }}
            className="flex-1 py-3 border rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={needsApproval ? handleApprove : executeSwap}
            disabled={!password || approving || swapping}
            className="flex-1 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
          >
            {approving ? (
              <>
                <Loader className="w-4 h-4 animate-spin inline mr-2" />
                Approving...
              </>
            ) : swapping ? (
              <>
                <Loader className="w-4 h-4 animate-spin inline mr-2" />
                Swapping...
              </>
            ) : needsApproval ? (
              'Approve'
            ) : (
              'Confirm'
            )}
          </button>
        </div>
      </div>
    </div>
  );

  const tokenList = demoMode 
    ? [
        { symbol: 'ETH', name: 'Ethereum', logo: '⟠' },
        { symbol: 'DAI', name: 'Dai', logo: '◈' },
        { symbol: 'USDC', name: 'USD Coin', logo: '$' }
      ]
    : tokens;

  return (
    <div className="max-w-xl mx-auto bg-white rounded-2xl shadow-xl p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">Swap Tokens</h2>
        <div className="flex items-center gap-2">
          {demoMode && (
            <div className="flex items-center gap-2 text-amber-600 text-sm">
              <Zap className="w-4 h-4" />
              <span>Demo</span>
            </div>
          )}
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
            title="Settings"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="p-4 bg-gray-50 rounded-xl space-y-3">
          <div>
            <label className="block text-sm font-medium mb-2">
              Slippage Tolerance: {slippage}%
            </label>
            <div className="flex gap-2 mb-2">
              {[0.1, 0.5, 1.0, 3.0].map(val => (
                <button
                  key={val}
                  onClick={() => setSlippage(val)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                    slippage === val 
                      ? 'bg-indigo-600 text-white' 
                      : 'bg-white hover:bg-gray-100'
                  }`}
                >
                  {val}%
                </button>
              ))}
            </div>
            <input
              type="range"
              min="0.1"
              max="5"
              step="0.1"
              value={slippage}
              onChange={(e) => setSlippage(parseFloat(e.target.value))}
              className="w-full"
            />
          </div>
        </div>
      )}

      {/* From Token */}
      <div className="p-4 bg-gray-50 rounded-xl">
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm text-gray-600">From</label>
          {fromToken === 'ETH' && (
            <span className="text-xs text-gray-500">
              Balance: {parseFloat(balance).toFixed(6)} ETH
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <input
            type="number"
            value={fromAmount}
            onChange={(e) => setFromAmount(e.target.value)}
            placeholder="0.0"
            className="flex-1 text-2xl font-semibold bg-transparent outline-none"
            step="0.01"
            min="0"
          />
          <select
            value={fromToken}
            onChange={(e) => {
              setFromToken(e.target.value);
              setQuote(null);
            }}
            className="px-4 py-2 bg-white border rounded-lg font-medium"
          >
            {tokenList.filter(t => t.symbol !== toToken).map(token => (
              <option key={token.symbol} value={token.symbol}>
                {token.logo} {token.symbol}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Swap Direction Button */}
      <div className="flex justify-center">
        <button
          onClick={swapPair}
          className="p-3 bg-gray-100 hover:bg-gray-200 rounded-full transition"
          title="Switch tokens"
        >
          <ArrowLeftRight className="w-5 h-5 text-gray-700" />
        </button>
      </div>

      {/* To Token */}
      <div className="p-4 bg-gray-50 rounded-xl">
        <label className="block text-sm text-gray-600 mb-2">To (estimated)</label>
        <div className="flex items-center gap-3">
          <input
            type="text"
            value={toAmount}
            readOnly
            placeholder="0.0"
            className="flex-1 text-2xl font-semibold bg-transparent outline-none text-gray-700"
          />
          <select
            value={toToken}
            onChange={(e) => {
              setToToken(e.target.value);
              setQuote(null);
            }}
            className="px-4 py-2 bg-white border rounded-lg font-medium"
          >
            {tokenList.filter(t => t.symbol !== fromToken).map(token => (
              <option key={token.symbol} value={token.symbol}>
                {token.logo} {token.symbol}
              </option>
            ))}
          </select>
        </div>
        {loading && (
          <div className="flex items-center gap-2 text-xs text-gray-500 mt-2">
            <Loader className="w-3 h-3 animate-spin" />
            Fetching quote...
          </div>
        )}
      </div>

      {/* Quote Info */}
      {quote && !loading && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
          <div className="flex items-start gap-2">
            <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1 text-sm space-y-1">
              <p className="font-medium text-blue-900">Quote Ready</p>
              <div className="text-blue-800 space-y-1">
                <div className="flex justify-between">
                  <span>Rate:</span>
                  <span className="font-medium">
                    1 {fromToken} = {parseFloat(quote.rate).toFixed(4)} {toToken}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Minimum received:</span>
                  <span className="font-medium">{parseFloat(quote.minAmountOut).toFixed(6)} {toToken}</span>
                </div>
                <div className="flex justify-between">
                  <span>Price impact:</span>
                  <span className="font-medium">{quote.priceImpact}</span>
                </div>
                {!demoMode && quote.gasFee && (
                  <div className="flex justify-between">
                    <span>Est. gas fee:</span>
                    <span className="font-medium">{quote.gasFee}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Approval Warning */}
      {needsApproval && !demoMode && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium text-amber-900">Approval Required</p>
            <p className="text-amber-700">
              You need to approve {fromToken} spending before swapping
            </p>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-2">
        <button 
          onClick={getQuote} 
          disabled={loading || !fromAmount || parseFloat(fromAmount) <= 0}
          className="flex-1 px-4 py-3 rounded-xl bg-gray-100 hover:bg-gray-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition"
        >
          {loading && !quote ? (
            <>
              <Loader className="w-4 h-4 animate-spin" />
              Getting Quote...
            </>
          ) : (
            <>
              <RefreshCw className="w-4 h-4" />
              Get Quote
            </>
          )}
        </button>
        
        <button 
          onClick={() => demoMode ? executeSwap() : setShowPasswordModal(true)}
          disabled={!quote || loading || swapping || parseFloat(fromAmount) <= 0}
          className="flex-1 px-4 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition"
        >
          {swapping ? (
            <>
              <Loader className="w-4 h-4 animate-spin" />
              Swapping...
            </>
          ) : needsApproval && !demoMode ? (
            'Approve Token'
          ) : (
            <>
              <ArrowLeftRight className="w-4 h-4" />
              Swap
            </>
          )}
        </button>
      </div>

      {/* Swap Hash */}
      {swapHash && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
          <div className="flex items-start gap-2">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-green-900">Swap Successful!</p>
              <p className="text-sm text-green-800 mt-1 font-mono break-all">
                {swapHash}
              </p>
              {!demoMode && (
                <a
                  href={getExplorerUrl(swapHash, network)}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm text-green-700 hover:underline mt-2 inline-block"
                >
                  View on Explorer →
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Demo Info */}
      {demoMode && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
          <p className="font-medium mb-1">Demo Mode - Mock Exchange Rates:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>1 ETH = 2000 USDC/DAI</li>
            <li>1 USDC = 1 DAI</li>
            <li>0.3% swap fee applied</li>
            <li>Instant execution, no blockchain interaction!</li>
          </ul>
        </div>
      )}

      {/* Real Mode Info */}
      {!demoMode && (
        <div className="text-center text-xs text-gray-500">
          Powered by Uniswap V2 • Trading on {network} testnet
        </div>
      )}

      {/* Password Modal */}
      {showPasswordModal && <PasswordModal />}
    </div>
  );
}
