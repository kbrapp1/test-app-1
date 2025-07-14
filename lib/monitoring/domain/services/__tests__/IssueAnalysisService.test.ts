import { describe, it, expect, beforeEach, vi } from 'vitest';
import { IssueAnalysisService, IssueAnalysisResult } from '../business-impact/IssueAnalysisService';
import { ReactQueryCacheAnalysisService } from '../cache-analysis/ReactQueryCacheAnalysisService';

/**
 * Unit Tests for IssueAnalysisService (Domain Service)
 * 
 * Tests the core business logic for analyzing network redundancy issues
 * and determining legitimate vs problematic behavior patterns.
 * 
 * Coverage Target: 90%+ with comprehensive edge cases
 */
describe('IssueAnalysisService', () => {
  let service: IssueAnalysisService;
  let mockCacheAnalysisService: ReactQueryCacheAnalysisService;

  beforeEach(() => {
    mockCacheAnalysisService = {
      analyzeReactQueryPattern: vi.fn(),
      detectInfiniteScrollPattern: vi.fn(),
      calculateTimeDifference: vi.fn()
    } as unknown as ReactQueryCacheAnalysisService;
    service = new IssueAnalysisService(mockCacheAnalysisService);
  });

  // Test data factories following DDD patterns
  const createMockRedundantPattern = (overrides: Record<string, unknown> = {}) => ({
    pattern: 'rapid-fire' as const,
    originalCall: {
      id: 'test-call-1',
      method: 'GET',
      url: '/api/test',
      type: 'api-route' as const,
      timestamp: Date.now(),
      source: {
        component: 'TestComponent',
        hook: 'useTestQuery',
        file: 'TestComponent.tsx',
        line: 25,
        trigger: 'user-action' as const
      },
      payload: { endpoint: '/api/test', params: { page: 0 } },
      ...(overrides.originalCall as Record<string, unknown> || {})
    },
    duplicateCalls: [
      {
        id: 'test-call-2',
        method: 'GET',
        url: '/api/test',
        type: 'api-route' as const,
        timestamp: Date.now() + 1000,
        source: {
          component: 'TestComponent',
          hook: 'useTestQuery',
          file: 'TestComponent.tsx',
          line: 25,
          trigger: 'user-action' as const
        },
        payload: { endpoint: '/api/test', params: { page: 0 } },
        ...(overrides.duplicateCall as Record<string, unknown> || {})
      }
    ],
    timeWindow: 5000,
    ...overrides
  });

  const createMockPattern = () => createMockRedundantPattern();

  describe('analyzeRedundantPattern', () => {
    it('should return null for legitimate infinite scroll patterns detected by cache analysis', () => {
      // Arrange
      const pattern = createMockRedundantPattern({
        originalCall: { payload: { endpoint: '/api/generations', params: { pageParam: 0 } } },
        duplicateCall: { payload: { endpoint: '/api/generations', params: { pageParam: 1 } } }
      });

      mockCacheAnalysisService.analyzeReactQueryPattern = vi.fn().mockReturnValue(null);

      // Act
      const result = service.analyzeRedundantPattern(pattern);

      // Assert
      expect(result).toBeNull(); // Legitimate infinite scroll should be skipped
      expect(mockCacheAnalysisService.analyzeReactQueryPattern).toHaveBeenCalledWith([
        pattern.originalCall,
        ...pattern.duplicateCalls
      ]);
    });

    it('should return analysis for problematic cache patterns', () => {
      // Arrange
      const pattern = createMockRedundantPattern();
      const cacheAnalysisResult = {
        issue: 'React Query cache not preventing redundant server actions',
        severity: 'medium',
        specificFix: 'Implement React Query with proper staleTime and cacheTime',
        estimatedImpact: '2-3 hours',
        codeLocation: 'TestComponent.tsx:25'
      };

      mockCacheAnalysisService.analyzeReactQueryPattern = vi.fn().mockReturnValue(cacheAnalysisResult);

      // Act
      const result = service.analyzeRedundantPattern(pattern);

      // Assert
      expect(result).toEqual({
        source: {
          component: 'TestComponent',
          hook: 'useTestQuery',
          file: 'TestComponent.tsx:25',
          line: 25,
          trigger: 'user-action'
        },
        classification: {
          issue: 'React Query cache not preventing redundant server actions',
          severity: 'medium',
          category: 'cache-optimization',
          isReactQueryRelated: true
        },
        solution: {
          suggestedFix: 'Implement React Query with proper staleTime and cacheTime',
          estimatedImpact: '2-3 hours',
          businessImpact: expect.any(String)
        },
        performance: {
          duplicateCount: 1,
          timeWindow: 5000,
          priority: 'medium'
        },
        originalPattern: pattern,
        analysisSource: 'cache-analysis' as const,
        cacheAnalysis: cacheAnalysisResult
      });
    });

    it('should categorize issues correctly by type', () => {
      // Arrange
      const pattern = createMockRedundantPattern();
      
      const testCases = [
        { issue: 'React Query cache issue', expected: 'cache-optimization' },
        { issue: 'Redundant API calls detected', expected: 'redundancy-elimination' },
        { issue: 'Performance timing issue', expected: 'performance-optimization' },
        { issue: 'Stale data revalidation problem', expected: 'data-freshness' },
        { issue: 'Unknown optimization issue', expected: 'general-optimization' }
      ];

      testCases.forEach(({ issue, expected }) => {
        const cacheAnalysisResult = {
          issue,
          severity: 'medium' as const,
          specificFix: 'Test fix',
          estimatedImpact: '1 hour',
          codeLocation: 'TestComponent.tsx:25'
        };

        mockCacheAnalysisService.analyzeReactQueryPattern = vi.fn().mockReturnValue(cacheAnalysisResult);

        // Act
        const result = service.analyzeRedundantPattern(pattern);

        // Assert
        expect(result?.classification.category).toBe(expected);
      });
    });

    it('should fall back to network pattern analysis when cache analysis returns null', () => {
      // Arrange
      const pattern = createMockRedundantPattern();
      mockCacheAnalysisService.analyzeReactQueryPattern = vi.fn().mockReturnValue(null);

      // Act - When both cache and network analysis return null, it means legitimate behavior
      const result = service.analyzeRedundantPattern(pattern);

      // Assert
      expect(result).toBeNull(); // Both analyses returning null means legitimate behavior
    });
  });

  describe('classifyIssuesByUrgency', () => {
    it('should classify issues by severity levels', () => {
      // Arrange
      const analysisResults: IssueAnalysisResult[] = [
        {
          source: { component: 'Test1' },
          classification: { issue: 'Test1', severity: 'critical' as const, category: 'cache-optimization' as const, isReactQueryRelated: true },
          solution: { suggestedFix: 'Fix1', estimatedImpact: '1h', businessImpact: 'High' },
          performance: { duplicateCount: 5, timeWindow: 1000, priority: 'critical' as const },
          originalPattern: createMockPattern(),
          analysisSource: 'cache-analysis' as const
        },
        {
          source: { component: 'Test2' },
          classification: { issue: 'Test2', severity: 'high' as const, category: 'redundancy-elimination' as const, isReactQueryRelated: false },
          solution: { suggestedFix: 'Fix2', estimatedImpact: '2h', businessImpact: 'Medium' },
          performance: { duplicateCount: 3, timeWindow: 2000, priority: 'high' as const },
          originalPattern: createMockPattern(),
          analysisSource: 'network-pattern' as const
        },
        {
          source: { component: 'Test3' },
          classification: { issue: 'Test3', severity: 'medium' as const, category: 'performance-optimization' as const, isReactQueryRelated: true },
          solution: { suggestedFix: 'Fix3', estimatedImpact: '3h', businessImpact: 'Low' },
          performance: { duplicateCount: 2, timeWindow: 3000, priority: 'medium' as const },
          originalPattern: createMockPattern(),
          analysisSource: 'cache-analysis' as const
        }
      ];

      // Act
      const classification = service.classifyIssuesByUrgency(analysisResults);

      // Assert
      expect(classification).toEqual({
        critical: 1,
        high: 1,
        medium: 1,
        low: 0,
        total: 3,
        categories: expect.any(Map),
        hasReactQueryIssues: true
      });

      expect(classification.categories.get('cache-optimization')).toHaveLength(1);
      expect(classification.categories.get('redundancy-elimination')).toHaveLength(1);
      expect(classification.categories.get('performance-optimization')).toHaveLength(1);
    });

    it('should detect React Query issues correctly', () => {
      // Arrange
      const analysisResults: IssueAnalysisResult[] = [
        {
          source: { component: 'Test' },
          classification: { issue: 'Test', severity: 'medium' as const, category: 'cache-optimization' as const, isReactQueryRelated: false },
          solution: { suggestedFix: 'Fix', estimatedImpact: '1h', businessImpact: 'Medium' },
          performance: { duplicateCount: 2, timeWindow: 1000, priority: 'medium' as const },
          originalPattern: createMockPattern(),
          analysisSource: 'network-pattern' as const
        }
      ];

      // Act
      const classification = service.classifyIssuesByUrgency(analysisResults);

      // Assert
      expect(classification.hasReactQueryIssues).toBe(false);
    });
  });

  describe('factory method', () => {
    it('should create service with proper dependencies', () => {
      // Act
      const createdService = IssueAnalysisService.create();

      // Assert
      expect(createdService).toBeInstanceOf(IssueAnalysisService);
    });
  });
}); 