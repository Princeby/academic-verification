// src/pages/Institutions.tsx
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

export default function Institutions() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Institutions</h1>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Institution Directory</CardTitle>
              <CardDescription>
                Browse verified academic institutions
              </CardDescription>
            </div>
            <Badge variant="success">0 Verified</Badge>
          </div>
        </CardHeader>
      </Card>
    </div>
  );
}