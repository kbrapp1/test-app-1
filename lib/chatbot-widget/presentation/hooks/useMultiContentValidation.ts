/**
 * AI Instructions: Multi-field content validation hook
 * - Use composition for validation helpers
 * - Handle multiple content fields efficiently
 * - Focus on React hook orchestration only
 * - Keep under 200 lines following single responsibility
 */

import { useMemo, useCallback } from 'react';
import { ContentType } from '../../domain/value-objects/content/ContentType';
import { validateContent } from '../actions/contentValidationActions';
import { useMultiValidationQuery, type ContentValidationResult } from './validation/useValidationQueryHelpers';
import { ContentStatisticsService } from '../../domain/services/content-processing/ContentStatisticsService';
import {
  getValidationStatus,
  getValidationMessage,
  getContentSuggestions,
  getOverallValidationStatus,
  getAllErrors,
  getAllWarnings,
  type ValidationStatus,
  type ContentValidationError,
  type ContentValidationWarning
} from './validation/validationStatusHelpers';

export interface MultiContentField {
  content: string;
  type: ContentType;
  maxLength?: number;
}

export interface FieldValidationResult {
  validation: ContentValidationResult;
  isValidating: boolean;
  validationStatus: ValidationStatus;
  validateNow: (content?: string) => Promise<ContentValidationResult>;
  getValidationMessage: () => string;
  getSuggestions: () => string[];
  contentStats: {
    characterCount: number;
    wordCount: number;
    lineCount: number;
    hasMarkdownHeaders: boolean;
    hasExcessiveWhitespace: boolean;
  };
  isError: boolean;
  error: Error | null;
}

export interface UseMultiContentValidationResult {
  validations: Record<string, FieldValidationResult>;
  overallStatus: ValidationStatus;
  getAllErrors: () => Array<ContentValidationError & { field: string }>;
  getAllWarnings: () => Array<ContentValidationWarning & { field: string }>;
  validateAll: () => Promise<Record<string, ContentValidationResult>>;
  isAnyValidating: boolean;
}

// AI: Hook for validating multiple content fields with composition
export function useMultiContentValidation(
  contentFields: Record<string, MultiContentField>
): UseMultiContentValidationResult {
  const fieldKeys = useMemo(() => Object.keys(contentFields).sort(), [contentFields]);
  
  // Get multi-field validation results
  const multiValidationQuery = useMultiValidationQuery(contentFields, {
    staleTime: 30000,
    retry: false,
    refetchOnWindowFocus: false
  });

  // Convert query results to individual validation objects
  const validations = useMemo(() => {
    const results: Record<string, FieldValidationResult> = {};

    fieldKeys.forEach(fieldName => {
      const field = contentFields[fieldName];
      const validationResult = multiValidationQuery.data?.[fieldName] || {
        isValid: true,
        errors: [],
        warnings: [],
        suggestions: [],
        characterCount: field.content.length,
        wordCount: field.content.trim() ? field.content.trim().split(/\s+/).length : 0
      };

      // Get content statistics for this field
      const statisticsService = new ContentStatisticsService();
      const statistics = statisticsService.calculateStatistics(field.content, field.type);
      const suggestions = statisticsService.generateSuggestions(statistics, field.maxLength);

      results[fieldName] = {
        validation: validationResult,
        isValidating: multiValidationQuery.isLoading,
        validationStatus: getValidationStatus(validationResult),
        validateNow: async (contentToValidate?: string) => {
          const targetContent = contentToValidate ?? field.content;
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
            contentType: field.type,
            maxLength: field.maxLength
          });
        },
        getValidationMessage: () => getValidationMessage(validationResult),
        getSuggestions: () => [...getContentSuggestions(validationResult), ...suggestions],
        contentStats: {
          characterCount: statistics.characterCount,
          wordCount: statistics.wordCount,
          lineCount: statistics.lineCount,
          hasMarkdownHeaders: statistics.hasMarkdownHeaders,
          hasExcessiveWhitespace: statistics.hasExcessiveWhitespace
        },
        isError: multiValidationQuery.isError,
        error: multiValidationQuery.error
      };
    });

    return results;
  }, [fieldKeys, contentFields, multiValidationQuery.data, multiValidationQuery.isLoading, multiValidationQuery.isError, multiValidationQuery.error]);

  // Compute overall validation status
  const overallStatus = useMemo(() => {
    return getOverallValidationStatus(validations);
  }, [validations]);

  // Get all errors across fields
  const getAllErrorsCallback = useCallback(() => {
    return getAllErrors(validations);
  }, [validations]);

  // Get all warnings across fields
  const getAllWarningsCallback = useCallback(() => {
    return getAllWarnings(validations);
  }, [validations]);

  // Validate all fields at once
  const validateAll = useCallback(async () => {
    const results = await Promise.all(
      Object.entries(validations).map(async ([fieldName, validation]) => ({
        fieldName,
        result: await validation.validateNow()
      }))
    );

    return results.reduce((acc, { fieldName, result }) => {
      acc[fieldName] = result;
      return acc;
    }, {} as Record<string, ContentValidationResult>);
  }, [validations]);

  return {
    validations,
    overallStatus,
    getAllErrors: getAllErrorsCallback,
    getAllWarnings: getAllWarningsCallback,
    validateAll,
    isAnyValidating: Object.values(validations).some(v => v.isValidating)
  };
}