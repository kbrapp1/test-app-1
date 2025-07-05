/**
 * Crawl Progress Simulator
 * 
 * AI INSTRUCTIONS:
 * - Provide visual feedback during crawling
 * - Simulate realistic progress steps
 * - Handle different crawl phases
 * - Pure utility function with no side effects
 */

import { WebsiteSourceDto } from '../../application/dto/ChatbotConfigDto';
import { CrawlProgress } from '../components/admin/website-sources/WebsiteSourcesSection';

/**
 * Simulate Crawl Progress
 * 
 * AI INSTRUCTIONS:
 * - Provide visual feedback during crawling
 * - Simulate realistic progress steps
 * - Handle different crawl phases
 */
export async function simulateCrawlProgress(
  sourceId: string,
  websiteSources: WebsiteSourceDto[],
  progressCallback: (progress: Partial<CrawlProgress>) => void
): Promise<void> {
  const source = websiteSources.find(s => s.id === sourceId);
  const baseUrl = source?.url || 'https://example.com';
  
  const steps = [
    { status: 'starting' as const, progress: 10, message: 'Connecting to website...', delay: 500 },
    { status: 'crawling' as const, progress: 25, message: 'Discovering pages...', pagesFound: 5, delay: 1000 },
    { status: 'crawling' as const, progress: 50, message: 'Crawling pages...', pagesFound: 12, pagesProcessed: 3, currentPage: `${baseUrl}/about`, delay: 1500 },
    { status: 'processing' as const, progress: 75, message: 'Processing content...', pagesFound: 15, pagesProcessed: 8, delay: 1000 },
    { status: 'vectorizing' as const, progress: 90, message: 'Creating embeddings...', pagesFound: 15, pagesProcessed: 12, delay: 800 },
  ];

  for (const step of steps) {
    await new Promise(resolve => setTimeout(resolve, step.delay));
    progressCallback(step);
  }
} 