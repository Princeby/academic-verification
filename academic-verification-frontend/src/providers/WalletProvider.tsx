// src/providers/WalletProvider.tsx - Updated with DID checking
import { createContext, useContext, ReactNode, useEffect } from 'react';
import { useWalletStore } from '@/store/wallet.store';
import { useDIDStore } from '@/store/did.store';
import { usePolkadotContext } from './PolkadotProvider';
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
  const { api, isReady } = usePolkadotContext();
  
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

            // After wallet connects, check for DID on blockchain
            if (isReady && api) {
              checkDIDOnBlockchain(account.address);
            }
          }
        }
      } catch (error) {
        console.log('No wallet extension found or not authorized');
      }
    };
    
    checkConnection();
  }, [isReady, api]);

  // Check if DID exists on blockchain when wallet connects or blockchain becomes ready
  useEffect(() => {
    const { account } = useWalletStore.getState();
    if (isReady && api && account?.address) {
      checkDIDOnBlockchain(account.address);
    }
  }, [isReady, api]);

  // Function to check if DID exists on blockchain
  const checkDIDOnBlockchain = async (address: string) => {
    if (!api || !isReady) return;

    try {
      console.log('🔍 Checking for existing DID on blockchain for:', address);

      // Query the blockchain for DID
      const didDoc = await api.query.did?.didDocuments(address);
      
      if (didDoc && !didDoc.isEmpty) {
        const didData = didDoc.toJSON() as any;
        console.log('✅ Found existing DID on blockchain:', didData);

        // Update DID store with blockchain data
        const publicKeys = didData.publicKeys?.map((key: any, index: number) => ({
          id: key.keyId || `key_${index}`,
          keyType: key.keyType || 'Ed25519',
          publicKey: key.publicKey || '',
          addedAt: didData.createdAt || Date.now(),
        })) || [];

        useDIDStore.getState().setDID(address, publicKeys);
        useDIDStore.getState().setStatus(didData.active ? 'active' : 'inactive');

        // Check if this is an institution
        const institution = await api.query.did?.institutions(address);
        if (institution && !institution.isEmpty) {
          const instData = institution.toJSON() as any;
          console.log('🏛️ Found institution data:', instData);
          useDIDStore.getState().setInstitution(instData.name || 'Institution');
        }

        toast.success('DID loaded from blockchain', {
          description: `Found your existing DID: ${address.slice(0, 8)}...`,
        });
      } else {
        console.log('ℹ️ No DID found on blockchain for this address');
        
        // Check local storage for DID (in case blockchain is unavailable)
        const localDID = useDIDStore.getState();
        if (localDID.didAddress === address && localDID.hasDID) {
          console.log('📦 Using DID from local storage');
          toast.info('Using locally stored DID', {
            description: 'Blockchain connection unavailable',
          });
        } else {
          // Clear any stale DID data
          useDIDStore.getState().clearDID();
        }
      }
    } catch (error) {
      console.error('❌ Error checking DID on blockchain:', error);
      
      // Fall back to local storage
      const localDID = useDIDStore.getState();
      if (localDID.didAddress === address && localDID.hasDID) {
        console.log('📦 Using DID from local storage (blockchain query failed)');
      }
    }
  };

  const enableWallet = async () => {
    try {
      // Dynamic import to avoid build issues
      const { web3Accounts, web3Enable } = await import('@polkadot/extension-dapp');
      
      console.log('🔌 Attempting to connect to wallet extension...');
      
      // Request access to extensions
      const extensions = await web3Enable('Academic Verify');
      
      if (extensions.length === 0) {
        toast.error('No wallet extension found', {
          description: 'Please install Polkadot.js, Talisman, or SubWallet extension',
          duration: 5000,
        });
        
        setTimeout(() => {
          window.open('https://polkadot.js.org/extension/', '_blank');
        }, 1000);
        return;
      }

      console.log(`✅ Found ${extensions.length} wallet extension(s)`);

      // Get all accounts
      const allAccounts = await web3Accounts();
      
      if (allAccounts.length === 0) {
        toast.error('No accounts found', {
          description: 'Please create an account in your wallet extension',
          duration: 5000,
        });
        return;
      }

      console.log(`✅ Found ${allAccounts.length} account(s)`);

      // Connect to the first account
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

      // Check for existing DID on blockchain
      if (isReady && api) {
        await checkDIDOnBlockchain(account.address);
      }
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

      // Check for DID on the new account
      if (isReady && api) {
        checkDIDOnBlockchain(address);
      }
    }
  };

  return (
    <WalletContext.Provider value={{ enableWallet, selectAccount }}>
      {children}
    </WalletContext.Provider>
  );
}