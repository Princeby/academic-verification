import { Wallet } from 'lucide-react';
import { Button } from '../ui/Button';

export default function WalletConnect() {
  // Stub version - no actual wallet connection
  const isConnected = false;

  const handleConnect = () => {
    alert('Wallet connection temporarily disabled for testing');
  };

  return (
    <Button onClick={handleConnect} size="sm">
      <Wallet className="h-4 w-4 mr-2" />
      Connect Wallet
    </Button>
  );
}