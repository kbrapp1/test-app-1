/**
 * Company Form Header Component
 * 
 * AI INSTRUCTIONS:
 * - Header component for company information form with status badge and controls
 * - Manages guidelines visibility and edit mode toggle functionality
 * - Displays configuration status and validation indicators
 * - Follows @golden-rule patterns with single responsibility and clean component composition
 */

import { Button } from '@/components/ui/button';
import { CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Book, HelpCircle, CheckCircle, AlertTriangle, AlertCircle } from 'lucide-react';
import { useMultiContentValidation } from '../../../hooks/useContentValidation';
// import { ValidationStatusDisplay } from './ValidationStatusDisplay';

interface CompanyFormHeaderProps {
  isEditing: boolean;
  hasCompanyInfo: boolean;
  validation: ReturnType<typeof useMultiContentValidation>;
  showGuidelines: boolean;
  onToggleEdit: () => void;
  onToggleGuidelines: () => void;
}

export function CompanyFormHeader({
  isEditing,
  hasCompanyInfo,
  validation,
  showGuidelines: _showGuidelines,
  onToggleEdit,
  onToggleGuidelines,
}: CompanyFormHeaderProps) {
  return (
    <CardHeader>
      <div className="flex items-center gap-2">
        <Book className="h-5 w-5" />
        <CardTitle>Company Information</CardTitle>
        {isEditing && (() => {
          switch (validation.overallStatus) {
            case 'valid': return <CheckCircle className="h-4 w-4 text-green-500" />;
            case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
            case 'error':
            case 'critical': return <AlertCircle className="h-4 w-4 text-red-500" />;
            default: return null;
          }
        })()}
      </div>
      <CardDescription>
        Basic information about your company that the chatbot can reference.
        {isEditing && validation.isAnyValidating && (
          <span className="text-muted-foreground ml-2">Validating content...</span>
        )}
      </CardDescription>
      
      <div className="flex items-center justify-between">
        <Badge variant={hasCompanyInfo ? 'default' : 'secondary'}>
          {hasCompanyInfo ? 'Configured' : 'Not Configured'}
        </Badge>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleGuidelines}
            className="text-blue-600 hover:text-blue-700"
          >
            <HelpCircle className="h-4 w-4 mr-1" />
            Guidelines
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onToggleEdit}
          >
            {isEditing ? 'Cancel' : 'Edit'}
          </Button>
        </div>
      </div>
    </CardHeader>
  );
}
