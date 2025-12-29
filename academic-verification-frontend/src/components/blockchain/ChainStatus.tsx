// ChainStatus.tsx
import { Circle } from 'lucide-react';
import { usePolkadotApi } from '@/hooks/blockchain/usePolkadotApi';

export default function ChainStatus() {
  const { isConnected, blockNumber, chainName } = usePolkadotApi();

  return (
    <div className="flex items-center space-x-2 text-sm">
      <Circle
        className={`h-2 w-2 ${
          isConnected ? 'fill-green-500 text-green-500' : 'fill-red-500 text-red-500'
        }`}
      />
      <span className="text-muted-foreground hidden lg:inline">
        {isConnected ? (
          <>
            {chainName} #{blockNumber}
          </>
        ) : (
          'Disconnected'
        )}
      </span>
    </div>
  );
}