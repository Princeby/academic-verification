// src/components/blockchain/ChainStatus.tsx
import { Circle, Loader2 } from 'lucide-react';
import { usePolkadotApi } from '@/hooks/blockchain/usePolkadotApi';

export default function ChainStatus() {
  const { isConnected, isReady, blockNumber, chainName, error } = usePolkadotApi();

  // Show loading state
  if (!isReady && !error) {
    return (
      <div className="flex items-center space-x-2 text-sm">
        <Loader2 className="h-3 w-3 animate-spin text-yellow-500" />
        <span className="text-muted-foreground hidden lg:inline">
          Connecting...
        </span>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="flex items-center space-x-2 text-sm">
        <Circle className="h-2 w-2 fill-red-500 text-red-500" />
        <span className="text-muted-foreground hidden lg:inline">
          Offline
        </span>
      </div>
    );
  }

  // Show connected state
  return (
    <div className="flex items-center space-x-2 text-sm">
      <Circle className="h-2 w-2 fill-green-500 text-green-500 animate-pulse" />
      <span className="text-muted-foreground hidden lg:inline">
        {chainName}
      </span>
      {blockNumber > 0 && (
        <span className="text-xs text-muted-foreground hidden xl:inline">
          #{blockNumber.toLocaleString()}
        </span>
      )}
    </div>
  );
}