import { Link } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { useState } from 'react';
import WalletConnect from '../blockchain/WalletConnect';
import ChainStatus from '../blockchain/ChainStatus';
import { Button } from '../ui/Button';

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-lg">AV</span>
            </div>
            <span className="font-bold text-lg hidden sm:inline-block">
              Academic Verify
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            <Link 
              to="/dashboard" 
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Dashboard
            </Link>
            <Link 
              to="/credentials" 
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Credentials
            </Link>
            <Link 
              to="/institutions" 
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Institutions
            </Link>
            <Link 
              to="/verify" 
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Verify
            </Link>
          </nav>

          {/* Right side actions */}
          <div className="flex items-center space-x-4">
            {/* Chain Status */}
            <div className="hidden sm:block">
              <ChainStatus />
            </div>

            {/* Wallet Connect */}
            <WalletConnect />

            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-border">
            <nav className="flex flex-col space-y-3">
              <Link 
                to="/dashboard" 
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Dashboard
              </Link>
              <Link 
                to="/credentials" 
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Credentials
              </Link>
              <Link 
                to="/institutions" 
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Institutions
              </Link>
              <Link 
                to="/verify" 
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Verify
              </Link>
              <div className="pt-2">
                <ChainStatus />
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}