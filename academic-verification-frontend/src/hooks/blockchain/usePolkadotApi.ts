import { useState, useEffect } from 'react';
import { usePolkadotContext } from '@/providers/PolkadotProvider';
import { CHAIN_CONFIG } from '@/lib/utils/constants';

export function usePolkadotApi() {
  const { api, isReady, error } = usePolkadotContext();
  const [blockNumber, setBlockNumber] = useState<number>(0);
  const [chainName, setChainName] = useState<string>(CHAIN_CONFIG.CHAIN_NAME);
  const [isConnected, setIsConnected] = useState<boolean>(false);

  useEffect(() => {
    if (!api || !isReady) {
      setIsConnected(false);
      return;
    }

    setIsConnected(true);

    // Get chain name
    api.rpc.system.chain().then((chain) => {
      setChainName(chain.toString());
    });

    // Subscribe to new blocks
    let unsubscribe: (() => void) | undefined;

    api.rpc.chain.subscribeNewHeads((header) => {
      setBlockNumber(header.number.toNumber());
    }).then((unsub) => {
      unsubscribe = unsub;
    });

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [api, isReady]);

  return {
    api,
    isReady,
    isConnected,
    blockNumber,
    chainName,
    error,
  };
}