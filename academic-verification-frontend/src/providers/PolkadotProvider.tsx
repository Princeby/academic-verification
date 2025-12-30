import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { toast } from 'sonner';
import { CHAIN_CONFIG } from '@/lib/utils/constants';

interface PolkadotContextType {
  api: any | null;
  isReady: boolean;
  error: string | null;
}

const PolkadotContext = createContext<PolkadotContextType>({
  api: null,
  isReady: false,
  error: null,
});

export const usePolkadotContext = () => useContext(PolkadotContext);

interface PolkadotProviderProps {
  children: ReactNode;
}

export function PolkadotProvider({ children }: PolkadotProviderProps) {
  const [api, setApi] = useState<any | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function initApi() {
      try {
        // Dynamically import Polkadot to avoid build issues
        const { ApiPromise, WsProvider } = await import('@polkadot/api');
        
        console.log('🔗 Attempting to connect to blockchain...');
        console.log('📍 Endpoint:', CHAIN_CONFIG.WS_PROVIDER);
        
        const wsProvider = new WsProvider(CHAIN_CONFIG.WS_PROVIDER);
        
        // Add timeout
        const timeout = setTimeout(() => {
          if (!isReady && isMounted) {
            console.warn('⚠️ Connection timeout - continuing without blockchain');
            setError('Could not connect to blockchain node (timeout)');
            toast.warning('Running without blockchain connection', {
              description: 'Some features may be limited'
            });
          }
        }, 5000);

        const apiInstance = await ApiPromise.create({ provider: wsProvider });

        clearTimeout(timeout);

        if (isMounted) {
          setApi(apiInstance);
          setIsReady(true);
          console.log('✅ Connected to blockchain');
          toast.success('Connected to blockchain');
        }
      } catch (err) {
        console.error('❌ Blockchain connection error:', err);
        if (isMounted) {
          const errorMessage = err instanceof Error ? err.message : 'Failed to connect to blockchain';
          setError(errorMessage);
          
          console.warn('⚠️ Running in offline mode - blockchain features disabled');
          toast.info('Running in offline mode', {
            description: 'UI is functional, blockchain features disabled'
          });
        }
      }
    }

    // Delay initialization to avoid blocking UI
    const timer = setTimeout(() => {
      initApi();
    }, 1000);

    return () => {
      isMounted = false;
      clearTimeout(timer);
      if (api) {
        console.log('🔌 Disconnecting from blockchain...');
        api.disconnect().catch(console.error);
      }
    };
  }, []);

  return (
    <PolkadotContext.Provider value={{ api, isReady, error }}>
      {children}
    </PolkadotContext.Provider>
  );
}