// src/pages/InstitutionRequests.tsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, RefreshCw, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import RequestsList from '@/components/requests/RequestsList';
import ReviewRequestModal from '@/components/requests/ReviewRequestModal';
import { useWalletStore } from '@/store/wallet.store';
import { useDIDStore } from '@/store/did.store';
import { useCredentialRequestsStore } from '@/store/credentialRequests.store';
import type { CredentialRequest } from '@/types/credentialRequest.types';
import { toast } from 'sonner';

export default function InstitutionRequests() {
  const navigate = useNavigate();
  const { isConnected } = useWalletStore();
  const { hasDID, isInstitution, didAddress } = useDIDStore();
  const { 
    receivedRequests, 
    setReceivedRequests, 
    loading, 
    setLoading,
    getPendingCount
  } = useCredentialRequestsStore();
  
  const [selectedRequest, setSelectedRequest] = useState<CredentialRequest | null>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!isInstitution) {
      navigate('/institution');
      return;
    }

    if (isConnected && hasDID && didAddress) {
      fetchReceivedRequests();
    }
  }, [isConnected, hasDID, didAddress, isInstitution]);

  const fetchReceivedRequests = async () => {
    setLoading(true);
    try {
      // TODO: Query blockchain for requests where institution = didAddress
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Mock data
      const mockRequests: CredentialRequest[] = [
        {
          id: 'req_3',
          requestId: 3,
          requester: '5DTestDqcsdhBM8Y1s5eHMvx1tyDWRxf8LxbCQ8eW3Lw1Kk',
          requesterName: 'John Doe',
          institution: didAddress!,
          credentialType: "Bachelor's Degree",
          programName: 'Bachelor of Science in Computer Science',
          fieldOfStudy: 'Computer Science',
          startDate: '2020-09-01',
          endDate: '2024-05-15',
          studentId: 'STU123456',
          major: 'Software Engineering',
          minor: 'Mathematics',
          expectedGPA: '3.92',
          additionalNotes: 'I participated in the honors program and completed a senior thesis on distributed systems.',
          status: 'pending',
          createdAt: Date.now() - 2 * 24 * 60 * 60 * 1000,
          updatedAt: Date.now() - 2 * 24 * 60 * 60 * 1000,
          supportingDocuments: [
            'QmTest1234567890abcdefghijklmnopqrstuvwxyz',
            'QmTest0987654321zyxwvutsrqponmlkjihgfedcba'
          ]
        },
        {
          id: 'req_4',
          requestId: 4,
          requester: '5ETestDqcsdhBM8Y1s5eHMvx1tyDWRxf8LxbCQ8eW3Lw2Kk',
          requesterName: 'Jane Smith',
          institution: didAddress!,
          credentialType: "Master's Degree",
          programName: 'Master of Science in Data Science',
          fieldOfStudy: 'Data Science',
          startDate: '2022-09-01',
          endDate: '2024-05-15',
          studentId: 'STU789012',
          expectedGPA: '3.85',
          status: 'pending',
          createdAt: Date.now() - 5 * 24 * 60 * 60 * 1000,
          updatedAt: Date.now() - 5 * 24 * 60 * 60 * 1000,
        },
        {
          id: 'req_5',
          requestId: 5,
          requester: '5FTestDqcsdhBM8Y1s5eHMvx1tyDWRxf8LxbCQ8eW3Lw3Kk',
          requesterName: 'Bob Johnson',
          institution: didAddress!,
          credentialType: 'Certificate',
          programName: 'Full Stack Web Development Bootcamp',
          fieldOfStudy: 'Web Development',
          startDate: '2024-01-01',
          endDate: '2024-04-30',
          status: 'approved',
          createdAt: Date.now() - 20 * 24 * 60 * 60 * 1000,
          updatedAt: Date.now() - 10 * 24 * 60 * 60 * 1000,
          reviewedAt: Date.now() - 10 * 24 * 60 * 60 * 1000,
        },
      ];

      setReceivedRequests(mockRequests);
    } catch (error) {
      console.error('Failed to fetch requests:', error);
      toast.error('Failed to load requests');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchReceivedRequests();
    setRefreshing(false);
    toast.success('Requests refreshed');
  };

  const handleViewDetails = (request: CredentialRequest) => {
    setSelectedRequest(request);
    // Could open a detail-only modal
    toast.info('Opening request details...');
  };

  const handleReview = (request: CredentialRequest) => {
    setSelectedRequest(request);
    setShowReviewModal(true);
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
                : 'You need a DID to manage requests'
              }
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

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
              Only verified institutions can access this page
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/institution')} className="w-full">
              Register as Institution
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const pendingCount = getPendingCount();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center">
            <FileText className="h-8 w-8 mr-3 text-primary" />
            Credential Requests
          </h1>
          <p className="text-muted-foreground mt-1">
            Review and approve student credential requests
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
        </div>
      </div>

      {/* Pending Alert */}
      {pendingCount > 0 && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-500 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold text-yellow-800 dark:text-yellow-400">
                {pendingCount} Request{pendingCount !== 1 ? 's' : ''} Awaiting Review
              </p>
              <p className="text-yellow-700 dark:text-yellow-300 mt-1">
                Students are waiting for your response. Please review pending requests promptly.
              </p>
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
              Review Guidelines
            </p>
            <ul className="text-blue-700 dark:text-blue-300 mt-2 space-y-1 list-disc list-inside">
              <li>Verify student information matches your records</li>
              <li>Check supporting documents carefully</li>
              <li>Provide clear rejection reasons if declining</li>
              <li>Approved requests can be fulfilled immediately</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Requests List */}
      <RequestsList
        requests={receivedRequests}
        loading={loading}
        emptyMessage="No credential requests received yet"
        viewMode="institution"
        onViewDetails={handleViewDetails}
        onReview={handleReview}
      />

      {/* Review Modal */}
      <ReviewRequestModal
        isOpen={showReviewModal}
        onClose={() => {
          setShowReviewModal(false);
          setSelectedRequest(null);
        }}
        request={selectedRequest}
      />
    </div>
  );
}