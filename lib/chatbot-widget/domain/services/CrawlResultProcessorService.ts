/**
 * Crawl Result Processor Service
 * 
 * AI INSTRUCTIONS:
 * - Single responsibility: Process and transform crawl results
 * - Keep processing logic pure and focused
 * - Never exceed 250 lines per @golden-rule
 * - Handle quality filtering and knowledge item generation
 * - Support comprehensive result analysis and transformation
 * - Generate business metrics and insights from crawl data
 */

import { createHash } from 'crypto';
import { KnowledgeItem } from '../services/interfaces/IKnowledgeRetrievalService';
import { CrawledPageData, CrawlResult } from './WebsiteCrawlingDomainService';

/** Domain model for crawl metrics */
export interface CrawlMetrics {
  readonly totalPages: number;
  readonly successfulPages: number;
  readonly failedPages: number;
  readonly skippedPages: number;
  readonly averageResponseTime: number;
  readonly successRate: number;
  readonly qualityScore: number;
}

/**
 * Specialized Service for Crawl Result Processing
 * 
 * AI INSTRUCTIONS:
 * - Handle comprehensive processing of crawl results
 * - Apply quality filtering and content analysis
 * - Generate knowledge items from crawled content
 * - Calculate business metrics and success indicators
 * - Support result optimization and insights generation
 */
export class CrawlResultProcessorService {

  /** Process crawl results comprehensively */
  processComprehensively(crawledPages: CrawledPageData[]): CrawlResult {
    // Apply quality filtering
    const qualityFilteredPages = this.filterQualityContent(crawledPages);
    
    // Calculate comprehensive metrics
    const metrics = this.calculateDetailedMetrics(crawledPages);
    
    // Generate knowledge items from quality content
    const knowledgeItems = this.generateKnowledgeItems(qualityFilteredPages);

    return {
      knowledgeItems,
      crawledPages: qualityFilteredPages,
      totalPagesAttempted: metrics.totalPages,
      successfulPages: metrics.successfulPages,
      failedPages: metrics.failedPages,
      skippedPages: metrics.skippedPages
    };
  }

  /** Filter content based on quality criteria */
  filterQualityContent(pages: CrawledPageData[]): CrawledPageData[] {
    return pages.filter(page => this.isQualityContent(page));
  }

  /** Calculate detailed crawl metrics */
  calculateDetailedMetrics(pages: CrawledPageData[]): CrawlMetrics {
    const totalPages = pages.length;
    const successfulPages = pages.filter(p => p.status === 'success').length;
    const failedPages = pages.filter(p => p.status === 'failed').length;
    const skippedPages = pages.filter(p => p.status === 'skipped').length;

    // Calculate average response time from successful pages
    const successfulPagesWithTime = pages.filter(p => 
      p.status === 'success' && p.responseTime !== undefined
    );
    const averageResponseTime = successfulPagesWithTime.length > 0
      ? successfulPagesWithTime.reduce((sum, p) => sum + (p.responseTime || 0), 0) / successfulPagesWithTime.length
      : 0;

    // Calculate success rate
    const successRate = totalPages > 0 ? (successfulPages / totalPages) * 100 : 0;

    // Calculate quality score based on content quality
    const qualityScore = this.calculateQualityScore(pages);

    return {
      totalPages,
      successfulPages,
      failedPages,
      skippedPages,
      averageResponseTime: Number(averageResponseTime.toFixed(2)),
      successRate: Number(successRate.toFixed(2)),
      qualityScore: Number(qualityScore.toFixed(2))
    };
  }

  /** Generate knowledge items from crawled pages */
  generateKnowledgeItems(pages: CrawledPageData[]): KnowledgeItem[] {
    return pages
      .filter(page => page.status === 'success')
      .map(page => this.createKnowledgeItem(page));
  }

  /** Check if a page meets quality criteria */
  private isQualityContent(page: CrawledPageData): boolean {
    // Must be successfully crawled
    if (page.status !== 'success') {
      return false;
    }

    // Must have meaningful content length
    if (page.content.length < 100) {
      return false;
    }

    // Must have a proper title
    if (!page.title || page.title.trim().length === 0) {
      return false;
    }

    // Must not be mostly whitespace
    const textContent = page.content.replace(/\s+/g, ' ').trim();
    if (textContent.length < 50) {
      return false;
    }

    // Check for content-to-markup ratio (basic quality indicator)
    const markupPatterns = /<[^>]*>/g;
    const withoutMarkup = page.content.replace(markupPatterns, '');
    const contentRatio = withoutMarkup.length / page.content.length;
    
    // Content should be at least 30% actual text (not markup)
    if (contentRatio < 0.3) {
      return false;
    }

    return true;
  }

  /** Calculate overall quality score for crawl results */
  private calculateQualityScore(pages: CrawledPageData[]): number {
    if (pages.length === 0) {
      return 0;
    }

    const successfulPages = pages.filter(p => p.status === 'success');
    const qualityPages = successfulPages.filter(p => this.isQualityContent(p));

    // Base score from success rate
    const successRate = (successfulPages.length / pages.length) * 100;
    
    // Quality rate from successful pages
    const qualityRate = successfulPages.length > 0 
      ? (qualityPages.length / successfulPages.length) * 100
      : 0;

    // Average content length score (normalized)
    const avgContentLength = qualityPages.length > 0
      ? qualityPages.reduce((sum, p) => sum + p.content.length, 0) / qualityPages.length
      : 0;
    const contentLengthScore = Math.min((avgContentLength / 1000) * 20, 20); // Max 20 points

    // Combined quality score
    const qualityScore = (successRate * 0.4) + (qualityRate * 0.4) + contentLengthScore;
    
    return Math.min(qualityScore, 100);
  }

  /** Create a knowledge item from a crawled page */
  private createKnowledgeItem(page: CrawledPageData): KnowledgeItem {
    // Generate deterministic ID based on URL to prevent duplicates
    const urlForId = page.url.replace(/[#?].*$/, ''); // Remove query params and fragments
    const urlHash = createHash('sha256').update(urlForId).digest('hex').substring(0, 16);
    
    // Create meaningful title with path context
    const urlObj = new URL(page.url);
    const pathContext = urlObj.pathname !== '/' ? ` | ${urlObj.pathname}` : '';
    const knowledgeTitle = `${page.title}${pathContext}`;

    // Calculate relevance score based on content quality
    const relevanceScore = this.calculateRelevanceScore(page);

    return {
      id: `website_${urlHash}`,
      title: knowledgeTitle,
      content: page.content,
      category: 'general' as const, // Will be categorized by ContentCategorizationService
      tags: ['website', 'crawled', `depth-${page.depth}`],
      relevanceScore,
      source: page.url,
      lastUpdated: page.crawledAt
    };
  }

  /** Calculate relevance score for a knowledge item */
  private calculateRelevanceScore(page: CrawledPageData): number {
    let score = 0.5; // Base score

    // Content length bonus (longer content generally more valuable)
    if (page.content.length > 500) score += 0.1;
    if (page.content.length > 1000) score += 0.1;
    if (page.content.length > 2000) score += 0.1;

    // Depth penalty (deeper pages may be less generally relevant)
    score -= page.depth * 0.05;

    // Response time bonus (faster loading may indicate better content)
    if (page.responseTime && page.responseTime < 1000) score += 0.05;

    // Title quality bonus
    if (page.title.length > 10 && page.title.length < 100) score += 0.1;

    // Ensure score is within valid range
    return Math.max(0.1, Math.min(1.0, score));
  }
}