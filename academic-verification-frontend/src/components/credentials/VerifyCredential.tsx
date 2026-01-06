// src/components/credentials/VerifyCredential.tsx - FIXED VERSION
import { useState, useEffect } from 'react';
import { 
  Search, 
  Upload, 
  QrCode, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  Loader2,
  FileText,
  Hash,
  Building2,
  Calendar,
  User,
  Download,
  Shield,
  Award
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { toast } from 'sonner';
import { useBlockchain } from '@/hooks/blockchain/useBlockchain';
import { hexToString } from '@polkadot/util';

interface VerificationResult {
  found: boolean;
  credential?: {
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
  };
  blockNumber?: number;
  timestamp?: number;
}

type VerificationMethod = 'hash' | 'file' | 'qr';

interface VerifyCredentialProps {
  initialHash?: string;
}

export default function VerifyCredential({ initialHash }: VerifyCredentialProps = {}) {
  const [method, setMethod] = useState<VerificationMethod>('hash');
  const [hashInput, setHashInput] = useState(initialHash || '');
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  
  // Get blockchain queries
  const { queries, isReady } = useBlockchain();

  // Auto-verify if initial hash is provided
  useEffect(() => {
    if (initialHash && initialHash.length > 10 && isReady) {
      verifyByHash(initialHash);
    }
  }, [initialHash, isReady]);

  // Helper to decode hex strings
  const decodeHexString = (hexString: string | any): string => {
    try {
      // If it's not a string or doesn't start with 0x, return as-is
      if (typeof hexString !== 'string' || !hexString.startsWith('0x')) {
        return String(hexString);
      }
      
      // Decode the hex string
      const decoded = hexToString(hexString);
      // Remove any null bytes
      return decoded.replace(/\0/g, '');
    } catch (error) {
      console.error('Error decoding hex string:', error);
      return String(hexString);
    }
  };

  // Helper to parse metadata
  const parseMetadata = (metadata?: string): Record<string, any> => {
    if (!metadata) return {};
    
    try {
      // First decode if it's hex
      const decodedMetadata = decodeHexString(metadata);
      
      // Then parse as JSON
      return JSON.parse(decodedMetadata);
    } catch {
      // If parsing fails, return as text
      return { text: metadata };
    }
  };

  // Verify credential by hash - NOW WITH REAL BLOCKCHAIN DATA
  const verifyByHash = async (hash: string) => {
    if (!hash || hash.length < 10) {
      toast.error('Please enter a valid credential hash');
      return;
    }

    if (!queries || !isReady) {
      toast.error('Blockchain not connected');
      return;
    }

    setIsVerifying(true);
    setVerificationResult(null);

    try {
      console.log('🔍 Verifying credential hash:', hash);

      // REAL BLOCKCHAIN QUERY - Get credential by hash
      const credential = await queries.credential.getCredentialByHash(hash);

      if (!credential) {
        console.log('❌ Credential not found on blockchain');
        setVerificationResult({ found: false });
        toast.error('Credential not found');
        setIsVerifying(false);
        return;
      }

      console.log('✅ Found credential on blockchain:', credential);

      // Fetch institution name for the issuer and decode it
      let issuerName: string | undefined;
      try {
        const institution = await queries.did.getInstitution(credential.issuer);
        if (institution?.name) {
          // Decode the institution name if it's hex
          issuerName = decodeHexString(institution.name);
          console.log('✅ Found issuer institution:', issuerName);
        }
      } catch (error) {
        console.warn('Could not fetch institution name:', error);
      }

      // Parse metadata for additional details (will auto-decode hex)
      const metadata = parseMetadata(credential.metadata);
      console.log('✅ Parsed metadata:', metadata);

      // Create verification result
      const result: VerificationResult = {
        found: true,
        credential: {
          id: credential.id,
          holder: credential.holder,
          issuer: credential.issuer,
          issuerName,
          credentialHash: credential.credentialHash,
          credentialType: credential.credentialType,
          degreeName: metadata.degreeName || 'Academic Credential',
          fieldOfStudy: metadata.fieldOfStudy,
          issuedAt: credential.issuedAt,
          expiresAt: credential.expiresAt,
          revoked: credential.revoked,
          metadata: credential.metadata,
        },
      };

      setVerificationResult(result);
      toast.success('Credential verified on blockchain!');
    } catch (error: any) {
      console.error('❌ Verification failed:', error);
      setVerificationResult({ found: false });
      toast.error('Verification failed', {
        description: error.message || 'Please check the credential hash',
      });
    } finally {
      setIsVerifying(false);
    }
  };

  // Handle file upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.includes('json') && !file.type.includes('pdf')) {
      toast.error('Please upload a JSON or PDF file');
      return;
    }

    setUploadedFile(file);

    try {
      const text = await file.text();
      const data = JSON.parse(text);
      
      if (data.credentialHash) {
        setHashInput(data.credentialHash);
        await verifyByHash(data.credentialHash);
      } else {
        toast.error('No credential hash found in file');
      }
    } catch (error) {
      toast.error('Failed to read file');
    }
  };

  // Handle form submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    verifyByHash(hashInput);
  };

  // Format date
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Get verification status
  const getVerificationStatus = () => {
    if (!verificationResult) return null;

    if (!verificationResult.found) {
      return {
        icon: XCircle,
        title: 'Credential Not Found',
        description: 'This credential does not exist on the blockchain',
        color: 'text-red-600',
        bgColor: 'bg-red-50 dark:bg-red-900/20',
        borderColor: 'border-red-200 dark:border-red-800',
      };
    }

    const cred = verificationResult.credential!;

    if (cred.revoked) {
      return {
        icon: AlertCircle,
        title: 'Credential Revoked',
        description: 'This credential has been revoked and is no longer valid',
        color: 'text-orange-600',
        bgColor: 'bg-orange-50 dark:bg-orange-900/20',
        borderColor: 'border-orange-200 dark:border-orange-800',
      };
    }

    if (cred.expiresAt && cred.expiresAt < Date.now()) {
      return {
        icon: AlertCircle,
        title: 'Credential Expired',
        description: 'This credential has expired',
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
        borderColor: 'border-yellow-200 dark:border-yellow-800',
      };
    }

    return {
      icon: CheckCircle2,
      title: 'Valid Credential',
      description: 'This credential is authentic and active on the blockchain',
      color: 'text-green-600',
      bgColor: 'bg-green-50 dark:bg-green-900/20',
      borderColor: 'border-green-200 dark:border-green-800',
    };
  };

  const status = getVerificationStatus();

  // Show connection warning if blockchain not ready
  if (!isReady) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-3 text-primary" />
          <p className="text-muted-foreground">Connecting to blockchain...</p>
          <p className="text-xs text-muted-foreground mt-2">
            Make sure your local node is running
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      {/* Verification Methods */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Shield className="h-6 w-6 mr-2 text-primary" />
            Verify Academic Credential
          </CardTitle>
          <CardDescription>
            Enter a credential hash, upload a credential file, or scan a QR code to verify authenticity on the blockchain
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Method Tabs */}
          <div className="flex space-x-2 border-b border-border">
            <button
              onClick={() => setMethod('hash')}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                method === 'hash'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <Hash className="inline h-4 w-4 mr-1" />
              Hash Input
            </button>
            <button
              onClick={() => setMethod('file')}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                method === 'file'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <Upload className="inline h-4 w-4 mr-1" />
              File Upload
            </button>
            <button
              onClick={() => setMethod('qr')}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                method === 'qr'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <QrCode className="inline h-4 w-4 mr-1" />
              QR Code
            </button>
          </div>

          {/* Hash Input Method */}
          {method === 'hash' && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-2">
                  Credential Hash
                </label>
                <div className="flex space-x-2">
                  <Input
                    type="text"
                    placeholder="Enter credential hash (0x...)"
                    value={hashInput}
                    onChange={(e) => setHashInput(e.target.value)}
                    className="flex-1 font-mono text-sm"
                  />
                  <Button
                    type="submit"
                    disabled={isVerifying || !hashInput}
                  >
                    {isVerifying ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      <>
                        <Search className="h-4 w-4 mr-2" />
                        Verify
                      </>
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  The credential hash is a unique identifier stored on the blockchain
                </p>
              </div>
            </form>
          )}

          {/* File Upload Method */}
          {method === 'file' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-2">
                  Upload Credential File
                </label>
                <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary transition-colors">
                  <input
                    type="file"
                    accept=".json,.pdf"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="credential-file-upload"
                  />
                  <label htmlFor="credential-file-upload" className="cursor-pointer">
                    <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-sm font-medium mb-1">
                      Click to upload or drag and drop
                    </p>
                    <p className="text-xs text-muted-foreground">
                      JSON or PDF files only
                    </p>
                  </label>
                </div>
                {uploadedFile && (
                  <div className="flex items-center space-x-2 mt-3 text-sm">
                    <FileText className="h-4 w-4 text-primary" />
                    <span>{uploadedFile.name}</span>
                    <button
                      onClick={() => setUploadedFile(null)}
                      className="text-red-600 hover:underline ml-auto"
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* QR Code Method */}
          {method === 'qr' && (
            <div className="space-y-4">
              <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                <QrCode className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <p className="text-sm font-medium mb-2">
                  QR Code Scanner
                </p>
                <p className="text-xs text-muted-foreground mb-4">
                  Scan a credential QR code to verify
                </p>
                <Button variant="outline" disabled>
                  <QrCode className="h-4 w-4 mr-2" />
                  Open Camera (Coming Soon)
                </Button>
              </div>
            </div>
          )}

          {/* Blockchain Status */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <Shield className="h-5 w-5 text-blue-600 dark:text-blue-500 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-semibold text-blue-800 dark:text-blue-400">
                  Live Blockchain Verification
                </p>
                <p className="text-blue-700 dark:text-blue-300 mt-1">
                  All verifications query the blockchain directly. No cached or mock data.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Verification Result */}
      {verificationResult && status && (
        <Card className={`${status.borderColor} border-2`}>
          <CardContent className="pt-6">
            <div className={`${status.bgColor} rounded-lg p-6 space-y-6`}>
              {/* Status Header */}
              <div className="flex items-center space-x-4">
                <div className={`h-16 w-16 rounded-full ${status.bgColor} flex items-center justify-center`}>
                  <status.icon className={`h-8 w-8 ${status.color}`} />
                </div>
                <div className="flex-1">
                  <h3 className={`text-2xl font-bold ${status.color}`}>
                    {status.title}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {status.description}
                  </p>
                </div>
              </div>

              {/* Credential Details (if found) */}
              {verificationResult.found && verificationResult.credential && (
                <div className="space-y-6 pt-6 border-t border-border">
                  {/* Main Info */}
                  <div className="bg-background rounded-lg p-6 space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-3">
                          <Badge variant="outline" className="text-sm">
                            {verificationResult.credential.credentialType}
                          </Badge>
                          {verificationResult.credential.revoked ? (
                            <Badge variant="error">Revoked</Badge>
                          ) : verificationResult.credential.expiresAt && verificationResult.credential.expiresAt < Date.now() ? (
                            <Badge variant="warning">Expired</Badge>
                          ) : (
                            <Badge variant="success">Active</Badge>
                          )}
                        </div>
                        <h4 className="text-xl font-bold mb-2">
                          {verificationResult.credential.degreeName || 'Academic Credential'}
                        </h4>
                        {verificationResult.credential.fieldOfStudy && (
                          <p className="text-muted-foreground">
                            {verificationResult.credential.fieldOfStudy}
                          </p>
                        )}
                      </div>
                      <Award className="h-12 w-12 text-primary opacity-20" />
                    </div>

                    {/* Details Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t">
                      {/* Issuer */}
                      <div>
                        <label className="text-sm font-semibold text-muted-foreground flex items-center mb-2">
                          <Building2 className="h-3 w-3 mr-1" />
                          Issued By
                        </label>
                        <p className="font-medium">
                          {verificationResult.credential.issuerName || 'Institution'}
                        </p>
                        <code className="text-xs font-mono text-muted-foreground block mt-1 truncate">
                          {verificationResult.credential.issuer}
                        </code>
                      </div>

                      {/* Holder */}
                      <div>
                        <label className="text-sm font-semibold text-muted-foreground flex items-center mb-2">
                          <User className="h-3 w-3 mr-1" />
                          Credential Holder
                        </label>
                        <code className="text-xs font-mono block truncate">
                          {verificationResult.credential.holder}
                        </code>
                      </div>

                      {/* Issue Date */}
                      <div>
                        <label className="text-sm font-semibold text-muted-foreground flex items-center mb-2">
                          <Calendar className="h-3 w-3 mr-1" />
                          Issue Date
                        </label>
                        <p className="font-medium">
                          {formatDate(verificationResult.credential.issuedAt)}
                        </p>
                      </div>

                      {/* Expiration Date */}
                      {verificationResult.credential.expiresAt && (
                        <div>
                          <label className="text-sm font-semibold text-muted-foreground flex items-center mb-2">
                            <Calendar className="h-3 w-3 mr-1" />
                            Expiration Date
                          </label>
                          <p className="font-medium">
                            {formatDate(verificationResult.credential.expiresAt)}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Metadata */}
                    {verificationResult.credential.metadata && (
                      <div className="pt-4 border-t">
                        <label className="text-sm font-semibold text-muted-foreground mb-2 block">
                          Additional Information
                        </label>
                        <div className="text-sm bg-muted p-3 rounded">
                          {(() => {
                            try {
                              const decoded = decodeHexString(verificationResult.credential.metadata);
                              const parsed = JSON.parse(decoded);
                              return (
                                <div className="space-y-2">
                                  {Object.entries(parsed).map(([key, value]) => {
                                    // Skip empty values
                                    if (!value || value === '') return null;
                                    
                                    // Format key name
                                    const formattedKey = key
                                      .replace(/([A-Z])/g, ' $1')
                                      .replace(/^./, str => str.toUpperCase());
                                    
                                    return (
                                      <div key={key} className="flex justify-between">
                                        <span className="text-muted-foreground">{formattedKey}:</span>
                                        <span className="font-medium">{String(value)}</span>
                                      </div>
                                    );
                                  })}
                                </div>
                              );
                            } catch {
                              // If parsing fails, show as plain text
                              return <p>{decodeHexString(verificationResult.credential.metadata)}</p>;
                            }
                          })()}
                        </div>
                      </div>
                    )}

                    {/* Credential Hash */}
                    <div className="pt-4 border-t">
                      <label className="text-sm font-semibold text-muted-foreground flex items-center mb-2">
                        <Hash className="h-3 w-3 mr-1" />
                        Credential Hash
                      </label>
                      <code className="text-xs font-mono bg-muted px-3 py-2 rounded block break-all">
                        {verificationResult.credential.credentialHash}
                      </code>
                    </div>
                  </div>

                  {/* Blockchain Info */}
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                    <div className="flex items-start space-x-3">
                      <Shield className="h-5 w-5 text-blue-600 dark:text-blue-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-blue-800 dark:text-blue-400">
                          Blockchain Verified
                        </p>
                        <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                          This credential is permanently recorded on the blockchain and verified in real-time.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap gap-3">
                    <Button
                      variant="outline"
                      onClick={() => {
                        const data = JSON.stringify(verificationResult.credential, null, 2);
                        const blob = new Blob([data], { type: 'application/json' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = 'verification-report.json';
                        a.click();
                        URL.revokeObjectURL(url);
                      }}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download Report
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => window.print()}
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      Print
                    </Button>
                  </div>
                </div>
              )}

              {/* Not Found Message */}
              {!verificationResult.found && (
                <div className="space-y-4">
                  <div className="text-center py-6">
                    <p className="text-muted-foreground">
                      No credential found with this hash. Possible reasons:
                    </p>
                    <ul className="text-sm text-muted-foreground mt-4 space-y-2 text-left max-w-md mx-auto">
                      <li className="flex items-start">
                        <span className="mr-2">•</span>
                        <span>The credential has not been issued yet</span>
                      </li>
                      <li className="flex items-start">
                        <span className="mr-2">•</span>
                        <span>The hash is incorrect or incomplete</span>
                      </li>
                      <li className="flex items-start">
                        <span className="mr-2">•</span>
                        <span>The credential was issued on a different network</span>
                      </li>
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Info Section */}
      {!verificationResult && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">How Verification Works</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                  <Shield className="h-6 w-6 text-primary" />
                </div>
                <h4 className="font-semibold mb-2">Blockchain Security</h4>
                <p className="text-sm text-muted-foreground">
                  All credentials are cryptographically secured and stored on the blockchain, making them tamper-proof.
                </p>
              </div>
              <div>
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                  <CheckCircle2 className="h-6 w-6 text-primary" />
                </div>
                <h4 className="font-semibold mb-2">Instant Verification</h4>
                <p className="text-sm text-muted-foreground">
                  Verify any credential in seconds by querying the blockchain directly.
                </p>
              </div>
              <div>
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                  <Award className="h-6 w-6 text-primary" />
                </div>
                <h4 className="font-semibold mb-2">Public Access</h4>
                <p className="text-sm text-muted-foreground">
                  Anyone can verify credentials without creating an account or connecting a wallet.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}