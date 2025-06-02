/**
 * Generic Network Interceptors
 * 
 * Automatically intercept and monitor ALL network requests:
 * - fetch() calls
 * - XMLHttpRequest calls  
 * - Server Actions
 * - Next.js API routes
 */

import { globalNetworkMonitor } from './GenericNetworkMonitor';

export class NetworkInterceptors {
  private originalFetch: typeof fetch;
  private originalXHROpen: typeof XMLHttpRequest.prototype.open;
  private originalXHRSend: typeof XMLHttpRequest.prototype.send;
  private isInstalled = false;

  constructor() {
    this.originalFetch = fetch;
    this.originalXHROpen = XMLHttpRequest.prototype.open;
    this.originalXHRSend = XMLHttpRequest.prototype.send;
  }

  /**
   * Install all network interceptors
   */
  install(): void {
    if (this.isInstalled) return;
    
    this.interceptFetch();
    this.interceptXHR();
    this.interceptServerActions();
    
    this.isInstalled = true;
  }

  /**
   * Remove all network interceptors
   */
  uninstall(): void {
    if (!this.isInstalled) return;
    
    // Restore original implementations
    window.fetch = this.originalFetch;
    XMLHttpRequest.prototype.open = this.originalXHROpen;
    XMLHttpRequest.prototype.send = this.originalXHRSend;
    
    this.isInstalled = false;
  }

  /**
   * Intercept fetch() calls
   */
  private interceptFetch(): void {
    const self = this;
    
    window.fetch = async function(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
      const startTime = Date.now();
      const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
      const method = init?.method || 'GET';
      
      // Track the call start
      const callId = globalNetworkMonitor.trackCall({
        url,
        method,
        type: self.classifyRequestType(url),
        payload: init?.body ? self.parsePayload(init.body) : undefined,
        headers: init?.headers ? self.parseHeaders(init.headers) : undefined,
      });
      
      try {
        const response = await self.originalFetch.call(this, input, init);
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
    const self = this;
    
    XMLHttpRequest.prototype.open = function(method: string, url: string | URL, async?: boolean, username?: string | null, password?: string | null) {
      // Store request info on the XHR instance
      (this as any)._interceptorData = {
        method,
        url: url.toString(),
        startTime: Date.now(),
      };
      
      return self.originalXHROpen.call(this, method, url, async ?? true, username, password);
    };
    
    XMLHttpRequest.prototype.send = function(body?: any) {
      const interceptorData = (this as any)._interceptorData;
      
      if (interceptorData) {
        // Track the call start
        const callId = globalNetworkMonitor.trackCall({
          url: interceptorData.url,
          method: interceptorData.method,
          type: self.classifyRequestType(interceptorData.url),
          payload: body ? self.parsePayload(body) : undefined,
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
      
      return self.originalXHRSend.call(this, body);
    };
  }

  /**
   * Intercept Server Actions by patching middleware
   */
  private interceptServerActions(): void {
    // Monitor for Server Action requests (they have 'next-action' header)
    const originalFetch = window.fetch;
    
    window.fetch = async function(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
      const headers = new Headers(init?.headers);
      const nextAction = headers.get('next-action');
      
      if (nextAction) {
        const startTime = Date.now();
        const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
        
        // Track Server Action
        const callId = globalNetworkMonitor.trackCall({
          url,
          method: 'POST',
          type: 'server-action',
          payload: { actionId: nextAction, body: init?.body },
          headers: Object.fromEntries(headers.entries()),
        });
        
        try {
          const response = await originalFetch.call(this, input, init);
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
      }
      
      // Fall back to regular fetch interception
      return originalFetch.call(this, input, init);
    };
  }

  /**
   * Classify request type based on URL
   */
  private classifyRequestType(url: string): 'server-action' | 'api-route' | 'fetch' | 'xhr' | 'unknown' {
    if (url.includes('/api/')) return 'api-route';
    if (url.includes('/_next/')) return 'unknown'; // Next.js internal
    if (url.startsWith('http')) return 'fetch';
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