// src/components/requests/ReviewRequestModal.tsx
import { useState } from 'react';
import { 
  CheckCircle, 
  XCircle, 
  FileText,
  Building2,
  User,
  Calendar,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { toast } from 'sonner';
import type { CredentialRequest } from '@/types/credentialRequest.types';
import { useCredentialRequestsStore } from '@/store/credentialRequests.store';

interface ReviewRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  request: CredentialRequest | null;
}

export default function ReviewRequestModal({ 
  isOpen, 
  onClose, 
  request 
}: ReviewRequestModalProps) {
  const [action, setAction] = useState<'approve' | 'reject' | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [processing, setProcessing] = useState(false);
  const { updateRequest } = useCredentialRequestsStore();

  if (!request) return null;

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleSubmitReview = async () => {
    if (!action) return;
    
    if (action === 'reject' && !rejectionReason.trim()) {
      toast.error('Please provide a reason for rejection');
      return;
    }

    setProcessing(true);

    try {
      // TODO: Submit to blockchain
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Update local state
      updateRequest(request.id, {
        status: action === 'approve' ? 'approved' : 'rejected',
        reviewedAt: Date.now(),
        rejectionReason: action === 'reject' ? rejectionReason : undefined,
      });

      toast.success(
        action === 'approve' 
          ? 'Request approved successfully!' 
          : 'Request rejected',
        {
          description: action === 'approve' 
            ? 'You can now issue the credential'
            : 'The student has been notified'
        }
      );

      onClose();
    } catch (error) {
      console.error('Failed to review request:', error);
      toast.error('Failed to process review');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-3xl">
      <div className="p-6">
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-2">Review Credential Request</h2>
          <p className="text-muted-foreground">
            Review the student's information and decide whether to approve or reject
          </p>
        </div>

        {/* Request Details */}
        <div className="space-y-6 mb-6">
          {/* Program Info */}
          <div className="bg-accent rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <Badge variant="outline">{request.credentialType}</Badge>
              <h3 className="font-semibold text-lg">{request.programName}</h3>
            </div>
            <p className="text-muted-foreground">{request.fieldOfStudy}</p>
          </div>

          {/* Student Information */}
          <div>
            <label className="text-sm font-semibold text-muted-foreground mb-2 block">
              <User className="inline h-3 w-3 mr-1" />
              Student Information
            </label>
            <div className="bg-background border border-border rounded-lg p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Name:</span>
                <span className="font-medium">{request.requesterName || 'Not provided'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">DID:</span>
                <code className="text-xs font-mono">
                  {request.requester}
                </code>
              </div>
              {request.studentId && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Student ID:</span>
                  <span className="font-medium">{request.studentId}</span>
                </div>
              )}
            </div>
          </div>

          {/* Academic Details */}
          <div>
            <label className="text-sm font-semibold text-muted-foreground mb-2 block">
              Academic Information
            </label>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-background border border-border rounded-lg p-3">
                <p className="text-xs text-muted-foreground mb-1">Start Date</p>
                <p className="font-medium">{formatDate(new Date(request.startDate).getTime())}</p>
              </div>
              <div className="bg-background border border-border rounded-lg p-3">
                <p className="text-xs text-muted-foreground mb-1">End Date</p>
                <p className="font-medium">{formatDate(new Date(request.endDate).getTime())}</p>
              </div>
              {request.major && (
                <div className="bg-background border border-border rounded-lg p-3">
                  <p className="text-xs text-muted-foreground mb-1">Major</p>
                  <p className="font-medium">{request.major}</p>
                </div>
              )}
              {request.minor && (
                <div className="bg-background border border-border rounded-lg p-3">
                  <p className="text-xs text-muted-foreground mb-1">Minor</p>
                  <p className="font-medium">{request.minor}</p>
                </div>
              )}
              {request.expectedGPA && (
                <div className="bg-background border border-border rounded-lg p-3">
                  <p className="text-xs text-muted-foreground mb-1">Expected GPA</p>
                  <p className="font-medium">{request.expectedGPA}</p>
                </div>
              )}
              {request.expectedGraduationDate && (
                <div className="bg-background border border-border rounded-lg p-3">
                  <p className="text-xs text-muted-foreground mb-1">Expected Graduation</p>
                  <p className="font-medium">
                    {formatDate(new Date(request.expectedGraduationDate).getTime())}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Supporting Documents */}
          {request.supportingDocuments && request.supportingDocuments.length > 0 && (
            <div>
              <label className="text-sm font-semibold text-muted-foreground mb-2 block">
                <FileText className="inline h-3 w-3 mr-1" />
                Supporting Documents
              </label>
              <div className="space-y-2">
                {request.supportingDocuments.map((hash, index) => (
                  <div key={hash} className="bg-background border border-border rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">Document {index + 1}</p>
                        <code className="text-xs text-muted-foreground">{hash}</code>
                      </div>
                      <Button variant="outline" size="sm">
                        View
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Additional Notes */}
          {request.additionalNotes && (
            <div>
              <label className="text-sm font-semibold text-muted-foreground mb-2 block">
                Additional Notes from Student
              </label>
              <div className="bg-background border border-border rounded-lg p-4">
                <p className="text-sm">{request.additionalNotes}</p>
              </div>
            </div>
          )}
        </div>

        {/* Decision Section */}
        {!action ? (
          <div className="space-y-4">
            <p className="text-sm font-semibold">Make Your Decision</p>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setAction('approve')}
                className="p-6 border-2 border-green-500 bg-green-50 dark:bg-green-900/20 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors"
              >
                <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
                <p className="font-semibold text-green-800 dark:text-green-400">Approve</p>
                <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                  Accept this request and prepare to issue credential
                </p>
              </button>

              <button
                onClick={() => setAction('reject')}
                className="p-6 border-2 border-red-500 bg-red-50 dark:bg-red-900/20 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
              >
                <XCircle className="h-8 w-8 text-red-600 mx-auto mb-2" />
                <p className="font-semibold text-red-800 dark:text-red-400">Reject</p>
                <p className="text-xs text-red-700 dark:text-red-300 mt-1">
                  Decline this request with a reason
                </p>
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {action === 'approve' ? (
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-green-800 dark:text-green-400">
                      Approve Request
                    </p>
                    <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                      The student will be notified and you can proceed to issue their credential.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-red-800 dark:text-red-400">
                        Reject Request
                      </p>
                      <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                        Please provide a clear reason for rejection to help the student understand.
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">
                    Rejection Reason *
                  </label>
                  <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Explain why this request cannot be approved..."
                    className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    maxLength={500}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {rejectionReason.length}/500 characters
                  </p>
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setAction(null);
                  setRejectionReason('');
                }}
                className="flex-1"
              >
                Change Decision
              </Button>
              <Button
                onClick={handleSubmitReview}
                disabled={processing || (action === 'reject' && !rejectionReason.trim())}
                className="flex-1"
              >
                {processing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    Confirm {action === 'approve' ? 'Approval' : 'Rejection'}
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}