'use server';

import { revalidatePath } from 'next/cache';
import { ChatbotWidgetCompositionRoot } from '../../infrastructure/composition/ChatbotWidgetCompositionRoot';
import { WebsiteSource, WebsiteCrawlSettings, KnowledgeBase } from '../../domain/value-objects/ai-configuration/KnowledgeBase';
import { DomainError, BusinessRuleViolationError } from '../../domain/errors/BusinessRuleViolationError';

/**
 * Website Sources Server Actions
 * 
 * AI INSTRUCTIONS:
 * - Handle user requests and delegate to application services
 * - Proper error handling with domain-specific errors
 * - Only export async functions
 * - Revalidate paths after mutations
 * - Follow @golden-rule patterns exactly
 * - Use ChatbotWidgetCompositionRoot as single source of dependencies
 */

export interface WebsiteSourceFormData {
  url: string;
  name: string;
  description?: string;
  maxPages?: number;
  maxDepth?: number;
  respectRobotsTxt?: boolean;
}

export interface ActionResult<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    severity: string;
  };
}

export async function addWebsiteSource(
  configId: string,
  organizationId: string,
  formData: WebsiteSourceFormData
): Promise<ActionResult> {
  try {
    const configRepository = ChatbotWidgetCompositionRoot.getChatbotConfigRepository();
    
    // Get existing config
    const existingConfig = await configRepository.findById(configId);
    if (!existingConfig) {
      return {
        success: false,
        error: {
          code: 'CONFIG_NOT_FOUND',
          message: 'Chatbot configuration not found',
          severity: 'HIGH'
        }
      };
    }

    // Create new website source
    const websiteSource: WebsiteSource = {
      id: `ws_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      url: formData.url,
      name: formData.name,
      description: formData.description,
      isActive: true,
      status: 'pending',
      crawlSettings: {
        maxPages: formData.maxPages || 50,
        maxDepth: formData.maxDepth || 3,
        includePatterns: [],
        excludePatterns: [],
        respectRobotsTxt: formData.respectRobotsTxt ?? true,
        crawlFrequency: 'manual',
        includeImages: false,
        includePDFs: true
      }
    };

    // Add to knowledge base
    const updatedKnowledgeBase = existingConfig.knowledgeBase.addWebsiteSource(websiteSource);
    const updatedConfig = existingConfig.updateKnowledgeBase(updatedKnowledgeBase);
    
    await configRepository.update(updatedConfig);
    
    revalidatePath('/ai-playground/chatbot-widget/website-sources');
    revalidatePath('/ai-playground/chatbot-widget/knowledge');
    
    return { success: true };
  } catch (error) {
    if (error instanceof DomainError) {
      return {
        success: false,
        error: {
          code: error.code,
          message: error.message,
          severity: error.severity
        }
      };
    }
    
    // Log the actual error for debugging
    return {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred while adding website source',
        severity: 'HIGH'
      }
    };
  }
}

export async function removeWebsiteSource(
  configId: string,
  organizationId: string,
  sourceId: string
): Promise<ActionResult> {
  try {
    const configRepository = ChatbotWidgetCompositionRoot.getChatbotConfigRepository();
    const knowledgeRetrievalService = ChatbotWidgetCompositionRoot.getVectorKnowledgeApplicationService();
    
    // Get existing config
    const existingConfig = await configRepository.findById(configId);
    if (!existingConfig) {
      return {
        success: false,
        error: {
          code: 'CONFIG_NOT_FOUND',
          message: 'Chatbot configuration not found',
          severity: 'HIGH'
        }
      };
    }

    // Find the website source to get its URL for cleanup
    const websiteSource = existingConfig.knowledgeBase.websiteSources.find(ws => ws.id === sourceId);
    
    if (!websiteSource) {
      return {
        success: false,
        error: {
          code: 'SOURCE_NOT_FOUND',
          message: 'Website source not found',
          severity: 'HIGH'
        }
      };
    }

    // Clean up knowledge items and vectors for this website source
    await knowledgeRetrievalService.deleteKnowledgeItemsBySource(
      organizationId,
      configId,
      'website_crawled',
      websiteSource.url
    );

    // Remove from knowledge base configuration
    const updatedKnowledgeBase = existingConfig.knowledgeBase.removeWebsiteSource(sourceId);
    const updatedConfig = existingConfig.updateKnowledgeBase(updatedKnowledgeBase);
    
    await configRepository.update(updatedConfig);
    
    revalidatePath('/ai-playground/chatbot-widget/website-sources');
    revalidatePath('/ai-playground/chatbot-widget/knowledge');
    
    return { success: true };
  } catch (error) {
    if (error instanceof DomainError) {
      return {
        success: false,
        error: {
          code: error.code,
          message: error.message,
          severity: error.severity
        }
      };
    }
    
    return {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred while removing website source',
        severity: 'HIGH'
      }
    };
  }
}

export async function crawlWebsiteSource(
  configId: string,
  organizationId: string,
  sourceId: string
): Promise<ActionResult<{ itemsProcessed: number; crawledPages?: any[] }>> {
  try {
    const configRepository = ChatbotWidgetCompositionRoot.getChatbotConfigRepository();
    const applicationService = ChatbotWidgetCompositionRoot.getWebsiteKnowledgeApplicationService();
    
    // Get existing config
    const existingConfig = await configRepository.findById(configId);
    
    if (!existingConfig) {
      return {
        success: false,
        error: {
          code: 'CONFIG_NOT_FOUND',
          message: 'Chatbot configuration not found',
          severity: 'HIGH'
        }
      };
    }

    // Find the website source
    const websiteSource = existingConfig.knowledgeBase.websiteSources.find(ws => ws.id === sourceId);
    
    if (!websiteSource) {
      return {
        success: false,
        error: {
          code: 'SOURCE_NOT_FOUND',
          message: 'Website source not found',
          severity: 'HIGH'
        }
      };
    }
    
    const result = await applicationService.crawlWebsiteSource({
      organizationId,
      chatbotConfigId: configId,
      websiteSource
    });
    
    if (!result.success) {
      return {
        success: false,
        error: {
          code: result.error?.code || 'CRAWL_ERROR',
          message: result.error?.message || 'Crawl failed',
          severity: 'HIGH'
        }
      };
    }
    
    revalidatePath('/ai-playground/chatbot-widget/website-sources');
    revalidatePath('/ai-playground/chatbot-widget/knowledge');
    
    return { 
      success: true, 
      data: { 
        itemsProcessed: result.crawledPages?.filter(page => page.status === 'success').length || 0,
        crawledPages: result.crawledPages || []
      }
    };
  } catch (error) {    
    if (error instanceof DomainError) {
      return {
        success: false,
        error: {
          code: error.code,
          message: error.message,
          severity: error.severity
        }
      };
    }
    
    return {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred while crawling website',
        severity: 'HIGH'
      }
    };
  }
}

export async function crawlAllWebsiteSources(
  configId: string,
  organizationId: string
): Promise<ActionResult<{ totalItemsProcessed: number; sourcesProcessed: number }>> {
  try {
    const configRepository = ChatbotWidgetCompositionRoot.getChatbotConfigRepository();
    const applicationService = ChatbotWidgetCompositionRoot.getWebsiteKnowledgeApplicationService();
    
    // Get existing config
    const existingConfig = await configRepository.findById(configId);
    if (!existingConfig) {
      return {
        success: false,
        error: {
          code: 'CONFIG_NOT_FOUND',
          message: 'Chatbot configuration not found',
          severity: 'HIGH'
        }
      };
    }

    const websiteSources = existingConfig.knowledgeBase.getActiveWebsiteSources();
    
    const result = await applicationService.updateWebsiteKnowledge({
      organizationId,
      chatbotConfigId: configId,
      websiteSources,
      forceRefresh: true
    });
    
    revalidatePath('/ai-playground/chatbot-widget/website-sources');
    revalidatePath('/ai-playground/chatbot-widget/knowledge');
    
    return { 
      success: true, 
      data: { 
        totalItemsProcessed: result.totalKnowledgeItems,
        sourcesProcessed: result.successfulSources
      }
    };
  } catch (error) {
    if (error instanceof DomainError) {
      return {
        success: false,
        error: {
          code: error.code,
          message: error.message,
          severity: error.severity
        }
      };
    }
    
    return {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred while crawling all websites',
        severity: 'HIGH'
      }
    };
  }
}

export async function updateWebsiteSource(
  configId: string,
  organizationId: string,
  sourceId: string,
  formData: WebsiteSourceFormData
): Promise<ActionResult> {
  try {
    const configRepository = ChatbotWidgetCompositionRoot.getChatbotConfigRepository();
    
    // Get existing config
    const existingConfig = await configRepository.findById(configId);
    if (!existingConfig) {
      return {
        success: false,
        error: {
          code: 'CONFIG_NOT_FOUND',
          message: 'Chatbot configuration not found',
          severity: 'HIGH'
        }
      };
    }

    // Update website source
    const updatedKnowledgeBase = existingConfig.knowledgeBase.updateWebsiteSource(sourceId, {
      url: formData.url,
      name: formData.name,
      description: formData.description,
      crawlSettings: {
        maxPages: formData.maxPages || 50,
        maxDepth: formData.maxDepth || 3,
        includePatterns: [],
        excludePatterns: [],
        respectRobotsTxt: formData.respectRobotsTxt ?? true,
        crawlFrequency: 'manual',
        includeImages: false,
        includePDFs: true
      }
    });
    
    const updatedConfig = existingConfig.updateKnowledgeBase(updatedKnowledgeBase);
    await configRepository.update(updatedConfig);
    
    revalidatePath('/ai-playground/chatbot-widget/website-sources');
    revalidatePath('/ai-playground/chatbot-widget/knowledge');
    
    return { success: true };
  } catch (error) {
    if (error instanceof DomainError) {
      return {
        success: false,
        error: {
          code: error.code,
          message: error.message,
          severity: error.severity
        }
      };
    }
    
    return {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred while updating website source',
        severity: 'HIGH'
      }
    };
  }
}

export async function debugCleanupWebsiteSources(
  configId: string,
  organizationId: string
): Promise<ActionResult> {
  try {
    const configRepository = ChatbotWidgetCompositionRoot.getChatbotConfigRepository();
    const knowledgeRetrievalService = ChatbotWidgetCompositionRoot.getVectorKnowledgeApplicationService();
    
    // Get existing config
    const existingConfig = await configRepository.findById(configId);
    if (!existingConfig) {
      return {
        success: false,
        error: {
          code: 'CONFIG_NOT_FOUND',
          message: 'Chatbot configuration not found',
          severity: 'HIGH'
        }
      };
    }

    // Clean up ALL website-crawled knowledge items and vectors
    const deletedItemsCount = await knowledgeRetrievalService.deleteKnowledgeItemsBySource(
      organizationId,
      configId,
      'website_crawled'
    );

    // Create a new knowledge base with empty website sources
    const cleanedKnowledgeBase = KnowledgeBase.create({
      companyInfo: existingConfig.knowledgeBase.companyInfo,
      productCatalog: existingConfig.knowledgeBase.productCatalog,
      faqs: existingConfig.knowledgeBase.faqs,
      supportDocs: existingConfig.knowledgeBase.supportDocs,
      complianceGuidelines: existingConfig.knowledgeBase.complianceGuidelines,
      websiteSources: [] // Clear all website sources
    });

    const updatedConfig = existingConfig.updateKnowledgeBase(cleanedKnowledgeBase);
    await configRepository.update(updatedConfig);
    
    revalidatePath('/ai-playground/chatbot-widget/website-sources');
    revalidatePath('/ai-playground/chatbot-widget/knowledge');
    
    return { 
      success: true,
      data: { 
        message: 'Website sources cleared successfully',
        deletedItems: deletedItemsCount
      }
    };
  } catch (error) {
    if (error instanceof DomainError) {
      return {
        success: false,
        error: {
          code: error.code,
          message: error.message,
          severity: error.severity
        }
      };
    }
    
    return {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred during cleanup',
        severity: 'HIGH'
      }
    };
  }
} 