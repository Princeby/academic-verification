// src/types/credentialRequest.types.ts

export type RequestStatus = 
  | 'pending' 
  | 'approved' 
  | 'rejected' 
  | 'fulfilled' 
  | 'cancelled';

export interface CredentialRequest {
  id: string;
  requestId: number; // On-chain ID
  requester: string; // DID address
  requesterName?: string;
  institution: string; // Institution DID
  institutionName?: string;
  
  // Request Details
  credentialType: string;
  programName: string;
  fieldOfStudy: string;
  startDate: string;
  endDate: string;
  expectedGraduationDate?: string;
  
  // Additional Info
  studentId?: string;
  major?: string;
  minor?: string;
  expectedGPA?: string;
  additionalNotes?: string;
  supportingDocuments?: string[]; // IPFS hashes
  
  // Status & Tracking
  status: RequestStatus;
  createdAt: number;
  updatedAt: number;
  reviewedAt?: number;
  reviewedBy?: string;
  rejectionReason?: string;
  
  // Blockchain Info
  blockNumber?: number;
  transactionHash?: string;
}

export interface CreateRequestFormData {
  institution: string;
  credentialType: string;
  programName: string;
  fieldOfStudy: string;
  startDate: string;
  endDate: string;
  expectedGraduationDate?: string;
  studentId?: string;
  major?: string;
  minor?: string;
  expectedGPA?: string;
  additionalNotes?: string;
  supportingDocuments?: File[];
}

export interface ReviewRequestData {
  requestId: string;
  action: 'approve' | 'reject';
  rejectionReason?: string;
  notes?: string;
}

export const REQUEST_STATUS_CONFIG = {
  pending: {
    label: 'Pending Review',
    color: 'yellow',
    icon: 'Clock',
    description: 'Waiting for institution review'
  },
  approved: {
    label: 'Approved',
    color: 'green',
    icon: 'CheckCircle',
    description: 'Approved, credential pending issuance'
  },
  rejected: {
    label: 'Rejected',
    color: 'red',
    icon: 'XCircle',
    description: 'Request was rejected'
  },
  fulfilled: {
    label: 'Fulfilled',
    color: 'blue',
    icon: 'Award',
    description: 'Credential has been issued'
  },
  cancelled: {
    label: 'Cancelled',
    color: 'gray',
    icon: 'Ban',
    description: 'Request was cancelled'
  }
} as const;