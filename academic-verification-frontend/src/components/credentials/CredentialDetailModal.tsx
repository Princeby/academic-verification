// src/components/credentials/CredentialDetailModal.tsx - FIXED WITH HEX DECODING
import {
  X,
  Award,
  Building2,
  User,
  Calendar,
  FileText,
  Hash,
  ExternalLink,
  Copy,
  Download,
  Share2,
  CheckCircle2,
  AlertCircle,
  QrCode
} from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { toast } from 'sonner';
import type { Credential } from './CredentialCard';
import { hexToString } from '@polkadot/util';

interface CredentialDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  credential: Credential | null;
}

export default function CredentialDetailModal({
  isOpen,
  onClose,
  credential
}: CredentialDetailModalProps) {
  if (!credential) return null;

  // Helper to decode hex strings
  const decodeHexString = (hexString: string | any): string => {
    try {
      if (typeof hexString !== 'string' || !hexString.startsWith('0x')) {
        return String(hexString);
      }
      const decoded = hexToString(hexString);
      return decoded.replace(/\0/g, '');
    } catch (error) {
      console.error('Error decoding hex string:', error);
      return String(hexString);
    }
  };

  // Parse and decode metadata
  const parseMetadata = (metadata?: string): Record<string, any> => {
    if (!metadata) return {};
    try {
      const decoded = decodeHexString(metadata);
      return JSON.parse(decoded);
    } catch {
      return { text: metadata };
    }
  };

  // Format dates - handle both seconds (blockchain) and milliseconds timestamps
  const formatDate = (timestamp: number) => {
    // If timestamp is in seconds (before year 2001 in ms), convert to milliseconds
    // Timestamps less than 10000000000 are likely in seconds
    const msTimestamp = timestamp < 10000000000 ? timestamp * 1000 : timestamp;
    return new Date(msTimestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  const handleShare = () => {
    const shareUrl = `${window.location.origin}/verify?hash=${credential.credentialHash}`;
    copyToClipboard(shareUrl, 'Share link');
  };

  const handleDownload = () => {
    const data = {
      id: credential.id,
      type: credential.credentialType,
      degreeName: credential.degreeName,
      fieldOfStudy: credential.fieldOfStudy,
      holder: credential.holder,
      issuer: credential.issuer,
      issuerName: credential.issuerName,
      credentialHash: credential.credentialHash,
      issuedAt: credential.issuedAt,
      expiresAt: credential.expiresAt,
      revoked: credential.revoked,
      metadata: credential.metadata,
      verificationUrl: `${window.location.origin}/verify?hash=${credential.credentialHash}`,
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `credential-${credential.id}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success('Credential exported');
  };

  const getStatus = () => {
    if (credential.revoked) {
      return { label: 'Revoked', variant: 'error' as const, icon: AlertCircle };
    }
    if (credential.expiresAt && credential.expiresAt < Date.now()) {
      return { label: 'Expired', variant: 'warning' as const, icon: AlertCircle };
    }
    return { label: 'Active', variant: 'success' as const, icon: CheckCircle2 };
  };

  const status = getStatus();
  const StatusIcon = status.icon;

  // Parse metadata for display
  const metadata = parseMetadata(credential.metadata);

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-3xl">
      <div className="relative">
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-border">
          <div className="flex items-center space-x-4 flex-1">
            <div className="h-16 w-16 rounded-xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center">
              <Award className="h-8 w-8 text-white" />
            </div>
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-2">
                <h2 className="text-2xl font-bold">
                  {credential.degreeName || 'Academic Credential'}
                </h2>
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant={status.variant}>
                  <StatusIcon className="h-3 w-3 mr-1" />
                  {status.label}
                </Badge>
                <Badge variant="outline">{credential.credentialType}</Badge>
              </div>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="rounded-full"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          {/* Credential Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-4">
              {/* Field of Study */}
              {credential.fieldOfStudy && (
                <div>
                  <label className="text-sm font-semibold text-muted-foreground">
                    Field of Study
                  </label>
                  <p className="text-base font-medium mt-1">{credential.fieldOfStudy}</p>
                </div>
              )}

              {/* Holder */}
              <div>
                <label className="text-sm font-semibold text-muted-foreground flex items-center">
                  <User className="h-3 w-3 mr-1" />
                  Credential Holder
                </label>
                <div className="flex items-center space-x-2 mt-1">
                  <code className="text-xs font-mono bg-muted px-2 py-1 rounded flex-1 truncate">
                    {credential.holder}
                  </code>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => copyToClipboard(credential.holder, 'Holder address')}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>

              {/* Issuer */}
              <div>
                <label className="text-sm font-semibold text-muted-foreground flex items-center">
                  <Building2 className="h-3 w-3 mr-1" />
                  Issued By
                </label>
                <p className="text-base font-medium mt-1">
                  {credential.issuerName ? decodeHexString(credential.issuerName) : 'Unknown Institution'}
                </p>
                <div className="flex items-center space-x-2 mt-1">
                  <code className="text-xs font-mono bg-muted px-2 py-1 rounded flex-1 truncate">
                    {credential.issuer}
                  </code>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => copyToClipboard(credential.issuer, 'Issuer address')}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              {/* Issue Date */}
              <div>
                <label className="text-sm font-semibold text-muted-foreground flex items-center">
                  <Calendar className="h-3 w-3 mr-1" />
                  Issue Date
                </label>
                <p className="text-base font-medium mt-1">{formatDate(credential.issuedAt)}</p>
              </div>

              {/* Expiration Date */}
              {credential.expiresAt && (
                <div>
                  <label className="text-sm font-semibold text-muted-foreground flex items-center">
                    <Calendar className="h-3 w-3 mr-1" />
                    Expiration Date
                  </label>
                  <p className="text-base font-medium mt-1">{formatDate(credential.expiresAt)}</p>
                </div>
              )}

              {/* Credential ID */}
              <div>
                <label className="text-sm font-semibold text-muted-foreground flex items-center">
                  <FileText className="h-3 w-3 mr-1" />
                  Credential ID
                </label>
                <div className="flex items-center space-x-2 mt-1">
                  <code className="text-xs font-mono bg-muted px-2 py-1 rounded flex-1 truncate">
                    {credential.id}
                  </code>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => copyToClipboard(credential.id, 'Credential ID')}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Credential Hash */}
          <div className="bg-accent rounded-lg p-4">
            <label className="text-sm font-semibold text-muted-foreground flex items-center mb-2">
              <Hash className="h-4 w-4 mr-1" />
              Credential Hash (Blake2)
            </label>
            <div className="flex items-center space-x-2">
              <code className="text-xs font-mono bg-background px-3 py-2 rounded flex-1 break-all">
                {credential.credentialHash}
              </code>
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(credential.credentialHash, 'Credential hash')}
              >
                <Copy className="h-3 w-3 mr-1" />
                Copy
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              This cryptographic hash uniquely identifies your credential on the blockchain
            </p>
          </div>

          {/* Metadata - PROPERLY DECODED AND FORMATTED */}
          {credential.metadata && Object.keys(metadata).length > 0 && (
            <div>
              <label className="text-sm font-semibold text-muted-foreground mb-2 block">
                Additional Information
              </label>
              <div className="bg-muted rounded-lg p-4">
                <div className="space-y-2">
                  {Object.entries(metadata).map(([key, value]) => {
                    // Skip empty values and text field
                    if (!value || value === '' || key === 'text') return null;

                    // Format key name
                    const formattedKey = key
                      .replace(/([A-Z])/g, ' $1')
                      .replace(/^./, str => str.toUpperCase());

                    return (
                      <div key={key} className="flex justify-between text-sm">
                        <span className="text-muted-foreground">{formattedKey}:</span>
                        <span className="font-medium">{String(value)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Revoked Warning */}
          {credential.revoked && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-red-800 dark:text-red-400">
                    Credential Revoked
                  </p>
                  <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                    This credential has been revoked by the issuing institution and is no longer valid.
                    It should not be used for verification purposes.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Verification Info */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <CheckCircle2 className="h-5 w-5 text-blue-600 dark:text-blue-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold text-blue-800 dark:text-blue-400">
                  Blockchain Verified
                </p>
                <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                  This credential is permanently recorded on the blockchain and can be verified by anyone.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex flex-wrap gap-3 p-6 border-t border-border bg-accent/50">
          <Button onClick={handleShare} className="flex-1">
            <Share2 className="h-4 w-4 mr-2" />
            Share Credential
          </Button>
          <Button onClick={handleDownload} variant="outline" className="flex-1">
            <Download className="h-4 w-4 mr-2" />
            Export JSON
          </Button>
          <Button
            variant="outline"
            onClick={() => window.open(`/verify?hash=${credential.credentialHash}`, '_blank')}
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Public Verification
          </Button>
        </div>
      </div>
    </Modal>
  );
}