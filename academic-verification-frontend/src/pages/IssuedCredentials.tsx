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
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';

interface IssuedCredential {
  id: string;
  holder: string;
  holderName?: string;
  credentialType: string;
  degreeName: string;
  issuedAt: number;
  status: 'active' | 'revoked';
}

export default function IssuedCredentials() {
  const navigate = useNavigate();
  const { isInstitution, didAddress } = useDIDStore();
  const [credentials, setCredentials] = useState<IssuedCredential[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'revoked'>('all');

  useEffect(() => {
    if (!isInstitution) {
      navigate('/institution');
      return;
    }
    fetchIssuedCredentials();
  }, [isInstitution]);

  const fetchIssuedCredentials = async () => {
    setLoading(true);
    try {
      // TODO: Replace with actual blockchain query
      // Query credentials where issuer = didAddress
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock data
      const mockCredentials: IssuedCredential[] = [
        {
          id: 'cred_1',
          holder: '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY',
          holderName: 'John Doe',
          credentialType: "Bachelor's Degree",
          degreeName: 'B.S. in Computer Science',
          issuedAt: Date.now() - 30 * 24 * 60 * 60 * 1000,
          status: 'active',
        },
        {
          id: 'cred_2',
          holder: '5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty',
          holderName: 'Jane Smith',
          credentialType: "Master's Degree",
          degreeName: 'M.S. in Data Science',
          issuedAt: Date.now() - 60 * 24 * 60 * 60 * 1000,
          status: 'active',
        },
      ];
      
      setCredentials(mockCredentials);
    } catch (error) {
      console.error('Failed to fetch issued credentials:', error);
      toast.error('Failed to load credentials');
    } finally {
      setLoading(false);
    }
  };

  const handleRevoke = async (credentialId: string) => {
    if (!confirm('Are you sure you want to revoke this credential? This action cannot be undone.')) {
      return;
    }

    try {
      // TODO: Call blockchain revoke_credential extrinsic
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setCredentials(prev =>
        prev.map(cred =>
          cred.id === credentialId ? { ...cred, status: 'revoked' as const } : cred
        )
      );
      
      toast.success('Credential revoked successfully');
    } catch (error) {
      toast.error('Failed to revoke credential');
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
        <Button onClick={() => navigate('/institution/issue')}>
          <Plus className="h-4 w-4 mr-2" />
          Issue Credential
        </Button>
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
            <p className="text-muted-foreground">Loading credentials...</p>
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
                    <Button variant="outline" size="sm">
                      <Eye className="h-3 w-3 mr-1" />
                      View
                    </Button>
                    
                    {credential.status === 'active' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRevoke(credential.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <XCircle className="h-3 w-3 mr-1" />
                        Revoke
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