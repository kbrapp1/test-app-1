/**
 * AI Instructions: Server actions for website content deduplication
 * - Handle user requests and delegate to application services
 * - Use domain-specific error types with proper error handling
 * - Maintain single responsibility per action
 * - Follow DDD presentation layer patterns
 */

'use server';

import { ChatbotWidgetCompositionRoot } from '../../infrastructure/composition/ChatbotWidgetCompositionRoot';
import { BusinessRuleViolationError } from '../../domain/errors/ChatbotWidgetDomainErrors';

// Preview website content deduplication
export async function previewWebsiteContentDeduplication(
  organizationId: string,
  chatbotConfigId: string
): Promise<{
  success: boolean;
  data?: {
    totalItems: number;
    duplicateGroups: Array<{
      canonical: string;
      duplicates: string[];
      similarity: number;
    }>;
  };
  error?: {
    code: string;
    message: string;
    context?: Record<string, unknown>;
  };
}> {
  try {
    if (!organizationId) {
      throw new BusinessRuleViolationError(
        'Organization ID is required for deduplication preview',
        { chatbotConfigId }
      );
    }
    
    if (!chatbotConfigId) {
      throw new BusinessRuleViolationError(
        'Chatbot config ID is required for deduplication preview',
        { organizationId }
      );
    }
    
    const deduplicateUseCase = ChatbotWidgetCompositionRoot.getDeduplicateWebsiteContentUseCase();
    
    const previewResult = await deduplicateUseCase.preview(organizationId, chatbotConfigId);
    
    return {
      success: true,
      data: previewResult
    };
    
  } catch (error) {
    console.error('❌ Deduplication preview failed:', error);
    
    if (error instanceof BusinessRuleViolationError) {
      return {
        success: false,
        error: {
          code: error.code,
          message: error.message,
          context: error.context
        }
      };
    }
    
    return {
      success: false,
      error: {
        code: 'DEDUPLICATION_PREVIEW_ERROR',
        message: `Deduplication preview failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        context: { organizationId, chatbotConfigId }
      }
    };
  }
}

// Execute website content deduplication
export async function executeWebsiteContentDeduplication(
  organizationId: string,
  chatbotConfigId: string
): Promise<{
  success: boolean;
  data?: {
    totalItemsAnalyzed: number;
    duplicatesFound: number;
    duplicatesRemoved: number;
    uniqueItemsKept: number;
    errors: string[];
  };
  error?: {
    code: string;
    message: string;
    context?: Record<string, unknown>;
  };
}> {
  try {
    if (!organizationId) {
      throw new BusinessRuleViolationError(
        'Organization ID is required for deduplication execution',
        { chatbotConfigId }
      );
    }
    
    if (!chatbotConfigId) {
      throw new BusinessRuleViolationError(
        'Chatbot config ID is required for deduplication execution',
        { organizationId }
      );
    }
    
    const deduplicateUseCase = ChatbotWidgetCompositionRoot.getDeduplicateWebsiteContentUseCase();
    
    const deduplicationResult = await deduplicateUseCase.execute(organizationId, chatbotConfigId);
    
    return {
      success: true,
      data: deduplicationResult
    };
    
  } catch (error) {
    console.error('❌ Deduplication execution failed:', error);
    
    if (error instanceof BusinessRuleViolationError) {
      return {
        success: false,
        error: {
          code: error.code,
          message: error.message,
          context: error.context
        }
      };
    }
    
    return {
      success: false,
      error: {
        code: 'DEDUPLICATION_EXECUTION_ERROR',
        message: `Deduplication execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        context: { organizationId, chatbotConfigId }
      }
    };
  }
}

// Normalize URL for comparison
export async function normalizeUrl(url: string): Promise<{
  success: boolean;
  data?: {
    originalUrl: string;
    normalizedUrl: string;
    wasChanged: boolean;
  };
  error?: {
    code: string;
    message: string;
    context?: Record<string, unknown>;
  };
}> {
  try {
    if (!url) {
      throw new BusinessRuleViolationError(
        'URL is required for normalization',
        { url }
      );
    }
    
    const urlNormalizationService = ChatbotWidgetCompositionRoot.getUrlNormalizationService();
    
    const normalizedUrl = urlNormalizationService.normalizeUrl(url);
    const wasChanged = url !== normalizedUrl;
    
    return {
      success: true,
      data: {
        originalUrl: url,
        normalizedUrl,
        wasChanged
      }
    };
    
  } catch (error) {
    console.error('❌ URL normalization failed:', error);
    
    if (error instanceof BusinessRuleViolationError) {
      return {
        success: false,
        error: {
          code: error.code,
          message: error.message,
          context: error.context
        }
      };
    }
    
    return {
      success: false,
      error: {
        code: 'URL_NORMALIZATION_ERROR',
        message: `URL normalization failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        context: { url }
      }
    };
  }
} 