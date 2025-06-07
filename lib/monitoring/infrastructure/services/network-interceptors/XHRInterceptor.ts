import { globalNetworkMonitor } from '../../../application/services/GlobalNetworkMonitor';
import { NetworkPerformanceThrottler } from '../NetworkPerformanceThrottler';
import { RequestClassifier } from './RequestClassifier';
import { PayloadParser } from './PayloadParser';

/**
 * Service responsible for intercepting and monitoring XMLHttpRequest calls
 * 
 * Handles XHR request interception with throttling, performance monitoring,
 * and comprehensive request tracking for network analysis.
 */
export class XHRInterceptor {
  private originalXHROpen?: typeof XMLHttpRequest.prototype.open;
  private originalXHRSend?: typeof XMLHttpRequest.prototype.send;
  private isInstalled = false;

  constructor(
    private performanceThrottler: NetworkPerformanceThrottler,
    private requestClassifier: RequestClassifier,
    private payloadParser: PayloadParser
  ) {
    if (typeof window !== 'undefined') {
      this.originalXHROpen = XMLHttpRequest.prototype.open;
      this.originalXHRSend = XMLHttpRequest.prototype.send;
    }
  }

  /**
   * Install XHR interception with throttling and monitoring
   */
  install(): void {
    if (this.isInstalled || typeof window === 'undefined') return;
    if (!this.originalXHROpen || !this.originalXHRSend) return;
    
    const self = this;
    
    XMLHttpRequest.prototype.open = function(
      method: string, 
      url: string | URL, 
      async?: boolean, 
      username?: string | null, 
      password?: string | null
    ) {
      // Throttling check for XHR
      if (!self.performanceThrottler.shouldAllowRequest()) {
        throw new Error('XHR request throttled');
      }
      
      // Efficient source capture
      const capturedSource = self.captureSourceSync();
      
      (this as any)._interceptorData = {
        method,
        url: url.toString(),
        startTime: Date.now(),
        source: capturedSource,
      };
      
      return self.originalXHROpen!.call(this, method, url, async ?? true, username, password);
    };
    
    XMLHttpRequest.prototype.send = function(body?: any) {
      const interceptorData = (this as any)._interceptorData;
      
      if (interceptorData) {
        const callId = globalNetworkMonitor.trackCall({
          url: interceptorData.url,
          method: interceptorData.method,
          type: self.requestClassifier.classifyRequestType(interceptorData.url, false),
          payload: body ? self.payloadParser.parsePayload(body) : undefined,
          source: interceptorData.source,
        });
        
        (this as any)._callId = callId;
        
        this.addEventListener('loadend', () => {
          const duration = Date.now() - interceptorData.startTime;
          
          globalNetworkMonitor.completeCall(callId, {
            duration,
            status: this.status,
            response: this.status >= 200 && this.status < 300 ? 'success' : 'error',
            error: this.status >= 400 ? `HTTP ${this.status}` : undefined,
          });
        });
      }
      
      return self.originalXHRSend!.call(this, body);
    };
    
    this.isInstalled = true;
  }

  /**
   * Remove XHR interception
   */
  uninstall(): void {
    if (!this.isInstalled || typeof window === 'undefined') return;
    if (!this.originalXHROpen || !this.originalXHRSend) return;
    
    XMLHttpRequest.prototype.open = this.originalXHROpen;
    XMLHttpRequest.prototype.send = this.originalXHRSend;
    
    this.isInstalled = false;
  }

  /**
   * Check if XHR interception is currently active
   */
  isActive(): boolean {
    return this.isInstalled;
  }

  /**
   * Capture source information synchronously for XHR
   */
  private captureSourceSync(): any {
    try {
      const { SourceTracker } = require('../SourceTracker');
      return SourceTracker.captureSource();
    } catch {
      return undefined;
    }
  }
} 