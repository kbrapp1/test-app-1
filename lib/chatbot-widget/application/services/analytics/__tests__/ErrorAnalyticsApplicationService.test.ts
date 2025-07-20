/**
 * ErrorAnalyticsApplicationService Tests
 * 
 * Critical orchestration tests for error analytics application service
 * Tests organization security and proper service coordination
 */

import { describe, it, expect, beforeEach, vi, type MockedFunction } from 'vitest';
import { ErrorAnalyticsApplicationService } from '../ErrorAnalyticsApplicationService';
import { ErrorAnalyticsQueryOrchestrator } from '../ErrorAnalyticsQueryOrchestrator';
import { ErrorAnalyticsSupabaseRepository } from '../../../../infrastructure/persistence/supabase/analytics/ErrorAnalyticsSupabaseRepository';
import { ErrorSummary } from '../../../../domain/value-objects/analytics/ErrorSummary';
import { ErrorTrend } from '../../../../domain/value-objects/analytics/ErrorTrend';
import { ErrorAnalyticsFilter, ErrorAnalyticsFilterData } from '../../../../domain/value-objects/analytics/ErrorAnalyticsFilter';
import type { SupabaseClient } from '@supabase/supabase-js';

// Mock the dependencies
vi.mock('../ErrorAnalyticsQueryOrchestrator');
vi.mock('../../../../infrastructure/persistence/supabase/analytics/ErrorAnalyticsSupabaseRepository');

