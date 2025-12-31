// src/components/requests/CreateRequestForm.tsx
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Search,
  Building2,
  ArrowLeft,
  ArrowRight,
  FileText,
  Upload,
  Loader2,
  CheckCircle2,
  Calendar
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { toast } from 'sonner';
import { CREDENTIAL_TYPES } from '@/lib/utils/constants';
import { useDIDStore } from '@/store/did.store';
import type { CreateRequestFormData } from '@/types/credentialRequest.types';

// Form validation schema
const requestSchema = z.object({
  institution: z.string().min(10, 'Please select a valid institution'),
  credentialType: z.enum(CREDENTIAL_TYPES),
  programName: z.string().min(3, 'Program name is required'),
  fieldOfStudy: z.string().min(2, 'Field of study is required'),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  expectedGraduationDate: z.string().optional(),
  studentId: z.string().optional(),
  major: z.string().optional(),
  minor: z.string().optional(),
  expectedGPA: z.string().optional(),
  additionalNotes: z.string().max(500).optional(),
});

interface CreateRequestFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function CreateRequestForm({ onSuccess, onCancel }: CreateRequestFormProps) {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedInstitution, setSelectedInstitution] = useState<any>(null);
  const [uploadedDocs, setUploadedDocs] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { didAddress } = useDIDStore();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
    trigger
  } = useForm<CreateRequestFormData>({
    resolver: zodResolver(requestSchema),
    defaultValues: {
      credentialType: "Bachelor's Degree",
    },
  });

  const selectedType = watch('credentialType');

  // Mock institution search
  const searchInstitutions = async () => {
    // TODO: Replace with blockchain query
    return [
      {
        did: '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY',
        name: 'Massachusetts Institute of Technology',
        type: 'University',
        verified: true,
      },
      {
        did: '5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty',
        name: 'Stanford University',
        type: 'University',
        verified: true,
      },
    ];
  };

  const [institutions, setInstitutions] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);

  const handleSearch = async () => {
    setSearching(true);
    const results = await searchInstitutions();
    setInstitutions(results);
    setSearching(false);
  };

  const selectInstitution = (institution: any) => {
    setSelectedInstitution(institution);
    setValue('institution', institution.did);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setUploadedDocs(prev => [...prev, ...files]);
  };

  const nextStep = async () => {
    let fieldsToValidate: (keyof CreateRequestFormData)[] = [];

    if (step === 1) {
      if (!selectedInstitution) {
        toast.error('Please select an institution');
        return;
      }
    } else if (step === 2) {
      fieldsToValidate = ['credentialType', 'programName', 'fieldOfStudy'];
    } else if (step === 3) {
      fieldsToValidate = ['startDate', 'endDate'];
    }

    if (fieldsToValidate.length > 0) {
      const isValid = await trigger(fieldsToValidate);
      if (!isValid) return;
    }

    setStep((prev) => Math.min(prev + 1, 4) as 1 | 2 | 3 | 4);
  };

  const prevStep = () => {
    setStep((prev) => Math.max(prev - 1, 1) as 1 | 2 | 3 | 4);
  };

  const onSubmit = async (data: CreateRequestFormData) => {
    if (step !== 4) return;

    setIsSubmitting(true);

    try {
      // TODO: Submit to blockchain
      console.log('Submitting request:', data);
      await new Promise(resolve => setTimeout(resolve, 2000));

      toast.success('Request submitted successfully!');
      onSuccess?.();
    } catch (error) {
      console.error('Failed to submit request:', error);
      toast.error('Failed to submit request');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step 1: Select Institution
  const renderStep1 = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-semibold mb-2">
          Search for Institution
        </label>
        <div className="flex space-x-2">
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name..."
            className="flex-1"
          />
          <Button onClick={handleSearch} disabled={searching}>
            {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {institutions.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm font-semibold">Select Institution</p>
          {institutions.map((inst) => (
            <button
              key={inst.did}
              onClick={() => selectInstitution(inst)}
              className={`w-full text-left p-4 border-2 rounded-lg transition-colors ${
                selectedInstitution?.did === inst.did
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Building2 className="h-8 w-8 text-primary" />
                  <div>
                    <p className="font-semibold">{inst.name}</p>
                    <p className="text-sm text-muted-foreground">{inst.type}</p>
                  </div>
                </div>
                {inst.verified && <Badge variant="success">Verified</Badge>}
              </div>
            </button>
          ))}
        </div>
      )}

      {selectedInstitution && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
          <p className="text-sm font-semibold text-green-800 dark:text-green-400">
            Selected: {selectedInstitution.name}
          </p>
        </div>
      )}
    </div>
  );

  // Step 2: Credential Details
  const renderStep2 = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-semibold mb-2">Credential Type *</label>
        <select
          {...register('credentialType')}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          {CREDENTIAL_TYPES.map((type) => (
            <option key={type} value={type}>{type}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-semibold mb-2">Program Name *</label>
        <Input
          {...register('programName')}
          placeholder="e.g., Bachelor of Science in Computer Science"
          className={errors.programName ? 'border-red-500' : ''}
        />
        {errors.programName && (
          <p className="text-sm text-red-600 mt-1">{errors.programName.message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-semibold mb-2">Field of Study *</label>
        <Input
          {...register('fieldOfStudy')}
          placeholder="e.g., Computer Science"
          className={errors.fieldOfStudy ? 'border-red-500' : ''}
        />
        {errors.fieldOfStudy && (
          <p className="text-sm text-red-600 mt-1">{errors.fieldOfStudy.message}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold mb-2">Major (Optional)</label>
          <Input {...register('major')} placeholder="e.g., Software Engineering" />
        </div>
        <div>
          <label className="block text-sm font-semibold mb-2">Minor (Optional)</label>
          <Input {...register('minor')} placeholder="e.g., Mathematics" />
        </div>
      </div>
    </div>
  );

  // Step 3: Academic Info
  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold mb-2">Start Date *</label>
          <Input
            {...register('startDate')}
            type="date"
            className={errors.startDate ? 'border-red-500' : ''}
          />
          {errors.startDate && (
            <p className="text-sm text-red-600 mt-1">{errors.startDate.message}</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-semibold mb-2">End Date *</label>
          <Input
            {...register('endDate')}
            type="date"
            className={errors.endDate ? 'border-red-500' : ''}
          />
          {errors.endDate && (
            <p className="text-sm text-red-600 mt-1">{errors.endDate.message}</p>
          )}
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold mb-2">Student ID (Optional)</label>
        <Input {...register('studentId')} placeholder="Your student ID" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold mb-2">Expected GPA (Optional)</label>
          <Input {...register('expectedGPA')} placeholder="e.g., 3.85" />
        </div>
        <div>
          <label className="block text-sm font-semibold mb-2">Expected Graduation (Optional)</label>
          <Input {...register('expectedGraduationDate')} type="date" />
        </div>
      </div>
    </div>
  );

  // Step 4: Review
  const renderStep4 = () => {
    const formData = watch();
    return (
      <div className="space-y-4">
        <div className="bg-accent rounded-lg p-4">
          <h3 className="font-semibold mb-3">Review Your Request</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Institution:</span>
              <span className="font-medium">{selectedInstitution?.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Program:</span>
              <span className="font-medium">{formData.programName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Type:</span>
              <Badge>{formData.credentialType}</Badge>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold mb-2">Additional Notes (Optional)</label>
          <textarea
            {...register('additionalNotes')}
            placeholder="Any additional information..."
            className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            maxLength={500}
          />
        </div>
      </div>
    );
  };

  return (
    <Card className="max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle>Request Credential</CardTitle>
        <CardDescription>Submit a credential request to an institution</CardDescription>

        {/* Progress */}
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
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
          {step === 4 && renderStep4()}

          {/* Navigation */}
          <div className="flex justify-between pt-6 border-t">
            <div>
              {step > 1 && (
                <Button type="button" variant="outline" onClick={prevStep}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Previous
                </Button>
              )}
              {onCancel && step === 1 && (
                <Button type="button" variant="outline" onClick={onCancel}>
                  Cancel
                </Button>
              )}
            </div>

            <div>
              {step < 4 ? (
                <Button type="button" onClick={nextStep}>
                  Next
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              ) : (
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Submit Request
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