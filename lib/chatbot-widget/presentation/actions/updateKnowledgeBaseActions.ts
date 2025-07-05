'use server';

/**
 * Knowledge Base Update Actions
 * 
 * AI INSTRUCTIONS:
 * - Handle user requests, delegate to application services
 * - Follow single responsibility principle  
 * - Use composition root for dependencies
 * - Validate inputs with domain-specific errors
 * - Keep actions focused and under 250 lines
 * - No redundant code - use websiteSourcesActions.crawlWebsiteSource for website crawling
 */

import { ChatbotWidgetCompositionRoot } from '../../infrastructure/composition/ChatbotWidgetCompositionRoot';
import { KnowledgeItem } from '../../domain/services/interfaces/IKnowledgeRetrievalService';
import { BusinessRuleViolationError } from '../../domain/errors/ChatbotWidgetDomainErrors';



/**
 * Search Knowledge Base Action
 * 
 * AI INSTRUCTIONS:
 * - Perform semantic search using vector similarity
 * - Delegate to application service
 * - Return ranked results with similarity scores
 */
export async function searchKnowledgeBase(
  organizationId: string,
  chatbotConfigId: string,
  query: string,
  options?: {
    threshold?: number;
    limit?: number;
    categoryFilter?: string;
    sourceTypeFilter?: string;
  }
): Promise<{
  success: boolean;
  results?: Array<{ item: KnowledgeItem; similarity: number; }>;
  error?: string;
}> {
  try {
    const knowledgeService = ChatbotWidgetCompositionRoot.getVectorKnowledgeApplicationService();
    
    const results = await knowledgeService.searchKnowledge(
      organizationId,
      chatbotConfigId,
      query,
      {
        threshold: options?.threshold || 0.7,
        limit: options?.limit || 10,
        categoryFilter: options?.categoryFilter,
        sourceTypeFilter: options?.sourceTypeFilter
      }
    );
    
    return {
      success: true,
      results
    };
  } catch (error) {
    if (error instanceof BusinessRuleViolationError) {
      return {
        success: false,
        error: error.message
      };
    }
    
    return {
      success: false,
      error: 'An unexpected error occurred while searching knowledge base'
    };
  }
}

/**
 * Store Knowledge Items Action
 * 
 * AI INSTRUCTIONS:
 * - Store knowledge items with vector embeddings
 * - Delegate to application service
 * - Handle batch processing efficiently
 */
export async function storeKnowledgeItems(
  organizationId: string,
  chatbotConfigId: string,
  items: Array<{
    knowledgeItemId: string;
    title: string;
    content: string;
    category: string;
    sourceType: 'faq' | 'company_info' | 'product_catalog' | 'support_docs' | 'website_crawled';
    sourceUrl?: string;
    contentHash: string;
  }>
): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const knowledgeService = ChatbotWidgetCompositionRoot.getVectorKnowledgeApplicationService();
    
    await knowledgeService.storeKnowledgeItems(
      organizationId,
      chatbotConfigId,
      items
    );
    
    return { success: true };
  } catch (error) {
    if (error instanceof BusinessRuleViolationError) {
      return {
        success: false,
        error: error.message
      };
    }
    
    return {
      success: false,
      error: 'An unexpected error occurred while storing knowledge items'
    };
  }
}

/**
 * Delete Knowledge Items By Source Action
 * 
 * AI INSTRUCTIONS:
 * - Delete knowledge items by source type and URL
 * - Delegate to application service
 * - Return deletion count for confirmation
 */
export async function deleteKnowledgeItemsBySource(
  organizationId: string,
  chatbotConfigId: string,
  sourceType: string,
  sourceUrl?: string
): Promise<{
  success: boolean;
  deletedCount?: number;
  error?: string;
}> {
  try {
    const knowledgeService = ChatbotWidgetCompositionRoot.getVectorKnowledgeApplicationService();
    
    const deletedCount = await knowledgeService.deleteKnowledgeItemsBySource(
      organizationId,
      chatbotConfigId,
      sourceType,
      sourceUrl
    );
    
    return {
      success: true,
      deletedCount
    };
  } catch (error) {
    if (error instanceof BusinessRuleViolationError) {
      return {
        success: false,
        error: error.message
      };
    }
    
    return {
      success: false,
      error: 'An unexpected error occurred while deleting knowledge items'
    };
  }
}

/**
 * Get Knowledge Base Stats Action
 * 
 * AI INSTRUCTIONS:
 * - Retrieve statistics about knowledge base
 * - Delegate to application service
 * - Return comprehensive metrics for dashboard
 */
export async function getKnowledgeBaseStats(
  organizationId: string,
  chatbotConfigId: string
): Promise<{
  success: boolean;
  stats?: {
    totalItems: number;
    itemsBySourceType: Record<string, number>;
    itemsByCategory: Record<string, number>;
    lastUpdated: string | null;
    storageSizeMB: number;
  };
  error?: string;
}> {
  try {
    const knowledgeService = ChatbotWidgetCompositionRoot.getVectorKnowledgeApplicationService();
    
    const stats = await knowledgeService.getKnowledgeStats(
      organizationId,
      chatbotConfigId
    );
    
    return {
      success: true,
      stats: {
        totalItems: stats.totalItems,
        itemsBySourceType: stats.itemsBySourceType,
        itemsByCategory: stats.itemsByCategory,
        lastUpdated: stats.lastUpdated?.toISOString() || null,
        storageSizeMB: Math.round(stats.storageSize / (1024 * 1024) * 100) / 100
      }
    };
  } catch (error) {
    if (error instanceof BusinessRuleViolationError) {
      return {
        success: false,
        error: error.message
      };
    }
    
    return {
      success: false,
      error: 'An unexpected error occurred while retrieving knowledge base stats'
    };
  }
} 