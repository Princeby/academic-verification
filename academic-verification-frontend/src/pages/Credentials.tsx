// src/pages/Credentials.tsx - UPDATED WITH HEX DECODING
import { useEffect, useState } from 'react';
import { useWalletStore } from '@/store/wallet.store';
import { useDIDStore } from '@/store/did.store';
import { useCredentialsStore } from '@/store/credentials.store';
import { useBlockchain } from '@/hooks/blockchain/useBlockchain';
import CredentialsList from '@/components/credentials/CredentialsList';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { AlertCircle, Award, RefreshCw, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import type { Credential } from '@/components/credentials/CredentialCard';
import { hexToString } from '@polkadot/util';

export default function Credentials() {
  const navigate = useNavigate();
  const { isConnected } = useWalletStore();
  const { hasDID, didAddress } = useDIDStore();
  const { credentials, setCredentials, loading, setLoading } = useCredentialsStore();
  const [refreshing, setRefreshing] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const { queries, isReady } = useBlockchain();

  // Helper to decode hex strings
  const decodeHexString = (hexString: string | any): string => {
    try {
      if (typeof hexString !== 'string' || !hexString.startsWith('0x')) {
        return String(hexString);
      }
      const decoded = hexToString(hexString);
      return decoded.replace(/\0/g, '');
    } catch (error) {
      return String(hexString);
    }
  };

  // Fetch credentials when component mounts
  useEffect(() => {
    if (isConnected && hasDID && didAddress && isReady && queries) {
      fetchCredentials();
    }
  }, [isConnected, hasDID, didAddress, isReady, queries]);

  const fetchCredentials = async () => {
    if (!queries || !didAddress) {
      console.log('Missing queries or didAddress');
      return;
    }

    setLoading(true);
    setFetchError(null);

    try {
      console.log('📡 Fetching credentials for:', didAddress);

      // Fetch real credentials from blockchain
      const blockchainCredentials = await queries.credential.getCredentialsByHolder(didAddress);

      console.log('✅ Fetched credentials:', blockchainCredentials);

      if (blockchainCredentials.length === 0) {
        console.log('ℹ️ No credentials found on blockchain');
        setCredentials([]);
        setLoading(false);
        return;
      }

      // Fetch institution names for issuers AND decode all hex strings
      const credentialsWithInstitutionNames = await Promise.all(
        blockchainCredentials.map(async (cred) => {
          try {
            const institution = await queries.did.getInstitution(cred.issuer);

            // Decode institution name if it exists
            const issuerName = institution?.name
              ? decodeHexString(institution.name)
              : undefined;

            return {
              ...cred,
              issuerName,
              degreeName: extractDegreeName(cred.metadata),
              fieldOfStudy: extractFieldOfStudy(cred.metadata),
              // Keep original metadata for modal display
              metadata: cred.metadata,
            } as Credential;
          } catch (error) {
            console.error('Error fetching institution for issuer:', cred.issuer, error);
            return {
              ...cred,
              degreeName: extractDegreeName(cred.metadata),
              fieldOfStudy: extractFieldOfStudy(cred.metadata),
              metadata: cred.metadata,
            } as Credential;
          }
        })
      );

      console.log('✅ Processed credentials:', credentialsWithInstitutionNames);
      setCredentials(credentialsWithInstitutionNames);

      if (credentialsWithInstitutionNames.length > 0) {
        toast.success(`Found ${credentialsWithInstitutionNames.length} credential(s)`);
      }
    } catch (error: any) {
      console.error('❌ Failed to fetch credentials:', error);
      setFetchError(error.message || 'Failed to fetch credentials');
      toast.error('Failed to load credentials', {
        description: 'Check console for details',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchCredentials();
    setRefreshing(false);
    toast.success('Credentials refreshed');
  };

  // Helper functions to extract data from metadata (with hex decoding)
  function extractDegreeName(metadata?: string): string | undefined {
    if (!metadata) return undefined;
    try {
      // First decode the hex
      const decoded = decodeHexString(metadata);
      // Then parse JSON
      const parsed = JSON.parse(decoded);
      return parsed.degreeName || parsed.name || undefined;
    } catch {
      // If it's not hex or not JSON, return as-is
      return metadata;
    }
  }

  function extractFieldOfStudy(metadata?: string): string | undefined {
    if (!metadata) return undefined;
    try {
      // First decode the hex
      const decoded = decodeHexString(metadata);
      // Then parse JSON
      const parsed = JSON.parse(decoded);
      return parsed.fieldOfStudy || parsed.field || undefined;
    } catch {
      return undefined;
    }
  }

  // Not connected
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
              Please connect your wallet to view your credentials
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // No DID
  if (!hasDID) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-md">
          <CardHeader>
            <div className="flex items-center space-x-2 text-yellow-600 mb-2">
              <AlertCircle className="h-5 w-5" />
              <CardTitle>DID Required</CardTitle>
            </div>
            <CardDescription>
              You need to create a Decentralized Identifier to receive and manage credentials
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/dashboard')} className="w-full">
              Create DID
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Blockchain not ready
  if (!isReady) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-md">
          <CardContent className="py-12 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-3 text-primary" />
            <p className="text-muted-foreground">Connecting to blockchain...</p>
            <p className="text-xs text-muted-foreground mt-2">
              Make sure your local node is running
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center">
            <Award className="h-8 w-8 mr-3 text-primary" />
            My Credentials
          </h1>
          <p className="text-muted-foreground mt-1">
            View and manage your academic credentials from the blockchain
          </p>
        </div>
        <Button
          onClick={handleRefresh}
          disabled={refreshing || loading}
          variant="outline"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Connection Status */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <Award className="h-5 w-5 text-blue-600 dark:text-blue-500 flex-shrink-0 mt-0.5" />
          <div className="text-sm flex-1">
            <p className="font-semibold text-blue-800 dark:text-blue-400">
              Connected to Blockchain
            </p>
            <p className="text-blue-700 dark:text-blue-300 mt-1">
              All credentials are fetched directly from the blockchain.
              Your DID: <code className="text-xs font-mono">{didAddress?.slice(0, 10)}...{didAddress?.slice(-8)}</code>
            </p>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {fetchError && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-500 flex-shrink-0 mt-0.5" />
            <div className="text-sm flex-1">
              <p className="font-semibold text-red-800 dark:text-red-400">
                Error Loading Credentials
              </p>
              <p className="text-red-700 dark:text-red-300 mt-1">
                {fetchError}
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                className="mt-2"
              >
                Try Again
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Credentials List */}
      <CredentialsList
        credentials={credentials}
        loading={loading}
        emptyMessage={
          isReady
            ? "No credentials found on blockchain. Credentials issued to your DID will appear here."
            : "Waiting for blockchain connection..."
        }
      />
    </div>
  );
}