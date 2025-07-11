'use client';

/**
 * No Organization Access Component
 * 
 * AI INSTRUCTIONS:
 * - Shared access guard for app-wide use
 * - Display when user has no active organization
 * - Provide clear guidance on next steps
 * - Include contact support option
 * - Use consistent error styling
 * - Client component due to event handlers
 */

import { AlertCircle, Mail, RefreshCw } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

interface NoOrganizationAccessProps {
  title?: string;
  description?: string;
  showRefresh?: boolean;
  showSupport?: boolean;
}

export function NoOrganizationAccess({
  title = "No Organization Access",
  description = "You don't currently have access to any organization. Please contact your administrator or support team.",
  showRefresh = true,
  showSupport = true
}: NoOrganizationAccessProps) {
  // AI: Handle page refresh
  const handleRefresh = () => {
    window.location.reload();
  };

  // AI: Handle support contact
  const handleSupport = () => {
    window.open('mailto:support@company.com?subject=Organization Access Issue', '_blank');
  };

  return (
    <div className="flex items-center justify-center min-h-[400px] p-6">
      <div className="max-w-md w-full space-y-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="space-y-4">
            <div>
              <h3 className="font-semibold text-sm">{title}</h3>
              <p className="text-sm mt-1">{description}</p>
            </div>
            
            {(showRefresh || showSupport) && (
              <div className="flex gap-2 pt-2">
                {showRefresh && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRefresh}
                    className="flex items-center gap-2"
                  >
                    <RefreshCw className="h-3 w-3" />
                    Refresh
                  </Button>
                )}
                
                {showSupport && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSupport}
                    className="flex items-center gap-2"
                  >
                    <Mail className="h-3 w-3" />
                    Contact Support
                  </Button>
                )}
              </div>
            )}
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
} 