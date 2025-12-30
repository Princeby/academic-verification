import { useNavigate } from 'react-router-dom';
import CreateDIDForm from '@/components/did/CreateDIDForm';

export default function CreateDIDPage() {
  const navigate = useNavigate();

  const handleSuccess = () => {
    // Navigate to dashboard after successful DID creation
    navigate('/dashboard');
  };

  return (
    <div className="max-w-4xl mx-auto py-8">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold mb-2">Welcome to Academic Verify</h1>
        <p className="text-muted-foreground">
          Let's create your decentralized identifier to get started
        </p>
      </div>
      
      <CreateDIDForm onSuccess={handleSuccess} />
    </div>
  );
}