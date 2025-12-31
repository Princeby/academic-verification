// src/pages/MyRequests.tsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, FileText, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import RequestsList from '@/components/requests/RequestsList';
import CreateRequestForm from '@/components/requests/CreateRequestForm';
import { useWalletStore } from '@/store/wallet.store';
import { useDIDStore } from '@/store/did.store';
import { useCredentialRequestsStore } from '@/store/credentialRequests.store';
import type { CredentialRequest } from '@/types/credentialRequest.types';
import { toast } from 'sonner';

export default function MyRequests() {
  const navigate = useNavigate();
  const { isConnected } = useWalletStore();
  const { hasDID, didAddress } = useDIDStore();
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

  useEffect(() => {
    if (isConnected && hasDID && didAddress) {
      fetchMyRequests();
    }
  }, [isConnected, hasDID, didAddress]);

  const fetchMyRequests = async () => {
    setLoading(true);
    try {
      // TODO: Query blockchain for requests where requester = didAddress
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Mock data
      const mockRequests: CredentialRequest[] = [
        {
          id: 'req_1',
          requestId: 1,
          requester: didAddress!,
          institution: '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY',
          institutionName: 'Massachusetts Institute of Technology',
          credentialType: "Bachelor's Degree",
          programName: 'Bachelor of Science in Computer Science',
          fieldOfStudy: 'Computer Science',
          startDate: '2020-09-01',
          endDate: '2024-05-15',
          major: 'Software Engineering',
          expectedGPA: '3.85',
          status: 'pending',
          createdAt: Date.now() - 7 * 24 * 60 * 60 * 1000,
          updatedAt: Date.now() - 7 * 24 * 60 * 60 * 1000,
        },
        {
          id: 'req_2',
          requestId: 2,
          requester: didAddress!,
          institution: '5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty',
          institutionName: 'Stanford University',
          credentialType: 'Certificate',
          programName: 'Machine Learning Specialization',
          fieldOfStudy: 'Artificial Intelligence',
          startDate: '2024-01-01',
          endDate: '2024-03-30',
          status: 'approved',
          createdAt: Date.now() - 30 * 24 * 60 * 60 * 1000,
          updatedAt: Date.now() - 5 * 24 * 60 * 60 * 1000,
          reviewedAt: Date.now() - 5 * 24 * 60 * 60 * 1000,
        },
      ];

      setMyRequests(mockRequests);
    } catch (error) {
      console.error('Failed to fetch requests:', error);
      toast.error('Failed to load requests');
    } finally {
      setLoading(false);
    }
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

  if (!isConnected || !hasDID) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Access Required</CardTitle>
            <CardDescription>
              {!isConnected 
                ? 'Please connect your wallet to view credential requests'
                : 'You need a DID to request credentials'
              }
            </CardDescription>
          </CardHeader>
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
            Track your credential requests to institutions
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={refreshing}
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
        emptyMessage="You haven't submitted any requests yet"
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
          onSuccess={() => {
            setShowCreateModal(false);
            fetchMyRequests();
          }}
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
            {/* Add detailed view here - similar to ReviewRequestModal but read-only */}
            <div className="space-y-4">
              <div>
                <label className="text-sm font-semibold text-muted-foreground">Program</label>
                <p className="text-lg">{selectedRequest.programName}</p>
              </div>
              <div>
                <label className="text-sm font-semibold text-muted-foreground">Institution</label>
                <p>{selectedRequest.institutionName}</p>
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
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}