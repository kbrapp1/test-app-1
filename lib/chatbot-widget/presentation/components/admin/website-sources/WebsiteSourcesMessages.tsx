/**
 * Website Sources Messages Component
 * 
 * AI INSTRUCTIONS:
 * - Single responsibility: Display error and success messages
 * - Keep under 50 lines - focused component
 * - Follow @golden-rule patterns exactly
 * - Pure presentation component
 */

import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, CheckCircle } from 'lucide-react';

interface WebsiteSourcesMessagesProps {
  formErrors: string[];
  successMessage: string | null;
}

export function WebsiteSourcesMessages({ 
  formErrors, 
  successMessage 
}: WebsiteSourcesMessagesProps) {
  return (
    <>
      {/* Error Display */}
      {formErrors.length > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <ul className="list-disc list-inside space-y-1">
              {formErrors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Success Message */}
      {successMessage && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            {successMessage}
          </AlertDescription>
        </Alert>
      )}
    </>
  );
} 