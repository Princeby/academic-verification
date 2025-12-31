import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  Award, 
  Search, 
  Upload, 
  FileText, 
  CheckCircle2, 
  Loader2,
  User,
  Calendar,
  Hash,
  ArrowLeft,
  ArrowRight,
  GraduationCap
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/Card';
import { Input } from '../ui/Input';
import { Badge } from '../ui/Badge';
import { toast } from 'sonner';
import { CREDENTIAL_TYPES } from '@/lib/utils/constants';
import { useDIDStore } from '@/store/did.store';

// Form validation schema
const issueCredentialSchema = z.object({
  // Recipient
  recipientDID: z.string()
    .min(10, 'Please enter a valid DID address')
    .startsWith('5', 'DID address must start with 5'),
  
  // Credential Type
  credentialType: z.enum(CREDENTIAL_TYPES),
  customType: z.string().optional(),
  
  // Credential Details
  degreeName: z.string()
    .min(3, 'Degree name is required')
    .max(200, 'Degree name too long'),
  fieldOfStudy: z.string()
    .min(2, 'Field of study is required'),
  major: z.string().optional(),
  minor: z.string().optional(),
  
  // Dates
  graduationDate: z.string()
    .min(1, 'Graduation date is required'),
  issueDate: z.string()
    .min(1, 'Issue date is required'),
  expirationDate: z.string().optional(),
  
  // Academic Details
  gpa: z.string().optional(),
  honors: z.string().optional(),
  
  // Additional
  referenceNumber: z.string().optional(),
  notes: z.string()
    .max(512, 'Notes must be less than 512 characters')
    .optional(),
});

type IssueCredentialFormData = z.infer<typeof issueCredentialSchema>;

interface IssueCredentialFormProps {
  onSuccess?: (credentialId: string) => void;
  onCancel?: () => void;
}

