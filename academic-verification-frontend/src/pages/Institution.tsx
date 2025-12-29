// src/pages/Institution.tsx
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';

export default function Institution() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Institution Profile</h1>
      <Card>
        <CardHeader>
          <CardTitle>Institution Management</CardTitle>
          <CardDescription>
            Manage your institution profile and credentials
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}