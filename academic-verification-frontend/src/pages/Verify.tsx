// src/pages/Verify.tsx
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Search } from 'lucide-react';

export default function Verify() {
  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">Verify Credential</h1>
        <p className="text-muted-foreground">
          Enter a credential hash to verify its authenticity
        </p>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Credential Hash</CardTitle>
          <CardDescription>
            Paste the credential hash or upload a document
          </CardDescription>
        </CardHeader>
        <div className="p-6 pt-0">
          <div className="flex space-x-2">
            <input
              type="text"
              placeholder="Enter credential hash (0x...)"
              className="flex-1 px-3 py-2 border border-border rounded-md bg-background"
            />
            <Button>
              <Search className="h-4 w-4 mr-2" />
              Verify
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}