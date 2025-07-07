'use server';

import { revalidatePath } from 'next/cache';
import { ChatbotWidgetCompositionRoot } from '../../infrastructure/composition/ChatbotWidgetCompositionRoot';
import { WebsiteSource } from '../../domain/value-objects/ai-configuration/KnowledgeBase';
import { DomainError } from '../../domain/errors/ChatbotWidgetDomainErrors';
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
      return createErrorResult('CONFIG_NOT_FOUND', 'Chatbot configuration not found', 'HIGH');
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
      return createErrorResult('CONFIG_NOT_FOUND', 'Chatbot configuration not found', 'HIGH');
    }

    const websiteSource = existingConfig.knowledgeBase.websiteSources.find(ws => ws.id === sourceId);
    if (!websiteSource) {
      return createErrorResult('SOURCE_NOT_FOUND', 'Website source not found', 'HIGH');
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
): Promise<ActionResult<{ itemsProcessed: number; crawledPages?: any[] }>> {
  try {
    const configRepository = ChatbotWidgetCompositionRoot.getChatbotConfigRepository();
    const websiteService = ChatbotWidgetCompositionRoot.getWebsiteKnowledgeApplicationService();
    
    const existingConfig = await configRepository.findById(configId);
    if (!existingConfig) {
      return createErrorResult('CONFIG_NOT_FOUND', 'Chatbot configuration not found', 'HIGH');
    }

    const websiteSource = existingConfig.knowledgeBase.websiteSources.find(ws => ws.id === sourceId);
    if (!websiteSource) {
      return createErrorResult('SOURCE_NOT_FOUND', 'Website source not found', 'HIGH');
    }
    
    const result = await websiteService.crawlWebsiteSource({
      organizationId,
      chatbotConfigId: configId,
      websiteSource
    });
    
    if (!result.success) {
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
    return handleActionError(error, 'crawling website source');
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
      return createErrorResult('CONFIG_NOT_FOUND', 'Chatbot configuration not found', 'HIGH');
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
export async function getCrawledPages(
  organizationId: string,
  chatbotConfigId: string,
  sourceUrl?: string
): Promise<ActionResult<Array<{
  url: string;
  title: string;
  content: string;
  status: 'success' | 'failed' | 'skipped';
  statusCode?: number;
  responseTime?: number;
  depth: number;
  crawledAt: Date;
  errorMessage?: string;
}>>> {
  try {
    const websiteService = ChatbotWidgetCompositionRoot.getWebsiteKnowledgeApplicationService();
    
    const result = await websiteService.getCrawledPages(organizationId, chatbotConfigId, sourceUrl);
    
    if (!result.success) {
      return createErrorResult(
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
    return handleActionError(error, 'retrieving crawled pages');
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
      return createErrorResult('CONFIG_NOT_FOUND', 'Chatbot configuration not found', 'HIGH');
    }

    const deletedItemsCount = await vectorService.deleteKnowledgeItemsBySource(organizationId, configId, 'website_crawled');

    const cleanedKnowledgeBase = createCleanedKnowledgeBase(existingConfig.knowledgeBase);
    const updatedConfig = existingConfig.updateKnowledgeBase(cleanedKnowledgeBase);
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
    return handleActionError(error, 'cleaning up website sources');
  }
} 