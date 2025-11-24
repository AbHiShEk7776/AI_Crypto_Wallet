import React, { useState } from 'react';
import useWalletStore from '@store/walletStore';
import { dappAPI, transactionAPI, demoAPI } from '@services/api';
import toast from 'react-hot-toast';
import { getExplorerUrl } from '@utils/formatters';
import { ArrowLeftRight, Loader, CheckCircle, Zap } from 'lucide-react';

const TOKENS = ['ETH', 'USDC', 'DAI'];

export default function SwapTokens() {
  const { wallet, network, addTransaction, demoMode, balance } = useWalletStore();
  const [fromToken, setFromToken] = useState('ETH');
  const [toToken, setToToken] = useState('USDC');
  const [amount, setAmount] = useState('0.01');
  const [slippage, setSlippage] = useState(0.5);
  const [quote, setQuote] = useState(null);
  const [loading, setLoading] = useState(false);
  const [swapHash, setSwapHash] = useState(null);

  const getQuote = async () => {
    try {
      setLoading(true);
      setQuote(null);

      if (demoMode) {
        // Demo mode - instant quote
        const { data } = await demoAPI.getSwapQuote(fromToken, toToken, amount);
        if (data.success) {
          setQuote(data.quote);
          toast.success('Quote fetched (demo)');
        }
      } else {
        // Real blockchain quote
        const { data } = await dappAPI.getSwapQuote(fromToken, toToken, amount, network);
        if (data.success) {
          setQuote(data.quote);
          toast.success('Quote fetched');
        }
      }
    } catch (e) {
      toast.error(e.message || 'Quote failed');
      console.error('Quote error:', e);
    } finally {
      setLoading(false);
    }
  };

  const executeSwap = async () => {
    if (!quote) {
      toast.error('Get a quote first');
      return;
    }

    if (parseFloat(amount) <= 0) {
      toast.error('Amount must be greater than 0');
      return;
    }

    try {
      setLoading(true);
      setSwapHash(null);

      if (demoMode) {
        // Demo mode - instant swap
        const { data } = await demoAPI.executeSwap(
          wallet.address,
          fromToken,
          toToken,
          amount
        );

        if (data.success) {
          addTransaction(data.transaction);
          setSwapHash(data.transaction.hash);
          toast.success(`✅ Swapped ${amount} ${fromToken} for ${quote.amountOut} ${toToken}!`);
          
          // Reset
          setAmount('0.01');
          setQuote(null);
        }
      } else {
        // Real blockchain swap (requires approval for ERC-20)
        toast('Building swap transaction...');
        const { data: swapData } = await dappAPI.buildSwapTx(
          fromToken,
          toToken,
          amount,
          wallet.address,
          slippage,
          network
        );

        if (!swapData.success) {
          throw new Error('Failed to build swap transaction');
        }

        // If approval needed (ERC-20 tokens)
        if (swapData.transaction.requiresApproval && fromToken !== 'ETH') {
          toast('Approval required. Please approve first.');
          // In production, handle approval flow here
          return;
        }

        // Send swap transaction
        const { data: txData } = await transactionAPI.send(
          wallet.privateKey,
          swapData.transaction,
          network
        );

        if (txData.success) {
          addTransaction(txData.transaction);
          setSwapHash(txData.transaction.hash);
          toast.success(
            <div>
              Swap successful! 
              <a 
                className="underline ml-2" 
                href={getExplorerUrl(txData.transaction.hash, network)} 
                target="_blank" 
                rel="noreferrer"
              >
                View
              </a>
            </div>
          );
          
          // Reset
          setAmount('0.01');
          setQuote(null);
        }
      }
    } catch (e) {
      toast.error(e.message || 'Swap failed');
      console.error('Swap error:', e);
    } finally {
      setLoading(false);
    }
  };

  const swapPair = () => {
    const temp = fromToken;
    setFromToken(toToken);
    setToToken(temp);
    setQuote(null);
  };

  return (
    <div className="max-w-xl mx-auto bg-white rounded-2xl shadow-lg p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Swap Tokens</h2>
        {demoMode && (
          <div className="flex items-center gap-2 text-amber-600 text-sm">
            <Zap className="w-4 h-4" />
            <span>Demo Mode</span>
          </div>
        )}
      </div>

      {/* From Token */}
      <div className="p-4 bg-gray-50 rounded-lg">
        <label className="block text-sm text-gray-600 mb-2">From</label>
        <div className="flex gap-3">
          <select 
            value={fromToken} 
            onChange={(e) => {
              setFromToken(e.target.value);
              setQuote(null);
            }}
            className="flex-1 border rounded-lg p-3 font-medium"
          >
            {TOKENS.filter(t => t !== toToken).map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
          <input 
            value={amount} 
            onChange={(e) => {
              setAmount(e.target.value);
              setQuote(null);
            }}
            type="number" 
            min="0" 
            step="0.01" 
            className="flex-1 border rounded-lg p-3"
            placeholder="0.0"
          />
        </div>
        {fromToken === 'ETH' && (
          <p className="text-xs text-gray-500 mt-2">
            Balance: {parseFloat(balance).toFixed(6)} ETH
          </p>
        )}
      </div>

      {/* Swap Direction Button */}
      <div className="flex justify-center">
        <button
          onClick={swapPair}
          className="p-3 bg-gray-100 hover:bg-gray-200 rounded-full transition"
        >
          <ArrowLeftRight className="w-5 h-5 text-gray-700" />
        </button>
      </div>

      {/* To Token */}
      <div className="p-4 bg-gray-50 rounded-lg">
        <label className="block text-sm text-gray-600 mb-2">To (estimated)</label>
        <div className="flex gap-3">
          <select 
            value={toToken} 
            onChange={(e) => {
              setToToken(e.target.value);
              setQuote(null);
            }}
            className="flex-1 border rounded-lg p-3 font-medium"
          >
            {TOKENS.filter(t => t !== fromToken).map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
          <div className="flex-1 border rounded-lg p-3 bg-white text-gray-500">
            {quote ? parseFloat(quote.amountOut).toFixed(6) : '0.0'}
          </div>
        </div>
        {quote && (
          <p className="text-xs text-green-600 mt-2">
            {quote.exchangeRate}
          </p>
        )}
      </div>

      {/* Slippage */}
      <div>
        <label className="block text-sm font-medium mb-2">Slippage Tolerance (%)</label>
        <div className="flex gap-2">
          {[0.1, 0.5, 1.0, 3.0].map(val => (
            <button
              key={val}
              onClick={() => setSlippage(val)}
              className={`px-3 py-2 rounded-lg text-sm font-medium ${
                slippage === val 
                  ? 'bg-indigo-600 text-white' 
                  : 'bg-gray-100 hover:bg-gray-200'
              }`}
            >
              {val}%
            </button>
          ))}
          <input
            value={slippage}
            onChange={(e) => setSlippage(parseFloat(e.target.value) || 0.5)}
            type="number"
            min="0"
            max="50"
            step="0.1"
            className="flex-1 border rounded-lg px-3 py-2 text-sm"
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <button 
          onClick={getQuote} 
          disabled={loading}
          className="flex-1 px-4 py-3 rounded-lg bg-gray-100 hover:bg-gray-200 font-medium disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading && !quote ? (
            <>
              <Loader className="w-4 h-4 animate-spin" />
              Loading...
            </>
          ) : (
            <>Get Quote</>
          )}
        </button>
        
        <button 
          onClick={executeSwap} 
          disabled={loading || !quote}
          className="flex-1 px-4 py-3 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading && quote ? (
            <>
              <Loader className="w-4 h-4 animate-spin" />
              Swapping...
            </>
          ) : (
            <>
              <ArrowLeftRight className="w-4 h-4" />
              Swap
            </>
          )}
        </button>
      </div>

      {/* Quote Details */}
      {quote && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg space-y-2">
          <div className="flex items-start gap-2">
            <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1 text-sm text-blue-900 space-y-1">
              <p className="font-medium">Quote Ready</p>
              <div className="space-y-1">
                <p>You'll receive: <span className="font-semibold">{quote.amountOut} {toToken}</span></p>
                <p>Minimum received: {quote.minAmountOut} {toToken}</p>
                <p>Price impact: {quote.priceImpact}</p>
                <p>Rate: {quote.exchangeRate}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Swap Hash */}
      {swapHash && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
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
        <div className="p-3 bg-amber-50 border border-amber-200 rounded text-sm text-amber-800">
          <p className="font-medium">Demo Mode - Mock Exchange Rates:</p>
          <ul className="list-disc list-inside mt-1 space-y-1">
            <li>1 ETH = 2000 USDC/DAI</li>
            <li>1 USDC = 1 DAI</li>
            <li>0.3% swap fee applied</li>
            <li>Instant execution, no blockchain needed!</li>
          </ul>
        </div>
      )}
    </div>
  );
}
