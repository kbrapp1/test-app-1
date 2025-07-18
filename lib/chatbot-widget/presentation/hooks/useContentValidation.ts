/**
 * AI Instructions: Real-time content validation hook
 * - Coordinate with application services for validation
 * - Use React Query for validation caching and debouncing
 * - Return validation results with user-friendly messages
 * - Handle all content types with proper error handling
 * - Follow single responsibility principle
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ContentType } from '../../domain/value-objects/content/ContentType';
import { validateContent, type ContentValidationResponse } from '../actions/contentValidationActions';

export interface ContentValidationError {
  field: string;
  message: string;
  code: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface ContentValidationWarning {
  field: string;
  message: string;
  suggestion?: string;
}

export type ContentValidationResult = NonNullable<ContentValidationResponse['data']>;

export interface UseContentValidationOptions {
  debounceMs?: number;
  enableRealTime?: boolean;
  maxLength?: number;
  contentType?: ContentType;
}

export function useContentValidation(
  content: string,
  options: UseContentValidationOptions = {}
) {
  const {
    debounceMs = 500,
    enableRealTime = true,
    maxLength,
    contentType = ContentType.CUSTOM
  } = options;

  const [debouncedContent, setDebouncedContent] = useState(content);

  // AI: Debounce content changes for performance
  useEffect(() => {
    if (!enableRealTime) return;

    const timer = setTimeout(() => {
      setDebouncedContent(content);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [content, debounceMs, enableRealTime]);

  // AI: Query for content validation using server action
  const validationQuery = useQuery({
    queryKey: ['content-validation', debouncedContent, contentType, maxLength],
    queryFn: async () => {
      if (!debouncedContent.trim()) {
        return {
          isValid: true,
          errors: [],
          warnings: [],
          suggestions: [],
          characterCount: 0,
          wordCount: 0
        } as ContentValidationResult;
      }

      return await validateContent({
        content: debouncedContent,
        contentType,
        maxLength
      });
    },
    enabled: enableRealTime && Boolean(debouncedContent),
    staleTime: 30000, // 30 seconds
    retry: false,
    refetchOnWindowFocus: false
  });

  // AI: Manual validation function for form submission
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

    const result = await validateContent({
      content: targetContent,
      contentType,
      maxLength
    });
    
    return result;
  }, [content, contentType, maxLength]);

  // AI: Compute content statistics
  const contentStats = useMemo(() => {
    const trimmed = content.trim();
    return {
      characterCount: content.length,
      wordCount: trimmed ? trimmed.split(/\s+/).length : 0,
      lineCount: content.split('\n').length,
      hasMarkdownHeaders: /^#{1,6}\s/.test(content),
      hasExcessiveWhitespace: /\n{3,}/.test(content)
    };
  }, [content]);

  // AI: Determine validation status
  const validationStatus = useMemo(() => {
    const result = validationQuery.data;
    if (!result) return 'pending';
    
    if (result.errors.length > 0) {
      const hasCritical = result.errors.some((e: ContentValidationError) => e.severity === 'critical');
      const hasHigh = result.errors.some((e: ContentValidationError) => e.severity === 'high');
      if (hasCritical) return 'critical';
      if (hasHigh) return 'error';
      return 'warning';
    }
    
    if (result.warnings.length > 0) return 'warning';
    return 'valid';
  }, [validationQuery.data]);

  // AI: Get user-friendly validation message
  const getValidationMessage = useCallback(() => {
    const result = validationQuery.data;
    if (!result) return '';

    if (result.errors.length > 0) {
      const criticalErrors = result.errors.filter((e: ContentValidationError) => e.severity === 'critical');
      if (criticalErrors.length > 0) {
        return criticalErrors[0].message;
      }
      
      const highErrors = result.errors.filter((e: ContentValidationError) => e.severity === 'high');
      if (highErrors.length > 0) {
        return highErrors[0].message;
      }
      
      return result.errors[0].message;
    }

    if (result.warnings.length > 0) {
      return result.warnings[0].message;
    }

    return 'Content looks good!';
  }, [validationQuery.data]);

  // AI: Get content improvement suggestions
  const getSuggestions = useCallback(() => {
    const result = validationQuery.data;
    if (!result) return [];

    const suggestions = [...result.suggestions];
    
    // AI: Add automatic suggestions based on content analysis
    if (contentStats.hasMarkdownHeaders) {
      suggestions.push('Consider removing markdown headers (##, ###) as they may conflict with system formatting');
    }
    
    if (contentStats.hasExcessiveWhitespace) {
      suggestions.push('Remove excessive line breaks for cleaner formatting');
    }
    
    if (maxLength && contentStats.characterCount > maxLength * 0.9) {
      suggestions.push(`Content is approaching the ${maxLength} character limit`);
    }

    return suggestions;
  }, [validationQuery.data, contentStats, maxLength]);

  return {
    // Validation results
    validation: validationQuery.data || {
      isValid: true,
      errors: [],
      warnings: [],
      suggestions: [],
      characterCount: contentStats.characterCount,
      wordCount: contentStats.wordCount
    },
    
    // Validation state
    isValidating: validationQuery.isLoading,
    validationStatus,
    
    // Helper functions
    validateNow,
    getValidationMessage,
    getSuggestions,
    
    // Content statistics
    contentStats,
    
    // Query state
    isError: validationQuery.isError,
    error: validationQuery.error
  };
}

// AI: Hook for validating multiple content fields
// Safe implementation that follows React Hooks Rules
export function useMultiContentValidation(
  contentFields: Record<string, { content: string; type: ContentType; maxLength?: number }>
) {
  // AI: Create validation results using a different approach
  // Since we can't dynamically call hooks, we'll use a query-based approach
  const fieldKeys = useMemo(() => Object.keys(contentFields).sort(), [contentFields]);
  
  // AI: Create a unified query for all fields to avoid hooks in loops
  const multiValidationQuery = useQuery({
    queryKey: ['multi-content-validation', contentFields],
    queryFn: async () => {
      const results: Record<string, ContentValidationResult> = {};
      
      // Validate all fields in parallel
      const validationPromises = Object.entries(contentFields).map(async ([fieldName, field]) => {
        if (!field.content.trim()) {
          return [fieldName, {
            isValid: true,
            errors: [] as Array<{
              field: string;
              message: string;
              code: string;
              severity: 'low' | 'medium' | 'high' | 'critical';
            }>,
            warnings: [] as Array<{
              field: string;
              message: string;
              suggestion?: string;
            }>,
            suggestions: [] as string[],
            characterCount: 0,
            wordCount: 0
          }] as const;
        }

        const result = await validateContent({
          content: field.content,
          contentType: field.type,
          maxLength: field.maxLength
        });
        
        return [fieldName, result] as const;
      });

      const validationResults = await Promise.all(validationPromises);
      
      validationResults.forEach(([fieldName, result]) => {
        results[fieldName] = result;
      });

      return results;
    },
    enabled: Object.values(contentFields).some(field => Boolean(field.content.trim())),
    staleTime: 30000,
    retry: false,
    refetchOnWindowFocus: false
  });

  // AI: Convert query results to individual validation objects
  const validations = useMemo(() => {
    const results: Record<string, {
      validation: ContentValidationResult;
      isValidating: boolean;
      validationStatus: string;
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
    }> = {};

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

      // Create individual validation status
      const validationStatus = (() => {
        if (!validationResult) return 'pending';
        
        if (validationResult.errors.length > 0) {
          const hasCritical = validationResult.errors.some((e: ContentValidationError) => e.severity === 'critical');
          const hasHigh = validationResult.errors.some((e: ContentValidationError) => e.severity === 'high');
          if (hasCritical) return 'critical';
          if (hasHigh) return 'error';
          return 'warning';
        }
        
        if (validationResult.warnings.length > 0) return 'warning';
        return 'valid';
      })();

      results[fieldName] = {
        validation: validationResult,
        isValidating: multiValidationQuery.isLoading,
        validationStatus,
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
        getValidationMessage: () => {
          if (!validationResult) return '';
          if (validationResult.errors.length > 0) {
            const criticalErrors = validationResult.errors.filter((e: ContentValidationError) => e.severity === 'critical');
            if (criticalErrors.length > 0) return criticalErrors[0].message;
            const highErrors = validationResult.errors.filter((e: ContentValidationError) => e.severity === 'high');
            if (highErrors.length > 0) return highErrors[0].message;
            return validationResult.errors[0].message;
          }
          if (validationResult.warnings.length > 0) return validationResult.warnings[0].message;
          return 'Content looks good!';
        },
        getSuggestions: () => validationResult.suggestions || [],
        contentStats: {
          characterCount: field.content.length,
          wordCount: field.content.trim() ? field.content.trim().split(/\s+/).length : 0,
          lineCount: field.content.split('\n').length,
          hasMarkdownHeaders: /^#{1,6}\s/.test(field.content),
          hasExcessiveWhitespace: /\n{3,}/.test(field.content)
        },
        isError: multiValidationQuery.isError,
        error: multiValidationQuery.error
      };
    });

    return results;
  }, [fieldKeys, contentFields, multiValidationQuery.data, multiValidationQuery.isLoading, multiValidationQuery.isError, multiValidationQuery.error]);

  // AI: Compute overall validation status
  const overallStatus = useMemo(() => {
    const statuses = Object.values(validations).map(v => v.validationStatus);
    
    if (statuses.includes('critical')) return 'critical';
    if (statuses.includes('error')) return 'error';
    if (statuses.includes('warning')) return 'warning';
    if (statuses.some(s => s === 'pending')) return 'pending';
    return 'valid';
  }, [validations]);

  // AI: Get all errors across fields
  const getAllErrors = useCallback(() => {
    return Object.entries(validations).flatMap(([fieldName, validation]) =>
      validation.validation.errors.map((error: ContentValidationError) => ({
        ...error,
        field: fieldName
      }))
    );
  }, [validations]);

  // AI: Get all warnings across fields
  const getAllWarnings = useCallback(() => {
    return Object.entries(validations).flatMap(([fieldName, validation]) =>
      validation.validation.warnings.map((warning: ContentValidationWarning) => ({
        ...warning,
        field: fieldName
      }))
    );
  }, [validations]);

  // AI: Validate all fields at once
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
    getAllErrors,
    getAllWarnings,
    validateAll,
    isAnyValidating: Object.values(validations).some(v => v.isValidating)
  };
} 