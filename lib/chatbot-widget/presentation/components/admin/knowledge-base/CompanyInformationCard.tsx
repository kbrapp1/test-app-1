/**
 * Company Information Card Component
 * 
 * AI INSTRUCTIONS:
 * - Main container for company information form with validation orchestration
 * - Coordinates between form fields, validation, and user interactions
 * - Manages form state and content guidelines visibility
 * - Follows @golden-rule patterns with single responsibility and clean component composition
 */

import { Card, CardContent } from '@/components/ui/card';
import { useState } from 'react';
import { KnowledgeBaseFormData } from '../../../hooks/useKnowledgeBaseSettings';
import { useMultiContentValidation } from '../../../hooks/useContentValidation';
import { ContentType } from '../../../../domain/value-objects/content/ContentType';
import { ContentGuidelines, ContentTypeTooltip } from './ContentGuidelines';
import { CompanyFormHeader } from './CompanyFormHeader';
import { CompanyInfoField } from './CompanyInfoField';
import { ValidationStatusDisplay } from './ValidationStatusDisplay';

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

  return (
    <Card>
      <CompanyFormHeader
        isEditing={isEditing}
        hasCompanyInfo={hasCompanyInfo}
        validation={validation}
        showGuidelines={showGuidelines}
        onToggleEdit={onToggleEdit}
        onToggleGuidelines={() => setShowGuidelines(!showGuidelines)}
      />
      <CardContent className="space-y-4">

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
        <ValidationStatusDisplay validation={validation} isEditing={isEditing} />
      </CardContent>
    </Card>
  );
}

 