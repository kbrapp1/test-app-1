/**
 * Company Information Field Component
 * 
 * AI INSTRUCTIONS:
 * - Reusable form field component for company information with validation display
 * - Handles controlled input state, validation feedback, and character counting
 * - Provides consistent field styling based on validation status
 * - Follows @golden-rule patterns with single responsibility and clean component composition
 */

import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useMultiContentValidation } from '../../../hooks/useContentValidation';

interface CompanyInfoFieldProps {
  id: string;
  label: string;
  value: string;
  placeholder: string;
  disabled: boolean;
  rows: number;
  onChange?: (value: string) => void;
  validation?: ReturnType<typeof useMultiContentValidation>['validations'][string];
  showValidation?: boolean;
  tooltip?: React.ReactNode;
}

export function CompanyInfoField({
  id,
  label,
  value,
  placeholder,
  disabled,
  rows,
  onChange,
  validation,
  showValidation = false,
  tooltip,
}: CompanyInfoFieldProps) {
  // Get validation status for field styling
  const getFieldValidationClass = () => {
    if (!showValidation || !validation) return '';
    
    switch (validation.validationStatus) {
      case 'error':
      case 'critical': return 'border-red-500 focus:border-red-500';
      case 'warning': return 'border-yellow-500 focus:border-yellow-500';
      case 'valid': return 'border-green-500 focus:border-green-500';
      default: return '';
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <Label htmlFor={id}>{label}</Label>
          {tooltip && <div className="text-xs">{tooltip}</div>}
        </div>
        {showValidation && validation && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <span>{validation.contentStats.characterCount} chars</span>
            {validation.isValidating && <span className="text-blue-500">Validating...</span>}
          </div>
        )}
      </div>
      <Textarea
        id={id}
        value={value}
        disabled={disabled}
        placeholder={placeholder}
        rows={rows}
        onChange={(e) => onChange?.(e.target.value)}
        className={getFieldValidationClass()}
      />
      {showValidation && validation && validation.getValidationMessage() && (
        <div className={`text-xs ${
          validation.validationStatus === 'error' || validation.validationStatus === 'critical'
            ? 'text-red-600'
            : validation.validationStatus === 'warning'
            ? 'text-yellow-600'
            : 'text-green-600'
        }`}>
          {validation.getValidationMessage()}
        </div>
      )}
    </div>
  );
}
