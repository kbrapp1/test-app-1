/**
 * Crawl Budget Calculator Service
 * 
 * AI INSTRUCTIONS:
 * - Single responsibility: Calculate optimal crawl budgets and estimates
 * - Keep calculation logic pure and deterministic
 * - Never exceed 250 lines per @golden-rule
 * - Handle business rules for crawl optimization
 * - Provide actionable crawl planning insights
 * - Support capacity planning and resource estimation
 */

import { WebsiteCrawlSettings } from '../value-objects/ai-configuration/KnowledgeBase';

/**
 * Domain model for crawl budget calculation result
 */
export interface CrawlBudget {
  readonly maxPages: number;
  readonly maxDepth: number;
  readonly estimatedTime: number;
  readonly recommendedConcurrency: number;
  readonly estimatedCost?: number;
  readonly riskLevel: 'low' | 'medium' | 'high';
  readonly recommendations: string[];
}

/**
 * Specialized Service for Crawl Budget Calculation
 * 
 * AI INSTRUCTIONS:
 * - Handle optimal crawl budget calculation
 * - Apply business rules for resource planning
 * - Calculate time and cost estimates
 * - Provide optimization recommendations
 * - Support different crawl scenarios and constraints
 */
export class CrawlBudgetCalculatorService {

  /**
   * Calculate optimal crawl budget based on settings
   * 
   * AI INSTRUCTIONS:
   * - Apply business rules for crawl limits and optimization
   * - Calculate comprehensive budget including time and resources
   * - Provide risk assessment and recommendations
   * - Support efficient crawl planning
   */
  calculateOptimalBudget(settings: WebsiteCrawlSettings): CrawlBudget {
    // Apply business constraints
    const maxPages = Math.min(settings.maxPages, this.getMaxAllowedPages());
    const maxDepth = Math.min(settings.maxDepth, this.getMaxAllowedDepth());
    
    // Calculate time and resource estimates
    const estimatedTime = this.estimateCrawlTime(maxPages, maxDepth);
    const recommendedConcurrency = this.calculateOptimalConcurrency(maxPages);
    const estimatedCost = this.estimateCrawlCost(maxPages, estimatedTime);
    
    // Assess crawl risk level
    const riskLevel = this.assessCrawlRisk(maxPages, maxDepth, recommendedConcurrency);
    
    // Generate optimization recommendations
    const recommendations = this.generateBudgetRecommendations(
      maxPages, 
      maxDepth, 
      estimatedTime, 
      riskLevel
    );

    return {
      maxPages,
      maxDepth,
      estimatedTime,
      recommendedConcurrency,
      estimatedCost,
      riskLevel,
      recommendations
    };
  }

  /**
   * Calculate detailed crawl time estimates
   * 
   * AI INSTRUCTIONS:
   * - Estimate crawl duration based on page count and depth
   * - Consider network latency and processing time
   * - Account for depth-based complexity increase
   * - Provide realistic time projections
   */
  estimateCrawlTime(maxPages: number, maxDepth: number): number {
    // Base time per page (including processing)
    const baseTimePerPage = 2.5; // seconds
    
    // Depth complexity factor (deeper crawls take longer per page)
    const depthComplexityFactor = 1 + (maxDepth - 1) * 0.2;
    
    // Calculate total estimated time
    const estimatedSeconds = maxPages * baseTimePerPage * depthComplexityFactor;
    
    // Add buffer for potential retries and network delays (20% buffer)
    return Math.ceil(estimatedSeconds * 1.2);
  }

  /**
   * Calculate optimal concurrency for crawl performance
   * 
   * AI INSTRUCTIONS:
   * - Balance crawl speed with server respect
   * - Avoid overwhelming target servers
   * - Scale concurrency based on crawl size
   * - Provide conservative but efficient recommendations
   */
  calculateOptimalConcurrency(maxPages: number): number {
    if (maxPages <= 10) {
      return 1; // Very small crawls - single threaded
    } else if (maxPages <= 50) {
      return 2; // Small crawls - minimal concurrency
    } else if (maxPages <= 100) {
      return 3; // Medium crawls - moderate concurrency
    } else {
      return Math.min(4, Math.ceil(maxPages / 30)); // Large crawls - scaled concurrency
    }
  }

