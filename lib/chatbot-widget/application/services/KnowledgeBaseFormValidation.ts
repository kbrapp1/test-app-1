/**
 * Knowledge Base Form Validation
 * 
 * AI INSTRUCTIONS:
 * - Validation logic extracted from KnowledgeBaseFormApplicationService
 * - Focus on form data validation and business rule compliance
 * - Keep validation functions pure and focused
 * - Follow @golden-rule patterns exactly
 * - Under 250 lines total
 */

import { 
  KnowledgeBaseFormDto,
  KnowledgeBaseFormValidationDto,
  FormValidationErrorDto,
  FormValidationWarningDto,
  FormValidationSuggestionDto
} from '../dto/KnowledgeBaseFormDto';
import { hasFormContent } from './KnowledgeBaseFormHelpers';

/**
 * Validation result interface for form validation
 * AI INSTRUCTIONS: Structured validation response format
 */
export interface FormValidationResult {
  isValid: boolean;
  errors: FormValidationErrorDto[];
  warnings: FormValidationWarningDto[];
  suggestions: FormValidationSuggestionDto[];
}

/**
 * Validate complete form data
 * AI INSTRUCTIONS: Main form validation entry point
 */
export function validateFormData(formData: KnowledgeBaseFormDto): KnowledgeBaseFormValidationDto {
  const errors: FormValidationErrorDto[] = [];
  const warnings: FormValidationWarningDto[] = [];

  // Check if at least some content is provided
  if (!hasFormContent(formData)) {
    errors.push({
      field: 'general',
      message: 'At least one knowledge base section must have content',
      code: 'NO_CONTENT',
      severity: 'high'
    });
  }

  // Validate FAQs
  const faqErrors = validateFaqs(formData.faqs);
  errors.push(...faqErrors);

  // Validate individual sections
  const sectionWarnings = validateSections(formData);
  warnings.push(...sectionWarnings);

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    suggestions: generateSuggestions(formData, errors, warnings)
  };
}

/**
 * Validate FAQ data
 * AI INSTRUCTIONS: FAQ-specific validation rules
 */
export function validateFaqs(faqs: any[]): FormValidationErrorDto[] {
  const errors: FormValidationErrorDto[] = [];

  faqs.forEach((faq, index) => {
    if (faq.question?.trim() && !faq.answer?.trim()) {
      errors.push({
        field: `faqs[${index}].answer`,
        message: 'FAQ answer is required when question is provided',
        code: 'FAQ_INCOMPLETE',
        severity: 'medium'
      });
    }

    if (!faq.question?.trim() && faq.answer?.trim()) {
      errors.push({
        field: `faqs[${index}].question`,
        message: 'FAQ question is required when answer is provided',
        code: 'FAQ_INCOMPLETE',
        severity: 'medium'
      });
    }

    // Validate FAQ content length
    if (faq.question?.trim() && faq.question.length > 500) {
      errors.push({
        field: `faqs[${index}].question`,
        message: 'FAQ question should be under 500 characters',
        code: 'FAQ_QUESTION_TOO_LONG',
        severity: 'low'
      });
    }

    if (faq.answer?.trim() && faq.answer.length > 2000) {
      errors.push({
        field: `faqs[${index}].answer`,
        message: 'FAQ answer should be under 2000 characters',
        code: 'FAQ_ANSWER_TOO_LONG',
        severity: 'low'
      });
    }
  });

  return errors;
}

/**
 * Validate individual form sections
 * AI INSTRUCTIONS: Section-specific validation and warnings
 */
export function validateSections(formData: KnowledgeBaseFormDto): FormValidationWarningDto[] {
  const warnings: FormValidationWarningDto[] = [];

  // Check for very short content
  if (formData.companyInfo?.trim() && formData.companyInfo.length < 50) {
    warnings.push({
      field: 'companyInfo',
      message: 'Company information is quite short. Consider adding more details for better AI responses.',
      code: 'SHORT_CONTENT',
      impact: 'quality'
    });
  }

  if (formData.productCatalog?.trim() && formData.productCatalog.length < 100) {
    warnings.push({
      field: 'productCatalog',
      message: 'Product catalog is quite short. More detailed descriptions help the AI provide better recommendations.',
      code: 'SHORT_CONTENT',
      impact: 'quality'
    });
  }

  // Check for very long content that might need chunking
  if (formData.productCatalog?.length > 10000) {
    warnings.push({
      field: 'productCatalog',
      message: 'Product catalog is very long. Consider breaking it into smaller, focused sections.',
      code: 'LONG_CONTENT',
      impact: 'performance'
    });
  }

  // Check FAQ distribution
  const activeFaqs = formData.faqs.filter(faq => faq.question?.trim() && faq.answer?.trim());
  if (activeFaqs.length > 50) {
    warnings.push({
      field: 'faqs',
      message: 'You have many FAQs. Consider grouping them by category for better organization.',
      code: 'MANY_FAQS',
      impact: 'usability'
    });
  }

  return warnings;
}

/**
 * Generate suggestions based on validation results
 * AI INSTRUCTIONS: Helpful suggestions for form improvement
 */
export function generateSuggestions(
  formData: KnowledgeBaseFormDto,
  errors: FormValidationErrorDto[],
  warnings: FormValidationWarningDto[]
): FormValidationSuggestionDto[] {
  const suggestions: FormValidationSuggestionDto[] = [];

  // Content suggestions
  if (!formData.companyInfo?.trim()) {
    suggestions.push({
      field: 'companyInfo',
      message: 'Add company information to help the AI understand your business context',
      action: 'add_company_info',
      benefit: 'Better contextual AI responses'
    });
  }

  if (!formData.productCatalog?.trim()) {
    suggestions.push({
      field: 'productCatalog',
      message: 'Include your product/service catalog to enable better recommendations',
      action: 'add_product_catalog',
      benefit: 'More accurate product recommendations'
    });
  }

  if (formData.faqs.length === 0) {
    suggestions.push({
      field: 'faqs',
      message: 'Add frequently asked questions to improve customer support responses',
      action: 'add_faqs',
      benefit: 'Enhanced customer support automation'
    });
  }

  // Quality suggestions
  if (errors.length === 0 && warnings.length === 0) {
    suggestions.push({
      field: 'general',
      message: 'Your knowledge base looks good! Consider adding more detailed examples and use cases.',
      action: 'enhance_content',
      benefit: 'Even better AI responses'
    });
  }

  return suggestions;
}

/**
 * Validate update request data
 * AI INSTRUCTIONS: Update request validation
 */
export function validateUpdateRequest(request: any): FormValidationErrorDto[] {
  const errors: FormValidationErrorDto[] = [];

  if (!request.configId?.trim()) {
    errors.push({
      field: 'configId',
      message: 'Configuration ID is required',
      code: 'MISSING_CONFIG_ID',
      severity: 'high'
    });
  }

  if (!request.organizationId?.trim()) {
    errors.push({
      field: 'organizationId',
      message: 'Organization ID is required',
      code: 'MISSING_ORG_ID',
      severity: 'high'
    });
  }

  if (!request.formData) {
    errors.push({
      field: 'formData',
      message: 'Form data is required',
      code: 'MISSING_FORM_DATA',
      severity: 'high'
    });
  }

  return errors;
}