describe('ErrorAnalyticsApplicationService', () => {
  let service: ErrorAnalyticsApplicationService;
  let mockSupabase: SupabaseClient;
  let mockOrchestrator: ErrorAnalyticsQueryOrchestrator;
  let mockRepository: ErrorAnalyticsSupabaseRepository;

  beforeEach(() => {
    // Create mock Supabase client
    mockSupabase = {} as SupabaseClient;

    // Create mock repository
    mockRepository = {} as ErrorAnalyticsSupabaseRepository;
    (ErrorAnalyticsSupabaseRepository as any).mockImplementation(() => mockRepository);

    // Create mock orchestrator
    mockOrchestrator = {
      getErrorSummary: vi.fn(),
      getErrorTrends: vi.fn()
    } as any;
    (ErrorAnalyticsQueryOrchestrator as any).mockImplementation(() => mockOrchestrator);

    service = new ErrorAnalyticsApplicationService(mockSupabase);
  });

  describe('Initialization', () => {
    it('should create repository with supabase client', () => {
      expect(ErrorAnalyticsSupabaseRepository).toHaveBeenCalledWith(mockSupabase);
    });

    it('should create orchestrator with repository', () => {
      expect(ErrorAnalyticsQueryOrchestrator).toHaveBeenCalledWith(mockRepository);
    });

    it('should be properly initialized', () => {
      expect(service).toBeDefined();
      expect(service.getErrorSummary).toBeDefined();
      expect(service.getErrorTrends).toBeDefined();
      expect(service.getErrorsBySession).toBeDefined();
      expect(service.getErrorsByUser).toBeDefined();
    });
  });

  describe('getErrorSummary', () => {
    it('should create filter and delegate to orchestrator', async () => {
      const filterData: ErrorAnalyticsFilterData = {
        organizationId: 'org-123',
        timeRange: '24h',
        severity: ['critical', 'warning'],
        category: ['validation', 'database']
      };

      const mockSummary = ErrorSummary.create({
        totalErrors: 42,
        errorsByCode: { 'ERR001': 25, 'ERR002': 17 },
        errorsBySeverity: { 'critical': 15, 'warning': 27 },
        errorsByCategory: { 'validation': 30, 'database': 12 },
        errorsByTable: { 'chat_sessions': 25, 'chat_messages': 17 },
        recentErrors: []
      });

      (mockOrchestrator.getErrorSummary as MockedFunction<any>).mockResolvedValue(mockSummary);

      const result = await service.getErrorSummary(filterData);

      expect(mockOrchestrator.getErrorSummary).toHaveBeenCalledWith(
        expect.any(ErrorAnalyticsFilter)
      );
      expect(result).toBe(mockSummary);
    });

    it('should handle minimal filter data', async () => {
      const filterData: ErrorAnalyticsFilterData = {
        organizationId: 'org-minimal',
        timeRange: '1h'
      };

      const mockSummary = ErrorSummary.createEmpty();
      (mockOrchestrator.getErrorSummary as MockedFunction<any>).mockResolvedValue(mockSummary);

      const result = await service.getErrorSummary(filterData);

      expect(mockOrchestrator.getErrorSummary).toHaveBeenCalledWith(
        expect.any(ErrorAnalyticsFilter)
      );
      expect(result).toBe(mockSummary);
    });

    it('should handle comprehensive filter with all options', async () => {
      const comprehensiveFilter: ErrorAnalyticsFilterData = {
        organizationId: 'org-comprehensive',
        timeRange: '30d',
        severity: ['critical', 'warning', 'info'],
        category: ['validation', 'database', 'authentication', 'api'],
        errorCode: ['ERR001', 'ERR002', 'ERR003']
        // Note: sessionId and userId cannot be used together per business rules
      };

      const mockSummary = ErrorSummary.create({
        totalErrors: 150,
        errorsByCode: { 'ERR001': 50, 'ERR002': 50, 'ERR003': 50 },
        errorsBySeverity: { 'critical': 30, 'warning': 70, 'info': 50 },
        errorsByCategory: { 'validation': 60, 'database': 40, 'authentication': 30, 'api': 20 },
        errorsByTable: { 'chat_sessions': 75, 'chat_messages': 45, 'profiles': 30 },
        recentErrors: []
      });

      (mockOrchestrator.getErrorSummary as MockedFunction<any>).mockResolvedValue(mockSummary);

      const result = await service.getErrorSummary(comprehensiveFilter);

      expect(mockOrchestrator.getErrorSummary).toHaveBeenCalledWith(
        expect.any(ErrorAnalyticsFilter)
      );
      expect(result).toBe(mockSummary);
    });

    it('should propagate errors from orchestrator', async () => {
      const filterData: ErrorAnalyticsFilterData = {
        organizationId: 'org-error',
        timeRange: '24h'
      };

      const error = new Error('Database connection failed');
      (mockOrchestrator.getErrorSummary as MockedFunction<any>).mockRejectedValue(error);

      await expect(service.getErrorSummary(filterData)).rejects.toThrow('Database connection failed');
    });

    it('should maintain organization security in filter creation', async () => {
      const filterData: ErrorAnalyticsFilterData = {
        organizationId: 'org-security-test',
        timeRange: '7d'
      };

      const mockSummary = ErrorSummary.createEmpty();
      (mockOrchestrator.getErrorSummary as MockedFunction<any>).mockResolvedValue(mockSummary);

      await service.getErrorSummary(filterData);

      const filterCall = (mockOrchestrator.getErrorSummary as MockedFunction<any>)
        .mock.calls[0][0] as ErrorAnalyticsFilter;
      expect(filterCall.organizationId).toBe('org-security-test');
    });
  });

  describe('getErrorTrends', () => {
    it('should create filter and delegate to orchestrator', async () => {
      const filterData: ErrorAnalyticsFilterData = {
        organizationId: 'org-trends',
        timeRange: '7d',
        severity: ['critical']
      };

      const mockTrends = [
        ErrorTrend.create({
          period: '2023-01-01T00:00:00Z',
          errorCount: 10,
          severity: 'critical',
          category: 'validation'
        }),
        ErrorTrend.create({
          period: '2023-01-02T00:00:00Z',
          errorCount: 15,
          severity: 'critical',
          category: 'database'
        })
      ];

      (mockOrchestrator.getErrorTrends as MockedFunction<any>).mockResolvedValue(mockTrends);

      const result = await service.getErrorTrends(filterData);

      expect(mockOrchestrator.getErrorTrends).toHaveBeenCalledWith(
        expect.any(ErrorAnalyticsFilter)
      );
      expect(result).toBe(mockTrends);
    });

    it('should handle empty trends result', async () => {
      const filterData: ErrorAnalyticsFilterData = {
        organizationId: 'org-no-trends',
        timeRange: '1h'
      };

      (mockOrchestrator.getErrorTrends as MockedFunction<any>).mockResolvedValue([]);

      const result = await service.getErrorTrends(filterData);

      expect(result).toEqual([]);
    });

    it('should handle long-term trend analysis', async () => {
      const filterData: ErrorAnalyticsFilterData = {
        organizationId: 'org-long-term',
        timeRange: '30d'
      };

      const longTermTrends = Array.from({ length: 30 }, (_, i) => 
        ErrorTrend.create({
          period: `2023-01-${(i + 1).toString().padStart(2, '0')}T00:00:00Z`,
          errorCount: Math.floor(Math.random() * 50),
          severity: i % 3 === 0 ? 'critical' : i % 3 === 1 ? 'warning' : 'info',
          category: i % 4 === 0 ? 'validation' : i % 4 === 1 ? 'database' : i % 4 === 2 ? 'api' : 'authentication'
        })
      );

      (mockOrchestrator.getErrorTrends as MockedFunction<any>).mockResolvedValue(longTermTrends);

      const result = await service.getErrorTrends(filterData);

      expect(result).toBe(longTermTrends);
      expect(result).toHaveLength(30);
    });

    it('should propagate errors from orchestrator', async () => {
      const filterData: ErrorAnalyticsFilterData = {
        organizationId: 'org-trends-error',
        timeRange: '24h'
      };

      const error = new Error('Query timeout');
      (mockOrchestrator.getErrorTrends as MockedFunction<any>).mockRejectedValue(error);

      await expect(service.getErrorTrends(filterData)).rejects.toThrow('Query timeout');
    });
  });

  describe('getErrorsBySession', () => {
    it('should create session-specific filter and delegate to orchestrator', async () => {
      const sessionId = 'session-123';
      const organizationId = 'org-session-test';

      const mockSummary = ErrorSummary.create({
        totalErrors: 5,
        errorsByCode: { 'ERR001': 3, 'ERR002': 2 },
        errorsBySeverity: { 'warning': 4, 'info': 1 },
        errorsByCategory: { 'validation': 3, 'api': 2 },
        errorsByTable: { 'chat_messages': 5 },
        recentErrors: [
          {
            errorCode: 'ERR001',
            errorMessage: 'Session-specific error',
            errorCategory: 'validation',
            severity: 'warning',
            createdAt: '2023-01-01T12:00:00Z',
            tableName: 'chat_messages'
          }
        ]
      });

      (mockOrchestrator.getErrorSummary as MockedFunction<any>).mockResolvedValue(mockSummary);

      const result = await service.getErrorsBySession(sessionId, organizationId);

      expect(mockOrchestrator.getErrorSummary).toHaveBeenCalledWith(
        expect.any(ErrorAnalyticsFilter)
      );
      
      // Verify the filter contains session-specific data
      const filterCall = (mockOrchestrator.getErrorSummary as MockedFunction<any>)
        .mock.calls[0][0] as ErrorAnalyticsFilter;
      expect(filterCall.organizationId).toBe(organizationId);
      expect(filterCall.sessionId).toBe(sessionId);
      expect(filterCall.timeRange).toBe('7d'); // Default from factory method
      
      expect(result).toBe(mockSummary);
    });

    it('should handle session with no errors', async () => {
      const sessionId = 'session-clean';
      const organizationId = 'org-clean';

      const mockSummary = ErrorSummary.createEmpty();
      (mockOrchestrator.getErrorSummary as MockedFunction<any>).mockResolvedValue(mockSummary);

      const result = await service.getErrorsBySession(sessionId, organizationId);

      expect(result).toBe(mockSummary);
      expect(result.totalErrors).toBe(0);
    });

    it('should enforce organization security for session queries', async () => {
      const sessionId = 'session-security';
      const organizationId = 'org-secure';

      const mockSummary = ErrorSummary.createEmpty();
      (mockOrchestrator.getErrorSummary as MockedFunction<any>).mockResolvedValue(mockSummary);

      await service.getErrorsBySession(sessionId, organizationId);

      const filterCall = (mockOrchestrator.getErrorSummary as MockedFunction<any>)
        .mock.calls[0][0] as ErrorAnalyticsFilter;
      expect(filterCall.organizationId).toBe(organizationId);
      expect(filterCall.sessionId).toBe(sessionId);
    });

    it('should propagate errors from orchestrator for session queries', async () => {
      const sessionId = 'session-error';
      const organizationId = 'org-error';

      const error = new Error('Session not found');
      (mockOrchestrator.getErrorSummary as MockedFunction<any>).mockRejectedValue(error);

      await expect(service.getErrorsBySession(sessionId, organizationId)).rejects.toThrow('Session not found');
    });
  });

  describe('getErrorsByUser', () => {
    it('should create user-specific filter and delegate to orchestrator', async () => {
      const userId = 'user-456';
      const organizationId = 'org-user-test';

      const mockSummary = ErrorSummary.create({
        totalErrors: 8,
        errorsByCode: { 'ERR001': 5, 'ERR003': 3 },
        errorsBySeverity: { 'critical': 2, 'warning': 6 },
        errorsByCategory: { 'authentication': 5, 'api': 3 },
        errorsByTable: { 'profiles': 8 },
        recentErrors: [
          {
            errorCode: 'ERR001',
            errorMessage: 'User authentication failed',
            errorCategory: 'authentication',
            severity: 'critical',
            createdAt: '2023-01-01T15:30:00Z',
            tableName: 'profiles'
          }
        ]
      });

      (mockOrchestrator.getErrorSummary as MockedFunction<any>).mockResolvedValue(mockSummary);

      const result = await service.getErrorsByUser(userId, organizationId);

      expect(mockOrchestrator.getErrorSummary).toHaveBeenCalledWith(
        expect.any(ErrorAnalyticsFilter)
      );
      
      // Verify the filter contains user-specific data
      const filterCall = (mockOrchestrator.getErrorSummary as MockedFunction<any>)
        .mock.calls[0][0] as ErrorAnalyticsFilter;
      expect(filterCall.organizationId).toBe(organizationId);
      expect(filterCall.userId).toBe(userId);
      expect(filterCall.timeRange).toBe('7d'); // Default from factory method
      
      expect(result).toBe(mockSummary);
    });

    it('should handle user with no errors', async () => {
      const userId = 'user-clean';
      const organizationId = 'org-clean';

      const mockSummary = ErrorSummary.createEmpty();
      (mockOrchestrator.getErrorSummary as MockedFunction<any>).mockResolvedValue(mockSummary);

      const result = await service.getErrorsByUser(userId, organizationId);

      expect(result).toBe(mockSummary);
      expect(result.totalErrors).toBe(0);
    });

    it('should enforce organization security for user queries', async () => {
      const userId = 'user-security';
      const organizationId = 'org-secure';

      const mockSummary = ErrorSummary.createEmpty();
      (mockOrchestrator.getErrorSummary as MockedFunction<any>).mockResolvedValue(mockSummary);

      await service.getErrorsByUser(userId, organizationId);

      const filterCall = (mockOrchestrator.getErrorSummary as MockedFunction<any>)
        .mock.calls[0][0] as ErrorAnalyticsFilter;
      expect(filterCall.organizationId).toBe(organizationId);
      expect(filterCall.userId).toBe(userId);
    });

    it('should propagate errors from orchestrator for user queries', async () => {
      const userId = 'user-error';
      const organizationId = 'org-error';

      const error = new Error('User not found');
      (mockOrchestrator.getErrorSummary as MockedFunction<any>).mockRejectedValue(error);

      await expect(service.getErrorsByUser(userId, organizationId)).rejects.toThrow('User not found');
    });
  });

  describe('Organization Security and Isolation', () => {
    it('should always include organization ID in filters', async () => {
      const testCases = [
        {
          method: 'getErrorSummary',
          args: [{ organizationId: 'org-test-1', timeRange: '24h' as const }]
        },
        {
          method: 'getErrorTrends', 
          args: [{ organizationId: 'org-test-2', timeRange: '7d' as const }]
        },
        {
          method: 'getErrorsBySession',
          args: ['session-123', 'org-test-3']
        },
        {
          method: 'getErrorsByUser',
          args: ['user-456', 'org-test-4']
        }
      ];

      const mockSummary = ErrorSummary.createEmpty();
      const mockTrends: ErrorTrend[] = [];
      (mockOrchestrator.getErrorSummary as MockedFunction<any>).mockResolvedValue(mockSummary);
      (mockOrchestrator.getErrorTrends as MockedFunction<any>).mockResolvedValue(mockTrends);

      for (const testCase of testCases) {
        await (service as any)[testCase.method](...testCase.args);
        
        const lastCall = testCase.method === 'getErrorTrends' 
          ? (mockOrchestrator.getErrorTrends as MockedFunction<any>).mock.calls.pop()
          : (mockOrchestrator.getErrorSummary as MockedFunction<any>).mock.calls.pop();
        
        if (lastCall) {
          const filter = lastCall[0] as ErrorAnalyticsFilter;
          expect(filter.organizationId).toBeDefined();
          expect(filter.organizationId).toMatch(/^org-test-\d+$/);
        }
      }
    });

    it('should not leak data between organizations', async () => {
      const org1Filter = { organizationId: 'org-1', timeRange: '24h' as const };
      const org2Filter = { organizationId: 'org-2', timeRange: '24h' as const };

      const org1Summary = ErrorSummary.create({
        totalErrors: 10,
        errorsByCode: { 'ORG1_ERR': 10 },
        errorsBySeverity: { 'critical': 10 },
        errorsByCategory: { 'org1_category': 10 },
        errorsByTable: { 'org1_table': 10 },
        recentErrors: []
      });

      const org2Summary = ErrorSummary.create({
        totalErrors: 20,
        errorsByCode: { 'ORG2_ERR': 20 },
        errorsBySeverity: { 'warning': 20 },
        errorsByCategory: { 'org2_category': 20 },
        errorsByTable: { 'org2_table': 20 },
        recentErrors: []
      });

      (mockOrchestrator.getErrorSummary as MockedFunction<any>)
        .mockResolvedValueOnce(org1Summary)
        .mockResolvedValueOnce(org2Summary);

      const result1 = await service.getErrorSummary(org1Filter);
      const result2 = await service.getErrorSummary(org2Filter);

      expect(result1).toBe(org1Summary);
      expect(result2).toBe(org2Summary);
      expect(result1.totalErrors).toBe(10);
      expect(result2.totalErrors).toBe(20);
    });
  });

  describe('Error Handling and Resilience', () => {
    it('should handle repository initialization errors', () => {
      (ErrorAnalyticsSupabaseRepository as any).mockImplementation(() => {
        throw new Error('Failed to initialize repository');
      });

      expect(() => new ErrorAnalyticsApplicationService(mockSupabase)).toThrow('Failed to initialize repository');
    });

    it('should handle orchestrator initialization errors', () => {
      (ErrorAnalyticsQueryOrchestrator as any).mockImplementation(() => {
        throw new Error('Failed to initialize orchestrator');
      });

      expect(() => new ErrorAnalyticsApplicationService(mockSupabase)).toThrow('Failed to initialize orchestrator');
    });

    it('should handle network timeouts gracefully', async () => {
      const filterData = { organizationId: 'org-timeout', timeRange: '30d' as const };

      const timeoutError = new Error('Network timeout');
      timeoutError.name = 'TimeoutError';
      (mockOrchestrator.getErrorSummary as MockedFunction<any>).mockRejectedValue(timeoutError);

      await expect(service.getErrorSummary(filterData)).rejects.toThrow('Network timeout');
    });

    it('should handle malformed filter data validation', async () => {
      const invalidFilter = { organizationId: '', timeRange: 'invalid' as any };

      // The ErrorAnalyticsFilter.create should throw validation error
      await expect(service.getErrorSummary(invalidFilter)).rejects.toThrow();
    });

    it('should enforce business rule: cannot filter by both session and user', async () => {
      const invalidFilter: ErrorAnalyticsFilterData = {
        organizationId: 'org-invalid',
        timeRange: '24h',
        sessionId: 'session-123',
        userId: 'user-456' // This violates the business rule
      };

      await expect(service.getErrorSummary(invalidFilter)).rejects.toThrow('Cannot filter by both session and user simultaneously');
    });
  });

  describe('Performance and Resource Management', () => {
    it('should not cache results between calls', async () => {
      const filterData = { organizationId: 'org-no-cache', timeRange: '1h' as const };

      const summary1 = ErrorSummary.create({
        totalErrors: 5,
        errorsByCode: {},
        errorsBySeverity: {},
        errorsByCategory: {},
        errorsByTable: {},
        recentErrors: []
      });

      const summary2 = ErrorSummary.create({
        totalErrors: 10,
        errorsByCode: {},
        errorsBySeverity: {},
        errorsByCategory: {},
        errorsByTable: {},
        recentErrors: []
      });

      (mockOrchestrator.getErrorSummary as MockedFunction<any>)
        .mockResolvedValueOnce(summary1)
        .mockResolvedValueOnce(summary2);

      const result1 = await service.getErrorSummary(filterData);
      const result2 = await service.getErrorSummary(filterData);

      expect(result1).toBe(summary1);
      expect(result2).toBe(summary2);
      expect(mockOrchestrator.getErrorSummary).toHaveBeenCalledTimes(2);
    });

    it('should handle concurrent requests efficiently', async () => {
      const filter1 = { organizationId: 'org-concurrent-1', timeRange: '1h' as const };
      const filter2 = { organizationId: 'org-concurrent-2', timeRange: '24h' as const };

      const summary1 = ErrorSummary.createEmpty();
      const summary2 = ErrorSummary.create({
        totalErrors: 3,
        errorsByCode: {},
        errorsBySeverity: {},
        errorsByCategory: {},
        errorsByTable: {},
        recentErrors: []
      });

      (mockOrchestrator.getErrorSummary as MockedFunction<any>)
        .mockImplementation(async (filter: any) => {
          // Simulate different response times
          if (filter.organizationId === 'org-concurrent-1') return summary1;
          if (filter.organizationId === 'org-concurrent-2') return summary2;
          throw new Error('Unexpected filter');
        });

      const [result1, result2] = await Promise.all([
        service.getErrorSummary(filter1),
        service.getErrorSummary(filter2)
      ]);

      expect(result1).toBe(summary1);
      expect(result2).toBe(summary2);
      expect(result1.totalErrors).toBe(0);
      expect(result2.totalErrors).toBe(3);
    });
  });
});