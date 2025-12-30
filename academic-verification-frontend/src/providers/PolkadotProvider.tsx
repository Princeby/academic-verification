import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import type { ApiPromise } from '@polkadot/api';
import { toast } from 'sonner';
import { CHAIN_CONFIG } from '@/lib/utils/constants';

interface PolkadotContextType {
  api: ApiPromise | null;
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
  const [api, setApi] = useState<ApiPromise | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    let apiInstance: ApiPromise | null = null;

    async function initApi() {
      try {
        // Dynamic import to avoid build issues
        const { ApiPromise, WsProvider } = await import('@polkadot/api');
        
        console.log('🔗 Connecting to blockchain...');
        console.log('📍 Endpoint:', CHAIN_CONFIG.WS_PROVIDER);
        
        const wsProvider = new WsProvider(CHAIN_CONFIG.WS_PROVIDER);
        
        // Connection timeout handler
        const timeout = setTimeout(() => {
          if (!isReady && isMounted) {
            console.warn('⚠️ Connection timeout - continuing without blockchain');
            setError('Could not connect to blockchain node (timeout)');
            toast.warning('Running in demo mode', {
              description: 'Connect to a node to enable blockchain features'
            });
          }
        }, 5000);

        // Create API instance
        apiInstance = await ApiPromise.create({ 
          provider: wsProvider,
          throwOnConnect: false,
        });

        clearTimeout(timeout);

        if (isMounted) {
          await apiInstance.isReady;
          setApi(apiInstance);
          setIsReady(true);
          console.log('✅ Connected to blockchain');
          toast.success('Connected to blockchain');
        }
      } catch (err) {
        console.error('❌ Blockchain connection error:', err);
        if (isMounted) {
          const errorMessage = err instanceof Error ? err.message : 'Failed to connect';
          setError(errorMessage);
          
          toast.info('Running in demo mode', {
            description: 'UI is functional, blockchain features disabled'
          });
        }
      }
    }

    // Delay initialization slightly to let UI render first
    const timer = setTimeout(() => {
      initApi();
    }, 1500);

    return () => {
      isMounted = false;
      clearTimeout(timer);
      if (apiInstance) {
        apiInstance.disconnect().catch(console.error);
      }
    };
  }, []);

  // Always render children, even if connection fails
  return (
    <PolkadotContext.Provider value={{ api, isReady, error }}>
      {children}
    </PolkadotContext.Provider>
  );
}