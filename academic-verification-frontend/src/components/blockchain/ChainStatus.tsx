import { Circle } from 'lucide-react';

export default function ChainStatus() {
  // Stub version - no Polkadot connection
  const isConnected = false;
  const blockNumber = 0;
  const chainName = 'Offline';

  return (
    <div className="flex items-center space-x-2 text-sm">
      <Circle className="h-2 w-2 fill-red-500 text-red-500" />
      <span className="text-muted-foreground hidden lg:inline">
        {chainName}
      </span>
    </div>
  );
}