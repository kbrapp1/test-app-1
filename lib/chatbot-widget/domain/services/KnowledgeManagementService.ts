import { 
  KnowledgeItem, 
  KnowledgeRetrievalContext 
} from './interfaces/IKnowledgeRetrievalService';
import { IVectorKnowledgeRepository } from '../repositories/IVectorKnowledgeRepository';
import { BusinessRuleViolationError } from '../errors/ChatbotWidgetDomainErrors';
import { IChatbotLoggingService, IOperationLogger as _IOperationLogger } from './interfaces/IChatbotLoggingService';
import { ChatbotWidgetCompositionRoot } from '../../infrastructure/composition/ChatbotWidgetCompositionRoot';

/**
 * Knowledge Management Service
 * 
 * AI INSTRUCTIONS:
 * - Single responsibility: Knowledge CRUD operations
 * - Domain service for knowledge item management
 * - No complex search logic - delegate to search service
 * - Focus on data retrieval and basic operations
 * - Use structured logging for management operations
 * - Keep under 200-250 lines per @golden-rule
 */
export class KnowledgeManagementService {
  private readonly loggingService: IChatbotLoggingService;
  
  constructor(
    private readonly vectorRepository: IVectorKnowledgeRepository,
    private readonly organizationId: string,
    private readonly chatbotConfigId: string
  ) {
    // Initialize centralized logging service
    this.loggingService = ChatbotWidgetCompositionRoot.getLoggingService();
  }

  async getKnowledgeByCategory(category: string, context?: KnowledgeRetrievalContext, sharedLogFile?: string): Promise<KnowledgeItem[]> {
    if (!category?.trim()) {
      throw new BusinessRuleViolationError(
        'Category is required for knowledge retrieval',
        { category, organizationId: this.organizationId }
      );
    }

    try {
      // Create operation logger - shared log file is required
      if (!sharedLogFile) {
        throw new Error('SharedLogFile is required for knowledge management operations - all logging must be conversation-specific');
      }
      const logger = this.loggingService.createOperationLogger(
        'knowledge-by-category',
        sharedLogFile,
        {
          operation: 'getKnowledgeByCategory',
          organizationId: this.organizationId
        }
      );

      logger.addContext('stage', 'Retrieving knowledge by category');

      // Use search with dummy embedding and category filter
      const dummyEmbedding = new Array(1536).fill(0);
      const searchResults = await this.vectorRepository.searchKnowledgeItems(
        this.organizationId,
        this.chatbotConfigId,
        dummyEmbedding,
        { 
          threshold: -1, 
          limit: 1000, 
          categoryFilter: category 
        }
      );

      const items = searchResults.map(result => result.item);
      
      logger.addContext('results', `Found ${items.length} items in category "${category}"`);
      logger.complete({ itemsFound: items.length, category });

      return items;

    } catch (error) {
      if (error instanceof BusinessRuleViolationError) {
        throw error;
      }
      
      throw new BusinessRuleViolationError(
        'Failed to retrieve knowledge by category',
        { 
          error: error instanceof Error ? error.message : 'Unknown error',
          category,
          organizationId: this.organizationId,
          chatbotConfigId: this.chatbotConfigId
        }
      );
    }
  }

  async getKnowledgeByTags(tags: string[], context?: KnowledgeRetrievalContext, sharedLogFile?: string): Promise<KnowledgeItem[]> {
    if (!tags || tags.length === 0) {
      throw new BusinessRuleViolationError(
        'At least one tag is required for knowledge retrieval',
        { tags, organizationId: this.organizationId }
      );
    }

    try {
      // Create operation logger - shared log file is required
      if (!sharedLogFile) {
        throw new Error('SharedLogFile is required for knowledge management operations - all logging must be conversation-specific');
      }
      const logger = this.loggingService.createOperationLogger(
        'knowledge-by-tags',
        sharedLogFile,
        {
          operation: 'getKnowledgeByTags',
          organizationId: this.organizationId
        }
      );

      logger.addContext('stage', 'Retrieving knowledge by tags');

      // Search all items and filter by tags manually (since repository doesn't support tag filtering)
      const dummyEmbedding = new Array(1536).fill(0);
      const searchResults = await this.vectorRepository.searchKnowledgeItems(
        this.organizationId,
        this.chatbotConfigId,
        dummyEmbedding,
        { threshold: -1, limit: 10000 }
      );

      // Filter items that contain any of the specified tags
      const filteredItems = searchResults
        .map(result => result.item)
        .filter(item => {
          if (!item.tags || item.tags.length === 0) return false;
          return tags.some(tag => 
            item.tags.some(itemTag => 
              itemTag.toLowerCase().includes(tag.toLowerCase())
            )
          );
        });

      logger.addContext('results', `Found ${filteredItems.length} items with tags: ${tags.join(', ')}`);
      logger.complete({ itemsFound: filteredItems.length, tags });

      return filteredItems;

    } catch (error) {
      if (error instanceof BusinessRuleViolationError) {
        throw error;
      }
      
      throw new BusinessRuleViolationError(
        'Failed to retrieve knowledge by tags',
        { 
          error: error instanceof Error ? error.message : 'Unknown error',
          tags,
          organizationId: this.organizationId,
          chatbotConfigId: this.chatbotConfigId
        }
      );
    }
  }

