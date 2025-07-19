/**
 * ErrorAnalyticsService Tests
 * 
 * Business-critical tests for error tracking and analytics
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ErrorAnalyticsService } from '../ErrorAnalyticsService';
import { ErrorAnalyticsApplicationService } from '../analytics/ErrorAnalyticsApplicationService';
import { ErrorSummary } from '../../../domain/value-objects/analytics/ErrorSummary';
import { ErrorTrend } from '../../../domain/value-objects/analytics/ErrorTrend';
import { ErrorAnalyticsFilter } from '../../../domain/value-objects/analytics/ErrorAnalyticsFilter';
import { setupTestEnvironment, TestEnvironment } from '../../../__tests__/test-utils/TestSetupHelpers';
import type { SupabaseClient } from '@supabase/supabase-js';

// Mock the application service
vi.mock('../analytics/ErrorAnalyticsApplicationService');

describe('ErrorAnalyticsService', () => {
  let env: TestEnvironment;
  let service: ErrorAnalyticsService;
  let mockApplicationService: any;
  let mockSupabase: SupabaseClient;

  beforeEach(() => {
    env = setupTestEnvironment();
    
    // Create mock Supabase client
    mockSupabase = {} as SupabaseClient;
    
    // Create mock application service
    mockApplicationService = {
      getErrorSummary: vi.fn(),
      getErrorTrends: vi.fn(),
      getErrorsBySession: vi.fn(),
      getErrorsByUser: vi.fn()
    };

    // Mock the constructor
    (ErrorAnalyticsApplicationService as any).mockImplementation(() => mockApplicationService);

    service = new ErrorAnalyticsService(mockSupabase);
  });

  describe('Initialization', () => {
    it('should create application service with supabase client', () => {
      expect(ErrorAnalyticsApplicationService).toHaveBeenCalledWith(mockSupabase);
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
    it('should delegate to application service and convert to legacy format', async () => {
      const filter = {
        organizationId: 'org-123',
        timeRange: '24h' as const
      };

      const mockSummary = ErrorSummary.create({
        totalErrors: 42,
        errorsByCode: { 'ERR001': 10, 'ERR002': 32 },
        errorsBySeverity: { 'critical': 5, 'warning': 37 },
        errorsByCategory: { 'validation': 20, 'database': 22 },
        errorsByTable: { 'chat_sessions': 25, 'chat_messages': 17 },
        recentErrors: [
          {
            errorCode: 'ERR001',
            errorMessage: 'Validation failed',
            errorCategory: 'validation',
            severity: 'critical',
            createdAt: '2023-01-01T12:00:00Z',
            tableName: 'chat_sessions'
          }
        ]
      });

      mockApplicationService.getErrorSummary.mockResolvedValue(mockSummary);

      const result = await service.getErrorSummary(filter);

      expect(mockApplicationService.getErrorSummary).toHaveBeenCalledWith(filter);
      expect(result).toEqual({
        totalErrors: 42,
        errorsByCode: { 'ERR001': 10, 'ERR002': 32 },
        errorsBySeverity: { 'critical': 5, 'warning': 37 },
        errorsByCategory: { 'validation': 20, 'database': 22 },
        errorsByTable: { 'chat_sessions': 25, 'chat_messages': 17 },
        recentErrors: [
          {
            errorCode: 'ERR001',
            errorMessage: 'Validation failed',
            errorCategory: 'validation',
            severity: 'critical',
            createdAt: '2023-01-01T12:00:00Z',
            tableName: 'chat_sessions'
          }
        ]
      });
    });

    it('should handle empty error summary', async () => {
      const filter = {
        organizationId: 'org-123',
        timeRange: '1h' as const
      };

      const mockSummary = ErrorSummary.createEmpty();
      mockApplicationService.getErrorSummary.mockResolvedValue(mockSummary);

      const result = await service.getErrorSummary(filter);

      expect(result).toEqual({
        totalErrors: 0,
        errorsByCode: {},
        errorsBySeverity: {},
        errorsByCategory: {},
        errorsByTable: {},
        recentErrors: []
      });
    });

    it('should propagate errors from application service', async () => {
      const filter = {
        organizationId: 'org-123',
        timeRange: '24h' as const
      };

      const error = new Error('Database connection failed');
      mockApplicationService.getErrorSummary.mockRejectedValue(error);

      await expect(service.getErrorSummary(filter)).rejects.toThrow('Database connection failed');
    });

    it('should handle complex filter with all options', async () => {
      const complexFilter = {
        organizationId: 'org-123',
        timeRange: '7d' as const,
        severity: ['critical', 'warning'],
        category: ['validation', 'database'],
        errorCode: ['ERR001', 'ERR002'],
        sessionId: 'session-456'
      };

      const mockSummary = ErrorSummary.createEmpty();
      mockApplicationService.getErrorSummary.mockResolvedValue(mockSummary);

      await service.getErrorSummary(complexFilter);

      expect(mockApplicationService.getErrorSummary).toHaveBeenCalledWith(complexFilter);
    });
  });

  describe('getErrorTrends', () => {
    it('should delegate to application service and convert trends to legacy format', async () => {
      const filter = {
        organizationId: 'org-123',
        timeRange: '7d' as const
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
          severity: 'warning',
          category: 'database'
        })
      ];

      mockApplicationService.getErrorTrends.mockResolvedValue(mockTrends);

      const result = await service.getErrorTrends(filter);

      expect(mockApplicationService.getErrorTrends).toHaveBeenCalledWith(filter);
      expect(result).toEqual([
        {
          period: '2023-01-01T00:00:00Z',
          errorCount: 10,
          severity: 'critical',
          category: 'validation'
        },
        {
          period: '2023-01-02T00:00:00Z',
          errorCount: 15,
          severity: 'warning',
          category: 'database'
        }
      ]);
    });

    it('should handle empty trends array', async () => {
      const filter = {
        organizationId: 'org-123',
        timeRange: '1h' as const
      };

      mockApplicationService.getErrorTrends.mockResolvedValue([]);

      const result = await service.getErrorTrends(filter);

      expect(result).toEqual([]);
    });

    it('should propagate errors from application service', async () => {
      const filter = {
        organizationId: 'org-123',
        timeRange: '30d' as const
      };

      const error = new Error('Query timeout');
      mockApplicationService.getErrorTrends.mockRejectedValue(error);

      await expect(service.getErrorTrends(filter)).rejects.toThrow('Query timeout');
    });
  });

  describe('getErrorsBySession', () => {
    it('should delegate to application service with session filter', async () => {
      const sessionId = 'session-789';
      const organizationId = 'org-123';

      const mockSummary = ErrorSummary.create({
        totalErrors: 5,
        errorsByCode: { 'ERR001': 3, 'ERR002': 2 },
        errorsBySeverity: { 'warning': 5 },
        errorsByCategory: { 'validation': 5 },
        errorsByTable: { 'chat_messages': 5 },
        recentErrors: []
      });

      mockApplicationService.getErrorsBySession.mockResolvedValue(mockSummary);

      const result = await service.getErrorsBySession(sessionId, organizationId);

      expect(mockApplicationService.getErrorsBySession).toHaveBeenCalledWith(sessionId, organizationId);
      expect(result).toEqual({
        totalErrors: 5,
        errorsByCode: { 'ERR001': 3, 'ERR002': 2 },
        errorsBySeverity: { 'warning': 5 },
        errorsByCategory: { 'validation': 5 },
        errorsByTable: { 'chat_messages': 5 },
        recentErrors: []
      });
    });

    it('should handle session with no errors', async () => {
      const sessionId = 'session-clean';
      const organizationId = 'org-123';

      const mockSummary = ErrorSummary.createEmpty();
      mockApplicationService.getErrorsBySession.mockResolvedValue(mockSummary);

      const result = await service.getErrorsBySession(sessionId, organizationId);

      expect(result.totalErrors).toBe(0);
      expect(result.recentErrors).toEqual([]);
    });

    it('should enforce organization security', async () => {
      const sessionId = 'session-789';
      const organizationId = 'org-different';

      const mockSummary = ErrorSummary.createEmpty();
      mockApplicationService.getErrorsBySession.mockResolvedValue(mockSummary);

      await service.getErrorsBySession(sessionId, organizationId);

      expect(mockApplicationService.getErrorsBySession).toHaveBeenCalledWith(sessionId, organizationId);
    });

    it('should propagate errors from application service', async () => {
      const sessionId = 'session-789';
      const organizationId = 'org-123';

      const error = new Error('Session not found');
      mockApplicationService.getErrorsBySession.mockRejectedValue(error);

      await expect(service.getErrorsBySession(sessionId, organizationId)).rejects.toThrow('Session not found');
    });
  });

  describe('getErrorsByUser', () => {
    it('should delegate to application service with user filter', async () => {
      const userId = 'user-456';
      const organizationId = 'org-123';

      const mockSummary = ErrorSummary.create({
        totalErrors: 12,
        errorsByCode: { 'ERR001': 7, 'ERR003': 5 },
        errorsBySeverity: { 'critical': 2, 'warning': 10 },
        errorsByCategory: { 'authentication': 12 },
        errorsByTable: { 'profiles': 12 },
        recentErrors: [
          {
            errorCode: 'ERR001',
            errorMessage: 'Authentication failed',
            errorCategory: 'authentication',
            severity: 'critical',
            createdAt: '2023-01-01T15:30:00Z',
            tableName: 'profiles'
          }
        ]
      });

      mockApplicationService.getErrorsByUser.mockResolvedValue(mockSummary);

      const result = await service.getErrorsByUser(userId, organizationId);

      expect(mockApplicationService.getErrorsByUser).toHaveBeenCalledWith(userId, organizationId);
      expect(result).toEqual({
        totalErrors: 12,
        errorsByCode: { 'ERR001': 7, 'ERR003': 5 },
        errorsBySeverity: { 'critical': 2, 'warning': 10 },
        errorsByCategory: { 'authentication': 12 },
        errorsByTable: { 'profiles': 12 },
        recentErrors: [
          {
            errorCode: 'ERR001',
            errorMessage: 'Authentication failed',
            errorCategory: 'authentication',
            severity: 'critical',
            createdAt: '2023-01-01T15:30:00Z',
            tableName: 'profiles'
          }
        ]
      });
    });

    it('should handle user with no errors', async () => {
      const userId = 'user-clean';
      const organizationId = 'org-123';

      const mockSummary = ErrorSummary.createEmpty();
      mockApplicationService.getErrorsByUser.mockResolvedValue(mockSummary);

      const result = await service.getErrorsByUser(userId, organizationId);

      expect(result.totalErrors).toBe(0);
      expect(result.errorsByCode).toEqual({});
    });

    it('should enforce organization security for user queries', async () => {
      const userId = 'user-456';
      const organizationId = 'org-secure';

      const mockSummary = ErrorSummary.createEmpty();
      mockApplicationService.getErrorsByUser.mockResolvedValue(mockSummary);

      await service.getErrorsByUser(userId, organizationId);

      expect(mockApplicationService.getErrorsByUser).toHaveBeenCalledWith(userId, organizationId);
    });

    it('should propagate errors from application service', async () => {
      const userId = 'user-456';
      const organizationId = 'org-123';

      const error = new Error('User not found');
      mockApplicationService.getErrorsByUser.mockRejectedValue(error);

      await expect(service.getErrorsByUser(userId, organizationId)).rejects.toThrow('User not found');
    });
  });

  describe('Legacy Interface Compatibility', () => {
    it('should maintain ErrorSummary interface compatibility', async () => {
      const filter = {
        organizationId: 'org-123',
        timeRange: '24h' as const
      };

      const mockSummary = ErrorSummary.create({
        totalErrors: 1,
        errorsByCode: { 'ERR001': 1 },
        errorsBySeverity: { 'critical': 1 },
        errorsByCategory: { 'test': 1 },
        errorsByTable: { 'test_table': 1 },
        recentErrors: []
      });

      mockApplicationService.getErrorSummary.mockResolvedValue(mockSummary);

      const result = await service.getErrorSummary(filter);

      // Verify legacy interface structure
      expect(result).toHaveProperty('totalErrors');
      expect(result).toHaveProperty('errorsByCode');
      expect(result).toHaveProperty('errorsBySeverity');
      expect(result).toHaveProperty('errorsByCategory');
      expect(result).toHaveProperty('errorsByTable');
      expect(result).toHaveProperty('recentErrors');

      // Verify types match legacy interfaces
      expect(typeof result.totalErrors).toBe('number');
      expect(typeof result.errorsByCode).toBe('object');
      expect(Array.isArray(result.recentErrors)).toBe(true);
    });

    it('should maintain ErrorTrend interface compatibility', async () => {
      const filter = {
        organizationId: 'org-123',
        timeRange: '7d' as const
      };

      const mockTrends = [
        ErrorTrend.create({
          period: '2023-01-01T00:00:00Z',
          errorCount: 1,
          severity: 'critical',
          category: 'test'
        })
      ];

      mockApplicationService.getErrorTrends.mockResolvedValue(mockTrends);

      const result = await service.getErrorTrends(filter);

      // Verify legacy interface structure
      expect(Array.isArray(result)).toBe(true);
      expect(result[0]).toHaveProperty('period');
      expect(result[0]).toHaveProperty('errorCount');
      expect(result[0]).toHaveProperty('severity');
      expect(result[0]).toHaveProperty('category');

      // Verify types match legacy interfaces
      expect(typeof result[0].period).toBe('string');
      expect(typeof result[0].errorCount).toBe('number');
      expect(typeof result[0].severity).toBe('string');
      expect(typeof result[0].category).toBe('string');
    });

    it('should maintain ErrorAnalyticsFilter interface compatibility', async () => {
      // Test that the service accepts legacy filter format
      const legacyFilter = {
        organizationId: 'org-123',
        timeRange: '24h' as const,
        severity: ['critical'],
        category: ['validation'],
        errorCode: ['ERR001']
      };

      const mockSummary = ErrorSummary.createEmpty();
      mockApplicationService.getErrorSummary.mockResolvedValue(mockSummary);

      // Should not throw - filter is compatible
      await expect(service.getErrorSummary(legacyFilter)).resolves.toBeDefined();
    });
  });

  describe('Error Handling and Resilience', () => {
    it('should handle network timeouts gracefully', async () => {
      const filter = {
        organizationId: 'org-123',
        timeRange: '30d' as const
      };

      const timeoutError = new Error('Network timeout');
      timeoutError.name = 'TimeoutError';
      mockApplicationService.getErrorSummary.mockRejectedValue(timeoutError);

      await expect(service.getErrorSummary(filter)).rejects.toThrow('Network timeout');
    });

    it('should handle application service initialization errors', () => {
      // Mock constructor throwing error
      (ErrorAnalyticsApplicationService as any).mockImplementation(() => {
        throw new Error('Failed to initialize application service');
      });

      expect(() => new ErrorAnalyticsService(mockSupabase)).toThrow('Failed to initialize application service');
    });

    it('should handle malformed response from application service', async () => {
      const filter = {
        organizationId: 'org-123',
        timeRange: '24h' as const
      };

      // Mock returning invalid object without toData method
      mockApplicationService.getErrorSummary.mockResolvedValue({} as any);

      await expect(service.getErrorSummary(filter)).rejects.toThrow();
    });
  });

  describe('Performance and Resource Management', () => {
    it('should not cache results between calls', async () => {
      const filter = {
        organizationId: 'org-123',
        timeRange: '1h' as const
      };

      const mockSummary1 = ErrorSummary.create({ totalErrors: 5, errorsByCode: {}, errorsBySeverity: {}, errorsByCategory: {}, errorsByTable: {}, recentErrors: [] });
      const mockSummary2 = ErrorSummary.create({ totalErrors: 10, errorsByCode: {}, errorsBySeverity: {}, errorsByCategory: {}, errorsByTable: {}, recentErrors: [] });

      mockApplicationService.getErrorSummary
        .mockResolvedValueOnce(mockSummary1)
        .mockResolvedValueOnce(mockSummary2);

      const result1 = await service.getErrorSummary(filter);
      const result2 = await service.getErrorSummary(filter);

      expect(result1.totalErrors).toBe(5);
      expect(result2.totalErrors).toBe(10);
      expect(mockApplicationService.getErrorSummary).toHaveBeenCalledTimes(2);
    });

    it('should handle concurrent requests independently', async () => {
      const filter1 = { organizationId: 'org-123', timeRange: '1h' as const };
      const filter2 = { organizationId: 'org-456', timeRange: '24h' as const };

      const mockSummary1 = ErrorSummary.createEmpty();
      const mockSummary2 = ErrorSummary.create({ totalErrors: 3, errorsByCode: {}, errorsBySeverity: {}, errorsByCategory: {}, errorsByTable: {}, recentErrors: [] });

      mockApplicationService.getErrorSummary
        .mockImplementation(async (filter: any) => {
          if (filter.organizationId === 'org-123') return mockSummary1;
          if (filter.organizationId === 'org-456') return mockSummary2;
          throw new Error('Unexpected filter');
        });

      const [result1, result2] = await Promise.all([
        service.getErrorSummary(filter1),
        service.getErrorSummary(filter2)
      ]);

      expect(result1.totalErrors).toBe(0);
      expect(result2.totalErrors).toBe(3);
    });
  });
});