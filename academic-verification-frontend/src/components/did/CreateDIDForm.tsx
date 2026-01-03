import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Key, Copy, Download, Eye, EyeOff, AlertTriangle, CheckCircle2, Loader2, RefreshCw } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/Card';
import { Input } from '../ui/Input';
import { Badge } from '../ui/Badge';
import { toast } from 'sonner';
import { mnemonicGenerate, mnemonicToMiniSecret, naclKeypairFromSeed } from '@polkadot/util-crypto';
import { u8aToHex } from '@polkadot/util';
import { Keyring } from '@polkadot/keyring';
import { useBlockchain } from '@/hooks/blockchain/useBlockchain';
import { useWalletStore } from '@/store/wallet.store';
import { useDIDStore } from '@/store/did.store';

// Form validation schema
const createDIDSchema = z.object({
  keyType: z.enum(['Ed25519', 'Sr25519', 'ECDSA']),
  backupConfirmed: z.boolean().refine(val => val === true, {
    message: 'You must confirm that you have backed up your keys',
  }),
});

type CreateDIDFormData = z.infer<typeof createDIDSchema>;

// Key types with descriptions
const KEY_TYPES = [
  {
    value: 'Ed25519',
    name: 'Ed25519',
    description: 'Recommended - Fast and secure',
    recommended: true,
  },
  {
    value: 'Sr25519',
    name: 'Sr25519',
    description: 'Substrate native - More features',
    recommended: false,
  },
  {
    value: 'ECDSA',
    name: 'ECDSA',
    description: 'Ethereum compatible',
    recommended: false,
  },
] as const;

interface CreateDIDFormProps {
  onSuccess?: (did: string) => void;
  onCancel?: () => void;
}

