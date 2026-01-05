// src/pages/IssuedCredentials.tsx
import { useState, useEffect } from 'react';
import { useDIDStore } from '@/store/did.store';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { 
  FileText, 
  Search, 
  Plus,
  Download,
  Eye,
  XCircle,
  Calendar,
  User,
  Loader2,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { useBlockchain } from '@/hooks/blockchain/useBlockchain';
import { formatCredentialType } from '@/lib/blockchain/integration';

interface IssuedCredential {
  id: string;
  holder: string;
  holderName?: string;
  credentialType: string;
  degreeName: string;
  fieldOfStudy?: string;
  issuedAt: number;
  status: 'active' | 'revoked';
  credentialHash: string;
}

export default function IssuedCredentials() {
  const navigate = useNavigate();
  const { isInstitution, didAddress } = useDIDStore();
  const { queries, isReady, transactions, account } = useBlockchain();
  
  const [credentials, setCredentials] = useState<IssuedCredential[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'revoked'>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [revoking, setRevoking] = useState<string | null>(null);

  useEffect(() => {
    if (!isInstitution) {
      navigate('/institution');
      return;
    }

    if (isReady && queries && didAddress) {
      fetchIssuedCredentials();
    }
  }, [isInstitution, isReady, queries, didAddress]);

  const fetchIssuedCredentials = async () => {
    if (!queries || !didAddress) {
      console.log('Missing queries or didAddress');
      return;
    }

    setLoading(true);
    try {
      console.log('📡 Fetching issued credentials for institution:', didAddress);
      
      // Fetch credentials issued by this institution from blockchain
      const blockchainCredentials = await queries.credential.getCredentialsByIssuer(didAddress);
      
      console.log('✅ Fetched issued credentials:', blockchainCredentials);
      
      if (blockchainCredentials.length === 0) {
        console.log('ℹ️ No credentials issued yet');
        setCredentials([]);
        setLoading(false);
        return;
      }

      // Process credentials and format for display
      const processedCredentials: IssuedCredential[] = blockchainCredentials.map((cred) => {
        const metadata = parseMetadata(cred.metadata);
        
        return {
          id: cred.id,
          holder: cred.holder,
          holderName: undefined, // We'll fetch this if needed
          credentialType: formatCredentialType(cred.credentialType),
          degreeName: metadata.degreeName || 'Academic Credential',
          fieldOfStudy: metadata.fieldOfStudy,
          issuedAt: cred.issuedAt,
          status: cred.revoked ? 'revoked' : 'active',
          credentialHash: cred.credentialHash,
        } as IssuedCredential;
      });

      console.log('✅ Processed credentials:', processedCredentials);
      setCredentials(processedCredentials);
      
      if (processedCredentials.length > 0) {
        toast.success(`Found ${processedCredentials.length} issued credential(s)`);
      }
    } catch (error: any) {
      console.error('❌ Failed to fetch issued credentials:', error);
      toast.error('Failed to load credentials', {
        description: error.message || 'Check console for details',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchIssuedCredentials();
    setRefreshing(false);
    toast.success('Credentials refreshed');
  };

  const handleRevoke = async (credentialId: string) => {
    if (!confirm('Are you sure you want to revoke this credential? This action cannot be undone.')) {
      return;
    }

    if (!transactions || !account) {
      toast.error('Wallet not connected');
      return;
    }

    setRevoking(credentialId);

    try {
      console.log('🔄 Revoking credential:', credentialId);
      
      const result = await transactions.credential.revokeCredential(
        account,
        credentialId,
        (status) => {
          console.log('Transaction status:', status);
          if (status.status === 'signing') {
            toast.info('Please sign the transaction');
          }
        }
      );

      if (result.success) {
        console.log('✅ Credential revoked successfully');
        
        // Update local state
        setCredentials(prev =>
          prev.map(cred =>
            cred.id === credentialId ? { ...cred, status: 'revoked' as const } : cred
          )
        );
        
        toast.success('Credential revoked successfully');
      } else {
        throw new Error(result.error || 'Transaction failed');
      }
    } catch (error: any) {
      console.error('❌ Failed to revoke credential:', error);
      toast.error('Failed to revoke credential', {
        description: error.message || 'Please try again',
      });
    } finally {
      setRevoking(null);
    }
  };

  // Helper function to parse metadata
  function parseMetadata(metadata?: string): Record<string, any> {
    if (!metadata) return {};
    try {
      return JSON.parse(metadata);
    } catch {
      return { text: metadata };
    }
  }

  const filteredCredentials = credentials.filter(cred => {
    const matchesSearch = !searchQuery || 
      cred.degreeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cred.holderName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cred.holder.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cred.fieldOfStudy?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || cred.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: credentials.length,
    active: credentials.filter(c => c.status === 'active').length,
    revoked: credentials.filter(c => c.status === 'revoked').length,
  };

  // Not an institution - redirect
  if (!isInstitution) {
    return null;
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
            <FileText className="h-8 w-8 mr-3 text-primary" />
            Issued Credentials
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage credentials issued by your institution
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={refreshing || loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={() => navigate('/institution/issue')}>
            <Plus className="h-4 w-4 mr-2" />
            Issue Credential
          </Button>
        </div>
      </div>

      {/* Connection Status */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <FileText className="h-5 w-5 text-blue-600 dark:text-blue-500 flex-shrink-0 mt-0.5" />
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

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-sm text-muted-foreground">Total Issued</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
            <p className="text-sm text-muted-foreground">Active</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-red-600">{stats.revoked}</div>
            <p className="text-sm text-muted-foreground">Revoked</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by degree name, holder..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button
                variant={filterStatus === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterStatus('all')}
              >
                All ({stats.total})
              </Button>
              <Button
                variant={filterStatus === 'active' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterStatus('active')}
              >
                Active ({stats.active})
              </Button>
              <Button
                variant={filterStatus === 'revoked' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterStatus('revoked')}
              >
                Revoked ({stats.revoked})
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Credentials List */}
      {loading ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-3 text-primary" />
            <p className="text-muted-foreground">Loading credentials from blockchain...</p>
          </CardContent>
        </Card>
      ) : filteredCredentials.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
            <p className="text-lg font-medium mb-1">
              {searchQuery || filterStatus !== 'all'
                ? 'No credentials match your filters'
                : 'No credentials issued yet'
              }
            </p>
            <p className="text-sm text-muted-foreground">
              {searchQuery || filterStatus !== 'all'
                ? 'Try adjusting your search or filters'
                : 'Start by issuing your first credential'
              }
            </p>
            {!searchQuery && filterStatus === 'all' && (
              <Button
                onClick={() => navigate('/institution/issue')}
                className="mt-4"
              >
                <Plus className="h-4 w-4 mr-2" />
                Issue First Credential
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredCredentials.map((credential) => (
            <Card key={credential.id}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-2">
                      <h3 className="text-lg font-semibold truncate">
                        {credential.degreeName}
                      </h3>
                      <Badge variant={credential.status === 'active' ? 'success' : 'error'}>
                        {credential.status === 'active' ? 'Active' : 'Revoked'}
                      </Badge>
                      <Badge variant="outline">{credential.credentialType}</Badge>
                    </div>
                    
                    {credential.fieldOfStudy && (
                      <p className="text-sm text-muted-foreground mb-2">
                        {credential.fieldOfStudy}
                      </p>
                    )}
                    
                    <div className="space-y-1 text-sm">
                      <div className="flex items-center text-muted-foreground">
                        <User className="h-3 w-3 mr-2" />
                        <span>
                          {credential.holderName || 'Holder'} 
                          <code className="ml-2 text-xs">
                            {credential.holder.slice(0, 8)}...{credential.holder.slice(-6)}
                          </code>
                        </span>
                      </div>
                      
                      <div className="flex items-center text-muted-foreground">
                        <Calendar className="h-3 w-3 mr-2" />
                        <span>
                          Issued {new Date(credential.issuedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2 ml-4">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => window.open(`/verify?hash=${credential.credentialHash}`, '_blank')}
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      View
                    </Button>
                    
                    {credential.status === 'active' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRevoke(credential.id)}
                        disabled={revoking === credential.id}
                        className="text-red-600 hover:text-red-700"
                      >
                        {revoking === credential.id ? (
                          <>
                            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                            Revoking...
                          </>
                        ) : (
                          <>
                            <XCircle className="h-3 w-3 mr-1" />
                            Revoke
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}