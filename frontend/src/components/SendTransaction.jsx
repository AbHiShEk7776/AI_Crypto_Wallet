import React, { useState,useEffect } from 'react';
import useWalletStore from '@store/walletStore';
import { useLocation, useNavigate } from 'react-router-dom'; 
import { transactionAPI, demoAPI,contactAPI } from '@services/api';
import toast from 'react-hot-toast';
import { getExplorerUrl } from '@utils/formatters';
import { Send, Loader, CheckCircle, AlertCircle, Zap,Star } from 'lucide-react';


export default function SendTransaction() {
  const { wallet, network, addTransaction, demoMode, balance ,isAuthenticated} = useWalletStore();
  const [to, setTo] = useState('');
  const [value, setValue] = useState('0.001');
  const [estimating, setEstimating] = useState(false);
  const [sending, setSending] = useState(false);
  const [estimate, setEstimate] = useState(null);
  const [simulation, setSimulation] = useState(null);
  const [txHash, setTxHash] = useState(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
const [passwordInput, setPasswordInput] = useState('');
const PasswordModal = () => (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
    <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4">
      <h3 className="text-xl font-bold mb-4">Confirm Transaction</h3>
      <p className="text-gray-600 mb-4">
        Enter your password to sign and send this transaction
      </p>
      
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Password</label>
        <input
          type="password"
          value={passwordInput}
          onChange={(e) => setPasswordInput(e.target.value)}
          placeholder="Enter your password"
          className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500"
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
          className="flex-1 py-2 border rounded-lg hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          onClick={confirmSend}
          disabled={!passwordInput}
          className="flex-1 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
        >
          Confirm & Send
        </button>
      </div>
    </div>
  </div>
);
const validateAddress = (addr) => {
  if (!addr || typeof addr !== 'string') {
    console.log('❌ Address is empty or not a string');
    return false;
  }
  
  
  // Trim whitespace
  const cleaned = addr.trim();
  
  console.log('🔍 Validating address:', cleaned);
  console.log('📏 Length:', cleaned.length);
  
  // Check if starts with 0x
  if (!cleaned.startsWith('0x')) {
    console.log('❌ Address does not start with 0x');
    return false;
  }
  
  // Check length (must be exactly 42)
  if (cleaned.length !== 42) {
    console.log(`❌ Address length is ${cleaned.length} but should be 42`);
    console.log('💡 Copy this correct address: 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb');
    return false;
  }
  
  // Check hex characters
  const hexPart = cleaned.slice(2);
  const isValidHex = /^[a-fA-F0-9]{40}$/.test(hexPart);
  
  if (!isValidHex) {
    console.log('❌ Address contains invalid characters');
    return false;
  }
  
  console.log('✅ Address is valid:', cleaned);
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
        console.log('📊 Demo gas estimate...');
        
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
        
        toast.success('✅ Demo simulation passed');
        console.log('✅ Demo estimate complete');
        
      } else {
        console.log('🌐 Real blockchain estimate...');
        
        const [{ data: gas }, { data: sim }] = await Promise.all([
          transactionAPI.estimateGas(txParams, network),
          transactionAPI.simulate(txParams, network)
        ]);
        
        setEstimate(gas.gasEstimate);
        setSimulation(sim.simulation);
        
        if (!sim.simulation.success) {
          toast.error(sim.simulation.reason || 'Transaction will fail');
        } else {
          toast.success('✅ Simulation passed');
        }
      }
    } catch (e) {
      toast.error(e.message || 'Estimation failed');
      console.error('❌ Estimate error:', e);
    } finally {
      setEstimating(false);
    }
  };

  const handleSend = async () => {
  // Validate address
  if (!validateAddress(to)) {
    toast.error('Invalid recipient address. Must be 42 characters starting with 0x');
    console.log('❌ Address validation failed for:', to);
    return;
  }

  // Validate amount
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

  // Ask for password if not in demo mode
  if (!demoMode) {
    // Show password modal instead of prompt
    setShowPasswordModal(true);
    return;
  }

  // ============================================
  // DEMO MODE (No password required)
  // ============================================
  try {
    setSending(true);
    setTxHash(null);

    console.log('📤 Sending demo transaction...', { from: wallet.address, to, value });
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Generate fake transaction hash
    const fakeHash = '0x' + Array.from({length: 64}, () => 
      Math.floor(Math.random() * 16).toString(16)
    ).join('');
    
    // Create demo transaction object
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
    
    // Add to transaction history
    addTransaction(demoTx);
    
    // Update balance (subtract amount + gas)
    const gasFee = 0.00042;
    const newBalance = (currentBalance - amount - gasFee).toFixed(6);
    useWalletStore.getState().setBalance(newBalance);
    
    setTxHash(fakeHash);
    toast.success(`✅ Sent ${amount} ETH to ${to.slice(0, 6)}...${to.slice(-4)}`);
    
    console.log('✅ Demo transaction created:', demoTx);
    console.log('💰 New balance:', newBalance, 'ETH');
    
    // Reset form
    setTo('');
    setValue('0.001');
    setEstimate(null);
    setSimulation(null);
    
  } catch (error) {
    toast.error(error.message || 'Demo transaction failed');
    console.error('❌ Demo send error:', error);
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

    console.log('🔐 Authenticating and sending transaction...');
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
      
      console.log('✅ Transaction sent:', data.transaction.hash);
      
      // Reset
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
    console.error('❌ Send error:', error);
  } finally {
    setSending(false);
  }
};



 const fillDemoAddress = () => {
  // Ethereum Foundation donation address (verified 42 chars)
  const demoAddr = '0xde0B295669a9FD93d5F28D9Ec85E40f4cb697BAe';
  console.log('📝 Filling demo address:', demoAddr);
  console.log('📏 Length:', demoAddr.length); // Should be 42
  setTo(demoAddr);
};
const location = useLocation();
  const [contacts, setContacts] = useState([]);
  const [showContactDropdown, setShowContactDropdown] = useState(false);

  // Pre-fill from navigation state
  useEffect(() => {
    if (location.state?.recipientAddress) {
      setTo(location.state.recipientAddress);
    }
  }, [location.state]);

  // Fetch contacts for autocomplete
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
    <div className="max-w-xl mx-auto bg-white rounded-2xl shadow-lg p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Send ETH</h2>
        {demoMode && (
          <div className="flex items-center gap-2 text-amber-600 text-sm">
            <Zap className="w-4 h-4" />
            <span>Demo Mode</span>
          </div>
        )}
      </div>
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="block text-sm font-medium">To Address</label>
          {location.state?.recipientName && (
            <span className="text-xs text-indigo-600">
              Sending to: {location.state.recipientName}
            </span>
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
            className="w-full border rounded-lg p-3 font-mono text-sm"
          />
          
          {/* Contact Dropdown */}
          {showContactDropdown && filteredContacts.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-y-auto">
              {filteredContacts.slice(0, 5).map((contact) => (
                <button
                  key={contact._id}
                  onClick={() => handleContactSelect(contact)}
                  className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center gap-3 border-b last:border-0"
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                    {contact.alias[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium">{contact.alias}</p>
                    <p className="text-xs text-gray-500 font-mono truncate">
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

      {/* Current Balance */}
      <div className="p-3 bg-gray-50 rounded-lg">
        <p className="text-sm text-gray-600">Available Balance</p>
        <p className="text-xl font-semibold">{parseFloat(balance).toFixed(6)} ETH</p>
      </div>

      {/* Recipient Address */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="block text-sm font-medium">To Address</label>
          {demoMode && (
            <button 
              onClick={fillDemoAddress}
              className="text-xs text-indigo-600 hover:underline"
            >
              Use demo address
            </button>
          )}
        </div>
        <input 
          value={to} 
          onChange={(e) => setTo(e.target.value)} 
          placeholder="0x..." 
          className="w-full border rounded-lg p-3 font-mono text-sm"
        />
      </div>

      {/* Amount */}
      <div>
        <label className="block text-sm font-medium mb-1">Amount (ETH)</label>
        <div className="relative">
          <input 
            value={value} 
            onChange={(e) => setValue(e.target.value)} 
            type="number" 
            min="0" 
            step="0.0001" 
            className="w-full border rounded-lg p-3 pr-16"
          />
          <button
            onClick={() => setValue(balance)}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-xs bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded"
          >
            MAX
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-1">
          ≈ ${(parseFloat(value) * 2000).toFixed(2)} USD
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <button 
          onClick={handleEstimate} 
          disabled={estimating || sending}
          className="flex-1 px-4 py-3 rounded-lg bg-gray-100 hover:bg-gray-200 font-medium disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {estimating ? (
            <>
              <Loader className="w-4 h-4 animate-spin" />
              Estimating...
            </>
          ) : (
            <>Estimate & Simulate</>
          )}
        </button>
        
        <button 
          onClick={handleSend} 
          disabled={sending || estimating}
          className="flex-1 px-4 py-3 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {sending ? (
            <>
              <Loader className="w-4 h-4 animate-spin" />
              Sending...
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              Send
            </>
          )}
        </button>
      </div>

      {/* Gas Estimate */}
      {estimate && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start gap-2">
            <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-medium text-blue-900">Gas Estimate</p>
              <div className="text-sm text-blue-800 mt-1 space-y-1">
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
        <div className={`p-4 rounded-lg border ${
          simulation.success 
            ? 'bg-green-50 border-green-200' 
            : 'bg-red-50 border-red-200'
        }`}>
          <div className="flex items-start gap-2">
            {simulation.success ? (
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            )}
            <div>
              <p className={`font-medium ${
                simulation.success ? 'text-green-900' : 'text-red-900'
              }`}>
                Simulation: {simulation.success ? 'Success' : 'Will Revert'}
              </p>
              {simulation.reason && (
                <p className="text-sm text-red-800 mt-1">{simulation.reason}</p>
              )}
              {simulation.message && (
                <p className="text-sm text-green-800 mt-1">{simulation.message}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Transaction Hash */}
      {txHash && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-start gap-2">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-green-900">Transaction Sent!</p>
              <p className="text-sm text-green-800 mt-1 font-mono break-all">
                {txHash}
              </p>
              {!demoMode && (
                <a
                  href={getExplorerUrl(txHash, network)}
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
          <p className="font-medium">Demo Mode Tips:</p>
          <ul className="list-disc list-inside mt-1 space-y-1">
            <li>Transactions are instant (no blockchain delay)</li>
            <li>No real ETH is sent</li>
            <li>Balance updates immediately</li>
            <li>Perfect for testing the interface!</li>
          </ul>
        </div>
      )}
      {showPasswordModal && <PasswordModal />}
    </div>
  );
}