  /**
   * Estimate crawl cost based on resource usage
   * 
   * AI INSTRUCTIONS:
   * - Calculate resource costs for crawl operation
   * - Consider processing time and storage costs
   * - Provide budget planning information
   * - Support cost optimization decisions
   */
  estimateCrawlCost(maxPages: number, estimatedTime: number): number {
    // Cost factors (in arbitrary units for planning)
    const processingCostPerSecond = 0.001; // Processing cost
    const storageCostPerPage = 0.005; // Storage cost per page
    const networkCostPerPage = 0.002; // Network/bandwidth cost
    
    const processingCost = estimatedTime * processingCostPerSecond;
    const storageCost = maxPages * storageCostPerPage;
    const networkCost = maxPages * networkCostPerPage;
    
    return Number((processingCost + storageCost + networkCost).toFixed(3));
  }

  /**
   * Assess risk level of crawl operation
   * 
   * AI INSTRUCTIONS:
   * - Evaluate potential risks of crawl configuration
   * - Consider server load and rate limiting risks
   * - Assess complexity and failure probability
   * - Provide risk-based recommendations
   */
  assessCrawlRisk(
    maxPages: number, 
    maxDepth: number, 
    concurrency: number
  ): 'low' | 'medium' | 'high' {
    let riskScore = 0;
    
    // Page count risk
    if (maxPages > 75) riskScore += 2;
    else if (maxPages > 25) riskScore += 1;
    
    // Depth risk
    if (maxDepth > 4) riskScore += 2;
    else if (maxDepth > 2) riskScore += 1;
    
    // Concurrency risk
    if (concurrency > 3) riskScore += 1;
    
    if (riskScore >= 4) return 'high';
    if (riskScore >= 2) return 'medium';
    return 'low';
  }

  /**
   * Generate budget optimization recommendations
   * 
   * AI INSTRUCTIONS:
   * - Provide actionable recommendations for crawl optimization
   * - Consider risk level and resource constraints
   * - Suggest improvements for efficiency and success
   * - Support informed decision making
   */
  generateBudgetRecommendations(
    maxPages: number,
    maxDepth: number,
    estimatedTime: number,
    riskLevel: 'low' | 'medium' | 'high'
  ): string[] {
    const recommendations: string[] = [];

    // Time-based recommendations
    if (estimatedTime > 600) { // More than 10 minutes
      recommendations.push('Consider reducing page count or depth for faster crawling');
    }

    // Risk-based recommendations
    if (riskLevel === 'high') {
      recommendations.push('High risk crawl - consider splitting into smaller batches');
      recommendations.push('Monitor crawl progress closely for potential issues');
    } else if (riskLevel === 'medium') {
      recommendations.push('Medium risk crawl - implement retry logic for failed pages');
    }

    // Efficiency recommendations
    if (maxPages > 50 && maxDepth <= 2) {
      recommendations.push('Shallow but wide crawl - consider increasing concurrency');
    }

    if (maxDepth > 3 && maxPages <= 20) {
      recommendations.push('Deep but narrow crawl - single-threaded approach recommended');
    }

    // Resource optimization
    if (estimatedTime > 300) { // More than 5 minutes
      recommendations.push('Long crawl detected - implement progress tracking and resumption');
    }

    // Default recommendation if no specific ones apply
    if (recommendations.length === 0) {
      recommendations.push('Optimal crawl configuration - proceed with confidence');
    }

    return recommendations;
  }

  /**
   * Get maximum allowed pages per crawl
   */
  private getMaxAllowedPages(): number {
    return 100; // Domain rule: Maximum 100 pages per crawl
  }

  /**
   * Get maximum allowed crawl depth
   */
  private getMaxAllowedDepth(): number {
    return 5; // Domain rule: Maximum depth of 5 levels
  }
}