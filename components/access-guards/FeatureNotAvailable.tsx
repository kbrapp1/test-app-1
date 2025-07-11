'use client';

/**
 * Feature Not Available Component
 * 
 * AI INSTRUCTIONS:
 * - Shared access guard for app-wide use
 * - Display when organization doesn't have feature enabled
 * - Provide upgrade/contact information
 * - Use consistent styling with other guards
 * - Show feature-specific messaging
 */

import { Lock, ExternalLink, Mail } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

interface FeatureNotAvailableProps {
  feature: string;
  description?: string;
  showUpgrade?: boolean;
  showContact?: boolean;
  upgradeUrl?: string;
}

export function FeatureNotAvailable({
  feature,
  description,
  showUpgrade = true,
  showContact = true,
  upgradeUrl = '/settings/billing'
}: FeatureNotAvailableProps) {
  // AI: Default description based on feature
  const defaultDescription = `The ${feature} feature is not available for your organization. Please upgrade your plan or contact support for access.`;

  // AI: Handle upgrade navigation
  const handleUpgrade = () => {
    window.location.href = upgradeUrl;
  };

  // AI: Handle support contact
  const handleContact = () => {
    window.open(`mailto:support@company.com?subject=${feature} Feature Access Request`, '_blank');
  };

  return (
    <div className="flex items-center justify-center min-h-[400px] p-6">
      <div className="max-w-md w-full space-y-4">
        <Alert>
          <Lock className="h-4 w-4" />
          <AlertDescription className="space-y-4">
            <div>
              <h3 className="font-semibold text-sm">{feature} Not Available</h3>
              <p className="text-sm mt-1 text-muted-foreground">
                {description || defaultDescription}
              </p>
            </div>
            
            {(showUpgrade || showContact) && (
              <div className="flex gap-2 pt-2">
                {showUpgrade && (
                  <Button
                    variant="default"
                    size="sm"
                    onClick={handleUpgrade}
                    className="flex items-center gap-2"
                  >
                    <ExternalLink className="h-3 w-3" />
                    Upgrade Plan
                  </Button>
                )}
                
                {showContact && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleContact}
                    className="flex items-center gap-2"
                  >
                    <Mail className="h-3 w-3" />
                    Contact Sales
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