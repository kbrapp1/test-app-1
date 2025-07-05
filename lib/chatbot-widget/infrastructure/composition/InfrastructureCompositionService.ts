import { createClient } from '../../../supabase/server';
import { IVectorKnowledgeRepository } from '../../domain/repositories/IVectorKnowledgeRepository';
import { SupabaseVectorKnowledgeRepository } from '../persistence/supabase/SupabaseVectorKnowledgeRepository';
import { OpenAIEmbeddingService } from '../providers/openai/services/OpenAIEmbeddingService';
import { OpenAIProvider } from '../providers/openai/OpenAIProvider';
import { CrawlAndStoreWebsiteUseCase } from '../../application/use-cases/CrawlAndStoreWebsiteUseCase';
import { WebsiteCrawlingCompositionRoot } from './WebsiteCrawlingCompositionRoot';
import { VectorKnowledgeApplicationService } from '../../application/services/VectorKnowledgeApplicationService';
import { WebsiteKnowledgeApplicationService } from '../../application/services/WebsiteKnowledgeApplicationService';
import { WebsiteValidationService } from '../../application/services/WebsiteValidationService';
import { CrawlOrchestrationService } from '../../application/services/CrawlOrchestrationService';
import { BatchProcessingService } from '../../application/services/BatchProcessingService';
import { CrawledPagesQueryService } from '../../application/services/CrawledPagesQueryService';
import { DeduplicateWebsiteContentUseCase } from '../../application/use-cases/DeduplicateWebsiteContentUseCase';
import { UrlNormalizationService } from '../../domain/services/UrlNormalizationService';
import { ContentDeduplicationService } from '../../domain/services/ContentDeduplicationService';
import { IChatbotLoggingService } from '../../domain/services/interfaces/IChatbotLoggingService';
import { ChatbotFileLoggingService } from '../providers/logging/ChatbotFileLoggingService';

/**
 * Infrastructure Composition Service
 * 
 * AI INSTRUCTIONS:
 * - Manage infrastructure service dependencies and wiring
 * - Maintain single responsibility for infrastructure composition
 * - Follow singleton pattern for consistent service instances
 * - Keep under 250 lines following @golden-rule patterns
 * - Delegate complex wiring to separate methods
 * - Handle environment configuration automatically
 */
export class InfrastructureCompositionService {
  // Infrastructure service singletons
  private static vectorKnowledgeRepository: IVectorKnowledgeRepository | null = null;
  private static embeddingService: OpenAIEmbeddingService | null = null;
  private static openAIProvider: OpenAIProvider | null = null;
  private static crawlAndStoreWebsiteUseCase: CrawlAndStoreWebsiteUseCase | null = null;
  private static vectorKnowledgeApplicationService: VectorKnowledgeApplicationService | null = null;
  private static websiteKnowledgeApplicationService: WebsiteKnowledgeApplicationService | null = null;
  private static deduplicateWebsiteContentUseCase: DeduplicateWebsiteContentUseCase | null = null;
  private static urlNormalizationService: UrlNormalizationService | null = null;
  private static contentDeduplicationService: ContentDeduplicationService | null = null;
  private static loggingService: IChatbotLoggingService | null = null;

  /**
   * Get vector knowledge repository singleton
   */
  static getVectorKnowledgeRepository(): IVectorKnowledgeRepository {
    if (!this.vectorKnowledgeRepository) {
      const supabase = createClient();
      this.vectorKnowledgeRepository = new SupabaseVectorKnowledgeRepository(supabase);
    }
    return this.vectorKnowledgeRepository;
  }

  /**
   * Get OpenAI provider singleton
   */
  static getOpenAIProvider(): OpenAIProvider {
    if (!this.openAIProvider) {
      this.openAIProvider = this.createOpenAIProvider();
    }
    return this.openAIProvider;
  }

  /**
   * Get embedding service singleton
   */
  static getEmbeddingService(): OpenAIEmbeddingService {
    if (!this.embeddingService) {
      this.embeddingService = this.createEmbeddingService();
    }
    return this.embeddingService;
  }

  /**
   * Get crawl and store website use case singleton
   */
  static getCrawlAndStoreWebsiteUseCase(): CrawlAndStoreWebsiteUseCase {
    if (!this.crawlAndStoreWebsiteUseCase) {
      const vectorKnowledgeRepository = this.getVectorKnowledgeRepository();
      const websiteCrawlingCompositionRoot = WebsiteCrawlingCompositionRoot.getInstance();
      this.crawlAndStoreWebsiteUseCase = websiteCrawlingCompositionRoot.getCrawlAndStoreWebsiteUseCase(
        vectorKnowledgeRepository
      );
    }
    return this.crawlAndStoreWebsiteUseCase;
  }

