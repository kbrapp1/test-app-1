'use client';

import React from 'react';
import { Shield } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { Profile } from '@/lib/auth';

/**
 * Super Admin Badge Component
 * 
 * Single Responsibility: Display super admin status with appropriate visual indicators
 * 
 * Features:
 * - Conditional rendering based on super admin status
 * - Accessible design with ARIA labels
 * - Responsive design for mobile and desktop
 * - Consistent styling with design system
 */

interface SuperAdminBadgeProps {
  /** User profile containing super admin status */
  profile: Profile | null;
  
  /** Optional size variant */
  size?: 'sm' | 'md' | 'lg';
  
  /** Optional custom className */
  className?: string;
  
  /** Whether to show icon alongside text */
  showIcon?: boolean;
  
  /** Whether to show full text or abbreviated */
  abbreviated?: boolean;
}

/**
 * SuperAdminBadge displays a visual indicator when user has super admin privileges
 */
export function SuperAdminBadge({ 
  profile, 
  size = 'md', 
  className,
  showIcon = true,
  abbreviated = false 
}: SuperAdminBadgeProps) {
  // Don't render if user is not a super admin
  if (!profile?.is_super_admin) {
    return null;
  }

  const sizeClasses = {
    sm: 'text-xs px-1.5 py-0.5 gap-1',
    md: 'text-sm px-2 py-1 gap-1.5',
    lg: 'text-base px-3 py-1.5 gap-2'
  };

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4', 
    lg: 'h-5 w-5'
  };

  const badgeText = abbreviated ? 'Admin' : 'Super Admin';

  return (
    <Badge
      variant="destructive"
      className={cn(
        'inline-flex items-center font-medium',
        'bg-red-600 hover:bg-red-700',
        'border-red-700',
        'text-white',
        sizeClasses[size],
        className
      )}
      role="status"
      aria-label={`User has super admin privileges - can access all organizations`}
    >
      {showIcon && (
        <Shield 
          className={cn(iconSizes[size], 'flex-shrink-0')}
          aria-hidden="true"
        />
      )}
      <span className="whitespace-nowrap">
        {badgeText}
      </span>
    </Badge>
  );
}

/**
 * Compact version for tight spaces like navigation
 */
export function SuperAdminBadgeCompact({ profile, className }: Pick<SuperAdminBadgeProps, 'profile' | 'className'>) {
  return (
    <SuperAdminBadge
      profile={profile}
      size="sm"
      abbreviated
      className={className}
    />
  );
}

/**
 * Icon-only version for very tight spaces
 */
export function SuperAdminIcon({ profile, className }: Pick<SuperAdminBadgeProps, 'profile' | 'className'>) {
  if (!profile?.is_super_admin) {
    return null;
  }

  return (
    <Shield
      className={cn(
        'h-4 w-4 text-red-600 flex-shrink-0',
        className
      )}
      aria-label="Super Admin"
      role="img"
    />
  );
} 