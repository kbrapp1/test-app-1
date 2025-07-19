/**
 * KnowledgeManagementService Tests
 * 
 * Tests for the legacy adapter that maintains backward compatibility
 * while delegating to DDD-structured knowledge management services.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { KnowledgeManagementService, KnowledgeStatsResult, HealthCheckResult } from '../KnowledgeManagementService';
import { KnowledgeItem, KnowledgeRetrievalContext } from '../interfaces/IKnowledgeRetrievalService';
import { IVectorKnowledgeRepository } from '../../repositories/IVectorKnowledgeRepository';
import { ChatbotWidgetCompositionRoot } from '../../../infrastructure/composition/ChatbotWidgetCompositionRoot';
import { KnowledgeManagementApplicationService } from '../../../application/services/knowledge/KnowledgeManagementApplicationService';

// Mock the composition root and application service
vi.mock('../../../infrastructure/composition/ChatbotWidgetCompositionRoot');
vi.mock('../../../application/services/knowledge/KnowledgeManagementApplicationService');

describe('KnowledgeManagementService', () => {
  let service: KnowledgeManagementService;
  let mockVectorRepository: IVectorKnowledgeRepository;
  let mockApplicationService: any;
  let mockLoggingService: any;

  const organizationId = 'org-123';
  const chatbotConfigId = 'config-456';

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock vector repository
    mockVectorRepository = {
      search: vi.fn(),
      save: vi.fn(),
      delete: vi.fn(),
      getStats: vi.fn()
    } as any;

    // Mock logging service
    mockLoggingService = {
      log: vi.fn(),
      logError: vi.fn()
    };

    // Mock composition root
    (ChatbotWidgetCompositionRoot.getLoggingService as any) = vi.fn().mockReturnValue(mockLoggingService);

    // Mock application service
    mockApplicationService = {
      getKnowledgeByCategory: vi.fn(),
      getKnowledgeByTags: vi.fn(),
      getKnowledgeStats: vi.fn(),
      deleteKnowledgeBySource: vi.fn(),
      checkHealthStatus: vi.fn()
    };

    // Mock the constructor
    (KnowledgeManagementApplicationService as any).mockImplementation(() => mockApplicationService);

    // Initialize service
    service = new KnowledgeManagementService(
      mockVectorRepository,
      organizationId,
      chatbotConfigId
    );
  });

  describe('Service Initialization', () => {
    it('should initialize with vector repository and configuration', () => {
      expect(service).toBeDefined();
      expect(KnowledgeManagementApplicationService).toHaveBeenCalledWith(
        mockVectorRepository,
        organizationId,
        chatbotConfigId,
        mockLoggingService
      );
    });

    it('should obtain logging service from composition root', () => {
      expect(ChatbotWidgetCompositionRoot.getLoggingService).toHaveBeenCalled();
    });

    it('should have all required public methods', () => {
      expect(typeof service.getKnowledgeByCategory).toBe('function');
      expect(typeof service.getKnowledgeByTags).toBe('function');
      expect(typeof service.getKnowledgeStats).toBe('function');
      expect(typeof service.deleteKnowledgeBySource).toBe('function');
      expect(typeof service.checkHealthStatus).toBe('function');
    });
  });

  describe('getKnowledgeByCategory', () => {
    it('should delegate to application service and return knowledge items', async () => {
      const category = 'product_info';
      const context: KnowledgeRetrievalContext = {
        userQuery: 'product features',
        maxResults: 10
      };
      const sharedLogFile = 'test.log';

      const mockKnowledgeItems: KnowledgeItem[] = [
        {
          id: 'item-1',
          title: 'Product Feature A',
          content: 'Product feature A',
          category: 'product_info',
          tags: ['feature'],
          source: 'documentation',
          relevanceScore: 0.9,
          lastUpdated: new Date('2023-01-01')
        },
        {
          id: 'item-2',
          title: 'Product Feature B',
          content: 'Product feature B',
          category: 'product_info',
          tags: ['feature'],
          source: 'faq',
          relevanceScore: 0.8,
          lastUpdated: new Date('2023-01-01')
        }
      ];

      mockApplicationService.getKnowledgeByCategory.mockResolvedValue(mockKnowledgeItems);

      const result = await service.getKnowledgeByCategory(category, context, sharedLogFile);

      expect(mockApplicationService.getKnowledgeByCategory).toHaveBeenCalledWith(
        category,
        context,
        sharedLogFile
      );
      expect(result).toEqual(mockKnowledgeItems);
    });

    it('should handle category queries without context', async () => {
      const category = 'pricing';
      const mockKnowledgeItems: KnowledgeItem[] = [];

      mockApplicationService.getKnowledgeByCategory.mockResolvedValue(mockKnowledgeItems);

      const result = await service.getKnowledgeByCategory(category);

      expect(mockApplicationService.getKnowledgeByCategory).toHaveBeenCalledWith(
        category,
        undefined,
        undefined
      );
      expect(result).toEqual([]);
    });

    it('should handle empty category results', async () => {
      const category = 'non_existent_category';
      
      mockApplicationService.getKnowledgeByCategory.mockResolvedValue([]);

      const result = await service.getKnowledgeByCategory(category);

      expect(result).toEqual([]);
    });

    it('should propagate errors from application service', async () => {
      const category = 'failing_category';
      const error = new Error('Knowledge retrieval failed');

      mockApplicationService.getKnowledgeByCategory.mockRejectedValue(error);

      await expect(service.getKnowledgeByCategory(category)).rejects.toThrow(
        'Knowledge retrieval failed'
      );
    });
  });

  describe('getKnowledgeByTags', () => {
    it('should delegate to application service with tag filtering', async () => {
      const tags = ['feature', 'pricing', 'enterprise'];
      const context: KnowledgeRetrievalContext = {
        userQuery: 'enterprise features pricing',
        maxResults: 5
      };
      const sharedLogFile = 'tag-search.log';

      const mockKnowledgeItems: KnowledgeItem[] = [
        {
          id: 'item-3',
          title: 'Enterprise Pricing',
          content: 'Enterprise pricing information',
          category: 'pricing',
          source: 'pricing_guide',
          relevanceScore: 0.95,
          tags: ['pricing', 'enterprise'],
          lastUpdated: new Date('2023-01-01')
        }
      ];

      mockApplicationService.getKnowledgeByTags.mockResolvedValue(mockKnowledgeItems);

      const result = await service.getKnowledgeByTags(tags, context, sharedLogFile);

      expect(mockApplicationService.getKnowledgeByTags).toHaveBeenCalledWith(
        tags,
        context,
        sharedLogFile
      );
      expect(result).toEqual(mockKnowledgeItems);
    });

    it('should handle single tag queries', async () => {
      const tags = ['support'];
      const mockKnowledgeItems: KnowledgeItem[] = [
        {
          id: 'item-4',
          title: 'Support Contact',
          content: 'Support contact information',
          category: 'support',
          tags: ['support', 'contact'],
          source: 'support_docs',
          relevanceScore: 0.7,
          lastUpdated: new Date('2023-01-01')
        }
      ];

      mockApplicationService.getKnowledgeByTags.mockResolvedValue(mockKnowledgeItems);

      const result = await service.getKnowledgeByTags(tags);

      expect(result).toEqual(mockKnowledgeItems);
    });

    it('should handle empty tag arrays', async () => {
      const tags: string[] = [];

      mockApplicationService.getKnowledgeByTags.mockResolvedValue([]);

      const result = await service.getKnowledgeByTags(tags);

      expect(mockApplicationService.getKnowledgeByTags).toHaveBeenCalledWith(tags, undefined, undefined);
      expect(result).toEqual([]);
    });

    it('should handle tag queries with no matches', async () => {
      const tags = ['nonexistent_tag'];

      mockApplicationService.getKnowledgeByTags.mockResolvedValue([]);

      const result = await service.getKnowledgeByTags(tags);

      expect(result).toEqual([]);
    });
  });

  describe('getKnowledgeStats', () => {
    it('should delegate to application service and convert to legacy format', async () => {
      const sharedLogFile = 'stats.log';
      const mockStatsResult = {
        toData: vi.fn().mockReturnValue({
          totalItems: 150,
          itemsBySourceType: {
            documentation: 80,
            faq: 45,
            support_tickets: 25
          },
          itemsByCategory: {
            product_info: 60,
            support: 50,
            pricing: 40
          },
          lastUpdated: new Date('2023-01-01T12:00:00Z'),
          storageSize: 1024000,
          organizationId: 'org-123',
          chatbotConfigId: 'config-456'
        })
      };

      mockApplicationService.getKnowledgeStats.mockResolvedValue(mockStatsResult);

      const result = await service.getKnowledgeStats(sharedLogFile);

      expect(mockApplicationService.getKnowledgeStats).toHaveBeenCalledWith(sharedLogFile);
      expect(mockStatsResult.toData).toHaveBeenCalled();
      expect(result).toEqual({
        totalItems: 150,
        itemsBySourceType: {
          documentation: 80,
          faq: 45,
          support_tickets: 25
        },
        itemsByCategory: {
          product_info: 60,
          support: 50,
          pricing: 40
        },
        lastUpdated: new Date('2023-01-01T12:00:00Z'),
        storageSize: 1024000,
        organizationId: 'org-123',
        chatbotConfigId: 'config-456'
      });
    });

    it('should handle stats queries without log file', async () => {
      const mockStatsResult = {
        toData: vi.fn().mockReturnValue({
          totalItems: 0,
          itemsBySourceType: {},
          itemsByCategory: {},
          lastUpdated: null,
          storageSize: 0,
          organizationId: 'org-123',
          chatbotConfigId: 'config-456'
        })
      };

      mockApplicationService.getKnowledgeStats.mockResolvedValue(mockStatsResult);

      const result = await service.getKnowledgeStats();

      expect(mockApplicationService.getKnowledgeStats).toHaveBeenCalledWith(undefined);
      expect(result.totalItems).toBe(0);
    });

    it('should propagate stats errors', async () => {
      const error = new Error('Stats calculation failed');

      mockApplicationService.getKnowledgeStats.mockRejectedValue(error);

      await expect(service.getKnowledgeStats()).rejects.toThrow('Stats calculation failed');
    });
  });

  describe('deleteKnowledgeBySource', () => {
    it('should delegate to application service for source deletion', async () => {
      const sourceType = 'documentation';
      const sourceUrl = 'https://docs.example.com/api';
      const sharedLogFile = 'deletion.log';
      const deletedCount = 25;

      mockApplicationService.deleteKnowledgeBySource.mockResolvedValue(deletedCount);

      const result = await service.deleteKnowledgeBySource(sourceType, sourceUrl, sharedLogFile);

      expect(mockApplicationService.deleteKnowledgeBySource).toHaveBeenCalledWith(
        sourceType,
        sourceUrl,
        sharedLogFile
      );
      expect(result).toBe(deletedCount);
    });

    it('should handle source deletion without URL', async () => {
      const sourceType = 'faq';
      const deletedCount = 10;

      mockApplicationService.deleteKnowledgeBySource.mockResolvedValue(deletedCount);

      const result = await service.deleteKnowledgeBySource(sourceType);

      expect(mockApplicationService.deleteKnowledgeBySource).toHaveBeenCalledWith(
        sourceType,
        undefined,
        undefined
      );
      expect(result).toBe(deletedCount);
    });

    it('should handle zero deletions', async () => {
      const sourceType = 'nonexistent_source';

      mockApplicationService.deleteKnowledgeBySource.mockResolvedValue(0);

      const result = await service.deleteKnowledgeBySource(sourceType);

      expect(result).toBe(0);
    });

    it('should propagate deletion errors', async () => {
      const sourceType = 'protected_source';
      const error = new Error('Deletion not permitted');

      mockApplicationService.deleteKnowledgeBySource.mockRejectedValue(error);

      await expect(service.deleteKnowledgeBySource(sourceType)).rejects.toThrow(
        'Deletion not permitted'
      );
    });
  });

  describe('checkHealthStatus', () => {
    it('should delegate to application service and convert health result', async () => {
      const sharedLogFile = 'health.log';
      const mockHealthResult = {
        toData: vi.fn().mockReturnValue({
          status: 'healthy',
          responseTimeMs: 150,
          totalItems: 150,
          lastUpdated: new Date('2023-01-01T10:00:00Z'),
          organizationId: 'org-123',
          chatbotConfigId: 'config-456',
          timestamp: new Date('2023-01-01T10:00:00Z')
        })
      };

      mockApplicationService.checkHealthStatus.mockResolvedValue(mockHealthResult);

      const result = await service.checkHealthStatus(sharedLogFile);

      expect(mockApplicationService.checkHealthStatus).toHaveBeenCalledWith(sharedLogFile);
      expect(mockHealthResult.toData).toHaveBeenCalled();
      expect(result).toEqual({
        status: 'healthy',
        responseTimeMs: 150,
        totalItems: 150,
        lastUpdated: new Date('2023-01-01T10:00:00Z'),
        organizationId: 'org-123',
        chatbotConfigId: 'config-456',
        timestamp: new Date('2023-01-01T10:00:00Z')
      });
    });

    it('should handle unhealthy status', async () => {
      const mockHealthResult = {
        toData: vi.fn().mockReturnValue({
          status: 'unhealthy',
          responseTimeMs: 0,
          totalItems: 0,
          lastUpdated: null,
          organizationId: 'org-123',
          chatbotConfigId: 'config-456',
          timestamp: new Date('2023-01-01T10:00:00Z'),
          error: 'Connection timeout'
        })
      };

      mockApplicationService.checkHealthStatus.mockResolvedValue(mockHealthResult);

      const result = await service.checkHealthStatus();

      expect(result.status).toBe('unhealthy');
      expect(result.responseTimeMs).toBe(0);
      expect(result.error).toBe('Connection timeout');
    });

    it('should propagate health check errors', async () => {
      const error = new Error('Health check system failure');

      mockApplicationService.checkHealthStatus.mockRejectedValue(error);

      await expect(service.checkHealthStatus()).rejects.toThrow('Health check system failure');
    });
  });

  describe('Legacy Interface Compatibility', () => {
    it('should maintain KnowledgeStatsResult interface compatibility', async () => {
      const mockStatsResult = {
        toData: vi.fn().mockReturnValue({
          totalItems: 100,
          itemsBySourceType: { faq: 50, docs: 50 },
          itemsByCategory: { support: 60, pricing: 40 },
          lastUpdated: new Date('2023-01-01T12:00:00Z'),
          storageSize: 2048,
          organizationId: 'org-123',
          chatbotConfigId: 'config-456'
        })
      };

      mockApplicationService.getKnowledgeStats.mockResolvedValue(mockStatsResult);

      const result = await service.getKnowledgeStats();

      // Verify legacy interface structure
      expect(result).toHaveProperty('totalItems');
      expect(result).toHaveProperty('itemsBySourceType');
      expect(result).toHaveProperty('itemsByCategory');
      expect(result).toHaveProperty('lastUpdated');
      expect(result).toHaveProperty('storageSize');

      // Verify types
      expect(typeof result.totalItems).toBe('number');
      expect(typeof result.itemsBySourceType).toBe('object');
      expect(typeof result.itemsByCategory).toBe('object');
      expect(typeof result.storageSize).toBe('number');
    });

    it('should maintain HealthCheckResult interface compatibility', async () => {
      const mockHealthResult = {
        toData: vi.fn().mockReturnValue({
          status: 'healthy',
          responseTimeMs: 150,
          totalItems: 150,
          lastUpdated: new Date('2023-01-01T10:00:00Z'),
          organizationId: 'org-123',
          chatbotConfigId: 'config-456',
          timestamp: new Date('2023-01-01T10:00:00Z')
        })
      };

      mockApplicationService.checkHealthStatus.mockResolvedValue(mockHealthResult);

      const result = await service.checkHealthStatus();

      // Verify legacy interface structure
      expect(result).toHaveProperty('status');
      expect(result).toHaveProperty('responseTimeMs');
      expect(result).toHaveProperty('totalItems');
      expect(result).toHaveProperty('lastUpdated');
      expect(result).toHaveProperty('organizationId');
      expect(result).toHaveProperty('chatbotConfigId');

      // Verify types
      expect(typeof result.status).toBe('string');
      expect(typeof result.responseTimeMs).toBe('number');
      expect(typeof result.totalItems).toBe('number');
      expect(typeof result.organizationId).toBe('string');
      expect(typeof result.chatbotConfigId).toBe('string');
    });

    it('should preserve organization and config context', () => {
      // Verify that organization and config context is properly passed to application service
      expect(KnowledgeManagementApplicationService).toHaveBeenCalledWith(
        mockVectorRepository,
        organizationId,
        chatbotConfigId,
        mockLoggingService
      );

      // The service should maintain these values for all operations
      expect(service).toBeDefined();
    });
  });

  describe('Error Handling and Resilience', () => {
    it('should handle null repository gracefully during initialization', () => {
      expect(() => {
        new KnowledgeManagementService(
          null as any,
          organizationId,
          chatbotConfigId
        );
      }).not.toThrow(TypeError);
    });

    it('should handle concurrent knowledge operations independently', async () => {
      const category1 = 'category1';
      const category2 = 'category2';

      mockApplicationService.getKnowledgeByCategory
        .mockResolvedValueOnce([{ id: '1', content: 'Content 1' }])
        .mockResolvedValueOnce([{ id: '2', content: 'Content 2' }]);

      const [result1, result2] = await Promise.all([
        service.getKnowledgeByCategory(category1),
        service.getKnowledgeByCategory(category2)
      ]);

      expect(result1[0].id).toBe('1');
      expect(result2[0].id).toBe('2');
    });

    it('should handle application service failures without data corruption', async () => {
      const category = 'test_category';

      // First call succeeds
      mockApplicationService.getKnowledgeByCategory.mockResolvedValueOnce([
        { id: '1', content: 'Success' }
      ]);

      // Second call fails
      mockApplicationService.getKnowledgeByCategory.mockRejectedValueOnce(
        new Error('Service failure')
      );

      const result1 = await service.getKnowledgeByCategory(category);
      expect(result1).toHaveLength(1);

      await expect(service.getKnowledgeByCategory(category)).rejects.toThrow('Service failure');

      // Third call should work independently
      mockApplicationService.getKnowledgeByCategory.mockResolvedValueOnce([
        { id: '2', content: 'Recovery' }
      ]);

      const result3 = await service.getKnowledgeByCategory(category);
      expect(result3[0].id).toBe('2');
    });
  });
});