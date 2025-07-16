/**
 * Crawl Progress Hook
 * 
 * AI INSTRUCTIONS:
 * - Manage crawl progress state with real database polling
 * - Poll database for actual crawl status updates
 * - Show real vectorization progress instead of simulation
 * - Keep crawl-specific logic isolated
 * - Provide clean progress management interface
 */

import { useState, useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { CrawlProgress } from '../../components/admin/website-sources/WebsiteSourcesSection';

// AI: Type definitions for cached data structures
interface WebsiteSource {
  id: string;
  status: string;
  pageCount?: number;
  lastProcessed?: string;
  errorMessage?: string;
}

interface CachedKnowledgeBase {
  websiteSources?: WebsiteSource[];
}

interface CachedConfigData {
  knowledgeBase?: CachedKnowledgeBase;
}

/**
 * Crawl Progress Hook with Database Polling
 * 
 * AI INSTRUCTIONS:
 * - Poll database every 2 seconds for real status updates
 * - Parse vectorization progress from database status
 * - Handle all crawl states: pending → crawling → vectorizing → completed
 * - Clean up polling when crawl completes or component unmounts
 */
export function useCrawlProgress() {
  const [crawlProgress, setCrawlProgress] = useState<CrawlProgress | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const queryClient = useQueryClient();

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
    stopPolling();
  };

  const errorCrawlProgress = (error: string) => {
    updateCrawlProgress({
      status: 'error',
      progress: 0,
      error,
      message: 'Crawl failed'
    });
    stopPolling();
  };

  const clearCrawlProgress = () => {
    setCrawlProgress(null);
    stopPolling();
  };

  // AI: Start database polling for real progress updates
  const startPolling = (organizationId: string, configId: string, sourceId: string) => {
    if (pollIntervalRef.current) return; // Already polling
    
    console.log('🔄 Starting polling for:', { organizationId, configId, sourceId });
    setIsPolling(true);
    let consecutiveUnchanged = 0;
    
    pollIntervalRef.current = setInterval(async () => {
      try {
        // AI: First check cached data - no API call
        let cachedData = queryClient.getQueryData(['chatbot-config', organizationId]) as CachedConfigData | undefined;
        let websiteSource = cachedData?.knowledgeBase?.websiteSources?.find((ws: WebsiteSource) => ws.id === sourceId);
        
        // AI: Only refetch if no cached data or if status suggests change is likely
        if (!websiteSource || websiteSource.status === 'pending' || websiteSource.status === 'crawling' || websiteSource.status === 'vectorizing') {
          await queryClient.invalidateQueries({ 
            queryKey: ['chatbot-config', organizationId] 
          });
          
          // Get fresh data after invalidation
          cachedData = queryClient.getQueryData(['chatbot-config', organizationId]) as CachedConfigData | undefined;
          websiteSource = cachedData?.knowledgeBase?.websiteSources?.find((ws: WebsiteSource) => ws.id === sourceId);
        }
        
        if (websiteSource) {
          const realProgress = parseRealProgress(websiteSource);
          const currentStatus = crawlProgress?.status;
          
          console.log('📊 Poll result:', { 
            sourceId, 
            dbStatus: websiteSource.status, 
            currentStatus, 
            pageCount: websiteSource.pageCount,
            errorMessage: websiteSource.errorMessage 
          });
          
          // AI: Only update if status actually changed
          if (currentStatus !== realProgress.status) {
            console.log('✅ Status changed, updating progress');
            updateCrawlProgress(realProgress);
            consecutiveUnchanged = 0;
          } else {
            consecutiveUnchanged++;
          }
          
          // AI: Stop polling if crawl is complete, failed, or stuck too long
          if (websiteSource.status === 'completed' || websiteSource.status === 'error' || consecutiveUnchanged > 10) {
            stopPolling();
          }
        } else {
          consecutiveUnchanged++;
          // AI: Stop if source not found for too long
          if (consecutiveUnchanged > 5) {
            stopPolling();
          }
        }
      } catch (error) {
        console.error('Polling error:', error);
        consecutiveUnchanged++;
        // AI: Stop polling after too many consecutive errors
        if (consecutiveUnchanged > 3) {
          stopPolling();
        }
      }
    }, 3000); // Poll every 3 seconds (reduced frequency)
  };

  // AI: Stop database polling
  const stopPolling = () => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
    setIsPolling(false);
  };

  // AI: Parse real progress from database website source
  const parseRealProgress = (websiteSource: unknown): Partial<CrawlProgress> => {
    const source = websiteSource as Record<string, unknown>;
    const status = source.status;
    const pageCount = (source.pageCount as number) || 0;
    const errorMessage = source.errorMessage as string | undefined;
    
    switch (status) {
      case 'pending':
        return {
          status: 'starting',
          progress: 5,
          message: 'Preparing to crawl...',
          pagesFound: 0,
          pagesProcessed: 0
        };
        
      case 'crawling':
        return {
          status: 'crawling',
          progress: 25,
          message: 'Discovering and crawling pages...',
          pagesFound: pageCount,
          pagesProcessed: Math.floor(pageCount * 0.7) // Estimate in-progress
        };
        
      case 'vectorizing':
        // AI: Parse vectorization progress from errorMessage
        // Format: "Vectorizing 3/10: Page Title"
        const vectorMatch = errorMessage?.match(/Vectorizing (\d+)\/(\d+):/);
        if (vectorMatch) {
          const [, current, total] = vectorMatch;
          const vectorProgress = Math.round((parseInt(current) / parseInt(total)) * 100);
          const adjustedProgress = 60 + (vectorProgress * 0.35); // 60-95% range for vectorizing
          
          return {
            status: 'vectorizing',
            progress: Math.min(adjustedProgress, 95),
            message: errorMessage,
            pagesFound: parseInt(total),
            pagesProcessed: parseInt(current)
          };
        }
        
        return {
          status: 'vectorizing',
          progress: 75,
          message: 'Creating embeddings...',
          pagesFound: pageCount,
          pagesProcessed: pageCount
        };
        
      case 'completed':
        return {
          status: 'completed',
          progress: 100,
          message: `Crawled ${pageCount} pages successfully`,
          pagesFound: pageCount,
          pagesProcessed: pageCount
        };
        
      case 'error':
        return {
          status: 'error',
          progress: 0,
          error: String(errorMessage || 'Crawl failed'),
          message: 'Crawl failed'
        };
        
      default:
        return {
          status: 'starting',
          progress: 0,
          message: 'Initializing...'
        };
    }
  };

  // AI: Cleanup polling on unmount
  useEffect(() => {
    return () => {
      stopPolling();
    };
  }, []);

  return {
    crawlProgress,
    isPolling,
    startCrawlProgress,
    updateCrawlProgress,
    completeCrawlProgress,
    errorCrawlProgress,
    clearCrawlProgress,
    startPolling,
    stopPolling
  };
} 