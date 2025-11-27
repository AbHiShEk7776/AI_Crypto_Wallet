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
  RefreshCw,
  Shield,
  TrendingUp,
  Sparkles,
  ArrowDown,
  Info,
  X
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
      }, 500);

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
        const { data } = await demoAPI.getSwapQuote(fromToken, toToken, fromAmount);
        if (data.success) {
          setQuote(data.quote);
          setToAmount(data.quote.amountOut);
          toast.success('Quote fetched (demo)');
        }
      } else {
        const { data } = await swapAPI.getQuote(fromToken, toToken, fromAmount, network);
        if (data.success) {
          setQuote(data.quote);
          setToAmount(data.quote.amountOut);

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
      setNeedsApproval(true);
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
        await new Promise(resolve => setTimeout(resolve, 1500));

        const fakeHash = '0x' + Array.from({ length: 64 }, () =>
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
        toast.success(` Swapped ${fromAmount} ${fromToken} for ${toAmount} ${toToken}!`);

        setFromAmount('0.01');
        setToAmount('0');
        setQuote(null);

      } else {
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
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="glass-dark border border-white/20 rounded-3xl p-8 max-w-md w-full shadow-dark-lg">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 gradient-purple rounded-xl flex items-center justify-center">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">
              {needsApproval ? `Approve ${fromToken}` : 'Confirm Swap'}
            </h3>
            <p className="text-sm text-white/60">Enter password to proceed</p>
          </div>
        </div>

        <div className="mb-6 p-4 bg-white/5 border border-white/10 rounded-xl">
          <p className="text-sm text-white/80">
            {needsApproval
              ? `Approve ${fromToken} spending on Uniswap router before swapping.`
              : `Swap ${fromAmount} ${fromToken} for ~${toAmount} ${toToken}`}
          </p>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-semibold text-white/90 mb-2">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
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
            className="flex-1 py-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl font-semibold text-white transition"
          >
            Cancel
          </button>
          <button
            onClick={needsApproval ? handleApprove : executeSwap}
            disabled={!password || approving || swapping}
            className="flex-1 py-3 gradient-purple text-white rounded-xl font-semibold hover:shadow-lg transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {approving ? (
              <>
                <Loader className="w-4 h-4 animate-spin" />
                Approving...
              </>
            ) : swapping ? (
              <>
                <Loader className="w-4 h-4 animate-spin" />
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
    <div className="min-h-screen pb-20">
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">

        {/* Header */}
        <div className="animate-fade-in">
          <h1 className="text-3xl font-bold text-white mb-2">Swap Tokens</h1>
          <p className="text-white/70">Exchange tokens at the best rates</p>
        </div>

        {/* Main Card */}
        <div className="glass-dark rounded-3xl shadow-dark-lg p-8 space-y-6 border border-white/10 animate-fade-in">

          {/* Header Row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ArrowLeftRight className="w-6 h-6 text-white" />
              {demoMode && (
                <div className="flex items-center gap-2 px-3 py-1 bg-amber-500/20 border border-amber-500/30 rounded-lg">
                  <Zap className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-semibold text-amber-300">Demo</span>
                </div>
              )}
            </div>
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 hover:bg-white/10 rounded-lg transition"
              title="Settings"
            >
              <Settings className="w-5 h-5 text-white" />
            </button>
          </div>

          {/* Settings Panel */}
          {showSettings && (
            <div className="p-5 bg-white/5 border border-white/10 rounded-2xl space-y-4 animate-fade-in">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-white">Slippage Tolerance</h3>
                <button onClick={() => setShowSettings(false)}>
                  <X className="w-4 h-4 text-white/60 hover:text-white" />
                </button>
              </div>
              <div className="flex gap-2">
                {[0.1, 0.5, 1.0, 3.0].map(val => (
                  <button
                    key={val}
                    onClick={() => setSlippage(val)}
                    className={`flex-1 px-3 py-2 rounded-xl text-sm font-semibold transition ${slippage === val
                      ? 'gradient-purple text-white'
                      : 'bg-white/10 hover:bg-white/20 text-white/80'
                      }`}
                  >
                    {val}%
                  </button>
                ))}
              </div>
              <div>
                <input
                  type="range"
                  min="0.1"
                  max="5"
                  step="0.1"
                  value={slippage}
                  onChange={(e) => setSlippage(parseFloat(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-white/50 mt-1">
                  <span>0.1%</span>
                  <span className="font-semibold text-white/80">{slippage}%</span>
                  <span>5%</span>
                </div>
              </div>
            </div>
          )}

          {/* From Token */}
          <div className="p-6 bg-white/5 border border-white/10 rounded-2xl">
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-semibold text-white/80">From</label>
              {fromToken === 'ETH' && (
                <span className="text-xs text-white/50">
                  Balance: {parseFloat(balance).toFixed(6)} ETH
                </span>
              )}
            </div>
            <div className="flex items-center gap-4">
              <input
                type="number"
                value={fromAmount}
                onChange={(e) => setFromAmount(e.target.value)}
                placeholder="0.0"
                className="flex-1 min-w-[120px] text-3xl font-bold bg-transparent outline-none text-white placeholder-white/30"
                step="0.01"
                min="0"
              />
              <select
                value={fromToken}
                onChange={(e) => {
                  setFromToken(e.target.value);
                  setQuote(null);
                }}
                className="min-w-[130px] max-w-[150px] px-4 py-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl font-semibold text-white cursor-pointer transition truncate"
              >
                {tokenList.filter(t => t.symbol !== toToken).map(token => (
                  <option
                    key={token.symbol}
                    value={token.symbol}
                    className="bg-slate-800 truncate"
                  >
                    {token.logo} {token.symbol}
                  </option>
                ))}
              </select>

            </div>
          </div>

          {/* Swap Direction Button */}
          <div className="flex justify-center -my-3 relative z-10">
            <button
              onClick={swapPair}
              className="p-3 gradient-purple rounded-2xl hover:shadow-lg transition-all duration-300 hover:scale-110"
              title="Switch tokens"
            >
              <ArrowDown className="w-6 h-6 text-white" />
            </button>
          </div>

          {/* To Token */}
          <div className="p-6 bg-white/5 border border-white/10 rounded-2xl">
            <label className="block text-sm font-semibold text-white/80 mb-3">To (estimated)</label>
            <div className="flex items-center gap-4">
              <input
                type="text"
                value={toAmount}
                readOnly
                placeholder="0.0"
                className="flex-1 min-w-[120px] text-3xl font-bold bg-transparent outline-none text-white placeholder-white/30"
              />
              <select
                value={toToken}
                onChange={(e) => {
                  setToToken(e.target.value);
                  setQuote(null);
                }}
                className="min-w-[130px] max-w-[150px] px-4 py-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl font-semibold text-white cursor-pointer transition truncate"
              >
                {tokenList.filter(t => t.symbol !== fromToken).map(token => (
                  <option
                    key={token.symbol}
                    value={token.symbol}
                    className="bg-slate-800 truncate"
                  >
                    {token.logo} {token.symbol}
                  </option>
                ))}
              </select>

            </div>
            {loading && (
              <div className="flex items-center gap-2 text-xs text-white/50 mt-3">
                <Loader className="w-3 h-3 animate-spin" />
                Fetching best quote...
              </div>
            )}
          </div>

          {/* Quote Info */}
          {quote && !loading && (
            <div className="p-5 bg-blue-500/10 border border-blue-500/30 rounded-2xl animate-fade-in">
              <div className="flex items-start gap-3">
                <TrendingUp className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1 space-y-2">
                  <p className="font-semibold text-blue-300">Quote Ready</p>
                  <div className="text-sm text-blue-200/90 space-y-1.5">
                    <div className="flex justify-between">
                      <span>Rate:</span>
                      <span className="font-semibold">
                        1 {fromToken} = {parseFloat(quote.rate).toFixed(4)} {toToken}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Minimum received:</span>
                      <span className="font-semibold">{parseFloat(quote.minAmountOut).toFixed(6)} {toToken}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Price impact:</span>
                      <span className="font-semibold">{quote.priceImpact}</span>
                    </div>
                    {!demoMode && quote.gasFee && (
                      <div className="flex justify-between">
                        <span>Est. gas fee:</span>
                        <span className="font-semibold">{quote.gasFee}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Approval Warning */}
          {needsApproval && !demoMode && (
            <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-start gap-3 animate-fade-in">
              <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-semibold text-amber-300">Approval Required</p>
                <p className="text-amber-200/80">
                  You need to approve {fromToken} spending before swapping
                </p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={getQuote}
              disabled={loading || !fromAmount || parseFloat(fromAmount) <= 0}
              className="flex-1 py-4 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl font-semibold text-white disabled:opacity-50 transition flex items-center justify-center gap-2"
            >
              {loading && !quote ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  Getting Quote...
                </>
              ) : (
                <>
                  <RefreshCw className="w-5 h-5" />
                  Get Quote
                </>
              )}
            </button>

            <button
              onClick={() => demoMode ? executeSwap() : setShowPasswordModal(true)}
              disabled={!quote || loading || swapping || parseFloat(fromAmount) <= 0}
              className="flex-1 py-4 gradient-purple text-white rounded-xl font-bold disabled:opacity-50 hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2"
            >
              {swapping ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  Swapping...
                </>
              ) : needsApproval && !demoMode ? (
                <>
                  <Shield className="w-5 h-5" />
                  Approve Token
                </>
              ) : (
                <>
                  <ArrowLeftRight className="w-5 h-5" />
                  Swap Tokens
                </>
              )}
            </button>
          </div>

          {/* Swap Hash */}
          {swapHash && (
            <div className="p-5 bg-green-500/10 border border-green-500/30 rounded-2xl animate-fade-in">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-green-300">Swap Successful!</p>
                  <p className="text-sm text-green-200 mt-1 font-mono break-all">
                    {swapHash}
                  </p>
                  {!demoMode && (
                    <a
                      href={getExplorerUrl(swapHash, network)}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm text-green-300 hover:text-green-200 mt-2 inline-flex items-center gap-1 transition"
                    >
                      View on Explorer
                      <ArrowLeftRight className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Info Cards */}
          {demoMode ? (
            <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl">
              <div className="flex gap-3">
                <Sparkles className="w-5 h-5 text-amber-400 flex-shrink-0" />
                <div className="text-sm text-amber-200">
                  <p className="font-semibold mb-2">Demo Mode - Mock Rates:</p>
                  <ul className="space-y-1 text-amber-200/80">
                    <li>• 1 ETH = 2000 USDC/DAI</li>
                    <li>• 1 USDC = 1 DAI</li>
                    <li>• 0.3% swap fee applied</li>
                    <li>• Instant execution!</li>
                  </ul>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2 text-xs text-white/50">
              <Info className="w-3 h-3" />
              <span>Powered by Uniswap V2 • Trading on {network} testnet</span>
            </div>
          )}
        </div>
      </div>

      {/* Password Modal */}
      {showPasswordModal && <PasswordModal />}
    </div>
  );
}
