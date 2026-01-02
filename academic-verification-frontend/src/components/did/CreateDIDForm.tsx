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
import { mnemonicGenerate } from '@polkadot/util-crypto';

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

  const { register, handleSubmit, watch, formState: { errors } } = useForm<CreateDIDFormData>({
    resolver: zodResolver(createDIDSchema),
    defaultValues: {
      keyType: 'Ed25519',
      backupConfirmed: false,
    },
  });

  const selectedKeyType = watch('keyType');

  // Generate keys with randomized mnemonic
  const generateKeys = async () => {
    try {
      setStep('generate');
      
      // Generate a random 12-word mnemonic using Polkadot's crypto utilities
      const mnemonic = mnemonicGenerate(12);
      
      // Simulate key generation (replace with actual Polkadot key generation)
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock generated keys (in production, derive these from the mnemonic)
      const mockKeys = {
        publicKey: '0x' + Array(64).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join(''),
        mnemonic: mnemonic,
        address: '5' + Array(47).fill(0).map(() => 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'[Math.floor(Math.random() * 62)]).join(''),
      };
      
      setGeneratedKeys(mockKeys);
      setStep('backup');
      toast.success('Keys generated successfully');
    } catch (error) {
      console.error('Failed to generate keys:', error);
      toast.error('Failed to generate keys');
      setStep('select');
    }
  };

  // Regenerate keys (create new random mnemonic)
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
    if (!generatedKeys) return;
    
    setIsSubmitting(true);
    
    try {
      // TODO: Replace with actual blockchain transaction
      console.log('Creating DID with:', {
        keyType: data.keyType,
        publicKey: generatedKeys.publicKey,
        address: generatedKeys.address,
      });
      
      // Simulate transaction
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast.success('DID created successfully!');
      onSuccess?.(generatedKeys.address);
    } catch (error) {
      console.error('Failed to create DID:', error);
      toast.error('Failed to create DID. Please try again.');
    } finally {
      setIsSubmitting(false);
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
            <Button onClick={generateKeys} className="ml-auto">
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

          {/* Actions */}
          <div className="flex justify-between pt-4">
            <Button 
              variant="outline" 
              onClick={() => {
                setStep('select');
                setGeneratedKeys(null);
              }}
            >
              Start Over
            </Button>
            <Button
              onClick={handleSubmit(onSubmit)}
              disabled={isSubmitting}
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