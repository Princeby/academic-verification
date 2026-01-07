// src/components/credentials/CredentialCard.tsx - FIXED WITH HEX DECODING
import { useState } from 'react';
import {
  Award,
  Building2,
  Calendar,
  FileText,
  ExternalLink,
  Download,
  Share2,
  Eye,
  AlertCircle,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { Card, CardHeader, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { cn } from '@/lib/utils/cn';
import { hexToString } from '@polkadot/util';

export interface Credential {
  id: string;
  holder: string;
  issuer: string;
  issuerName?: string;
  credentialHash: string;
  credentialType: string;
  degreeName?: string;
  fieldOfStudy?: string;
  issuedAt: number;
  expiresAt?: number;
  revoked: boolean;
  metadata?: string;
}

interface CredentialCardProps {
  credential: Credential;
  onViewDetails?: () => void;
  onVerify?: () => void;
  onShare?: () => void;
  onDownload?: () => void;
}

export default function CredentialCard({
  credential,
  onViewDetails,
  onVerify,
  onShare,
  onDownload
}: CredentialCardProps) {
  const [isHovered, setIsHovered] = useState(false);

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

  // Determine credential status
  const getStatus = () => {
    if (credential.revoked) {
      return {
        label: 'Revoked',
        variant: 'error' as const,
        icon: XCircle,
        color: 'text-red-600'
      };
    }

    if (credential.expiresAt && credential.expiresAt < Date.now()) {
      return {
        label: 'Expired',
        variant: 'warning' as const,
        icon: AlertCircle,
        color: 'text-yellow-600'
      };
    }

    return {
      label: 'Active',
      variant: 'success' as const,
      icon: CheckCircle2,
      color: 'text-green-600'
    };
  };

  const status = getStatus();
  const StatusIcon = status.icon;

  // Format dates
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Get credential type color
  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      "Bachelor's Degree": 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
      "Master's Degree": 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400',
      "Doctorate (PhD)": 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-400',
      "Certificate": 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
      "Transcript": 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400',
      "Professional Certification": 'bg-pink-100 text-pink-800 dark:bg-pink-900/20 dark:text-pink-400',
    };
    return colors[type] || 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
  };

  // Decode issuer name if it's hex
  const displayIssuerName = credential.issuerName
    ? decodeHexString(credential.issuerName)
    : `${credential.issuer.slice(0, 8)}...${credential.issuer.slice(-6)}`;

  return (
    <Card
      className={cn(
        "transition-all duration-200 cursor-pointer hover:shadow-lg",
        credential.revoked && "opacity-60 border-red-200 dark:border-red-900",
        isHovered && "scale-[1.02]"
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Header */}
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3 flex-1 min-w-0">
            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Award className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-1">
                <Badge className={getTypeColor(credential.credentialType)}>
                  {credential.credentialType}
                </Badge>
                <Badge variant={status.variant}>
                  <StatusIcon className="h-3 w-3 mr-1" />
                  {status.label}
                </Badge>
              </div>
              <h3 className="font-semibold text-lg truncate">
                {credential.degreeName || 'Academic Credential'}
              </h3>
              {credential.fieldOfStudy && (
                <p className="text-sm text-muted-foreground truncate">
                  {credential.fieldOfStudy}
                </p>
              )}
            </div>
          </div>
        </div>
      </CardHeader>

      {/* Content */}
      <CardContent className="space-y-4">
        {/* Issuer Info */}
        <div className="flex items-center space-x-2 text-sm">
          <Building2 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          <span className="text-muted-foreground">Issued by:</span>
          <span className="font-medium truncate">
            {displayIssuerName}
          </span>
        </div>

        {/* Date Info */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">Issued</p>
              <p className="font-medium">{formatDate(credential.issuedAt)}</p>
            </div>
          </div>
          {credential.expiresAt && (
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Expires</p>
                <p className="font-medium">{formatDate(credential.expiresAt)}</p>
              </div>
            </div>
          )}
        </div>

        {/* Credential Hash Preview */}
        <div className="flex items-center space-x-2 text-xs">
          <FileText className="h-3 w-3 text-muted-foreground flex-shrink-0" />
          <span className="text-muted-foreground">Hash:</span>
          <code className="font-mono text-xs bg-muted px-2 py-0.5 rounded truncate">
            {credential.credentialHash.slice(0, 12)}...{credential.credentialHash.slice(-8)}
          </code>
        </div>

        {/* Revoked Message */}
        {credential.revoked && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
            <div className="flex items-start space-x-2">
              <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-500 flex-shrink-0 mt-0.5" />
              <div className="text-xs">
                <p className="font-semibold text-red-800 dark:text-red-400">Credential Revoked</p>
                <p className="text-red-700 dark:text-red-300 mt-1">
                  This credential has been revoked and is no longer valid.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-3 border-t border-border">
          <Button
            variant="outline"
            size="sm"
            onClick={onViewDetails}
            className="text-xs"
          >
            <Eye className="h-3 w-3 mr-1" />
            View
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onVerify}
            className="text-xs"
          >
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Verify
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onShare}
            className="text-xs"
          >
            <Share2 className="h-3 w-3 mr-1" />
            Share
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onDownload}
            className="text-xs"
          >
            <Download className="h-3 w-3 mr-1" />
            Export
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}