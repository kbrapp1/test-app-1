/**
 * Company Information Card Component
 * 
 * AI INSTRUCTIONS:
 * - Single responsibility: Company information form section
 * - Handle form state for company details
 * - Keep under 200-250 lines
 * - Use controlled components pattern
 * - Follow @golden-rule patterns exactly
 */

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Book } from 'lucide-react';
import { KnowledgeBaseFormData } from '../../../hooks/useKnowledgeBaseSettings';

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
  const hasCompanyInfo = Boolean(
    formData.companyInfo || 
    formData.productCatalog || 
    formData.supportDocs || 
    formData.complianceGuidelines
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Book className="h-5 w-5" />
          <CardTitle>Company Information</CardTitle>
        </div>
        <CardDescription>
          Basic information about your company that the chatbot can reference.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <Badge variant={hasCompanyInfo ? 'default' : 'secondary'}>
            {hasCompanyInfo ? 'Configured' : 'Not Configured'}
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={onToggleEdit}
          >
            {isEditing ? 'Cancel' : 'Edit'}
          </Button>
        </div>

        <div className="space-y-4">
          <CompanyInfoField
            id="company-info"
            label="Company Information"
            value={formData.companyInfo}
            placeholder="Describe your company, what you do, your mission, etc."
            disabled={!isEditing}
            rows={4}
            onChange={(value) => onUpdateFormData?.({ companyInfo: value })}
          />

          <CompanyInfoField
            id="product-catalog"
            label="Product/Service Catalog"
            value={formData.productCatalog}
            placeholder="List your products or services with descriptions"
            disabled={!isEditing}
            rows={4}
            onChange={(value) => onUpdateFormData?.({ productCatalog: value })}
          />

          <CompanyInfoField
            id="support-docs"
            label="Support Documentation"
            value={formData.supportDocs}
            placeholder="Common support procedures, troubleshooting guides, etc."
            disabled={!isEditing}
            rows={3}
            onChange={(value) => onUpdateFormData?.({ supportDocs: value })}
          />

          <CompanyInfoField
            id="compliance"
            label="Compliance Guidelines"
            value={formData.complianceGuidelines}
            placeholder="Any compliance or legal guidelines the bot should follow"
            disabled={!isEditing}
            rows={3}
            onChange={(value) => onUpdateFormData?.({ complianceGuidelines: value })}
          />
        </div>
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
}

function CompanyInfoField({
  id,
  label,
  value,
  placeholder,
  disabled,
  rows,
  onChange,
}: CompanyInfoFieldProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Textarea
        id={id}
        value={value}
        disabled={disabled}
        placeholder={placeholder}
        rows={rows}
        onChange={(e) => onChange?.(e.target.value)}
      />
    </div>
  );
} 