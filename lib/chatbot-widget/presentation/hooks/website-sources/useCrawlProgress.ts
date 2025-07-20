/**
 * Crawl Progress Hook
 * 
 * DDD Presentation Layer: Manages real-time crawl progress
 * - Single responsibility: Handle real-time progress updates
 * - Clean separation: Uses infrastructure providers, updates presentation state
 * - Real-time updates: SSE stream with database polling fallback
 */

// import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import { CrawlProgress } from '../../components/admin/website-sources/WebsiteSourcesSection';

export function useCrawlProgress() {
  const [crawlProgress, setCrawlProgress] = useState<CrawlProgress | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);
  // const queryClient = useQueryClient();

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

  // Direct progress update methods for real-time callbacks
  const updatePagesFound = (count: number) => {
    setCrawlProgress(prev => prev ? { ...prev, pagesFound: count } : null);
  };

  const updatePagesProcessed = (count: number) => {
    setCrawlProgress(prev => prev ? { ...prev, pagesProcessed: count } : null);
  };

  const updateStatus = (status: CrawlProgress['status'], message?: string) => {
    setCrawlProgress(prev => prev ? { 
      ...prev, 
      status, 
      message,
      progress: getProgressForStatus(status, prev.pagesFound, prev.pagesProcessed)
    } : null);
  };

  // Calculate progress percentage based on status and counts
  const getProgressForStatus = (status: CrawlProgress['status'], pagesFound: number, pagesProcessed: number): number => {
    switch (status) {
      case 'starting': return 5;
      case 'crawling': 
        if (pagesFound > 0) {
          return Math.min(20 + (pagesProcessed / pagesFound) * 40, 60); // 20-60% during crawling
        }
        return 25;
      case 'processing': return 65;
      case 'vectorizing': return 80;
      case 'completed': return 100;
      case 'error': return 0;
      default: return 0;
    }
  };

  const completeCrawlProgress = (itemsProcessed: number) => {
    updateCrawlProgress({
      status: 'completed',
      progress: 100,
      pagesProcessed: itemsProcessed,
      message: 'Crawl completed successfully!'
    });
    
    // AI: Clear progress after brief delay to show final results immediately
    setTimeout(() => {
      setCrawlProgress(null);
      stopProgressStream();
    }, 2000); // Show completion for 2 seconds then clear to reveal results
  };

  const errorCrawlProgress = (error: string) => {
    updateCrawlProgress({
      status: 'error',
      progress: 0,
      error,
      message: 'Crawl failed'
    });
    stopProgressStream();
  };

  const clearCrawlProgress = () => {
    setCrawlProgress(null);
    stopProgressStream();
  };

  // Start Server-Sent Events stream for real-time progress
  const startProgressStream = (sourceId: string) => {
    if (eventSourceRef.current) return; // Already streaming
    
    setIsStreaming(true);
    
    const eventSource = new EventSource(`/api/chatbot/crawl-progress/${sourceId}`);
    eventSourceRef.current = eventSource;
    
    eventSource.onmessage = (event) => {
      try {
        const update = JSON.parse(event.data);
        
        switch (update.type) {
          case 'status':
            if (update.data.status && update.data.message) {
              updateStatus(update.data.status as 'starting' | 'crawling' | 'vectorizing' | 'completed' | 'error', update.data.message);
            }
            break;
            
          case 'pages_found':
            updatePagesFound(update.data.pagesFound || 0);
            break;
            
          case 'pages_processed':
            updatePagesProcessed(update.data.pagesProcessed || 0);
            break;
            
          case 'complete':
            updateCrawlProgress({
              status: 'completed',
              progress: 100,
              pagesProcessed: update.data.pagesProcessed || 0,
              message: 'Crawl completed successfully!'
            });
            stopProgressStream();
            break;
            
          case 'error':
            updateCrawlProgress({
              status: 'error',
              progress: 0,
              error: update.data.error || 'Crawl failed',
              message: 'Crawl failed'
            });
            stopProgressStream();
            break;
        }
      } catch {
        // Silently handle SSE parsing errors
      }
    };
    
    eventSource.onerror = () => {
      stopProgressStream();
    };
  };

  // Stop Server-Sent Events stream
  const stopProgressStream = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    setIsStreaming(false);
  };


  // Cleanup SSE connection on unmount
  useEffect(() => {
    return () => {
      stopProgressStream();
    };
  }, []);

  // Disabled polling to avoid extra API calls - using SSE instead
  const startPolling = (_organizationId: string, _configId: string, sourceId: string) => {
    // Just start SSE stream instead of polling
    startProgressStream(sourceId);
  };

  return {
    crawlProgress,
    isStreaming,
    startCrawlProgress,
    updateCrawlProgress,
    updatePagesFound,
    updatePagesProcessed,
    updateStatus,
    completeCrawlProgress,
    errorCrawlProgress,
    clearCrawlProgress,
    startProgressStream,
    stopProgressStream,
    // Database polling approach
    startPolling,
    stopPolling: stopProgressStream,
    isPolling: isStreaming
  };
} 