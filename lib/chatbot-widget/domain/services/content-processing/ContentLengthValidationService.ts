/**
 * ContentLengthValidationService Domain Service
 * 
 * AI INSTRUCTIONS:
 * - Keep business logic pure, no external dependencies
 * - Maintain single responsibility for content length validation
 * - Never exceed 250 lines - focused on length rules only
 * - Follow @golden-rule patterns exactly
 * - Define business rules for content length limits
 * - Focus on domain rules and calculations only
 */

import { ContentType } from '../../value-objects/content/ContentType';

export class ContentLengthValidationService {
  // AI: Check content length against type-specific limits, provide helpful feedback
  // Distinguish between hard limits and recommendations for prompt efficiency
  validateLength(
    content: string, 
    contentType: ContentType, 
    issues: string[], 
    warnings: string[]
  ): void {
    const limits = this.getContentLengthLimits();
    const recommendedLimits = this.getRecommendedLengthLimits();
    
    const maxLength = limits[contentType];
    const recommendedLength = recommendedLimits[contentType];
    
    if (content.length > maxLength) {
      issues.push(
        `Content exceeds maximum length of ${maxLength} characters (current: ${content.length})`
      );
    } else if (content.length > recommendedLength) {
      warnings.push(
        `Content is longer than recommended ${recommendedLength} characters. Consider shortening for better prompt efficiency.`
      );
    }
    
    if (content.length < 10) {
      warnings.push('Content is very short. Consider adding more descriptive information.');
    }
  }

  // AI: Define business rules for maximum content length by type
  getContentLengthLimits(): Record<ContentType, number> {
    return {
      [ContentType.COMPANY_INFO]: 500,
      [ContentType.COMPLIANCE_GUIDELINES]: 3000,
      [ContentType.PRODUCT_CATALOG]: 3000,
      [ContentType.SUPPORT_DOCS]: 3000,
      [ContentType.FAQ]: 3000,
      [ContentType.CUSTOM]: 3000
    };
  }

  // AI: Define recommended length limits for optimal prompt efficiency
  getRecommendedLengthLimits(): Record<ContentType, number> {
    return {
      [ContentType.COMPANY_INFO]: 500,
      [ContentType.COMPLIANCE_GUIDELINES]: 3000,
      [ContentType.PRODUCT_CATALOG]: 3000,
      [ContentType.SUPPORT_DOCS]: 3000,
      [ContentType.FAQ]: 3000,
      [ContentType.CUSTOM]: 3000
    };
  }
} 