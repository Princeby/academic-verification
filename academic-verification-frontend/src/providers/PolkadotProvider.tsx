// PolkadotProvider.tsx
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { ApiPromise, WsProvider } from '@polkadot/api';
import { CHAIN_CONFIG } from '@/lib/utils/constants';
import { toast } from 'sonner';

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

    async function initApi() {
      try {
        const wsProvider = new WsProvider(CHAIN_CONFIG.WS_PROVIDER);
        const apiInstance = await ApiPromise.create({ provider: wsProvider });

        if (isMounted) {
          setApi(apiInstance);
          setIsReady(true);
          toast.success('Connected to blockchain');
        }
      } catch (err) {
        if (isMounted) {
          const errorMessage = err instanceof Error ? err.message : 'Failed to connect to blockchain';
          setError(errorMessage);
          toast.error(errorMessage);
        }
      }
    }

    initApi();

    return () => {
      isMounted = false;
      if (api) {
        api.disconnect();
      }
    };
  }, []);

  return (
    <PolkadotContext.Provider value={{ api, isReady, error }}>
      {children}
    </PolkadotContext.Provider>
  );
}

