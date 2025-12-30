// src/pages/Institution.tsx
import { useState } from 'react';
import { useDIDStore } from '@/store/did.store';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Building2, FileText, Users, Award, Plus } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import InstitutionRegistration from '@/components/did/InstitutionRegistration';

export default function Institutions() {
  const { isInstitution, institutionName } = useDIDStore();
  const [showRegistration, setShowRegistration] = useState(!isInstitution);

  if (showRegistration && !isInstitution) {
    return (
      <div className="py-8">
        <InstitutionRegistration 
          onSuccess={() => setShowRegistration(false)}
          onCancel={() => setShowRegistration(false)}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{institutionName || 'Institution Profile'}</h1>
          <p className="text-muted-foreground mt-1">
            Manage your institution and issue credentials
          </p>
        </div>
        <Badge variant="success" className="text-sm px-3 py-1">
          Verified Institution
        </Badge>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Credentials Issued
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Recipients
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Endorsements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Reputation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button variant="outline" className="justify-start h-auto py-4">
            <div className="flex flex-col items-start w-full">
              <div className="flex items-center space-x-2 mb-1">
                <Plus className="h-4 w-4" />
                <span className="font-semibold">Issue Credential</span>
              </div>
              <span className="text-xs text-muted-foreground">
                Issue a new credential to a student
              </span>
            </div>
          </Button>

          <Button variant="outline" className="justify-start h-auto py-4">
            <div className="flex flex-col items-start w-full">
              <div className="flex items-center space-x-2 mb-1">
                <FileText className="h-4 w-4" />
                <span className="font-semibold">View Issued</span>
              </div>
              <span className="text-xs text-muted-foreground">
                See all credentials you've issued
              </span>
            </div>
          </Button>

          <Button variant="outline" className="justify-start h-auto py-4">
            <div className="flex flex-col items-start w-full">
              <div className="flex items-center space-x-2 mb-1">
                <Users className="h-4 w-4" />
                <span className="font-semibold">Manage Profile</span>
              </div>
              <span className="text-xs text-muted-foreground">
                Update institution information
              </span>
            </div>
          </Button>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Latest credential issuances and updates</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Award className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No activity yet</p>
            <p className="text-sm mt-1">Start by issuing your first credential</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}