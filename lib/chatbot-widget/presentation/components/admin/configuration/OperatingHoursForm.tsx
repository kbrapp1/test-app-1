/**
 * Operating Hours Form Component
 * 
 * AI INSTRUCTIONS:
 * - Single responsibility: Handle operating hours configuration UI
 * - Under 200 lines - focused component
 * - Delegate all state management to parent/hooks
 * - Pure UI component - no business logic
 * - Use presentation layer types only
 */

'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Clock } from 'lucide-react';
import {
  BotConfigurationFormData as _BotConfigurationFormData,
  BotConfigurationViewState as _BotConfigurationViewState,
  BotConfigurationActions as _BotConfigurationActions,
} from '../../../types/BotConfigurationTypes';
import { useChatbotConfiguration } from '../../../hooks/useChatbotConfiguration';
import { useOrganization } from '@/lib/organization/application/providers/OrganizationProvider';

interface OperatingHoursFormProps {
  organizationId?: string;
}

export function OperatingHoursForm({ organizationId }: OperatingHoursFormProps) {
  // Security validation - verify client context matches server validation
  const { activeOrganizationId } = useOrganization();
  const { formData, viewState, actions } = useChatbotConfiguration();
  
  // Validate organization context for security
  if (organizationId && activeOrganizationId !== organizationId) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center py-8">
            <h2 className="text-xl font-semibold text-red-600 mb-2">Organization Context Mismatch</h2>
            <p className="text-gray-600">Please refresh the page or switch to the correct organization.</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  // Early return if form state is not available
  if (!formData || !viewState || !actions) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            Loading configuration...
          </div>
        </CardContent>
      </Card>
    );
  }
  const handleOperatingHoursChange = (enabled: boolean) => {
    actions.updateFormData({
      operatingHours: {
        ...formData.operatingHours,
        enabled,
      },
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          <CardTitle>Operating Hours</CardTitle>
        </div>
        <CardDescription>
          Set when your chatbot is available to respond to visitors.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Label>24/7 Availability</Label>
            <p className="text-sm text-muted-foreground">
              Bot responds to visitors at all times
            </p>
          </div>
          <Switch
            checked={!formData.operatingHours.enabled}
            onCheckedChange={(checked) => handleOperatingHoursChange(!checked)}
            disabled={!viewState.isEditing}
          />
        </div>

        {formData.operatingHours.enabled && (
          <Alert>
            <AlertDescription>
              Custom operating hours will be available in a future update.
              Currently, your bot operates 24/7.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
} 