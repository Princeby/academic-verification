import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Award, 
  Building2, 
  CheckCircle, 
  Users,
  FileText,
  Settings,
  Plus
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { Button } from '../ui/Button';
import DIDStatus from '../did/DIDStatus';
import CreateDIDModal from '../did/CreateDIDModal';
import { useDIDStore } from '@/store/did.store';

const navigationItems = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: 'My Credentials',
    href: '/credentials',
    icon: Award,
  },
  {
    title: 'Institutions',
    href: '/institutions',
    icon: Building2,
  },
  {
    title: 'Verify',
    href: '/verify',
    icon: CheckCircle,
  },
];

const institutionItems = [
  {
    title: 'Institution Profile',
    href: '/institution',
    icon: Building2,
  },
  {
    title: 'Issued Credentials',
    href: '/institution/issued',
    icon: FileText,
  },
  {
    title: 'Endorsements',
    href: '/institution/endorsements',
    icon: Users,
  },
];

export default function Sidebar() {
  const location = useLocation();
  const [showCreateDIDModal, setShowCreateDIDModal] = useState(false);
  const { hasDID, isInstitution } = useDIDStore();

  return (
    <>
      <div className="flex flex-col h-full py-6 px-3">
        {/* User Profile Section */}
        <div className="mb-6 px-3">
          <DIDStatus />
        </div>

        {/* Quick Actions */}
        {!hasDID && (
          <div className="mb-6 px-3 space-y-2">
            <Button 
              className="w-full justify-start" 
              size="sm"
              onClick={() => setShowCreateDIDModal(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Create DID
            </Button>
          </div>
        )}

        {/* Main Navigation */}
        <nav className="flex-1 space-y-1">
          <div className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            Main Menu
          </div>
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.href;
            
            return (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  "flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <Icon className="h-5 w-5 mr-3" />
                {item.title}
              </Link>
            );
          })}

          {/* Institution Section (conditional) */}
          {isInstitution && (
            <>
              <div className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mt-6 mb-2">
                Institution
              </div>
              {institutionItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.href;
                
                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    className={cn(
                      "flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                    )}
                  >
                    <Icon className="h-5 w-5 mr-3" />
                    {item.title}
                  </Link>
                );
              })}
            </>
          )}
        </nav>

        {/* Settings */}
        <div className="mt-auto pt-4 border-t border-border">
          <Link
            to="/settings"
            className="flex items-center px-3 py-2 text-sm font-medium rounded-lg text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            <Settings className="h-5 w-5 mr-3" />
            Settings
          </Link>
        </div>
      </div>

      {/* Create DID Modal */}
      <CreateDIDModal 
        isOpen={showCreateDIDModal}
        onClose={() => setShowCreateDIDModal(false)}
      />
    </>
  );
}