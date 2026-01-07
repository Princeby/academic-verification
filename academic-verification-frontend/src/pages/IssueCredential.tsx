import { useNavigate } from 'react-router-dom';
import { useDIDStore } from '@/store/did.store';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { AlertCircle, ArrowLeft } from 'lucide-react';
import { lazy, Suspense } from 'react';
import { Spinner } from '@/components/ui/Spinner';

// Lazy load the form component to prevent blocking the app
const IssueCredentialForm = lazy(() => import('@/components/credentials/IssueCredentialForm'));

export default function IssueCredential() {
  const navigate = useNavigate();
  const { isInstitution, hasDID } = useDIDStore();

  const handleSuccess = (_credentialId: string) => {
    // Navigate to institution page after success
    navigate('/institution');
  };

  const handleCancel = () => {
    navigate('/institution');
  };

  // Check if user has DID
  if (!hasDID) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-md">
          <CardHeader>
            <div className="flex items-center space-x-2 text-yellow-600 mb-2">
              <AlertCircle className="h-5 w-5" />
              <CardTitle>DID Required</CardTitle>
            </div>
            <CardDescription>
              You need to create a Decentralized Identifier (DID) before you can issue credentials.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/dashboard')} className="w-full">
              Create DID
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Check if user is an institution
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
              Only verified institutions can issue credentials. Please register as an institution first.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button onClick={() => navigate('/institution')} className="w-full">
              Register as Institution
            </Button>
            <Button onClick={() => navigate('/dashboard')} variant="outline" className="w-full">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="py-8">
      <Suspense
        fallback={
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <Spinner size="lg" className="mx-auto mb-4" />
              <p className="text-muted-foreground">Loading form...</p>
            </div>
          </div>
        }
      >
        <IssueCredentialForm
          onSuccess={handleSuccess}
          onCancel={handleCancel}
        />
      </Suspense>
    </div>
  );
}