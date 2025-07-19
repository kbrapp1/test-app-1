/**
 * Knowledge Health Checker Domain Service
 * 
 * AI INSTRUCTIONS:
 * - Pure domain service for health check business logic
 * - Contains business rules for health assessment
 * - No external dependencies beyond domain objects
 * - Encapsulates health check business logic
 */

import { HealthCheckResult } from '../../value-objects/knowledge/HealthCheckResult';

export interface HealthCheckInput {
  organizationId: string;
  chatbotConfigId: string;
  responseTimeMs: number;
  totalItems: number;
  lastUpdated: Date | null;
}

export class KnowledgeHealthChecker {
  /**
   * Perform health check with business rules
   */
  public performHealthCheck(input: HealthCheckInput): HealthCheckResult {
    try {
      // Business rule: Health check validation
      this.validateHealthCheckInput(input);

      // Business rule: Determine health status
      const isHealthy = this.isSystemHealthy(input);

      if (isHealthy) {
        return HealthCheckResult.createHealthy(
          input.responseTimeMs,
          input.totalItems,
          input.lastUpdated,
          input.organizationId,
          input.chatbotConfigId
        );
      } else {
        return HealthCheckResult.createUnhealthy(
          input.organizationId,
          input.chatbotConfigId,
          this.getHealthIssueDescription(input)
        );
      }
    } catch (error) {
      return HealthCheckResult.createUnhealthy(
        input.organizationId,
        input.chatbotConfigId,
        error instanceof Error ? error.message : 'Unknown health check error'
      );
    }
  }

  /**
   * Business rule: Determine if system is healthy
   */
  private isSystemHealthy(input: HealthCheckInput): boolean {
    // Business rule: Response time threshold
    if (input.responseTimeMs > 10000) { // 10 seconds
      return false;
    }

    // Business rule: Minimum content requirement
    if (input.totalItems < 1) {
      return false;
    }

    // Business rule: Content freshness requirement (optional but warning)
    // This doesn't make system unhealthy, just affects score
    
    return true;
  }

  /**
   * Business rule: Get description of health issues
   */
  private getHealthIssueDescription(input: HealthCheckInput): string {
    const issues: string[] = [];

    if (input.responseTimeMs > 10000) {
      issues.push(`Slow response time: ${input.responseTimeMs}ms (max: 10000ms)`);
    }

    if (input.totalItems < 1) {
      issues.push(`Insufficient content: ${input.totalItems} items (min: 1)`);
    }

    if (input.lastUpdated) {
      const daysSinceUpdate = (Date.now() - input.lastUpdated.getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceUpdate > 180) { // 6 months
        issues.push(`Stale content: last updated ${Math.round(daysSinceUpdate)} days ago`);
      }
    } else {
      issues.push('No content update timestamp available');
    }

    return issues.length > 0 ? issues.join('; ') : 'Unknown health issues';
  }

  /**
   * Business rule: Assess response time quality
   */
  public assessResponseTime(responseTimeMs: number): 'excellent' | 'good' | 'acceptable' | 'poor' {
    if (responseTimeMs < 500) return 'excellent';
    if (responseTimeMs < 1000) return 'good';
    if (responseTimeMs < 3000) return 'acceptable';
    return 'poor';
  }

  /**
   * Business rule: Assess content quantity
   */
  public assessContentQuantity(totalItems: number): 'excellent' | 'good' | 'minimal' | 'insufficient' {
    if (totalItems >= 1000) return 'excellent';
    if (totalItems >= 100) return 'good';
    if (totalItems >= 10) return 'minimal';
    return 'insufficient';
  }

  /**
   * Business rule: Assess content freshness
   */
  public assessContentFreshness(lastUpdated: Date | null): 'fresh' | 'recent' | 'stale' | 'unknown' {
    if (!lastUpdated) return 'unknown';

    const daysSinceUpdate = (Date.now() - lastUpdated.getTime()) / (1000 * 60 * 60 * 24);

    if (daysSinceUpdate <= 7) return 'fresh';
    if (daysSinceUpdate <= 30) return 'recent';
    if (daysSinceUpdate <= 90) return 'stale';
    return 'stale';
  }

