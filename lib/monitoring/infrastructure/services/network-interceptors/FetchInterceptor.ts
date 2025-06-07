import { globalNetworkMonitor } from '../../../application/services/GlobalNetworkMonitor';
import { NetworkPerformanceThrottler } from '../NetworkPerformanceThrottler';
import { RequestClassifier } from './RequestClassifier';
import { PayloadParser } from './PayloadParser';

/**
 * Service responsible for intercepting and monitoring fetch() calls
 * 
 * Handles fetch request interception with throttling, performance monitoring,
 * and comprehensive request tracking for network analysis.
 */
export class FetchInterceptor {
  private originalFetch?: typeof fetch;
  private isInstalled = false;

  constructor(
    private performanceThrottler: NetworkPerformanceThrottler,
    private requestClassifier: RequestClassifier,
    private payloadParser: PayloadParser
  ) {
    if (typeof window !== 'undefined') {
      this.originalFetch = fetch;
    }
  }

  /**
   * Install fetch interception with throttling and monitoring
   */
  install(): void {
    if (this.isInstalled || typeof window === 'undefined' || !this.originalFetch) return;
    
    const self = this;
    
    window.fetch = async function(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
      const processingStart = performance.now();
      
      // Check throttling first
      if (!self.performanceThrottler.shouldAllowRequest()) {
        throw new Error('Request throttled');
      }
      
      const startTime = Date.now();
      const url = self.extractUrl(input);
      const method = init?.method || 'GET';
      
      // Efficient header parsing
      const headers = new Headers(init?.headers);
      const nextAction = headers.get('next-action');
      const isServerAction = !!nextAction;
      
      // Handle Server Actions and relative URLs
      const normalizedUrl = self.normalizeUrl(url, nextAction, isServerAction);
      
      // Optimized source capture with early exit
      const capturedSource = await self.captureSource();
      
      // Efficient payload parsing
      const payload = self.payloadParser.parseRequestPayload(init, nextAction, isServerAction);
      
      // Track performance overhead
      self.performanceThrottler.trackProcessingTime(processingStart);
      
      // Track the call
      const callId = globalNetworkMonitor.trackCall({
        url: normalizedUrl,
        method,
        type: self.requestClassifier.classifyRequestType(normalizedUrl, isServerAction),
        payload,
        headers: init?.headers ? self.payloadParser.parseHeaders(init.headers) : undefined,
        source: capturedSource,
      });
      
      try {
        const response = await self.originalFetch!.call(this, input, init);
        const duration = Date.now() - startTime;
        
        globalNetworkMonitor.completeCall(callId, {
          duration,
          status: response.status,
          response: response.ok ? 'success' : 'error',
        });
        
        return response;
      } catch (error) {
        const duration = Date.now() - startTime;
        
        globalNetworkMonitor.completeCall(callId, {
          duration,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        
        throw error;
      }
    };
    
    this.isInstalled = true;
  }

  /**
   * Remove fetch interception
   */
  uninstall(): void {
    if (!this.isInstalled || typeof window === 'undefined' || !this.originalFetch) return;
    
    window.fetch = this.originalFetch;
    this.isInstalled = false;
  }

  /**
   * Check if fetch interception is currently active
   */
  isActive(): boolean {
    return this.isInstalled;
  }

  /**
   * Extract URL from various RequestInfo types
   */
  private extractUrl(input: RequestInfo | URL): string {
    if (typeof input === 'string') {
      return input;
    } else if (input instanceof URL) {
      return input.toString();
    } else if (input instanceof Request) {
      return input.url;
    } else {
      return String(input);
    }
  }

  /**
   * Normalize URL for Server Actions and relative paths
   */
  private normalizeUrl(url: string, nextAction: string | null, isServerAction: boolean): string {
    if (isServerAction && (!url || url === '' || url === window.location.href)) {
      const actionHash = nextAction?.split(',')[0] || '';
      let normalizedUrl = window.location.pathname;
      if (actionHash) {
        normalizedUrl += ` [Action: ${actionHash.substring(0, 8)}...]`;
      }
      return normalizedUrl;
    }
    
    if (url.startsWith('/') && typeof window !== 'undefined') {
      return window.location.origin + url;
    }
    
    return url;
  }

  /**
   * Capture source information with error handling
   */
  private async captureSource(): Promise<any> {
    try {
      const { SourceTracker } = await import('../SourceTracker');
      return SourceTracker.captureSource();
    } catch {
      return undefined;
    }
  }
} 