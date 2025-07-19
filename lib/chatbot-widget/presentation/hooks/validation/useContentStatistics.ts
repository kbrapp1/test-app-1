/**
 * AI Instructions: React hook for content statistics
 * - Use domain service for statistics calculation
 * - Handle React-specific concerns like memoization
 * - Focus on presentation layer integration only
 * - Keep under 150 lines following single responsibility
 */

import { useMemo } from 'react';
import { ContentStatisticsService, type ContentStatistics } from '../../../domain/services/content-processing/ContentStatisticsService';
import { ContentType } from '../../../domain/value-objects/content/ContentType';

export interface UseContentStatisticsResult {
  statistics: ContentStatistics;
  suggestions: string[];
  quality: {
    isHighQuality: boolean;
    qualityScore: number;
    recommendations: string[];
  };
}

// AI: Hook for calculating content statistics using domain service
export function useContentStatistics(
  content: string,
  contentType?: ContentType,
  maxLength?: number
): UseContentStatisticsResult {
  const statisticsService = useMemo(() => new ContentStatisticsService(), []);

  const statistics = useMemo(() => {
    return statisticsService.calculateStatistics(content, contentType);
  }, [statisticsService, content, contentType]);

  const suggestions = useMemo(() => {
    return statisticsService.generateSuggestions(statistics, maxLength);
  }, [statisticsService, statistics, maxLength]);

  const quality = useMemo(() => {
    return statisticsService.assessContentQuality(statistics);
  }, [statisticsService, statistics]);

  return {
    statistics,
    suggestions,
    quality
  };
}