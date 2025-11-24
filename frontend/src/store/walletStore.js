import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useWalletStore = create(
  persist(
    (set, get) => ({
      // User & Auth
      user: null,
      isAuthenticated: false,
      authToken: null,
      
      // Wallet
      wallet: null,
      network: 'sepolia',
      balance: '0',
      transactions: [],
      demoMode: false,
      
      // Actions
      setUser: (user) => set({ 
        user, 
        isAuthenticated: !!user 
      }),
      
      setAuthToken: (token) => {
        if (token) {
          localStorage.setItem('auth_token', token);
        } else {
          localStorage.removeItem('auth_token');
        }
        set({ authToken: token });
      },
      
      setWallet: (wallet) => set({ wallet }),
      setNetwork: (network) => set({ network }),
      setBalance: (balance) => set({ balance }),
      setTransactions: (transactions) => set({ transactions }),
      setDemoMode: (demoMode) => set({ demoMode }),
      addTransaction: (transaction) => set((state) => ({
        transactions: [transaction, ...state.transactions]
      })),
      
      login: (token, user, wallet) => {
        localStorage.setItem('auth_token', token);
        set({
          authToken: token,
          user,
          isAuthenticated: true,
          wallet,
          demoMode: false
        });
      },
      
      logout: () => {
        localStorage.removeItem('auth_token');
        set({
          user: null,
          isAuthenticated: false,
          authToken: null,
          wallet: null,
          balance: '0',
          transactions: [],
          demoMode: false
        });
      },
    }),
    {
      name: 'wallet-storage',
      // Only persist minimal data
      partialize: (state) => ({ 
        network: state.network,
      }),
    }
  )
);

export default useWalletStore;
