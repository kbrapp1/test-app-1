/**
 * Website Crawling Domain Service
 * 
 * AI INSTRUCTIONS:
 * - Keep business logic pure, no external dependencies
 * - Maintain single responsibility principle  
 * - Never exceed 250 lines - refactor into smaller services
 * - Follow @golden-rule patterns exactly
 * - Focus on domain rules and business validation
 * - Handle domain errors with specific error types
 * - Coordinate other domain services for complex operations
 */

import { WebsiteSource, WebsiteCrawlSettings } from '../value-objects/ai-configuration/KnowledgeBase';
import { KnowledgeItem } from '../services/interfaces/IKnowledgeRetrievalService';
import { CrawlValidationService } from './CrawlValidationService';
import { CrawlBudgetCalculatorService } from './CrawlBudgetCalculatorService';
import { CrawlResultProcessorService } from './CrawlResultProcessorService';
import { CrawlPolicyService } from './CrawlPolicyService';

/**
 * Interface for robots.txt checking abstraction
 * 
 * AI INSTRUCTIONS:
 * - Abstract external robots.txt library from domain logic
 * - Enable testing with mock implementations
 * - Keep domain layer pure from infrastructure dependencies
 */
export interface IRobotsTxtChecker {
  isAllowed(url: string, userAgent: string): Promise<boolean>;
  canLoad(url: string): Promise<boolean>;
}

/**
 * Domain model for crawled page data
 * 
 * AI INSTRUCTIONS:
 * - Represent crawled page in domain terms
 * - Include business-relevant metadata
 * - Support domain operations and validation
 */
export interface CrawledPageData {
  readonly url: string;
  readonly title: string;
  readonly content: string;
  readonly depth: number;
  readonly crawledAt: Date;
  readonly status: 'success' | 'failed' | 'skipped';
  readonly errorMessage?: string;
  readonly responseTime?: number;
  readonly statusCode?: number;
}

/**
 * Domain model for crawl result
 */
export interface CrawlResult {
  readonly knowledgeItems: KnowledgeItem[];
  readonly crawledPages: CrawledPageData[];
  readonly totalPagesAttempted: number;
  readonly successfulPages: number;
  readonly failedPages: number;
  readonly skippedPages: number;
}

/**
 * Website Crawling Domain Service
 * 
 * AI INSTRUCTIONS:
 * - Pure business logic for website crawling orchestration
 * - No external dependencies on crawling libraries
 * - Focus on domain rules and business validation
 * - Coordinate with other domain services
 * - Use domain-specific error handling
 */
export class WebsiteCrawlingDomainService {
  private readonly crawlValidation: CrawlValidationService;
  private readonly budgetCalculator: CrawlBudgetCalculatorService;
  private readonly resultProcessor: CrawlResultProcessorService;
  private readonly crawlPolicy: CrawlPolicyService;

  constructor() {
    this.crawlValidation = new CrawlValidationService();
    this.budgetCalculator = new CrawlBudgetCalculatorService();
    this.resultProcessor = new CrawlResultProcessorService();
    this.crawlPolicy = new CrawlPolicyService();
  }

  /**
   * Validate crawl request according to business rules
   * 
   * AI INSTRUCTIONS:
   * - Delegate validation to specialized service
   * - Coordinate comprehensive validation workflow
   * - Handle validation orchestration and error propagation
   * - Maintain clean separation between coordination and implementation
   */
  async validateCrawlRequest(
    source: WebsiteSource,
    settings: WebsiteCrawlSettings,
    robotsChecker?: IRobotsTxtChecker
  ): Promise<void> {
    // Delegate comprehensive validation to specialized service
    await this.crawlValidation.validateComprehensively(
      source,
      settings,
      robotsChecker
    );
  }

  /**
   * Calculate crawl budget based on settings and business rules
   * 
   * AI INSTRUCTIONS:
   * - Delegate budget calculation to specialized service
   * - Coordinate budget planning workflow
   * - Handle budget constraints and optimization
   * - Provide clean interface for budget calculation
   */
  calculateCrawlBudget(settings: WebsiteCrawlSettings): {
    maxPages: number;
    maxDepth: number;
    estimatedTime: number;
    recommendedConcurrency: number;
  } {
    // Delegate budget calculation to specialized service
    return this.budgetCalculator.calculateOptimalBudget(settings);
  }

  /**
   * Process crawl result and apply business validation
   * 
   * AI INSTRUCTIONS:
   * - Delegate result processing to specialized service
   * - Coordinate result transformation workflow
   * - Handle quality filtering and knowledge item generation
   * - Provide clean interface for result processing
   */
  processCrawlResult(crawledPages: CrawledPageData[]): CrawlResult {
    // Delegate result processing to specialized service
    return this.resultProcessor.processComprehensively(crawledPages);
  }

  /**
   * Check if URL should be crawled based on business rules
   * 
   * AI INSTRUCTIONS:
   * - Apply business rules for URL selection
   * - Consider content value and relevance
   * - Respect crawl depth and limits
   */
  shouldCrawlUrl(
    url: string,
    baseUrl: string,
    currentDepth: number,
    settings: WebsiteCrawlSettings
  ): boolean {
    // Domain rule: Respect depth limits
    if (currentDepth >= settings.maxDepth) {
      return false;
    }
    
    // Domain rule: Only crawl same-domain URLs
    if (!this.crawlPolicy.isSameDomain(url, baseUrl)) {
      return false;
    }
    
    // Domain rule: Skip URLs that won't provide valuable content
    if (!this.crawlPolicy.isValuableContent(url)) {
      return false;
    }

    return true;
  }

  /**
   * Get the crawl validation service for advanced validation scenarios
   * 
   * AI INSTRUCTIONS:
   * - Provide access to specialized validation service
   * - Support advanced validation workflows
   * - Enable external orchestration of validation logic
   */
  getCrawlValidationService(): CrawlValidationService {
    return this.crawlValidation;
  }

  /**
   * Get the crawl policy service for advanced policy decisions
   * 
   * AI INSTRUCTIONS:
   * - Provide access to specialized policy service
   * - Support advanced policy evaluation workflows
   * - Enable external orchestration of policy logic
   */
  getCrawlPolicyService(): CrawlPolicyService {
    return this.crawlPolicy;
  }
} 