// src/hooks/blockchain/useBalance.ts
import { useState, useEffect } from 'react';
import { usePolkadotContext } from '@/providers/PolkadotProvider';
import { useWalletStore } from '@/store/wallet.store';
import { formatBalance } from '@polkadot/util';

interface BalanceInfo {
  free: string;
  reserved: string;
  frozen: string;
  total: string;
  formatted: string;
}

export function useBalance() {
  const { api, isReady } = usePolkadotContext();
  const { account, setBalance } = useWalletStore();
  const [balance, setBalanceState] = useState<BalanceInfo | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!api || !isReady || !account?.address) {
      setBalanceState(null);
      return;
    }

    let unsubscribe: (() => void) | undefined;

    const fetchBalance = async () => {
      setLoading(true);
      try {
        // Subscribe to balance changes
        unsubscribe = await api.query.system.account(
          account.address,
          ({ data: { free, reserved, frozen } }) => {
            const freeBalance = free.toString();
            const reservedBalance = reserved.toString();
            const frozenBalance = frozen.toString();
            const totalBalance = (BigInt(freeBalance) + BigInt(reservedBalance)).toString();

            // Format for display
            const formatted = formatBalance(totalBalance, {
              decimals: 12,
              withUnit: 'AVC',
              forceUnit: '-',
            });

            const balanceInfo: BalanceInfo = {
              free: freeBalance,
              reserved: reservedBalance,
              frozen: frozenBalance,
              total: totalBalance,
              formatted,
            };

            setBalanceState(balanceInfo);
            setBalance(formatted);
          }
        );
      } catch (error) {
        console.error('Failed to fetch balance:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBalance();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [api, isReady, account?.address, setBalance]);

  return {
    balance,
    loading,
    refresh: () => {
      // Balance is automatically refreshed via subscription
    },
  };
}