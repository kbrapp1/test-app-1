'use server';

import { revalidatePath as _revalidatePath } from 'next/cache';
import { ChatbotWidgetCompositionRoot } from '../../infrastructure/composition/ChatbotWidgetCompositionRoot';
import { WebsiteSource as _WebsiteSource } from '../../domain/value-objects/ai-configuration/KnowledgeBase';
import { DomainError as _DomainError } from '../../domain/errors/ChatbotWidgetDomainErrors';
import { 
  createWebsiteSourceFromFormData,
  createErrorResult,
  handleActionError,
  revalidateWebsiteSourcesPaths,
  updateWebsiteSourceStatus,
  createCrawlSettingsFromFormData,
  createCleanedKnowledgeBase,
  WebsiteSourceFormData,
  ActionResult
} from '../utils/websiteSourcesHelpers';

/**
 * AI Instructions: Server actions for website source management
 * - Handle user requests and delegate to appropriate services
 * - Maintain single responsibility per function
 * - Use composition root for dependencies
 * - Follow DDD principles with proper error handling
 */

export type { WebsiteSourceFormData, ActionResult } from '../utils/websiteSourcesHelpers';

// Add Website Source Action
export async function addWebsiteSource(
  configId: string,
  organizationId: string,
  formData: WebsiteSourceFormData
): Promise<ActionResult> {
  try {
    const configRepository = ChatbotWidgetCompositionRoot.getChatbotConfigRepository();
    const existingConfig = await configRepository.findById(configId);
    if (!existingConfig) {
      return createErrorResult<{ itemsProcessed: number; crawledPages?: unknown[] }>('CONFIG_NOT_FOUND', 'Chatbot configuration not found', 'HIGH');
    }

    const websiteSource = createWebsiteSourceFromFormData(formData);
    const updatedKnowledgeBase = existingConfig.knowledgeBase.addWebsiteSource(websiteSource);
    const updatedConfig = existingConfig.updateKnowledgeBase(updatedKnowledgeBase);
    
    await configRepository.update(updatedConfig);
    revalidateWebsiteSourcesPaths();
    return { success: true };
  } catch (error) {
    return handleActionError(error, 'adding website source');
  }
}

// Remove Website Source Action
export async function removeWebsiteSource(
  configId: string,
  organizationId: string,
  sourceId: string
): Promise<ActionResult> {
  try {
    const configRepository = ChatbotWidgetCompositionRoot.getChatbotConfigRepository();
    const vectorService = ChatbotWidgetCompositionRoot.getVectorKnowledgeApplicationService();
    const existingConfig = await configRepository.findById(configId);
    if (!existingConfig) {
      return createErrorResult<{ itemsProcessed: number; crawledPages?: unknown[] }>('CONFIG_NOT_FOUND', 'Chatbot configuration not found', 'HIGH');
    }

    const websiteSource = existingConfig.knowledgeBase.websiteSources.find(ws => ws.id === sourceId);
    if (!websiteSource) {
      return createErrorResult<{ itemsProcessed: number; crawledPages?: unknown[] }>('SOURCE_NOT_FOUND', 'Website source not found', 'HIGH');
    }

    await vectorService.deleteKnowledgeItemsBySource(organizationId, configId, 'website_crawled', websiteSource.url);
    const updatedKnowledgeBase = existingConfig.knowledgeBase.removeWebsiteSource(sourceId);
    const updatedConfig = existingConfig.updateKnowledgeBase(updatedKnowledgeBase);
    
    await configRepository.update(updatedConfig);
    revalidateWebsiteSourcesPaths();
    return { success: true };
  } catch (error) {
    return handleActionError(error, 'removing website source');
  }
}

