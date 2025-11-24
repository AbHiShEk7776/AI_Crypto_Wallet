import { useState, useEffect, useCallback } from 'react';
import { walletAPI, transactionAPI } from '@services/api';
import useWalletStore from '@store/walletStore';
import toast from 'react-hot-toast';
import { parseError } from '@utils/formatters';

/**
 * Custom hook for wallet operations
 * Provides wallet management functionality with loading states
 */

export const useWallet = () => {
  const {
    wallet,
    balance,
    network,
    transactions,
    setWallet,
    setBalance,
    setNetwork,
    setTransactions,
    addTransaction,
    clearWallet,
    isConnected
  } = useWalletStore();

  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  /**
   * Fetch balance for current wallet
   */
  const fetchBalance = useCallback(async (tokenAddress = null) => {
    if (!wallet?.address) return;

    try {
      setRefreshing(true);
      const { data } = await walletAPI.getBalance(
        wallet.address,
        network,
        tokenAddress
      );

      if (data.success) {
        setBalance(data.balance.balance);
      }
    } catch (error) {
      console.error('Balance fetch error:', error);
      toast.error(parseError(error));
    } finally {
      setRefreshing(false);
    }
  }, [wallet?.address, network, setBalance]);

  /**
   * Fetch transaction history
   */
  const fetchTransactions = useCallback(async (limit = 10) => {
    if (!wallet?.address) return;

    try {
      const { data } = await walletAPI.getHistory(
        wallet.address,
        network,
        limit
      );

      if (data.success) {
        setTransactions(data.transactions);
      }
    } catch (error) {
      console.error('Transaction history fetch error:', error);
    }
  }, [wallet?.address, network, setTransactions]);

  /**
   * Generate new wallet
   */
  const generateWallet = async () => {
    try {
      setLoading(true);
      const { data } = await walletAPI.generate();

      if (data.success) {
        setWallet(data.wallet);
        toast.success('Wallet created successfully!');
        return data.wallet;
      }
    } catch (error) {
      toast.error(parseError(error));
      throw error;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Recover wallet from mnemonic
   */
  const recoverWallet = async (mnemonic) => {
    try {
      setLoading(true);
      const { data } = await walletAPI.recover(mnemonic);

      if (data.success) {
        setWallet(data.wallet);
        toast.success('Wallet recovered successfully!');
        return data.wallet;
      }
    } catch (error) {
      toast.error(parseError(error));
      throw error;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Send transaction
   */
  const sendTransaction = async (txParams) => {
    if (!wallet?.privateKey) {
      toast.error('Wallet not connected');
      return;
    }

    try {
      setLoading(true);

      // Estimate gas first
      const gasEstimate = await transactionAPI.estimateGas(
        txParams,
        network
      );

      // Simulate transaction
      const simulation = await transactionAPI.simulate(
        txParams,
        network
      );

      if (!simulation.data.success) {
        throw new Error(simulation.data.error || 'Transaction will fail');
      }

      // Send transaction
      const { data } = await transactionAPI.send(
        wallet.privateKey,
        txParams,
        network
      );

      if (data.success) {
        addTransaction(data.transaction);
        toast.success('Transaction sent successfully!');
        
        // Refresh balance
        setTimeout(() => fetchBalance(), 2000);
        
        return data.transaction;
      }
    } catch (error) {
      toast.error(parseError(error));
      throw error;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Disconnect wallet
   */
  const disconnect = () => {
    clearWallet();
    toast.success('Wallet disconnected');
  };

  /**
   * Switch network
   */
  const switchNetwork = (newNetwork) => {
    setNetwork(newNetwork);
    toast.success(`Switched to ${newNetwork}`);
    fetchBalance();
  };

  // Auto-fetch balance and transactions on mount
  useEffect(() => {
    if (isConnected()) {
      fetchBalance();
      fetchTransactions();
    }
  }, [isConnected, fetchBalance, fetchTransactions]);

  return {
    wallet,
    balance,
    network,
    transactions,
    loading,
    refreshing,
    isConnected: isConnected(),
    generateWallet,
    recoverWallet,
    sendTransaction,
    fetchBalance,
    fetchTransactions,
    disconnect,
    switchNetwork
  };
};
