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

// Simulate crawl progress with realistic steps
export async function simulateCrawlProgress(
  sourceId: string,
  websiteSources: WebsiteSourceDto[],
  progressCallback: (progress: Partial<CrawlProgress>) => void
): Promise<void> {
  const source = websiteSources.find(s => s.id === sourceId);
  const baseUrl = source?.url || 'https://example.com';
  
  // AI: Use real maxPages from crawl settings, fallback to 5
  const maxPages = source?.crawlSettings?.maxPages || 5;
  const estimatedPages = Math.min(maxPages, 15); // Simulate discovering some pages
  
  const steps = [
    { status: 'starting' as const, progress: 10, message: 'Connecting to website...', delay: 500 },
    { status: 'crawling' as const, progress: 25, message: 'Discovering pages...', pagesFound: Math.floor(estimatedPages * 0.6), delay: 1000 },
    { status: 'crawling' as const, progress: calculateProgress(Math.floor(estimatedPages * 0.3), estimatedPages), message: 'Crawling pages...', pagesFound: estimatedPages, pagesProcessed: Math.floor(estimatedPages * 0.3), currentPage: `${baseUrl}/about`, delay: 1500 },
    { status: 'processing' as const, progress: calculateProgress(Math.floor(estimatedPages * 0.6), estimatedPages), message: 'Processing content...', pagesFound: estimatedPages, pagesProcessed: Math.floor(estimatedPages * 0.6), currentPage: `${baseUrl}/services`, delay: 1200 },
    { status: 'vectorizing' as const, progress: calculateProgress(Math.floor(estimatedPages * 0.8), estimatedPages), message: 'Creating embeddings...', pagesFound: estimatedPages, pagesProcessed: Math.floor(estimatedPages * 0.8), delay: 800 },
    { status: 'completed' as const, progress: 100, message: `Crawled ${maxPages} pages successfully`, pagesFound: maxPages, pagesProcessed: maxPages, delay: 500 }
  ];
  
  for (const step of steps) {
    progressCallback({
      sourceId,
      ...step
    });
    
    await new Promise(resolve => setTimeout(resolve, step.delay));
  }
}

// Calculate progress percentage based on pages processed vs pages found
function calculateProgress(pagesProcessed: number, pagesFound: number): number {
  if (pagesFound === 0) return 0;
  return Math.round((pagesProcessed / pagesFound) * 100);
} 