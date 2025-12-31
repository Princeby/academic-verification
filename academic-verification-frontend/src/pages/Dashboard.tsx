import { useWalletStore } from '@/store/wallet.store';
import { useDIDStore } from '@/store/did.store';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Award, Building2, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import CreateDIDPage from './CreateDIDPage';

export default function Dashboard() {
  const { isConnected } = useWalletStore();
  const { hasDID, isInstitution } = useDIDStore();

  if (!isConnected) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Connect Your Wallet</CardTitle>
            <CardDescription>
              Please connect your wallet to access the dashboard
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (!hasDID) {
    return <CreateDIDPage />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">
          Welcome back!
        </h1>
        <p className="text-muted-foreground">
          {isInstitution ? 'Manage your institution and issue credentials' : 'Manage your credentials and academic identity'}
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Credentials
            </CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">
              Academic credentials
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {isInstitution ? 'Issued' : 'Verified'}
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">
              {isInstitution ? 'Credentials issued' : 'Times verified'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Reputation
            </CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">
              Reputation score
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link to="/credentials">
            <Button variant="outline" className="w-full justify-start">
              <Award className="h-4 w-4 mr-2" />
              View My Credentials
            </Button>
          </Link>
          <Link to="/verify">
            <Button variant="outline" className="w-full justify-start">
              <CheckCircle className="h-4 w-4 mr-2" />
              Verify a Credential
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}