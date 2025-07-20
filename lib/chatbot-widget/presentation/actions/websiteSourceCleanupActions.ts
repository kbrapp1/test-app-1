'use server';

import { ChatbotWidgetCompositionRoot } from '../../infrastructure/composition/ChatbotWidgetCompositionRoot';
import {
  ActionResult,
  createCleanedKnowledgeBase,
  createErrorResult,
  handleActionError
} from '../utils/websiteSourcesHelpers';

/**
 * Website Source Cleanup Server Actions
 * 
 * AI INSTRUCTIONS:
 * - Handle cleanup and maintenance operations
 * - Preserve organizationId for security
 * - Single responsibility: cleanup operations
 * - Use composition root for dependencies
 */

/**
 * Cleanup Website Sources Action
 * Removes all website sources and their associated knowledge items
 */
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

    const cleanedKnowledgeBase = createCleanedKnowledgeBase(existingConfig.knowledgeBase);
    const updatedConfig = existingConfig.updateKnowledgeBase(cleanedKnowledgeBase);
    await configRepository.update(updatedConfig);
    
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