/**
 * ContextInjectionApplicationService Tests (Simplified)
 * 
 * Tests focus on public API behavior rather than internal implementation details.
 * Validation and helper functions are now private methods.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ContextInjectionApplicationService } from '../ContextInjectionApplicationService';
import { 
  ContextEffectivenessDomainService 
} from '../../../domain/services/context-injection/ContextEffectivenessDomainService';
import { 
  ContextRecommendationDomainService 
} from '../../../domain/services/context-injection/ContextRecommendationDomainService';
import { ChatSession } from '../../../domain/entities/ChatSession';
import { ChatbotConfig } from '../../../domain/entities/ChatbotConfig';
import { ChatMessage } from '../../../domain/entities/ChatMessage';
import { BusinessRuleViolationError, DataValidationError } from '../../../domain/errors/ChatbotWidgetDomainErrors';
import { ContextInjectionResult } from '../../types/ContextInjectionApplicationTypes';

// Mock domain services with static methods
vi.mock('../../../domain/services/context-injection/ContextEffectivenessDomainService');
vi.mock('../../../domain/services/context-injection/ContextRecommendationDomainService');

// Mock static domain service methods
vi.mock('../../../domain/services/context-injection/ContextModuleGeneratorDomainService', () => ({
  ContextModuleGeneratorDomainService: {
    generateCandidateModules: vi.fn().mockReturnValue([])
  }
}));

vi.mock('../../../domain/services/context-injection/ContextModulePriorityDomainService', () => ({
  ContextModulePriorityDomainService: {
    calculateRelevanceFactors: vi.fn().mockReturnValue({
      userProfileRelevance: 0.8,
      companyContextRelevance: 0.7,
      phaseRelevance: 0.9,
      knowledgeBaseRelevance: 0.6,
      industryRelevance: 0.5,
      historyRelevance: 0.4,
      businessHoursRelevance: 0.3,
      engagementRelevance: 0.7
    }),
    applySessionMultipliers: vi.fn().mockReturnValue([]),
    determineConversationPhase: vi.fn().mockReturnValue({
      phase: 'discovery',
      confidence: 0.8,
      indicators: ['initial interaction']
    })
  }
}));

vi.mock('../../../domain/services/context-injection/ContextTokenBudgetDomainService', () => ({
  ContextTokenBudgetDomainService: {
    selectModulesWithinBudget: vi.fn().mockReturnValue({
      selectedModules: [],
      allocation: { 
        corePersona: 100,
        highPriorityContext: 200,
        progressionModules: 100,
        realTimeContext: 100,
        totalUsed: 500, 
        totalAvailable: 1000 
      }
    }),
    validateTokenBudget: vi.fn().mockReturnValue({
      recommendations: []
    }),
    getRecommendedTokenBudget: vi.fn().mockReturnValue({
      recommended: 1000,
      minimum: 500,
      maximum: 2000,
      reasoning: ['Test reasoning']
    })
  }
}));

describe('ContextInjectionApplicationService', () => {
  let service: ContextInjectionApplicationService;
  let mockEffectivenessService: ContextEffectivenessDomainService;
  let mockRecommendationService: ContextRecommendationDomainService;
  let mockSession: ChatSession;
  let mockConfig: ChatbotConfig;
  let mockConversationHistory: ChatMessage[];

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();

    // Create mock services
    mockEffectivenessService = new ContextEffectivenessDomainService();
    mockRecommendationService = new ContextRecommendationDomainService();
    
    // Setup default mock behaviors
    vi.mocked(mockRecommendationService.generateRecommendations).mockReturnValue([]);
    vi.mocked(mockRecommendationService.calculateAdjustmentFactors).mockReturnValue([]);
    
    // Setup effectiveness service mocks
    vi.mocked(mockEffectivenessService.calculateEffectivenessScore).mockReturnValue(85);
    vi.mocked(mockEffectivenessService.identifyStrengths).mockReturnValue(['Test strength']);
    vi.mocked(mockEffectivenessService.identifyWeaknesses).mockReturnValue(['Test weakness']);
    vi.mocked(mockEffectivenessService.generateOptimizationSuggestions).mockReturnValue(['Test suggestion']);

    // Create service instance
    service = new ContextInjectionApplicationService(
      mockEffectivenessService,
      mockRecommendationService
    );

    // Create mock data  
    mockSession = {
      id: 'session-123',
      organizationId: 'org-456',
      chatbotConfigId: 'config-789',
      status: 'active'
    } as unknown as ChatSession;

    mockConfig = {
      id: 'config-789',
      organizationId: 'org-456',
      operatingHours: {}
    } as ChatbotConfig;

    mockConversationHistory = [];
  });

  describe('Input Validation', () => {
    it('should throw DataValidationError for null session', async () => {
      await expect(
        service.selectOptimalContext(
          null as any,
          mockConfig,
          1000
        )
      ).rejects.toThrow(DataValidationError);
    });

    it('should throw DataValidationError for null chatbotConfig', async () => {
      await expect(
        service.selectOptimalContext(
          mockSession,
          null as any,
          1000
        )
      ).rejects.toThrow(DataValidationError);
    });

    it('should throw BusinessRuleViolationError for zero tokens', async () => {
      await expect(
        service.selectOptimalContext(
          mockSession,
          mockConfig,
          0
        )
      ).rejects.toThrow(BusinessRuleViolationError);
    });

    it('should throw BusinessRuleViolationError for excessive tokens', async () => {
      await expect(
        service.selectOptimalContext(
          mockSession,
          mockConfig,
          15000
        )
      ).rejects.toThrow(BusinessRuleViolationError);
    });
  });

  describe('Use Case Validation', () => {
    it('should throw DataValidationError for invalid use case', async () => {
      await expect(
        service.optimizeForUseCase(
          mockSession,
          mockConfig,
          'invalid' as any,
          1000
        )
      ).rejects.toThrow(DataValidationError);
    });

    it('should accept valid use cases', async () => {
      const validUseCases = ['greeting', 'qualification', 'demonstration', 'closing'];
      
      for (const useCase of validUseCases) {
        // Should not throw for valid use cases
        await expect(
          service.optimizeForUseCase(
            mockSession,
            mockConfig,
            useCase as any,
            1000
          )
        ).resolves.toBeDefined();
      }
    });
  });

  describe('Token Budget Validation', () => {
    it('should validate criteria for token budget recommendations', async () => {
      await expect(
        service.getRecommendedTokenBudget(null as any)
      ).rejects.toThrow(DataValidationError);
    });
  });

  describe('Analysis Input Validation', () => {
    it('should validate inputs for effectiveness analysis', async () => {
      const mockCriteria = {
        availableTokens: 1000,
        messageCount: 5
      };

      await expect(
        service.analyzeContextEffectiveness(null as any, mockCriteria)
      ).rejects.toThrow(DataValidationError);

      const mockResult: ContextInjectionResult = {
        selectedModules: [],
        allocation: { 
          corePersona: 100,
          highPriorityContext: 200,
          progressionModules: 100,
          realTimeContext: 100,
          totalUsed: 500, 
          totalAvailable: 1000 
        },
        relevanceFactors: {
          userProfileRelevance: 0.8,
          companyContextRelevance: 0.7,
          phaseRelevance: 0.9,
          knowledgeBaseRelevance: 0.6,
          industryRelevance: 0.5,
          historyRelevance: 0.4,
          businessHoursRelevance: 0.3,
          engagementRelevance: 0.7
        },
        conversationPhase: {
          phase: 'discovery',
          confidence: 0.8,
          indicators: ['initial interaction']
        },
        recommendations: []
      };

      await expect(
        service.analyzeContextEffectiveness(mockResult, null as any)
      ).rejects.toThrow(DataValidationError);
    });
  });

  describe('Service Integration', () => {
    it('should construct without errors', () => {
      expect(service).toBeDefined();
      expect(service).toBeInstanceOf(ContextInjectionApplicationService);
    });

    it('should have all required public methods', () => {
      expect(typeof service.selectOptimalContext).toBe('function');
      expect(typeof service.getRecommendedTokenBudget).toBe('function');
      expect(typeof service.optimizeForUseCase).toBe('function');
      expect(typeof service.analyzeContextEffectiveness).toBe('function');
    });
  });
});