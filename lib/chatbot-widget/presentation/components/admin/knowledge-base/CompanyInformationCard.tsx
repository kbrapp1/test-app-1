/**
 * Company Information Card Component
 * 
 * AI INSTRUCTIONS:
 * - React component for company information form section with validation and editing capabilities
 * - Manages controlled form state for company details, product catalog, support docs, and compliance
 * - Implements real-time content validation with visual feedback and character count tracking
 * - Provides collapsible content guidelines and field-specific tooltips for user guidance
 * - Follows @golden-rule patterns with single responsibility and clean component composition
 */

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Book, AlertCircle, CheckCircle, AlertTriangle, HelpCircle } from 'lucide-react';
import { useState } from 'react';
import { KnowledgeBaseFormData } from '../../../hooks/useKnowledgeBaseSettings';
import { useMultiContentValidation } from '../../../hooks/useContentValidation';
import { ContentType } from '../../../../domain/value-objects/content/ContentType';
import { ContentGuidelines, ContentTypeTooltip } from './ContentGuidelines';

interface CompanyInformationCardProps {
  formData: KnowledgeBaseFormData;
  isEditing: boolean;
  onToggleEdit: () => void;
  onUpdateFormData?: (updates: Partial<KnowledgeBaseFormData>) => void;
}

export function CompanyInformationCard({
  formData,
  isEditing,
  onToggleEdit,
  onUpdateFormData,
}: CompanyInformationCardProps) {
  const [showGuidelines, setShowGuidelines] = useState(false);

  // Multi-field content validation for real-time feedback
  const validation = useMultiContentValidation({
    companyInfo: {
      content: formData.companyInfo,
      type: ContentType.COMPANY_INFO,
      maxLength: 2000
    },
    productCatalog: {
      content: formData.productCatalog,
      type: ContentType.PRODUCT_CATALOG,
      maxLength: 3000
    },
    supportDocs: {
      content: formData.supportDocs,
      type: ContentType.SUPPORT_DOCS,
      maxLength: 2500
    },
    complianceGuidelines: {
      content: formData.complianceGuidelines,
      type: ContentType.COMPLIANCE_GUIDELINES,
      maxLength: 1500
    }
  });

  const hasCompanyInfo = Boolean(
    formData.companyInfo || 
    formData.productCatalog ||
    formData.supportDocs || 
    formData.complianceGuidelines
  );

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

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Book className="h-5 w-5" />
          <CardTitle>Company Information</CardTitle>
          {isEditing && getValidationIcon()}
        </div>
        <CardDescription>
          Basic information about your company that the chatbot can reference.
          {isEditing && validation.isAnyValidating && (
            <span className="text-muted-foreground ml-2">Validating content...</span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <Badge variant={hasCompanyInfo ? 'default' : 'secondary'}>
            {hasCompanyInfo ? 'Configured' : 'Not Configured'}
          </Badge>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowGuidelines(!showGuidelines)}
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

        {/* Content Guidelines */}
        {showGuidelines && (
          <ContentGuidelines 
            contentType={ContentType.COMPANY_INFO}
            isVisible={showGuidelines}
            onClose={() => setShowGuidelines(false)}
          />
        )}

        <div className="space-y-4">
          <CompanyInfoField
            id="company-info"
            label="Company Information"
            value={formData.companyInfo}
            placeholder="Describe your company, what you do, your mission, etc."
            disabled={!isEditing}
            rows={4}
            onChange={(value) => onUpdateFormData?.({ companyInfo: value })}
            validation={validation.validations.companyInfo}
            showValidation={isEditing}
            tooltip={<ContentTypeTooltip contentType={ContentType.COMPANY_INFO} />}
          />

          <CompanyInfoField
            id="product-catalog"
            label="Product/Service Catalog"
            value={formData.productCatalog}
            placeholder="List your products or services with descriptions"
            disabled={!isEditing}
            rows={4}
            onChange={(value) => onUpdateFormData?.({ productCatalog: value })}
            validation={validation.validations.productCatalog}
            showValidation={isEditing}
            tooltip={<ContentTypeTooltip contentType={ContentType.PRODUCT_CATALOG} />}
          />

          <CompanyInfoField
            id="support-docs"
            label="Support Documentation"
            value={formData.supportDocs}
            placeholder="Common support procedures, troubleshooting guides, etc."
            disabled={!isEditing}
            rows={3}
            onChange={(value) => onUpdateFormData?.({ supportDocs: value })}
            validation={validation.validations.supportDocs}
            showValidation={isEditing}
            tooltip={<ContentTypeTooltip contentType={ContentType.SUPPORT_DOCS} />}
          />

          <CompanyInfoField
            id="compliance"
            label="Compliance Guidelines"
            value={formData.complianceGuidelines}
            placeholder="Any compliance or legal guidelines the bot should follow"
            disabled={!isEditing}
            rows={3}
            onChange={(value) => onUpdateFormData?.({ complianceGuidelines: value })}
            validation={validation.validations.complianceGuidelines}
            showValidation={isEditing}
            tooltip={<ContentTypeTooltip contentType={ContentType.COMPLIANCE_GUIDELINES} />}
          />
        </div>

        {/* Show validation feedback when editing */}
        {isEditing && (validation.getAllErrors().length > 0 || validation.getAllWarnings().length > 0) && (
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
      </CardContent>
    </Card>
  );
}

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

function CompanyInfoField({
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