import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorHandlingService } from '../infrastructure/services/ErrorHandlingService';
import { MonitoringErrorBoundary, withMonitoringErrorBoundary } from '../presentation/components/error/MonitoringErrorBoundary';
import { usePerformanceTracking } from '../presentation/hooks/usePerformanceTracking';
import { useNetworkMonitoring } from '../presentation/hooks/useNetworkMonitoring';
import { useComponentTracker } from '../presentation/hooks/useComponentTracker';
import { PerformanceMetrics } from '../domain/entities/PerformanceMetrics';

// Mock performance APIs
Object.defineProperty(window, 'performance', {
  value: {
    now: vi.fn(() => Date.now()),
  },
});

// Mock web-vitals
vi.mock('web-vitals', () => ({
  onCLS: vi.fn(),
  onLCP: vi.fn(),
  onFCP: vi.fn(),
  onINP: vi.fn(),
  onTTFB: vi.fn(),
}));

// Mock global network monitor
vi.mock('../application/services/GlobalNetworkMonitor', () => ({
  globalNetworkMonitor: {
    getNetworkStats: vi.fn(() => ({
      totalCalls: 5,
      redundantCalls: 1,
      redundancyRate: 20,
      sessionRedundancyRate: 20,
      persistentRedundantCount: 0,
      recentCalls: [],
      redundantPatterns: [],
      callsByType: {},
      persistentIssues: []
    })),
    clear: vi.fn(),
  },
}));

// Mock network interceptors
vi.mock('../infrastructure/services/NetworkInterceptors', () => ({
  networkInterceptors: {
    isInstalled: false,
    install: vi.fn(),
    uninstall: vi.fn(),
  },
}));

