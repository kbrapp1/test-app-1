interface ApiCallData {
  url: string;
  method: string;
  timestamp: Date;
  component?: string;
  stackTrace: string;
  duration?: number;
}

export class NetworkInterceptor {
  private static apiCalls: ApiCallData[] = [];
  private static isInitialized = false;

  static initialize() {
    if (this.isInitialized || typeof window === 'undefined') return;
    
    // Intercept fetch API
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const startTime = performance.now();
      const url = args[0] as string;
      
      // Capture stack trace to identify calling component
      const stackTrace = new Error().stack || '';
      const component = this.extractComponentFromStack(stackTrace);
      
      this.apiCalls.push({
        url,
        method: 'GET', // Default, could be enhanced
        timestamp: new Date(),
        component,
        stackTrace
      });
      
      try {
        const response = await originalFetch(...args);
        const duration = performance.now() - startTime;
        
        // Update duration
        const lastCall = this.apiCalls[this.apiCalls.length - 1];
        if (lastCall) {
          lastCall.duration = duration;
        }
        
        return response;
      } catch (error) {
        throw error;
      }
    };

    // Intercept XMLHttpRequest if needed
    this.interceptXHR();
    
    this.isInitialized = true;
  }

  private static extractComponentFromStack(stackTrace: string): string | undefined {
    // Parse stack trace to find React component names
    const lines = stackTrace.split('\n');
    
    for (const line of lines) {
      // Multiple patterns for different browsers and build types
      const patterns = [
        /at\s+([A-Z][a-zA-Z]+)/,                    // Chrome: at ComponentName
        /([A-Z][a-zA-Z]+)@/,                        // Safari: ComponentName@
        /at\s+([a-z$_][a-zA-Z0-9$_]*)\s+\(.*\.tsx/, // Minified with .tsx
        /at\s+([a-z$_][a-zA-Z0-9$_]*)\s+\(.*components/ // Minified in components dir
      ];
      
      for (const pattern of patterns) {
        const match = line.match(pattern);
        if (match && match[1]) {
          const name = match[1];
          if (this.isLikelyComponentName(name)) {
            return name;
          }
        }
      }
    }
    
    return undefined;
  }

  private static isLikelyComponentName(name: string): boolean {
    // Component names typically start with uppercase and aren't built-in functions
    const builtInFunctions = ['Object', 'Function', 'Promise', 'Array', 'Error'];
    return !builtInFunctions.includes(name) && /^[A-Z]/.test(name);
  }

  private static interceptXHR() {
    const originalOpen = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function(method: string, url: string | URL, async?: boolean, username?: string | null, password?: string | null) {
      const stackTrace = new Error().stack || '';
      const component = NetworkInterceptor.extractComponentFromStack(stackTrace);
      
      NetworkInterceptor.apiCalls.push({
        url: url.toString(),
        method,
        timestamp: new Date(),
        component,
        stackTrace
      });
      
      return originalOpen.call(this, method, url, async ?? true, username, password);
    };
  }

  static getApiCallsByComponent(): Map<string, ApiCallData[]> {
    const byComponent = new Map<string, ApiCallData[]>();
    
    for (const call of this.apiCalls) {
      if (call.component) {
        const existing = byComponent.get(call.component) || [];
        existing.push(call);
        byComponent.set(call.component, existing);
      }
    }
    
    return byComponent;
  }

  static getWorstApiUsers(): Array<{component: string, callCount: number, calls: ApiCallData[]}> {
    const byComponent = this.getApiCallsByComponent();
    
    return Array.from(byComponent.entries())
      .map(([component, calls]) => ({
        component,
        callCount: calls.length,
        calls
      }))
      .sort((a, b) => b.callCount - a.callCount);
  }

  static getDetectionStats(): {
    totalCalls: number;
    detectedCalls: number;
    detectionRate: number;
    undetectedUrls: string[];
  } {
    const total = this.apiCalls.length;
    const detected = this.apiCalls.filter(call => call.component).length;
    const undetected = this.apiCalls.filter(call => !call.component);
    
    return {
      totalCalls: total,
      detectedCalls: detected,
      detectionRate: total > 0 ? (detected / total) * 100 : 0,
      undetectedUrls: [...new Set(undetected.map(call => call.url))]
    };
  }

  static clear() {
    this.apiCalls = [];
  }
} 