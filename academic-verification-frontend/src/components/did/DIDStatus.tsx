import { CheckCircle, Clock, AlertCircle, User } from 'lucide-react';
import { useDIDStore } from '@/store/did.store';
import { Badge } from '../ui/Badge';
import { DID_STATUS } from '@/lib/utils/constants';

export default function DIDStatus() {
  const { hasDID, status, isInstitution } = useDIDStore();

  const getStatusConfig = () => {
    switch (status) {
      case DID_STATUS.ACTIVE:
        return {
          icon: CheckCircle,
          text: 'Active',
          variant: 'success' as const,
          description: 'Your identity is active',
        };
      case DID_STATUS.INACTIVE:
        return {
          icon: AlertCircle,
          text: 'Inactive',
          variant: 'warning' as const,
          description: 'Your identity is deactivated',
        };
      case DID_STATUS.PENDING:
        return {
          icon: Clock,
          text: 'Pending',
          variant: 'warning' as const,
          description: 'Verification pending',
        };
      default:
        return {
          icon: User,
          text: 'No DID',
          variant: 'outline' as const,
          description: 'Create your DID to get started',
        };
    }
  };

  const config = getStatusConfig();
  const StatusIcon = config.icon;

  return (
    <div className="flex items-center space-x-3 p-3 rounded-lg bg-accent/50">
      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
        <StatusIcon className="h-5 w-5 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center space-x-2">
          <p className="text-sm font-medium truncate">
            {hasDID ? 'Identity' : 'No Identity'}
          </p>
          <Badge variant={config.variant} className="text-xs">
            {config.text}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground truncate">
          {config.description}
        </p>
        {isInstitution && (
          <Badge variant="secondary" className="mt-1 text-xs">
            Institution
          </Badge>
        )}
      </div>
    </div>
  );
}