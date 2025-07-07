/**
 * ContentProcessingService Infrastructure Service
 * 
 * AI INSTRUCTIONS:
 * - Handle content sanitization and validation at infrastructure boundary
 * - Coordinate between domain services for content processing
 * - Follow @golden-rule infrastructure layer patterns exactly
 * - Keep under 250 lines - focus on content processing coordination only
 * - Maintain separation between infrastructure and domain concerns
 * - Handle processing errors with proper domain error propagation
 */

import { SanitizedContent } from '../../../../domain/value-objects/content/SanitizedContent';
import { ContentType } from '../../../../domain/value-objects/content/ContentType';
import { UserContentSanitizationService } from '../../../../domain/services/content-processing/UserContentSanitizationService';
import { ContentValidationService } from '../../../../domain/services/content-processing/ContentValidationService';
import { ContentSanitizationError } from '../../../../domain/errors/ContentSanitizationError';
import { ContentValidationError } from '../../../../domain/errors/ContentValidationError';

export class ContentProcessingService {
  private readonly contentSanitizer: UserContentSanitizationService;
  private readonly contentValidator: ContentValidationService;

  constructor(
    contentSanitizer?: UserContentSanitizationService,
    contentValidator?: ContentValidationService
  ) {
    this.contentSanitizer = contentSanitizer ?? new UserContentSanitizationService();
    this.contentValidator = contentValidator ?? new ContentValidationService();
  }

  // AI: Sanitize single content item with validation
  async sanitizeContent(content: string | null, contentType: ContentType): Promise<SanitizedContent | null> {
    if (!content || content.trim() === '') {
      return null;
    }

    try {
      // AI: Validate content first
      const validationResult = this.contentValidator.validateContent(content, contentType);
      if (!validationResult.isValid) {
        // AI: Log validation issues but continue with sanitization
        console.warn(`Validation issues for ${contentType}:`, validationResult.validationIssues);
      }

      // AI: Sanitize content regardless of validation status
      return this.contentSanitizer.sanitizeContent(content, contentType);
    } catch (error) {
      if (error instanceof ContentValidationError || error instanceof ContentSanitizationError) {
        throw error;
      }
      throw new ContentSanitizationError(
        `Failed to process ${contentType} content`,
        { contentType, originalError: error }
      );
    }
  }

  // AI: Sanitize FAQ content with batch processing
  async sanitizeFaqs(faqs: readonly { question: string; answer: string; }[]): Promise<readonly SanitizedContent[]> {
    if (!faqs || faqs.length === 0) {
      return [];
    }

    const sanitizedFaqs: SanitizedContent[] = [];

    for (const faq of faqs) {
      try {
        const combinedContent = `Q: ${faq.question}\nA: ${faq.answer}`;
        const sanitized = await this.sanitizeContent(combinedContent, ContentType.FAQ);
        
        if (sanitized) {
          sanitizedFaqs.push(sanitized);
        }
      } catch (error) {
        // AI: Log error but continue processing other FAQs
        console.warn('Failed to sanitize FAQ:', { question: faq.question, error });
      }
    }

    return Object.freeze(sanitizedFaqs);
  }

  // AI: Validate content without full processing for preview
  async validateContent(content: string, contentType: ContentType): Promise<{ 
    isValid: boolean; 
    issues: string[]; 
    warnings: string[] 
  }> {
    try {
      const result = this.contentValidator.validateContent(content, contentType);
      return {
        isValid: result.isValid,
        issues: [...result.validationIssues],
        warnings: [...result.warnings]
      };
    } catch (error) {
      if (error instanceof ContentValidationError) {
        throw error;
      }
      throw new ContentValidationError('Failed to validate content', { contentType, originalError: error });
    }
  }

  // AI: Count validation errors across content types
  async countValidationErrors(contentItems: Array<{ content: string; type: ContentType }>): Promise<number> {
    let validationErrorCount = 0;

    for (const { content, type } of contentItems) {
      if (content) {
        try {
          const result = this.contentValidator.validateContent(content, type);
          if (!result.isValid) {
            validationErrorCount += result.validationIssues.length;
          }
        } catch (error) {
          validationErrorCount++;
        }
      }
    }

    return validationErrorCount;
  }

  // AI: Process content based on type with proper mapping
  getContentByType(rawContent: {
    companyInfo: string | null;
    complianceGuidelines: string | null;
    productCatalog: string | null;
    supportDocs: string | null;
    faqs: readonly { question: string; answer: string; }[];
  }, contentType: ContentType): string | null {
    switch (contentType) {
      case ContentType.COMPANY_INFO:
        return rawContent.companyInfo;
      case ContentType.COMPLIANCE_GUIDELINES:
        return rawContent.complianceGuidelines;
      case ContentType.PRODUCT_CATALOG:
        return rawContent.productCatalog;
      case ContentType.SUPPORT_DOCS:
        return rawContent.supportDocs;
      case ContentType.FAQ:
        // AI: For FAQ type, combine all FAQs into single content
        if (rawContent.faqs.length > 0) {
          return rawContent.faqs.map(faq => `Q: ${faq.question}\nA: ${faq.answer}`).join('\n\n');
        }
        return null;
      default:
        throw new ContentValidationError('Unsupported content type for processing', { contentType });
    }
  }
} 