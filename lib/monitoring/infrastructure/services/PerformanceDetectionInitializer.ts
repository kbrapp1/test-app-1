export class PerformanceDetectionInitializer {
  private static initialized = false;

  static initialize(): void {
    if (this.initialized || typeof window === 'undefined') {
      return;
    }

    this.initializeNetworkDetection();
    this.initializeReactQueryDetection();
    
    this.initialized = true;
  }

  private static initializeNetworkDetection(): void {
    import('./NetworkInterceptors').then(({ networkInterceptors }) => {
      networkInterceptors.install();
      (window as any).__NETWORK_INTERCEPTORS__ = networkInterceptors;
    }).catch(() => {
      // Graceful fallback if NetworkInterceptors is not available
    });
  }

  private static initializeReactQueryDetection(): void {
    import('../cache/ReactQueryDetector').then(({ ReactQueryDetector }) => {
      (window as any).__REACT_QUERY_DETECTOR__ = ReactQueryDetector;
    }).catch(() => {
      // Graceful fallback if ReactQueryDetector is not available
    });
  }
} 