  async getKnowledgeStats(sharedLogFile?: string): Promise<KnowledgeStatsResult> {
    try {
      // Create operation logger - shared log file is required
      if (!sharedLogFile) {
        throw new Error('SharedLogFile is required for knowledge management operations - all logging must be conversation-specific');
      }
      const logger = this.loggingService.createOperationLogger(
        'knowledge-stats',
        sharedLogFile,
        {
          operation: 'getKnowledgeStats',
          organizationId: this.organizationId
        }
      );

      logger.addContext('stage', 'Retrieving knowledge statistics');

      const stats = await this.vectorRepository.getKnowledgeItemStats(
        this.organizationId,
        this.chatbotConfigId
      );

      const result: KnowledgeStatsResult = {
        totalItems: stats.totalItems,
        itemsBySourceType: stats.itemsBySourceType,
        itemsByCategory: stats.itemsByCategory,
        lastUpdated: stats.lastUpdated,
        storageSize: stats.storageSize,
        organizationId: this.organizationId,
        chatbotConfigId: this.chatbotConfigId
      };

      logger.addContext('results', `Total items: ${stats.totalItems}, Categories: ${Object.keys(stats.itemsByCategory).length}`);
      logger.complete({ 
        totalItems: stats.totalItems, 
        categories: Object.keys(stats.itemsByCategory).length,
        sourceTypes: Object.keys(stats.itemsBySourceType).length
      });

      return result;

    } catch (error) {
      throw new BusinessRuleViolationError(
        'Failed to retrieve knowledge statistics',
        { 
          error: error instanceof Error ? error.message : 'Unknown error',
          organizationId: this.organizationId,
          chatbotConfigId: this.chatbotConfigId
        }
      );
    }
  }

  async deleteKnowledgeBySource(sourceType: string, sourceUrl?: string, sharedLogFile?: string): Promise<number> {
    if (!sourceType?.trim()) {
      throw new BusinessRuleViolationError(
        'Source type is required for knowledge deletion',
        { sourceType, organizationId: this.organizationId }
      );
    }

    try {
      // Create operation logger - shared log file is required
      if (!sharedLogFile) {
        throw new Error('SharedLogFile is required for knowledge management operations - all logging must be conversation-specific');
      }
      const logger = this.loggingService.createOperationLogger(
        'delete-knowledge-by-source',
        sharedLogFile,
        {
          operation: 'deleteKnowledgeBySource',
          organizationId: this.organizationId
        }
      );

      logger.addContext('stage', 'Deleting knowledge by source');

      const deletedCount = await this.vectorRepository.deleteKnowledgeItemsBySource(
        this.organizationId,
        this.chatbotConfigId,
        sourceType,
        sourceUrl
      );

      logger.addContext('results', `Deleted ${deletedCount} items from source: ${sourceType}`);
      logger.complete({ deletedCount, sourceType, sourceUrl });

      return deletedCount;

    } catch (error) {
      if (error instanceof BusinessRuleViolationError) {
        throw error;
      }
      
      throw new BusinessRuleViolationError(
        'Failed to delete knowledge by source',
        { 
          error: error instanceof Error ? error.message : 'Unknown error',
          sourceType,
          sourceUrl,
          organizationId: this.organizationId,
          chatbotConfigId: this.chatbotConfigId
        }
      );
    }
  }

  async checkHealthStatus(sharedLogFile?: string): Promise<HealthCheckResult> {
    try {
      // Create operation logger - shared log file is required
      if (!sharedLogFile) {
        throw new Error('SharedLogFile is required for knowledge management operations - all logging must be conversation-specific');
      }
      const logger = this.loggingService.createOperationLogger(
        'health-check',
        sharedLogFile,
        {
          operation: 'checkHealthStatus',
          organizationId: this.organizationId
        }
      );

      logger.addContext('stage', 'Performing health check');

      const startTime = Date.now();
      const stats = await this.vectorRepository.getKnowledgeItemStats(
        this.organizationId,
        this.chatbotConfigId
      );
      const responseTime = Date.now() - startTime;

      const result: HealthCheckResult = {
        status: 'healthy',
        responseTimeMs: responseTime,
        totalItems: stats.totalItems,
        lastUpdated: stats.lastUpdated,
        organizationId: this.organizationId,
        chatbotConfigId: this.chatbotConfigId,
        timestamp: new Date()
      };

      logger.addContext('results', `Health check passed in ${responseTime}ms`);
      logger.complete({ status: 'healthy', responseTime, totalItems: stats.totalItems });

      return result;

    } catch (error) {
      const result: HealthCheckResult = {
        status: 'unhealthy',
        responseTimeMs: -1,
        totalItems: 0,
        lastUpdated: null,
        organizationId: this.organizationId,
        chatbotConfigId: this.chatbotConfigId,
        timestamp: new Date(),
        error: error instanceof Error ? error.message : 'Unknown error'
      };

      return result;
    }
  }
}

export interface KnowledgeStatsResult {
  totalItems: number;
  itemsBySourceType: Record<string, number>;
  itemsByCategory: Record<string, number>;
  lastUpdated: Date | null;
  storageSize: number;
  organizationId: string;
  chatbotConfigId: string;
}

export interface HealthCheckResult {
  status: 'healthy' | 'unhealthy';
  responseTimeMs: number;
  totalItems: number;
  lastUpdated: Date | null;
  organizationId: string;
  chatbotConfigId: string;
  timestamp: Date;
  error?: string;
} 