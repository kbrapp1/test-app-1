/**
 * AI INSTRUCTIONS: Domain service for website crawling orchestration.
 * Pure business logic with no external dependencies. @golden-rule: <250 lines.
 */

import { WebsiteSource, WebsiteCrawlSettings } from '../value-objects/ai-configuration/KnowledgeBase';
import { KnowledgeItem } from '../services/interfaces/IKnowledgeRetrievalService';
import { CrawlValidationService } from './CrawlValidationService';
import { CrawlBudgetCalculatorService } from './CrawlBudgetCalculatorService';
import { CrawlResultProcessorService } from './CrawlResultProcessorService';
import { CrawlPolicyService } from './CrawlPolicyService';

/** Interface for robots.txt checking abstraction */
export interface IRobotsTxtChecker {
  isAllowed(url: string, userAgent: string): Promise<boolean>;
  canLoad(url: string): Promise<boolean>;
}

/** Domain model for crawled page data */
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

/** Domain model for crawl result */
export interface CrawlResult {
  readonly knowledgeItems: KnowledgeItem[];
  readonly crawledPages: CrawledPageData[];
  readonly totalPagesAttempted: number;
  readonly successfulPages: number;
  readonly failedPages: number;
  readonly skippedPages: number;
}

/** Website Crawling Domain Service */
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

  /** Validate crawl request according to business rules */
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

  /** Calculate crawl budget based on settings and business rules */
  calculateCrawlBudget(settings: WebsiteCrawlSettings): {
    maxPages: number;
    maxDepth: number;
    estimatedTime: number;
    recommendedConcurrency: number;
  } {
    // Delegate budget calculation to specialized service
    return this.budgetCalculator.calculateOptimalBudget(settings);
  }

  /** Process crawl result and apply business validation */
  processCrawlResult(crawledPages: CrawledPageData[]): CrawlResult {
    // Delegate result processing to specialized service
    return this.resultProcessor.processComprehensively(crawledPages);
  }

  /** Check if URL should be crawled based on business rules */
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

  /** Get the crawl validation service */
  getCrawlValidationService(): CrawlValidationService {
    return this.crawlValidation;
  }

  /** Get the crawl policy service */
  getCrawlPolicyService(): CrawlPolicyService {
    return this.crawlPolicy;
  }
} 