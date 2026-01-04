// src/pages/Institution.tsx - REPLACE THIS FILE
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDIDStore } from '@/store/did.store';
import { useWalletStore } from '@/store/wallet.store';
import { usePolkadotContext } from '@/providers/PolkadotProvider';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { 
  Building2, 
  FileText, 
  Users, 
  Award, 
  Plus, 
  RefreshCw, 
  Loader2,
  TrendingUp,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';

interface InstitutionData {
  name: string;
  did: string;
  verified: boolean;
  registeredAt: number;
}

interface ReputationScore {
  credentialsIssued: number;
  credentialsVerified: number;
  endorsementsReceived: number;
  endorsementsGiven: number;
  totalScore: number;
}

export default function Institution() {
  const navigate = useNavigate();
  const { isInstitution, institutionName, didAddress } = useDIDStore();
  const { isConnected } = useWalletStore();
  const { api, isReady } = usePolkadotContext();

  const [institutionData, setInstitutionData] = useState<InstitutionData | null>(null);
  const [reputation, setReputation] = useState<ReputationScore | null>(null);
  const [issuedCount, setIssuedCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch institution data from blockchain
  useEffect(() => {
    if (isConnected && isInstitution && didAddress && isReady && api) {
      fetchInstitutionData();
    }
  }, [isConnected, isInstitution, didAddress, isReady, api]);

  const fetchInstitutionData = async () => {
    if (!api || !didAddress) return;

    setLoading(true);
    try {
      console.log('🏛️ Fetching institution data for:', didAddress);

      // Fetch institution info
      const institutionInfo = await api.query.did.institutions(didAddress);
      
      if (institutionInfo.isEmpty) {
        console.warn('No institution data found');
        toast.error('Institution data not found');
        setLoading(false);
        return;
      }

      const instData = institutionInfo.toJSON() as any;
      console.log('✅ Institution data:', instData);

      // Decode institution name from hex
      let decodedName = institutionName || 'Institution';
      if (instData.name) {
        try {
          // Remove 0x prefix if present
          const hexString = instData.name.startsWith('0x') ? instData.name.slice(2) : instData.name;
          // Convert hex to string
          const bytes = new Uint8Array(hexString.match(/.{1,2}/g)?.map((byte: string) => parseInt(byte, 16)) || []);
          const decoded = new TextDecoder().decode(bytes);
          decodedName = decoded || decodedName;
          console.log('✅ Decoded institution name:', decodedName);
        } catch (error) {
          console.warn('Failed to decode institution name:', error);
        }
      }

      setInstitutionData({
        name: decodedName,
        did: instData.did || didAddress,
        verified: instData.verified || false,
        registeredAt: instData.registeredAt || Date.now(),
      });

      // Fetch reputation score
      const reputationData = await api.query.reputation.reputationScores(didAddress);
      
      if (!reputationData.isEmpty) {
        const repData = reputationData.toJSON() as any;
        console.log('✅ Reputation data:', repData);
        
        setReputation({
          credentialsIssued: repData.credentialsIssued || 0,
          credentialsVerified: repData.credentialsVerified || 0,
          endorsementsReceived: repData.endorsementsReceived || 0,
          endorsementsGiven: repData.endorsementsGiven || 0,
          totalScore: repData.totalScore || 0,
        });
      } else {
        setReputation({
          credentialsIssued: 0,
          credentialsVerified: 0,
          endorsementsReceived: 0,
          endorsementsGiven: 0,
          totalScore: 0,
        });
      }

      // Fetch issued credentials count
      const issuedCredentials = await api.query.credential.credentialsByIssuer(didAddress);
      
      if (!issuedCredentials.isEmpty) {
        const credentials = issuedCredentials.toJSON() as any[];
        console.log('✅ Issued credentials count:', credentials.length);
        setIssuedCount(credentials.length);
      } else {
        setIssuedCount(0);
      }

      toast.success('Institution data loaded from blockchain');
    } catch (error: any) {
      console.error('❌ Failed to fetch institution data:', error);
      toast.error('Failed to load institution data');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchInstitutionData();
    setRefreshing(false);
    toast.success('Data refreshed');
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
              Please connect your wallet to view your institution profile
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // Not an institution
  if (!isInstitution) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-md">
          <CardHeader>
            <div className="flex items-center space-x-2 text-red-600 mb-2">
              <AlertCircle className="h-5 w-5" />
              <CardTitle>Institution Access Required</CardTitle>
            </div>
            <CardDescription>
              You need to register as an institution to access this page
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/dashboard')} className="w-full">
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Loading
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-md">
          <CardContent className="py-12 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-3 text-primary" />
            <p className="text-muted-foreground">Loading institution data from blockchain...</p>
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
            <Building2 className="h-8 w-8 mr-3 text-primary" />
            {institutionData?.name || 'Institution Profile'}
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage your institution and issue credentials
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          {institutionData?.verified ? (
            <Badge variant="success" className="text-sm px-3 py-1">
              <CheckCircle className="h-3 w-3 mr-1" />
              Verified Institution
            </Badge>
          ) : (
            <Badge variant="warning" className="text-sm px-3 py-1">
              <AlertCircle className="h-3 w-3 mr-1" />
              Pending Verification
            </Badge>
          )}
        </div>
      </div>

      {/* Institution Info */}
      <Card>
        <CardHeader>
          <CardTitle>Institution Information</CardTitle>
          <CardDescription>Your blockchain identity</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">DID Address</span>
            <code className="text-xs font-mono bg-muted px-2 py-1 rounded">
              {didAddress}
            </code>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Registered</span>
            <span className="text-sm">
              {institutionData ? new Date(institutionData.registeredAt).toLocaleDateString() : 'Unknown'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Status</span>
            <Badge variant={institutionData?.verified ? 'success' : 'warning'}>
              {institutionData?.verified ? 'Verified' : 'Pending'}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Stats from Blockchain */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
              <FileText className="h-4 w-4 mr-2" />
              Credentials Issued
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{issuedCount}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Total credentials on blockchain
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
              <Users className="h-4 w-4 mr-2" />
              Endorsements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reputation?.endorsementsReceived || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Received from peers
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
              <Award className="h-4 w-4 mr-2" />
              Reputation Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reputation?.totalScore || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Out of 1000
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
              <TrendingUp className="h-4 w-4 mr-2" />
              Verifications
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reputation?.credentialsVerified || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Credentials verified
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Reputation Breakdown */}
      {reputation && reputation.totalScore > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Reputation Breakdown</CardTitle>
            <CardDescription>How your score is calculated</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">Credentials Issued (×10)</span>
              <span className="font-semibold">
                {reputation.credentialsIssued} × 10 = {reputation.credentialsIssued * 10}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Endorsements Received (×20)</span>
              <span className="font-semibold">
                {reputation.endorsementsReceived} × 20 = {reputation.endorsementsReceived * 20}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Verifications Done (×5)</span>
              <span className="font-semibold">
                {reputation.credentialsVerified} × 5 = {reputation.credentialsVerified * 5}
              </span>
            </div>
            <div className="pt-3 border-t flex items-center justify-between">
              <span className="font-semibold">Total Score</span>
              <span className="text-2xl font-bold text-primary">{reputation.totalScore}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button 
            variant="outline" 
            className="justify-start h-auto py-4"
            onClick={() => navigate('/institution/issue')}
          >
            <div className="flex flex-col items-start w-full">
              <div className="flex items-center space-x-2 mb-1">
                <Plus className="h-4 w-4" />
                <span className="font-semibold">Issue Credential</span>
              </div>
              <span className="text-xs text-muted-foreground">
                Issue a new credential to a student
              </span>
            </div>
          </Button>

          <Button 
            variant="outline" 
            className="justify-start h-auto py-4"
            onClick={() => navigate('/institution/issued')}
          >
            <div className="flex flex-col items-start w-full">
              <div className="flex items-center space-x-2 mb-1">
                <FileText className="h-4 w-4" />
                <span className="font-semibold">View Issued</span>
              </div>
              <span className="text-xs text-muted-foreground">
                See all credentials you've issued
              </span>
            </div>
          </Button>

          <Button 
            variant="outline" 
            className="justify-start h-auto py-4"
            onClick={() => navigate('/institution/requests')}
          >
            <div className="flex flex-col items-start w-full">
              <div className="flex items-center space-x-2 mb-1">
                <Users className="h-4 w-4" />
                <span className="font-semibold">Requests</span>
              </div>
              <span className="text-xs text-muted-foreground">
                Review credential requests
              </span>
            </div>
          </Button>
        </CardContent>
      </Card>

      {/* Blockchain Status */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <CheckCircle className="h-5 w-5 text-blue-600 dark:text-blue-500 flex-shrink-0 mt-0.5" />
          <div className="text-sm flex-1">
            <p className="font-semibold text-blue-800 dark:text-blue-400">
              Connected to Blockchain
            </p>
            <p className="text-blue-700 dark:text-blue-300 mt-1">
              All data is fetched directly from the blockchain in real-time. 
              Click refresh to update with the latest information.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}