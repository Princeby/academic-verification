import { createContext, useContext, ReactNode } from 'react';
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
  const enableWallet = async () => {
    try {
      // Dynamic import to avoid build issues
      const { web3Accounts, web3Enable } = await import('@polkadot/extension-dapp');
      
      console.log('🔌 Attempting to connect to wallet extension...');
      
      // Request access to extensions (supports Polkadot.js, Talisman, SubWallet, etc.)
      const extensions = await web3Enable('Academic Verify');
      
      if (extensions.length === 0) {
        toast.error('No wallet extension found', {
          description: 'Please install Polkadot.js, Talisman, or SubWallet'
        });
        return;
      }

      console.log(`✅ Found ${extensions.length} wallet extension(s)`);

      // Get all accounts from all extensions
      const allAccounts = await web3Accounts();
      
      if (allAccounts.length === 0) {
        toast.error('No accounts found', {
          description: 'Please create an account in your wallet extension'
        });
        return;
      }

      console.log(`✅ Found ${allAccounts.length} account(s)`);

      // Connect to the first account (in production, show account selector)
      const account = allAccounts[0];
      
      useWalletStore.setState({
        isConnected: true,
        account: {
          address: account.address,
          name: account.meta.name as string | undefined,
          source: account.meta.source as string | undefined,
        },
        accounts: allAccounts.map(acc => ({
          address: acc.address,
          name: acc.meta.name as string | undefined,
          source: acc.meta.source as string | undefined,
        })),
      });

      toast.success('Wallet connected', {
        description: `Connected to ${account.meta.name || 'account'}`
      });
    } catch (error) {
      console.error('Failed to enable wallet:', error);
      
      if (error instanceof Error && error.message.includes('Rejected')) {
        toast.error('Connection rejected', {
          description: 'Please approve the connection request'
        });
      } else {
        toast.error('Failed to connect wallet', {
          description: 'Please make sure your wallet extension is unlocked'
        });
      }
    }
  };

  return (
    <WalletContext.Provider value={{ enableWallet }}>
      {children}
    </WalletContext.Provider>
  );
}