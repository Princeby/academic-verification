import { useState } from 'react';
import { Wallet, ChevronDown, Copy, LogOut, ExternalLink } from 'lucide-react';
import { Button } from '../ui/Button';
import { useWalletStore } from '@/store/wallet.store';
import { useWalletContext } from '@/providers/WalletProvider';
import { toast } from 'sonner';

export default function WalletConnect() {
  const { isConnected, account, disconnectWallet } = useWalletStore();
  const { enableWallet } = useWalletContext();
  const [showDropdown, setShowDropdown] = useState(false);

  const handleConnect = async () => {
    try {
      await enableWallet();
    } catch (error) {
      console.error('Failed to connect wallet:', error);
    }
  };

  const copyAddress = () => {
    if (account?.address) {
      navigator.clipboard.writeText(account.address);
      toast.success('Address copied to clipboard');
      setShowDropdown(false);
    }
  };

  const viewOnExplorer = () => {
    if (account?.address) {
      // Update this URL based on your network
      window.open(`https://polkadot.js.org/apps/#/accounts/${account.address}`, '_blank');
      setShowDropdown(false);
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
        <div className="h-6 w-6 rounded-full bg-gradient-to-br from-primary to-purple-600 mr-2 flex items-center justify-center text-xs text-white font-bold">
          {account?.name?.charAt(0)?.toUpperCase() || '?'}
        </div>
        <span className="hidden sm:inline">
          {account?.name || `${account?.address.slice(0, 6)}...${account?.address.slice(-4)}`}
        </span>
        <ChevronDown className="h-4 w-4 ml-2" />
      </Button>

      {showDropdown && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setShowDropdown(false)}
          />
          
          {/* Dropdown */}
          <div className="absolute right-0 mt-2 w-64 rounded-md shadow-lg bg-card border border-border z-50">
            <div className="py-1">
              {/* Account Info */}
              <div className="px-4 py-3 border-b border-border">
                <div className="flex items-center space-x-2 mb-2">
                  <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-sm text-white font-bold">
                    {account?.name?.charAt(0)?.toUpperCase() || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{account?.name || 'Account'}</p>
                    {account?.source && (
                      <p className="text-xs text-muted-foreground capitalize">{account.source}</p>
                    )}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground font-mono break-all">
                  {account?.address}
                </p>
              </div>

              {/* Actions */}
              <button
                onClick={copyAddress}
                className="flex items-center w-full text-left px-4 py-2 text-sm hover:bg-accent transition-colors"
              >
                <Copy className="h-4 w-4 mr-2" />
                Copy Address
              </button>

              <button
                onClick={viewOnExplorer}
                className="flex items-center w-full text-left px-4 py-2 text-sm hover:bg-accent transition-colors"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                View on Explorer
              </button>

              <div className="border-t border-border my-1" />

              <button
                onClick={() => {
                  disconnectWallet();
                  setShowDropdown(false);
                  toast.success('Wallet disconnected');
                }}
                className="flex items-center w-full text-left px-4 py-2 text-sm text-destructive hover:bg-accent transition-colors"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Disconnect
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}