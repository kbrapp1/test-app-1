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
import { validateContent, type ContentValidationRequest, type ContentValidationResponse } from '../actions/contentValidationActions';

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
export function useMultiContentValidation(
  contentFields: Record<string, { content: string; type: ContentType; maxLength?: number }>
) {
  const validations = Object.entries(contentFields).reduce((acc, [fieldName, field]) => {
    acc[fieldName] = useContentValidation(field.content, {
      contentType: field.type,
      maxLength: field.maxLength,
      enableRealTime: true
    });
    return acc;
  }, {} as Record<string, ReturnType<typeof useContentValidation>>);

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