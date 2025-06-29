'use server';

/**
 * Knowledge Base Update Actions with Proactive Vector Generation
 * 
 * AI INSTRUCTIONS:
 * - Triggers immediate vector generation when knowledge base changes
 * - Provides instant chatbot responses by pre-computing embeddings
 * - Handles both synchronous and background processing options
 * - Follows Next.js server action patterns with proper error handling
 */

import { ChatbotWidgetCompositionRoot } from '../../infrastructure/composition/ChatbotWidgetCompositionRoot';
import { UpdateKnowledgeBaseUseCase, UpdateKnowledgeBaseRequest, UpdateKnowledgeBaseResponse } from '../../application/use-cases/UpdateKnowledgeBaseUseCase';
import { VectorBackgroundJobService, VectorGenerationJobRequest } from '../../application/services/VectorBackgroundJobService';
import { KnowledgeItem } from '../../domain/services/interfaces/IKnowledgeRetrievalService';

/**
 * Update knowledge base with immediate vector generation
 * 
 * AI INSTRUCTIONS:
 * - Use for small to medium knowledge bases (< 100 items)
 * - Provides immediate vector generation for instant chatbot responses
 * - Blocks until all vectors are generated and cached
 * - Returns comprehensive performance metrics
 */
export async function updateKnowledgeBaseImmediate(
  organizationId: string,
  chatbotConfigId: string,
  knowledgeItems: KnowledgeItem[],
  triggerSource: 'manual_upload' | 'cms_sync' | 'api_update' | 'bulk_import' = 'manual_upload'
): Promise<UpdateKnowledgeBaseResponse> {
  try {
    // Get services from composition root
    const vectorManagementService = ChatbotWidgetCompositionRoot.getVectorManagementService();
    
    // For now, we'll pass null for knowledge retrieval service
    // In a full implementation, this would be properly wired
    const useCase = new UpdateKnowledgeBaseUseCase(
      vectorManagementService,
      null as any // TODO: Wire proper knowledge retrieval service
    );

    const request: UpdateKnowledgeBaseRequest = {
      organizationId,
      chatbotConfigId,
      knowledgeItems,
      triggerSource
    };

    const result = await useCase.execute(request);

    return result;

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    return {
      success: false,
      vectorsProcessed: 0,
      cacheHits: 0,
      cacheMisses: 0,
      processingTimeMs: 0,
      errors: [errorMessage]
    };
  }
}

/**
 * Queue knowledge base update for background processing
 * 
 * AI INSTRUCTIONS:
 * - Use for large knowledge bases (> 100 items)
 * - Queues vector generation as background job
 * - Returns immediately with job ID for status tracking
 * - Prevents blocking user operations during bulk processing
 */
export async function updateKnowledgeBaseBackground(
  organizationId: string,
  chatbotConfigId: string,
  knowledgeItems: KnowledgeItem[],
  priority: 'high' | 'normal' | 'low' = 'normal',
  batchSize: number = 10
): Promise<{ success: boolean; jobId?: string; error?: string }> {
  try {
    // Get services from composition root
    const vectorManagementService = ChatbotWidgetCompositionRoot.getVectorManagementService();
    const backgroundJobService = new VectorBackgroundJobService(vectorManagementService);

    const request: VectorGenerationJobRequest = {
      organizationId,
      chatbotConfigId,
      knowledgeItems,
      priority,
      batchSize
    };

    const jobId = await backgroundJobService.queueVectorGeneration(request);

    return {
      success: true,
      jobId
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    return {
      success: false,
      error: errorMessage
    };
  }
}

/**
 * Get background job status
 * 
 * AI INSTRUCTIONS:
 * - Returns real-time job progress and status
 * - Provides estimated time remaining for completion
 * - Used for progress tracking in UI components
 */
export async function getVectorGenerationJobStatus(jobId: string): Promise<{
  success: boolean;
  job?: {
    id: string;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    progress: number; // 0-100
    totalItems: number;
    processedItems: number;
    estimatedTimeRemainingMs?: number;
    error?: string;
  };
  error?: string;
}> {
  try {
    // In a real implementation, this would be retrieved from persistent storage
    // For now, using in-memory service (would need to be singleton)
    const vectorManagementService = ChatbotWidgetCompositionRoot.getVectorManagementService();
    const backgroundJobService = new VectorBackgroundJobService(vectorManagementService);

    const job = backgroundJobService.getJobStatus(jobId);

    if (!job) {
      return {
        success: false,
        error: 'Job not found'
      };
    }

    const progress = job.totalItems > 0 ? (job.processedItems / job.totalItems) * 100 : 0;

    return {
      success: true,
      job: {
        id: job.id,
        status: job.status,
        progress: Math.round(progress),
        totalItems: job.totalItems,
        processedItems: job.processedItems,
        estimatedTimeRemainingMs: job.estimatedTimeRemainingMs,
        error: job.error
      }
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    return {
      success: false,
      error: errorMessage
    };
  }
}

/**
 * Clear vector cache for chatbot configuration
 * 
 * AI INSTRUCTIONS:
 * - Removes all cached vectors for complete refresh
 * - Used when knowledge base structure changes significantly
 * - Forces regeneration of all vectors on next update
 */
export async function clearVectorCache(
  organizationId: string,
  chatbotConfigId: string
): Promise<{ success: boolean; deletedCount?: number; error?: string }> {
  try {
    const vectorManagementService = ChatbotWidgetCompositionRoot.getVectorManagementService();

    const deletedCount = await vectorManagementService.clearVectorCache(
      organizationId,
      chatbotConfigId
    );

    return {
      success: true,
      deletedCount
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    return {
      success: false,
      error: errorMessage
    };
  }
}

/**
 * Get vector cache statistics
 * 
 * AI INSTRUCTIONS:
 * - Returns cache performance metrics
 * - Used for monitoring and optimization decisions
 * - Provides insights into cache efficiency
 */
export async function getVectorCacheStats(
  organizationId: string,
  chatbotConfigId: string
): Promise<{
  success: boolean;
  stats?: {
    totalVectors: number;
    lastUpdated: string | null;
    avgVectorAge: number;
    storageSizeMB: number;
  };
  error?: string;
}> {
  try {
    const vectorManagementService = ChatbotWidgetCompositionRoot.getVectorManagementService();

    const stats = await vectorManagementService.getVectorStats(
      organizationId,
      chatbotConfigId
    );

    return {
      success: true,
      stats: {
        totalVectors: stats.totalVectors,
        lastUpdated: stats.lastUpdated?.toISOString() || null,
        avgVectorAge: stats.avgVectorAge,
        storageSizeMB: Math.round((stats.storageSize / 1024 / 1024) * 100) / 100
      }
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    return {
      success: false,
      error: errorMessage
    };
  }
} 