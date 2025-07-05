/**
 * VectorStatisticsService Tests
 * 
 * AI INSTRUCTIONS:
 * - Test the orchestration logic of the refactored service
 * - Verify proper delegation to specialized services
 * - Test error handling and context propagation
 * - Ensure service composition works correctly
 * - Validate interface contracts and data flow
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { VectorStatisticsService } from '../VectorStatisticsService';
import { SupabaseClient } from '@supabase/supabase-js';
import { VectorQueryContext } from '../../types/VectorRepositoryTypes';
import { BusinessRuleViolationError } from '../../../domain/errors/ChatbotWidgetDomainErrors';

// Mock the specialized services
vi.mock('../VectorStatisticsQueryService');
vi.mock('../VectorMetricsCalculatorService');
vi.mock('../VectorStorageAnalyticsService');

describe('VectorStatisticsService', () => {
  let service: VectorStatisticsService;
  let mockSupabase: SupabaseClient;
  let mockContext: VectorQueryContext;

  beforeEach(() => {
    mockSupabase = {} as SupabaseClient;
    mockContext = {
      organizationId: 'org-123',
      chatbotConfigId: 'config-456'
    };
    service = new VectorStatisticsService(mockSupabase);
  });

  describe('getKnowledgeItemStats', () => {
    it('should orchestrate data collection and calculation correctly', async () => {
      // Mock query service response
      const mockRawData = [
        { source_type: 'website', category: 'faq', updated_at: '2024-01-01' }
      ];

      // Mock calculated stats
      const mockStats = {
        totalItems: 1,
        itemsBySourceType: { website: 1 },
        itemsByCategory: { faq: 1 },
        lastUpdated: new Date('2024-01-01')
      };

      // Set up mocks
      service['queryService'].getBasicStatisticsData = vi.fn().mockResolvedValue(mockRawData);
      service['metricsCalculator'].calculateBasicStatistics = vi.fn().mockReturnValue(mockStats);
      service['queryService'].getStorageSize = vi.fn().mockResolvedValue(1024);

      const result = await service.getKnowledgeItemStats(mockContext);

      expect(result).toEqual({
        totalItems: 1,
        itemsBySourceType: { website: 1 },
        itemsByCategory: { faq: 1 },
        lastUpdated: new Date('2024-01-01'),
        storageSize: 1024
      });

      expect(service['queryService'].getBasicStatisticsData).toHaveBeenCalledWith(mockContext);
      expect(service['metricsCalculator'].calculateBasicStatistics).toHaveBeenCalledWith(mockRawData);
      expect(service['queryService'].getStorageSize).toHaveBeenCalledWith(mockContext);
    });

    it('should handle errors and wrap them in BusinessRuleViolationError', async () => {
      service['queryService'].getBasicStatisticsData = vi.fn().mockRejectedValue(new Error('Database error'));

      await expect(service.getKnowledgeItemStats(mockContext))
        .rejects.toThrow(BusinessRuleViolationError);
    });
  });

  describe('getStorageOptimizationMetrics', () => {
    it('should delegate to query service and storage analytics', async () => {
      const mockRawData = [
        { vector: [], content_hash: 'hash1', created_at: '2024-01-01', updated_at: '2024-01-01' }
      ];

      const mockMetrics = {
        averageVectorSize: 1536,
        totalVectorCount: 1,
        duplicateContentCount: 0,
        unusedVectorCount: 0,
        storageEfficiency: 100,
        recommendations: []
      };

      service['queryService'].getOptimizationData = vi.fn().mockResolvedValue(mockRawData);
      service['storageAnalytics'].calculateOptimizationMetrics = vi.fn().mockReturnValue(mockMetrics);

      const result = await service.getStorageOptimizationMetrics(mockContext);

      expect(result).toEqual(mockMetrics);
      expect(service['queryService'].getOptimizationData).toHaveBeenCalledWith(mockContext);
      expect(service['storageAnalytics'].calculateOptimizationMetrics).toHaveBeenCalledWith(mockRawData);
    });
  });

  describe('getKnowledgeBaseHealthMetrics', () => {
    it('should delegate to query service and metrics calculator', async () => {
      const mockRawData = [
        { updated_at: '2024-01-01', created_at: '2024-01-01', category: 'faq', source_type: 'website' }
      ];

      const mockHealthMetrics = {
        healthScore: 85,
        staleContentCount: 0,
        recentUpdatesCount: 1,
        contentFreshness: 'excellent' as const,
        maintenanceNeeded: false,
        recommendations: []
      };

      service['queryService'].getHealthMetricsData = vi.fn().mockResolvedValue(mockRawData);
      service['metricsCalculator'].calculateHealthMetrics = vi.fn().mockReturnValue(mockHealthMetrics);

      const result = await service.getKnowledgeBaseHealthMetrics(mockContext);

      expect(result).toEqual(mockHealthMetrics);
      expect(service['queryService'].getHealthMetricsData).toHaveBeenCalledWith(mockContext);
      expect(service['metricsCalculator'].calculateHealthMetrics).toHaveBeenCalledWith(mockRawData);
    });
  });

  describe('getUsageAnalytics', () => {
    it('should delegate to query service and metrics calculator', async () => {
      const mockRawData = [
        { knowledge_item_id: 'item1', title: 'FAQ 1', category: 'faq', updated_at: '2024-01-01' }
      ];

      const mockAnalytics = {
        mostAccessedCategories: [{ category: 'faq', accessCount: 1 }],
        leastUsedContent: [{ id: 'item1', title: 'FAQ 1', lastAccessed: new Date('2024-01-01') }],
        contentUtilization: 75,
        popularityTrends: []
      };

      service['queryService'].getUsageAnalyticsData = vi.fn().mockResolvedValue(mockRawData);
      service['metricsCalculator'].calculateUsageAnalytics = vi.fn().mockReturnValue(mockAnalytics);

      const result = await service.getUsageAnalytics(mockContext);

      expect(result).toEqual(mockAnalytics);
      expect(service['queryService'].getUsageAnalyticsData).toHaveBeenCalledWith(mockContext);
      expect(service['metricsCalculator'].calculateUsageAnalytics).toHaveBeenCalledWith(mockRawData);
    });
  });
});