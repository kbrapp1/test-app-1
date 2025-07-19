/**
 * Knowledge Retrieval Orchestrator
 * 
 * AI INSTRUCTIONS:
 * - Application layer orchestration for knowledge retrieval
 * - Coordinates domain services and infrastructure
 * - Single responsibility: retrieval coordination
 * - Preserves organization security throughout
 */

import { KnowledgeItem, KnowledgeRetrievalContext } from '../../../domain/services/interfaces/IKnowledgeRetrievalService';
import { IVectorKnowledgeRepository } from '../../../domain/repositories/IVectorKnowledgeRepository';
import { KnowledgeFilteringService } from '../../../domain/services/knowledge/KnowledgeFilteringService';
import { KnowledgeValidationService } from '../../../domain/services/knowledge/KnowledgeValidationService';
import { KnowledgeSearchStrategy } from '../../../domain/services/knowledge/KnowledgeSearchStrategy';
import { KnowledgeQuery } from '../../../domain/value-objects/knowledge/KnowledgeQuery';
import { IChatbotLoggingService } from '../../../domain/services/interfaces/IChatbotLoggingService';

export class KnowledgeRetrievalOrchestrator {
  private readonly filteringService: KnowledgeFilteringService;
  private readonly validationService: KnowledgeValidationService;
  private readonly searchStrategy: KnowledgeSearchStrategy;

  constructor(
    private readonly vectorRepository: IVectorKnowledgeRepository,
    private readonly loggingService: IChatbotLoggingService
  ) {
    this.filteringService = new KnowledgeFilteringService();
    this.validationService = new KnowledgeValidationService();
    this.searchStrategy = new KnowledgeSearchStrategy();
  }

  /**
   * Retrieve knowledge items by category with security and validation
   */
  async getKnowledgeByCategory(
    query: KnowledgeQuery,
    context?: KnowledgeRetrievalContext
  ): Promise<KnowledgeItem[]> {
    // Validate query parameters
    this.validationService.validateCommonParameters(
      query.organizationId,
      query.chatbotConfigId,
      query.sharedLogFile
    );

    if (!query.category) {
      throw new Error('Category is required for category-based retrieval');
    }

    this.validationService.validateCategory(query.category, query.organizationId);

    // Create operation logger with security context
    const logger = this.loggingService.createOperationLogger(
      'knowledge-by-category',
      query.sharedLogFile!,
      {
        operation: 'getKnowledgeByCategory',
        organizationId: query.organizationId // Security: Include organization context
      }
    );

    logger.addContext('stage', 'Retrieving knowledge by category');

    try {
      // Use search strategy for category retrieval
      const dummyEmbedding = this.searchStrategy.createDummyEmbedding();
      const searchOptions = this.searchStrategy.getCategorySearchOptions(query.category);

      // Security: Pass organization and config IDs for tenant isolation
      const searchResults = await this.vectorRepository.searchKnowledgeItems(
        query.organizationId,
        query.chatbotConfigId,
        dummyEmbedding,
        searchOptions
      );

      const items = searchResults.map(result => result.item);
      
      // Apply additional filtering if needed
      const filteredItems = this.filteringService.filterByCategory(items, query.category);
      
      // Sort by relevance using business rules
      const sortedItems = this.filteringService.sortByRelevance(filteredItems);

      logger.addContext('results', `Found ${sortedItems.length} items in category "${query.category}"`);
      logger.complete({ itemsFound: sortedItems.length, category: query.category });

      return sortedItems;

    } catch (error) {
      logger.addContext('error', error instanceof Error ? error.message : 'Unknown error');
      throw error;
    }
  }

