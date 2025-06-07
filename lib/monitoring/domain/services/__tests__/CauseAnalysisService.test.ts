import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CauseAnalysisService } from '../CauseAnalysisService';
import { OptimizationGap } from '../../value-objects/OptimizationGap';
import { PerformanceTrackingState } from '../../../application/dto/PerformanceTrackingDTO';
import { PerformanceMetrics } from '../../entities/PerformanceMetrics';
import { IRuntimeDetectionService } from '../IRuntimeDetectionService';
import { SpecificCauseAnalysis } from '../../value-objects/SpecificCauseAnalysis';

/**
 * Unit Tests for CauseAnalysisService (Domain Service)
 * 
 * Tests the core business logic for analyzing optimization gap causes
 * with runtime detection service integration following DDD patterns.
 * 
 * Coverage Target: 90%+ with comprehensive dependency mocking
 */
describe('CauseAnalysisService', () => {
  let causeAnalysisService: CauseAnalysisService;
  let mockRuntimeDetectionService: IRuntimeDetectionService;

  // Test data factories following DDD patterns
  const createMockOptimizationGap = (overrides: Partial<OptimizationGap> = {}): OptimizationGap => ({
    type: 'memoization',
    title: 'Missing React.memo optimization',
    description: 'Component re-renders unnecessarily',
    severity: 'medium',
    ...overrides
  });

  const createMockPerformanceMetrics = (overrides: Partial<PerformanceMetrics> = {}): PerformanceMetrics => ({
    cacheSize: 10,
    activeMutations: 2,
    ...overrides
  });

  const createMockTrackingState = (overrides: Partial<PerformanceTrackingState> = {}): PerformanceTrackingState => ({
    renderMetrics: { count: 5, totalTime: 100 },
    cacheHitRate: 80,
    webVitals: { LCP: 1500, FID: 50, CLS: 0.1 },
    avgResponseTime: 200,
    pageContext: 'dashboard',
    ...overrides
  });

  const createMockSpecificCauseAnalysis = (overrides: Partial<SpecificCauseAnalysis> = {}): SpecificCauseAnalysis => ({
    cause: 'High component re-render frequency in dashboard context',
    evidence: 'Detected 25 renders in current session - indicates missing React.memo',
    recommendation: 'Add React.memo to frequently re-rendering components in dashboard',
    estimatedImprovement: '40-60% reduction in render cycles',
    implementationSteps: [
      'Identify components with highest re-render frequency',
      'Wrap components with React.memo for props comparison',
      'Add useCallback for event handlers passed as props',
      'Implement useMemo for expensive calculations'
    ],
    ...overrides
  });

  beforeEach(() => {
    // Create mock runtime detection service
    mockRuntimeDetectionService = {
      detectActualCulprit: vi.fn()
    };

    // Initialize service with mocked dependency
    causeAnalysisService = new CauseAnalysisService(mockRuntimeDetectionService);
  });

  describe('analyzeSpecificCause', () => {
    it('should return runtime-detected culprit when available', () => {
      // Arrange
      const optimizationGap = createMockOptimizationGap({
        type: 'memoization',
        title: 'Missing React.memo',
        description: 'Component re-renders excessively'
      });
      const trackingState = createMockTrackingState({
        renderMetrics: { count: 25, totalTime: 500 },
        pageContext: 'user-profile'
      });
      const performanceMetrics = createMockPerformanceMetrics();
      const analysisIndex = 1;

      const expectedAnalysis = createMockSpecificCauseAnalysis({
        cause: 'Runtime detected: High re-render frequency',
        evidence: 'Real-time analysis shows excessive component updates'
      });

      // Mock runtime detection service to return analysis
      vi.mocked(mockRuntimeDetectionService.detectActualCulprit).mockReturnValue(expectedAnalysis);

      // Act
      const result = causeAnalysisService.analyzeSpecificCause(
        optimizationGap, 
        trackingState, 
        performanceMetrics, 
        analysisIndex
      );

      // Assert
      expect(mockRuntimeDetectionService.detectActualCulprit).toHaveBeenCalledWith(
        optimizationGap,
        trackingState
      );
      expect(result).toBe(expectedAnalysis);
    });

    it('should return empty analysis when runtime detection fails', () => {
      // Arrange
      const optimizationGap = createMockOptimizationGap({
        type: 'caching',
        title: 'Missing React Query caching'
      });
      const trackingState = createMockTrackingState();
      const performanceMetrics = createMockPerformanceMetrics();
      const analysisIndex = 0;

      // Mock runtime detection service to return null/undefined
      vi.mocked(mockRuntimeDetectionService.detectActualCulprit).mockReturnValue(null);

      // Act
      const result = causeAnalysisService.analyzeSpecificCause(
        optimizationGap, 
        trackingState, 
        performanceMetrics, 
        analysisIndex
      );

      // Assert
      expect(mockRuntimeDetectionService.detectActualCulprit).toHaveBeenCalledWith(
        optimizationGap,
        trackingState
      );
      expect(result).toEqual({});
    });

    it('should return empty analysis when runtime detection returns undefined', () => {
      // Arrange
      const optimizationGap = createMockOptimizationGap({
        type: 'lazy-loading',
        title: 'Missing code splitting'
      });
      const trackingState = createMockTrackingState();
      const performanceMetrics = createMockPerformanceMetrics();
      const analysisIndex = 2;

      // Mock runtime detection service to return undefined
      vi.mocked(mockRuntimeDetectionService.detectActualCulprit).mockReturnValue(undefined);

      // Act
      const result = causeAnalysisService.analyzeSpecificCause(
        optimizationGap, 
        trackingState, 
        performanceMetrics, 
        analysisIndex
      );

      // Assert
      expect(mockRuntimeDetectionService.detectActualCulprit).toHaveBeenCalledWith(
        optimizationGap,
        trackingState
      );
      expect(result).toEqual({});
    });
  });

  describe('Runtime Detection Service Integration', () => {
    it('should pass correct parameters to runtime detection service', () => {
      // Arrange
      const optimizationGap = createMockOptimizationGap({
        type: 'debouncing',
        title: 'Missing input debouncing',
        severity: 'high'
      });
      const trackingState = createMockTrackingState({
        pageContext: 'search-results',
        avgResponseTime: 350
      });
      const performanceMetrics = createMockPerformanceMetrics({
        cacheSize: 0,
        activeMutations: 5
      });

      const expectedAnalysis = createMockSpecificCauseAnalysis({
        cause: 'Runtime detected: Excessive API calls from user input',
        evidence: 'Real-time monitoring shows 50+ API calls per second'
      });

      vi.mocked(mockRuntimeDetectionService.detectActualCulprit).mockReturnValue(expectedAnalysis);

      // Act
      const result = causeAnalysisService.analyzeSpecificCause(
        optimizationGap, 
        trackingState, 
        performanceMetrics, 
        0
      );

      // Assert
      expect(mockRuntimeDetectionService.detectActualCulprit).toHaveBeenCalledTimes(1);
      expect(mockRuntimeDetectionService.detectActualCulprit).toHaveBeenCalledWith(
        optimizationGap,
        trackingState
      );
      expect(result).toBe(expectedAnalysis);
    });

    it('should handle different optimization gap types', () => {
      // Test different optimization types
      const optimizationTypes = [
        'memoization',
        'caching', 
        'lazy-loading',
        'debouncing',
        'batching'
      ];

      const trackingState = createMockTrackingState();
      const performanceMetrics = createMockPerformanceMetrics();

      optimizationTypes.forEach((type, index) => {
        // Reset mock for each iteration
        vi.mocked(mockRuntimeDetectionService.detectActualCulprit).mockClear();
        
        const optimizationGap = createMockOptimizationGap({ 
          type: type as any,
          title: `Missing ${type} optimization`
        });

        const expectedAnalysis = createMockSpecificCauseAnalysis({
          cause: `Runtime detected: ${type} issue`,
          evidence: `Real-time analysis shows ${type} problems`
        });

        vi.mocked(mockRuntimeDetectionService.detectActualCulprit).mockReturnValue(expectedAnalysis);

        // Act
        const result = causeAnalysisService.analyzeSpecificCause(
          optimizationGap, 
          trackingState, 
          performanceMetrics, 
          index
        );

        // Assert
        expect(mockRuntimeDetectionService.detectActualCulprit).toHaveBeenCalledWith(
          optimizationGap,
          trackingState
        );
        expect(result).toBe(expectedAnalysis);
      });
    });

    it('should handle different tracking state contexts', () => {
      const contexts = [
        'dashboard',
        'user-profile',
        'product-listing',
        'search-results',
        'checkout'
      ];

      const optimizationGap = createMockOptimizationGap();
      const performanceMetrics = createMockPerformanceMetrics();

      contexts.forEach((context, index) => {
        vi.mocked(mockRuntimeDetectionService.detectActualCulprit).mockClear();
        
        const trackingState = createMockTrackingState({ 
          pageContext: context 
        });

        const expectedAnalysis = createMockSpecificCauseAnalysis({
          cause: `Runtime detected: Performance issue in ${context}`,
          evidence: `Real-time analysis for ${context} context`
        });

        vi.mocked(mockRuntimeDetectionService.detectActualCulprit).mockReturnValue(expectedAnalysis);

        // Act
        const result = causeAnalysisService.analyzeSpecificCause(
          optimizationGap, 
          trackingState, 
          performanceMetrics, 
          index
        );

        // Assert
        expect(mockRuntimeDetectionService.detectActualCulprit).toHaveBeenCalledWith(
          optimizationGap,
          trackingState
        );
        expect(result).toBe(expectedAnalysis);
      });
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle runtime detection service errors gracefully', () => {
      // Arrange
      const optimizationGap = createMockOptimizationGap();
      const trackingState = createMockTrackingState();
      const performanceMetrics = createMockPerformanceMetrics();

      // Mock runtime detection service to throw error
      vi.mocked(mockRuntimeDetectionService.detectActualCulprit).mockImplementation(() => {
        throw new Error('Runtime detection failed');
      });

      // Act & Assert
      expect(() => {
        causeAnalysisService.analyzeSpecificCause(
          optimizationGap, 
          trackingState, 
          performanceMetrics, 
          0
        );
      }).toThrow('Runtime detection failed');
    });

    it('should handle null optimization gap', () => {
      // Arrange
      const trackingState = createMockTrackingState();
      const performanceMetrics = createMockPerformanceMetrics();

      vi.mocked(mockRuntimeDetectionService.detectActualCulprit).mockReturnValue({});

      // Act
      const result = causeAnalysisService.analyzeSpecificCause(
        null as any, 
        trackingState, 
        performanceMetrics, 
        0
      );

      // Assert
      expect(mockRuntimeDetectionService.detectActualCulprit).toHaveBeenCalledWith(
        null,
        trackingState
      );
      expect(result).toEqual({});
    });

    it('should handle null tracking state', () => {
      // Arrange
      const optimizationGap = createMockOptimizationGap();
      const performanceMetrics = createMockPerformanceMetrics();

      vi.mocked(mockRuntimeDetectionService.detectActualCulprit).mockReturnValue({});

      // Act
      const result = causeAnalysisService.analyzeSpecificCause(
        optimizationGap, 
        null as any, 
        performanceMetrics, 
        0
      );

      // Assert
      expect(mockRuntimeDetectionService.detectActualCulprit).toHaveBeenCalledWith(
        optimizationGap,
        null
      );
      expect(result).toEqual({});
    });

    it('should handle extreme analysis index values', () => {
      // Arrange
      const optimizationGap = createMockOptimizationGap();
      const trackingState = createMockTrackingState();
      const performanceMetrics = createMockPerformanceMetrics();

      const extremeIndices = [-1, 0, 999999, Number.MAX_SAFE_INTEGER];

      extremeIndices.forEach(index => {
        vi.mocked(mockRuntimeDetectionService.detectActualCulprit).mockReturnValue({});

        // Act
        const result = causeAnalysisService.analyzeSpecificCause(
          optimizationGap, 
          trackingState, 
          performanceMetrics, 
          index
        );

        // Assert
        expect(result).toEqual({});
      });
    });
  });

  describe('Service Dependencies and DDD Compliance', () => {
    it('should properly inject runtime detection service dependency', () => {
      // Arrange & Act
      const service = new CauseAnalysisService(mockRuntimeDetectionService);

      // Assert - Service should be created successfully
      expect(service).toBeInstanceOf(CauseAnalysisService);
    });

    it('should maintain proper layer boundaries', () => {
      // The service only depends on IRuntimeDetectionService interface
      // and doesn't directly depend on infrastructure layer implementations
      
      // Arrange
      const optimizationGap = createMockOptimizationGap();
      const trackingState = createMockTrackingState();
      const performanceMetrics = createMockPerformanceMetrics();

      // Mock service to return specific analysis
      const analysis = createMockSpecificCauseAnalysis({
        cause: 'Proper DDD layer separation maintained',
        evidence: 'Service only depends on domain abstractions'
      });
      vi.mocked(mockRuntimeDetectionService.detectActualCulprit).mockReturnValue(analysis);

      // Act
      const result = causeAnalysisService.analyzeSpecificCause(
        optimizationGap, 
        trackingState, 
        performanceMetrics, 
        0
      );

      // Assert - Proper dependency injection and interface usage
      expect(mockRuntimeDetectionService.detectActualCulprit).toHaveBeenCalled();
      expect(result).toBe(analysis);
    });

    it('should handle empty specific cause analysis correctly', () => {
      // Arrange
      const optimizationGap = createMockOptimizationGap();
      const trackingState = createMockTrackingState();
      const performanceMetrics = createMockPerformanceMetrics();

      // Mock to return empty analysis
      vi.mocked(mockRuntimeDetectionService.detectActualCulprit).mockReturnValue({});

      // Act
      const result = causeAnalysisService.analyzeSpecificCause(
        optimizationGap, 
        trackingState, 
        performanceMetrics, 
        0
      );

      // Assert
      expect(result).toEqual({});
      expect(Object.keys(result)).toHaveLength(0);
    });
  });
}); 