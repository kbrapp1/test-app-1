/**
 * Health Check Result Value Object
 * 
 * AI INSTRUCTIONS:
 * - Immutable domain value object for health check results
 * - Contains business logic for health assessment
 * - No external dependencies
 * - Encapsulates health check business rules
 */

export interface HealthCheckData {
  status: 'healthy' | 'unhealthy';
  responseTimeMs: number;
  totalItems: number;
  lastUpdated: Date | null;
  organizationId: string;
  chatbotConfigId: string;
  timestamp: Date;
  error?: string;
}

export class HealthCheckResult {
  private constructor(private readonly data: HealthCheckData) {
    this.validateHealthCheck();
  }

  public static createHealthy(
    responseTimeMs: number,
    totalItems: number,
    lastUpdated: Date | null,
    organizationId: string,
    chatbotConfigId: string
  ): HealthCheckResult {
    return new HealthCheckResult({
      status: 'healthy',
      responseTimeMs,
      totalItems,
      lastUpdated,
      organizationId,
      chatbotConfigId,
      timestamp: new Date()
    });
  }

  public static createUnhealthy(
    organizationId: string,
    chatbotConfigId: string,
    error: string
  ): HealthCheckResult {
    return new HealthCheckResult({
      status: 'unhealthy',
      responseTimeMs: -1,
      totalItems: 0,
      lastUpdated: null,
      organizationId,
      chatbotConfigId,
      timestamp: new Date(),
      error
    });
  }

  public get status(): 'healthy' | 'unhealthy' {
    return this.data.status;
  }

  public get responseTimeMs(): number {
    return this.data.responseTimeMs;
  }

  public get totalItems(): number {
    return this.data.totalItems;
  }

  public get lastUpdated(): Date | null {
    return this.data.lastUpdated;
  }

  public get organizationId(): string {
    return this.data.organizationId;
  }

  public get chatbotConfigId(): string {
    return this.data.chatbotConfigId;
  }

  public get timestamp(): Date {
    return this.data.timestamp;
  }

  public get error(): string | undefined {
    return this.data.error;
  }

  /**
   * Business rule: Check if response time is acceptable
   */
  public hasAcceptableResponseTime(): boolean {
    return this.data.responseTimeMs >= 0 && this.data.responseTimeMs < 5000; // 5 second threshold
  }

  /**
   * Business rule: Check if knowledge base has sufficient content
   */
  public hasSufficientContent(): boolean {
    return this.data.totalItems >= 10; // Business rule: At least 10 items for good health
  }

  /**
   * Business rule: Check if content is recent enough
   */
  public hasRecentContent(): boolean {
    if (!this.data.lastUpdated) return false;
    
    const daysSinceUpdate = (Date.now() - this.data.lastUpdated.getTime()) / (1000 * 60 * 60 * 24);
    return daysSinceUpdate <= 90; // Business rule: Content should be updated within 90 days
  }

  /**
   * Business rule: Get overall health score (0-100)
   */
  public getHealthScore(): number {
    if (this.data.status === 'unhealthy') return 0;

    let score = 100;

    // Deduct points for slow response
    if (this.data.responseTimeMs > 1000) score -= 20;
    if (this.data.responseTimeMs > 3000) score -= 30;

    // Deduct points for insufficient content
    if (!this.hasSufficientContent()) score -= 30;

    // Deduct points for stale content
    if (!this.hasRecentContent()) score -= 20;

    return Math.max(0, score);
  }

  /**
   * Business rule: Get health status with detailed assessment
   */
  public getDetailedHealthStatus(): {
    overall: 'excellent' | 'good' | 'fair' | 'poor';
    responseTime: 'fast' | 'acceptable' | 'slow';
    contentAmount: 'sufficient' | 'insufficient';
    contentFreshness: 'fresh' | 'stale';
  } {
    const score = this.getHealthScore();
    
    return {
      overall: score >= 90 ? 'excellent' : score >= 70 ? 'good' : score >= 50 ? 'fair' : 'poor',
      responseTime: this.data.responseTimeMs < 1000 ? 'fast' : this.data.responseTimeMs < 3000 ? 'acceptable' : 'slow',
      contentAmount: this.hasSufficientContent() ? 'sufficient' : 'insufficient',
      contentFreshness: this.hasRecentContent() ? 'fresh' : 'stale'
    };
  }

  public isHealthy(): boolean {
    return this.data.status === 'healthy';
  }

  public toData(): HealthCheckData {
    return {
      status: this.data.status,
      responseTimeMs: this.data.responseTimeMs,
      totalItems: this.data.totalItems,
      lastUpdated: this.data.lastUpdated,
      organizationId: this.data.organizationId,
      chatbotConfigId: this.data.chatbotConfigId,
      timestamp: this.data.timestamp,
      error: this.data.error
    };
  }

  private validateHealthCheck(): void {
    if (!this.data.organizationId) {
      throw new Error('Organization ID is required for health check');
    }

    if (!this.data.chatbotConfigId) {
      throw new Error('Chatbot config ID is required for health check');
    }

    if (!this.data.timestamp) {
      throw new Error('Timestamp is required for health check');
    }

    if (this.data.status === 'healthy' && this.data.responseTimeMs < 0) {
      throw new Error('Healthy status requires valid response time');
    }
  }
}