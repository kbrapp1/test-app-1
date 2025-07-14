import { describe, it, expect, beforeEach } from 'vitest';
import { FrontendOptimizationAnalysisService } from '../optimization/FrontendOptimizationAnalysisService';
import { OptimizationGap, OptimizationType } from '../../value-objects/OptimizationGap';
import { PerformanceMetrics } from '../../entities/PerformanceMetrics';
import { PerformanceTrackingState, PageContext } from '../../../application/dto/PerformanceTrackingDTO';

/**
 * Unit Tests for FrontendOptimizationAnalysisService (Domain Service)
 * 
 * Tests the core business logic for analyzing performance optimization gaps
 * and generating production-ready issue analysis with priorities and fixes.
 * 
 * Coverage Target: 90%+ with comprehensive edge cases
 */
describe('FrontendOptimizationAnalysisService', () => {
  let service: FrontendOptimizationAnalysisService;

  beforeEach(() => {
    service = new FrontendOptimizationAnalysisService();
  });

  // Test data factories following DDD patterns
  const createMockOptimizationGap = (overrides: Partial<OptimizationGap> = {}): OptimizationGap => ({
    type: 'memoization',
    title: 'Missing React.memo optimization',
    description: 'Component re-renders unnecessarily',
    severity: 'medium',
    persistent: false,
    ...overrides
  });

  const createMockPerformanceMetrics = (overrides: Partial<PerformanceMetrics> = {}): PerformanceMetrics => ({
    cacheSize: 10,
    activeMutations: 2,
    isOptimized: false,
    lastUpdate: '2024-01-01T00:00:00Z',
    ...overrides
  });

  const createMockTrackingState = (overrides: Partial<PerformanceTrackingState> = {}): PerformanceTrackingState => ({
    renderMetrics: { count: 5, rapidCount: 0, lastReset: Date.now() },
    cacheHitRate: 80,
    webVitals: { LCP: 1500, CLS: 0.1 },
    avgResponseTime: 200,
    pageContext: 'dashboard',
    ...overrides
  });

  describe('analyzeOptimizationGap', () => {
    it('should analyze caching issue with high priority for zero cache size', () => {
      // Arrange
      const issue = createMockOptimizationGap({
        type: 'caching',
        title: 'Missing React Query caching',
        description: 'API calls are not cached'
      });
      const trackingState = createMockTrackingState();
      const metrics = createMockPerformanceMetrics({ cacheSize: 0 });

      // Act
      const result = service.analyzeOptimizationGap(issue, trackingState, metrics, 0);

      // Assert - Critical because it's dashboard + zero cache
      expect(result).toEqual({
        issue: 'Missing React Query caching',
        suggestedFix: 'Implement React Query for dashboard metrics and user data',
        priority: 'critical',
        timeToFix: '2-3 hours + investigation time',
        businessImpact: 'CRITICAL: Faster loading, reduced server load - immediate user experience improvement',
        webVitalImpact: 'Improves all Web Vitals through faster data loading'
      });
    });

    it('should analyze caching issue with medium priority for non-zero cache size', () => {
      // Arrange
      const issue = createMockOptimizationGap({
        type: 'caching',
        title: 'Suboptimal caching strategy'
      });
      const trackingState = createMockTrackingState();
      const metrics = createMockPerformanceMetrics({ cacheSize: 10 }); // Non-zero cache

      // Act
      const result = service.analyzeOptimizationGap(issue, trackingState, metrics, 0);

      // Assert
      expect(result.priority).toBe('medium');
      expect(result.suggestedFix).toBe('Implement React Query for dashboard metrics and user data');
      expect(result.timeToFix).toBe('2-3 hours');
      expect(result.businessImpact).toBe('Faster loading, reduced server load');
    });

    it('should analyze memoization issue with critical priority for high render count', () => {
      // Arrange
      const issue = createMockOptimizationGap({
        type: 'memoization',
        title: 'Missing React.memo',
        description: 'Component re-renders excessively'
      });
      const trackingState = createMockTrackingState({
        renderMetrics: { count: 25, rapidCount: 5, lastReset: Date.now() } // > 20 renders = critical
      });
      const metrics = createMockPerformanceMetrics();

      // Act
      const result = service.analyzeOptimizationGap(issue, trackingState, metrics, 0);

      // Assert
      expect(result.priority).toBe('critical');
      expect(result.suggestedFix).toBe('Memoize chart components and metric calculations');
      expect(result.timeToFix).toBe('1 hour + investigation time');
      expect(result.businessImpact).toBe('CRITICAL: Reduced CPU usage, smoother UI - immediate user experience improvement');
      expect(result.webVitalImpact).toBe('Improves INP and reduces jank significantly');
    });

    it('should analyze memoization issue with medium priority for low render count', () => {
      // Arrange
      const issue = createMockOptimizationGap({
        type: 'memoization',
        title: 'Missing React.memo'
      });
      const trackingState = createMockTrackingState({
        renderMetrics: { count: 10, rapidCount: 1, lastReset: Date.now() } // <= 20 renders = medium
      });
      const metrics = createMockPerformanceMetrics();

      // Act
      const result = service.analyzeOptimizationGap(issue, trackingState, metrics, 0);

      // Assert
      expect(result.priority).toBe('medium');
      expect(result.webVitalImpact).toBeUndefined();
    });

    it('should analyze lazy-loading issue with critical priority for very poor LCP', () => {
      // Arrange
      const issue = createMockOptimizationGap({
        type: 'lazy-loading',
        title: 'Missing code splitting',
        description: 'Large bundle size affecting LCP'
      });
      const trackingState = createMockTrackingState({
        webVitals: { LCP: 4500, CLS: 0.1 } // LCP > 4000ms = critical
      });
      const metrics = createMockPerformanceMetrics();

      // Act
      const result = service.analyzeOptimizationGap(issue, trackingState, metrics, 0);

      // Assert
      expect(result.priority).toBe('critical');
      expect(result.suggestedFix).toBe('Lazy load heavy chart libraries and widgets');
      expect(result.timeToFix).toBe('2-4 hours + investigation time');
      expect(result.businessImpact).toBe('CRITICAL: Faster initial page load - immediate user experience improvement');
      expect(result.webVitalImpact).toBe('Improves LCP and FCP significantly (4s+ → <2.5s target)');
    });

    it('should analyze lazy-loading issue with high priority for moderate LCP', () => {
      // Arrange
      const issue = createMockOptimizationGap({
        type: 'lazy-loading',
        title: 'Missing code splitting'
      });
      const trackingState = createMockTrackingState({
        webVitals: { LCP: 3000, CLS: 0.1 } // LCP 2.5-4s = high
      });
      const metrics = createMockPerformanceMetrics();

      // Act
      const result = service.analyzeOptimizationGap(issue, trackingState, metrics, 0);

      // Assert
      expect(result.priority).toBe('high');
      expect(result.webVitalImpact).toBe('Improves LCP moderately (2.5-4s → <2.5s target)');
    });

    it('should analyze debouncing issue with correct fixes and timing', () => {
      // Arrange
      const issue = createMockOptimizationGap({
        type: 'debouncing',
        title: 'Missing input debouncing',
        description: 'Search triggers too many API calls'
      });
      const trackingState = createMockTrackingState({
        pageContext: 'dam' // Use valid PageContext
      });
      const metrics = createMockPerformanceMetrics();

      // Act
      const result = service.analyzeOptimizationGap(issue, trackingState, metrics, 0);

      // Assert
      expect(result.priority).toBe('medium');
      expect(result.suggestedFix).toBe('Add debouncing to search/filter inputs in dam (300ms delay)');
      expect(result.timeToFix).toBe('1-2 hours');
      expect(result.businessImpact).toBe('Reduced unnecessary API calls');
      expect(result.webVitalImpact).toBeUndefined();
    });

    it('should analyze batching issue with correct fixes and timing', () => {
      // Arrange
      const issue = createMockOptimizationGap({
        type: 'batching',
        title: 'Missing mutation batching',
        description: 'Multiple mutations executed separately'
      });
      const trackingState = createMockTrackingState({
        pageContext: 'team'
      });
      const metrics = createMockPerformanceMetrics();

      // Act
      const result = service.analyzeOptimizationGap(issue, trackingState, metrics, 0);

      // Assert
      expect(result.priority).toBe('medium');
      expect(result.suggestedFix).toBe('Batch mutations together in team operations (use React Query mutations)');
      expect(result.timeToFix).toBe('2-3 hours');
      expect(result.businessImpact).toBe('Improved mutation efficiency');
      expect(result.webVitalImpact).toBeUndefined();
    });

    it('should handle unknown issue types gracefully', () => {
      // Arrange
      const issue = createMockOptimizationGap({
        type: 'unknown-type' as 'caching',
        title: 'Unknown optimization'
      });
      const trackingState = createMockTrackingState();
      const metrics = createMockPerformanceMetrics();

      // Act
      const result = service.analyzeOptimizationGap(issue, trackingState, metrics, 0);

      // Assert
      expect(result.priority).toBe('medium');
      expect(result.timeToFix).toBe('1-2 hours');
      expect(result.businessImpact).toBe('Performance optimization');
      expect(result.suggestedFix).toContain('unknown-type');
      expect(result.webVitalImpact).toBeUndefined();
    });

    it('should handle missing LCP values gracefully', () => {
      // Arrange
      const issue = createMockOptimizationGap({ type: 'lazy-loading' });
      const trackingState = createMockTrackingState({
        webVitals: { CLS: 0.1 } // Missing LCP
      });
      const metrics = createMockPerformanceMetrics();

      // Act
      const result = service.analyzeOptimizationGap(issue, trackingState, metrics, 0);

      // Assert - Should not crash and should fall back to medium priority
      expect(result.priority).toBe('medium');
      expect(result.webVitalImpact).toBeUndefined();
    });

    it('should handle undefined webVitals gracefully', () => {
      // Arrange
      const issue = createMockOptimizationGap({ type: 'lazy-loading' });
      const trackingState = createMockTrackingState({
        webVitals: undefined
      });
      const metrics = createMockPerformanceMetrics();

      // Act & Assert - Should not throw
      expect(() => {
        service.analyzeOptimizationGap(issue, trackingState, metrics, 0);
      }).not.toThrow();
    });
  });

  describe('Priority Determination Logic', () => {
    it('should correctly prioritize multiple conditions', () => {
      const cachingIssue = createMockOptimizationGap({ type: 'caching' });
      const zeroCacheMetrics = createMockPerformanceMetrics({ cacheSize: 0 });
      const result1 = service.analyzeOptimizationGap(
        cachingIssue,
        createMockTrackingState({ renderMetrics: { count: 25, rapidCount: 5, lastReset: Date.now() } }),
        zeroCacheMetrics,
        0
      );
      expect(result1.priority).toBe('critical'); // Caching with zero cache + dashboard = critical

      const memoizationIssue = createMockOptimizationGap({ type: 'memoization' });
      const result2 = service.analyzeOptimizationGap(
        memoizationIssue,
        createMockTrackingState({ renderMetrics: { count: 25, rapidCount: 5, lastReset: Date.now() } }),
        createMockPerformanceMetrics(),
        0
      );
      expect(result2.priority).toBe('critical'); // Memoization with >20 renders = critical

      const lazyLoadingIssue = createMockOptimizationGap({ type: 'lazy-loading' });
      const result3 = service.analyzeOptimizationGap(
        lazyLoadingIssue,
        createMockTrackingState({ webVitals: { LCP: 4500, CLS: 0.1 } }),
        createMockPerformanceMetrics(),
        0
      );
      expect(result3.priority).toBe('critical'); // Lazy loading with LCP > 4000 = critical
    });
  });

  describe('Context-Specific Fix Generation', () => {
    it('should generate context-specific fixes for different page contexts', () => {
      const issue = createMockOptimizationGap({ type: 'caching' });
      const metrics = createMockPerformanceMetrics();

      const contexts = [
        { context: 'dashboard', expected: 'Implement React Query for dashboard metrics and user data' },
        { context: 'image-generator', expected: 'Cache generation history and provider configurations' },
        { context: 'dam', expected: 'Cache asset metadata and folder structures' },
        { context: 'team', expected: 'Cache team member data and organization settings' }
      ];

      contexts.forEach(({ context, expected }) => {
        const trackingState = createMockTrackingState({ pageContext: context as PageContext });
        const result = service.analyzeOptimizationGap(issue, trackingState, metrics, 0);
        expect(result.suggestedFix).toBe(expected);
      });
    });

    it('should generate appropriate fixes for all issue types', () => {
      const trackingState = createMockTrackingState({ pageContext: 'dashboard' });
      const metrics = createMockPerformanceMetrics();

      const issueTypes = [
        { type: 'caching', expected: 'Implement React Query for dashboard metrics and user data' },
        { type: 'memoization', expected: 'Memoize chart components and metric calculations' },
        { type: 'debouncing', expected: 'Add debouncing to search/filter inputs in dashboard (300ms delay)' },
        { type: 'lazy-loading', expected: 'Lazy load heavy chart libraries and widgets' },
        { type: 'batching', expected: 'Batch mutations together in dashboard operations (use React Query mutations)' }
      ];

      issueTypes.forEach(({ type, expected }) => {
        const issue = createMockOptimizationGap({ type: type as OptimizationType });
        const result = service.analyzeOptimizationGap(issue, trackingState, metrics, 0);
        expect(result.suggestedFix).toBe(expected);
      });
    });
  });

  describe('Web Vital Impact Assessment', () => {
    it('should correctly assess web vital impact for memoization issues', () => {
      const issue = createMockOptimizationGap({ type: 'memoization' });
      const metrics = createMockPerformanceMetrics();

      // High render count (>20) should show significant impact
      const highRenderState = createMockTrackingState({
        renderMetrics: { count: 25, rapidCount: 5, lastReset: Date.now() }
      });
      const result1 = service.analyzeOptimizationGap(issue, highRenderState, metrics, 0);
      expect(result1.webVitalImpact).toBe('Improves INP and reduces jank significantly');

      // Medium render count (10-20) should show moderate impact
      const mediumRenderState = createMockTrackingState({
        renderMetrics: { count: 15, rapidCount: 2, lastReset: Date.now() }
      });
      const result2 = service.analyzeOptimizationGap(issue, mediumRenderState, metrics, 0);
      expect(result2.webVitalImpact).toBe('Improves INP and reduces jank moderately');

      // Low render count (<10) should not show web vital impact
      const lowRenderState = createMockTrackingState({
        renderMetrics: { count: 8, rapidCount: 1, lastReset: Date.now() }
      });
      const result3 = service.analyzeOptimizationGap(issue, lowRenderState, metrics, 0);
      expect(result3.webVitalImpact).toBeUndefined();
    });

    it('should correctly assess web vital impact for lazy-loading issues', () => {
      const issue = createMockOptimizationGap({ type: 'lazy-loading' });
      const metrics = createMockPerformanceMetrics();

      // Very poor LCP (>4s) should show significant improvement
      const poorLcpState = createMockTrackingState({
        webVitals: { LCP: 4500, CLS: 0.1 }
      });
      const result1 = service.analyzeOptimizationGap(issue, poorLcpState, metrics, 0);
      expect(result1.webVitalImpact).toBe('Improves LCP and FCP significantly (4s+ → <2.5s target)');

      // Moderate LCP (2.5-4s) should show moderate improvement
      const moderateLcpState = createMockTrackingState({
        webVitals: { LCP: 3000, CLS: 0.1 }
      });
      const result2 = service.analyzeOptimizationGap(issue, moderateLcpState, metrics, 0);
      expect(result2.webVitalImpact).toBe('Improves LCP moderately (2.5-4s → <2.5s target)');

      // Good LCP (<2.5s) should not show web vital impact
      const goodLcpState = createMockTrackingState({
        webVitals: { LCP: 2000, CLS: 0.1 }
      });
      const result3 = service.analyzeOptimizationGap(issue, goodLcpState, metrics, 0);
      expect(result3.webVitalImpact).toBeUndefined();
    });

    it('should assess web vital impact for caching issues', () => {
      const issue = createMockOptimizationGap({ type: 'caching' });
      const trackingState = createMockTrackingState();
      const metrics = createMockPerformanceMetrics();

      const result = service.analyzeOptimizationGap(issue, trackingState, metrics, 0);
      expect(result.webVitalImpact).toBe('Improves all Web Vitals through faster data loading');
    });

    it('should not assess web vital impact for other issue types', () => {
      const trackingState = createMockTrackingState();
      const metrics = createMockPerformanceMetrics();

      const issueTypes = ['debouncing', 'batching'];
      issueTypes.forEach(type => {
        const issue = createMockOptimizationGap({ type: type as OptimizationType });
        const result = service.analyzeOptimizationGap(issue, trackingState, metrics, 0);
        expect(result.webVitalImpact).toBeUndefined();
      });
    });
  });

  describe('Boundary Conditions and Edge Cases', () => {
    it('should handle exact boundary values correctly', () => {
      // Test exact boundary for render count (20 is not > 20, so medium)
      const issue = createMockOptimizationGap({ type: 'memoization' });
      const boundaryState = createMockTrackingState({
        renderMetrics: { count: 20, rapidCount: 3, lastReset: Date.now() }
      });
      const metrics = createMockPerformanceMetrics();

      const result = service.analyzeOptimizationGap(issue, boundaryState, metrics, 0);
      expect(result.priority).toBe('high'); // 20 renders is > 10, so high priority

      // Test exact boundary for LCP (4000 is not > 4000, so high)
      const lcpIssue = createMockOptimizationGap({ type: 'lazy-loading' });
      const lcpBoundaryState = createMockTrackingState({
        webVitals: { LCP: 4000, CLS: 0.1 }
      });
      const lcpResult = service.analyzeOptimizationGap(lcpIssue, lcpBoundaryState, metrics, 0);
      expect(lcpResult.priority).toBe('high'); // Not > 4000, so high not critical
    });

    it('should handle extreme values gracefully', () => {
      // Test extremely high render count
      const issue = createMockOptimizationGap({ type: 'memoization' });
      const extremeState = createMockTrackingState({
        renderMetrics: { count: 1000, rapidCount: 50, lastReset: Date.now() }
      });
      const metrics = createMockPerformanceMetrics();

      const result = service.analyzeOptimizationGap(issue, extremeState, metrics, 0);
      expect(result.priority).toBe('critical');
      expect(result.webVitalImpact).toBe('Improves INP and reduces jank significantly');

      // Test extremely poor LCP
      const lcpIssue = createMockOptimizationGap({ type: 'lazy-loading' });
      const extremeLcpState = createMockTrackingState({
        webVitals: { LCP: 10000, CLS: 0.1 }
      });
      const lcpResult = service.analyzeOptimizationGap(lcpIssue, extremeLcpState, metrics, 0);
      expect(lcpResult.priority).toBe('critical');
      expect(lcpResult.webVitalImpact).toBe('Improves LCP and FCP significantly (4s+ → <2.5s target)');
    });

    it('should handle null and undefined values gracefully', () => {
      const issue = createMockOptimizationGap({ type: 'lazy-loading' });
      const metrics = createMockPerformanceMetrics();

      // Test with null webVitals
      const nullVitalsState = createMockTrackingState({
        webVitals: undefined
      });

      expect(() => {
        service.analyzeOptimizationGap(issue, nullVitalsState, metrics, 0);
      }).not.toThrow();

      // Undefined LCP specifically
      const undefinedLcpState = createMockTrackingState({
        webVitals: { LCP: undefined, CLS: 0.1 }
      });

      expect(() => {
        service.analyzeOptimizationGap(issue, undefinedLcpState, metrics, 0);
      }).not.toThrow();
    });
  });
}); 