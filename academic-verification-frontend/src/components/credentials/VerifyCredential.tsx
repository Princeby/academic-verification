// src/components/credentials/VerifyCredential.tsx - WITH QR CODE SUPPORT
import { useState, useEffect, useRef } from 'react';
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
  Award,
  Camera,
  X
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Modal } from '../ui/Modal';
import { toast } from 'sonner';
import { useBlockchain } from '@/hooks/blockchain/useBlockchain';
import { hexToString } from '@polkadot/util';
import QRCode from 'qrcode';

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

  // QR Code states
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [showQRGenerator, setShowQRGenerator] = useState(false);
  const [qrCodeDataURL, setQrCodeDataURL] = useState<string>('');
  const [isCameraActive, setIsCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const { queries, isReady } = useBlockchain();

  // Auto-verify if initial hash is provided
  useEffect(() => {
    if (initialHash && initialHash.length > 10 && isReady) {
      verifyByHash(initialHash);
    }
  }, [initialHash, isReady]);

  // Cleanup camera on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

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

  // Helper to parse metadata
  const parseMetadata = (metadata?: string): Record<string, any> => {
    if (!metadata) return {};
    try {
      const decodedMetadata = decodeHexString(metadata);
      return JSON.parse(decodedMetadata);
    } catch {
      return { text: metadata };
    }
  };

  // Generate QR Code for a credential hash
  const generateQRCode = async (hash: string) => {
    try {
      const verifyURL = `${window.location.origin}/verify?hash=${hash}`;
      const qrDataURL = await QRCode.toDataURL(verifyURL, {
        width: 400,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      });
      setQrCodeDataURL(qrDataURL);
      setShowQRGenerator(true);
      toast.success('QR Code generated!');
    } catch (error) {
      console.error('Error generating QR code:', error);
      toast.error('Failed to generate QR code');
    }
  };

  // Download QR Code
  const downloadQRCode = () => {
    if (!qrCodeDataURL) return;

    const link = document.createElement('a');
    link.href = qrCodeDataURL;
    link.download = `credential-qr-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('QR Code downloaded!');
  };

  // Start camera for QR scanning
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        streamRef.current = stream;
        setIsCameraActive(true);

        // Start scanning
        scanIntervalRef.current = setInterval(() => {
          scanQRCode();
        }, 500);

        toast.success('Camera started');
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      toast.error('Unable to access camera', {
        description: 'Please grant camera permissions',
      });
    }
  };

  // Stop camera
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setIsCameraActive(false);
  };

  // Scan QR code from video
  const scanQRCode = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context || video.readyState !== video.HAVE_ENOUGH_DATA) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);

    // Use jsQR to decode
    try {
      // @ts-ignore - jsQR will be available from CDN
      const code = jsQR(imageData.data, imageData.width, imageData.height);

      if (code && code.data) {
        handleQRCodeScanned(code.data);
      }
    } catch (error) {
      // jsQR not loaded yet, ignore
    }
  };

  // Handle scanned QR code
  const handleQRCodeScanned = (data: string) => {
    console.log('QR Code scanned:', data);

    // Stop camera
    stopCamera();
    setShowQRScanner(false);

    // Extract hash from URL or use data directly
    let hash = data;

    if (data.includes('/verify?hash=')) {
      const url = new URL(data);
      hash = url.searchParams.get('hash') || data;
    }

    // Set hash and verify
    setHashInput(hash);
    setMethod('hash');
    verifyByHash(hash);

    toast.success('QR Code scanned successfully!');
  };

  // Verify credential by hash
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
      const credential = await queries.credential.getCredentialByHash(hash);

      if (!credential) {
        console.log('❌ Credential not found on blockchain');
        setVerificationResult({ found: false });
        toast.error('Credential not found');
        setIsVerifying(false);
        return;
      }

      console.log('✅ Found credential on blockchain:', credential);

      let issuerName: string | undefined;
      try {
        const institution = await queries.did.getInstitution(credential.issuer);
        if (institution?.name) {
          issuerName = decodeHexString(institution.name);
        }
      } catch (error) {
        console.warn('Could not fetch institution name:', error);
      }

      const metadata = parseMetadata(credential.metadata);

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
      {/* Load jsQR from CDN */}
      <script src="https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.min.js"></script>

      {/* Verification Methods */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Shield className="h-6 w-6 mr-2 text-primary" />
            Verify Academic Credential
          </CardTitle>
          <CardDescription>
            Enter a credential hash, upload a file, or scan a QR code to verify authenticity
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Method Tabs */}
          <div className="flex space-x-2 border-b border-border">
            <button
              onClick={() => setMethod('hash')}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${method === 'hash'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
            >
              <Hash className="inline h-4 w-4 mr-1" />
              Hash Input
            </button>
            <button
              onClick={() => setMethod('file')}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${method === 'file'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
            >
              <Upload className="inline h-4 w-4 mr-1" />
              File Upload
            </button>
            <button
              onClick={() => setMethod('qr')}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${method === 'qr'
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
                  <Button type="submit" disabled={isVerifying || !hashInput}>
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
                {hashInput && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={() => generateQRCode(hashInput)}
                  >
                    <QrCode className="h-3 w-3 mr-1" />
                    Generate QR Code
                  </Button>
                )}
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
                  Scan a credential QR code to verify instantly
                </p>
                <div className="flex gap-3 justify-center">
                  <Button onClick={() => setShowQRScanner(true)}>
                    <Camera className="h-4 w-4 mr-2" />
                    Scan QR Code
                  </Button>
                  {hashInput && (
                    <Button
                      variant="outline"
                      onClick={() => generateQRCode(hashInput)}
                    >
                      <QrCode className="h-4 w-4 mr-2" />
                      Generate QR
                    </Button>
                  )}
                </div>
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
                  All verifications query the blockchain directly. QR codes contain verification URLs.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* QR Scanner Modal */}
      <Modal
        isOpen={showQRScanner}
        onClose={() => {
          stopCamera();
          setShowQRScanner(false);
        }}
        className="max-w-2xl"
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold flex items-center">
              <Camera className="h-6 w-6 mr-2" />
              Scan QR Code
            </h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                stopCamera();
                setShowQRScanner(false);
              }}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          <div className="space-y-4">
            <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                playsInline
              />
              <canvas ref={canvasRef} className="hidden" />

              {!isCameraActive && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Button onClick={startCamera} size="lg">
                    <Camera className="h-5 w-5 mr-2" />
                    Start Camera
                  </Button>
                </div>
              )}
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <p className="text-sm text-blue-800 dark:text-blue-400">
                <strong>Instructions:</strong> Position the QR code within the camera frame.
                The credential will be verified automatically once detected.
              </p>
            </div>

            {isCameraActive && (
              <Button
                variant="outline"
                className="w-full"
                onClick={stopCamera}
              >
                Stop Camera
              </Button>
            )}
          </div>
        </div>
      </Modal>

      {/* QR Generator Modal */}
      <Modal
        isOpen={showQRGenerator}
        onClose={() => setShowQRGenerator(false)}
        className="max-w-lg"
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold flex items-center">
              <QrCode className="h-6 w-6 mr-2" />
              Credential QR Code
            </h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowQRGenerator(false)}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          <div className="space-y-4">
            {qrCodeDataURL && (
              <div className="bg-white p-6 rounded-lg flex items-center justify-center">
                <img
                  src={qrCodeDataURL}
                  alt="Credential QR Code"
                  className="max-w-full h-auto"
                />
              </div>
            )}

            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <p className="text-sm text-blue-800 dark:text-blue-400">
                <strong>Share this QR code</strong> to allow anyone to verify this credential instantly.
                They can scan it with their phone camera or any QR scanner.
              </p>
            </div>

            <div className="flex gap-3">
              <Button onClick={downloadQRCode} className="flex-1">
                <Download className="h-4 w-4 mr-2" />
                Download QR Code
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  if (qrCodeDataURL) {
                    navigator.clipboard.write([
                      new ClipboardItem({
                        'image/png': fetch(qrCodeDataURL).then(r => r.blob()),
                      }),
                    ]);
                    toast.success('QR Code copied to clipboard!');
                  }
                }}
                className="flex-1"
              >
                Copy Image
              </Button>
            </div>
          </div>
        </div>
      </Modal>

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

                      {/* Expiry Date */}
                      {verificationResult.credential.expiresAt && (
                        <div>
                          <label className="text-sm font-semibold text-muted-foreground flex items-center mb-2">
                            <Calendar className="h-3 w-3 mr-1" />
                            Expiry Date
                          </label>
                          <p className="font-medium">
                            {formatDate(verificationResult.credential.expiresAt)}
                          </p>
                        </div>
                      )}

                      {/* Credential Hash */}
                      <div className="md:col-span-2">
                        <label className="text-sm font-semibold text-muted-foreground flex items-center mb-2">
                          <Hash className="h-3 w-3 mr-1" />
                          Credential Hash
                        </label>
                        <code className="block bg-muted p-3 rounded-md text-xs font-mono break-all">
                          {verificationResult.credential.credentialHash}
                        </code>
                      </div>
                    </div>
                  </div>

                  {/* Metadata (optional) */}
                  {verificationResult.credential.metadata && (
                    <div className="bg-background rounded-lg p-6 space-y-3">
                      <h5 className="font-semibold text-sm flex items-center">
                        <FileText className="h-4 w-4 mr-2 text-primary" />
                        Additional Metadata
                      </h5>
                      <pre className="text-xs bg-muted p-4 rounded-md overflow-x-auto">
                        {JSON.stringify(
                          parseMetadata(verificationResult.credential.metadata),
                          null,
                          2
                        )}
                      </pre>
                    </div>
                  )}

                  {/* Action */}
                  <div className="flex flex-wrap gap-3 pt-2">
                    <Button
                      variant="outline"
                      onClick={() =>
                        generateQRCode(
                          verificationResult.credential!.credentialHash
                        )
                      }
                    >
                      <QrCode className="h-4 w-4 mr-2" />
                      Generate QR Code
                    </Button>

                    <Button
                      variant="outline"
                      onClick={() => {
                        navigator.clipboard.writeText(
                          verificationResult.credential!.credentialHash
                        );
                        toast.success('Credential hash copied');
                      }}
                    >
                      Copy Hash
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
