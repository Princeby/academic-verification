// src/components/did/InstitutionRegistration.tsx - FIXED VERSION
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  Building2, 
  Upload, 
  FileText, 
  CheckCircle2, 
  Loader2, 
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Globe,
  Mail,
  Phone,
  MapPin
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/Card';
import { Input } from '../ui/Input';
import { Badge } from '../ui/Badge';
import { toast } from 'sonner';
import { INSTITUTION_TYPES } from '@/lib/utils/constants';
import { useDIDStore } from '@/store/did.store';
import { useWalletStore } from '@/store/wallet.store';
import { useBlockchain } from '@/hooks/blockchain/useBlockchain';

// Form validation schema
const institutionSchema = z.object({
  name: z.string()
    .min(3, 'Institution name must be at least 3 characters')
    .max(100, 'Institution name must be less than 100 characters'),
  type: z.enum(INSTITUTION_TYPES),
  description: z.string()
    .max(500, 'Description must be less than 500 characters')
    .optional(),
  country: z.string().min(2, 'Please select a country'),
  website: z.string().url('Please enter a valid URL'),
  
  // Contact information
  contactName: z.string().min(2, 'Contact name is required'),
  contactEmail: z.string().email('Please enter a valid email'),
  contactPhone: z.string().min(5, 'Please enter a valid phone number'),
  address: z.string().min(10, 'Please enter a complete address'),
  
  // Legal
  termsAccepted: z.boolean().refine(val => val === true, {
    message: 'You must accept the terms and conditions',
  }),
});

type InstitutionFormData = z.infer<typeof institutionSchema>;

interface InstitutionRegistrationProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function InstitutionRegistration({ onSuccess, onCancel }: InstitutionRegistrationProps) {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [uploadedDocs, setUploadedDocs] = useState<File[]>([]);
  const [docHashes, setDocHashes] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [txStatus, setTxStatus] = useState<string>('');
  
  const { didAddress } = useDIDStore();
  const { account } = useWalletStore();
  const { transactions, isReady } = useBlockchain();

  const { 
    register, 
    handleSubmit, 
    watch, 
    formState: { errors },
    trigger 
  } = useForm<InstitutionFormData>({
    resolver: zodResolver(institutionSchema),
    defaultValues: {
      type: 'University',
      termsAccepted: false,
    },
  });

  const selectedType = watch('type');

  // Handle document upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    if (files.length === 0) return;
    
    // Validate file types (PDF only for verification docs)
    const validFiles = files.filter(file => file.type === 'application/pdf');
    
    if (validFiles.length !== files.length) {
      toast.error('Only PDF files are allowed');
      return;
    }
    
    setUploadedDocs(prev => [...prev, ...validFiles]);
    
    // Generate hashes for each file
    for (const file of validFiles) {
      const hash = await generateFileHash(file);
      setDocHashes(prev => [...prev, hash]);
    }
    
