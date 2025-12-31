// src/components/requests/RequestsList.tsx
import { useState } from 'react';
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  Award,
  Ban,
  Eye,
  MoreVertical,
  Calendar,
  Building2,
  User,
  FileText,
  Search,
  Filter
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import type { CredentialRequest, RequestStatus } from '@/types/credentialRequest.types';
import { REQUEST_STATUS_CONFIG } from '@/types/credentialRequest.types';

interface RequestsListProps {
  requests: CredentialRequest[];
  loading?: boolean;
  emptyMessage?: string;
  viewMode: 'student' | 'institution';
  onViewDetails: (request: CredentialRequest) => void;
  onReview?: (request: CredentialRequest) => void;
}

export default function RequestsList({ 
  requests, 
  loading = false,
  emptyMessage = "No requests yet",
  viewMode,
  onViewDetails,
  onReview
}: RequestsListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<RequestStatus | 'all'>('all');

  // Filter requests
  const filteredRequests = requests.filter(req => {
    const matchesSearch = !searchQuery || 
      req.programName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.institutionName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.requesterName?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || req.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Get counts
  const counts = {
    total: requests.length,
    pending: requests.filter(r => r.status === 'pending').length,
    approved: requests.filter(r => r.status === 'approved').length,
    rejected: requests.filter(r => r.status === 'rejected').length,
    fulfilled: requests.filter(r => r.status === 'fulfilled').length,
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusIcon = (status: RequestStatus) => {
    const config = REQUEST_STATUS_CONFIG[status];
    const icons = {
      Clock,
      CheckCircle,
      XCircle,
      Award,
      Ban
    };
    return icons[config.icon as keyof typeof icons];
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-3" />
          <p className="text-muted-foreground">Loading requests...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{counts.total}</div>
            <p className="text-sm text-muted-foreground">Total</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-yellow-600">{counts.pending}</div>
            <p className="text-sm text-muted-foreground">Pending</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">{counts.approved}</div>
            <p className="text-sm text-muted-foreground">Approved</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-red-600">{counts.rejected}</div>
            <p className="text-sm text-muted-foreground">Rejected</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-blue-600">{counts.fulfilled}</div>
            <p className="text-sm text-muted-foreground">Fulfilled</p>
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
                  placeholder={`Search ${viewMode === 'student' ? 'by program or institution' : 'by student or program'}...`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="flex gap-2 flex-wrap">
              <Button
                variant={statusFilter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('all')}
              >
                All
              </Button>
              <Button
                variant={statusFilter === 'pending' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('pending')}
              >
                Pending
              </Button>
              <Button
                variant={statusFilter === 'approved' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('approved')}
              >
                Approved
              </Button>
              <Button
                variant={statusFilter === 'rejected' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('rejected')}
              >
                Rejected
              </Button>
              <Button
                variant={statusFilter === 'fulfilled' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('fulfilled')}
              >
                Fulfilled
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Requests List */}
      {filteredRequests.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
            <p className="text-lg font-medium mb-1">
              {searchQuery || statusFilter !== 'all'
                ? 'No requests match your filters'
                : emptyMessage
              }
            </p>
            <p className="text-sm text-muted-foreground">
              {searchQuery || statusFilter !== 'all'
                ? 'Try adjusting your search or filters'
                : viewMode === 'student' 
                  ? 'Submit a request to get started'
                  : 'Requests from students will appear here'
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredRequests.map((request) => {
            const StatusIcon = getStatusIcon(request.status);
            const statusConfig = REQUEST_STATUS_CONFIG[request.status];
            
            return (
              <Card key={request.id} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      {/* Header */}
                      <div className="flex items-start gap-3 mb-3">
                        <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <FileText className="h-6 w-6 text-primary" />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-lg truncate">
                              {request.programName}
                            </h3>
                            <Badge 
                              variant={
                                request.status === 'approved' || request.status === 'fulfilled' 
                                  ? 'success' 
                                  : request.status === 'rejected' 
                                  ? 'error'
                                  : request.status === 'pending'
                                  ? 'warning'
                                  : 'outline'
                              }
                            >
                              <StatusIcon className="h-3 w-3 mr-1" />
                              {statusConfig.label}
                            </Badge>
                            <Badge variant="outline">{request.credentialType}</Badge>
                          </div>
                          
                          <p className="text-sm text-muted-foreground">
                            {request.fieldOfStudy}
                          </p>
                        </div>
                      </div>

                      {/* Details Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                        <div className="flex items-center text-muted-foreground">
                          {viewMode === 'student' ? (
                            <>
                              <Building2 className="h-3 w-3 mr-2 flex-shrink-0" />
                              <span className="truncate">{request.institutionName}</span>
                            </>
                          ) : (
                            <>
                              <User className="h-3 w-3 mr-2 flex-shrink-0" />
                              <span className="truncate">
                                {request.requesterName || `${request.requester.slice(0, 8)}...`}
                              </span>
                            </>
                          )}
                        </div>

                        <div className="flex items-center text-muted-foreground">
                          <Calendar className="h-3 w-3 mr-2 flex-shrink-0" />
                          <span>Submitted {formatDate(request.createdAt)}</span>
                        </div>

                        {request.studentId && (
                          <div className="flex items-center text-muted-foreground">
                            <span className="font-medium mr-2">ID:</span>
                            <span>{request.studentId}</span>
                          </div>
                        )}

                        {request.supportingDocuments && request.supportingDocuments.length > 0 && (
                          <div className="flex items-center text-muted-foreground">
                            <FileText className="h-3 w-3 mr-2 flex-shrink-0" />
                            <span>{request.supportingDocuments.length} document(s)</span>
                          </div>
                        )}
                      </div>

                      {/* Rejection Reason */}
                      {request.status === 'rejected' && request.rejectionReason && (
                        <div className="mt-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded p-2">
                          <p className="text-xs font-semibold text-red-800 dark:text-red-400">
                            Rejection Reason:
                          </p>
                          <p className="text-xs text-red-700 dark:text-red-300 mt-1">
                            {request.rejectionReason}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onViewDetails(request)}
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        View
                      </Button>
                      
                      {viewMode === 'institution' && request.status === 'pending' && onReview && (
                        <Button
                          size="sm"
                          onClick={() => onReview(request)}
                        >
                          Review
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}