// src/hooks/blockchain/useBlockchain.ts - UPDATED
import { useMemo } from 'react';
import { usePolkadotContext } from '@/providers/PolkadotProvider';
import { useWalletStore } from '@/store/wallet.store';
import { 
  DIDTransactions, 
  CredentialTransactions, 
  ReputationTransactions 
} from '@/lib/blockchain/transactions';
import { RealBlockchainQueries } from '@/lib/blockchain/realQueries';

/**
 * Main hook for blockchain interactions
 * Provides transaction and query helpers with REAL blockchain data
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

    return new RealBlockchainQueries(api);
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