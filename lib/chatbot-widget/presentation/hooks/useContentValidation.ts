/**
 * AI Instructions: Simplified content validation hook
 * - Coordinate validation helpers without business logic
 * - Use composition for validation concerns
 * - Focus on React hook orchestration only
 * - Keep under 150 lines following single responsibility
 */

import { useCallback } from 'react';
import { ContentType } from '../../domain/value-objects/content/ContentType';
import { validateContent } from '../actions/contentValidationActions';
import { useContentDebounce } from './validation/useContentDebounce';
import { useValidationQuery, type ContentValidationResult } from './validation/useValidationQueryHelpers';
import { useContentStatistics } from './validation/useContentStatistics';
import {
  getValidationStatus,
  getValidationMessage,
  getContentSuggestions,
  type ValidationStatus
} from './validation/validationStatusHelpers';

export interface UseContentValidationOptions {
  debounceMs?: number;
  enableRealTime?: boolean;
  maxLength?: number;
  contentType?: ContentType;
}

export interface UseContentValidationResult {
  // Validation results
  validation: ContentValidationResult;
  
  // Validation state
  isValidating: boolean;
  validationStatus: ValidationStatus;
  
  // Helper functions
  validateNow: (content?: string) => Promise<ContentValidationResult>;
  getValidationMessage: () => string;
  getSuggestions: () => string[];
  
  // Content statistics
  contentStats: {
    characterCount: number;
    wordCount: number;
    lineCount: number;
    hasMarkdownHeaders: boolean;
    hasExcessiveWhitespace: boolean;
  };
  
  // Query state
  isError: boolean;
  error: Error | null;
}

// AI: Main content validation hook with simplified orchestration
export function useContentValidation(
  content: string,
  options: UseContentValidationOptions = {}
): UseContentValidationResult {
  const {
    debounceMs = 500,
    enableRealTime = true,
    maxLength,
    contentType = ContentType.CUSTOM
  } = options;

  // Debounce content for performance
  const debouncedContent = useContentDebounce(content, {
    debounceMs,
    enabled: enableRealTime
  });

  // Get validation result from query
  const validationQuery = useValidationQuery(debouncedContent, contentType, maxLength, {
    enabled: enableRealTime,
    staleTime: 30000,
    retry: false,
    refetchOnWindowFocus: false
  });

  // Get content statistics
  const { statistics, suggestions } = useContentStatistics(content, contentType, maxLength);

  // Manual validation function
  const validateNow = useCallback(async (contentToValidate?: string): Promise<ContentValidationResult> => {
    const targetContent = contentToValidate ?? content;
    
    if (!targetContent.trim()) {
      return {
        isValid: true,
        errors: [],
        warnings: [],
        suggestions: [],
        characterCount: 0,
        wordCount: 0
      };
    }

    return await validateContent({
      content: targetContent,
      contentType,
      maxLength
    });
  }, [content, contentType, maxLength]);

  // Compute validation status
  const validationStatus = getValidationStatus(validationQuery.data);

  // Default validation result for when query hasn't loaded
  const defaultValidation: ContentValidationResult = {
    isValid: true,
    errors: [],
    warnings: [],
    suggestions: [],
    characterCount: statistics.characterCount,
    wordCount: statistics.wordCount
  };

  return {
    // Validation results
    validation: validationQuery.data || defaultValidation,
    
    // Validation state
    isValidating: validationQuery.isLoading,
    validationStatus,
    
    // Helper functions
    validateNow,
    getValidationMessage: () => getValidationMessage(validationQuery.data),
    getSuggestions: () => [...getContentSuggestions(validationQuery.data), ...suggestions],
    
    // Content statistics
    contentStats: {
      characterCount: statistics.characterCount,
      wordCount: statistics.wordCount,
      lineCount: statistics.lineCount,
      hasMarkdownHeaders: statistics.hasMarkdownHeaders,
      hasExcessiveWhitespace: statistics.hasExcessiveWhitespace
    },
    
    // Query state
    isError: validationQuery.isError,
    error: validationQuery.error
  };
}

// Re-export multi-content validation
export { useMultiContentValidation } from './useMultiContentValidation';

// Re-export types for backward compatibility
export type { ContentValidationResult };