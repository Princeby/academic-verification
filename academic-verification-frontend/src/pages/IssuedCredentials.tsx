// src/pages/IssuedCredentials.tsx - UPDATED WITH REAL BLOCKCHAIN QUERIES
import { useState, useEffect } from 'react';
import { useDIDStore } from '@/store/did.store';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import {
  FileText,
  Search,
  Plus,
  Eye,
  XCircle,
  Calendar,
  User,
  Loader2,
  RefreshCw,
  Copy
} from 'lucide-react';
import { toast } from 'sonner';
import { useBlockchain } from '@/hooks/blockchain/useBlockchain';
import { useWalletStore } from '@/store/wallet.store';
import { hexToString } from '@polkadot/util';

interface IssuedCredential {
  id: string;
  holder: string;
  holderName?: string;
  credentialType: string;
  degreeName: string;
  issuedAt: number;
  status: 'active' | 'revoked';
  metadata?: string;
}

export default function IssuedCredentials() {
  const navigate = useNavigate();
  const { isInstitution, didAddress } = useDIDStore();
  const { queries, transactions, isReady, api } = useBlockchain();
  const { account } = useWalletStore();

  const [credentials, setCredentials] = useState<IssuedCredential[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'revoked'>('all');
  const [revoking, setRevoking] = useState<string | null>(null);
  const [selectedCredential, setSelectedCredential] = useState<IssuedCredential | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

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
      console.log('📡 Fetching issued credentials for:', didAddress);

      // Fetch credentials from blockchain
      const blockchainCredentials = await queries.credential.getCredentialsByIssuer(didAddress);

      console.log('✅ Fetched issued credentials:', blockchainCredentials);

      if (blockchainCredentials.length === 0) {
        console.log('ℹ️ No issued credentials found');
        setCredentials([]);
        setLoading(false);
        return;
      }

      // Helper to decode hex strings
      const decodeHexString = (hexString: string | unknown): string => {
        try {
          if (typeof hexString !== 'string') {
            return String(hexString);
          }
          if (!hexString.startsWith('0x')) {
            return hexString;
          }
          const decoded = hexToString(hexString);
          return decoded.replace(/\0/g, '');
        } catch (error) {
          console.error('Error decoding hex string:', error);
          return String(hexString);
        }
      };

      // Parse and format credentials
      const formattedCredentials: IssuedCredential[] = blockchainCredentials.map((cred: unknown) => {
        const credential = cred as {
          id: string;
          holder: string;
          credentialType: string;
          metadata?: string;
          issuedAt: number;
          revoked?: boolean;
        };
        let degreeName = 'Academic Credential';
        let metadata = '';

        // Parse metadata - first decode from hex if needed
        if (credential.metadata) {
          try {
            // Decode hex string first
            const decodedMetadata = decodeHexString(credential.metadata);
            // Then parse as JSON
            const parsedMetadata = JSON.parse(decodedMetadata);
            degreeName = parsedMetadata.degreeName || parsedMetadata.programName || degreeName;
            metadata = decodedMetadata; // Store decoded version
          } catch {
            // If not hex or not JSON, use as-is
            degreeName = decodeHexString(credential.metadata);
            metadata = decodeHexString(credential.metadata);
          }
        }

        // Handle issuedAt - it might be in seconds or block number
        // If it's 0 or very small, it might be a block number, otherwise treat as timestamp
        let issuedAtTimestamp = credential.issuedAt;
        if (issuedAtTimestamp > 0 && issuedAtTimestamp < 10000000000) {
          // Likely in seconds, convert to milliseconds
          issuedAtTimestamp = issuedAtTimestamp * 1000;
        }

        return {
          id: credential.id,
          holder: credential.holder,
          credentialType: credential.credentialType,
          degreeName,
          issuedAt: issuedAtTimestamp,
          status: credential.revoked ? 'revoked' : 'active',
          metadata,
        };
      });

      console.log('✅ Formatted credentials:', formattedCredentials);
      setCredentials(formattedCredentials);

      if (formattedCredentials.length > 0) {
        toast.success(`Found ${formattedCredentials.length} issued credential(s)`);
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

    if (!transactions || !account || !api) {
      toast.error('Blockchain not connected');
      return;
    }

    setRevoking(credentialId);

    try {
      console.log('🔐 Revoking credential:', credentialId);

      const statusToast = toast.loading('Preparing transaction...');

      // Convert credentialId string to bytes if needed
      const credentialIdBytes = credentialId.startsWith('0x')
        ? credentialId
        : '0x' + credentialId;

      // Revoke credential
      const result = await transactions.credential.revokeCredential(
        account,
        credentialIdBytes,
        (status) => {
          if (status.status === 'signing') {
            toast.loading('Waiting for signature...', { id: statusToast });
          } else if (status.status === 'inBlock') {
            toast.loading('Transaction in block...', { id: statusToast });
          } else if (status.status === 'finalized') {
            toast.dismiss(statusToast);
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

        toast.success('Credential revoked successfully', {
          description: `Transaction: ${result.transactionHash?.slice(0, 10)}...`,
        });
      } else {
        throw new Error(result.error || 'Transaction failed');
      }
    } catch (error: any) {
      console.error('❌ Failed to revoke credential:', error);
      toast.error('Failed to revoke credential', {
        description: error.message || 'Check console for details',
      });
    } finally {
      setRevoking(null);
    }
  };

  const filteredCredentials = credentials.filter(cred => {
    const matchesSearch = !searchQuery ||
      cred.degreeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cred.holderName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cred.holder.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = filterStatus === 'all' || cred.status === filterStatus;

    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: credentials.length,
    active: credentials.filter(c => c.status === 'active').length,
    revoked: credentials.filter(c => c.status === 'revoked').length,
  };

  if (!isInstitution) {
    return null;
  }

  if (!isReady) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-md">
          <CardContent className="py-12 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-3 text-primary" />
            <p className="text-muted-foreground">Connecting to blockchain...</p>
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
            Manage credentials issued by your institution from the blockchain
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

                    <div className="space-y-1 text-sm">
                      <div className="flex items-center text-muted-foreground">
                        <User className="h-3 w-3 mr-2" />
                        <span>
                          {credential.holderName || 'Unknown'}
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
                      onClick={() => {
                        setSelectedCredential(credential);
                        setShowDetailModal(true);
                      }}
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

      {/* Credential Detail Modal */}
      <Modal
        isOpen={showDetailModal}
        onClose={() => {
          setShowDetailModal(false);
          setSelectedCredential(null);
        }}
        title="Credential Details"
        description="Issued credential information"
        className="max-w-2xl"
      >
        {selectedCredential && (
          <div className="space-y-6">
            {/* Status Badge */}
            <div className="flex items-center justify-between">
              <Badge variant={selectedCredential.status === 'active' ? 'success' : 'error'} className="text-sm">
                {selectedCredential.status === 'active' ? 'Active' : 'Revoked'}
              </Badge>
              <Badge variant="outline">{selectedCredential.credentialType}</Badge>
            </div>

            {/* Degree Name */}
            <div>
              <label className="text-sm font-semibold text-muted-foreground">Degree / Certificate</label>
              <p className="text-lg font-medium mt-1">{selectedCredential.degreeName}</p>
            </div>

            {/* Credential ID */}
            <div>
              <label className="text-sm font-semibold text-muted-foreground">Credential ID</label>
              <div className="flex items-center gap-2 mt-1">
                <p className="font-mono text-sm break-all bg-muted p-2 rounded flex-1">{selectedCredential.id}</p>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 flex-shrink-0"
                  onClick={() => {
                    navigator.clipboard.writeText(selectedCredential.id);
                    toast.success('Credential ID copied!');
                  }}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Holder */}
            <div>
              <label className="text-sm font-semibold text-muted-foreground">Holder Address</label>
              <div className="flex items-center gap-2 mt-1">
                <p className="font-mono text-sm break-all bg-muted p-2 rounded flex-1">{selectedCredential.holder}</p>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 flex-shrink-0"
                  onClick={() => {
                    navigator.clipboard.writeText(selectedCredential.holder);
                    toast.success('Holder address copied!');
                  }}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Issue Date */}
            <div>
              <label className="text-sm font-semibold text-muted-foreground">Issued Date</label>
              <p className="mt-1">
                {selectedCredential.issuedAt > 0
                  ? new Date(selectedCredential.issuedAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })
                  : 'Not available'
                }
              </p>
            </div>

            {/* Metadata Details */}
            {selectedCredential.metadata && (() => {
              try {
                const meta = JSON.parse(selectedCredential.metadata);
                return (
                  <div className="space-y-4 border-t pt-4">
                    <h4 className="font-semibold">Additional Details</h4>
                    <div className="grid grid-cols-2 gap-4">
                      {meta.fieldOfStudy && (
                        <div>
                          <label className="text-sm text-muted-foreground">Field of Study</label>
                          <p className="font-medium">{meta.fieldOfStudy}</p>
                        </div>
                      )}
                      {meta.major && (
                        <div>
                          <label className="text-sm text-muted-foreground">Major</label>
                          <p className="font-medium">{meta.major}</p>
                        </div>
                      )}
                      {meta.minor && (
                        <div>
                          <label className="text-sm text-muted-foreground">Minor</label>
                          <p className="font-medium">{meta.minor}</p>
                        </div>
                      )}
                      {meta.gpa && (
                        <div>
                          <label className="text-sm text-muted-foreground">GPA</label>
                          <p className="font-medium">{meta.gpa}</p>
                        </div>
                      )}
                      {meta.graduationDate && (
                        <div>
                          <label className="text-sm text-muted-foreground">Graduation Date</label>
                          <p className="font-medium">{meta.graduationDate}</p>
                        </div>
                      )}
                      {meta.honors && (
                        <div>
                          <label className="text-sm text-muted-foreground">Honors</label>
                          <p className="font-medium">{meta.honors}</p>
                        </div>
                      )}
                      {meta.referenceNumber && (
                        <div>
                          <label className="text-sm text-muted-foreground">Reference Number</label>
                          <p className="font-medium">{meta.referenceNumber}</p>
                        </div>
                      )}
                    </div>
                    {meta.notes && (
                      <div>
                        <label className="text-sm text-muted-foreground">Notes</label>
                        <p className="font-medium">{meta.notes}</p>
                      </div>
                    )}
                  </div>
                );
              } catch {
                return (
                  <div>
                    <label className="text-sm font-semibold text-muted-foreground">Raw Metadata</label>
                    <p className="font-mono text-sm mt-1 break-all bg-muted p-2 rounded">
                      {selectedCredential.metadata}
                    </p>
                  </div>
                );
              }
            })()}

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => {
                  setShowDetailModal(false);
                  setSelectedCredential(null);
                }}
              >
                Close
              </Button>
              {selectedCredential.status === 'active' && (
                <Button
                  variant="destructive"
                  onClick={() => {
                    handleRevoke(selectedCredential.id);
                    setShowDetailModal(false);
                    setSelectedCredential(null);
                  }}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Revoke Credential
                </Button>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}