describe('Monitoring Module', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    ErrorHandlingService.clearErrors();
    vi.clearAllMocks();
  });

  afterEach(() => {
    queryClient.clear();
  });

  describe('ErrorHandlingService', () => {
    it('should handle repository errors correctly', () => {
      const error = new Error('Test error');
      ErrorHandlingService.handleRepositoryError('testOperation', error, { context: 'test' });

      expect(ErrorHandlingService.hasErrors()).toBe(true);
      expect(ErrorHandlingService.getErrors()).toHaveLength(1);
      expect(ErrorHandlingService.getErrors()[0]).toBe(error);
    });

    it('should handle component errors correctly', () => {
      const error = new Error('Component error');
      ErrorHandlingService.handleComponentError('TestComponent', error);

      expect(ErrorHandlingService.hasErrors()).toBe(true);
      expect(ErrorHandlingService.getErrors()).toHaveLength(1);
    });

    it('should handle service errors with fallback values', () => {
      const error = new Error('Service error');
      const fallback = { default: 'value' };
      
      const result = ErrorHandlingService.handleServiceError('TestService', 'testOperation', error, fallback);

      expect(result).toBe(fallback);
      expect(ErrorHandlingService.hasErrors()).toBe(true);
    });

    it('should clear errors correctly', () => {
      ErrorHandlingService.handleRepositoryError('test', new Error('test'));
      expect(ErrorHandlingService.hasErrors()).toBe(true);

      ErrorHandlingService.clearErrors();
      expect(ErrorHandlingService.hasErrors()).toBe(false);
      expect(ErrorHandlingService.getErrors()).toHaveLength(0);
    });
  });

  describe('MonitoringErrorBoundary', () => {
    const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }) => {
      if (shouldThrow) {
        throw new Error('Test error');
      }
      return <div>No error</div>;
    };

    it('should render children when no error occurs', () => {
      render(
        <MonitoringErrorBoundary componentName="TestComponent">
          <ThrowError shouldThrow={false} />
        </MonitoringErrorBoundary>
      );

      expect(screen.getByText('No error')).toBeInTheDocument();
    });

    it('should render error UI when error occurs', () => {
      // Suppress console.error for this test
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      render(
        <MonitoringErrorBoundary componentName="TestComponent">
          <ThrowError shouldThrow={true} />
        </MonitoringErrorBoundary>
      );

      expect(screen.getByText('Monitoring Temporarily Unavailable')).toBeInTheDocument();
      expect(screen.getByText('TestComponent encountered an error')).toBeInTheDocument();

      consoleSpy.mockRestore();
    });

    it('should allow retry after error', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      // Create a controllable error component
      let shouldThrow = true;
      const ControllableError = () => {
        if (shouldThrow) {
          throw new Error('Test error');
        }
        return <div>No error</div>;
      };

      const { rerender } = render(
        <MonitoringErrorBoundary componentName="TestComponent">
          <ControllableError />
        </MonitoringErrorBoundary>
      );

      expect(screen.getByText('Monitoring Temporarily Unavailable')).toBeInTheDocument();

      const retryButton = screen.getByText('Retry');
      
      // Fix the error condition before clicking retry
      shouldThrow = false;
      
      // Click retry and wait for the timeout
      fireEvent.click(retryButton);
      
      // Wait for the retry timeout (1 second for first retry)
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 1100));
      });

      // The component should now show no error
      expect(screen.getByText('No error')).toBeInTheDocument();

      consoleSpy.mockRestore();
    });

    it('should render custom fallback when provided', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const customFallback = <div>Custom Error UI</div>;

      render(
        <MonitoringErrorBoundary fallback={customFallback}>
          <ThrowError shouldThrow={true} />
        </MonitoringErrorBoundary>
      );

      expect(screen.getByText('Custom Error UI')).toBeInTheDocument();

      consoleSpy.mockRestore();
    });
  });

  describe('withMonitoringErrorBoundary HOC', () => {
    it('should wrap component with error boundary', () => {
      const TestComponent = () => <div>Test Component</div>;
      const WrappedComponent = withMonitoringErrorBoundary(TestComponent, { componentName: 'TestComponent' });

      render(<WrappedComponent />);

      expect(screen.getByText('Test Component')).toBeInTheDocument();
    });
  });

  describe('usePerformanceTracking', () => {
    it('should track performance metrics correctly', () => {
      const mockMetrics: PerformanceMetrics = {
        cacheSize: 10,
        activeMutations: 2,
        isOptimized: true,
        lastUpdate: new Date().toISOString(),
        webVitals: {}
      };

      let hookResult: any;
      
      function TestComponent() {
        hookResult = usePerformanceTracking(mockMetrics);
        return <div>Test</div>;
      }

      render(
        <QueryClientProvider client={queryClient}>
          <TestComponent />
        </QueryClientProvider>
      );

      expect(hookResult.state).toBeDefined();
      expect(hookResult.state.pageContext).toBeDefined();
      expect(hookResult.resetCounters).toBeInstanceOf(Function);
      expect(hookResult.fullReset).toBeInstanceOf(Function);
    });
  });

  describe('useNetworkMonitoring', () => {
    it('should provide network monitoring functionality', () => {
      let hookResult: any;
      
      function TestComponent() {
        hookResult = useNetworkMonitoring();
        return <div>Test</div>;
      }

      render(
        <QueryClientProvider client={queryClient}>
          <TestComponent />
        </QueryClientProvider>
      );

      expect(hookResult.networkStats).toBeDefined();
      expect(hookResult.clearNetworkData).toBeInstanceOf(Function);
      expect(hookResult.setIsEnabled).toBeInstanceOf(Function);
    });
  });

  describe('useComponentTracker', () => {
    it('should track component performance', () => {
      let hookResult: any;
      
      function TestComponent() {
        hookResult = useComponentTracker('TestComponent');
        return <div>Test</div>;
      }

      render(<TestComponent />);

      expect(hookResult.trackRender).toBeInstanceOf(Function);
      expect(hookResult.metrics).toBeDefined();
      expect(hookResult.metrics.mountTime).toBeGreaterThanOrEqual(0);
      expect(hookResult.metrics.reRenderCount).toBeGreaterThanOrEqual(0);
    });

    it('should memoize trackRender function', () => {
      let trackRenderRef1: any;
      let trackRenderRef2: any;
      
      function TestComponent({ prop }: { prop: number }) {
        const { trackRender } = useComponentTracker('TestComponent');
        if (prop === 1) trackRenderRef1 = trackRender;
        if (prop === 2) trackRenderRef2 = trackRender;
        return <div>Test {prop}</div>;
      }

      const { rerender } = render(<TestComponent prop={1} />);
      rerender(<TestComponent prop={2} />);

      // trackRender should be the same function reference (memoized)
      expect(trackRenderRef1).toBe(trackRenderRef2);
    });
  });

  describe('Integration Tests', () => {
    it('should handle errors gracefully across the monitoring system', async () => {
      // Test that error handling works end-to-end
      const mockError = new Error('Integration test error');
      
      ErrorHandlingService.handleRepositoryError('integration-test', mockError);
      ErrorHandlingService.handleServiceError('TestService', 'testOp', mockError, 'fallback');

      expect(ErrorHandlingService.hasErrors()).toBe(true);
      expect(ErrorHandlingService.getErrors()).toHaveLength(2);
    });

    it('should maintain performance optimization patterns', () => {
      // Test that hooks maintain their optimization patterns
      let renderCount = 0;
      
      function TestComponent({ metrics }: { metrics: PerformanceMetrics }) {
        renderCount++;
        const { state } = usePerformanceTracking(metrics);
        const { networkStats } = useNetworkMonitoring();
        return <div>Renders: {renderCount}</div>;
      }

      const initialMetrics: PerformanceMetrics = {
        cacheSize: 5,
        activeMutations: 1,
        isOptimized: false,
        lastUpdate: new Date().toISOString(),
        webVitals: {}
      };

      const { rerender } = render(
        <QueryClientProvider client={queryClient}>
          <TestComponent metrics={initialMetrics} />
        </QueryClientProvider>
      );

      // Rerender with same metrics - should not cause unnecessary renders due to memoization
      rerender(
        <QueryClientProvider client={queryClient}>
          <TestComponent metrics={initialMetrics} />
        </QueryClientProvider>
      );

      expect(renderCount).toBe(3); // Initial + useEffect + rerender - hooks cause additional renders due to state initialization
    });
  });
}); 