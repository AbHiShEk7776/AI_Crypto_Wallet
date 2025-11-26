import React, { useState, useEffect } from 'react';
import useWalletStore from '@store/walletStore';
import { useLocation, useNavigate } from 'react-router-dom';
import { transactionAPI, demoAPI, contactAPI } from '@services/api';
import toast from 'react-hot-toast';
import { getExplorerUrl } from '@utils/formatters';
import { 
  Send, 
  Loader, 
  CheckCircle, 
  AlertCircle, 
  Zap, 
  Star,
  Sparkles,
  Shield,
  Info,
  ArrowRight,
  TrendingUp,
  X
} from 'lucide-react';

export default function SendTransaction() {
  const { wallet, network, addTransaction, demoMode, balance, isAuthenticated } = useWalletStore();
  const [to, setTo] = useState('');
  const [value, setValue] = useState('0.001');
  const [estimating, setEstimating] = useState(false);
  const [sending, setSending] = useState(false);
  const [estimate, setEstimate] = useState(null);
  const [simulation, setSimulation] = useState(null);
  const [txHash, setTxHash] = useState(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const location = useLocation();
  const [contacts, setContacts] = useState([]);
  const [showContactDropdown, setShowContactDropdown] = useState(false);

  // Password Modal Component
  const PasswordModal = () => (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
      <div className="glass-dark border border-white/20 rounded-3xl p-8 max-w-md w-full mx-4 shadow-dark-lg">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 gradient-primary rounded-xl flex items-center justify-center">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">Confirm Transaction</h3>
            <p className="text-sm text-white/60">Enter your password to sign</p>
          </div>
        </div>
        
        <div className="mb-6">
          <label className="block text-sm font-semibold text-white/90 mb-2">Password</label>
          <input
            type="password"
            value={passwordInput}
            onChange={(e) => setPasswordInput(e.target.value)}
            placeholder="Enter your password"
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
            autoFocus
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                confirmSend();
              }
            }}
          />
        </div>
        
        <div className="flex gap-3">
          <button
            onClick={() => {
              setShowPasswordModal(false);
              setPasswordInput('');
            }}
            className="flex-1 py-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl font-semibold text-white transition"
          >
            Cancel
          </button>
          <button
            onClick={confirmSend}
            disabled={!passwordInput}
            className="flex-1 py-3 gradient-primary text-white rounded-xl font-semibold hover:shadow-lg transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Shield className="w-4 h-4" />
            Confirm
          </button>
        </div>
      </div>
    </div>
  );

  const validateAddress = (addr) => {
    if (!addr || typeof addr !== 'string') {
      console.log(' Address is empty or not a string');
      return false;
    }
    
    const cleaned = addr.trim();
    console.log(' Validating address:', cleaned);
    
    if (!cleaned.startsWith('0x')) {
      console.log(' Address does not start with 0x');
      return false;
    }
    
    if (cleaned.length !== 42) {
      console.log(` Address length is ${cleaned.length} but should be 42`);
      return false;
    }
    
    const hexPart = cleaned.slice(2);
    const isValidHex = /^[a-fA-F0-9]{40}$/.test(hexPart);
    
    if (!isValidHex) {
      console.log(' Address contains invalid characters');
      return false;
    }
    
    console.log(' Address is valid:', cleaned);
    return true;
  };

  const buildTx = () => ({
    from: wallet.address,
    to,
    value
  });

  const handleEstimate = async () => {
    if (!validateAddress(to)) {
      toast.error('Invalid address. Must be 42 characters starting with 0x');
      return;
    }

    if (parseFloat(value) <= 0) {
      toast.error('Amount must be greater than 0');
      return;
    }

    try {
      setEstimating(true);
      const txParams = buildTx();

      if (demoMode) {
        console.log(' Demo gas estimate...');
        await new Promise(resolve => setTimeout(resolve, 800));
        
        setEstimate({
          gasLimit: '21000',
          gasEstimate: '21000',
          estimatedCost: '0.00042'
        });
        
        setSimulation({ 
          success: true, 
          message: 'Demo transaction will succeed' 
        });
        
        toast.success(' Demo simulation passed');
      } else {
        console.log(' Real blockchain estimate...');
        
        const [{ data: gas }, { data: sim }] = await Promise.all([
          transactionAPI.estimateGas(txParams, network),
          transactionAPI.simulate(txParams, network)
        ]);
        
        setEstimate(gas.gasEstimate);
        setSimulation(sim.simulation);
        
        if (!sim.simulation.success) {
          toast.error(sim.simulation.reason || 'Transaction will fail');
        } else {
          toast.success(' Simulation passed');
        }
      }
    } catch (e) {
      toast.error(e.message || 'Estimation failed');
      console.error(' Estimate error:', e);
    } finally {
      setEstimating(false);
    }
  };

  const handleSend = async () => {
    if (!validateAddress(to)) {
      toast.error('Invalid recipient address. Must be 42 characters starting with 0x');
      return;
    }

    const amount = parseFloat(value);
    const currentBalance = parseFloat(balance);

    if (amount > currentBalance) {
      toast.error(`Insufficient balance. You have ${currentBalance} ETH`);
      return;
    }

    if (amount <= 0) {
      toast.error('Amount must be greater than 0');
      return;
    }

    if (!demoMode) {
      setShowPasswordModal(true);
      return;
    }

    // Demo mode transaction
    try {
      setSending(true);
      setTxHash(null);

      console.log('📤 Sending demo transaction...');
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const fakeHash = '0x' + Array.from({length: 64}, () => 
        Math.floor(Math.random() * 16).toString(16)
      ).join('');
      
      const demoTx = {
        hash: fakeHash,
        from: wallet.address,
        to: to,
        value: value,
        valueWei: (amount * 1e18).toString(),
        gasUsed: '21000',
        effectiveGasPrice: '20000000000',
        status: 'success',
        blockNumber: Math.floor(Math.random() * 1000000) + 18000000,
        blockHash: '0x' + Array.from({length: 64}, () => 
          Math.floor(Math.random() * 16).toString(16)
        ).join(''),
        confirmations: 1,
        timestamp: Math.floor(Date.now() / 1000),
        token: 'ETH',
        type: 'sent'
      };
      
      addTransaction(demoTx);
      
      const gasFee = 0.00042;
      const newBalance = (currentBalance - amount - gasFee).toFixed(6);
      useWalletStore.getState().setBalance(newBalance);
      
      setTxHash(fakeHash);
      toast.success(` Sent ${amount} ETH to ${to.slice(0, 6)}...${to.slice(-4)}`);
      
      setTo('');
      setValue('0.001');
      setEstimate(null);
      setSimulation(null);
      
    } catch (error) {
      toast.error(error.message || 'Demo transaction failed');
    } finally {
      setSending(false);
    }
  };

  const confirmSend = async () => {
    if (!passwordInput) {
      return toast.error('Please enter your password');
    }

    try {
      setShowPasswordModal(false);
      setSending(true);
      setTxHash(null);

      const loadingToast = toast.loading('Sending transaction...');

      const txParams = {
        to: to,
        value: value
      };

      const { data } = await transactionAPI.sendWithPassword(
        passwordInput,
        txParams,
        network
      );

      toast.dismiss(loadingToast);

      if (data.success) {
        const txData = {
          ...data.transaction,
          token: 'ETH',
          type: 'sent',
          timestamp: data.transaction.timestamp || Math.floor(Date.now() / 1000)
        };
        
        addTransaction(txData);
        setTxHash(data.transaction.hash);
        
        toast.success(
          <div>
            Transaction sent! 
            <a 
              className="underline ml-2" 
              href={getExplorerUrl(data.transaction.hash, network)} 
              target="_blank" 
              rel="noreferrer"
            >
              View on Explorer
            </a>
          </div>,
          { duration: 7000 }
        );
        
        setTo('');
        setValue('0.001');
        setEstimate(null);
        setSimulation(null);
        setPasswordInput('');
      }
    } catch (error) {
      toast.dismiss();
      const errorMsg = error.response?.data?.error || error.message || 'Transaction failed';
      toast.error(errorMsg);
    } finally {
      setSending(false);
    }
  };

  const fillDemoAddress = () => {
    const demoAddr = '0xde0B295669a9FD93d5F28D9Ec85E40f4cb697BAe';
    setTo(demoAddr);
  };

  useEffect(() => {
    if (location.state?.recipientAddress) {
      setTo(location.state.recipientAddress);
    }
  }, [location.state]);

  useEffect(() => {
    if (isAuthenticated && !demoMode) {
      fetchContacts();
    }
  }, [isAuthenticated, demoMode]);

  const fetchContacts = async () => {
    try {
      const { data } = await contactAPI.getAll();
      if (data.success) {
        setContacts(data.contacts);
      }
    } catch (error) {
      console.error('Failed to load contacts:', error);
    }
  };

  const handleContactSelect = (contact) => {
    setTo(contact.walletAddress);
    setShowContactDropdown(false);
  };

  const filteredContacts = contacts.filter(c =>
    c.alias.toLowerCase().includes(to.toLowerCase()) ||
    c.walletAddress.toLowerCase().includes(to.toLowerCase())
  );

  return (
    <div className="min-h-screen pb-20">
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        
        {/* Header */}
        <div className="animate-fade-in">
          <h1 className="text-3xl font-bold text-white mb-2">Send Crypto</h1>
          <p className="text-white/70">Transfer tokens securely to any address</p>
        </div>

        {/* Main Card */}
        <div className="glass-dark rounded-3xl shadow-dark-lg p-8 space-y-6 border border-white/10 animate-fade-in">
          
          {/* Demo Mode Badge */}
          {demoMode && (
            <div className="flex items-center gap-2 px-4 py-2 bg-amber-500/20 border border-amber-500/30 rounded-xl">
              <Zap className="w-5 h-5 text-amber-400" />
              <span className="text-sm font-semibold text-amber-300">Demo Mode Active</span>
            </div>
          )}

          {/* Current Balance */}
          <div className="p-5 bg-white/5 border border-white/10 rounded-2xl">
            <p className="text-sm text-white/60 mb-1">Available Balance</p>
            <p className="text-3xl font-bold text-white">{parseFloat(balance).toFixed(6)} ETH</p>
            <p className="text-sm text-white/50 mt-1">
              ≈ ${(parseFloat(balance) * 2000).toFixed(2)} USD
            </p>
          </div>

          {/* Recipient Address */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-semibold text-white/90">
                Recipient Address
              </label>
              {location.state?.recipientName && (
                <span className="text-xs px-2 py-1 bg-indigo-500/20 text-indigo-300 rounded-lg">
                  To: {location.state.recipientName}
                </span>
              )}
              {demoMode && (
                <button 
                  onClick={fillDemoAddress}
                  className="text-xs text-indigo-400 hover:text-indigo-300 font-medium transition"
                >
                  Use demo address
                </button>
              )}
            </div>
            <div className="relative">
              <input 
                value={to} 
                onChange={(e) => {
                  setTo(e.target.value);
                  setShowContactDropdown(e.target.value.length > 0 && !demoMode);
                }}
                onFocus={() => setShowContactDropdown(to.length > 0 && !demoMode)}
                placeholder="0x... or contact name" 
                className="w-full px-4 py-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 font-mono text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition"
              />
              
              {/* Contact Dropdown */}
              {showContactDropdown && filteredContacts.length > 0 && (
                <div className="absolute z-10 w-full mt-2 glass-dark border border-white/20 rounded-2xl shadow-dark-lg max-h-60 overflow-y-auto">
                  {filteredContacts.slice(0, 5).map((contact) => (
                    <button
                      key={contact._id}
                      onClick={() => handleContactSelect(contact)}
                      className="w-full px-4 py-3 text-left hover:bg-white/10 flex items-center gap-3 border-b border-white/5 last:border-0 transition"
                    >
                      <div className="w-10 h-10 gradient-pink rounded-xl flex items-center justify-center text-white font-bold">
                        {contact.alias[0].toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-white">{contact.alias}</p>
                        <p className="text-xs text-white/50 font-mono truncate">
                          {contact.walletAddress}
                        </p>
                      </div>
                      {contact.favorite && (
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm font-semibold text-white/90 mb-3">Amount</label>
            <div className="relative">
              <input 
                value={value} 
                onChange={(e) => setValue(e.target.value)} 
                type="number" 
                min="0" 
                step="0.0001" 
                className="w-full px-4 py-4 pr-20 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 text-2xl font-semibold focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition"
                placeholder="0.0"
              />
              <button
                onClick={() => setValue(balance)}
                className="absolute right-3 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 rounded-lg text-xs font-bold transition"
              >
                MAX
              </button>
            </div>
            <p className="text-sm text-white/50 mt-2">
              ≈ ${(parseFloat(value) * 2000).toFixed(2)} USD
            </p>
          </div>

          {/* Info Box */}
          <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-2xl">
            <div className="flex gap-3">
              <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-200">
                <p className="font-medium mb-1">Transaction Details</p>
                <ul className="space-y-1 text-blue-200/80">
                  <li>• Estimated gas fee: ~0.00042 ETH</li>
                  <li>• Network: {network}</li>
                  <li>• Confirmation time: ~15 seconds</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button 
              onClick={handleEstimate} 
              disabled={estimating || sending}
              className="flex-1 py-4 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl font-semibold text-white disabled:opacity-50 transition flex items-center justify-center gap-2"
            >
              {estimating ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  Estimating...
                </>
              ) : (
                <>
                  <TrendingUp className="w-5 h-5" />
                  Estimate
                </>
              )}
            </button>
            
            <button 
              onClick={handleSend} 
              disabled={sending || estimating}
              className="flex-1 py-4 gradient-orange text-white rounded-xl font-bold disabled:opacity-50 hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2 group"
            >
              {sending ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  Send Transaction
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </div>

          {/* Gas Estimate */}
          {estimate && (
            <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-2xl">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold text-blue-300">Gas Estimate</p>
                  <div className="text-sm text-blue-200/90 mt-1 space-y-1">
                    <p>Gas Limit: {estimate.gasLimit || estimate}</p>
                    {estimate.estimatedCost && (
                      <p>Estimated Cost: {estimate.estimatedCost} ETH</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Simulation Result */}
          {simulation && (
            <div className={`p-4 rounded-2xl border ${
              simulation.success 
                ? 'bg-green-500/10 border-green-500/30' 
                : 'bg-red-500/10 border-red-500/30'
            }`}>
              <div className="flex items-start gap-3">
                {simulation.success ? (
                  <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                )}
                <div>
                  <p className={`font-semibold ${
                    simulation.success ? 'text-green-300' : 'text-red-300'
                  }`}>
                    Simulation: {simulation.success ? 'Success' : 'Will Revert'}
                  </p>
                  {simulation.reason && (
                    <p className="text-sm text-red-200 mt-1">{simulation.reason}</p>
                  )}
                  {simulation.message && (
                    <p className="text-sm text-green-200 mt-1">{simulation.message}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Transaction Hash */}
          {txHash && (
            <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-2xl">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-green-300">Transaction Sent!</p>
                  <p className="text-sm text-green-200 mt-1 font-mono break-all">
                    {txHash}
                  </p>
                  {!demoMode && (
                    <a
                      href={getExplorerUrl(txHash, network)}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm text-green-300 hover:text-green-200 mt-2 inline-flex items-center gap-1 transition"
                    >
                      View on Explorer
                      <ArrowRight className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Demo Info */}
          {demoMode && (
            <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl">
              <div className="flex gap-3">
                <Sparkles className="w-5 h-5 text-amber-400 flex-shrink-0" />
                <div className="text-sm text-amber-200">
                  <p className="font-semibold mb-2">Demo Mode Tips:</p>
                  <ul className="space-y-1 text-amber-200/80">
                    <li>• Transactions are instant (no blockchain delay)</li>
                    <li>• No real ETH is sent</li>
                    <li>• Balance updates immediately</li>
                    <li>• Perfect for testing the interface!</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {showPasswordModal && <PasswordModal />}
    </div>
  );
}
