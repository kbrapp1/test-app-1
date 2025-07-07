/**
 * ValidateContentUseCase Application Use Case
 * 
 * AI INSTRUCTIONS:
 * - Orchestrate domain services without containing business logic
 * - Handle workflow coordination only, delegate all business logic
 * - Single use case focus - content validation workflow
 * - Follow @golden-rule application layer patterns exactly
 * - Never exceed 250 lines - refactor into smaller use cases if needed
 * - Use composition root for dependency injection
 * - Handle domain errors appropriately without wrapping
 */

import { ContentValidationService } from '../../domain/services/content-processing/ContentValidationService';
import { ContentLengthValidationService } from '../../domain/services/content-processing/ContentLengthValidationService';
import { ContentTypeValidationService } from '../../domain/services/content-processing/ContentTypeValidationService';
import { ContentType } from '../../domain/value-objects/content/ContentType';
import { ContentValidationResult } from '../../domain/value-objects/content/ContentValidationResult';
import { ValidationSummary } from '../../domain/value-objects/content/ValidationSummary';
import { ContentValidationError } from '../../domain/errors/ContentValidationError';

export class ValidateContentUseCase {
  constructor(
    private readonly validationService: ContentValidationService,
    private readonly lengthValidationService: ContentLengthValidationService,
    private readonly typeValidationService: ContentTypeValidationService
  ) {}

  // AI: Orchestrate comprehensive content validation workflow
  async execute(
    content: string,
    contentType: ContentType
  ): Promise<ContentValidationResult> {
    try {
      // AI: Delegate to domain service for complete validation
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

  // AI: Validate only content length for quick feedback
  async validateLength(
    content: string,
    contentType: ContentType
  ): Promise<{ isValid: boolean; issues: string[]; warnings: string[] }> {
    try {
      const issues: string[] = [];
      const warnings: string[] = [];
      
      this.lengthValidationService.validateLength(content, contentType, issues, warnings);
      
      return {
        isValid: issues.length === 0,
        issues,
        warnings
      };
    } catch (error) {
      if (error instanceof ContentValidationError) {
        throw error;
      }
      
      throw new ContentValidationError(
        'Unexpected error during length validation',
        { originalError: error, contentType, contentLength: content.length }
      );
    }
  }

  // AI: Validate content type-specific business rules
  async validateByType(
    content: string,
    contentType: ContentType
  ): Promise<{ isValid: boolean; issues: string[]; warnings: string[] }> {
    try {
      const issues: string[] = [];
      const warnings: string[] = [];
      
      this.typeValidationService.validateContentByType(content, contentType, issues, warnings);
      
      return {
        isValid: issues.length === 0,
        issues,
        warnings
      };
    } catch (error) {
      if (error instanceof ContentValidationError) {
        throw error;
      }
      
      throw new ContentValidationError(
        'Unexpected error during type-specific validation',
        { originalError: error, contentType, contentLength: content.length }
      );
    }
  }

  // AI: Get validation summary for monitoring and analytics
  async getValidationSummary(
    content: string,
    contentType: ContentType
  ): Promise<ValidationSummary> {
    try {
      const validationResult = await this.execute(content, contentType);
      return validationResult.getSummary();
    } catch (error) {
      if (error instanceof ContentValidationError) {
        throw error;
      }
      
      throw new ContentValidationError(
        'Unexpected error during validation summary generation',
        { originalError: error, contentType, contentLength: content.length }
      );
    }
  }

  // AI: Batch validate multiple content items for efficiency
  async validateBatch(
    contentItems: Array<{ content: string; contentType: ContentType; id?: string }>
  ): Promise<Array<{ id?: string; result: ContentValidationResult; hasErrors: boolean }>> {
    const results: Array<{ id?: string; result: ContentValidationResult; hasErrors: boolean }> = [];
    
    for (const item of contentItems) {
      try {
        const result = await this.execute(item.content, item.contentType);
        results.push({
          id: item.id,
          result,
          hasErrors: !result.isValid
        });
      } catch (error) {
        // AI: For batch operations, capture individual failures without stopping the batch
        const errorResult = new ContentValidationResult(
          false,
          [error instanceof Error ? error.message : 'Unknown validation error'],
          [],
          item.contentType,
          item.content ? item.content.length : 0
        );
        
        results.push({
          id: item.id,
          result: errorResult,
          hasErrors: true
        });
      }
    }
    
    return results;
  }
} 