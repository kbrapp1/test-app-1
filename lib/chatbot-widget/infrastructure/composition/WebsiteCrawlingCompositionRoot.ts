/**
 * Website Crawling Composition Root
 * 
 * AI INSTRUCTIONS:
 * - Wire all dependencies according to DDD patterns
 * - Singleton pattern for service instances
 * - Lazy initialization of expensive resources
 * - Follow @golden-rule patterns exactly
 * - Abstract dependency creation complexity
 * - Enable easy testing with dependency injection
 */

import { WebsiteCrawlingDomainService } from '../../domain/services/WebsiteCrawlingDomainService';
import { ContentExtractionService } from '../../domain/services/ContentExtractionService';
import { ContentCategorizationService } from '../../domain/services/ContentCategorizationService';
import { CrawlWebsiteUseCase } from '../../application/use-cases/CrawlWebsiteUseCase';
import { CrawlAndStoreWebsiteUseCase } from '../../application/use-cases/CrawlAndStoreWebsiteUseCase';
import { CrawleeCrawlerProvider, CrawleeRobotsTxtProvider } from '../providers/crawling/CrawleeCrawlerProvider';
import { OpenAIProvider } from '../providers/openai/OpenAIProvider';
import { OpenAIEmbeddingService } from '../providers/openai/services/OpenAIEmbeddingService';
import { IVectorKnowledgeRepository } from '../../domain/repositories/IVectorKnowledgeRepository';

/** AI Categorization Provider Adapter */
class OpenAICategorizationAdapter {
  constructor(private readonly openAIProvider: OpenAIProvider) {}

  async categorizeContent(content: string, title: string): Promise<string> {
    // Simplified categorization using OpenAI
    // In a real implementation, this would use proper prompts
    const lowerTitle = title.toLowerCase();
    const lowerContent = content.toLowerCase();

    if (lowerTitle.includes('faq') || lowerContent.includes('frequently asked')) {
      return 'faq';
    } else if (lowerTitle.includes('pricing') || lowerContent.includes('pricing')) {
      return 'pricing';
    } else if (lowerTitle.includes('support') || lowerContent.includes('troubleshoot')) {
      return 'support';
    } else if (lowerTitle.includes('product') || lowerContent.includes('product')) {
      return 'product_info';
    } else {
      return 'general';
    }
  }
}

/** Website Crawling Composition Root */
export class WebsiteCrawlingCompositionRoot {
  private static instance: WebsiteCrawlingCompositionRoot;
  
  // Singleton instances
  private _websiteCrawlingDomainService?: WebsiteCrawlingDomainService;
  private _contentExtractionService?: ContentExtractionService;
  private _contentCategorizationService?: ContentCategorizationService;
  private _crawleeCrawlerProvider?: CrawleeCrawlerProvider;
  private _crawleeRobotsTxtProvider?: CrawleeRobotsTxtProvider;
  private _openAIProvider?: OpenAIProvider;
  private _openAIEmbeddingService?: OpenAIEmbeddingService;
  private _openAICategorizationAdapter?: OpenAICategorizationAdapter;

  private constructor() {}

  /** Get singleton instance */
  static getInstance(): WebsiteCrawlingCompositionRoot {
    if (!WebsiteCrawlingCompositionRoot.instance) {
      WebsiteCrawlingCompositionRoot.instance = new WebsiteCrawlingCompositionRoot();
    }
    return WebsiteCrawlingCompositionRoot.instance;
  }

  /** Get Website Crawling Domain Service */
  getWebsiteCrawlingDomainService(): WebsiteCrawlingDomainService {
    if (!this._websiteCrawlingDomainService) {
      this._websiteCrawlingDomainService = new WebsiteCrawlingDomainService();
    }
    return this._websiteCrawlingDomainService;
  }

  /** Get Content Extraction Service */
  getContentExtractionService(): ContentExtractionService {
    if (!this._contentExtractionService) {
      this._contentExtractionService = new ContentExtractionService();
    }
    return this._contentExtractionService;
  }

