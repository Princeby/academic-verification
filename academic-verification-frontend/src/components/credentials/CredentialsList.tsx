// src/components/credentials/CredentialsList.tsx
import { useState, useMemo } from 'react';
import { 
  Grid3x3, 
  List, 
  Search, 
  Filter,
  SortAsc,
  Award,
  Loader2
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Badge } from '../ui/Badge';
import CredentialCard, { Credential } from './CredentialCard';
import CredentialDetailModal from './CredentialDetailModal';
import { CREDENTIAL_TYPES, CREDENTIAL_STATUS } from '@/lib/utils/constants';

interface CredentialsListProps {
  credentials: Credential[];
  loading?: boolean;
  emptyMessage?: string;
}

type ViewMode = 'grid' | 'list';
type FilterStatus = 'all' | 'active' | 'revoked' | 'expired';
type SortOption = 'newest' | 'oldest' | 'name' | 'type';

export default function CredentialsList({ 
  credentials, 
  loading = false,
  emptyMessage = "No credentials yet"
}: CredentialsListProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [selectedCredential, setSelectedCredential] = useState<Credential | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Filter and sort credentials
  const filteredCredentials = useMemo(() => {
    let result = [...credentials];

    // Search filter
    if (searchQuery) {
      result = result.filter(cred => 
        cred.degreeName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cred.fieldOfStudy?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cred.issuerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cred.credentialType.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Status filter
    if (filterStatus !== 'all') {
      result = result.filter(cred => {
        if (filterStatus === 'active') {
          return !cred.revoked && (!cred.expiresAt || cred.expiresAt > Date.now());
        }
        if (filterStatus === 'revoked') {
          return cred.revoked;
        }
        if (filterStatus === 'expired') {
          return !cred.revoked && cred.expiresAt && cred.expiresAt < Date.now();
        }
        return true;
      });
    }

    // Type filter
    if (filterType !== 'all') {
      result = result.filter(cred => cred.credentialType === filterType);
    }

    // Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return b.issuedAt - a.issuedAt;
        case 'oldest':
          return a.issuedAt - b.issuedAt;
        case 'name':
          return (a.degreeName || '').localeCompare(b.degreeName || '');
        case 'type':
          return a.credentialType.localeCompare(b.credentialType);
        default:
          return 0;
      }
    });

    return result;
  }, [credentials, searchQuery, filterStatus, filterType, sortBy]);

  // Get credential counts by status
  const counts = useMemo(() => {
    return {
      total: credentials.length,
      active: credentials.filter(c => !c.revoked && (!c.expiresAt || c.expiresAt > Date.now())).length,
      revoked: credentials.filter(c => c.revoked).length,
      expired: credentials.filter(c => !c.revoked && c.expiresAt && c.expiresAt < Date.now()).length,
    };
  }, [credentials]);

  // Handle credential actions
  const handleViewDetails = (credential: Credential) => {
    setSelectedCredential(credential);
    setShowDetailModal(true);
  };

  const handleVerify = (credential: Credential) => {
    window.open(`/verify?hash=${credential.credentialHash}`, '_blank');
  };

  const handleShare = (credential: Credential) => {
    const shareUrl = `${window.location.origin}/verify?hash=${credential.credentialHash}`;
    navigator.clipboard.writeText(shareUrl);
    // Would show toast in real implementation
    alert('Share link copied to clipboard!');
  };

  const handleDownload = (credential: Credential) => {
    const data = {
      id: credential.id,
      type: credential.credentialType,
      degreeName: credential.degreeName,
      fieldOfStudy: credential.fieldOfStudy,
      holder: credential.holder,
      issuer: credential.issuer,
      credentialHash: credential.credentialHash,
      issuedAt: credential.issuedAt,
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `credential-${credential.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-3 text-primary" />
          <p className="text-muted-foreground">Loading credentials...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-accent rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Total</p>
          <p className="text-2xl font-bold">{counts.total}</p>
        </div>
        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
          <p className="text-sm text-green-700 dark:text-green-400">Active</p>
          <p className="text-2xl font-bold text-green-800 dark:text-green-300">{counts.active}</p>
        </div>
        <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
          <p className="text-sm text-red-700 dark:text-red-400">Revoked</p>
          <p className="text-2xl font-bold text-red-800 dark:text-red-300">{counts.revoked}</p>
        </div>
        <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4">
          <p className="text-sm text-yellow-700 dark:text-yellow-400">Expired</p>
          <p className="text-2xl font-bold text-yellow-800 dark:text-yellow-300">{counts.expired}</p>
        </div>
      </div>

      {/* Filters & Controls */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search credentials..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* View Mode Toggle */}
        <div className="flex gap-2">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            size="icon"
            onClick={() => setViewMode('grid')}
          >
            <Grid3x3 className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="icon"
            onClick={() => setViewMode('list')}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant={filterStatus === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilterStatus('all')}
        >
          All ({counts.total})
        </Button>
        <Button
          variant={filterStatus === 'active' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilterStatus('active')}
        >
          Active ({counts.active})
        </Button>
        <Button
          variant={filterStatus === 'revoked' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilterStatus('revoked')}
        >
          Revoked ({counts.revoked})
        </Button>
        <Button
          variant={filterStatus === 'expired' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilterStatus('expired')}
        >
          Expired ({counts.expired})
        </Button>

        <div className="ml-auto flex gap-2">
          {/* Type Filter */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-1.5 text-sm border border-input rounded-md bg-background"
          >
            <option value="all">All Types</option>
            {CREDENTIAL_TYPES.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="px-3 py-1.5 text-sm border border-input rounded-md bg-background"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="name">By Name</option>
            <option value="type">By Type</option>
          </select>
        </div>
      </div>

      {/* Results Count */}
      <div className="text-sm text-muted-foreground">
        Showing {filteredCredentials.length} of {credentials.length} credential{credentials.length !== 1 ? 's' : ''}
      </div>

      {/* Credentials Grid/List */}
      {filteredCredentials.length === 0 ? (
        <div className="text-center py-12">
          <Award className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
          <p className="text-lg font-medium mb-1">
            {searchQuery || filterStatus !== 'all' || filterType !== 'all' 
              ? 'No credentials match your filters'
              : emptyMessage
            }
          </p>
          <p className="text-sm text-muted-foreground">
            {searchQuery || filterStatus !== 'all' || filterType !== 'all'
              ? 'Try adjusting your search or filters'
              : 'Credentials you receive will appear here'
            }
          </p>
        </div>
      ) : (
        <div className={
          viewMode === 'grid'
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
            : 'flex flex-col gap-4'
        }>
          {filteredCredentials.map((credential) => (
            <CredentialCard
              key={credential.id}
              credential={credential}
              onViewDetails={() => handleViewDetails(credential)}
              onVerify={() => handleVerify(credential)}
              onShare={() => handleShare(credential)}
              onDownload={() => handleDownload(credential)}
            />
          ))}
        </div>
      )}

      {/* Detail Modal */}
      <CredentialDetailModal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        credential={selectedCredential}
      />
    </div>
  );
}