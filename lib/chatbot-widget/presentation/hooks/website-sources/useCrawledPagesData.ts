/**
 * Crawled Pages Data Hook
 * 
 * AI INSTRUCTIONS:
 * - Handle data fetching and transformation
 * - Manage loading and error states
 * - Return processed data for UI consumption
 * - Transform database entities to UI DTOs
 */

import { useQuery } from '@tanstack/react-query';
import { getCrawledPages } from '../../actions/websiteSourceActions';
import { CrawledPageInfo } from '../../components/admin/website-sources/WebsiteSourcesSection';

/** Transform Database Page to UI Format
 */
function transformPageToUIFormat(page: unknown): CrawledPageInfo {
  const pageData = page as {
    url?: string;
    title?: string;
    content?: string;
    depth?: number;
    crawledAt?: string;
    status?: string;
    errorMessage?: string;
    responseTime?: number;
    statusCode?: number;
  };
  
  return {
    id: generatePageId(),
    url: pageData.url || '',
    title: pageData.title || '',
    content: pageData.content || '',
    category: 'general',
    tags: ['website', 'crawled'],
    depth: pageData.depth || 0,
    contentLength: pageData.content ? pageData.content.length : 0,
    crawledAt: pageData.crawledAt ? new Date(pageData.crawledAt) : new Date(),
    status: (pageData.status as 'success' | 'failed' | 'skipped') || 'skipped',
    errorMessage: pageData.errorMessage || '',
    responseTime: pageData.responseTime || 0,
    statusCode: pageData.statusCode || 0
  };
}

/** Generate Unique Page ID
 */
function generatePageId(): string {
  return `page_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Extract Base URL from Full URL
 * 
 * AI INSTRUCTIONS:
 * - Extract protocol and hostname from URL
 * - Handle URL parsing failures gracefully
 * - Return fallback for invalid URLs
 */
function extractBaseUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    return `${urlObj.protocol}//${urlObj.hostname}`;
  } catch {
    return url || 'unknown';
  }
}

/** Group Pages by Base URL
 */
function groupPagesByBaseUrl(pages: unknown[]): Record<string, CrawledPageInfo[]> {
  const groupedData: Record<string, CrawledPageInfo[]> = {};
  
  pages.forEach(page => {
    const crawledPageInfo = transformPageToUIFormat(page);
    const pageData = page as { url?: string };
    const baseUrl = extractBaseUrl(pageData.url || '');
    
    if (!groupedData[baseUrl]) {
      groupedData[baseUrl] = [];
    }
    groupedData[baseUrl].push(crawledPageInfo);
  });
  
  return groupedData;
}

/** Map Base URLs to Source IDs
 */
function mapPagesToSourceIds(
  groupedData: Record<string, CrawledPageInfo[]>,
  sources: unknown[]
): Record<string, CrawledPageInfo[]> {
  const sourceIdMappedData: Record<string, CrawledPageInfo[]> = {};
  
  sources.forEach(source => {
    const sourceData = source as { id?: string; url?: string };
    const sourceBaseUrl = extractBaseUrl(sourceData.url || '');
    
    // Try base URL match first, then exact URL match
    if (sourceData.id) {
      if (groupedData[sourceBaseUrl]) {
        sourceIdMappedData[sourceData.id] = groupedData[sourceBaseUrl];
      } else if (sourceData.url && groupedData[sourceData.url]) {
        sourceIdMappedData[sourceData.id] = groupedData[sourceData.url];
      }
    }
  });
  
  return sourceIdMappedData;
}

/** Crawled Pages Data Hook
 */
export function useCrawledPagesData(organizationId: string, chatbotConfigId: string, existingConfig: unknown) {
  return useQuery({
    queryKey: ['crawled-pages', organizationId, chatbotConfigId],
    queryFn: async () => {
      const result = await getCrawledPages(organizationId, chatbotConfigId);
      
      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to load crawled pages');
      }

      if (!result.data) {
        return {};
      }

      const groupedData = groupPagesByBaseUrl(result.data);
      const configData = existingConfig as { knowledgeBase?: { websiteSources?: unknown[] } };
      const sources = configData?.knowledgeBase?.websiteSources || [];
      
      return mapPagesToSourceIds(groupedData, sources);
    },
    enabled: !!organizationId && !!chatbotConfigId,
    staleTime: 5000, // AI: Reduced from 30s to 5s for more responsive updates during crawling
    refetchOnWindowFocus: false,
    refetchInterval: false // AI: Disable automatic refetch interval since we use manual invalidation
  });
} 