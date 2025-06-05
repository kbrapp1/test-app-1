/**
 * Generic Network Interceptors
 * 
 * Automatically intercept and monitor ALL network requests:
 * - fetch() calls
 * - XMLHttpRequest calls  
 * - Server Actions
 * - Next.js API routes
 */

import { globalNetworkMonitor } from '../application/services/GlobalNetworkMonitor';

export class NetworkInterceptors {
  private originalFetch?: typeof fetch;
  private originalXHROpen?: typeof XMLHttpRequest.prototype.open;
  private originalXHRSend?: typeof XMLHttpRequest.prototype.send;
  private isInstalled = false;

  constructor() {
    // Only initialize if we're in a browser environment
    if (typeof window !== 'undefined') {
      this.originalFetch = fetch;
      this.originalXHROpen = XMLHttpRequest.prototype.open;
      this.originalXHRSend = XMLHttpRequest.prototype.send;
    }
  }

  /**
   * Install all network interceptors
   */
  install(): void {
    if (this.isInstalled || typeof window === 'undefined') return;
    
    this.interceptFetch();
    this.interceptXHR();
    this.interceptServerActions();
    
    this.isInstalled = true;
  }

  /**
   * Remove all network interceptors
   */
  uninstall(): void {
    if (!this.isInstalled || typeof window === 'undefined') return;
    
    // Restore original implementations
    if (this.originalFetch) {
      window.fetch = this.originalFetch;
    }
    if (this.originalXHROpen) {
      XMLHttpRequest.prototype.open = this.originalXHROpen;
    }
    if (this.originalXHRSend) {
      XMLHttpRequest.prototype.send = this.originalXHRSend;
    }
    
    this.isInstalled = false;
  }

  /**
   * Intercept fetch() calls
   */
  private interceptFetch(): void {
    if (!this.originalFetch) return;
    const self = this;
    
    window.fetch = async function(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
      const startTime = Date.now();
      const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
      const method = init?.method || 'GET';
      
      // Check if this is a server action
      const headers = new Headers(init?.headers);
      const nextAction = headers.get('next-action');
      const isServerAction = !!nextAction;
      
      // Capture source IMMEDIATELY before any monitoring processing
      let capturedSource;
      try {
        // Import SourceTracker dynamically to avoid circular dependency
        const { SourceTracker } = await import('../infrastructure/services/SourceTracker');
        capturedSource = SourceTracker.captureSource();
        
        // DEBUG: Log what we're capturing
        console.log('🔍 Network Intercept Debug:', {
          url,
          method,
          isServerAction,
          nextAction,
          type: self.classifyRequestType(url, isServerAction),
          capturedSource,
          stack: capturedSource?.stack?.split('\n').slice(0, 3)
        });
      } catch (error) {
        // Fallback if SourceTracker is not available
        capturedSource = undefined;
        console.log('❌ SourceTracker failed:', error);
      }
      
      // Capture payload data for server actions and important requests  
      let payload: any = undefined;
      if (isServerAction && nextAction) {
        payload = { actionId: nextAction };
      } else if (init?.body && typeof init.body === 'string') {
        try {
          payload = JSON.parse(init.body);
        } catch {
          // Not JSON, skip
        }
      }
      
      // Track the call start with pre-captured source
      const callId = globalNetworkMonitor.trackCall({
        url,
        method,
        type: self.classifyRequestType(url, isServerAction),
        payload: payload,
        headers: init?.headers ? self.parseHeaders(init.headers) : undefined,
        source: capturedSource, // Use pre-captured source
      });
      
      try {
        const response = await self.originalFetch!.call(this, input, init);
        const duration = Date.now() - startTime;
        
        // Track completion
        globalNetworkMonitor.completeCall(callId, {
          duration,
          status: response.status,
          response: response.ok ? 'success' : 'error',
        });
        
        return response;
      } catch (error) {
        const duration = Date.now() - startTime;
        
        // Track error
        globalNetworkMonitor.completeCall(callId, {
          duration,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        
        throw error;
      }
    };
  }

  /**
   * Intercept XMLHttpRequest calls
   */
  private interceptXHR(): void {
    if (!this.originalXHROpen || !this.originalXHRSend) return;
    const self = this;
    
    XMLHttpRequest.prototype.open = function(method: string, url: string | URL, async?: boolean, username?: string | null, password?: string | null) {
      // Capture source IMMEDIATELY when XHR is opened
      let capturedSource;
      try {
        // Import SourceTracker dynamically to avoid circular dependency
        const { SourceTracker } = require('../infrastructure/services/SourceTracker');
        capturedSource = SourceTracker.captureSource();
      } catch (error) {
        // Fallback if SourceTracker is not available
        capturedSource = undefined;
      }
      
      // Store request info on the XHR instance
      (this as any)._interceptorData = {
        method,
        url: url.toString(),
        startTime: Date.now(),
        source: capturedSource, // Store pre-captured source
      };
      
      return self.originalXHROpen!.call(this, method, url, async ?? true, username, password);
    };
    
    XMLHttpRequest.prototype.send = function(body?: any) {
      const interceptorData = (this as any)._interceptorData;
      
      if (interceptorData) {
        // Track the call start with pre-captured source
        const callId = globalNetworkMonitor.trackCall({
          url: interceptorData.url,
          method: interceptorData.method,
          type: self.classifyRequestType(interceptorData.url, false), // XHR is never a server action
          payload: body ? self.parsePayload(body) : undefined,
          source: interceptorData.source, // Use pre-captured source
        });
        
        // Store call ID for completion tracking
        (this as any)._callId = callId;
        
        // Listen for completion
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
  }

  /**
   * Intercept Server Actions by patching middleware
   */
  private interceptServerActions(): void {
    // This is already handled by the main fetch interceptor
    // Server actions are detected by the 'next-action' header in the main interceptor
    // No separate override needed
  }

  /**
   * Classify request type based on URL
   */
  private classifyRequestType(url: string, isServerAction: boolean): 'server-action' | 'api-route' | 'fetch' | 'xhr' | 'unknown' {
    // Add debug logging
    console.log('🏷️ Classifying URL:', url, 'isServerAction:', isServerAction);
    
    // Check server action flag FIRST - server actions can have empty URLs
    if (isServerAction) return 'server-action';
    
    if (!url || url === '') return 'unknown';
    if (url.includes('/api/')) return 'api-route';
    if (url.includes('/_next/')) return 'unknown'; // Next.js internal
    if (url.startsWith('http')) return 'fetch';
    if (url.startsWith('/')) return 'api-route'; // Relative API calls
    return 'unknown';
  }

  /**
   * Parse request payload
   */
  private parsePayload(body: any): any {
    if (typeof body === 'string') {
      try {
        return JSON.parse(body);
      } catch {
        return body;
      }
    }
    
    if (body instanceof FormData) {
      const data: Record<string, any> = {};
      body.forEach((value, key) => {
        data[key] = value;
      });
      return data;
    }
    
    return body;
  }

  /**
   * Parse headers
   */
  private parseHeaders(headers: HeadersInit): Record<string, string> {
    if (headers instanceof Headers) {
      return Object.fromEntries(headers.entries());
    }
    
    if (Array.isArray(headers)) {
      return Object.fromEntries(headers);
    }
    
    return headers as Record<string, string>;
  }
}

// Global singleton
export const networkInterceptors = new NetworkInterceptors();

// Auto-install in development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  networkInterceptors.install();
} 