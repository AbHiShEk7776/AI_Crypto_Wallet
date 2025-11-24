import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import useWalletStore from '@store/walletStore';
import { walletAPI, demoAPI, transactionAPI } from '@services/api';  // ADD transactionAPI
import toast from 'react-hot-toast';
import { 
  formatNumber, 
  getExplorerUrl, 
  copyToClipboard 
} from '@utils/formatters';
import { 
  MessageSquare, 
  Send, 
  ArrowLeftRight, 
  RefreshCw, 
  ExternalLink, 
  Zap, 
  AlertTriangle, 
  Copy, 
  CheckCircle 
} from 'lucide-react';

export default function Dashboard() {
  const { 
    wallet, 
    network, 
    balance, 
    setBalance, 
    transactions, 
    setTransactions, 
    demoMode,
    isAuthenticated  // ADD THIS
  } = useWalletStore();
  
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showFaucetModal, setShowFaucetModal] = useState(false);

  const isLowBalance = !demoMode && parseFloat(balance) < 0.01;
  const isTestnet = network === 'sepolia';

  // =====================================================
  // Fetch Balance
  // =====================================================
  const fetchBalance = async () => {
    try {
      setLoading(true);

      // DEMO MODE: Set fixed demo balance
      if (demoMode) {
        setBalance('2.5000');
        console.log('✅ Demo balance set to 2.5 ETH');
        setLoading(false);
        return;
      }

      // REAL MODE: Fetch from blockchain
      console.log('Calling getBalance with:', wallet.address, network);

      const { data } = await walletAPI.getBalance(wallet.address, network);

      if (data.success) {
        setBalance(data.balance.balance);
        console.log('✅ Balance fetched:', data.balance.balance);
      }
    } catch (e) {
      console.error('Balance fetch error:', e);
      toast.error('Failed to fetch balance');
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // Fetch Transaction History
  // =====================================================
  const fetchTransactionHistory = async () => {
    try {
      console.log('📜 Fetching transaction history...');

      if (demoMode) {
        // Demo transactions
        const demoTxs = [
          {
            hash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
            from: '0x1111111111111111111111111111111111111111',
            to: wallet.address,
            value: '0.5',
            timestamp: Math.floor(Date.now() / 1000) - 3600,
            blockNumber: 12345678,
            status: 'success',
            type: 'received',
            token: 'ETH',
            network: 'sepolia'
          },
          {
            hash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
            from: wallet.address,
            to: '0x2222222222222222222222222222222222222222',
            value: '0.1',
            timestamp: Math.floor(Date.now() / 1000) - 7200,
            blockNumber: 12345600,
            status: 'success',
            type: 'sent',
            token: 'ETH',
            network: 'sepolia'
          }
        ];
        
        setTransactions(demoTxs);
        console.log('✅ Demo transactions loaded:', demoTxs.length);
        return;
      }

      // REAL MODE: Fetch from database (only if authenticated)
      if (!isAuthenticated) {
        console.log('⚠️ Not authenticated, skipping history fetch');
        return;
      }

      const { data } = await transactionAPI.getHistory({
        limit: 20,
        network: network
      });

      if (data.success) {
        setTransactions(data.transactions);
        console.log('✅ Transaction history loaded:', data.transactions.length);
      }
    } catch (error) {
      console.error('❌ Failed to load transaction history:', error);
      // Don't show error toast - history is non-critical
    }
  };

  // =====================================================
  // Copy Address Handler
  // =====================================================
  const handleCopyAddress = async () => {
    const success = await copyToClipboard(wallet.address);
    if (success) {
      setCopied(true);
      toast.success('Address copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } else {
      toast.error('Failed to copy address');
    }
  };

  // =====================================================
  // Effects
  // =====================================================
  useEffect(() => {
    if (wallet && wallet.address) {
      console.log('🔄 Wallet changed, fetching data...');
      fetchBalance();
      fetchTransactionHistory();
    }
  }, [wallet?.address, network, demoMode, isAuthenticated]);

  // Auto-refresh balance every 30 seconds (only in real mode)
  useEffect(() => {
    if (!demoMode && wallet?.address) {
      const interval = setInterval(() => {
        console.log('🔄 Auto-refreshing balance...');
        fetchBalance();
        fetchTransactionHistory();
      }, 30000); // 30 seconds

      return () => clearInterval(interval);
    }
  }, [wallet?.address, network, demoMode, isAuthenticated]);

  // =====================================================
  // Render
  // =====================================================
  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Demo Mode Banner */}
      {demoMode && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-center gap-3">
          <Zap className="w-5 h-5 text-amber-600" />
          <div>
            <p className="font-medium text-amber-900">Demo Mode Active</p>
            <p className="text-sm text-amber-700">All transactions are simulated. No real blockchain interaction.</p>
          </div>
        </div>
      )}

      {/* Low Balance Warning */}
      {isLowBalance && isTestnet && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-medium text-blue-900">Get Free Testnet ETH</p>
              <p className="text-sm text-blue-700 mt-1">
                You need testnet ETH to send transactions. Current balance: {parseFloat(balance).toFixed(6)} ETH
              </p>
              
              <button
                onClick={() => setShowFaucetModal(true)}
                className="mt-3 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium inline-flex items-center gap-2 transition"
              >
                <ExternalLink className="w-4 h-4" />
                Get Testnet ETH (Free)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Balance Card */}
      <div className="bg-white rounded-2xl shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex-1">
            <p className="text-gray-600 text-sm mb-1">Your Wallet Address</p>
            <div className="flex items-center gap-2">
              <p className="font-mono text-sm">{wallet.address}</p>
              <button
                onClick={handleCopyAddress}
                className="p-1 hover:bg-gray-100 rounded transition"
                title="Copy address"
              >
                {copied ? (
                  <CheckCircle className="w-4 h-4 text-green-600" />
                ) : (
                  <Copy className="w-4 h-4 text-gray-600" />
                )}
              </button>
            </div>
          </div>
          <button 
            onClick={() => {
              fetchBalance();
              fetchTransactionHistory();
            }}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
            disabled={loading}
            title="Refresh"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        <div className="text-center py-6 border-t">
          <p className="text-gray-600 text-sm mb-1">Balance</p>
          <p className="text-4xl font-bold">{formatNumber(balance, 6)} ETH</p>
          <p className="text-gray-500 text-xs mt-1">
            Network: {network} {demoMode && '(Demo)'}
          </p>
          
          {isLowBalance && isTestnet && (
            <button
              onClick={() => setShowFaucetModal(true)}
              className="mt-4 text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Need testnet ETH? Get it free →
            </button>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-3 gap-4">
        <Link
          to="/chat"
          className="bg-white rounded-xl shadow p-6 hover:shadow-lg transition flex flex-col items-center gap-3 group"
        >
          <MessageSquare className="w-8 h-8 text-indigo-600 group-hover:scale-110 transition" />
          <span className="font-medium">AI Chat</span>
        </Link>
        <Link
          to="/send"
          className="bg-white rounded-xl shadow p-6 hover:shadow-lg transition flex flex-col items-center gap-3 group"
        >
          <Send className="w-8 h-8 text-indigo-600 group-hover:scale-110 transition" />
          <span className="font-medium">Send</span>
        </Link>
        <Link
          to="/swap"
          className="bg-white rounded-xl shadow p-6 hover:shadow-lg transition flex flex-col items-center gap-3 group"
        >
          <ArrowLeftRight className="w-8 h-8 text-indigo-600 group-hover:scale-110 transition" />
          <span className="font-medium">Swap</span>
        </Link>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white rounded-2xl shadow p-6">
        <h2 className="text-xl font-bold mb-4">Recent Transactions</h2>
        
        {transactions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No transactions yet</p>
            <p className="text-sm mt-2">Send your first transaction to get started!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {transactions.slice(0, 5).map((tx) => (
              <div
                key={tx.hash}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    tx.type === 'received' ? 'bg-green-100' : 'bg-blue-100'
                  }`}>
                    {tx.type === 'received' ? '↓' : '↑'}
                  </div>
                  <div>
                    <p className="font-medium">
                      {tx.type === 'received' ? 'Received' : 'Sent'}
                    </p>
                    <p className="text-xs text-gray-500 font-mono">
                      {tx.hash.slice(0, 10)}...{tx.hash.slice(-8)}
                    </p>
                  </div>
                </div>
                
                <div className="text-right">
                  <p className="font-semibold">
                    {tx.type === 'received' ? '+' : '-'}{tx.value} {tx.token || 'ETH'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(tx.timestamp * 1000).toLocaleDateString()}
                  </p>
                </div>
                
                {!demoMode && (
                  <a
                    href={getExplorerUrl(tx.hash, network)}
                    target="_blank"
                    rel="noreferrer"
                    className="ml-2 p-2 hover:bg-white rounded transition"
                  >
                    <ExternalLink className="w-4 h-4 text-gray-600" />
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Faucet Modal */}
      {showFaucetModal && (
        <FaucetModal
          address={wallet.address}
          network={network}
          onClose={() => setShowFaucetModal(false)}
          onSuccess={() => {
            setShowFaucetModal(false);
            setTimeout(() => {
              fetchBalance();
              fetchTransactionHistory();
            }, 3000);
          }}
        />
      )}
    </div>
  );
}
function FaucetModal({ address, network, onClose, onSuccess }) {
  const [copied, setCopied] = useState(false);

  const faucets = {
    sepolia: [
      {
        name: 'Chainlink Faucet',
        url: 'https://faucets.chain.link/sepolia',
        amount: '0.1 ETH',
        requires: 'Captcha only',
        recommended: true,
        speed: 'Instant',
        badge: 'EASIEST'
      },
      {
        name: 'Sepolia PoW Faucet',
        url: 'https://sepolia-faucet.pk910.de',
        amount: 'Unlimited (mine)',
        requires: 'Nothing',
        recommended: true,
        speed: 'Continuous',
        badge: 'BEST AMOUNT'
      },
      {
        name: 'Google Cloud Faucet',
        url: 'https://cloud.google.com/application/web3/faucet/ethereum/sepolia',
        amount: '0.5 ETH/day',
        requires: 'Google account',
        speed: '1-2 min'
      },
      {
        name: 'QuickNode Faucet',
        url: 'https://faucet.quicknode.com/ethereum/sepolia',
        amount: '0.1 ETH',
        requires: 'Twitter account',
        speed: 'Instant'
      },
      {
        name: 'Infura Faucet',
        url: 'https://www.infura.io/faucet/sepolia',
        amount: '0.5 ETH/day',
        requires: 'Infura account (free)',
        speed: '1-2 min'
      },
      {
        name: 'LearnWeb3 Faucet',
        url: 'https://learnweb3.io/faucets/sepolia',
        amount: '0.5 ETH',
        requires: 'Free email signup',
        speed: 'Instant'
      }
    ]
  };

  const handleCopy = async () => {
    const success = await copyToClipboard(address);
    if (success) {
      setCopied(true);
      toast.success('Address copied!');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const currentFaucets = faucets[network] || [];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b sticky top-0 bg-white">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Get Free Testnet ETH</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition text-2xl"
            >
              ×
            </button>
          </div>
          <p className="text-sm text-gray-600 mt-2">
            Visit any faucet below to get free {network} testnet ETH. You'll need to paste your wallet address.
          </p>
        </div>

        {/* Your Address */}
        <div className="p-6 bg-gray-50">
          <p className="text-sm font-medium text-gray-700 mb-2">Your Wallet Address (Copy this):</p>
          <div className="flex items-center gap-2 p-3 bg-white rounded-lg border">
            <code className="flex-1 text-sm font-mono break-all">{address}</code>
            <button
              onClick={handleCopy}
              className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium flex items-center gap-2 flex-shrink-0 transition"
            >
              {copied ? (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Copy
                </>
              )}
            </button>
          </div>
        </div>

        {/* Faucet List */}
        <div className="p-6">
          <h3 className="font-semibold mb-4">Available Faucets:</h3>
          <div className="space-y-3">
            {currentFaucets.map((faucet, idx) => (
              <div
                key={idx}
                className={`p-4 border-2 rounded-lg hover:bg-gray-50 transition ${
                  faucet.recommended ? 'border-green-500 bg-green-50' : 'border-gray-200'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-semibold text-gray-900">{faucet.name}</h4>
                      {faucet.recommended && (
                        <span className="px-2 py-1 bg-green-600 text-white text-xs rounded-full">
                          Recommended
                        </span>
                      )}
                      {faucet.badge && (
                        <span className="px-2 py-1 bg-blue-600 text-white text-xs rounded-full">
                          {faucet.badge}
                        </span>
                      )}
                    </div>
                    <div className="mt-2 space-y-1">
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Amount:</span> {faucet.amount}
                      </p>
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Requires:</span> {faucet.requires}
                      </p>
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Speed:</span> {faucet.speed}
                      </p>
                    </div>
                  </div>
                  <a
                    href={faucet.url}
                    target="_blank"
                    rel="noreferrer"
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium flex items-center gap-2 flex-shrink-0 transition"
                  >
                    Visit
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Instructions */}
        <div className="p-6 bg-blue-50 border-t">
          <h3 className="font-semibold text-blue-900 mb-2">📋 Quick Instructions:</h3>
          <ol className="list-decimal list-inside space-y-1 text-sm text-blue-800">
            <li>Click "Copy" above to copy your wallet address</li>
            <li>Click "Visit" on any faucet (Chainlink recommended)</li>
            <li>Paste your address on the faucet website</li>
            <li>Complete any verification (login/captcha)</li>
            <li>Request testnet ETH</li>
            <li>Wait 1-2 minutes for ETH to arrive</li>
            <li>Come back and click "Refresh" on your dashboard</li>
          </ol>
        </div>

        {/* Footer */}
        <div className="p-6 border-t flex justify-end">
          <button
            onClick={onSuccess}
            className="px-6 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg font-medium transition"
          >
            Done - Refresh Balance
          </button>
        </div>
      </div>
    </div>
  );
}