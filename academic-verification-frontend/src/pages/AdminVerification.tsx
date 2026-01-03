// src/pages/admin/AdminVerification.tsx - FIXED VERSION
import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { AlertCircle, CheckCircle, XCircle, Loader2, Building2, Shield } from 'lucide-react';
import { usePolkadotContext } from '@/providers/PolkadotProvider';
import { useWalletStore } from '@/store/wallet.store';
import { hexToString } from '@polkadot/util';
import { web3FromAddress } from '@polkadot/extension-dapp';
import { toast } from 'sonner';

interface PendingInstitution {
  address: string;
  name: string;
  registeredAt: number;
  verified: boolean;
}

export default function AdminVerification() {
  const { api, isReady } = usePolkadotContext();
  const { account } = useWalletStore();
  const [institutions, setInstitutions] = useState<PendingInstitution[]>([]);
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState<string | null>(null);
  const [revoking, setRevoking] = useState<string | null>(null);

  // Helper to decode institution names
  const decodeInstitutionName = (name: string | any): string => {
    try {
      if (typeof name === 'string' && !name.startsWith('0x')) {
        return name;
      }
      if (typeof name === 'string' && name.startsWith('0x')) {
        const decoded = hexToString(name);
        return decoded.replace(/\0/g, '');
      }
      if (name && (name instanceof Uint8Array || Array.isArray(name))) {
        const nameStr = String.fromCharCode(...Array.from(name));
        return nameStr.replace(/\0/g, '');
      }
      return String(name);
    } catch (error) {
      console.error('Error decoding institution name:', error);
      return String(name);
    }
  };

  // Fetch all institutions
  const fetchInstitutions = async () => {
    if (!api || !isReady) return;

    setLoading(true);
    try {
      const entries = await api.query.did.institutions.entries();
      
      const institutionsList: PendingInstitution[] = entries
        .map(([key, value]) => {
          if (value.isEmpty) return null;
          
          const address = key.args[0].toString();
          const data = value.toJSON() as any;
          
          return {
            address,
            name: decodeInstitutionName(data.name),
            registeredAt: data.registeredAt || Date.now(),
            verified: data.verified || false,
          };
        })
        .filter(Boolean) as PendingInstitution[];

      setInstitutions(institutionsList);
      console.log('✅ Fetched institutions:', institutionsList);
    } catch (error) {
      console.error('❌ Error fetching institutions:', error);
      toast.error('Failed to fetch institutions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isReady && api) {
      fetchInstitutions();
    }
  }, [isReady, api]);

  // Handle verification with proper signer
  const handleVerify = async (institutionDid: string) => {
    if (!api || !account) {
      toast.error('Wallet not connected');
      return;
    }

    setVerifying(institutionDid);

    try {
      console.log('🔐 Starting verification for:', institutionDid);

      // Get the signer
      const injector = await web3FromAddress(account.address);

      // IMPORTANT: Wrap with sudo.sudo() since this requires root origin
      const verifyTx = api.tx.did.verifyInstitution(institutionDid);
      const tx = api.tx.sudo.sudo(verifyTx);
      
      console.log('📝 Created SUDO transaction, requesting signature...');

      // Sign and send
      await tx.signAndSend(
        account.address,
        { signer: injector.signer },
        ({ status, events, dispatchError }) => {
          console.log('📡 Transaction status:', status.type);

          if (status.isFinalized) {
            console.log('✅ Transaction finalized:', status.asFinalized.toHex());

            if (dispatchError) {
              console.error('❌ Dispatch error:', dispatchError.toString());
              
              if (dispatchError.isModule) {
                const decoded = api.registry.findMetaError(dispatchError.asModule);
                throw new Error(`${decoded.section}.${decoded.name}: ${decoded.docs.join(' ')}`);
              } else {
                throw new Error(dispatchError.toString());
              }
            }

            // Success - update local state
            setInstitutions(prev =>
              prev.map(inst =>
                inst.did === institutionDid
                  ? { ...inst, verified: true }
                  : inst
              )
            );

            toast.success('Institution verified successfully!');
          }
        }
      );
    } catch (error: any) {
      console.error('❌ Verification failed:', error);
      toast.error(error.message || 'Failed to verify institution');
    } finally {
      setVerifying(null);
    }
  };

  // Handle revocation
  const handleRevoke = async (institutionAddress: string) => {
    if (!api || !account) {
      toast.error('Please connect your wallet');
      return;
    }

    if (!confirm('Are you sure you want to revoke this institution\'s verification?')) {
      return;
    }

    setRevoking(institutionAddress);

    try {
      console.log('🔐 Starting revocation for:', institutionAddress);
      
      const injector = await web3FromAddress(account.address);
      const tx = api.tx.did.revokeInstitution(institutionAddress);
      
      await tx.signAndSend(
        account.address,
        { signer: injector.signer },
        ({ status, dispatchError }) => {
          if (status.isFinalized) {
            if (dispatchError) {
              toast.error('Revocation failed');
            } else {
              toast.success('Institution revoked successfully');
              fetchInstitutions();
            }
            setRevoking(null);
          }
        }
      );
    } catch (error: any) {
      console.error('❌ Revocation failed:', error);
      toast.error('Revocation failed', {
        description: error.message || 'Unknown error',
      });
      setRevoking(null);
    }
  };

  if (!isReady) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="max-w-md">
          <CardContent className="py-12 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-3 text-primary" />
            <p className="text-muted-foreground">Connecting to blockchain...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!account) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center text-yellow-600">
              <AlertCircle className="h-5 w-5 mr-2" />
              Authentication Required
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Please connect your wallet to access admin functions
            </p>
            <p className="text-xs text-muted-foreground">
              Note: You need to use a sudo/root account to verify institutions
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const pendingInstitutions = institutions.filter(i => !i.verified);
  const verifiedInstitutions = institutions.filter(i => i.verified);

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center mb-2">
          <Shield className="h-8 w-8 mr-3 text-primary" />
          Institution Verification
        </h1>
        <p className="text-muted-foreground">
          Review and verify academic institutions
        </p>
      </div>

      {/* Warning banner */}
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-6">
        <div className="flex items-start space-x-3">
          <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-500 flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-semibold text-yellow-800 dark:text-yellow-400">Admin Access Required</p>
            <p className="text-yellow-700 dark:text-yellow-300 mt-1">
              You must be using a sudo/root account (Alice, Bob, Charlie, etc.) to verify institutions.
              Regular accounts cannot perform these operations.
            </p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{institutions.length}</div>
            <p className="text-sm text-muted-foreground">Total Institutions</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-yellow-600">{pendingInstitutions.length}</div>
            <p className="text-sm text-muted-foreground">Pending Verification</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">{verifiedInstitutions.length}</div>
            <p className="text-sm text-muted-foreground">Verified</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Pending Institutions</h2>
        <Button
          variant="outline"
          onClick={fetchInstitutions}
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            'Refresh'
          )}
        </Button>
      </div>

      {loading ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-3 text-primary" />
            <p className="text-muted-foreground">Loading institutions...</p>
          </CardContent>
        </Card>
      ) : pendingInstitutions.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <CheckCircle className="h-12 w-12 mx-auto mb-3 text-green-500 opacity-50" />
            <p className="text-lg font-medium">No pending verifications</p>
            <p className="text-sm text-muted-foreground mt-1">
              All registered institutions have been reviewed
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {pendingInstitutions.map((institution) => (
            <Card key={institution.address} className="border-yellow-200 dark:border-yellow-800">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <Building2 className="h-5 w-5 text-primary" />
                      <h3 className="font-semibold text-lg">{institution.name}</h3>
                      <Badge variant="warning">Pending</Badge>
                    </div>
                    <code className="text-xs text-muted-foreground block mb-2">
                      {institution.address}
                    </code>
                    <p className="text-sm text-muted-foreground">
                      Registered: {new Date(institution.registeredAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleVerify(institution.address)}
                      disabled={verifying === institution.address}
                    >
                      {verifying === institution.address ? (
                        <><Loader2 className="h-3 w-3 mr-1 animate-spin" /> Verifying...</>
                      ) : (
                        <><CheckCircle className="h-3 w-3 mr-1" /> Verify</>
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Verified Institutions */}
      {verifiedInstitutions.length > 0 && (
        <>
          <h2 className="text-xl font-semibold mt-8 mb-4">Verified Institutions</h2>
          <div className="grid gap-4">
            {verifiedInstitutions.map((institution) => (
              <Card key={institution.address}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <Building2 className="h-5 w-5 text-primary" />
                        <h3 className="font-semibold text-lg">{institution.name}</h3>
                        <Badge variant="success">Verified</Badge>
                      </div>
                      <code className="text-xs text-muted-foreground block">
                        {institution.address}
                      </code>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRevoke(institution.address)}
                      disabled={revoking === institution.address}
                      className="text-red-600"
                    >
                      {revoking === institution.address ? (
                        <><Loader2 className="h-3 w-3 mr-1 animate-spin" /> Revoking...</>
                      ) : (
                        <><XCircle className="h-3 w-3 mr-1" /> Revoke</>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}