// src/pages/MyRequests.tsx - FIXED WITH REAL BLOCKCHAIN DATA
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, FileText, RefreshCw, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import RequestsList from '@/components/requests/RequestsList';
import CreateRequestForm from '@/components/requests/CreateRequestForm';
import { useWalletStore } from '@/store/wallet.store';
import { useDIDStore } from '@/store/did.store';
import { useCredentialRequestsStore } from '@/store/credentialRequests.store';
import { useBlockchain } from '@/hooks/blockchain/useBlockchain';
import type { CredentialRequest } from '@/types/credentialRequest.types';
import { toast } from 'sonner';

export default function MyRequests() {
  const navigate = useNavigate();
  const { isConnected } = useWalletStore();
  const { hasDID, didAddress } = useDIDStore();
  const { queries, isReady } = useBlockchain();
  const { 
    myRequests, 
    setMyRequests, 
    loading, 
    setLoading 
  } = useCredentialRequestsStore();
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<CredentialRequest | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    if (isConnected && hasDID && didAddress && isReady && queries) {
      fetchMyRequests();
    }
  }, [isConnected, hasDID, didAddress, isReady, queries]);

  const fetchMyRequests = async () => {
    if (!queries || !didAddress) {
      console.log('⚠️ Missing queries or didAddress');
      return;
    }

    setLoading(true);
    setFetchError(null);

    try {
      console.log('📡 Fetching credential requests for:', didAddress);
      
      // Note: Since your pallets don't have a credential request system yet,
      // we'll need to add this functionality to your runtime
      // For now, this will return empty array until you add the request pallet
      
      // TODO: Add a credential request pallet to your runtime with:
      // - RequestsByRequester storage map
      // - Request struct with status, dates, etc.
      
      // Placeholder: Check if your API has the credential request query
      const api = queries.api;
      
      if (!api) {
        throw new Error('API not available');
      }

      // Check if credential request pallet exists
      // @ts-ignore - Dynamic pallet check
      if (!api.query.credentialRequest) {
        console.warn('⚠️ Credential request pallet not found in runtime');
        toast.info('Credential request feature not yet deployed', {
          description: 'This feature requires the request pallet to be added to the runtime',
        });
        setMyRequests([]);
        setLoading(false);
        return;
      }

      // If pallet exists, query requests
      // @ts-ignore - Dynamic pallet query
      const requestsData = await api.query.credentialRequest.requestsByRequester(didAddress);
      
      if (requestsData.isEmpty) {
        console.log('ℹ️ No requests found for this user');
        setMyRequests([]);
        setLoading(false);
        return;
      }

      const requestsList = requestsData.toJSON() as any[];
      console.log('✅ Found requests:', requestsList);

      // Fetch institution names for each request
      const requestsWithDetails = await Promise.all(
        requestsList.map(async (req) => {
          try {
            const institution = await queries.did.getInstitution(req.institution);
            
            return {
              id: req.requestId.toString(),
              requestId: req.requestId,
              requester: req.requester,
              institution: req.institution,
              institutionName: institution?.name,
              credentialType: formatCredentialType(req.credentialType),
              programName: req.programName,
              fieldOfStudy: req.fieldOfStudy,
              startDate: req.startDate,
              endDate: req.endDate,
              major: req.major,
              minor: req.minor,
              expectedGPA: req.expectedGPA,
              studentId: req.studentId,
              expectedGraduationDate: req.expectedGraduationDate,
              additionalNotes: req.additionalNotes,
              supportingDocuments: req.supportingDocuments,
              status: mapRequestStatus(req.status),
              createdAt: req.createdAt,
              updatedAt: req.updatedAt,
              reviewedAt: req.reviewedAt,
              rejectionReason: req.rejectionReason,
            } as CredentialRequest;
          } catch (error) {
            console.error('Error processing request:', error);
            return null;
          }
        })
      );

      const validRequests = requestsWithDetails.filter(r => r !== null) as CredentialRequest[];
      console.log('✅ Processed requests:', validRequests);
      
      setMyRequests(validRequests);
      
      if (validRequests.length > 0) {
        toast.success(`Found ${validRequests.length} request(s)`);
      }
    } catch (error: any) {
      console.error('❌ Failed to fetch requests:', error);
      setFetchError(error.message || 'Failed to fetch requests');
      
      // Show helpful error message
      if (error.message?.includes('credentialRequest')) {
        toast.info('Feature coming soon', {
          description: 'Credential requests will be available once the request pallet is deployed',
        });
      } else {
        toast.error('Failed to load requests', {
          description: 'Check console for details',
        });
      }
      
      setMyRequests([]);
    } finally {
      setLoading(false);
    }
  };

  // Helper to format credential type from blockchain enum
  const formatCredentialType = (type: any): string => {
    const typeMap: Record<string, string> = {
      Degree: "Bachelor's Degree",
      MastersDegree: "Master's Degree",
      Doctorate: "Doctorate (PhD)",
      Certificate: "Certificate",
      Transcript: "Transcript",
      ProfessionalCertification: "Professional Certification",
      Other: "Other",
    };

    if (typeof type === 'string') {
      return typeMap[type] || type;
    }

    if (typeof type === 'object') {
      const key = Object.keys(type)[0];
      return typeMap[key] || key;
    }

    return 'Unknown';
  };

  // Helper to map blockchain status to UI status
  const mapRequestStatus = (status: any): CredentialRequest['status'] => {
    if (typeof status === 'string') {
      return status.toLowerCase() as CredentialRequest['status'];
    }
    
    if (typeof status === 'object') {
      const key = Object.keys(status)[0].toLowerCase();
      return key as CredentialRequest['status'];
    }
    
    return 'pending';
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchMyRequests();
    setRefreshing(false);
    toast.success('Requests refreshed');
  };

  const handleViewDetails = (request: CredentialRequest) => {
    setSelectedRequest(request);
    setShowDetailModal(true);
  };

  const handleCreateSuccess = async () => {
    setShowCreateModal(false);
    // Wait a moment for the transaction to finalize
    await new Promise(resolve => setTimeout(resolve, 2000));
    await fetchMyRequests();
  };

  // Not connected
  if (!isConnected || !hasDID) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-md">
          <CardHeader>
            <div className="flex items-center space-x-2 text-yellow-600 mb-2">
              <AlertCircle className="h-5 w-5" />
              <CardTitle>Access Required</CardTitle>
            </div>
            <CardDescription>
              {!isConnected 
                ? 'Please connect your wallet to view credential requests'
                : 'You need a DID to request credentials'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/dashboard')} className="w-full">
              {!isConnected ? 'Connect Wallet' : 'Create DID'}
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
            <FileText className="h-8 w-8 mr-3 text-primary" />
            My Requests
          </h1>
          <p className="text-muted-foreground mt-1">
            Track your credential requests to institutions (fetched from blockchain)
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
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Request
          </Button>
        </div>
      </div>

      {/* Connection Status */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <FileText className="h-5 w-5 text-blue-600 dark:text-blue-500 flex-shrink-0 mt-0.5" />
          <div className="text-sm flex-1">
            <p className="font-semibold text-blue-800 dark:text-blue-400">
              {isReady ? 'Connected to Blockchain' : 'Connecting...'}
            </p>
            <p className="text-blue-700 dark:text-blue-300 mt-1">
              All requests are fetched directly from the blockchain. 
              Your DID: <code className="text-xs font-mono">{didAddress?.slice(0, 10)}...{didAddress?.slice(-8)}</code>
            </p>
          </div>
        </div>
      </div>

      {/* Feature Status Warning */}
      {fetchError?.includes('credentialRequest') && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-500 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold text-yellow-800 dark:text-yellow-400">
                Feature Coming Soon
              </p>
              <p className="text-yellow-700 dark:text-yellow-300 mt-1">
                The credential request system requires adding a request pallet to your runtime. 
                Until then, students can still receive credentials directly from institutions.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {fetchError && !fetchError.includes('credentialRequest') && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-500 flex-shrink-0 mt-0.5" />
            <div className="text-sm flex-1">
              <p className="font-semibold text-red-800 dark:text-red-400">
                Error Loading Requests
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

      {/* Info Banner */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <FileText className="h-5 w-5 text-blue-600 dark:text-blue-500 flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-semibold text-blue-800 dark:text-blue-400">
              How It Works
            </p>
            <ul className="text-blue-700 dark:text-blue-300 mt-2 space-y-1 list-disc list-inside">
              <li>Submit a request to any verified institution</li>
              <li>The institution reviews your information</li>
              <li>If approved, they'll issue your credential</li>
              <li>Track all your requests in one place</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Requests List */}
      <RequestsList
        requests={myRequests}
        loading={loading}
        emptyMessage={
          isReady 
            ? "You haven't submitted any requests yet. Requests will appear here once the request pallet is deployed."
            : "Waiting for blockchain connection..."
        }
        viewMode="student"
        onViewDetails={handleViewDetails}
      />

      {/* Create Request Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        className="max-w-4xl"
      >
        <CreateRequestForm
          onSuccess={handleCreateSuccess}
          onCancel={() => setShowCreateModal(false)}
        />
      </Modal>

      {/* Detail Modal */}
      <Modal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        className="max-w-2xl"
      >
        {selectedRequest && (
          <div className="p-6">
            <h2 className="text-2xl font-bold mb-4">Request Details</h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-semibold text-muted-foreground">Program</label>
                <p className="text-lg">{selectedRequest.programName}</p>
              </div>
              <div>
                <label className="text-sm font-semibold text-muted-foreground">Institution</label>
                <p>{selectedRequest.institutionName || selectedRequest.institution}</p>
              </div>
              <div>
                <label className="text-sm font-semibold text-muted-foreground">Status</label>
                <p className="capitalize">{selectedRequest.status}</p>
              </div>
              {selectedRequest.rejectionReason && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                  <p className="text-sm font-semibold text-red-800 dark:text-red-400">
                    Rejection Reason:
                  </p>
                  <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                    {selectedRequest.rejectionReason}
                  </p>
                </div>
              )}
              {selectedRequest.additionalNotes && (
                <div>
                  <label className="text-sm font-semibold text-muted-foreground">Your Notes</label>
                  <p className="text-sm">{selectedRequest.additionalNotes}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}