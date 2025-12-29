
// wallet.store.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

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
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  selectAccount: (address: string) => void;
  setBalance: (balance: string) => void;
}

export const useWalletStore = create<WalletState>()(
  persist(
    (set, get) => ({
      isConnected: false,
      account: null,
      accounts: [],
      balance: '0',

      connectWallet: async () => {
        try {
          // This will be implemented with actual Polkadot extension logic
          console.log('Connecting wallet...');
          
          // Mock connection for now
          const mockAccount = {
            address: '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY',
            name: 'Alice',
            source: 'polkadot-js',
          };
          
          set({
            isConnected: true,
            account: mockAccount,
            accounts: [mockAccount],
          });
        } catch (error) {
          console.error('Failed to connect wallet:', error);
          throw error;
        }
      },

      disconnectWallet: () => {
        set({
          isConnected: false,
          account: null,
          accounts: [],
          balance: '0',
        });
      },

      selectAccount: (address: string) => {
        const account = get().accounts.find(acc => acc.address === address);
        if (account) {
          set({ account });
        }
      },

      setBalance: (balance: string) => {
        set({ balance });
      },
    }),
    {
      name: 'wallet-storage',
      partialize: (state) => ({
        account: state.account,
      }),
    }
  )
);