/**
 * Crawl Progress Hook
 * 
 * AI INSTRUCTIONS:
 * - Manage crawl progress state
 * - Handle progress simulation
 * - Keep crawl-specific logic isolated
 * - Provide clean progress management interface
 */

import { useState } from 'react';
import { CrawlProgress } from '../../components/admin/website-sources/WebsiteSourcesSection';

/**
 * Crawl Progress Hook
 * 
 * AI INSTRUCTIONS:
 * - Manage crawl progress state
 * - Handle progress simulation
 * - Keep crawl-specific logic isolated
 */
export function useCrawlProgress() {
  const [crawlProgress, setCrawlProgress] = useState<CrawlProgress | null>(null);

  const startCrawlProgress = (sourceId: string) => {
    setCrawlProgress({
      sourceId,
      status: 'starting',
      progress: 0,
      pagesFound: 0,
      pagesProcessed: 0,
      message: 'Initializing crawl...'
    });
  };

  const updateCrawlProgress = (updates: Partial<CrawlProgress>) => {
    setCrawlProgress(prev => prev ? { ...prev, ...updates } : null);
  };

  const completeCrawlProgress = (itemsProcessed: number) => {
    updateCrawlProgress({
      status: 'completed',
      progress: 100,
      pagesProcessed: itemsProcessed,
      message: 'Crawl completed successfully!'
    });
  };

  const errorCrawlProgress = (error: string) => {
    updateCrawlProgress({
      status: 'error',
      progress: 0,
      error,
      message: 'Crawl failed'
    });
  };

  const clearCrawlProgress = () => {
    setCrawlProgress(null);
  };

  return {
    crawlProgress,
    startCrawlProgress,
    updateCrawlProgress,
    completeCrawlProgress,
    errorCrawlProgress,
    clearCrawlProgress
  };
} 