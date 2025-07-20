'use server';

import { ChatbotWidgetCompositionRoot } from '../../infrastructure/composition/ChatbotWidgetCompositionRoot';
import {
  ActionResult,
  createWebsiteSourceFromFormData,
  createCrawlSettingsFromFormData,
  createErrorResult,
  handleActionError,
  WebsiteSourceFormData
} from '../utils/websiteSourcesHelpers';

/**
 * Website Source CRUD Server Actions
 * 
 * AI INSTRUCTIONS:
 * - Handle basic CRUD operations for website sources
 * - Maintain single responsibility per function
 * - Preserve organizationId for security
 * - Use composition root for dependencies
 */

export type { ActionResult, WebsiteSourceFormData } from '../utils/websiteSourcesHelpers';

/**
 * Add Website Source Action
 * Creates a new website source in the knowledge base
 */
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
    return { success: true };
  } catch (error) {
    return handleActionError(error, 'adding website source');
  }
}

/**
 * Remove Website Source Action  
 * Removes a website source and its associated knowledge items
 */
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
    return { success: true };
  } catch (error) {
    return handleActionError(error, 'removing website source');
  }
}

/**
 * Update Website Source Action
 * Updates an existing website source configuration
 */
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
    
    return { success: true };
  } catch (error) {
    return handleActionError(error, 'updating website source');
  }
}