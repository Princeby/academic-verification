// src/pages/Credentials.tsx
import { useEffect, useState } from 'react';
import { useWalletStore } from '@/store/wallet.store';
import { useDIDStore } from '@/store/did.store';
import { useCredentialsStore } from '@/store/credentials.store';
import CredentialsList from '@/components/credentials/CredentialsList';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { AlertCircle, Award, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { Credential } from '@/components/credentials/CredentialCard';

export default function Credentials() {
  const navigate = useNavigate();
  const { isConnected, account } = useWalletStore();
  const { hasDID, didAddress } = useDIDStore();
  const { credentials, loading, setLoading } = useCredentialsStore();
  const [refreshing, setRefreshing] = useState(false);

  // Fetch credentials when component mounts
  useEffect(() => {
    if (isConnected && hasDID && didAddress) {
      fetchCredentials();
    }
  }, [isConnected, hasDID, didAddress]);

  const fetchCredentials = async () => {
    setLoading(true);
    try {
      // TODO: Replace with actual blockchain query
      // For now, use mock data
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock credentials
      const mockCredentials: Credential[] = [
        {
          id: 'cred_1',
          holder: didAddress || '',
          issuer: '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY',
          issuerName: 'Massachusetts Institute of Technology',
          credentialHash: '0x' + Array(64).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join(''),
          credentialType: "Bachelor's Degree",
          degreeName: 'Bachelor of Science in Computer Science',
          fieldOfStudy: 'Computer Science',
          issuedAt: Date.now() - 365 * 24 * 60 * 60 * 1000, // 1 year ago
          revoked: false,
          metadata: 'Graduated with honors. GPA: 3.85',
        },
        {
          id: 'cred_2',
          holder: didAddress || '',
          issuer: '5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty',
          issuerName: 'Stanford University',
          credentialHash: '0x' + Array(64).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join(''),
          credentialType: "Master's Degree",
          degreeName: 'Master of Science in Artificial Intelligence',
          fieldOfStudy: 'Artificial Intelligence',
          issuedAt: Date.now() - 90 * 24 * 60 * 60 * 1000, // 90 days ago
          revoked: false,
          metadata: 'Thesis: "Deep Learning for Medical Imaging"',
        },
        {
          id: 'cred_3',
          holder: didAddress || '',
          issuer: '5FLSigC9HGRKVhB9FiEo4Y3koPsNmBmLJbpXg2mp1hXcS59Y',
          issuerName: 'Harvard University',
          credentialHash: '0x' + Array(64).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join(''),
          credentialType: 'Certificate',
          degreeName: 'Data Science Professional Certificate',
          fieldOfStudy: 'Data Science',
          issuedAt: Date.now() - 180 * 24 * 60 * 60 * 1000, // 180 days ago
          expiresAt: Date.now() + 365 * 24 * 60 * 60 * 1000, // Expires in 1 year
          revoked: false,
        },
      ];

      useCredentialsStore.setState({ credentials: mockCredentials });
    } catch (error) {
      console.error('Failed to fetch credentials:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchCredentials();
    setRefreshing(false);
  };

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
            View and manage your academic credentials
          </p>
        </div>
        <Button
          onClick={handleRefresh}
          disabled={refreshing}
          variant="outline"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <Award className="h-5 w-5 text-blue-600 dark:text-blue-500 flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-semibold text-blue-800 dark:text-blue-400">
              Your Credential Wallet
            </p>
            <p className="text-blue-700 dark:text-blue-300 mt-1">
              All credentials issued to your DID appear here. You can view, verify, share, and export them at any time.
              These credentials are permanently stored on the blockchain and can be independently verified by anyone.
            </p>
          </div>
        </div>
      </div>

      {/* Credentials List */}
      <CredentialsList 
        credentials={credentials}
        loading={loading}
        emptyMessage="You haven't received any credentials yet"
      />
    </div>
  );
}