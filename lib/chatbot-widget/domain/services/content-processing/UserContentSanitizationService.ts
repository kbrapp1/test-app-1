/**
 * UserContentSanitizationService Domain Service
 * 
 * AI INSTRUCTIONS:
 * - Keep business logic pure, no external dependencies
 * - Maintain single responsibility principle for content sanitization
 * - Never exceed 250 lines - refactor into smaller services if needed
 * - Follow @golden-rule patterns exactly
 * - Always validate inputs using value objects
 * - Handle domain errors with specific error types
 * - Delegate complex operations to separate methods
 * - Focus on domain rules and calculations only
 */

import { ContentSanitizationError } from '../../errors/ContentSanitizationError';
import { ContentType } from '../../value-objects/content/ContentType';
import { SanitizedContent } from '../../value-objects/content/SanitizedContent';

export class UserContentSanitizationService {
  // AI: Apply content type-specific sanitization rules, remove markdown headers, enforce length limits
  sanitizeContent(rawContent: string, contentType: ContentType): SanitizedContent {
    this.validateInput(rawContent, contentType);
    
    try {
      // Apply sanitization pipeline
      let sanitized = this.removeMarkdownHeaders(rawContent);
      sanitized = this.normalizeWhitespace(sanitized);
      sanitized = this.applyLengthLimits(sanitized, contentType);
      sanitized = this.removeProblematicContent(sanitized);
      
      return new SanitizedContent(sanitized, contentType, rawContent);
    } catch (error) {
      throw new ContentSanitizationError(
        `Failed to sanitize ${contentType} content`,
        { 
          contentType, 
          originalLength: rawContent.length,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      );
    }
  }

  // AI: Remove markdown headers that break prompt hierarchy, preserve content meaning
  private removeMarkdownHeaders(content: string): string {
    // Remove markdown headers (##, ###, ####, etc.)
    return content
      .replace(/^#{1,6}\s+/gm, '') // Remove header markers at line start
      .replace(/\n#{1,6}\s+/g, '\n') // Remove header markers after newlines
      .trim();
  }

  // AI: Remove excessive newlines, normalize spacing, preserve paragraph breaks
  private normalizeWhitespace(content: string): string {
    return content
      .replace(/\r\n/g, '\n') // Normalize line endings
      .replace(/\n{3,}/g, '\n\n') // Limit consecutive newlines to 2
      .replace(/[ \t]+/g, ' ') // Normalize spaces and tabs
      .replace(/^\s+|\s+$/g, '') // Trim leading/trailing whitespace
      .replace(/\n\s+/g, '\n') // Remove whitespace after newlines
      .trim();
  }

  // AI: Use business rules for length limits, truncate at word boundaries, preserve meaning
  private applyLengthLimits(content: string, contentType: ContentType): string {
    const limits = this.getContentLengthLimits();
    const maxLength = limits[contentType];
    
    if (content.length <= maxLength) {
      return content;
    }
    
    // Truncate at word boundary
    const truncated = content.substring(0, maxLength);
    const lastSpaceIndex = truncated.lastIndexOf(' ');
    
    if (lastSpaceIndex > maxLength * 0.8) {
      // Truncate at last word if we're close to the limit
      return truncated.substring(0, lastSpaceIndex) + '...';
    }
    
    // Otherwise truncate at character limit
    return truncated + '...';
  }

  // AI: Remove AI instructions and system prompts, preserve legitimate business content
  private removeProblematicContent(content: string): string {
    // Remove potential AI instruction patterns
    const problematicPatterns = [
      /AI INSTRUCTIONS?:.*$/gim,
      /\*\*AI:.*?\*\*/gi,
      /\[AI:.*?\]/gi,
      /System:.*$/gim,
      /Assistant:.*$/gim
    ];
    
    let cleaned = content;
    for (const pattern of problematicPatterns) {
      cleaned = cleaned.replace(pattern, '');
    }
    
    return this.normalizeWhitespace(cleaned);
  }

  // AI: Define limits based on prompt token efficiency and content importance
  private getContentLengthLimits(): Record<ContentType, number> {
    return {
      [ContentType.COMPANY_INFO]: 200,
      [ContentType.COMPLIANCE_GUIDELINES]: 300,
      [ContentType.PRODUCT_CATALOG]: 250,
      [ContentType.SUPPORT_DOCS]: 200,
      [ContentType.FAQ]: 150,
      [ContentType.CUSTOM]: 200
    };
  }

  // AI: Validate all inputs before processing, use specific domain errors
  private validateInput(content: string, contentType: ContentType): void {
    if (!content || typeof content !== 'string') {
      throw new ContentSanitizationError(
        'Content must be a non-empty string',
        { contentType, providedContent: content }
      );
    }
    
    if (!Object.values(ContentType).includes(contentType)) {
      throw new ContentSanitizationError(
        'Invalid content type provided',
        { contentType, validTypes: Object.values(ContentType) }
      );
    }
    
    if (content.length > 10000) {
      throw new ContentSanitizationError(
        'Content exceeds maximum allowed length',
        { contentType, length: content.length, maxLength: 10000 }
      );
    }
  }

  // AI: Detect content that needs processing, identify headers/whitespace issues, check length violations
  requiresSanitization(content: string, contentType: ContentType): boolean {
    if (!content || typeof content !== 'string') {
      return false;
    }
    
    const limits = this.getContentLengthLimits();
    const hasMarkdownHeaders = /^#{1,6}\s+/m.test(content);
    const hasExcessiveWhitespace = /\n{3,}/.test(content) || /[ \t]{2,}/.test(content);
    const exceedsLength = content.length > limits[contentType];
    const hasProblematicContent = /AI INSTRUCTIONS?:|System:|Assistant:/i.test(content);
    
    return hasMarkdownHeaders || hasExcessiveWhitespace || exceedsLength || hasProblematicContent;
  }
} 