'use server';

import { ChatbotWidgetCompositionRoot } from '../../infrastructure/composition/ChatbotWidgetCompositionRoot';
import { WebsiteSourceProgressService } from '../../application/services/WebsiteSourceProgressService';
import {
  ActionResult,
  createErrorResult,
  handleActionError,
  updateWebsiteSourceStatus
} from '../utils/websiteSourcesHelpers';

/**
 * Website Source Processing Server Actions
 * 
 * AI INSTRUCTIONS:
 * - Handle crawling and data processing operations
 * - Use WebsiteSourceProgressService for progress tracking
 * - Preserve organizationId for security
 * - Maintain complex crawling logic with proper error handling
 */

// Progress callback interface for server action
interface CrawlProgressCallback {
  onPageFound?: (count: number) => void;
  onPageProcessed?: (count: number) => void;
  onStatusUpdate?: (status: string, message?: string) => void;
}

// Crawled page data structure
type CrawledPageData = {
  url: string;
  title: string;
  content: string;
  status: 'success' | 'failed' | 'skipped';
  statusCode?: number;
  responseTime?: number;
  depth: number;
  crawledAt: Date;
  errorMessage?: string;
};

/**
 * Crawl Website Source Action
 * Processes website crawling with progress tracking
 */
export async function crawlWebsiteSource(
  configId: string,
  organizationId: string,
  sourceId: string,
  _progressCallback?: CrawlProgressCallback
): Promise<ActionResult<{ itemsProcessed: number; crawledPages?: unknown[] }>> {
  try {
    const configRepository = ChatbotWidgetCompositionRoot.getChatbotConfigRepository();
    const websiteService = ChatbotWidgetCompositionRoot.getWebsiteKnowledgeApplicationService();
    const progressService = new WebsiteSourceProgressService();
    
    const existingConfig = await configRepository.findById(configId);
    if (!existingConfig) {
      return createErrorResult<{ itemsProcessed: number; crawledPages?: unknown[] }>('CONFIG_NOT_FOUND', 'Chatbot configuration not found', 'HIGH');
    }

    const websiteSource = existingConfig.knowledgeBase.websiteSources.find(ws => ws.id === sourceId);
    if (!websiteSource) {
      return createErrorResult<{ itemsProcessed: number; crawledPages?: unknown[] }>('SOURCE_NOT_FOUND', 'Website source not found', 'HIGH');
    }
    
    // Update status to 'crawling' when starting
    await updateWebsiteSourceStatus(configId, sourceId, 'crawling');
    
    // Create status callback for progress tracking
    const statusUpdateCallback = progressService.createStatusUpdateCallback(configId, sourceId);
    
    const result = await websiteService.crawlWebsiteSource({
      organizationId,
      chatbotConfigId: configId,
      websiteSource,
      statusUpdateCallback
    });
    
    if (!result.success) {
      await updateWebsiteSourceStatus(configId, sourceId, 'error', 0, result.error?.message);
      return createErrorResult(
        result.error?.code || 'CRAWL_ERROR',
        result.error?.message || 'Crawl failed',
        'HIGH'
      );
    }

    await updateWebsiteSourceStatus(configId, sourceId, 'completed', result.crawledPages?.length || 0);
    
    return {
      success: true,
      data: {
        itemsProcessed: result.crawledPages?.filter(p => p.status === 'success').length || 0,
        crawledPages: result.crawledPages || []
      }
    };
  } catch (error) {
    await updateWebsiteSourceStatus(configId, sourceId, 'error', 0, error instanceof Error ? error.message : 'Unknown error');
    return handleActionError<{ itemsProcessed: number; crawledPages?: unknown[] }>(error, 'crawling website source');
  }
}

/**
 * Get Crawled Pages Action
 * Retrieves crawled page data for a website source
 */
export async function getCrawledPages(
  organizationId: string,
  chatbotConfigId: string,
  sourceUrl?: string
): Promise<ActionResult<Array<CrawledPageData>>> {
  try {
    const websiteService = ChatbotWidgetCompositionRoot.getWebsiteKnowledgeApplicationService();
    
    const result = await websiteService.getCrawledPages(organizationId, chatbotConfigId, sourceUrl);
    
    if (!result.success) {
      return createErrorResult<Array<CrawledPageData>>(
        result.error?.code || 'RETRIEVAL_ERROR',
        result.error?.message || 'Failed to get crawled pages',
        'MEDIUM'
      );
    }
    
    return {
      success: true,
      data: result.crawledPages || []
    };
  } catch (error) {
    return handleActionError<Array<CrawledPageData>>(error, 'retrieving crawled pages');
  }
}