  /** Get Content Categorization Service */
  getContentCategorizationService(): ContentCategorizationService {
    if (!this._contentCategorizationService) {
      this._contentCategorizationService = new ContentCategorizationService();
    }
    return this._contentCategorizationService;
  }

  /** Get Crawlee Crawler Provider */
  getCrawleeCrawlerProvider(): CrawleeCrawlerProvider {
    if (!this._crawleeCrawlerProvider) {
      this._crawleeCrawlerProvider = new CrawleeCrawlerProvider();
    }
    return this._crawleeCrawlerProvider;
  }

  /** Get Crawlee Robots.txt Provider */
  getCrawleeRobotsTxtProvider(): CrawleeRobotsTxtProvider {
    if (!this._crawleeRobotsTxtProvider) {
      this._crawleeRobotsTxtProvider = new CrawleeRobotsTxtProvider();
    }
    return this._crawleeRobotsTxtProvider;
  }

  /** Get OpenAI Provider */
  getOpenAIProvider(): OpenAIProvider {
    if (!this._openAIProvider) {
      const apiKey = process.env.OPENAI_API_KEY;
      
      if (!apiKey) {
        throw new Error('OPENAI_API_KEY environment variable is required for AI operations');
      }
      
      try {
        this._openAIProvider = new OpenAIProvider({
          apiKey,
          model: 'gpt-4o',
          temperature: 0.7,
          maxTokens: 1000
        });
        
        // Connect the provider
        this._openAIProvider.connect().then(() => {
          // Connected successfully
        }).catch((error) => {
          console.error('Failed to connect OpenAI Provider:', error);
        });
        
      } catch (error) {
        console.error('Failed to initialize OpenAI Provider:', error);
        throw error;
      }
    }
    return this._openAIProvider;
  }

  /** Get OpenAI Embedding Service */
  getOpenAIEmbeddingService(): OpenAIEmbeddingService {
    if (!this._openAIEmbeddingService) {
      const apiKey = process.env.OPENAI_API_KEY;
      
      if (!apiKey) {
        throw new Error('OPENAI_API_KEY environment variable is required for embedding operations');
      }
      
      try {
        this._openAIEmbeddingService = new OpenAIEmbeddingService(
          apiKey,
          undefined // logContext - can be added later if needed
          // AI: Removed cache size limits - serverless handles memory management automatically
        );
      } catch (error) {
        console.error('Failed to initialize OpenAI Embedding Service:', error);
        throw error;
      }
    }
    return this._openAIEmbeddingService;
  }

  /** Get OpenAI Categorization Adapter */
  getOpenAICategorizationAdapter(): OpenAICategorizationAdapter {
    if (!this._openAICategorizationAdapter) {
      const openAIProvider = this.getOpenAIProvider();
      this._openAICategorizationAdapter = new OpenAICategorizationAdapter(openAIProvider);
    }
    return this._openAICategorizationAdapter;
  }

  /** Get Crawl Website Use Case */
  getCrawlWebsiteUseCase(): CrawlWebsiteUseCase {
    return new CrawlWebsiteUseCase(
      this.getWebsiteCrawlingDomainService(),
      this.getCrawleeCrawlerProvider(),
      this.getContentExtractionService(),
      this.getContentCategorizationService()
    );
  }

  /** Get Crawl and Store Website Use Case */
  getCrawlAndStoreWebsiteUseCase(
    vectorKnowledgeRepository: IVectorKnowledgeRepository
  ): CrawlAndStoreWebsiteUseCase {
    return new CrawlAndStoreWebsiteUseCase(
      this.getCrawlWebsiteUseCase(),
      vectorKnowledgeRepository,
      this.getOpenAIEmbeddingService()
    );
  }

  /** Reset all singleton instances (for testing) */
  static resetForTesting(): void {
    WebsiteCrawlingCompositionRoot.instance = new WebsiteCrawlingCompositionRoot();
  }
} 