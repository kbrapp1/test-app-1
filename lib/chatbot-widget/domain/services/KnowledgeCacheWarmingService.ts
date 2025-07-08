import { 
  IKnowledgeRetrievalService, 
  KnowledgeItem, 
  KnowledgeSearchResult, 
  KnowledgeRetrievalContext 
} from './interfaces/IKnowledgeRetrievalService';
import { IVectorKnowledgeRepository } from '../repositories/IVectorKnowledgeRepository';
import { OpenAIEmbeddingService } from '../../infrastructure/providers/openai/services/OpenAIEmbeddingService';
import { BusinessRuleViolationError } from '../errors/ChatbotWidgetDomainErrors';
import { IEmbeddingService } from './interfaces/IEmbeddingService';
import { IChatbotLoggingService, IOperationLogger } from './interfaces/IChatbotLoggingService';
import { ChatbotWidgetCompositionRoot } from '../../infrastructure/composition/ChatbotWidgetCompositionRoot';

/**
 * Knowledge Cache Warming Service
 * 
 * AI INSTRUCTIONS:
 * - Single responsibility: Cache warming optimization
 * - Domain service focused on cache performance
 * - No business logic beyond cache warming strategies
 * - Delegate to embedding service for vector operations
 * - Use structured logging for cache warming metrics
 * - Keep under 200-250 lines per @golden-rule
 */
export class KnowledgeCacheWarmingService {
  private readonly loggingService: IChatbotLoggingService;
  
  constructor(
    private readonly vectorRepository: IVectorKnowledgeRepository,
    private readonly embeddingService: OpenAIEmbeddingService,
    private readonly organizationId: string,
    private readonly chatbotConfigId: string
  ) {
    // Initialize centralized logging service
    this.loggingService = ChatbotWidgetCompositionRoot.getLoggingService();
  }

  async warmCache(sharedLogFile?: string): Promise<{ success: boolean; itemsWarmed: number; timeMs: number; metrics: CacheWarmingMetrics }> {
    const startTime = Date.now();

    try {
      // Create operation logger for cache warming - shared log file is required
      if (!sharedLogFile) {
        throw new Error('SharedLogFile is required for cache warming operations - all logging must be conversation-specific');
      }
      
      const logger = this.loggingService.createOperationLogger(
        'cache-warming',
        sharedLogFile,
        {
          operation: 'warmCache',
          organizationId: this.organizationId
        }
      );

      logger.addContext('stage', 'Cache warming initialization');

      // Get knowledge base statistics for cache planning
      const stats = await this.vectorRepository.getKnowledgeItemStats(
        this.organizationId,
        this.chatbotConfigId
      );

      logger.addContext('knowledgeStats', `${stats.totalItems} items, ${Object.keys(stats.itemsByCategory).length} categories`);
      
      if (stats.totalItems === 0) {
        logger.addContext('warning', 'No knowledge items found - cache warming skipped');
        logger.complete({ itemsWarmed: 0, timeMs: Date.now() - startTime });
        return { 
          success: true, 
          itemsWarmed: 0, 
          timeMs: Date.now() - startTime,
          metrics: this.createEmptyMetrics()
        };
      }

      logger.addContext('stage', 'Loading knowledge items for cache warming');

      // Load all knowledge items for cache warming using search with high limit
      // We use a dummy embedding with very low threshold to get all items
      const dummyEmbedding = new Array(1536).fill(0); // OpenAI embedding dimension
      const searchResults = await this.vectorRepository.searchKnowledgeItems(
        this.organizationId,
        this.chatbotConfigId,
        dummyEmbedding,
        { threshold: 0.0001, limit: 10000 } // Very low but valid threshold and high limit to get all items
      );

      const allItems = searchResults.map(result => result.item);
      logger.addContext('itemsLoaded', `${allItems.length} knowledge items loaded`);

      // Warm the cache by pre-loading common search patterns
      const warmingResults = await this.performCacheWarming(allItems, logger);

      const totalTime = Date.now() - startTime;
      
      logger.addContext('results', `${warmingResults.itemsWarmed} items warmed in ${totalTime}ms`);
      logger.complete({ 
        itemsWarmed: warmingResults.itemsWarmed, 
        timeMs: totalTime,
        patterns: warmingResults.patterns 
      });

      return {
        success: true,
        itemsWarmed: warmingResults.itemsWarmed,
        timeMs: totalTime,
        metrics: warmingResults.metrics
      };

    } catch (error) {
      const errorTime = Date.now() - startTime;
      
      if (error instanceof BusinessRuleViolationError) {
        throw error;
      }
      
      throw new BusinessRuleViolationError(
        'Cache warming failed',
        { 
          error: error instanceof Error ? error.message : 'Unknown error',
          organizationId: this.organizationId,
          chatbotConfigId: this.chatbotConfigId,
          timeMs: errorTime
        }
      );
    }
  }

