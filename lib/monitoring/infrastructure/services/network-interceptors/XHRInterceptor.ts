import { globalNetworkMonitor } from '../../../application/services/GlobalNetworkMonitor';
import { NetworkPerformanceThrottler } from '../NetworkPerformanceThrottler';
import { RequestClassifier } from './RequestClassifier';
import { PayloadParser } from './PayloadParser';
import { CallSource } from '../SourceTracker';

interface XHRInterceptorData {
  method: string;
  url: string;
  startTime: number;
  source?: {
    stack?: string;
    component?: string;
    hook?: string;
    file?: string;
    line?: number;
    trigger?: 'mount' | 'state-change' | 'user-action' | 'navigation' | 'unknown';
  };
}

// Extend XMLHttpRequest to include our interceptor data
interface XMLHttpRequestWithInterceptor extends XMLHttpRequest {
  _interceptorData?: XHRInterceptorData;
  _callId?: string;
}

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
    
    // Store references to avoid 'this' aliasing
    const shouldAllowRequest = this.performanceThrottler.shouldAllowRequest.bind(this.performanceThrottler);
    const captureSourceSync = this.captureSourceSync.bind(this);
    const originalXHROpen = this.originalXHROpen;
    const originalXHRSend = this.originalXHRSend;
    const classifyRequestType = this.requestClassifier.classifyRequestType.bind(this.requestClassifier);
    const parsePayload = this.payloadParser.parsePayload.bind(this.payloadParser);
    
    XMLHttpRequest.prototype.open = function(
      method: string, 
      url: string | URL, 
      async?: boolean, 
      username?: string | null, 
      password?: string | null
    ) {
      // Throttling check for XHR
      if (!shouldAllowRequest()) {
        throw new Error('XHR request throttled');
      }
      
      // Efficient source capture
      const capturedSource = captureSourceSync();
      
      (this as XMLHttpRequestWithInterceptor)._interceptorData = {
        method,
        url: url.toString(),
        startTime: Date.now(),
        source: capturedSource,
      };
      
      return originalXHROpen!.call(this, method, url, async ?? true, username, password);
    };
    
    XMLHttpRequest.prototype.send = function(body?: Document | XMLHttpRequestBodyInit | null) {
      const interceptorData = (this as XMLHttpRequestWithInterceptor)._interceptorData;
      
      if (interceptorData) {
        const callId = globalNetworkMonitor.trackCall({
          url: interceptorData.url,
          method: interceptorData.method,
          type: classifyRequestType(interceptorData.url, false),
          payload: body ? parsePayload(body) : undefined,
          source: interceptorData.source,
        });
        
        (this as XMLHttpRequestWithInterceptor)._callId = callId;
        
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
      
      return originalXHRSend!.call(this, body);
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
  private captureSourceSync(): CallSource | undefined {
    try {
      // Dynamic import cannot be used synchronously in XHR context
      // Return undefined for now - could be improved with async handling
      return undefined;
    } catch {
      return undefined;
    }
  }
} 