export default function IssueCredentialForm({ onSuccess, onCancel }: IssueCredentialFormProps) {
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [uploadedDocument, setUploadedDocument] = useState<File | null>(null);
  const [documentHash, setDocumentHash] = useState<string>('');
  const [recipientInfo, setRecipientInfo] = useState<{
    name?: string;
    status: 'active' | 'inactive' | 'not_found';
  } | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { institutionName, didAddress } = useDIDStore();

  const { 
    register, 
    handleSubmit, 
    watch, 
    setValue,
    formState: { errors },
    trigger 
  } = useForm<IssueCredentialFormData>({
    resolver: zodResolver(issueCredentialSchema),
    defaultValues: {
      credentialType: "Bachelor's Degree",
      issueDate: new Date().toISOString().split('T')[0],
    },
  });

  const selectedCredentialType = watch('credentialType');
  const recipientDID = watch('recipientDID');

  // Search for recipient DID
  const searchRecipient = async () => {
    if (!recipientDID || recipientDID.length < 10) {
      toast.error('Please enter a valid DID address');
      return;
    }

    setIsSearching(true);
    
    try {
      // TODO: Replace with actual blockchain query
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock recipient data
      const mockRecipient = {
        name: 'John Doe',
        status: 'active' as const,
      };
      
      setRecipientInfo(mockRecipient);
      toast.success('Recipient found!');
    } catch (error) {
      setRecipientInfo({ status: 'not_found' });
      toast.error('Recipient not found');
    } finally {
      setIsSearching(false);
    }
  };

  // Handle document upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    
    if (!file) return;
    
    // Validate file type
    if (file.type !== 'application/pdf') {
      toast.error('Only PDF files are allowed');
      return;
    }
    
    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be less than 10MB');
      return;
    }
    
    setUploadedDocument(file);
    
    // Generate hash
    const hash = await generateFileHash(file);
    setDocumentHash(hash);
    
    toast.success('Document uploaded successfully');
  };

  // Generate file hash (mock - replace with actual Blake2)
  const generateFileHash = async (file: File): Promise<string> => {
    return '0x' + Array(64).fill(0).map(() => 
      Math.floor(Math.random() * 16).toString(16)
    ).join('');
  };

  // Navigate steps
  const nextStep = async () => {
    let fieldsToValidate: (keyof IssueCredentialFormData)[] = [];
    
    if (step === 1) {
      if (!recipientInfo || recipientInfo.status !== 'active') {
        toast.error('Please search and verify the recipient first');
        return;
      }
    } else if (step === 2) {
      fieldsToValidate = ['credentialType', 'degreeName', 'fieldOfStudy'];
      if (selectedCredentialType === 'Other') {
        fieldsToValidate.push('customType');
      }
    } else if (step === 3) {
      fieldsToValidate = ['graduationDate', 'issueDate'];
    } else if (step === 4) {
      if (!uploadedDocument || !documentHash) {
        toast.error('Please upload a document');
        return;
      }
    }
    
    if (fieldsToValidate.length > 0) {
      const isValid = await trigger(fieldsToValidate);
      if (!isValid) return;
    }
    
    setStep((prev) => Math.min(prev + 1, 5) as 1 | 2 | 3 | 4 | 5);
  };

  const prevStep = () => {
    setStep((prev) => Math.max(prev - 1, 1) as 1 | 2 | 3 | 4 | 5);
  };

  // Submit credential
  const onSubmit = async (data: IssueCredentialFormData) => {
    if (step !== 5) return;
    
    setIsSubmitting(true);
    
    try {
      // TODO: Replace with actual blockchain transaction
      console.log('Issuing credential:', {
        ...data,
        issuer: didAddress,
        documentHash,
        recipientDID: data.recipientDID,
      });
      
      // Simulate transaction
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const credentialId = 'cred_' + Date.now();
      
      toast.success('Credential issued successfully!', {
        description: `Credential ID: ${credentialId}`,
      });
      
      onSuccess?.(credentialId);
    } catch (error) {
      console.error('Failed to issue credential:', error);
      toast.error('Failed to issue credential');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step 1: Search Recipient
  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <User className="h-5 w-5 text-blue-600 dark:text-blue-500 flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-semibold text-blue-800 dark:text-blue-400">Find Recipient</p>
            <p className="text-blue-700 dark:text-blue-300 mt-1">
              Enter the recipient's DID address. They must have an active DID to receive credentials.
            </p>
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold mb-2">
          Recipient DID Address *
        </label>
        <div className="flex space-x-2">
          <Input
            {...register('recipientDID')}
            placeholder="5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY"
            className={`flex-1 font-mono text-sm ${errors.recipientDID ? 'border-red-500' : ''}`}
          />
          <Button
            type="button"
            onClick={searchRecipient}
            disabled={isSearching}
          >
            {isSearching ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Search className="h-4 w-4" />
            )}
          </Button>
        </div>
        {errors.recipientDID && (
          <p className="text-sm text-red-600 mt-1">{errors.recipientDID.message}</p>
        )}
      </div>

      {/* Recipient Info */}
      {recipientInfo && (
        <Card className={
          recipientInfo.status === 'active' 
            ? 'border-green-500 bg-green-50 dark:bg-green-900/20' 
            : 'border-red-500 bg-red-50 dark:bg-red-900/20'
        }>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {recipientInfo.status === 'active' ? (
                  <CheckCircle2 className="h-8 w-8 text-green-600" />
                ) : (
                  <User className="h-8 w-8 text-red-600" />
                )}
                <div>
                  {recipientInfo.status === 'active' ? (
                    <>
                      <p className="font-semibold text-green-900 dark:text-green-400">
                        {recipientInfo.name || 'Valid DID Found'}
                      </p>
                      <p className="text-sm text-green-700 dark:text-green-300">
                        Ready to receive credentials
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="font-semibold text-red-900 dark:text-red-400">
                        DID Not Found
                      </p>
                      <p className="text-sm text-red-700 dark:text-red-300">
                        This DID does not exist or is inactive
                      </p>
                    </>
                  )}
                </div>
              </div>
              <Badge variant={recipientInfo.status === 'active' ? 'success' : 'error'}>
                {recipientInfo.status === 'active' ? 'Active' : 'Not Found'}
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );

  // Step 2: Credential Details
  const renderStep2 = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-semibold mb-2">
          Credential Type *
        </label>
        <select
          {...register('credentialType')}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          {CREDENTIAL_TYPES.map((type) => (
            <option key={type} value={type}>{type}</option>
          ))}
        </select>
      </div>

      {selectedCredentialType === 'Other' && (
        <div>
          <label className="block text-sm font-semibold mb-2">
            Custom Credential Type *
          </label>
          <Input
            {...register('customType')}
            placeholder="Enter credential type"
            className={errors.customType ? 'border-red-500' : ''}
          />
          {errors.customType && (
            <p className="text-sm text-red-600 mt-1">{errors.customType.message}</p>
          )}
        </div>
      )}

      <div>
        <label className="block text-sm font-semibold mb-2">
          Degree/Certificate Name *
        </label>
        <Input
          {...register('degreeName')}
          placeholder="e.g., Bachelor of Science in Computer Science"
          className={errors.degreeName ? 'border-red-500' : ''}
        />
        {errors.degreeName && (
          <p className="text-sm text-red-600 mt-1">{errors.degreeName.message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-semibold mb-2">
          Field of Study *
        </label>
        <Input
          {...register('fieldOfStudy')}
          placeholder="e.g., Computer Science"
          className={errors.fieldOfStudy ? 'border-red-500' : ''}
        />
        {errors.fieldOfStudy && (
          <p className="text-sm text-red-600 mt-1">{errors.fieldOfStudy.message}</p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold mb-2">
            Major (Optional)
          </label>
          <Input
            {...register('major')}
            placeholder="e.g., Software Engineering"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold mb-2">
            Minor (Optional)
          </label>
          <Input
            {...register('minor')}
            placeholder="e.g., Mathematics"
          />
        </div>
      </div>
    </div>
  );

  // Step 3: Academic Details
  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold mb-2">
            <Calendar className="inline h-4 w-4 mr-1" />
            Graduation Date *
          </label>
          <Input
            {...register('graduationDate')}
            type="date"
            className={errors.graduationDate ? 'border-red-500' : ''}
          />
          {errors.graduationDate && (
            <p className="text-sm text-red-600 mt-1">{errors.graduationDate.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-semibold mb-2">
            <Calendar className="inline h-4 w-4 mr-1" />
            Issue Date *
          </label>
          <Input
            {...register('issueDate')}
            type="date"
            className={errors.issueDate ? 'border-red-500' : ''}
          />
          {errors.issueDate && (
            <p className="text-sm text-red-600 mt-1">{errors.issueDate.message}</p>
          )}
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold mb-2">
          Expiration Date (Optional)
        </label>
        <Input
          {...register('expirationDate')}
          type="date"
        />
        <p className="text-xs text-muted-foreground mt-1">
          Leave empty if credential doesn't expire
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold mb-2">
            GPA (Optional)
          </label>
          <Input
            {...register('gpa')}
            placeholder="e.g., 3.85"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold mb-2">
            Honors/Distinctions (Optional)
          </label>
          <Input
            {...register('honors')}
            placeholder="e.g., Summa Cum Laude"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold mb-2">
          Reference Number (Optional)
        </label>
        <Input
          {...register('referenceNumber')}
          placeholder="Internal reference or certificate number"
        />
      </div>
    </div>
  );

  // Step 4: Document Upload
  const renderStep4 = () => (
    <div className="space-y-6">
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <FileText className="h-5 w-5 text-blue-600 dark:text-blue-500 flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-semibold text-blue-800 dark:text-blue-400">Upload Credential Document</p>
            <p className="text-blue-700 dark:text-blue-300 mt-1">
              Upload the official PDF document. A cryptographic hash will be generated and stored on-chain.
            </p>
          </div>
        </div>
      </div>

      {!uploadedDocument ? (
        <div>
          <label className="block text-sm font-semibold mb-2">
            Credential Document (PDF) *
          </label>
          <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary transition-colors">
            <input
              type="file"
              accept=".pdf"
              onChange={handleFileUpload}
              className="hidden"
              id="credential-upload"
            />
            <label htmlFor="credential-upload" className="cursor-pointer">
              <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-sm font-medium mb-1">
                Click to upload or drag and drop
              </p>
              <p className="text-xs text-muted-foreground">
                PDF only, up to 10MB
              </p>
            </label>
          </div>
        </div>
      ) : (
        <Card className="border-green-500 bg-green-50 dark:bg-green-900/20">
          <CardContent className="pt-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <FileText className="h-8 w-8 text-green-600" />
                  <div>
                    <p className="font-semibold">{uploadedDocument.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {(uploadedDocument.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setUploadedDocument(null);
                    setDocumentHash('');
                  }}
                >
                  Remove
                </Button>
              </div>

              <div className="pt-3 border-t">
                <label className="text-xs font-semibold text-muted-foreground mb-1 block">
                  <Hash className="inline h-3 w-3 mr-1" />
                  Document Hash (Blake2)
                </label>
                <div className="flex items-center space-x-2">
                  <Input
                    value={documentHash}
                    readOnly
                    className="font-mono text-xs"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(documentHash);
                      toast.success('Hash copied to clipboard');
                    }}
                  >
                    Copy
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  This hash will be stored on the blockchain
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div>
        <label className="block text-sm font-semibold mb-2">
          Additional Notes (Optional)
        </label>
        <textarea
          {...register('notes')}
          placeholder="Any additional information about this credential..."
          className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          maxLength={512}
        />
        {errors.notes && (
          <p className="text-sm text-red-600 mt-1">{errors.notes.message}</p>
        )}
      </div>
    </div>
  );

  // Step 5: Review & Submit
  const renderStep5 = () => {
    const formData = watch();
    
    return (
      <div className="space-y-6">
        <div className="bg-accent rounded-lg p-6 space-y-4">
          <h3 className="font-semibold text-lg mb-4">Review Credential</h3>
          
          {/* Recipient */}
          <div className="space-y-2">
            <p className="text-sm font-semibold text-muted-foreground">Recipient</p>
            <div className="bg-background rounded p-3">
              <p className="text-sm font-medium">{recipientInfo?.name || 'Recipient'}</p>
              <p className="text-xs font-mono text-muted-foreground mt-1">
                {formData.recipientDID}
              </p>
            </div>
          </div>

          {/* Credential Details */}
          <div className="space-y-2">
            <p className="text-sm font-semibold text-muted-foreground">Credential Details</p>
            <div className="bg-background rounded p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Type:</span>
                <Badge>{formData.credentialType}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Degree:</span>
                <span className="text-sm font-medium">{formData.degreeName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Field:</span>
                <span className="text-sm">{formData.fieldOfStudy}</span>
              </div>
              {formData.major && (
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Major:</span>
                  <span className="text-sm">{formData.major}</span>
                </div>
              )}
              {formData.gpa && (
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">GPA:</span>
                  <span className="text-sm">{formData.gpa}</span>
                </div>
              )}
              {formData.honors && (
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Honors:</span>
                  <span className="text-sm">{formData.honors}</span>
                </div>
              )}
            </div>
          </div>

          {/* Dates */}
          <div className="space-y-2">
            <p className="text-sm font-semibold text-muted-foreground">Important Dates</p>
            <div className="bg-background rounded p-3 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Graduation:</span>
                <span>{new Date(formData.graduationDate).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Issue Date:</span>
                <span>{new Date(formData.issueDate).toLocaleDateString()}</span>
              </div>
              {formData.expirationDate && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Expires:</span>
                  <span>{new Date(formData.expirationDate).toLocaleDateString()}</span>
                </div>
              )}
            </div>
          </div>

          {/* Document */}
          <div className="space-y-2">
            <p className="text-sm font-semibold text-muted-foreground">Document</p>
            <div className="bg-background rounded p-3">
              <p className="text-sm">{uploadedDocument?.name}</p>
              <p className="text-xs font-mono text-muted-foreground mt-1 break-all">
                Hash: {documentHash}
              </p>
            </div>
          </div>

          {/* Issuer */}
          <div className="space-y-2">
            <p className="text-sm font-semibold text-muted-foreground">Issuer</p>
            <div className="bg-background rounded p-3">
              <p className="text-sm font-medium">{institutionName}</p>
              <p className="text-xs font-mono text-muted-foreground mt-1">
                {didAddress}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-500 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold text-green-800 dark:text-green-400">Ready to Issue</p>
              <p className="text-green-700 dark:text-green-300 mt-1">
                Once submitted, the credential will be permanently recorded on the blockchain 
                and sent to the recipient's DID.
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
          <Award className="h-6 w-6" />
          <span>Issue Academic Credential</span>
        </CardTitle>
        <CardDescription>
          Issue a verifiable academic credential to a student
        </CardDescription>
        
        {/* Progress Indicator */}
        <div className="flex items-center space-x-2 mt-4">
          {[1, 2, 3, 4, 5].map((s) => (
            <div key={s} className="flex items-center flex-1">
              <div
                className={`h-2 flex-1 rounded-full transition-colors ${
                  s <= step ? 'bg-primary' : 'bg-muted'
                }`}
              />
              {s < 5 && <div className="w-2" />}
            </div>
          ))}
        </div>
        <div className="flex justify-between text-xs text-muted-foreground mt-2">
          <span>Recipient</span>
          <span>Details</span>
          <span>Academic</span>
          <span>Document</span>
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
          {step === 5 && renderStep5()}

          {/* Navigation Buttons */}
          <div className="flex justify-between pt-6 border-t">
            <div>
              {step > 1 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={prevStep}
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
                >
                  Cancel
                </Button>
              )}
            </div>

            <div>
              {step < 5 ? (
                <Button
                  type="button"
                  onClick={nextStep}
                >
                  Next
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              ) : (
                <Button
                  type="submit"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Issuing...
                    </>
                  ) : (
                    <>
                      <GraduationCap className="h-4 w-4 mr-2" />
                      Issue Credential
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