  /**
   * Business rule: Get comprehensive health assessment
   */
  public getComprehensiveAssessment(input: HealthCheckInput): {
    overall: 'healthy' | 'warning' | 'unhealthy';
    responseTime: 'excellent' | 'good' | 'acceptable' | 'poor';
    contentQuantity: 'excellent' | 'good' | 'minimal' | 'insufficient';
    contentFreshness: 'fresh' | 'recent' | 'stale' | 'unknown';
    score: number;
    recommendations: string[];
  } {
    const responseTimeAssessment = this.assessResponseTime(input.responseTimeMs);
    const contentQuantityAssessment = this.assessContentQuantity(input.totalItems);
    const contentFreshnessAssessment = this.assessContentFreshness(input.lastUpdated);

    // Calculate overall score (0-100)
    let score = 100;

    // Response time scoring
    if (responseTimeAssessment === 'poor') score -= 40;
    else if (responseTimeAssessment === 'acceptable') score -= 20;
    else if (responseTimeAssessment === 'good') score -= 10;

    // Content quantity scoring
    if (contentQuantityAssessment === 'insufficient') score -= 50;
    else if (contentQuantityAssessment === 'minimal') score -= 30;
    else if (contentQuantityAssessment === 'good') score -= 10;

    // Content freshness scoring
    if (contentFreshnessAssessment === 'unknown') score -= 10;
    else if (contentFreshnessAssessment === 'stale') score -= 20;

    score = Math.max(0, score);

    // Overall status
    let overall: 'healthy' | 'warning' | 'unhealthy';
    if (score >= 80) overall = 'healthy';
    else if (score >= 60) overall = 'warning';
    else overall = 'unhealthy';

    // Generate recommendations
    const recommendations = this.generateRecommendations(
      responseTimeAssessment,
      contentQuantityAssessment,
      contentFreshnessAssessment
    );

    return {
      overall,
      responseTime: responseTimeAssessment,
      contentQuantity: contentQuantityAssessment,
      contentFreshness: contentFreshnessAssessment,
      score,
      recommendations
    };
  }

  /**
   * Business rule: Generate improvement recommendations
   */
  private generateRecommendations(
    responseTime: 'excellent' | 'good' | 'acceptable' | 'poor',
    contentQuantity: 'excellent' | 'good' | 'minimal' | 'insufficient',
    contentFreshness: 'fresh' | 'recent' | 'stale' | 'unknown'
  ): string[] {
    const recommendations: string[] = [];

    if (responseTime === 'poor') {
      recommendations.push('Optimize database queries and consider caching strategies');
    } else if (responseTime === 'acceptable') {
      recommendations.push('Consider implementing query optimization for better performance');
    }

    if (contentQuantity === 'insufficient') {
      recommendations.push('Add more knowledge items to improve chatbot effectiveness');
    } else if (contentQuantity === 'minimal') {
      recommendations.push('Consider expanding knowledge base with more comprehensive content');
    }

    if (contentFreshness === 'stale' || contentFreshness === 'unknown') {
      recommendations.push('Update knowledge content to ensure accuracy and relevance');
    }

    if (recommendations.length === 0) {
      recommendations.push('System is performing well, continue regular maintenance');
    }

    return recommendations;
  }

  /**
   * Validate health check input parameters
   */
  private validateHealthCheckInput(input: HealthCheckInput): void {
    if (!input.organizationId?.trim()) {
      throw new Error('Organization ID is required for health check');
    }

    if (!input.chatbotConfigId?.trim()) {
      throw new Error('Chatbot config ID is required for health check');
    }

    if (input.responseTimeMs < 0) {
      throw new Error('Response time cannot be negative');
    }

    if (input.totalItems < 0) {
      throw new Error('Total items cannot be negative');
    }
  }
}