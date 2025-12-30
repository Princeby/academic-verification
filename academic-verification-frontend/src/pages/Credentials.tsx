// src/pages/Credentials.tsx
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';

export default function Credentials() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">My Credentials</h1>
      <Card>
        <CardHeader>
          <CardTitle>Credentials List</CardTitle>
          <CardDescription>
            Your academic credentials will appear here
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}