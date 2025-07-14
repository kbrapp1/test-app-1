interface QueryClient {
  getQueryCache(): QueryCache;
  // Add other QueryClient methods as needed
}

interface QueryCache {
  getAll(): Query[];
  // Add other QueryCache methods as needed
}

interface Query {
  queryKey: unknown[];
  // Add other Query properties as needed
}

interface ReactQueryStatus {
  isInstalled: boolean;
  isConfigured: boolean;
  queryClient: QueryClient | null;
  activeQueries: number;
  cachedQueries: string[];
  missingCacheKeys: string[];
  version?: string;
}

export class ReactQueryDetector {
  static detect(): ReactQueryStatus {
    const status: ReactQueryStatus = {
      isInstalled: false,
      isConfigured: false,
      queryClient: null,
      activeQueries: 0,
      cachedQueries: [],
      missingCacheKeys: []
    };

    try {
      // Check if React Query is installed
      if (typeof window !== 'undefined') {
        // Look for QueryClient in window context
        const windowWithRQ = window as typeof window & {
          __REACT_QUERY_CLIENT__?: QueryClient;
          queryClient?: QueryClient;
        };
        
        const possibleClients = [
          windowWithRQ.__REACT_QUERY_CLIENT__,
          windowWithRQ.queryClient,
          this.findQueryClientInReactDevTools(),
          this.findQueryClientInDOM()
        ];

        for (const client of possibleClients) {
          if (client && typeof client.getQueryCache === 'function') {
            status.isInstalled = true;
            status.isConfigured = true;
            status.queryClient = client;
            break;
          }
        }

        // Alternative: Check for React Query DevTools
        if (!status.isInstalled) {
          status.isInstalled = this.checkForReactQueryPackage();
        }

        // If we have a client, analyze it
        if (status.queryClient) {
          const queryCache = status.queryClient.getQueryCache();
          const queries = queryCache.getAll();
          
          status.activeQueries = queries.length;
          status.cachedQueries = queries.map((q: Query) => JSON.stringify(q.queryKey));
          
          // Check for common missing cache keys
          status.missingCacheKeys = this.detectMissingCacheKeys(status.cachedQueries);
        }
      }
    } catch {
      // Detection failed, assume not configured
    }

    return status;
  }

  private static findQueryClientInReactDevTools(): QueryClient | null {
    try {
      // Look for React DevTools data
      const reactRoot = document.querySelector('[data-reactroot]');
      const elementWithFiber = reactRoot as Element & {
        _reactInternalFiber?: unknown;
      };
      if (reactRoot && elementWithFiber._reactInternalFiber) {
        // Traverse React fiber tree looking for QueryClient
        return this.traverseFiberForQueryClient(elementWithFiber._reactInternalFiber);
      }
    } catch {
      // Continue with other detection methods
    }
    return null;
  }

  private static findQueryClientInDOM(): QueryClient | null {
    try {
      // Look for QueryClient in React component props/context
      const scripts = document.querySelectorAll('script');
      for (const script of scripts) {
        if (script.innerHTML.includes('QueryClient') || script.innerHTML.includes('queryClient')) {
          // Found evidence of QueryClient usage - return null since we can't extract the actual client
          return null;
        }
      }
    } catch {
      // Continue
    }
    return null;
  }

  private static traverseFiberForQueryClient(fiber: unknown): QueryClient | null {
    if (!fiber) return null;
    
    try {
      const fiberNode = fiber as {
        memoizedProps?: { client?: QueryClient };
        memoizedState?: { queryClient?: QueryClient };
        child?: unknown;
        sibling?: unknown;
      };
      
      // Check current fiber's context/props for QueryClient
      if (fiberNode.memoizedProps?.client || fiberNode.memoizedState?.queryClient) {
        return fiberNode.memoizedProps?.client || fiberNode.memoizedState?.queryClient || null;
      }
      
      // Recursively check children
      let child = fiberNode.child;
      while (child) {
        const result = this.traverseFiberForQueryClient(child);
        if (result) return result;
        const childNode = child as { sibling?: unknown };
        child = childNode.sibling;
      }
    } catch {
      // Continue traversal
    }
    
    return null;
  }

  private static checkForReactQueryPackage(): boolean {
    try {
      // Check if the package is loaded in any way
      const windowWithLibs = window as typeof window & {
        TanStackQuery?: unknown;
        ReactQuery?: unknown;
      };
      
      return !!(
        windowWithLibs.TanStackQuery ||
        windowWithLibs.ReactQuery ||
        document.querySelector('script[src*="@tanstack/react-query"]') ||
        document.querySelector('script[src*="react-query"]')
      );
    } catch {
      return false;
    }
  }

  private static detectMissingCacheKeys(existingKeys: string[]): string[] {
    const commonMissingKeys = [];
    
    // Check for common API patterns that should be cached
    const currentPath = window.location.pathname;
    
    if (currentPath.includes('/dam')) {
      const damKeys = ['dam-assets', 'dam-folders', 'dam-search', 'asset-details'];
      const missing = damKeys.filter(key => !existingKeys.some(existing => existing.includes(key)));
      commonMissingKeys.push(...missing);
    }
    
    if (currentPath.includes('/image-generator')) {
      const imgKeys = ['generations', 'providers', 'generation-stats'];
      const missing = imgKeys.filter(key => !existingKeys.some(existing => existing.includes(key)));
      commonMissingKeys.push(...missing);
    }
    
    return commonMissingKeys;
  }

  static generateReport(status: ReactQueryStatus): string {
    if (!status.isInstalled) {
      // Check if it's in package.json but not used
      if (this.isInPackageJson()) {
        return "⚠️ **React Query INSTALLED but NOT IMPORTED** - Package exists in package.json but not used in app";
      }
      return "❌ **React Query NOT DETECTED** - Package not installed";
    }
    
    if (!status.isConfigured) {
      return "⚠️ **React Query INSTALLED but NOT CONFIGURED** - QueryClient not found in app";
    }
    
    if (status.activeQueries === 0) {
      return `✅ **React Query CONFIGURED** but **NO ACTIVE QUERIES** - ${status.cachedQueries.length} cached queries`;
    }
    
    return `✅ **React Query ACTIVE** - ${status.activeQueries} active queries, ${status.cachedQueries.length} cached`;
  }

  private static isInPackageJson(): boolean {
    try {
      // Check if we can find evidence of React Query in the bundle
      const scripts = document.querySelectorAll('script');
      for (const script of scripts) {
        if (script.src && (
          script.src.includes('tanstack') || 
          script.src.includes('react-query') ||
          script.innerHTML.includes('@tanstack/react-query')
        )) {
          return true;
        }
      }
      
      // Check for common Next.js chunk patterns
      return !!(
        document.querySelector('script[src*="_app"]') ||
        document.querySelector('script[src*="main"]')
      );
    } catch {
      return false;
    }
  }
} 