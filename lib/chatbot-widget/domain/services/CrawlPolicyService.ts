/**
 * Crawl Policy Service
 * 
 * AI INSTRUCTIONS:
 * - Single responsibility: Orchestrate crawling policy decisions
 * - Keep orchestration logic pure and deterministic
 * - Never exceed 250 lines per @golden-rule
 * - Coordinate URL evaluation, content assessment, and priority calculation
 * - Support configurable crawling strategies
 * - Enable efficient crawl planning and execution
 */

import { WebsiteCrawlSettings } from '../value-objects/ai-configuration/KnowledgeBase';
import { UrlEvaluationService } from './UrlEvaluationService';
import { ContentValuePolicy } from './ContentValuePolicy';
import { CrawlPriorityService } from './CrawlPriorityService';

/** Domain model for URL evaluation result */
export interface UrlEvaluation {
  readonly shouldCrawl: boolean;
  readonly reason: string;
  readonly priority: 'high' | 'medium' | 'low';
  readonly estimatedValue: number;
}

/**
 * Orchestrating Service for Crawl Policy Decisions
 * 
 * AI INSTRUCTIONS:
 * - Orchestrate URL crawling policy evaluation using specialized services
 * - Coordinate URL validation, content assessment, and priority calculation
 * - Support different crawling strategies and priorities
 * - Enable comprehensive crawl decision making
 * - Provide clear reasoning for crawling decisions
 */
export class CrawlPolicyService {
  private readonly urlEvaluationService: UrlEvaluationService;
  private readonly contentValuePolicy: ContentValuePolicy;
  private readonly crawlPriorityService: CrawlPriorityService;

  constructor(
    urlEvaluationService?: UrlEvaluationService,
    contentValuePolicy?: ContentValuePolicy,
    crawlPriorityService?: CrawlPriorityService
  ) {
    this.urlEvaluationService = urlEvaluationService ?? new UrlEvaluationService();
    this.contentValuePolicy = contentValuePolicy ?? new ContentValuePolicy();
    this.crawlPriorityService = crawlPriorityService ?? new CrawlPriorityService();
  }

  /** Determine if URL should be crawled based on comprehensive policies */
  shouldCrawlUrl(
    url: string,
    baseUrl: string,
    currentDepth: number,
    settings: WebsiteCrawlSettings
  ): boolean {
    const evaluation = this.evaluateUrl(url, baseUrl, currentDepth, settings);
    return evaluation.shouldCrawl;
  }

  /** Evaluate URL with detailed reasoning and priority */
  evaluateUrl(
    url: string,
    baseUrl: string,
    currentDepth: number,
    settings: WebsiteCrawlSettings
  ): UrlEvaluation {
    // Validate URL structure and domain boundaries
    const urlValidation = this.urlEvaluationService.validateUrl(url, baseUrl, currentDepth, settings.maxDepth);
    if (!urlValidation.isValid) {
      return {
        shouldCrawl: false,
        reason: urlValidation.reason,
        priority: 'low',
        estimatedValue: 0
      };
    }

    // Assess content value
    const contentAssessment = this.contentValuePolicy.assessContentValue(url);
    if (!contentAssessment.hasValue) {
      return {
        shouldCrawl: false,
        reason: contentAssessment.reason,
        priority: 'low',
        estimatedValue: 0
      };
    }

    // Calculate priority and value for valuable URLs
    const priorityAssessment = this.crawlPriorityService.assessCrawlPriority(url, currentDepth);

    return {
      shouldCrawl: true,
      reason: 'Meets all crawling criteria',
      priority: priorityAssessment.priority,
      estimatedValue: priorityAssessment.estimatedValue
    };
  }

  /** Check if URLs are from the same domain */
  isSameDomain(url: string, baseUrl: string): boolean {
    return this.urlEvaluationService.isSameDomain(url, baseUrl);
  }

  /** Determine if URL points to valuable content for lead generation */
  isValuableLeadGenContent(url: string): boolean {
    const assessment = this.contentValuePolicy.assessContentValue(url);
    return assessment.isLeadGenerated;
  }

  /** Determine if URL points to valuable content */
  isValuableContent(url: string): boolean {
    return this.contentValuePolicy.isValuableContent(url);
  }

  /** Calculate URL priority for crawl ordering */
  calculateUrlPriority(url: string, depth: number): 'high' | 'medium' | 'low' {
    return this.crawlPriorityService.calculateUrlPriority(url, depth);
  }

  /** Estimate value of URL for crawl planning */
  estimateUrlValue(url: string, depth: number): number {
    return this.crawlPriorityService.estimateUrlValue(url, depth);
  }

  /** Get URLs that should be prioritized for crawling */
  getPriorityUrlPatterns(): string[] {
    return this.crawlPriorityService.getPriorityUrlPatterns();
  }
}