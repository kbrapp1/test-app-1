/**
 * Content Categorization Validation Service
 * 
 * AI INSTRUCTIONS:
 * - Pure domain service for categorization-specific validation
 * - No external dependencies
 * - Focus on validation needed for content categorization
 * - Use domain-specific error handling
 */

import { ContentCategorizationError } from '../errors/ChatbotWidgetDomainErrors';

/**
 * Content Categorization Validation Service
 * 
 * Handles business rules for validating content before categorization
 */
export class ContentCategorizationValidationService {
  
  /** Validate categorization input according to domain rules */
  public static validateCategorizationInput(content: string, title: string): void {
    if (!content || typeof content !== 'string') {
      throw new ContentCategorizationError(
        'Content is required for categorization',
        { contentType: typeof content }
      );
    }

    if (!title || typeof title !== 'string') {
      throw new ContentCategorizationError(
        'Title is required for categorization',
        { titleType: typeof title }
      );
    }

    if (content.trim().length === 0) {
      throw new ContentCategorizationError(
        'Content cannot be empty',
        { contentLength: content.length }
      );
    }
  }

  /** Truncate content for AI processing according to domain limits */
  public static truncateContentForAi(content: string): string {
    const maxLength = 2000; // Domain rule: Limit AI input length
    
    if (content.length <= maxLength) {
      return content;
    }
    
    // Domain rule: Keep beginning and end of content for context
    const halfLength = Math.floor(maxLength / 2);
    return content.substring(0, halfLength) + 
           '\n...\n' + 
           content.substring(content.length - halfLength);
  }
}