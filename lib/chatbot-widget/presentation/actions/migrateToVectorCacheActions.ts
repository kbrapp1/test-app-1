'use server';

/**
 * Vector Cache Migration Actions
 * 
 * AI INSTRUCTIONS:
 * - Helps migrate existing knowledge bases to vector caching
 * - Provides progress tracking for large knowledge bases
 * - Handles the initial "cold start" scenario gracefully
 * - Offers both immediate and background processing options
 */

import { ChatbotWidgetCompositionRoot } from '../../infrastructure/composition/ChatbotWidgetCompositionRoot';
import { KnowledgeItem } from '../../domain/services/interfaces/IKnowledgeRetrievalService';

export interface MigrationProgress {
  totalItems: number;
  processedItems: number;
  currentItem: string;
  estimatedTimeRemainingMs: number;
  status: 'preparing' | 'processing' | 'completed' | 'failed';
  error?: string;
}

export interface MigrationResult {
  success: boolean;
  totalVectorsCreated: number;
  processingTimeMs: number;
  costEstimate: {
    tokensUsed: number;
    estimatedCost: number;
  };
  error?: string;
}

/**
 * Migrate existing knowledge base to vector cache
 * This is a one-time operation for existing chatbots
 */
export async function migrateKnowledgeBaseToVectorCache(
  organizationId: string,
  chatbotConfigId: string,
  options: {
    forceRecalculate?: boolean; // Recalculate even if vectors exist
    batchSize?: number; // Process in batches to avoid timeouts
  } = {}
): Promise<MigrationResult> {
  const startTime = Date.now();
  
  try {
    console.log(`\n🚀 Starting Vector Cache Migration:`);
    console.log(`   Organization: ${organizationId}`);
    console.log(`   Chatbot Config: ${chatbotConfigId}`);
    console.log(`   Force Recalculate: ${options.forceRecalculate || false}`);

    // Get services
    const vectorManagementService = ChatbotWidgetCompositionRoot.getVectorManagementService();
    
    // Get knowledge items (this would need to be implemented based on your knowledge source)
    // For now, we'll simulate this - in reality, you'd fetch from your knowledge base
    const knowledgeItems = await getKnowledgeItemsForChatbot(organizationId, chatbotConfigId);
    
    if (knowledgeItems.length === 0) {
      return {
        success: true,
        totalVectorsCreated: 0,
        processingTimeMs: Date.now() - startTime,
        costEstimate: { tokensUsed: 0, estimatedCost: 0 }
      };
    }

    console.log(`   Found ${knowledgeItems.length} knowledge items to process`);

    // Clear existing cache if force recalculate
    if (options.forceRecalculate) {
      const deletedCount = await vectorManagementService.clearVectorCache(
        organizationId,
        chatbotConfigId
      );
      console.log(`   Cleared ${deletedCount} existing vectors`);
    }

    // Process all knowledge items (this will create vectors for new items)
    const vectors = await vectorManagementService.ensureVectorsUpToDate(
      organizationId,
      chatbotConfigId,
      knowledgeItems
    );

    const processingTime = Date.now() - startTime;
    const tokensUsed = knowledgeItems.length * 1000; // Rough estimate
    const estimatedCost = tokensUsed * 0.00002; // $0.02 per 1K tokens

    console.log(`\n✅ Migration Completed Successfully:`);
    console.log(`   Vectors Created/Updated: ${vectors.length}`);
    console.log(`   Processing Time: ${processingTime}ms`);
    console.log(`   Estimated Cost: $${estimatedCost.toFixed(4)}`);

    return {
      success: true,
      totalVectorsCreated: vectors.length,
      processingTimeMs: processingTime,
      costEstimate: {
        tokensUsed,
        estimatedCost
      }
    };

  } catch (error) {
    console.error('❌ Migration failed:', error);
    
    return {
      success: false,
      totalVectorsCreated: 0,
      processingTimeMs: Date.now() - startTime,
      costEstimate: { tokensUsed: 0, estimatedCost: 0 },
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Check vector cache status for a chatbot
 */
export async function checkVectorCacheStatus(
  organizationId: string,
  chatbotConfigId: string
): Promise<{
  hasCachedVectors: boolean;
  totalVectors: number;
  lastUpdated: Date | null;
  avgVectorAge: number;
  knowledgeItemsCount: number;
  needsMigration: boolean;
}> {
  try {
    const vectorManagementService = ChatbotWidgetCompositionRoot.getVectorManagementService();
    
    // Get vector statistics
    const vectorStats = await vectorManagementService.getVectorStats(
      organizationId,
      chatbotConfigId
    );

    // Get current knowledge items count
    const knowledgeItems = await getKnowledgeItemsForChatbot(organizationId, chatbotConfigId);
    
    const needsMigration = vectorStats.totalVectors === 0 && knowledgeItems.length > 0;

    return {
      hasCachedVectors: vectorStats.totalVectors > 0,
      totalVectors: vectorStats.totalVectors,
      lastUpdated: vectorStats.lastUpdated,
      avgVectorAge: vectorStats.avgVectorAge,
      knowledgeItemsCount: knowledgeItems.length,
      needsMigration
    };

  } catch (error) {
    console.error('Error checking vector cache status:', error);
    throw error;
  }
}

/**
 * Get knowledge items for a chatbot configuration
 * TODO: Replace this with actual implementation based on your knowledge source
 */
async function getKnowledgeItemsForChatbot(
  organizationId: string,
  chatbotConfigId: string
): Promise<KnowledgeItem[]> {
  // This is a placeholder - you'll need to implement this based on your knowledge source
  // It might fetch from:
  // - Database tables (FAQs, documents, etc.)
  // - CMS systems
  // - File uploads
  // - API integrations
  
  console.log('⚠️ TODO: Implement getKnowledgeItemsForChatbot()');
  console.log('   This should fetch knowledge items from your actual knowledge source');
  console.log('   organizationId:', organizationId);
  console.log('   chatbotConfigId:', chatbotConfigId);
  
  return []; // Return empty for now
} 