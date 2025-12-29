// WalletProvider.tsx
import { createContext, useContext, useEffect, ReactNode } from 'react';
import { web3Accounts, web3Enable, web3FromAddress } from '@polkadot/extension-dapp';
import { useWalletStore } from '@/store/wallet.store';
import { toast } from 'sonner';

interface WalletContextType {
  enableWallet: () => Promise<void>;
}

const WalletContext = createContext<WalletContextType>({
  enableWallet: async () => {},
});

export const useWalletContext = () => useContext(WalletContext);

interface WalletProviderProps {
  children: ReactNode;
}

export function WalletProvider({ children }: WalletProviderProps) {
  const { isConnected } = useWalletStore();

  const enableWallet = async () => {
    try {
      // Request access to extension
      const extensions = await web3Enable('Academic Verify');
      
      if (extensions.length === 0) {
        toast.error('No extension found. Please install Polkadot.js extension');
        return;
      }

      // Get all accounts
      const allAccounts = await web3Accounts();
      
      if (allAccounts.length === 0) {
        toast.error('No accounts found. Please create an account in your wallet');
        return;
      }

      // For now, just connect to the first account
      // In production, you'd show a modal to select account
      const account = allAccounts[0];
      
      useWalletStore.setState({
        isConnected: true,
        account: {
          address: account.address,
          name: account.meta.name,
          source: account.meta.source,
        },
        accounts: allAccounts.map(acc => ({
          address: acc.address,
          name: acc.meta.name,
          source: acc.meta.source,
        })),
      });

      toast.success('Wallet connected successfully');
    } catch (error) {
      console.error('Failed to enable wallet:', error);
      toast.error('Failed to connect wallet');
    }
  };

  // Auto-connect if previously connected
  useEffect(() => {
    if (isConnected) {
      enableWallet();
    }
  }, []);

  return (
    <WalletContext.Provider value={{ enableWallet }}>
      {children}
    </WalletContext.Provider>
  );
}