  /**
   * Get vector knowledge application service singleton
   */
  static getVectorKnowledgeApplicationService(): VectorKnowledgeApplicationService {
    if (!this.vectorKnowledgeApplicationService) {
      const vectorKnowledgeRepository = this.getVectorKnowledgeRepository();
      const embeddingService = this.getEmbeddingService();
      this.vectorKnowledgeApplicationService = new VectorKnowledgeApplicationService(
        vectorKnowledgeRepository,
        embeddingService
      );
    }
    return this.vectorKnowledgeApplicationService;
  }

  /**
   * Get website knowledge application service singleton
   */
  static getWebsiteKnowledgeApplicationService(): WebsiteKnowledgeApplicationService {
    if (!this.websiteKnowledgeApplicationService) {
      // Create the specialized services
      const crawlAndStoreUseCase = this.getCrawlAndStoreWebsiteUseCase();
      const vectorKnowledgeRepository = this.getVectorKnowledgeRepository();
      
      // Create validation service
      const validationService = new WebsiteValidationService();
      
      // Create crawl orchestration service
      const crawlOrchestrationService = new CrawlOrchestrationService(
        crawlAndStoreUseCase,
        validationService
      );
      
      // Create batch processing service
      const batchProcessingService = new BatchProcessingService(
        crawlOrchestrationService,
        validationService
      );
      
      // Create crawled pages query service
      const crawledPagesQueryService = new CrawledPagesQueryService(
        vectorKnowledgeRepository,
        validationService
      );
      
      // Create main service with all dependencies
      this.websiteKnowledgeApplicationService = new WebsiteKnowledgeApplicationService(
        crawlOrchestrationService,
        batchProcessingService,
        crawledPagesQueryService,
        validationService
      );
    }
    return this.websiteKnowledgeApplicationService;
  }

  /**
   * Get URL normalization service singleton
   */
  static getUrlNormalizationService(): UrlNormalizationService {
    if (!this.urlNormalizationService) {
      this.urlNormalizationService = new UrlNormalizationService();
    }
    return this.urlNormalizationService;
  }

  /**
   * Get content deduplication service singleton
   */
  static getContentDeduplicationService(): ContentDeduplicationService {
    if (!this.contentDeduplicationService) {
      const urlNormalizationService = this.getUrlNormalizationService();
      this.contentDeduplicationService = new ContentDeduplicationService(urlNormalizationService);
    }
    return this.contentDeduplicationService;
  }

  /**
   * Get deduplicate website content use case singleton
   */
  static getDeduplicateWebsiteContentUseCase(): DeduplicateWebsiteContentUseCase {
    if (!this.deduplicateWebsiteContentUseCase) {
      this.deduplicateWebsiteContentUseCase = this.createDeduplicateWebsiteContentUseCase();
    }
    return this.deduplicateWebsiteContentUseCase;
  }

  /**
   * Get logging service singleton
   */
  static getLoggingService(): IChatbotLoggingService {
    if (!this.loggingService) {
      this.loggingService = new ChatbotFileLoggingService();
    }
    return this.loggingService;
  }

  /**
   * Create OpenAI provider with environment configuration
   */
  private static createOpenAIProvider(): OpenAIProvider {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY is required for AI operations');
    }
    
    return new OpenAIProvider({
      apiKey,
      model: 'gpt-3.5-turbo',
      temperature: 0.1,
      maxTokens: 50
    });
  }

  /**
   * Create embedding service with environment configuration
   */
  private static createEmbeddingService(): OpenAIEmbeddingService {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY is required for vector embeddings');
    }
    
    const maxUserQueryCacheSize = process.env.USER_QUERY_CACHE_SIZE 
      ? parseInt(process.env.USER_QUERY_CACHE_SIZE) 
      : 1000;
       
    return new OpenAIEmbeddingService(apiKey, undefined, maxUserQueryCacheSize);
  }

  /**
   * Create deduplicate website content use case with dependencies
   */
  private static createDeduplicateWebsiteContentUseCase(): DeduplicateWebsiteContentUseCase {
    const urlNormalizationService = this.getUrlNormalizationService();
    const contentDeduplicationService = this.getContentDeduplicationService();
    const vectorKnowledgeRepository = this.getVectorKnowledgeRepository();
    
    return new DeduplicateWebsiteContentUseCase(
      urlNormalizationService,
      contentDeduplicationService,
      vectorKnowledgeRepository
    );
  }

  /**
   * Reset all infrastructure services for testing
   */
  static reset(): void {
    this.vectorKnowledgeRepository = null;
    this.embeddingService = null;
    this.openAIProvider = null;
    this.crawlAndStoreWebsiteUseCase = null;
    this.vectorKnowledgeApplicationService = null;
    this.websiteKnowledgeApplicationService = null;
    this.deduplicateWebsiteContentUseCase = null;
    this.urlNormalizationService = null;
    this.contentDeduplicationService = null;
    this.loggingService = null;
  }
} 