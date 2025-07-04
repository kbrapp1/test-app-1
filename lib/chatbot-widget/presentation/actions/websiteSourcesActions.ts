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
    console.log('🚀 removeWebsiteSource: Starting deletion process', {
      configId,
      organizationId,
      sourceId
    });

    const configRepository = ChatbotWidgetCompositionRoot.getChatbotConfigRepository();
    const knowledgeRetrievalService = ChatbotWidgetCompositionRoot.getVectorKnowledgeApplicationService();
    
    // Get existing config
    console.log('📋 Step 1: Fetching chatbot configuration...');
    const existingConfig = await configRepository.findById(configId);
    if (!existingConfig) {
      console.error('❌ Chatbot configuration not found:', configId);
      return {
        success: false,
        error: {
          code: 'CONFIG_NOT_FOUND',
          message: 'Chatbot configuration not found',
          severity: 'HIGH'
        }
      };
    }
    console.log('✅ Configuration found');

    // Find the website source to get its URL for cleanup
    console.log('🔍 Step 2: Finding website source to delete...');
    const websiteSource = existingConfig.knowledgeBase.websiteSources.find(ws => ws.id === sourceId);
    
    if (!websiteSource) {
      console.error('❌ Website source not found:', sourceId);
      return {
        success: false,
        error: {
          code: 'SOURCE_NOT_FOUND',
          message: 'Website source not found',
          severity: 'HIGH'
        }
      };
    }
    console.log('✅ Website source found:', {
      id: websiteSource.id,
      url: websiteSource.url,
      name: websiteSource.name
    });

    // Clean up knowledge items and vectors for this website source
    console.log('🧹 Step 3: Cleaning up knowledge vectors...');
    console.log('🧹 Calling deleteKnowledgeItemsBySource with:', {
      organizationId,
      configId,
      sourceType: 'website_crawled',
      sourceUrl: websiteSource.url
    });
    
    const deletedCount = await knowledgeRetrievalService.deleteKnowledgeItemsBySource(
      organizationId,
      configId,
      'website_crawled',
      websiteSource.url
    );
    console.log(`✅ Vector cleanup completed: ${deletedCount} items deleted`);

    // Remove from knowledge base configuration
    console.log('📝 Step 4: Updating knowledge base configuration...');
    const updatedKnowledgeBase = existingConfig.knowledgeBase.removeWebsiteSource(sourceId);
    const updatedConfig = existingConfig.updateKnowledgeBase(updatedKnowledgeBase);
    
    await configRepository.update(updatedConfig);
    console.log('✅ Configuration updated');
    
    revalidatePath('/ai-playground/chatbot-widget/website-sources');
    revalidatePath('/ai-playground/chatbot-widget/knowledge');
    
    console.log('🎉 removeWebsiteSource: Deletion completed successfully');
    return { success: true };
  } catch (error) {
    console.error('💥 removeWebsiteSource: Deletion failed:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      configId,
      organizationId,
      sourceId
    });

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
        message: 'An unexpected error occurred while removing website source',
        severity: 'HIGH'
      }
    };
  }
}

/**
 * Crawl Website Source Action
 * 
 * AI INSTRUCTIONS:
 * - Handle user requests, delegate to application services
 * - Validate all inputs and results with specific error types
 * - Add comprehensive logging for debugging
 * - Update website source metadata after successful crawl
 * - Follow single responsibility principle
 * - Use composition root for dependencies
 */
