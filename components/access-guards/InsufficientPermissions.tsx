'use client';

/**
 * Insufficient Permissions Component
 * 
 * AI INSTRUCTIONS:
 * - Specific component for permission-based access denials
 * - Used when user has organization access but lacks specific permissions
 * - Provides clear guidance on how to get access
 * - Different from NoOrganizationAccess and FeatureNotAvailable
 * - Uses large centered UI with triangle icon for consistency
 */

import { Button } from '@/components/ui/button';

interface InsufficientPermissionsProps {
  feature?: string;
  requiredPermissions?: string[];
  title?: string;
  description?: string;
  showContactAdmin?: boolean;
}

export function InsufficientPermissions({
  feature = "this feature",
  requiredPermissions = [],
  title = "Insufficient Permissions",
  description,
  showContactAdmin = true
}: InsufficientPermissionsProps) {
  
  // AI: Generate default description based on feature and permissions
  const defaultDescription = description || 
    `You don't have the required permissions to access ${feature}.${requiredPermissions.length > 0 ? ` Required: ${requiredPermissions.join(', ')}` : ''}`;

  // AI: Handle admin contact
  const handleContactAdmin = () => {
    // TODO: Replace with actual admin contact method
    window.open('mailto:admin@company.com?subject=Permission Request&body=I need access to ' + feature, '_blank');
  };

  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center space-y-4 max-w-md">
        <div className="w-16 h-16 mx-auto bg-red-100 rounded-full flex items-center justify-center">
          <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-foreground">{title}</h3>
          <p className="text-muted-foreground">{defaultDescription}</p>
          <p className="text-sm text-muted-foreground">
            Contact your organization administrator to request access.
          </p>
        </div>
        {showContactAdmin && (
          <Button
            variant="outline"
            onClick={handleContactAdmin}
            className="mt-4"
          >
            Contact Admin
          </Button>
        )}
      </div>
    </div>
  );
} 