export default function CreateDIDForm({ onSuccess, onCancel }: CreateDIDFormProps) {
  const [step, setStep] = useState<'select' | 'generate' | 'backup' | 'confirm' | 'submit'>('select');
  const [generatedKeys, setGeneratedKeys] = useState<{
    publicKey: string;
    mnemonic: string;
    address: string;
  } | null>(null);
  const [showMnemonic, setShowMnemonic] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [transactionStatus, setTransactionStatus] = useState('');

  const { account } = useWalletStore();
  const { transactions, isReady } = useBlockchain();
  const { setDID } = useDIDStore();

  const { register, handleSubmit, watch, formState: { errors } } = useForm<CreateDIDFormData>({
    resolver: zodResolver(createDIDSchema),
    defaultValues: {
      keyType: 'Ed25519',
      backupConfirmed: false,
    },
  });

  const selectedKeyType = watch('keyType');

  // Generate keys with real Polkadot keypair
  const generateKeys = async () => {
    try {
      setStep('generate');
      
      // Generate a random 12-word mnemonic
      const mnemonic = mnemonicGenerate(12);
      
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Create keyring with the selected key type
      const keyring = new Keyring({ 
        type: selectedKeyType.toLowerCase() as 'ed25519' | 'sr25519' | 'ecdsa' 
      });
      
      // Create keypair from mnemonic
      const pair = keyring.addFromMnemonic(mnemonic);
      
      const keys = {
        publicKey: u8aToHex(pair.publicKey),
        mnemonic: mnemonic,
        address: pair.address,
      };
      
      console.log('Generated keys:', {
        address: keys.address,
        publicKey: keys.publicKey,
        keyType: selectedKeyType,
      });
      
      setGeneratedKeys(keys);
      setStep('backup');
      toast.success('Keys generated successfully');
    } catch (error) {
      console.error('Failed to generate keys:', error);
      toast.error('Failed to generate keys');
      setStep('select');
    }
  };

  // Regenerate keys
  const regenerateKeys = async () => {
    toast.info('Generating new keys...');
    await generateKeys();
  };

  // Copy to clipboard
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  // Download backup file
  const downloadBackup = () => {
    if (!generatedKeys) return;
    
    const backup = {
      publicKey: generatedKeys.publicKey,
      mnemonic: generatedKeys.mnemonic,
      address: generatedKeys.address,
      keyType: selectedKeyType,
      createdAt: new Date().toISOString(),
      warning: 'KEEP THIS FILE SECURE! Anyone with this information can control your DID.',
    };
    
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `did-backup-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success('Backup file downloaded');
  };

  // Submit DID creation to blockchain
  const onSubmit = async (data: CreateDIDFormData) => {
    if (!generatedKeys || !account || !transactions || !isReady) {
      toast.error('Wallet not connected or blockchain not ready');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      console.log('🚀 Submitting DID creation to blockchain...');
      
      // Convert hex public key to Uint8Array
      const publicKeyHex = generatedKeys.publicKey.startsWith('0x') 
        ? generatedKeys.publicKey.slice(2) 
        : generatedKeys.publicKey;
      
      const publicKeyBytes = new Uint8Array(
        publicKeyHex.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16))
      );

      console.log('📝 Transaction details:', {
        from: account.address,
        publicKey: generatedKeys.publicKey,
        keyType: data.keyType,
      });

      // Call the blockchain transaction with status updates
      const result = await transactions.did.createDID(
        account,
        publicKeyBytes,
        data.keyType,
        (status) => {
          console.log('Transaction status:', status);
          setTransactionStatus(status.message);
          
          if (status.status === 'signing') {
            toast.info('Please sign the transaction in your wallet');
          } else if (status.status === 'inBlock') {
            toast.info('Transaction included in block');
          }
        }
      );

      if (result.success) {
        console.log('✅ DID created successfully!', result);
        
        // Update DID store
        setDID(generatedKeys.address, [{
          id: 'primary_key',
          keyType: data.keyType,
          publicKey: generatedKeys.publicKey,
          addedAt: Date.now(),
        }]);
        
        toast.success('DID created successfully!', {
          description: `Block: ${result.blockHash?.slice(0, 10)}...`,
        });
        
        onSuccess?.(generatedKeys.address);
      } else {
        throw new Error(result.error || 'Transaction failed');
      }
    } catch (error: any) {
      console.error('❌ Failed to create DID:', error);
      
      let errorMessage = 'Failed to create DID';
      
      if (error.message?.includes('1010')) {
        errorMessage = 'Insufficient balance for transaction fee';
      } else if (error.message?.includes('rejected')) {
        errorMessage = 'Transaction was rejected';
      } else if (error.message?.includes('DidAlreadyExists')) {
        errorMessage = 'DID already exists for this account';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage, {
        description: 'Please check your balance and try again',
      });
    } finally {
      setIsSubmitting(false);
      setTransactionStatus('');
    }
  };

  // Step 1: Select Key Type
  if (step === 'select') {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Key className="h-6 w-6" />
            <span>Create Your DID</span>
          </CardTitle>
          <CardDescription>
            Choose a key type for your decentralized identifier
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Connection Check */}
          {!account && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-500 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-semibold text-yellow-800 dark:text-yellow-400">Wallet Not Connected</p>
                  <p className="text-yellow-700 dark:text-yellow-300 mt-1">
                    Please connect your wallet first to create a DID.
                  </p>
                </div>
              </div>
            </div>
          )}

          {!isReady && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <Loader2 className="h-5 w-5 animate-spin text-blue-600 dark:text-blue-500 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-semibold text-blue-800 dark:text-blue-400">Connecting to Blockchain</p>
                  <p className="text-blue-700 dark:text-blue-300 mt-1">
                    Please wait while we connect to the blockchain...
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-3">
            {KEY_TYPES.map((type) => (
              <label
                key={type.value}
                className={`
                  flex items-start p-4 border-2 rounded-lg cursor-pointer transition-all
                  ${selectedKeyType === type.value 
                    ? 'border-primary bg-primary/5' 
                    : 'border-border hover:border-primary/50'
                  }
                `}
              >
                <input
                  type="radio"
                  value={type.value}
                  {...register('keyType')}
                  className="mt-1"
                />
                <div className="ml-3 flex-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold">{type.name}</span>
                    {type.recommended && (
                      <Badge variant="success" className="text-xs">Recommended</Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{type.description}</p>
                </div>
              </label>
            ))}
          </div>

          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-500 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-semibold text-yellow-800 dark:text-yellow-400">Important Security Notice</p>
                <p className="text-yellow-700 dark:text-yellow-300 mt-1">
                  You will receive a randomly generated recovery phrase. Write it down and store it safely. 
                  Anyone with this phrase can control your DID.
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-between">
            {onCancel && (
              <Button variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            )}
            <Button 
              onClick={generateKeys} 
              className="ml-auto"
              disabled={!account || !isReady}
            >
              Continue
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Step 2: Generating (Loading)
  if (step === 'generate') {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardContent className="py-12">
          <div className="text-center space-y-4">
            <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
            <h3 className="text-xl font-semibold">Generating Your Keys...</h3>
            <p className="text-muted-foreground">Creating a secure random seed phrase</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Step 3 & 4: Backup Keys
  if (step === 'backup' || step === 'confirm') {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Key className="h-6 w-6" />
            <span>Backup Your Keys</span>
          </CardTitle>
          <CardDescription>
            Save these keys securely. You'll need them to recover your DID.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* DID Address */}
          <div>
            <label className="text-sm font-semibold mb-2 block">Your DID Address</label>
            <div className="flex items-center space-x-2">
              <Input 
                value={generatedKeys?.address || ''} 
                readOnly 
                className="font-mono text-sm"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={() => copyToClipboard(generatedKeys?.address || '', 'Address')}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Public Key */}
          <div>
            <label className="text-sm font-semibold mb-2 block">Public Key</label>
            <div className="flex items-center space-x-2">
              <Input 
                value={generatedKeys?.publicKey || ''} 
                readOnly 
                className="font-mono text-sm"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={() => copyToClipboard(generatedKeys?.publicKey || '', 'Public key')}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Recovery Phrase */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-semibold">
                Recovery Phrase (Mnemonic)
              </label>
              <Button
                variant="ghost"
                size="sm"
                onClick={regenerateKeys}
                className="text-xs"
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                Generate New
              </Button>
            </div>
            <div className="space-y-2">
              <div className="relative">
                <Input 
                  value={generatedKeys?.mnemonic || ''} 
                  type={showMnemonic ? 'text' : 'password'}
                  readOnly 
                  className="font-mono text-sm pr-20"
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex space-x-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setShowMnemonic(!showMnemonic)}
                  >
                    {showMnemonic ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => copyToClipboard(generatedKeys?.mnemonic || '', 'Recovery phrase')}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                This is a randomly generated 12-word phrase. Click "Generate New" to create a different one.
              </p>
            </div>
          </div>

          {/* Download Backup */}
          <Button
            variant="outline"
            className="w-full"
            onClick={downloadBackup}
          >
            <Download className="h-4 w-4 mr-2" />
            Download Backup File
          </Button>

          {/* Security Warning */}
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-500 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-semibold text-red-800 dark:text-red-400">Critical Security Warning</p>
                <ul className="text-red-700 dark:text-red-300 mt-2 space-y-1 list-disc list-inside">
                  <li>Never share your recovery phrase with anyone</li>
                  <li>Store it in a secure location (password manager, safe, etc.)</li>
                  <li>If you lose it, you cannot recover your DID</li>
                  <li>Anyone with this phrase can control your DID</li>
                  <li>You can generate a new phrase if you're not satisfied with this one</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Confirmation Checkbox */}
          <label className="flex items-start space-x-3 cursor-pointer">
            <input
              type="checkbox"
              {...register('backupConfirmed')}
              className="mt-1"
            />
            <span className="text-sm">
              I have securely backed up my recovery phrase and understand that I cannot recover 
              my DID without it. I accept full responsibility for keeping it safe.
            </span>
          </label>
          {errors.backupConfirmed && (
            <p className="text-sm text-red-600">{errors.backupConfirmed.message}</p>
          )}

          {/* Transaction Status */}
          {transactionStatus && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <Loader2 className="h-5 w-5 animate-spin text-blue-600 dark:text-blue-500" />
                <p className="text-sm font-medium text-blue-800 dark:text-blue-400">
                  {transactionStatus}
                </p>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-between pt-4">
            <Button 
              variant="outline" 
              onClick={() => {
                setStep('select');
                setGeneratedKeys(null);
              }}
              disabled={isSubmitting}
            >
              Start Over
            </Button>
            <Button
              onClick={handleSubmit(onSubmit)}
              disabled={isSubmitting || !isReady}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating DID...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Create DID
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return null;
}