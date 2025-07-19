/**
 * AI Instructions: React debouncing hook for content input
 * - Pure React hook without business logic
 * - Handle debouncing for performance optimization
 * - Focus on UI interaction concerns only
 * - Keep under 100 lines following single responsibility
 */

import { useState, useEffect } from 'react';

export interface UseContentDebounceOptions {
  debounceMs?: number;
  enabled?: boolean;
}

// AI: Hook for debouncing content changes to optimize validation calls
export function useContentDebounce(
  content: string,
  options: UseContentDebounceOptions = {}
): string {
  const {
    debounceMs = 500,
    enabled = true
  } = options;

  const [debouncedContent, setDebouncedContent] = useState(content);

  useEffect(() => {
    if (!enabled) {
      setDebouncedContent(content);
      return;
    }

    const timer = setTimeout(() => {
      setDebouncedContent(content);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [content, debounceMs, enabled]);

  return debouncedContent;
}