  /**
   * Retrieve knowledge items by tags with security and validation
   */
  async getKnowledgeByTags(
    query: KnowledgeQuery,
    context?: KnowledgeRetrievalContext
  ): Promise<KnowledgeItem[]> {
    // Validate query parameters
    this.validationService.validateCommonParameters(
      query.organizationId,
      query.chatbotConfigId,
      query.sharedLogFile
    );

    if (!query.tags || query.tags.length === 0) {
      throw new Error('Tags are required for tag-based retrieval');
    }

    this.validationService.validateTags(query.tags, query.organizationId);

    // Create operation logger with security context
    const logger = this.loggingService.createOperationLogger(
      'knowledge-by-tags',
      query.sharedLogFile!,
      {
        operation: 'getKnowledgeByTags',
        organizationId: query.organizationId // Security: Include organization context
      }
    );

    logger.addContext('stage', 'Retrieving knowledge by tags');

    try {
      // Use search strategy for tag retrieval
      const dummyEmbedding = this.searchStrategy.createDummyEmbedding();
      const searchOptions = this.searchStrategy.getTagSearchOptions();

      // Security: Pass organization and config IDs for tenant isolation
      const searchResults = await this.vectorRepository.searchKnowledgeItems(
        query.organizationId,
        query.chatbotConfigId,
        dummyEmbedding,
        searchOptions
      );

      const allItems = searchResults.map(result => result.item);
      
      // Apply tag filtering using domain service
      const filteredItems = this.filteringService.filterByTags(allItems, query.tags);
      
      // Sort by relevance using business rules
      const sortedItems = this.filteringService.sortByRelevance(filteredItems);

      logger.addContext('results', `Found ${sortedItems.length} items with tags: ${query.tags.join(', ')}`);
      logger.complete({ itemsFound: sortedItems.length, tags: query.tags });

      return sortedItems;

    } catch (error) {
      logger.addContext('error', error instanceof Error ? error.message : 'Unknown error');
      throw error;
    }
  }

  /**
   * Delete knowledge items by source with security and validation
   */
  async deleteKnowledgeBySource(query: KnowledgeQuery): Promise<number> {
    // Validate query parameters
    this.validationService.validateCommonParameters(
      query.organizationId,
      query.chatbotConfigId,
      query.sharedLogFile
    );

    if (!query.sourceType) {
      throw new Error('Source type is required for source-based deletion');
    }

    this.validationService.validateSourceType(query.sourceType, query.organizationId);
    
    if (query.sourceUrl) {
      this.validationService.validateSourceUrl(query.sourceUrl, query.organizationId);
    }

    // Create operation logger with security context
    const logger = this.loggingService.createOperationLogger(
      'delete-knowledge-by-source',
      query.sharedLogFile!,
      {
        operation: 'deleteKnowledgeBySource',
        organizationId: query.organizationId // Security: Include organization context
      }
    );

    logger.addContext('stage', 'Deleting knowledge by source');

    try {
      // Security: Pass organization and config IDs for tenant isolation
      const deletedCount = await this.vectorRepository.deleteKnowledgeItemsBySource(
        query.organizationId,
        query.chatbotConfigId,
        query.sourceType,
        query.sourceUrl
      );

      logger.addContext('results', `Deleted ${deletedCount} items from source: ${query.sourceType}`);
      logger.complete({ deletedCount, sourceType: query.sourceType, sourceUrl: query.sourceUrl });

      return deletedCount;

    } catch (error) {
      logger.addContext('error', error instanceof Error ? error.message : 'Unknown error');
      throw error;
    }
  }

  /**
   * Get unique categories with security validation
   */
  async getUniqueCategories(
    organizationId: string,
    chatbotConfigId: string,
    sharedLogFile?: string
  ): Promise<string[]> {
    // Validate parameters
    this.validationService.validateCommonParameters(organizationId, chatbotConfigId, sharedLogFile);

    // Get all items and extract categories
    const query = KnowledgeQuery.create({
      organizationId,
      chatbotConfigId,
      limit: 10000,
      sharedLogFile
    });

    // Use search strategy for full scan
    const dummyEmbedding = this.searchStrategy.createDummyEmbedding();
    const searchOptions = this.searchStrategy.getTagSearchOptions();

    // Security: Pass organization and config IDs for tenant isolation
    const searchResults = await this.vectorRepository.searchKnowledgeItems(
      organizationId,
      chatbotConfigId,
      dummyEmbedding,
      searchOptions
    );

    const items = searchResults.map(result => result.item);
    return this.filteringService.getUniqueCategories(items);
  }

  /**
   * Get unique tags with security validation
   */
  async getUniqueTags(
    organizationId: string,
    chatbotConfigId: string,
    sharedLogFile?: string
  ): Promise<string[]> {
    // Validate parameters
    this.validationService.validateCommonParameters(organizationId, chatbotConfigId, sharedLogFile);

    // Get all items and extract tags
    const query = KnowledgeQuery.create({
      organizationId,
      chatbotConfigId,
      limit: 10000,
      sharedLogFile
    });

    // Use search strategy for full scan
    const dummyEmbedding = this.searchStrategy.createDummyEmbedding();
    const searchOptions = this.searchStrategy.getTagSearchOptions();

    // Security: Pass organization and config IDs for tenant isolation
    const searchResults = await this.vectorRepository.searchKnowledgeItems(
      organizationId,
      chatbotConfigId,
      dummyEmbedding,
      searchOptions
    );

    const items = searchResults.map(result => result.item);
    return this.filteringService.getUniqueTags(items);
  }
}