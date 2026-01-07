// src/pages/Verify.tsx
import { useSearchParams } from 'react-router-dom';
import VerifyCredential from '@/components/credentials/VerifyCredential';
import { Shield } from 'lucide-react';

export default function Verify() {
  const [searchParams] = useSearchParams();
  const hashParam = searchParams.get('hash');

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="text-center">
        <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-primary/10 mb-4">
          <Shield className="h-8 w-8 text-primary" />
        </div>
        <h1 className="text-3xl md:text-4xl font-bold mb-2">
          Verify Academic Credential
        </h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Instantly verify the authenticity of any academic credential issued on our blockchain.
          No account required.
        </p>
      </div>

      {/* Verification Component */}
      <VerifyCredential initialHash={hashParam || undefined} />

      {/* Trust Indicators */}
      <div className="mt-12 pt-8 border-t border-border">
        <p className="text-center text-sm text-muted-foreground mb-6">
          Trusted by institutions and employers worldwide
        </p>
        <div className="flex flex-wrap justify-center items-center gap-8 opacity-50">
          <div className="text-2xl font-bold">MIT</div>
          <div className="text-2xl font-bold">Stanford</div>
          <div className="text-2xl font-bold">Harvard</div>
          <div className="text-2xl font-bold">Oxford</div>
          <div className="text-2xl font-bold">Cambridge</div>
        </div>
      </div>
    </div>
  );
}