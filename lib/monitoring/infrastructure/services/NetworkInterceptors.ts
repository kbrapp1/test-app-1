/**
 * Network Interceptors Manager (Infrastructure Layer)
 * 
 * Single Responsibility: Orchestrate network interception services
 * Coordinates specialized interceptors for fetch and XHR with performance monitoring
 */

import { NetworkPerformanceThrottler } from './NetworkPerformanceThrottler';
import { FetchInterceptor } from './network-interceptors/FetchInterceptor';
import { XHRInterceptor } from './network-interceptors/XHRInterceptor';
import { RequestClassifier } from './network-interceptors/RequestClassifier';
import { PayloadParser } from './network-interceptors/PayloadParser';

// Global throttler instance for all interceptors
const performanceThrottler = new NetworkPerformanceThrottler({
  maxRequestsPerSecond: 100,
  burstCapacity: 150,
  monitoringEnabled: true
});

/**
 * Service responsible for orchestrating network interception
 * 
 * Coordinates specialized fetch and XHR interceptors with shared
 * throttling, classification, and parsing services.
 */
export class NetworkInterceptors {
  private fetchInterceptor: FetchInterceptor;
  private xhrInterceptor: XHRInterceptor;
  private isInstalled = false;

  constructor() {
    // Initialize shared services
    const requestClassifier = new RequestClassifier();
    const payloadParser = new PayloadParser();

    // Initialize specialized interceptors
    this.fetchInterceptor = new FetchInterceptor(
      performanceThrottler,
      requestClassifier,
      payloadParser
    );
    
    this.xhrInterceptor = new XHRInterceptor(
      performanceThrottler,
      requestClassifier,
      payloadParser
    );
  }

  /**
   * Install all network interceptors with throttling
   */
  install(): void {
    if (this.isInstalled || typeof window === 'undefined') return;
    
    this.fetchInterceptor.install();
    this.xhrInterceptor.install();
    
    this.isInstalled = true;
  }

  /**
   * Remove all network interceptors
   */
  uninstall(): void {
    if (!this.isInstalled || typeof window === 'undefined') return;
    
    this.fetchInterceptor.uninstall();
    this.xhrInterceptor.uninstall();
    
    this.isInstalled = false;
  }

  /**
   * Get performance statistics from throttler
   */
  getPerformanceStats() {
    return {
      ...performanceThrottler.getPerformanceMetrics(),
      ...performanceThrottler.getThrottleStats(),
      fetchActive: this.fetchInterceptor.isActive(),
      xhrActive: this.xhrInterceptor.isActive(),
    };
  }
}

// Export singleton instance
export const networkInterceptors = new NetworkInterceptors();

// Auto-install in development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  networkInterceptors.install();
}