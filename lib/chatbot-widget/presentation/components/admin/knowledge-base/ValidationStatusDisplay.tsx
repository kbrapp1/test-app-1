/**
 * Validation Status Display Component
 * 
 * AI INSTRUCTIONS:
 * - Component for displaying validation feedback, errors, and warnings
 * - Handles validation status icons and aggregated error/warning messages
 * - Provides consistent validation UI patterns across form components
 * - Follows @golden-rule patterns with single responsibility and clean component composition
 */

import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, CheckCircle, AlertTriangle } from 'lucide-react';
import { useMultiContentValidation } from '../../../hooks/useContentValidation';

interface ValidationStatusDisplayProps {
  validation: ReturnType<typeof useMultiContentValidation>;
  isEditing: boolean;
}

export function ValidationStatusDisplay({
  validation,
  isEditing,
}: ValidationStatusDisplayProps) {
  // Get validation status icon and color
  const getValidationIcon = () => {
    switch (validation.overallStatus) {
      case 'valid': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'error':
      case 'critical': return <AlertCircle className="h-4 w-4 text-red-500" />;
      default: return null;
    }
  };

  if (!isEditing) return null;

  return (
    <>
      {/* Validation Icon */}
      {getValidationIcon()}
      
      {/* Validation Messages */}
      {(validation.getAllErrors().length > 0 || validation.getAllWarnings().length > 0) && (
        <div className="space-y-2">
          {validation.getAllErrors().length > 0 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-1">
                  {validation.getAllErrors().slice(0, 3).map((error, index) => (
                    <div key={index} className="text-sm">
                      <strong>{error.field}:</strong> {error.message}
                    </div>
                  ))}
                  {validation.getAllErrors().length > 3 && (
                    <div className="text-sm text-muted-foreground">
                      +{validation.getAllErrors().length - 3} more errors
                    </div>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          )}
          
          {validation.getAllWarnings().length > 0 && validation.getAllErrors().length === 0 && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-1">
                  {validation.getAllWarnings().slice(0, 2).map((warning, index) => (
                    <div key={index} className="text-sm">
                      <strong>{warning.field}:</strong> {warning.message}
                    </div>
                  ))}
                </div>
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}
    </>
  );
}
