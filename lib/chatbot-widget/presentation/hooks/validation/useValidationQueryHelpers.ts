/**
 * AI Instructions: React Query helpers for content validation
 * - Pure React Query integration without business logic
 * - Handle caching, debouncing, and query state management
 * - Focus on presentation concerns only
 * - Keep under 250 lines following single responsibility
 */

import { useQuery } from '@tanstack/react-query';
import { ContentType } from '../../../domain/value-objects/content/ContentType';
import { validateContent } from '../../actions/contentValidationActions';

export type ContentValidationResult = {
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

export interface ValidationQueryOptions {
  enabled?: boolean;
  staleTime?: number;
  retry?: boolean | number;
  refetchOnWindowFocus?: boolean;
}

export interface UseValidationQueryResult {
  data: ContentValidationResult | undefined;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
}

// AI: Hook for single content validation using React Query
export function useValidationQuery(
  content: string,
  contentType: ContentType,
  maxLength?: number,
  options: ValidationQueryOptions = {}
): UseValidationQueryResult {
  const {
    enabled = true,
    staleTime = 30000,
    retry = false,
    refetchOnWindowFocus = false
  } = options;

  const validationQuery = useQuery({
    queryKey: ['content-validation', content, contentType, maxLength],
    queryFn: async (): Promise<ContentValidationResult> => {
      if (!content.trim()) {
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
        content,
        contentType,
        maxLength
      });
    },
    enabled: enabled && Boolean(content),
    staleTime,
    retry,
    refetchOnWindowFocus
  });

  return {
    data: validationQuery.data,
    isLoading: validationQuery.isLoading,
    isError: validationQuery.isError,
    error: validationQuery.error
  };
}

// AI: Hook for multi-field content validation using React Query
export function useMultiValidationQuery(
  contentFields: Record<string, { content: string; type: ContentType; maxLength?: number }>,
  options: ValidationQueryOptions = {}
): {
  data: Record<string, ContentValidationResult> | undefined;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
} {
  const {
    enabled = true,
    staleTime = 30000,
    retry = false,
    refetchOnWindowFocus = false
  } = options;

  const multiValidationQuery = useQuery({
    queryKey: ['multi-content-validation', contentFields],
    queryFn: async (): Promise<Record<string, ContentValidationResult>> => {
      const results: Record<string, ContentValidationResult> = {};
      
      // Validate all fields in parallel
      const validationPromises = Object.entries(contentFields).map(async ([fieldName, field]) => {
        if (!field.content.trim()) {
          return [fieldName, {
            isValid: true,
            errors: [],
            warnings: [],
            suggestions: [],
            characterCount: 0,
            wordCount: 0
          } as ContentValidationResult] as const;
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
    enabled: enabled && Object.values(contentFields).some(field => Boolean(field.content.trim())),
    staleTime,
    retry,
    refetchOnWindowFocus
  });

  return {
    data: multiValidationQuery.data,
    isLoading: multiValidationQuery.isLoading,
    isError: multiValidationQuery.isError,
    error: multiValidationQuery.error
  };
}