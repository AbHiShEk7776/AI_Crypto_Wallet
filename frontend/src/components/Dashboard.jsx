import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import useWalletStore from '@store/walletStore';
import { walletAPI, demoAPI, transactionAPI } from '@services/api';
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
  CheckCircle,
  Wallet,
  Eye,
  EyeOff,
  ArrowUpRight,
  ArrowDownLeft,
  TrendingUp,
  Users,
  Clock,
  Sparkles
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
    isAuthenticated
  } = useWalletStore();
  
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showFaucetModal, setShowFaucetModal] = useState(false);
  const [balanceVisible, setBalanceVisible] = useState(true);

  const isLowBalance = !demoMode && parseFloat(balance) < 0.01;
  const isTestnet = network === 'sepolia';

  // Fetch Balance
  const fetchBalance = async () => {
    try {
      setLoading(true);

      if (demoMode) {
        setBalance('2.5000');
        console.log(' Demo balance set to 2.5 ETH');
        setLoading(false);
        return;
      }

      console.log('Calling getBalance with:', wallet.address, network);
      const { data } = await walletAPI.getBalance(wallet.address, network);

      if (data.success) {
        setBalance(data.balance.balance);
        console.log(' Balance fetched:', data.balance.balance);
      }
    } catch (e) {
      console.error('Balance fetch error:', e);
      toast.error('Failed to fetch balance');
    } finally {
      setLoading(false);
    }
  };

  // Fetch Transaction History
  const fetchTransactionHistory = async () => {
    try {
      console.log(' Fetching transaction history...');

      if (demoMode) {
        const demoTxs = [
          {
            hash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
            from: '0x1111111111111111111111111111111111111111',
            to: wallet.address,
            value: '0.5',
            timestamp: Date.now() - 3600000,
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
            timestamp: Date.now() - 7200000,
            blockNumber: 12345600,
            status: 'success',
            type: 'sent',
            token: 'ETH',
            network: 'sepolia'
          }
        ];
        
        setTransactions(demoTxs);
        console.log(' Demo transactions loaded:', demoTxs.length);
        return;
      }

      if (!isAuthenticated) {
        console.log(' Not authenticated, skipping history fetch');
        return;
      }

      const { data } = await transactionAPI.getHistory({
        limit: 20,
        network: network
      });

      if (data.success) {
        setTransactions(data.transactions);
        console.log(' Transaction history loaded:', data.transactions.length);
      }
    } catch (error) {
      console.error(' Failed to load transaction history:', error);
    }
  };

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

  useEffect(() => {
    if (wallet && wallet.address) {
      console.log(' Wallet changed, fetching data...');
      fetchBalance();
      fetchTransactionHistory();
    }
  }, [wallet?.address, network, demoMode, isAuthenticated]);

  useEffect(() => {
    if (!demoMode && wallet?.address) {
      const interval = setInterval(() => {
        console.log(' Auto-refreshing balance...');
        fetchBalance();
        fetchTransactionHistory();
      }, 30000);

      return () => clearInterval(interval);
    }
  }, [wallet?.address, network, demoMode, isAuthenticated]);

  // Calculate stats
  const stats = {
    sent: transactions.filter(tx => tx.type === 'sent').length,
    received: transactions.filter(tx => tx.type === 'received').length,
    total: transactions.length
  };

  return (
    <div className="min-h-screen pb-20">
      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        
        {/* Demo Mode Banner */}
        {demoMode && (
          <div className="glass-light border border-amber-500/30 rounded-2xl p-4 flex items-center gap-3 animate-fade-in">
            <div className="w-10 h-10 bg-amber-500/20 rounded-xl flex items-center justify-center">
              <Zap className="w-6 h-6 text-amber-400" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-amber-300">Demo Mode Active</p>
              <p className="text-sm text-amber-200/80">All transactions are simulated. No real blockchain interaction.</p>
            </div>
          </div>
        )}

        {/* Low Balance Warning */}
        {isLowBalance && isTestnet && (
          <div className="glass-light border border-blue-500/30 rounded-2xl p-4 animate-fade-in">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-6 h-6 text-blue-400" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-blue-300">Get Free Testnet ETH</p>
                <p className="text-sm text-blue-200/80 mt-1">
                  You need testnet ETH to send transactions. Current balance: {parseFloat(balance).toFixed(6)} ETH
                </p>
                
                <button
                  onClick={() => setShowFaucetModal(true)}
                  className="mt-3 px-4 py-2 gradient-blue text-white rounded-xl text-sm font-semibold inline-flex items-center gap-2 hover:shadow-lg transition"
                >
                  <ExternalLink className="w-4 h-4" />
                  Get Testnet ETH (Free)
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Balance Card - Large & Prominent */}
        <div className="relative overflow-hidden rounded-3xl gradient-primary p-8 text-white shadow-dark-lg animate-fade-in">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-white rounded-full blur-3xl"></div>
          </div>

          <div className="relative z-10">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Wallet className="w-5 h-5" />
                <span className="text-sm font-medium opacity-90">Total Balance</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setBalanceVisible(!balanceVisible)}
                  className="p-2 hover:bg-white/10 rounded-lg transition"
                >
                  {balanceVisible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>
                {demoMode && (
                  <div className="flex items-center gap-1 px-2 py-1 bg-amber-500/20 rounded-full">
                    <Zap className="w-3 h-3" />
                    <span className="text-xs font-medium">Demo</span>
                  </div>
                )}
                <button 
                  onClick={() => {
                    fetchBalance();
                    fetchTransactionHistory();
                  }}
                  className="p-2 hover:bg-white/10 rounded-lg transition"
                  disabled={loading}
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            {/* Balance */}
            <div className="mb-6">
              <div className="text-5xl font-bold mb-2">
                {balanceVisible ? (
                  <>{parseFloat(balance).toFixed(4)} <span className="text-2xl opacity-80">ETH</span></>
                ) : (
                  '••••••'
                )}
              </div>
              <p className="text-lg opacity-75">
                {balanceVisible && `≈ $${(parseFloat(balance) * 2000).toFixed(2)} USD`}
              </p>
            </div>

            {/* Wallet Address */}
            <div className="flex items-center gap-2 p-3 bg-white/10 rounded-xl backdrop-blur">
              <code className="text-sm flex-1 font-mono">
                {wallet.address.slice(0, 10)}...{wallet.address.slice(-8)}
              </code>
              <button
                onClick={handleCopyAddress}
                className="p-2 hover:bg-white/10 rounded-lg transition"
              >
                {copied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-fade-in">
          <Link
            to="/send"
            className="group relative overflow-hidden glass-dark rounded-2xl p-6 shadow-dark hover:shadow-dark-lg transition-all duration-300 card-hover border border-white/10"
          >
            <div className="absolute top-0 right-0 w-20 h-20 bg-orange-500/20 rounded-full blur-2xl"></div>
            <div className="relative z-10">
              <div className="w-12 h-12 gradient-orange rounded-2xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <Send className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-bold text-white">Send</h3>
              <p className="text-xs text-white/60 mt-1">Transfer tokens</p>
            </div>
          </Link>

          <Link
            to="/swap"
            className="group relative overflow-hidden glass-dark rounded-2xl p-6 shadow-dark hover:shadow-dark-lg transition-all duration-300 card-hover border border-white/10"
          >
            <div className="absolute top-0 right-0 w-20 h-20 bg-purple-500/20 rounded-full blur-2xl"></div>
            <div className="relative z-10">
              <div className="w-12 h-12 gradient-purple rounded-2xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <ArrowLeftRight className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-bold text-white">Swap</h3>
              <p className="text-xs text-white/60 mt-1">Exchange tokens</p>
            </div>
          </Link>

          <Link
            to="/contacts"
            className="group relative overflow-hidden glass-dark rounded-2xl p-6 shadow-dark hover:shadow-dark-lg transition-all duration-300 card-hover border border-white/10"
          >
            <div className="absolute top-0 right-0 w-20 h-20 bg-pink-500/20 rounded-full blur-2xl"></div>
            <div className="relative z-10">
              <div className="w-12 h-12 gradient-pink rounded-2xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <Users className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-bold text-white">Contacts</h3>
              <p className="text-xs text-white/60 mt-1">Address book</p>
            </div>
          </Link>

          <Link
            to="/chat"
            className="group relative overflow-hidden glass-dark rounded-2xl p-6 shadow-dark hover:shadow-dark-lg transition-all duration-300 card-hover border border-white/10"
          >
            <div className="absolute top-0 right-0 w-20 h-20 bg-blue-500/20 rounded-full blur-2xl"></div>
            <div className="relative z-10">
              <div className="w-12 h-12 gradient-blue rounded-2xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <MessageSquare className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-bold text-white">AI Chat</h3>
              <p className="text-xs text-white/60 mt-1">Smart assistant</p>
            </div>
          </Link>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-4 animate-fade-in">
          <div className="glass-dark rounded-2xl p-5 shadow-dark border border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-500/20 rounded-xl flex items-center justify-center">
                <ArrowDownLeft className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats.received}</p>
                <p className="text-xs text-white/60">Received</p>
              </div>
            </div>
          </div>

          <div className="glass-dark rounded-2xl p-5 shadow-dark border border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-500/20 rounded-xl flex items-center justify-center">
                <ArrowUpRight className="w-5 h-5 text-orange-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats.sent}</p>
                <p className="text-xs text-white/60">Sent</p>
              </div>
            </div>
          </div>

          <div className="glass-dark rounded-2xl p-5 shadow-dark border border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-500/20 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-indigo-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats.total}</p>
                <p className="text-xs text-white/60">Total</p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="glass-dark rounded-2xl shadow-dark p-6 border border-white/10 animate-fade-in">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white">Recent Activity</h2>
            <Link
              to="/history"
              className="text-sm font-medium text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition"
            >
              View All
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <div className="w-12 h-12 border-4 border-white/20 border-t-indigo-500 rounded-full animate-spin mx-auto mb-3"></div>
              <p className="text-white/60">Loading...</p>
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="w-8 h-8 text-white/40" />
              </div>
              <p className="text-white/70">No transactions yet</p>
              <p className="text-sm text-white/50 mt-1">Send your first transaction to get started!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {transactions.slice(0, 5).map((tx) => (
                <div
                  key={tx.hash}
                  className="flex items-center gap-4 p-4 bg-white/5 hover:bg-white/10 rounded-xl transition cursor-pointer group border border-white/5"
                  onClick={() => !demoMode && window.open(getExplorerUrl(tx.hash, network), '_blank')}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    tx.type === 'received' ? 'bg-green-500/20' : 
                    tx.type === 'swap' ? 'bg-purple-500/20' : 'bg-orange-500/20'
                  }`}>
                    {tx.type === 'received' ? (
                      <ArrowDownLeft className="w-5 h-5 text-green-400" />
                    ) : tx.type === 'swap' ? (
                      <ArrowLeftRight className="w-5 h-5 text-purple-400" />
                    ) : (
                      <ArrowUpRight className="w-5 h-5 text-orange-400" />
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-white capitalize">{tx.type}</p>
                    <p className="text-sm text-white/50 font-mono truncate">
                      {tx.hash.slice(0, 10)}...{tx.hash.slice(-8)}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="font-semibold text-white">
                      {tx.type === 'received' ? '+' : '-'}{tx.value} {tx.token || 'ETH'}
                    </p>
                    <p className="text-xs text-white/50">
                      {new Date(tx.timestamp).toLocaleDateString()}
                    </p>
                  </div>

                  {!demoMode && (
                    <ExternalLink className="w-4 h-4 text-white/40 opacity-0 group-hover:opacity-100 transition" />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
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

// Faucet Modal Component
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
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="glass-dark border border-white/20 rounded-3xl shadow-dark-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-white/10 sticky top-0 glass-dark">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white">Get Free Testnet ETH</h2>
              <p className="text-sm text-white/60 mt-1">
                Visit any faucet below to get free {network} testnet ETH
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg transition text-white text-2xl"
            >
              ×
            </button>
          </div>
        </div>

        {/* Your Address */}
        <div className="p-6 bg-white/5">
          <p className="text-sm font-semibold text-white/90 mb-2">Your Wallet Address (Copy this):</p>
          <div className="flex items-center gap-2 p-3 bg-white/10 rounded-xl border border-white/20">
            <code className="flex-1 text-sm font-mono break-all text-white">{address}</code>
            <button
              onClick={handleCopy}
              className="px-3 py-2 gradient-primary text-white rounded-lg text-sm font-semibold flex items-center gap-2 flex-shrink-0 hover:shadow-lg transition"
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
          <h3 className="font-semibold text-white mb-4">Available Faucets:</h3>
          <div className="space-y-3">
            {currentFaucets.map((faucet, idx) => (
              <div
                key={idx}
                className={`p-4 rounded-xl border transition ${
                  faucet.recommended 
                    ? 'border-green-500/30 bg-green-500/10' 
                    : 'border-white/10 bg-white/5 hover:bg-white/10'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <h4 className="font-semibold text-white">{faucet.name}</h4>
                      {faucet.recommended && (
                        <span className="px-2 py-1 bg-green-500/20 text-green-300 text-xs rounded-full font-semibold">
                          Recommended
                        </span>
                      )}
                      {faucet.badge && (
                        <span className="px-2 py-1 bg-blue-500/20 text-blue-300 text-xs rounded-full font-semibold">
                          {faucet.badge}
                        </span>
                      )}
                    </div>
                    <div className="space-y-1 text-sm text-white/70">
                      <p><span className="font-medium">Amount:</span> {faucet.amount}</p>
                      <p><span className="font-medium">Requires:</span> {faucet.requires}</p>
                      <p><span className="font-medium">Speed:</span> {faucet.speed}</p>
                    </div>
                  </div>
                  <a
                    href={faucet.url}
                    target="_blank"
                    rel="noreferrer"
                    className="px-4 py-2 gradient-primary text-white rounded-xl text-sm font-semibold flex items-center gap-2 flex-shrink-0 hover:shadow-lg transition"
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
        <div className="p-6 bg-blue-500/10 border-t border-white/10">
          <h3 className="font-semibold text-blue-300 mb-3 flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            Quick Instructions:
          </h3>
          <ol className="list-decimal list-inside space-y-2 text-sm text-blue-200/90">
            <li>Click "Copy" above to copy your wallet address</li>
            <li>Click "Visit" on any faucet (Chainlink recommended)</li>
            <li>Paste your address on the faucet website</li>
            <li>Complete any verification (login/captcha)</li>
            <li>Request testnet ETH</li>
            <li>Wait 1-2 minutes for ETH to arrive</li>
            <li>Come back and click "Done" below</li>
          </ol>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-white/10 flex justify-end">
          <button
            onClick={onSuccess}
            className="px-6 py-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl font-semibold text-white transition"
          >
            Done - Refresh Balance
          </button>
        </div>
      </div>
    </div>
  );
}
