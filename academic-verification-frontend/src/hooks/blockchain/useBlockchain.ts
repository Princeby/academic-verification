// src/hooks/blockchain/useBlockchain.ts
import { useMemo } from 'react';
import { usePolkadotContext } from '@/providers/PolkadotProvider';
import { useWalletStore } from '@/store/wallet.store';
import { 
  DIDTransactions, 
  CredentialTransactions, 
  ReputationTransactions 
} from '@/lib/blockchain/transactions';
import { BlockchainQueries } from '@/lib/blockchain/queries';

/**
 * Main hook for blockchain interactions
 * Provides transaction and query helpers
 */
export function useBlockchain() {
  const { api, isReady } = usePolkadotContext();
  const { account } = useWalletStore();

  const transactions = useMemo(() => {
    if (!api || !isReady) return null;

    return {
      did: new DIDTransactions(api),
      credential: new CredentialTransactions(api),
      reputation: new ReputationTransactions(api),
    };
  }, [api, isReady]);

  const queries = useMemo(() => {
    if (!api || !isReady) return null;

    return new BlockchainQueries(api);
  }, [api, isReady]);

  return {
    api,
    isReady,
    account,
    transactions,
    queries,
    isConnected: isReady && account !== null,
  };
}