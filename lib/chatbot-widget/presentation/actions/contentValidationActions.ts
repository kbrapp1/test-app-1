'use server';

/**
 * Content Validation Server Actions
 * 
 * AI INSTRUCTIONS:
 * - Handle user requests and delegate to application services
 * - No business logic - pure coordination and error handling
 * - Follow @golden-rule patterns exactly
 * - Export only async functions
 * - Use composition root for dependency injection
 * - Handle domain errors with proper translation
 */

import { ContentType } from '../../domain/value-objects/content/ContentType';
import { SanitizeUserContentUseCase } from '../../application/use-cases/SanitizeUserContentUseCase';
import { ValidateContentUseCase } from '../../application/use-cases/ValidateContentUseCase';
import { UseCaseCompositionService } from '../../infrastructure/composition/UseCaseCompositionService';
import { DomainError } from '../../../errors/base';
import { ContentValidationError } from '../../domain/errors/ContentValidationError';
import { ContentSanitizationError } from '../../domain/errors/ContentSanitizationError';

export interface ContentValidationRequest {
  content: string;
  contentType: ContentType;
  maxLength?: number;
}

export interface ContentValidationResponse {
  success: boolean;
  data?: {
    isValid: boolean;
    errors: Array<{
      field: string;
      message: string;
      code: string;
      severity: 'low' | 'medium' | 'high' | 'critical';
    }>;
    warnings: Array<{
      field: string;
      message: string;
      suggestion?: string;
    }>;
    suggestions: string[];
    sanitizedContent?: string;
    characterCount: number;
    wordCount: number;
  };
  error?: string;
}

export interface SanitizeContentRequest {
  content: string;
  contentType: ContentType;
  preserveStructure?: boolean;
}

export interface SanitizeContentResponse {
  success: boolean;
  data?: {
    sanitizedContent: string;
    originalLength: number;
    sanitizedLength: number;
    changesApplied: string[];
  };
  error?: string;
}

/**
 * Validate user content using domain services
 * AI: Delegate to application use case, handle domain errors
 */
export async function validateContent(request: ContentValidationRequest): Promise<NonNullable<ContentValidationResponse['data']>> {
  try {
    // AI: Get use case from composition root
    const validateContentUseCase = UseCaseCompositionService.getValidateContentUseCase();
    
    // AI: Execute validation use case
    const result = await validateContentUseCase.execute(
      request.content,
      request.contentType
    );

    // AI: Map domain result to presentation format
    return {
      isValid: result.isValid,
      errors: result.validationIssues.map(issue => ({
        field: 'content',
        message: issue,
        code: 'VALIDATION_ISSUE',
        severity: 'high' as const
      })),
      warnings: result.warnings.map(warning => ({
        field: 'content',
        message: warning,
        suggestion: undefined
      })),
      suggestions: [], // Domain service doesn't provide suggestions directly
      sanitizedContent: undefined, // Validation doesn't include sanitization
      characterCount: result.contentLength,
      wordCount: request.content.trim().split(/\s+/).length
    };
  } catch (error) {
    // AI: Handle domain errors with proper context
    if (error instanceof ContentValidationError) {
      return {
        isValid: false,
        errors: [{
          field: 'content',
          message: error.message,
          code: error.code,
          severity: 'high'
        }],
        warnings: [],
        suggestions: [],
        characterCount: request.content.length,
        wordCount: request.content.trim().split(/\s+/).length
      };
    }
    
    if (error instanceof ContentSanitizationError) {
      return {
        isValid: false,
        errors: [{
          field: 'content',
          message: error.message,
          code: error.code,
          severity: 'medium'
        }],
        warnings: [],
        suggestions: [],
        characterCount: request.content.length,
        wordCount: request.content.trim().split(/\s+/).length
      };
    }

    // AI: Handle unexpected errors without exposing details
    console.error('Unexpected error in validateContent:', error);
    throw new Error('Content validation failed');
  }
}

/**
 * Sanitize user content using domain services
 * AI: Delegate to application use case, handle domain errors
 */
export async function sanitizeContent(request: SanitizeContentRequest): Promise<SanitizeContentResponse> {
  try {
    // AI: Get use case from composition root
    const sanitizeContentUseCase = UseCaseCompositionService.getSanitizeUserContentUseCase();
    
    // AI: Execute sanitization use case
    const result = await sanitizeContentUseCase.execute(
      request.content,
      request.contentType
    );

    return {
      success: true,
      data: {
        sanitizedContent: result.sanitizedContent.content,
        originalLength: request.content.length,
        sanitizedLength: result.sanitizedContent.content.length,
        changesApplied: [] // TODO: Extract changes from comparison
      }
    };
  } catch (error) {
    // AI: Handle domain errors with proper translation
    if (error instanceof DomainError) {
      return {
        success: false,
        error: error.message
      };
    }

    // AI: Handle unexpected errors
    console.error('Unexpected error in sanitizeContent:', error);
    return {
      success: false,
      error: 'Content sanitization failed'
    };
  }
} 