// WalletConnect.tsx
import { useState } from 'react';
import { Wallet, ChevronDown } from 'lucide-react';
import { Button } from '../ui/Button';
import { useWalletStore } from '@/store/wallet.store';

export default function WalletConnect() {
  const { isConnected, account, connectWallet, disconnectWallet } = useWalletStore();
  const [showDropdown, setShowDropdown] = useState(false);

  const handleConnect = async () => {
    try {
      await connectWallet();
    } catch (error) {
      console.error('Failed to connect wallet:', error);
    }
  };

  if (!isConnected) {
    return (
      <Button onClick={handleConnect} size="sm">
        <Wallet className="h-4 w-4 mr-2" />
        Connect Wallet
      </Button>
    );
  }

  return (
    <div className="relative">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setShowDropdown(!showDropdown)}
        className="flex items-center"
      >
        <div className="h-6 w-6 rounded-full bg-primary mr-2" />
        <span className="hidden sm:inline">
          {account?.name || `${account?.address.slice(0, 6)}...${account?.address.slice(-4)}`}
        </span>
        <ChevronDown className="h-4 w-4 ml-2" />
      </Button>

      {showDropdown && (
        <div className="absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-card border border-border z-50">
          <div className="py-1">
            <div className="px-4 py-2 border-b border-border">
              <p className="text-sm font-medium">{account?.name || 'Account'}</p>
              <p className="text-xs text-muted-foreground">
                {account?.address.slice(0, 10)}...{account?.address.slice(-8)}
              </p>
            </div>
            <button
              onClick={() => {
                navigator.clipboard.writeText(account?.address || '');
                setShowDropdown(false);
              }}
              className="block w-full text-left px-4 py-2 text-sm hover:bg-accent"
            >
              Copy Address
            </button>
            <button
              onClick={() => {
                disconnectWallet();
                setShowDropdown(false);
              }}
              className="block w-full text-left px-4 py-2 text-sm text-destructive hover:bg-accent"
            >
              Disconnect
            </button>
          </div>
        </div>
      )}
    </div>
  );
}