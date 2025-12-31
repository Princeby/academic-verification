// src/store/wallet.store.ts
import { create } from 'zustand';

interface Account {
  address: string;
  name?: string;
  source?: string;
}

interface WalletState {
  isConnected: boolean;
  account: Account | null;
  accounts: Account[];
  balance: string;
  disconnectWallet: () => void;
  selectAccount: (address: string) => void;
  setBalance: (balance: string) => void;
}

export const useWalletStore = create<WalletState>()((set, get) => ({
  isConnected: false,
  account: null,
  accounts: [],
  balance: '0',

  disconnectWallet: () => {
    set({
      isConnected: false,
      account: null,
      accounts: [],
      balance: '0',
    });
    localStorage.removeItem('wallet_address');
  },

  selectAccount: (address: string) => {
    const account = get().accounts.find(acc => acc.address === address);
    if (account) {
      set({ account });
      localStorage.setItem('wallet_address', address);
    }
  },

  setBalance: (balance: string) => {
    set({ balance });
  },
}));