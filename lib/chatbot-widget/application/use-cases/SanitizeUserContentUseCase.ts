/**
 * SanitizeUserContentUseCase Application Use Case
 * 
 * AI INSTRUCTIONS:
 * - Orchestrate domain services without containing business logic
 * - Handle workflow coordination only, delegate all business logic
 * - Single use case focus - user content sanitization workflow
 * - Follow @golden-rule application layer patterns exactly
 * - Never exceed 250 lines - refactor into smaller use cases if needed
 * - Publish domain events for cross-aggregate coordination
 * - Use composition root for dependency injection
 * - Handle domain errors appropriately without wrapping
 */

import { UserContentSanitizationService } from '../../domain/services/content-processing/UserContentSanitizationService';
import { ContentValidationService } from '../../domain/services/content-processing/ContentValidationService';
import { ContentType } from '../../domain/value-objects/content/ContentType';
import { SanitizedContent } from '../../domain/value-objects/content/SanitizedContent';
import { ContentValidationResult } from '../../domain/value-objects/content/ContentValidationResult';
import { ContentSanitizationError } from '../../domain/errors/ContentSanitizationError';
import { ContentValidationError } from '../../domain/errors/ContentValidationError';

export class SanitizeUserContentUseCase {
  constructor(
    private readonly sanitizationService: UserContentSanitizationService,
    private readonly validationService: ContentValidationService
  ) {}

  // AI: Orchestrate user content sanitization workflow, validate then sanitize
  async execute(
    content: string,
    contentType: ContentType
  ): Promise<{
    sanitizedContent: SanitizedContent;
    validationResult: ContentValidationResult;
    requiresReview: boolean;
  }> {
    try {
      // AI: Validate content first to identify issues before sanitization
      const validationResult = this.validationService.validateContent(content, contentType);
      
      // AI: Sanitize content using domain service, regardless of validation status
      const sanitizedContent = this.sanitizationService.sanitizeContent(content, contentType);
      
      // AI: Determine if manual review is required based on validation results
      const requiresReview = this.determineReviewRequirement(validationResult, sanitizedContent);
      
      return {
        sanitizedContent,
        validationResult,
        requiresReview
      };
    } catch (error) {
      // AI: Let domain errors bubble up, don't wrap them in application layer
      if (error instanceof ContentSanitizationError || error instanceof ContentValidationError) {
        throw error;
      }
      
      // AI: Only wrap unexpected errors that aren't domain-specific
      throw new ContentSanitizationError(
        'Unexpected error during content sanitization workflow',
        { originalError: error, contentType, contentLength: content.length }
      );
    }
  }

  // AI: Validate content only without sanitization for preview purposes
  async validateOnly(
    content: string,
    contentType: ContentType
  ): Promise<ContentValidationResult> {
    try {
      return this.validationService.validateContent(content, contentType);
    } catch (error) {
      if (error instanceof ContentValidationError) {
        throw error;
      }
      
      throw new ContentValidationError(
        'Unexpected error during content validation',
        { originalError: error, contentType, contentLength: content.length }
      );
    }
  }

  // AI: Sanitize content only without validation for trusted sources
  async sanitizeOnly(
    content: string,
    contentType: ContentType
  ): Promise<SanitizedContent> {
    try {
      return this.sanitizationService.sanitizeContent(content, contentType);
    } catch (error) {
      if (error instanceof ContentSanitizationError) {
        throw error;
      }
      
      throw new ContentSanitizationError(
        'Unexpected error during content sanitization',
        { originalError: error, contentType, contentLength: content.length }
      );
    }
  }

  // AI: Business logic for determining manual review requirement based on validation results
  private determineReviewRequirement(
    validationResult: ContentValidationResult,
    sanitizedContent: SanitizedContent
  ): boolean {
    // AI: Require review if there are critical validation issues
    if (!validationResult.isValid) {
      return true;
    }
    
    // AI: Require review if significant content changes were made during sanitization
    const originalLength = sanitizedContent.originalLength;
    const sanitizedLength = sanitizedContent.content.length;
    const reductionPercentage = ((originalLength - sanitizedLength) / originalLength) * 100;
    
    if (reductionPercentage > 30) {
      return true;
    }
    
    // AI: Require review if there are warnings that might affect content meaning
    const criticalWarnings = validationResult.warnings.filter(warning =>
      warning.includes('meaning') || 
      warning.includes('context') || 
      warning.includes('important')
    );
    
    return criticalWarnings.length > 0;
  }
} 