// src/pages/Dashboard.tsx
import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Award,
  Building2,
  CheckCircle,
  Wallet,
  AlertCircle,
  Key,
} from 'lucide-react';

import { useWalletStore } from '@/store/wallet.store';
import { useDIDStore } from '@/store/did.store';
import { useBalance } from '@/hooks/blockchain/useBalance';

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

import CreateDIDModal from '@/components/did/CreateDIDModal';
import { DID_STATUS } from '@/lib/utils/constants';

export default function Dashboard() {
  const { isConnected, account } = useWalletStore();
  const { hasDID, isInstitution, didAddress, status } = useDIDStore();
  const { balance, loading: balanceLoading } = useBalance();
  const [showCreateDID, setShowCreateDID] = useState(false);

  const didStatusConfig = (() => {
    switch (status) {
      case DID_STATUS.ACTIVE:
        return { label: 'Active', variant: 'success' as const };
      case DID_STATUS.INACTIVE:
        return { label: 'Inactive', variant: 'warning' as const };
      case DID_STATUS.PENDING:
        return { label: 'Pending', variant: 'warning' as const };
      default:
        return { label: 'No DID', variant: 'outline' as const };
    }
  })();

  // Wallet not connected
  if (!isConnected) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-md">
          <CardHeader>
            <div className="flex items-center space-x-2 text-yellow-600 mb-2">
              <AlertCircle className="h-5 w-5" />
              <CardTitle>Connect Your Wallet</CardTitle>
            </div>
            <CardDescription>
              Please connect your Polkadot wallet to access the dashboard and manage your academic credentials
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              You'll need a Polkadot wallet extension to continue:
            </p>
            <ul className="text-sm space-y-2 list-disc list-inside text-muted-foreground">
              <li>Polkadot.js Extension</li>
              <li>Talisman</li>
              <li>SubWallet</li>
            </ul>
            <Button asChild className="w-full">
              <a
                href="https://polkadot.js.org/extension/"
                target="_blank"
                rel="noopener noreferrer"
              >
                Install Wallet Extension
              </a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // No DID yet
  if (!hasDID) {
    return (
      <>
        <div className="max-w-4xl mx-auto py-8">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold mb-2">Welcome to Academic Verify</h1>
            <p className="text-muted-foreground">
              Let's create your decentralized identifier to get started
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Key className="h-6 w-6 mr-2" />
                Create Your DID
              </CardTitle>
              <CardDescription>
                A Decentralized Identifier (DID) is required to receive and manage credentials
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <p className="text-sm text-blue-800 dark:text-blue-400 font-semibold">
                  What is a DID?
                </p>
                <p className="text-sm text-blue-700 dark:text-blue-300 mt-2">
                  A DID is your unique identity on the blockchain. It allows institutions to issue
                  credentials directly to you and enables anyone to verify your credentials without
                  contacting the issuing institution.
                </p>
              </div>

              <Button onClick={() => setShowCreateDID(true)} className="w-full">
                <Key className="h-4 w-4 mr-2" />
                Create DID Now
              </Button>
            </CardContent>
          </Card>
        </div>

        <CreateDIDModal
          isOpen={showCreateDID}
          onClose={() => setShowCreateDID(false)}
        />
      </>
    );
  }

  // DID exists but not active
  if (status !== DID_STATUS.ACTIVE) {
    return (
      <div className="max-w-3xl mx-auto py-12">
        <Card>
          <CardHeader>
            <CardTitle>DID Not Active</CardTitle>
            <CardDescription>
              Your decentralized identity is currently{' '}
              {didStatusConfig.label.toLowerCase()}.
              You must have an active DID to manage credentials.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex items-center gap-2">
            <Badge variant={didStatusConfig.variant}>
              {didStatusConfig.label}
            </Badge>
            {isInstitution && (
              <Badge variant="secondary">Institution</Badge>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Active DID – full dashboard
  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">
            Welcome back, {account?.name || 'there'}!
          </h1>
          <p className="text-muted-foreground">
            {isInstitution
              ? 'Manage your institution and issue credentials'
              : 'Manage your credentials and academic identity'}
          </p>
        </div>

        {balance && (
          <Card className="bg-gradient-to-br from-primary/10 to-purple-500/10">
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2 mb-1">
                <Wallet className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Balance</span>
              </div>
              <div className="text-2xl font-bold">
                {balanceLoading ? '...' : balance.formatted}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Account Info */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">DID Address</p>
              <code className="text-xs font-mono bg-muted px-2 py-1 rounded">
                {didAddress}
              </code>
            </div>
            <div className="flex gap-2">
              <Badge variant={didStatusConfig.variant}>
                {didStatusConfig.label}
              </Badge>
              {isInstitution && (
                <Badge variant="secondary">Institution</Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              {isInstitution ? 'Issued Credentials' : 'Total Credentials'}
            </CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">
              {isInstitution ? 'Credentials issued' : 'Academic credentials'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              {isInstitution ? 'Active Recipients' : 'Verified'}
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">
              {isInstitution ? 'Unique recipients' : 'Times verified'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Reputation</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">Reputation score</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
