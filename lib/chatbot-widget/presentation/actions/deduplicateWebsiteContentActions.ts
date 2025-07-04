/**
 * Website Content Deduplication Server Actions - Presentation Layer
 * 
 * AI INSTRUCTIONS:
 * - Server action entry points for website content deduplication
 * - Handle user requests and delegate to application services
 * - Only export async functions (Next.js requirement)
 * - Follow @golden-rule patterns exactly
 * - Keep under 250 lines - focus on request/response handling
 * - Use domain-specific error types for proper error handling
 */

'use server';

import { ChatbotWidgetCompositionRoot } from '../../infrastructure/composition/ChatbotWidgetCompositionRoot';
import { BusinessRuleViolationError } from '../../../errors/base';

/**
 * Preview website content deduplication
 * 
 * @param organizationId - Organization ID
 * @param chatbotConfigId - Chatbot configuration ID
 * @returns Preview of duplicates that would be removed
 */
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
    context?: Record<string, any>;
  };
}> {
  try {
    console.log(`🔍 Preview deduplication request for config: ${chatbotConfigId}`);
    
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
    
    console.log(`✅ Deduplication preview completed:`, {
      totalItems: previewResult.totalItems,
      duplicateGroups: previewResult.duplicateGroups.length
    });
    
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

/**
 * Execute website content deduplication
 * 
 * @param organizationId - Organization ID
 * @param chatbotConfigId - Chatbot configuration ID
 * @returns Deduplication results with statistics
 */
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
    context?: Record<string, any>;
  };
}> {
  try {
    console.log(`🧹 Execute deduplication request for config: ${chatbotConfigId}`);
    
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
    
    console.log(`✅ Deduplication execution completed:`, {
      totalAnalyzed: deduplicationResult.totalItemsAnalyzed,
      duplicatesRemoved: deduplicationResult.duplicatesRemoved,
      uniqueItemsKept: deduplicationResult.uniqueItemsKept,
      errorCount: deduplicationResult.errors.length
    });
    
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

/**
 * Normalize a URL for comparison
 * 
 * @param url - URL to normalize
 * @returns Normalized URL
 */
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
    context?: Record<string, any>;
  };
}> {
  try {
    console.log(`🔧 Normalize URL request: ${url}`);
    
    if (!url) {
      throw new BusinessRuleViolationError(
        'URL is required for normalization',
        { url }
      );
    }
    
    const urlNormalizationService = ChatbotWidgetCompositionRoot.getUrlNormalizationService();
    
    const normalizedUrl = urlNormalizationService.normalizeUrl(url);
    const wasChanged = url !== normalizedUrl;
    
    console.log(`✅ URL normalization completed:`, {
      originalUrl: url,
      normalizedUrl,
      wasChanged
    });
    
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