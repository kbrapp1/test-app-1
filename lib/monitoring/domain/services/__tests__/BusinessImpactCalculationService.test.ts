import { describe, it, expect } from 'vitest';
import { BusinessImpactCalculationService } from '../business-impact/BusinessImpactCalculationService';
import { PerformanceMetrics } from '../../entities/PerformanceMetrics';
import { PerformanceTrackingState } from '../../../application/dto/PerformanceTrackingDTO';

/**
 * Unit Tests for BusinessImpactCalculationService (Domain Service)
 * 
 * Tests the core business logic for calculating performance impact levels
 * and generating impact descriptions with proper icons.
 * 
 * Coverage Target: 90%+ with edge cases and boundary conditions
 */
describe('BusinessImpactCalculationService', () => {
  // Test data factories following DDD patterns
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

  describe('calculateFrontendBusinessImpact', () => {
    it('should calculate critical impact for high render count', () => {
      // Arrange
      const trackingState = createMockTrackingState({
        renderMetrics: { count: 25, rapidCount: 5, lastReset: Date.now() }, // > 20 renders = critical
        cacheHitRate: 80,
        webVitals: { LCP: 2000, CLS: 0.1 }
      });
      const metrics = createMockPerformanceMetrics();

      // Act
      const result = BusinessImpactCalculationService.calculateFrontendBusinessImpact(trackingState, metrics);

      // Assert
      expect(result).toBe('🔴 **CRITICAL**: Significant user experience degradation affecting conversions');
    });

    it('should calculate critical impact for poor LCP (> 4000ms)', () => {
      // Arrange
      const trackingState = createMockTrackingState({
        renderMetrics: { count: 10, rapidCount: 1, lastReset: Date.now() },
        cacheHitRate: 80,
        webVitals: { LCP: 4500, CLS: 0.1 } // LCP > 4000ms = critical
      });
      const metrics = createMockPerformanceMetrics();

      // Act
      const result = BusinessImpactCalculationService.calculateFrontendBusinessImpact(trackingState, metrics);

      // Assert
      expect(result).toBe('🔴 **CRITICAL**: Significant user experience degradation affecting conversions');
    });

    it('should calculate critical impact for very low cache hit rate', () => {
      // Arrange
      const trackingState = createMockTrackingState({
        renderMetrics: { count: 10, rapidCount: 1, lastReset: Date.now() },
        cacheHitRate: 25, // < 30% = critical
        webVitals: { LCP: 2000, CLS: 0.1 }
      });
      const metrics = createMockPerformanceMetrics();

      // Act
      const result = BusinessImpactCalculationService.calculateFrontendBusinessImpact(trackingState, metrics);

      // Assert
      expect(result).toBe('🔴 **CRITICAL**: Significant user experience degradation affecting conversions');
    });

    it('should calculate high impact for moderate render count', () => {
      // Arrange
      const trackingState = createMockTrackingState({
        renderMetrics: { count: 18, rapidCount: 3, lastReset: Date.now() }, // > 15 renders = high
        cacheHitRate: 70,
        webVitals: { LCP: 2000, CLS: 0.1 }
      });
      const metrics = createMockPerformanceMetrics();

      // Act
      const result = BusinessImpactCalculationService.calculateFrontendBusinessImpact(trackingState, metrics);

      // Assert
      expect(result).toBe('🟡 **HIGH**: Performance issues impacting user satisfaction');
    });

    it('should calculate high impact for moderate LCP (> 2500ms)', () => {
      // Arrange
      const trackingState = createMockTrackingState({
        renderMetrics: { count: 10, rapidCount: 1, lastReset: Date.now() },
        cacheHitRate: 70,
        webVitals: { LCP: 3000, CLS: 0.1 } // LCP > 2500ms = high
      });
      const metrics = createMockPerformanceMetrics();

      // Act
      const result = BusinessImpactCalculationService.calculateFrontendBusinessImpact(trackingState, metrics);

      // Assert
      expect(result).toBe('🟡 **HIGH**: Performance issues impacting user satisfaction');
    });

    it('should calculate high impact for zero cache size on non-dashboard pages', () => {
      // Arrange
      const trackingState = createMockTrackingState({
        renderMetrics: { count: 10, rapidCount: 1, lastReset: Date.now() },
        cacheHitRate: 70,
        webVitals: { LCP: 2000, CLS: 0.1 },
        pageContext: 'dam' // Non-dashboard with zero cache = high impact
      });
      const metrics = createMockPerformanceMetrics({
        cacheSize: 0
      });

      // Act
      const result = BusinessImpactCalculationService.calculateFrontendBusinessImpact(trackingState, metrics);

      // Assert
      expect(result).toBe('🟡 **HIGH**: Performance issues impacting user satisfaction');
    });

    it('should NOT calculate high impact for zero cache size on dashboard', () => {
      // Arrange
      const trackingState = createMockTrackingState({
        renderMetrics: { count: 10, rapidCount: 1, lastReset: Date.now() },
        cacheHitRate: 70,
        webVitals: { LCP: 2000, CLS: 0.1 },
        pageContext: 'dashboard' // Dashboard with zero cache should be OK
      });
      const metrics = createMockPerformanceMetrics({
        cacheSize: 0
      });

      // Act
      const result = BusinessImpactCalculationService.calculateFrontendBusinessImpact(trackingState, metrics);

      // Assert - Dashboard with zero cache should be acceptable (low impact)
      expect(result).toBe('✅ **LOW**: Performance is acceptable');
    });

    it('should calculate medium impact for moderate issues', () => {
      // Arrange
      const trackingState = createMockTrackingState({
        renderMetrics: { count: 12, rapidCount: 2, lastReset: Date.now() }, // > 10 renders = medium
        cacheHitRate: 80,
        webVitals: { LCP: 2000, CLS: 0.1 }
      });
      const metrics = createMockPerformanceMetrics();

      // Act
      const result = BusinessImpactCalculationService.calculateFrontendBusinessImpact(trackingState, metrics);

      // Assert
      expect(result).toBe('🟢 **MEDIUM**: Optimization opportunities for better performance');
    });

    it('should calculate medium impact for low cache hit rate', () => {
      // Arrange
      const trackingState = createMockTrackingState({
        renderMetrics: { count: 8, rapidCount: 1, lastReset: Date.now() },
        cacheHitRate: 65, // < 70% = medium
        webVitals: { LCP: 2000, CLS: 0.1 }
      });
      const metrics = createMockPerformanceMetrics();

      // Act
      const result = BusinessImpactCalculationService.calculateFrontendBusinessImpact(trackingState, metrics);

      // Assert
      expect(result).toBe('🟢 **MEDIUM**: Optimization opportunities for better performance');
    });

    it('should calculate low impact for optimal performance', () => {
      // Arrange
      const trackingState = createMockTrackingState({
        renderMetrics: { count: 5, rapidCount: 0, lastReset: Date.now() }, // <= 10 renders
        cacheHitRate: 85, // >= 70%
        webVitals: { LCP: 1500, CLS: 0.05 } // Good LCP
      });
      const metrics = createMockPerformanceMetrics();

      // Act
      const result = BusinessImpactCalculationService.calculateFrontendBusinessImpact(trackingState, metrics);

      // Assert
      expect(result).toBe('✅ **LOW**: Performance is acceptable');
    });

    it('should handle missing LCP values gracefully', () => {
      // Arrange
      const trackingState = createMockTrackingState({
        renderMetrics: { count: 8, rapidCount: 1, lastReset: Date.now() },
        cacheHitRate: 80,
        webVitals: { CLS: 0.1 } // No LCP value
      });
      const metrics = createMockPerformanceMetrics();

      // Act
      const result = BusinessImpactCalculationService.calculateFrontendBusinessImpact(trackingState, metrics);

      // Assert - Should not trigger LCP-based critical/high conditions
      expect(result).toBe('✅ **LOW**: Performance is acceptable');
    });

    it('should handle null/undefined webVitals gracefully', () => {
      // Arrange
      const trackingState = createMockTrackingState({
        renderMetrics: { count: 8, rapidCount: 1, lastReset: Date.now() },
        cacheHitRate: 80,
        webVitals: undefined
      });
      const metrics = createMockPerformanceMetrics();

      // Act & Assert - Should not throw error
      expect(() => {
        BusinessImpactCalculationService.calculateFrontendBusinessImpact(trackingState, metrics);
      }).not.toThrow();
    });
  });

  describe('Edge Cases and Boundary Conditions', () => {
    it('should handle exact boundary values correctly', () => {
      // Test exact boundary for critical render count (20)
      const trackingStateBoundary = createMockTrackingState({
        renderMetrics: { count: 20, rapidCount: 4, lastReset: Date.now() },
        cacheHitRate: 80,
        webVitals: { LCP: 2000, CLS: 0.1 }
      });
      const metrics = createMockPerformanceMetrics();

      const result = BusinessImpactCalculationService.calculateFrontendBusinessImpact(trackingStateBoundary, metrics);
      expect(result).toBe('🟡 **HIGH**: Performance issues impacting user satisfaction');

      // Test just over boundary (21)
      const trackingStateOver = createMockTrackingState({
        renderMetrics: { count: 21, rapidCount: 4, lastReset: Date.now() },
        cacheHitRate: 80,
        webVitals: { LCP: 2000, CLS: 0.1 }
      });

      const resultOver = BusinessImpactCalculationService.calculateFrontendBusinessImpact(trackingStateOver, metrics);
      expect(resultOver).toBe('🔴 **CRITICAL**: Significant user experience degradation affecting conversions');
    });

    it('should handle zero values correctly', () => {
      // Arrange
      const trackingState = createMockTrackingState({
        renderMetrics: { count: 0, rapidCount: 0, lastReset: Date.now() },
        cacheHitRate: 0,
        webVitals: { LCP: 0, CLS: 0 }
      });
      const metrics = createMockPerformanceMetrics({
        cacheSize: 0,
        activeMutations: 0
      });

      // Act
      const result = BusinessImpactCalculationService.calculateFrontendBusinessImpact(trackingState, metrics);

      // Assert - Zero cache hit rate should trigger critical
      expect(result).toBe('🔴 **CRITICAL**: Significant user experience degradation affecting conversions');
    });

    it('should handle extreme values correctly', () => {
      // Arrange
      const trackingState = createMockTrackingState({
        renderMetrics: { count: 1000, rapidCount: 100, lastReset: Date.now() },
        cacheHitRate: 100,
        webVitals: { LCP: 10000, CLS: 1.0 }
      });
      const metrics = createMockPerformanceMetrics({
        cacheSize: 1000000,
        activeMutations: 1000
      });

      // Act
      const result = BusinessImpactCalculationService.calculateFrontendBusinessImpact(trackingState, metrics);

      // Assert - High render count and LCP should trigger critical
      expect(result).toBe('🔴 **CRITICAL**: Significant user experience degradation affecting conversions');
    });
  });

  describe('Internal Method Coverage', () => {
    // Testing private methods indirectly through public interface
    it('should return correct impact descriptions for all levels', () => {
      // Critical
      const critical = createMockTrackingState({
        renderMetrics: { count: 25, rapidCount: 5, lastReset: Date.now() },
        cacheHitRate: 80,
        webVitals: { LCP: 2000, CLS: 0.1 }
      });
      
      // High  
      const high = createMockTrackingState({
        renderMetrics: { count: 18, rapidCount: 3, lastReset: Date.now() },
        cacheHitRate: 70,
        webVitals: { LCP: 2000, CLS: 0.1 }
      });
      
      // Medium
      const medium = createMockTrackingState({
        renderMetrics: { count: 12, rapidCount: 2, lastReset: Date.now() },
        cacheHitRate: 80,
        webVitals: { LCP: 2000, CLS: 0.1 }
      });
      
      // Low
      const low = createMockTrackingState({
        renderMetrics: { count: 5, rapidCount: 0, lastReset: Date.now() },
        cacheHitRate: 85,
        webVitals: { LCP: 1500, CLS: 0.05 }
      });

      const metrics = createMockPerformanceMetrics();

      // Verify each impact level has correct description and icon
      expect(BusinessImpactCalculationService.calculateFrontendBusinessImpact(critical, metrics))
        .toContain('Significant user experience degradation affecting conversions');
      
      expect(BusinessImpactCalculationService.calculateFrontendBusinessImpact(high, metrics))
        .toContain('Performance issues impacting user satisfaction');
      
      expect(BusinessImpactCalculationService.calculateFrontendBusinessImpact(medium, metrics))
        .toContain('Optimization opportunities for better performance');
      
      expect(BusinessImpactCalculationService.calculateFrontendBusinessImpact(low, metrics))
        .toContain('Performance is acceptable');
    });

    it('should return correct icons for all impact levels', () => {
      const metrics = createMockPerformanceMetrics();

      // Test each icon through public interface
      const critical = BusinessImpactCalculationService.calculateFrontendBusinessImpact(
        createMockTrackingState({ renderMetrics: { count: 25, rapidCount: 5, lastReset: Date.now() } }), 
        metrics
      );
      expect(critical).toMatch(/^🔴/);

      const high = BusinessImpactCalculationService.calculateFrontendBusinessImpact(
        createMockTrackingState({ renderMetrics: { count: 18, rapidCount: 3, lastReset: Date.now() } }), 
        metrics
      );
      expect(high).toMatch(/^🟡/);

      const medium = BusinessImpactCalculationService.calculateFrontendBusinessImpact(
        createMockTrackingState({ renderMetrics: { count: 12, rapidCount: 2, lastReset: Date.now() } }), 
        metrics
      );
      expect(medium).toMatch(/^🟢/);

      const low = BusinessImpactCalculationService.calculateFrontendBusinessImpact(
        createMockTrackingState({ renderMetrics: { count: 5, rapidCount: 0, lastReset: Date.now() } }), 
        metrics
      );
      expect(low).toMatch(/^✅/);
    });
  });
}); 