    toast.success(`${validFiles.length} document(s) uploaded`);
  };

  // Generate file hash (mock - replace with actual Blake2)
  const generateFileHash = async (file: File): Promise<string> => {
    // Mock hash generation
    return '0x' + Array(64).fill(0).map(() => 
      Math.floor(Math.random() * 16).toString(16)
    ).join('');
  };

  // Remove uploaded document
  const removeDocument = (index: number) => {
    setUploadedDocs(prev => prev.filter((_, i) => i !== index));
    setDocHashes(prev => prev.filter((_, i) => i !== index));
    toast.success('Document removed');
  };

  // Navigate steps
  const nextStep = async () => {
    let fieldsToValidate: (keyof InstitutionFormData)[] = [];
    
    if (step === 1) {
      fieldsToValidate = ['name', 'type', 'description', 'country', 'website'];
    } else if (step === 3) {
      fieldsToValidate = ['contactName', 'contactEmail', 'contactPhone', 'address'];
    }
    
    const isValid = await trigger(fieldsToValidate);
    if (isValid) {
      setStep((prev) => Math.min(prev + 1, 4) as 1 | 2 | 3 | 4);
    }
  };

  const prevStep = () => {
    setStep((prev) => Math.max(prev - 1, 1) as 1 | 2 | 3 | 4);
  };

  // Submit registration - FIXED VERSION
  const onSubmit = async (data: InstitutionFormData) => {
    if (step !== 4) return;
    
    if (!transactions || !isReady) {
      toast.error('Blockchain connection not ready');
      return;
    }

    if (!account) {
      toast.error('Please connect your wallet');
      return;
    }

    setIsSubmitting(true);
    
    try {
      console.log('🏛️ Registering institution on blockchain:', {
        name: data.name,
        did: didAddress,
      });

      // Submit transaction to blockchain
      const result = await transactions.did.registerInstitution(
        account,
        data.name,
        (status) => {
          setTxStatus(status.message);
          console.log('Transaction status:', status);
        }
      );

      if (result.success) {
        console.log('✅ Institution registered successfully');
        
        // Update local store AFTER successful blockchain transaction
        useDIDStore.getState().setInstitution(data.name);
        
        toast.success('Institution registration submitted!', {
          description: 'Your application is pending verification',
        });
        
        onSuccess?.();
      } else {
        throw new Error(result.error || 'Transaction failed');
      }
    } catch (error: any) {
      console.error('❌ Failed to register institution:', error);
      toast.error('Failed to register institution', {
        description: error.message || 'Please try again',
      });
    } finally {
      setIsSubmitting(false);
      setTxStatus('');
    }
  };

  // Step 1: Institution Information
  const renderStep1 = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-semibold mb-2">
          Institution Name *
        </label>
        <Input
          {...register('name')}
          placeholder="e.g., University of Technology"
          className={errors.name ? 'border-red-500' : ''}
        />
        {errors.name && (
          <p className="text-sm text-red-600 mt-1">{errors.name.message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-semibold mb-2">
          Institution Type *
        </label>
        <select
          {...register('type')}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          {INSTITUTION_TYPES.map((type) => (
            <option key={type} value={type}>{type}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-semibold mb-2">
          Description (Optional)
        </label>
        <textarea
          {...register('description')}
          placeholder="Brief description of your institution..."
          className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          maxLength={500}
        />
        {errors.description && (
          <p className="text-sm text-red-600 mt-1">{errors.description.message}</p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold mb-2">
            Country *
          </label>
          <Input
            {...register('country')}
            placeholder="e.g., United States"
            className={errors.country ? 'border-red-500' : ''}
          />
          {errors.country && (
            <p className="text-sm text-red-600 mt-1">{errors.country.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-semibold mb-2">
            <Globe className="inline h-4 w-4 mr-1" />
            Website *
          </label>
          <Input
            {...register('website')}
            type="url"
            placeholder="https://example.edu"
            className={errors.website ? 'border-red-500' : ''}
          />
          {errors.website && (
            <p className="text-sm text-red-600 mt-1">{errors.website.message}</p>
          )}
        </div>
      </div>
    </div>
  );

  // Step 2: Verification Documents
  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <FileText className="h-5 w-5 text-blue-600 dark:text-blue-500 flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-semibold text-blue-800 dark:text-blue-400">Required Documents</p>
            <p className="text-blue-700 dark:text-blue-300 mt-1">
              Please upload official documents to verify your institution's legitimacy:
            </p>
            <ul className="list-disc list-inside mt-2 space-y-1 text-blue-700 dark:text-blue-300">
              <li>Accreditation certificate</li>
              <li>Business registration document</li>
              <li>Official letterhead or stamp</li>
            </ul>
          </div>
        </div>
      </div>

      {/* File Upload */}
      <div>
        <label className="block text-sm font-semibold mb-2">
          Upload Verification Documents (PDF only)
        </label>
        <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary transition-colors">
          <input
            type="file"
            multiple
            accept=".pdf"
            onChange={handleFileUpload}
            className="hidden"
            id="file-upload"
          />
          <label htmlFor="file-upload" className="cursor-pointer">
            <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-sm font-medium mb-1">
              Click to upload or drag and drop
            </p>
            <p className="text-xs text-muted-foreground">
              PDF files only, up to 10MB each
            </p>
          </label>
        </div>
      </div>

      {/* Uploaded Documents */}
      {uploadedDocs.length > 0 && (
        <div className="space-y-3">
          <label className="block text-sm font-semibold">
            Uploaded Documents ({uploadedDocs.length})
          </label>
          {uploadedDocs.map((file, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 bg-accent rounded-lg"
            >
              <div className="flex items-center space-x-3 flex-1 min-w-0">
                <FileText className="h-5 w-5 text-primary flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{file.name}</p>
                  <p className="text-xs text-muted-foreground font-mono truncate">
                    Hash: {docHashes[index]}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeDocument(index)}
                className="flex-shrink-0"
              >
                Remove
              </Button>
            </div>
          ))}
        </div>
      )}

      {uploadedDocs.length === 0 && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-yellow-700 dark:text-yellow-300">
              At least one verification document is recommended for faster approval
            </p>
          </div>
        </div>
      )}
    </div>
  );

  // Step 3: Contact Information
  const renderStep3 = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-semibold mb-2">
          Primary Contact Name *
        </label>
        <Input
          {...register('contactName')}
          placeholder="Full name of primary contact"
          className={errors.contactName ? 'border-red-500' : ''}
        />
        {errors.contactName && (
          <p className="text-sm text-red-600 mt-1">{errors.contactName.message}</p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold mb-2">
            <Mail className="inline h-4 w-4 mr-1" />
            Email Address *
          </label>
          <Input
            {...register('contactEmail')}
            type="email"
            placeholder="contact@institution.edu"
            className={errors.contactEmail ? 'border-red-500' : ''}
          />
          {errors.contactEmail && (
            <p className="text-sm text-red-600 mt-1">{errors.contactEmail.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-semibold mb-2">
            <Phone className="inline h-4 w-4 mr-1" />
            Phone Number *
          </label>
          <Input
            {...register('contactPhone')}
            type="tel"
            placeholder="+1 (555) 123-4567"
            className={errors.contactPhone ? 'border-red-500' : ''}
          />
          {errors.contactPhone && (
            <p className="text-sm text-red-600 mt-1">{errors.contactPhone.message}</p>
          )}
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold mb-2">
          <MapPin className="inline h-4 w-4 mr-1" />
          Official Address *
        </label>
        <textarea
          {...register('address')}
          placeholder="Complete institutional address including street, city, state/province, postal code"
          className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        />
        {errors.address && (
          <p className="text-sm text-red-600 mt-1">{errors.address.message}</p>
        )}
      </div>
    </div>
  );

  // Step 4: Review & Submit
  const renderStep4 = () => {
    const formData = watch();
    
    return (
      <div className="space-y-6">
        <div className="bg-accent rounded-lg p-6 space-y-4">
          <h3 className="font-semibold text-lg mb-4">Review Your Information</h3>
          
          {/* Institution Info */}
          <div className="space-y-2">
            <p className="text-sm font-semibold text-muted-foreground">Institution Details</p>
            <div className="bg-background rounded p-3 space-y-1">
              <p className="font-medium">{formData.name}</p>
              <p className="text-sm text-muted-foreground">{formData.type}</p>
              {formData.description && (
                <p className="text-sm mt-2">{formData.description}</p>
              )}
              <div className="flex items-center space-x-4 mt-2 text-sm">
                <span className="flex items-center">
                  <MapPin className="h-3 w-3 mr-1" />
                  {formData.country}
                </span>
                <span className="flex items-center">
                  <Globe className="h-3 w-3 mr-1" />
                  {formData.website}
                </span>
              </div>
            </div>
          </div>

          {/* Documents */}
          <div className="space-y-2">
            <p className="text-sm font-semibold text-muted-foreground">Verification Documents</p>
            <div className="bg-background rounded p-3">
              <p className="text-sm">{uploadedDocs.length} document(s) uploaded</p>
              {docHashes.length > 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  Document hashes will be stored on-chain
                </p>
              )}
            </div>
          </div>

          {/* Contact */}
          <div className="space-y-2">
            <p className="text-sm font-semibold text-muted-foreground">Contact Information</p>
            <div className="bg-background rounded p-3 space-y-1 text-sm">
              <p className="font-medium">{formData.contactName}</p>
              <p className="flex items-center text-muted-foreground">
                <Mail className="h-3 w-3 mr-2" />
                {formData.contactEmail}
              </p>
              <p className="flex items-center text-muted-foreground">
                <Phone className="h-3 w-3 mr-2" />
                {formData.contactPhone}
              </p>
              <p className="flex items-center text-muted-foreground mt-2">
                <MapPin className="h-3 w-3 mr-2" />
                {formData.address}
              </p>
            </div>
          </div>
        </div>

        {/* Terms */}
        <label className="flex items-start space-x-3 cursor-pointer">
          <input
            type="checkbox"
            {...register('termsAccepted')}
            className="mt-1"
          />
          <span className="text-sm">
            I certify that all information provided is accurate and that I have the authority 
            to represent this institution. I agree to the{' '}
            <a href="#" className="text-primary hover:underline">Terms of Service</a>
            {' '}and{' '}
            <a href="#" className="text-primary hover:underline">Privacy Policy</a>.
          </span>
        </label>
        {errors.termsAccepted && (
          <p className="text-sm text-red-600">{errors.termsAccepted.message}</p>
        )}

        {/* Transaction Status */}
        {isSubmitting && txStatus && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <Loader2 className="h-5 w-5 text-blue-600 animate-spin flex-shrink-0" />
              <div className="text-sm">
                <p className="font-semibold text-blue-800 dark:text-blue-400">
                  {txStatus}
                </p>
                <p className="text-blue-700 dark:text-blue-300 mt-1">
                  Please wait while we submit your registration to the blockchain...
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-500 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold text-green-800 dark:text-green-400">Next Steps</p>
              <p className="text-green-700 dark:text-green-300 mt-1">
                After submission, your application will be reviewed. This typically takes 3-5 business days. 
                You'll receive an email notification when your institution is verified.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Card className="max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Building2 className="h-6 w-6" />
          <span>Register as Institution</span>
        </CardTitle>
        <CardDescription>
          Complete the registration process to start issuing credentials
        </CardDescription>
        
        {/* Progress Indicator */}
        <div className="flex items-center space-x-2 mt-4">
          {[1, 2, 3, 4].map((s) => (
            <div key={s} className="flex items-center flex-1">
              <div
                className={`h-2 flex-1 rounded-full transition-colors ${
                  s <= step ? 'bg-primary' : 'bg-muted'
                }`}
              />
              {s < 4 && <div className="w-2" />}
            </div>
          ))}
        </div>
        <div className="flex justify-between text-xs text-muted-foreground mt-2">
          <span>Info</span>
          <span>Documents</span>
          <span>Contact</span>
          <span>Review</span>
        </div>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Step Content */}
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
          {step === 4 && renderStep4()}

          {/* Navigation Buttons */}
          <div className="flex justify-between pt-6 border-t">
            <div>
              {step > 1 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={prevStep}
                  disabled={isSubmitting}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Previous
                </Button>
              )}
              {onCancel && step === 1 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={onCancel}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
              )}
            </div>

            <div>
              {step < 4 ? (
                <Button
                  type="button"
                  onClick={nextStep}
                  disabled={isSubmitting}
                >
                  Next
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              ) : (
                <Button
                  type="submit"
                  disabled={isSubmitting || !isReady}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Submit Registration
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}