  private async performCacheWarming(
    items: KnowledgeItem[], 
    logger: IOperationLogger
  ): Promise<{ itemsWarmed: number; patterns: number; metrics: CacheWarmingMetrics }> {
    const startTime = Date.now();
    let itemsWarmed = 0;
    let patternsWarmed = 0;

    logger.addContext('stage', 'Performing cache warming operations');

    // Strategy 1: Warm cache with actual knowledge content
    for (const item of items) {
      try {
        if (item.content && item.content.trim().length > 0) {
          // Generate embeddings for the knowledge content to warm the cache
          await this.embeddingService.generateEmbedding(item.content.substring(0, 500)); // Limit to first 500 chars
          itemsWarmed++;
        }
      } catch (error) {
        // Continue warming other items if one fails
        logger.addContext('warning', `Failed to warm cache for item ${item.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    // Strategy 2: Warm cache with common search patterns
    const commonPatterns = this.generateCommonSearchPatterns(items);
    
    for (const pattern of commonPatterns) {
      try {
        await this.embeddingService.generateEmbedding(pattern);
        patternsWarmed++;
      } catch (error) {
        // Continue with other patterns if one fails
        logger.addContext('warning', `Failed to warm cache for pattern "${pattern}": ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    const metrics: CacheWarmingMetrics = {
      totalItems: items.length,
      itemsWarmed,
      patternsWarmed,
      timeMs: Date.now() - startTime,
      categories: this.getCategoryStats(items),
      strategies: ['content-based', 'pattern-based']
    };

    logger.addContext('metrics', `Warmed ${itemsWarmed} items + ${patternsWarmed} patterns`);

    return {
      itemsWarmed: itemsWarmed + patternsWarmed,
      patterns: patternsWarmed,
      metrics
    };
  }

  private generateCommonSearchPatterns(items: KnowledgeItem[]): string[] {
    const patterns: string[] = [];
    
    // Extract common keywords and phrases from knowledge items
    const keywords = new Set<string>();
    
    items.forEach(item => {
      if (item.content) {
        // Extract potential keywords (simple approach)
        const words = item.content.toLowerCase()
          .replace(/[^\w\s]/g, ' ')
          .split(/\s+/)
          .filter(word => word.length > 3 && word.length < 20);
        
        words.forEach(word => keywords.add(word));
      }
      
      // Add category-based patterns
      if (item.category) {
        patterns.push(`What is ${item.category}?`);
        patterns.push(`How does ${item.category} work?`);
        patterns.push(`Tell me about ${item.category}`);
      }
    });

    // Add the most common keywords as search patterns
    const topKeywords = Array.from(keywords).slice(0, 10);
    topKeywords.forEach(keyword => {
      patterns.push(`What is ${keyword}?`);
      patterns.push(`How to ${keyword}?`);
    });

    // Add general business patterns
    patterns.push('How can you help me?');
    patterns.push('What services do you offer?');
    patterns.push('What are your capabilities?');
    patterns.push('Tell me about your company');
    patterns.push('What can you do for me?');

    return patterns.slice(0, 20); // Limit to top 20 patterns
  }

  private getCategoryStats(items: KnowledgeItem[]): Record<string, number> {
    const categoryStats: Record<string, number> = {};
    
    items.forEach(item => {
      const category = item.category || 'uncategorized';
      categoryStats[category] = (categoryStats[category] || 0) + 1;
    });
    
    return categoryStats;
  }

  private createEmptyMetrics(): CacheWarmingMetrics {
    return {
      totalItems: 0,
      itemsWarmed: 0,
      patternsWarmed: 0,
      timeMs: 0,
      categories: {},
      strategies: []
    };
  }
}

export interface CacheWarmingMetrics {
  totalItems: number;
  itemsWarmed: number;
  patternsWarmed: number;
  timeMs: number;
  categories: Record<string, number>;
  strategies: string[];
} 