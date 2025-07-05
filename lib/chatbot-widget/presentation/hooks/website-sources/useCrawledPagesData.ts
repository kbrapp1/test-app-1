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
import { getCrawledPages } from '../../actions/websiteSourcesActions';
import { CrawledPageInfo } from '../../components/admin/website-sources/WebsiteSourcesSection';

/**
 * Transform Database Page to UI Format
 * 
 * AI INSTRUCTIONS:
 * - Transform data between layers
 * - Generate unique IDs for UI components
 * - Calculate derived properties
 * - Handle missing data gracefully
 */
function transformPageToUIFormat(page: any): CrawledPageInfo {
  return {
    id: generatePageId(),
    url: page.url,
    title: page.title,
    content: page.content || '',
    category: 'general',
    tags: ['website', 'crawled'],
    depth: page.depth,
    contentLength: page.content ? page.content.length : 0,
    crawledAt: page.crawledAt,
    status: page.status,
    errorMessage: page.errorMessage,
    responseTime: page.responseTime,
    statusCode: page.statusCode
  };
}

/**
 * Generate Unique Page ID
 * 
 * AI INSTRUCTIONS:
 * - Create unique identifiers for UI components
 * - Use timestamp and random string for uniqueness
 * - Follow consistent naming pattern
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
  } catch (error) {
    return url || 'unknown';
  }
}

/**
 * Group Pages by Base URL
 * 
 * AI INSTRUCTIONS:
 * - Group crawled pages by website source
 * - Handle URL parsing errors gracefully
 * - Return organized data structure
 */
function groupPagesByBaseUrl(pages: any[]): Record<string, CrawledPageInfo[]> {
  const groupedData: Record<string, CrawledPageInfo[]> = {};
  
  pages.forEach(page => {
    const crawledPageInfo = transformPageToUIFormat(page);
    const baseUrl = extractBaseUrl(page.url);
    
    if (!groupedData[baseUrl]) {
      groupedData[baseUrl] = [];
    }
    groupedData[baseUrl].push(crawledPageInfo);
  });
  
  return groupedData;
}

/**
 * Map Base URLs to Source IDs
 * 
 * AI INSTRUCTIONS:
 * - Map grouped pages to website source IDs
 * - Handle source URL parsing errors
 * - Return data structure compatible with UI components
 */
function mapPagesToSourceIds(
  groupedData: Record<string, CrawledPageInfo[]>,
  sources: any[]
): Record<string, CrawledPageInfo[]> {
  const sourceIdMappedData: Record<string, CrawledPageInfo[]> = {};
  
  sources.forEach(source => {
    const sourceBaseUrl = extractBaseUrl(source.url);
    
    // Try base URL match first, then exact URL match
    if (groupedData[sourceBaseUrl]) {
      sourceIdMappedData[source.id] = groupedData[sourceBaseUrl];
    } else if (groupedData[source.url]) {
      sourceIdMappedData[source.id] = groupedData[source.url];
    }
  });
  
  return sourceIdMappedData;
}

/**
 * Crawled Pages Data Hook
 * 
 * AI INSTRUCTIONS:
 * - Handle data fetching and transformation
 * - Manage loading and error states
 * - Return processed data for UI consumption
 */
export function useCrawledPagesData(organizationId: string, chatbotConfigId: string, existingConfig: any) {
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
      const sources = existingConfig?.knowledgeBase?.websiteSources || [];
      
      return mapPagesToSourceIds(groupedData, sources);
    },
    enabled: !!organizationId && !!chatbotConfigId,
    staleTime: 30000,
    refetchOnWindowFocus: false
  });
} 