// Crawl Website Source Action
export async function crawlWebsiteSource(
  configId: string,
  organizationId: string,
  sourceId: string
): Promise<ActionResult<{ itemsProcessed: number; crawledPages?: unknown[] }>> {
  try {
    const configRepository = ChatbotWidgetCompositionRoot.getChatbotConfigRepository();
    const websiteService = ChatbotWidgetCompositionRoot.getWebsiteKnowledgeApplicationService();
    
    const existingConfig = await configRepository.findById(configId);
    if (!existingConfig) {
      return createErrorResult<{ itemsProcessed: number; crawledPages?: unknown[] }>('CONFIG_NOT_FOUND', 'Chatbot configuration not found', 'HIGH');
    }

    const websiteSource = existingConfig.knowledgeBase.websiteSources.find(ws => ws.id === sourceId);
    if (!websiteSource) {
      return createErrorResult<{ itemsProcessed: number; crawledPages?: unknown[] }>('SOURCE_NOT_FOUND', 'Website source not found', 'HIGH');
    }
    
    // AI: Update status to 'crawling' when starting
    await updateWebsiteSourceStatus(configId, sourceId, 'crawling');
    
    // AI: Create status callback for vectorization progress tracking
    const statusUpdateCallback = async (status: 'vectorizing', progress: { vectorizedItems: number; totalItems: number; currentItem: string }) => {
      if (status === 'vectorizing') {
        // Update website source status to 'vectorizing' with progress metadata
        const config = await configRepository.findById(configId);
        if (config) {
          const updatedKnowledgeBase = config.knowledgeBase.updateWebsiteSource(sourceId, {
            status: 'vectorizing',
            pageCount: progress.vectorizedItems, // Use vectorizedItems as progress indicator
            errorMessage: `Vectorizing ${progress.vectorizedItems}/${progress.totalItems}: ${progress.currentItem}`
          });
          const updatedConfig = config.updateKnowledgeBase(updatedKnowledgeBase);
          await configRepository.update(updatedConfig);
        }
      }
    };
    
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
    revalidateWebsiteSourcesPaths();
    
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

// Update Website Source Action
export async function updateWebsiteSource(
  configId: string,
  organizationId: string,
  sourceId: string,
  formData: WebsiteSourceFormData
): Promise<ActionResult> {
  try {
    const configRepository = ChatbotWidgetCompositionRoot.getChatbotConfigRepository();
    
    const existingConfig = await configRepository.findById(configId);
    if (!existingConfig) {
      return createErrorResult<{ itemsProcessed: number; crawledPages?: unknown[] }>('CONFIG_NOT_FOUND', 'Chatbot configuration not found', 'HIGH');
    }

    const updatedKnowledgeBase = existingConfig.knowledgeBase.updateWebsiteSource(sourceId, {
      url: formData.url,
      name: formData.name,
      description: formData.description,
      crawlSettings: createCrawlSettingsFromFormData(formData)
    });
    
    const updatedConfig = existingConfig.updateKnowledgeBase(updatedKnowledgeBase);
    await configRepository.update(updatedConfig);
    
    revalidateWebsiteSourcesPaths();
    return { success: true };
  } catch (error) {
    return handleActionError(error, 'updating website source');
  }
}

// Get Crawled Pages Action
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

// Cleanup Website Sources Action
export async function cleanupWebsiteSources(
  configId: string,
  organizationId: string
): Promise<ActionResult<{ deletedItems: number; message: string }>> {
  try {
    const configRepository = ChatbotWidgetCompositionRoot.getChatbotConfigRepository();
    const vectorService = ChatbotWidgetCompositionRoot.getVectorKnowledgeApplicationService();
    
    const existingConfig = await configRepository.findById(configId);
    if (!existingConfig) {
      return createErrorResult<{ deletedItems: number; message: string }>('CONFIG_NOT_FOUND', 'Chatbot configuration not found', 'HIGH');
    }

    const deletedItemsCount = await vectorService.deleteKnowledgeItemsBySource(organizationId, configId, 'website_crawled');

    const cleanedKnowledgeBase = createCleanedKnowledgeBase(existingConfig.knowledgeBase as any);
    const updatedConfig = existingConfig.updateKnowledgeBase(cleanedKnowledgeBase as any);
    await configRepository.update(updatedConfig);
    
    revalidateWebsiteSourcesPaths();
    return {
      success: true,
      data: {
        deletedItems: deletedItemsCount,
        message: 'Website sources cleaned up successfully'
      }
    };
  } catch (error) {
    return handleActionError<{ deletedItems: number; message: string }>(error, 'cleaning up website sources');
  }
} 