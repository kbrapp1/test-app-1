/**
 * ContentTypeValidationService Domain Service
 * 
 * AI INSTRUCTIONS:
 * - Keep business logic pure, no external dependencies
 * - Maintain single responsibility for content type-specific validation
 * - Never exceed 250 lines - focused on type-specific rules only
 * - Follow @golden-rule patterns exactly
 * - Delegate to separate methods for each content type
 * - Focus on domain rules and business validation only
 */

import { ContentType } from '../../value-objects/content/ContentType';

export class ContentTypeValidationService {
  // AI: Apply content type-specific business validation rules for each supported type
  validateContentByType(
    content: string, 
    contentType: ContentType, 
    issues: string[], 
    warnings: string[]
  ): void {
    switch (contentType) {
      case ContentType.COMPANY_INFO:
        this.validateCompanyInfo(content, issues, warnings);
        break;
      case ContentType.COMPLIANCE_GUIDELINES:
        this.validateComplianceGuidelines(content, issues, warnings);
        break;
      case ContentType.PRODUCT_CATALOG:
        this.validateProductCatalog(content, issues, warnings);
        break;
      case ContentType.SUPPORT_DOCS:
        this.validateSupportDocs(content, issues, warnings);
        break;
      case ContentType.FAQ:
        this.validateFAQ(content, issues, warnings);
        break;
      default:
        this.validateCustomContent(content, issues, warnings);
    }
  }

  // AI: Validate company information contains brand consistency elements
  private validateCompanyInfo(content: string, issues: string[], warnings: string[]): void {
    const lowerContent = content.toLowerCase();
    
    if (!lowerContent.includes('ironmark')) {
      warnings.push('Company information should mention Ironmark to maintain brand consistency.');
    }
    
    if (lowerContent.length < 50) {
      warnings.push('Company information is quite brief. Consider adding more details about services or expertise.');
    }
  }

  // AI: Validate compliance guidelines define clear scope and restrictions
  private validateComplianceGuidelines(content: string, issues: string[], warnings: string[]): void {
    const lowerContent = content.toLowerCase();
    
    const complianceKeywords = ['scope', 'use', 'appropriate', 'not', 'support'];
    const hasKeywords = complianceKeywords.some(keyword => lowerContent.includes(keyword));
    
    if (!hasKeywords) {
      warnings.push('Compliance guidelines should clearly define scope and usage restrictions.');
    }
  }

  // AI: Validate product catalog contains sufficient service information
  private validateProductCatalog(content: string, issues: string[], warnings: string[]): void {
    if (content.length < 100) {
      warnings.push('Product catalog information is brief. Consider adding more service details.');
    }
  }

  // AI: Validate support documentation indicates helpful nature
  private validateSupportDocs(content: string, issues: string[], warnings: string[]): void {
    if (!content.toLowerCase().includes('help') && !content.toLowerCase().includes('support')) {
      warnings.push('Support documentation should clearly indicate its helpful nature.');
    }
  }

  // AI: Validate FAQ content contains actual questions
  private validateFAQ(content: string, issues: string[], warnings: string[]): void {
    const hasQuestionMarks = content.includes('?');
    if (!hasQuestionMarks) {
      warnings.push('FAQ content should contain questions (marked with ?).');
    }
  }

  // AI: Apply general validation rules for custom content types
  private validateCustomContent(content: string, issues: string[], warnings: string[]): void {
    if (content.length > 500) {
      warnings.push('Custom content is quite long. Consider if it\'s all necessary for the chatbot.');
    }
  }
} 