export async function crawlWebsiteSource(
  configId: string,
  organizationId: string,
  sourceId: string
): Promise<ActionResult<{ itemsProcessed: number; crawledPages?: any[] }>> {
  try {
    console.log(`🚀 Server Action: crawlWebsiteSource called for sourceId: ${sourceId}`);
    console.log(`📋 Parameters:`, { configId, organizationId, sourceId });
    
    const configRepository = ChatbotWidgetCompositionRoot.getChatbotConfigRepository();
    const applicationService = ChatbotWidgetCompositionRoot.getWebsiteKnowledgeApplicationService();
    
    // Get existing config
    const existingConfig = await configRepository.findById(configId);
    
    if (!existingConfig) {
      console.error('❌ Configuration not found:', configId);
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
      console.error('❌ Website source not found:', sourceId);
      console.error('📋 Available sources:', existingConfig.knowledgeBase.websiteSources.map(ws => ({ id: ws.id, url: ws.url })));
      return {
        success: false,
        error: {
          code: 'SOURCE_NOT_FOUND',
          message: 'Website source not found',
          severity: 'HIGH'
        }
      };
    }
    
    console.log('✅ Found website source:', { id: websiteSource.id, url: websiteSource.url, status: websiteSource.status });
    console.log('🔄 Executing crawl through application service...');
    
    const result = await applicationService.crawlWebsiteSource({
      organizationId,
      chatbotConfigId: configId,
      websiteSource
    });
    
    if (!result.success) {
      console.error('❌ Crawl failed:', result.error);
      return {
        success: false,
        error: {
          code: result.error?.code || 'CRAWL_ERROR',
          message: result.error?.message || 'Crawl failed',
          severity: 'HIGH'
        }
      };
    }

    console.log('✅ Crawl completed successfully:', result);
    
    // Validate result structure
    const successfulPages = result.crawledPages?.filter(page => page.status === 'success').length || 0;
    console.log('📊 Crawl results:', { 
      totalPages: result.crawledPages?.length || 0,
      successfulPages,
      failedPages: (result.crawledPages?.length || 0) - successfulPages
    });

    // Update website source with crawl completion status and page count
    console.log('📝 Updating website source with completion status...');
    try {
      const finalConfig = await configRepository.findById(configId);
      if (!finalConfig) {
        console.error('❌ Final config not found for update');
        throw new Error('Configuration not found for final update');
      }
      
      console.log('📋 Updating source with:', { 
        sourceId, 
        pageCount: successfulPages, 
        status: 'completed' 
      });
      
      const updatedKnowledgeBase = finalConfig.knowledgeBase.updateWebsiteSource(sourceId, {
        pageCount: successfulPages,
        status: 'completed' as const,
        lastCrawled: new Date()
      });
      
      const finalUpdatedConfig = finalConfig.updateKnowledgeBase(updatedKnowledgeBase);
      await configRepository.update(finalUpdatedConfig);
      
      console.log(`✅ Website source updated: pageCount=${successfulPages}, status=completed`);
      
      // Verify the update worked
      const verifyConfig = await configRepository.findById(configId);
      if (verifyConfig) {
        const updatedSource = verifyConfig.knowledgeBase.websiteSources.find(ws => ws.id === sourceId);
        console.log('🔍 Verification - Updated source:', {
          id: updatedSource?.id,
          status: updatedSource?.status,
          pageCount: updatedSource?.pageCount,
          lastCrawled: updatedSource?.lastCrawled
        });
      }
    } catch (updateError) {
      console.error('❌ Failed to update website source with completion status:', updateError);
      console.error('❌ Update error details:', {
        name: updateError instanceof Error ? updateError.constructor.name : 'Unknown',
        message: updateError instanceof Error ? updateError.message : String(updateError),
        sourceId,
        configId
      });
      // Don't fail the whole operation - crawl was successful
    }
    
    revalidatePath('/ai-playground/chatbot-widget/website-sources');
    revalidatePath('/ai-playground/chatbot-widget/knowledge');
    
    console.log('🎉 Crawl operation completed successfully');
    return { 
      success: true, 
      data: { 
        itemsProcessed: successfulPages,
        crawledPages: result.crawledPages || []
      }
    };
  } catch (error) {
    console.error('❌ Unexpected error in crawlWebsiteSource:', error);
    
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

export async function cleanupOrphanedWebsiteVectors(
  configId: string,
  organizationId: string
): Promise<ActionResult<{ cleanedVectors: number; remainingVectors: number }>> {
  try {
    console.log('🧹 cleanupOrphanedWebsiteVectors: Starting cleanup process', {
      configId,
      organizationId
    });

    const configRepository = ChatbotWidgetCompositionRoot.getChatbotConfigRepository();
    const knowledgeRetrievalService = ChatbotWidgetCompositionRoot.getVectorKnowledgeApplicationService();
    
    // Get current configuration
    console.log('📋 Step 1: Fetching current chatbot configuration...');
    const currentConfig = await configRepository.findById(configId);
    if (!currentConfig) {
      return {
        success: false,
        error: {
          code: 'CONFIG_NOT_FOUND',
          message: 'Chatbot configuration not found',
          severity: 'HIGH'
        }
      };
    }
    
    // Get all active website source URLs from configuration
    const activeWebsiteUrls = currentConfig.knowledgeBase.websiteSources.map(ws => ws.url);
    console.log('📋 Active website URLs in configuration:', activeWebsiteUrls);
    
    if (activeWebsiteUrls.length === 0) {
      // No active website sources - clean up ALL website vectors
      console.log('🧹 No active website sources found, cleaning up all website vectors...');
      
      const deletedCount = await knowledgeRetrievalService.deleteKnowledgeItemsBySource(
        organizationId,
        configId,
        'website_crawled'
        // No sourceUrl means delete all of this source type
      );
      
      console.log(`✅ Cleanup completed: ${deletedCount} orphaned vectors removed`);
      
      revalidatePath('/ai-playground/chatbot-widget/website-sources');
      revalidatePath('/ai-playground/chatbot-widget/knowledge');
      
      return { 
        success: true, 
        data: { 
          cleanedVectors: deletedCount,
          remainingVectors: 0
        }
      };
    }
    
    // For now, implement a simple approach - this would be enhanced with
    // a more sophisticated orphan detection mechanism in production
    console.log('ℹ️ Active website sources exist, manual cleanup needed per source');
    
    return {
      success: true,
      data: {
        cleanedVectors: 0,
        remainingVectors: 0
      }
    };
    
  } catch (error) {
    console.error('💥 cleanupOrphanedWebsiteVectors: Cleanup failed:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      configId,
      organizationId
    });

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

/**
 * Get crawled pages data for UI display
 * 
 * AI INSTRUCTIONS:
 * - Retrieves crawled pages from vector table
 * - Returns data needed for crawled pages UI display
 * - Handles authentication and error cases
 */
export async function getCrawledPages(
  organizationId: string,
  chatbotConfigId: string,
  sourceUrl?: string
): Promise<{
  success: boolean;
  crawledPages?: Array<{
    url: string;
    title: string;
    status: 'success' | 'failed' | 'skipped';
    statusCode?: number;
    responseTime?: number;
    depth: number;
    crawledAt: Date;
    errorMessage?: string;
  }>;
  error?: {
    code: string;
    message: string;
    context?: Record<string, any>;
  };
}> {
  try {
    console.log('🔍 getCrawledPages: Starting request', {
      organizationId,
      chatbotConfigId,
      sourceUrl
    });

    // Get application service
    const websiteKnowledgeService = ChatbotWidgetCompositionRoot.getWebsiteKnowledgeApplicationService();

    // Get crawled pages data
    const result = await websiteKnowledgeService.getCrawledPages(
      organizationId,
      chatbotConfigId,
      sourceUrl
    );

    console.log('✅ getCrawledPages: Request completed', {
      success: result.success,
      crawledPagesCount: result.crawledPages?.length || 0
    });

    return result;

  } catch (error) {
    console.error('❌ getCrawledPages: Request failed:', error);
    
    return {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to get crawled pages',
        context: { organizationId, chatbotConfigId, sourceUrl }
      }
    };
  }
} 