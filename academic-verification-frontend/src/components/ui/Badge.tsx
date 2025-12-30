import * as React from 'react';
import { cn } from '@/lib/utils/cn';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'success' | 'warning' | 'error' | 'outline' | 'secondary';
}

export const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant = 'default', ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'inline-flex items-center rounded-md px-2 py-1 text-xs font-semibold',
          variant === 'default' && 'bg-gray-100 text-gray-900',
          variant === 'success' && 'bg-green-100 text-green-900',
          variant === 'warning' && 'bg-yellow-100 text-yellow-900',
          variant === 'error' && 'bg-red-100 text-red-900',
          variant === 'outline' && 'border border-gray-400 text-gray-800',
          variant === 'secondary' && 'bg-gray-200 text-gray-700',
          className
        )}
        {...props}
      />
    );
  }
);

Badge.displayName = 'Badge';
