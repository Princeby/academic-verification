// src/providers/WalletProvider.tsx
import { createContext, useContext, ReactNode, useEffect } from 'react';
import { useWalletStore } from '@/store/wallet.store';
import { toast } from 'sonner';

interface WalletContextType {
  enableWallet: () => Promise<void>;
  selectAccount: (address: string) => void;
}

const WalletContext = createContext<WalletContextType>({
  enableWallet: async () => {},
  selectAccount: () => {},
});

export const useWalletContext = () => useContext(WalletContext);

interface WalletProviderProps {
  children: ReactNode;
}

export function WalletProvider({ children }: WalletProviderProps) {
  // Check for previously connected wallet on mount
  useEffect(() => {
    const checkConnection = async () => {
      try {
        const { web3Enable, web3Accounts } = await import('@polkadot/extension-dapp');
        
        // Check if extension is already authorized
        const extensions = await web3Enable('Academic Verify');
        
        if (extensions.length > 0) {
          const allAccounts = await web3Accounts();
          
          if (allAccounts.length > 0) {
            const savedAddress = localStorage.getItem('wallet_address');
            const account = savedAddress 
              ? allAccounts.find(acc => acc.address === savedAddress) || allAccounts[0]
              : allAccounts[0];
            
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
          }
        }
      } catch (error) {
        // Extension not available or not authorized
        console.log('No wallet extension found or not authorized');
      }
    };
    
    checkConnection();
  }, []);

  const enableWallet = async () => {
    try {
      // Dynamic import to avoid build issues
      const { web3Accounts, web3Enable } = await import('@polkadot/extension-dapp');
      
      console.log('🔌 Attempting to connect to wallet extension...');
      
      // Request access to extensions (supports Polkadot.js, Talisman, SubWallet, etc.)
      const extensions = await web3Enable('Academic Verify');
      
      if (extensions.length === 0) {
        toast.error('No wallet extension found', {
          description: 'Please install Polkadot.js, Talisman, or SubWallet extension',
          duration: 5000,
        });
        
        // Open extension installation page
        setTimeout(() => {
          window.open('https://polkadot.js.org/extension/', '_blank');
        }, 1000);
        return;
      }

      console.log(`✅ Found ${extensions.length} wallet extension(s)`);

      // Get all accounts from all extensions
      const allAccounts = await web3Accounts();
      
      if (allAccounts.length === 0) {
        toast.error('No accounts found', {
          description: 'Please create an account in your wallet extension',
          duration: 5000,
        });
        return;
      }

      console.log(`✅ Found ${allAccounts.length} account(s)`);

      // Connect to the first account (in production, show account selector)
      const account = allAccounts[0];
      
      // Save connection state
      localStorage.setItem('wallet_address', account.address);
      
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
        description: `Connected to ${account.meta.name || 'account'}`,
      });
    } catch (error) {
      console.error('Failed to enable wallet:', error);
      
      if (error instanceof Error) {
        if (error.message.includes('Rejected')) {
          toast.error('Connection rejected', {
            description: 'Please approve the connection request in your wallet',
          });
        } else if (error.message.includes('pending authorization')) {
          toast.warning('Authorization pending', {
            description: 'Please check your wallet extension',
          });
        } else {
          toast.error('Failed to connect wallet', {
            description: error.message,
          });
        }
      } else {
        toast.error('Failed to connect wallet', {
          description: 'Please make sure your wallet extension is unlocked',
        });
      }
    }
  };

  const selectAccount = (address: string) => {
    const { accounts } = useWalletStore.getState();
    const account = accounts.find(acc => acc.address === address);
    
    if (account) {
      localStorage.setItem('wallet_address', address);
      useWalletStore.setState({ account });
      toast.success('Account switched', {
        description: `Switched to ${account.name || address.slice(0, 8) + '...'}`,
      });
    }
  };

  return (
    <WalletContext.Provider value={{ enableWallet, selectAccount }}>
      {children}
    </WalletContext.Provider>
  );
}