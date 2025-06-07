/**
 * Network Performance Throttler (Infrastructure Layer)
 * 
 * Single Responsibility: Manage request throttling and performance overhead
 * Optimizations: Token bucket algorithm, performance monitoring, efficient tracking
 */

interface PerformanceMetrics {
  interceptorOverhead: number;
  throttledRequests: number;
  averageProcessingTime: number;
  peakThroughput: number;
  memoryUsage: number;
}

interface ThrottleConfig {
  maxRequestsPerSecond: number;
  burstCapacity: number;
  monitoringEnabled: boolean;
}

/**
 * Token bucket implementation for efficient rate limiting
 */
class TokenBucket {
  private tokens: number;
  private readonly capacity: number;
  private readonly refillRate: number;
  private lastRefill: number;
  
  constructor(capacity: number, refillRate: number) {
    this.capacity = capacity;
    this.refillRate = refillRate;
    this.tokens = capacity;
    this.lastRefill = Date.now();
  }
  
  tryConsume(tokens = 1): boolean {
    this.refill();
    
    if (this.tokens >= tokens) {
      this.tokens -= tokens;
      return true;
    }
    
    return false;
  }
  
  private refill(): void {
    const now = Date.now();
    const timePassed = (now - this.lastRefill) / 1000;
    const tokensToAdd = Math.floor(timePassed * this.refillRate);
    
    if (tokensToAdd > 0) {
      this.tokens = Math.min(this.capacity, this.tokens + tokensToAdd);
      this.lastRefill = now;
    }
  }
  
  getAvailableTokens(): number {
    this.refill();
    return this.tokens;
  }
}

/**
 * Circular buffer for efficient performance tracking
 */
class PerformanceTracker {
  private measurements: number[];
  private index = 0;
  private size = 0;
  private readonly capacity: number;
  
  constructor(capacity = 100) {
    this.capacity = capacity;
    this.measurements = new Array(capacity);
  }
  
  addMeasurement(value: number): void {
    this.measurements[this.index] = value;
    this.index = (this.index + 1) % this.capacity;
    if (this.size < this.capacity) {
      this.size++;
    }
  }
  
  getAverage(): number {
    if (this.size === 0) return 0;
    
    let sum = 0;
    for (let i = 0; i < this.size; i++) {
      sum += this.measurements[i];
    }
    
    return sum / this.size;
  }
  
  getPeak(): number {
    if (this.size === 0) return 0;
    
    let max = this.measurements[0];
    for (let i = 1; i < this.size; i++) {
      if (this.measurements[i] > max) {
        max = this.measurements[i];
      }
    }
    
    return max;
  }
  
  clear(): void {
    this.index = 0;
    this.size = 0;
  }
}

export class NetworkPerformanceThrottler {
  private readonly tokenBucket: TokenBucket;
  private readonly processingTimeTracker: PerformanceTracker;
  private readonly throughputTracker: PerformanceTracker;
  private throttledCount = 0;
  private totalRequests = 0;
  private config: ThrottleConfig;
  
  constructor(config: Partial<ThrottleConfig> = {}) {
    this.config = {
      maxRequestsPerSecond: 100,
      burstCapacity: 150,
      monitoringEnabled: true,
      ...config
    };
    
    this.tokenBucket = new TokenBucket(
      this.config.burstCapacity,
      this.config.maxRequestsPerSecond
    );
    
    this.processingTimeTracker = new PerformanceTracker(100);
    this.throughputTracker = new PerformanceTracker(60);
  }
  
  /**
   * Check if request should be allowed (throttling)
   */
  shouldAllowRequest(): boolean {
    this.totalRequests++;
    
    if (!this.tokenBucket.tryConsume()) {
      this.throttledCount++;
      return false;
    }
    
    return true;
  }
  
  /**
   * Track interceptor processing time for overhead monitoring
   */
  trackProcessingTime(startTime: number): number {
    const processingTime = performance.now() - startTime;
    
    if (this.config.monitoringEnabled) {
      this.processingTimeTracker.addMeasurement(processingTime);
    }
    
    return processingTime;
  }
  
  /**
   * Track throughput for performance analysis
   */
  trackThroughput(): void {
    if (!this.config.monitoringEnabled) return;
    
    const now = Date.now();
    const oneSecondAgo = now - 1000;
    
    // This is a simplified throughput calculation
    // In practice, you'd track requests per time window more precisely
    this.throughputTracker.addMeasurement(this.config.maxRequestsPerSecond);
  }
  
  /**
   * Get comprehensive performance metrics
   */
  getPerformanceMetrics(): PerformanceMetrics {
    const memoryUsage = this.estimateMemoryUsage();
    
    return {
      interceptorOverhead: this.processingTimeTracker.getAverage(),
      throttledRequests: this.throttledCount,
      averageProcessingTime: this.processingTimeTracker.getAverage(),
      peakThroughput: this.throughputTracker.getPeak(),
      memoryUsage
    };
  }
  
  /**
   * Get throttling statistics
   */
  getThrottleStats(): {
    totalRequests: number;
    throttledRequests: number;
    throttleRate: number;
    availableTokens: number;
  } {
    return {
      totalRequests: this.totalRequests,
      throttledRequests: this.throttledCount,
      throttleRate: this.totalRequests > 0 ? this.throttledCount / this.totalRequests : 0,
      availableTokens: this.tokenBucket.getAvailableTokens()
    };
  }
  
  /**
   * Update throttling configuration
   */
  updateConfig(newConfig: Partial<ThrottleConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }
  
  /**
   * Reset all tracking data
   */
  reset(): void {
    this.throttledCount = 0;
    this.totalRequests = 0;
    this.processingTimeTracker.clear();
    this.throughputTracker.clear();
  }
  
  /**
   * Estimate memory usage of the throttler
   */
  private estimateMemoryUsage(): number {
    // Rough estimation of memory usage in bytes
    const trackerSize = 100 * 8; // 100 numbers * 8 bytes each
    const baseObjectSize = 200; // Estimated base object overhead
    
    return (trackerSize * 2) + baseObjectSize; // Two trackers + base
  }
} 