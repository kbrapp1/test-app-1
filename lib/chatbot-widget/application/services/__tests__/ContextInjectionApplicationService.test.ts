/**
 * ContextInjectionApplicationService Tests
 * 
 * Comprehensive tests for the context injection orchestration service.
 * Tests orchestration, domain service coordination, and business workflows.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ContextInjectionApplicationService } from '../ContextInjectionApplicationService';
import { buildSelectionCriteria, getUseCaseOptions, adjustTokensForUseCase } from '../ContextInjectionHelpers';
import { validateInputs, validateCriteria, validateUseCase, validateAnalysisInputs } from '../ContextInjectionValidation';
import { ContextEffectivenessDomainService } from '../../../domain/services/context-injection/ContextEffectivenessDomainService';
import { ContextRecommendationDomainService } from '../../../domain/services/context-injection/ContextRecommendationDomainService';
import { ContextModuleGeneratorDomainService } from '../../../domain/services/context-injection/ContextModuleGeneratorDomainService';
import { ContextModulePriorityDomainService } from '../../../domain/services/context-injection/ContextModulePriorityDomainService';
import { ContextTokenBudgetDomainService } from '../../../domain/services/context-injection/ContextTokenBudgetDomainService';
import { ChatSession } from '../../../domain/entities/ChatSession';
import { ChatbotConfig } from '../../../domain/entities/ChatbotConfig';
import { ChatMessage } from '../../../domain/entities/ChatMessage';
import { 
  ContextModule, 
  ContextModuleType,
  ContextSelectionCriteria,
  EntityData,
  TokenBudgetAllocation,
  ContextRelevanceFactors
} from '../../../domain/services/interfaces/ContextInjectionTypes';

// Define conversation phase enum for testing
enum ConversationPhase {
  GREETING = 'greeting',
  QUALIFICATION = 'qualification', 
  DEMONSTRATION = 'demonstration',
  CLOSING = 'closing'
}

// Mock helper functions
vi.mock('../ContextInjectionHelpers', () => ({
  buildSelectionCriteria: vi.fn(),
  getUseCaseOptions: vi.fn(),
  adjustTokensForUseCase: vi.fn()
}));

// Mock validation functions
vi.mock('../ContextInjectionValidation', () => ({
  validateInputs: vi.fn(),
  validateCriteria: vi.fn(),
  validateUseCase: vi.fn(),
  validateAnalysisInputs: vi.fn()
}));

// Mock domain services
vi.mock('../../../domain/services/context-injection/ContextModuleGeneratorDomainService', () => ({
  ContextModuleGeneratorDomainService: {
    generateCandidateModules: vi.fn()
  }
}));

vi.mock('../../../domain/services/context-injection/ContextModulePriorityDomainService', () => ({
  ContextModulePriorityDomainService: {
    calculateRelevanceFactors: vi.fn(),
    applySessionMultipliers: vi.fn(),
    determineConversationPhase: vi.fn()
  }
}));

vi.mock('../../../domain/services/context-injection/ContextTokenBudgetDomainService', () => ({
  ContextTokenBudgetDomainService: {
    selectModulesWithinBudget: vi.fn(),
    validateTokenBudget: vi.fn(),
    getRecommendedTokenBudget: vi.fn()
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
    vi.clearAllMocks();

    // Create mock services
    mockEffectivenessService = {
      calculateEffectivenessScore: vi.fn(),
      identifyStrengths: vi.fn(),
      identifyWeaknesses: vi.fn(),
      generateOptimizationSuggestions: vi.fn()
    } as any;

    mockRecommendationService = {
      generateRecommendations: vi.fn(),
      calculateAdjustmentFactors: vi.fn()
    } as any;

    service = new ContextInjectionApplicationService(
      mockEffectivenessService,
      mockRecommendationService
    );

    // Create mock entities using proper type casting
    mockSession = {
      id: 'test-session-123',
      chatbotConfigId: 'config-123',
      organizationId: 'org-123',
      visitorId: 'visitor-123',
      sessionToken: 'token-123'
    } as unknown as ChatSession;

    mockConfig = {
      id: 'config-123',
      organizationId: 'org-123',
      operatingHours: { timezone: 'UTC' },
      name: 'Test Config'
    } as unknown as ChatbotConfig;

    mockConversationHistory = [
      { id: 'msg-1', content: 'Hello', messageType: 'user', sessionId: 'test-session-123' } as unknown as ChatMessage,
      { id: 'msg-2', content: 'Hi there!', messageType: 'bot', sessionId: 'test-session-123' } as unknown as ChatMessage
    ];
  });

  describe('selectOptimalContext', () => {
    it('should orchestrate context selection successfully', async () => {
      // Arrange
      const availableTokens = 2000;
      const mockCriteria: ContextSelectionCriteria = {
        availableTokens,
        messageCount: 2,
        leadScore: 85
      };
      
      const mockModules: ContextModule[] = [
        { type: 'userProfile', content: () => 'Context 1', estimatedTokens: 500, priority: 900, relevanceScore: 0.9 },
        { type: 'companyContext', content: () => 'Context 2', estimatedTokens: 300, priority: 800, relevanceScore: 0.8 }
      ];

      const mockAllocation: TokenBudgetAllocation = {
        corePersona: 500,
        highPriorityContext: 300,
        progressionModules: 0,
        realTimeContext: 0,
        totalAvailable: availableTokens,
        totalUsed: 800
      };

      const mockRelevanceFactors: ContextRelevanceFactors = {
        userProfileRelevance: 0.8,
        companyContextRelevance: 0.6,
        phaseRelevance: 0.7,
        knowledgeBaseRelevance: 0.75,
        industryRelevance: 0.6,
        historyRelevance: 0.5,
        businessHoursRelevance: 0.9,
        engagementRelevance: 0.7
      };

      // Setup mocks
      vi.mocked(buildSelectionCriteria).mockReturnValue(mockCriteria);
      vi.mocked(ContextModuleGeneratorDomainService.generateCandidateModules).mockReturnValue(mockModules);
      vi.mocked(ContextModulePriorityDomainService.calculateRelevanceFactors).mockReturnValue(mockRelevanceFactors);
      vi.mocked(ContextModulePriorityDomainService.applySessionMultipliers).mockReturnValue(mockModules);
      vi.mocked(ContextTokenBudgetDomainService.selectModulesWithinBudget).mockReturnValue({
        selectedModules: mockModules,
        allocation: mockAllocation
      });
      vi.mocked(ContextModulePriorityDomainService.determineConversationPhase).mockReturnValue({
        phase: 'qualification' as const,
        confidence: 0.8,
        indicators: ['lead score', 'qualification questions']
      });
      vi.mocked(ContextTokenBudgetDomainService.validateTokenBudget).mockReturnValue({
        isValid: true,
        violations: [],
        recommendations: ['Budget used efficiently']
      });

      mockRecommendationService.generateRecommendations = vi.fn().mockReturnValue(['Optimize for lead scoring']);

      // Act
      const result = await service.selectOptimalContext(
        mockSession,
        mockConfig,
        availableTokens,
        mockConversationHistory,
        { leadId: 'lead-123' },
        85,
        'qualified'
      );

      // Assert
      expect(validateInputs).toHaveBeenCalledWith(mockSession, mockConfig, availableTokens);
      expect(buildSelectionCriteria).toHaveBeenCalledWith(
        availableTokens,
        mockConversationHistory,
        { leadId: 'lead-123' },
        85,
        'qualified'
      );
      expect(ContextModuleGeneratorDomainService.generateCandidateModules).toHaveBeenCalled();
      expect(ContextModulePriorityDomainService.calculateRelevanceFactors).toHaveBeenCalled();
      expect(ContextTokenBudgetDomainService.selectModulesWithinBudget).toHaveBeenCalled();

      expect(result).toEqual({
        selectedModules: mockModules,
        allocation: mockAllocation,
        relevanceFactors: mockRelevanceFactors,
        conversationPhase: { phase: 'qualification' as const, confidence: 0.8, indicators: ['lead score', 'qualification questions'] },
        recommendations: ['Budget used efficiently', 'Optimize for lead scoring']
      });
    });

    it('should handle minimal input parameters', async () => {
      // Arrange
      const availableTokens = 1000;
      const mockCriteria: ContextSelectionCriteria = {
        availableTokens,
        messageCount: 0
      };

      const mockModules: ContextModule[] = [
        { type: 'userProfile', content: () => 'Welcome!', estimatedTokens: 200, priority: 1000, relevanceScore: 1.0 }
      ];

      // Setup mocks
      vi.mocked(buildSelectionCriteria).mockReturnValue(mockCriteria);
      vi.mocked(ContextModuleGeneratorDomainService.generateCandidateModules).mockReturnValue(mockModules);
      vi.mocked(ContextModulePriorityDomainService.calculateRelevanceFactors).mockReturnValue({
        userProfileRelevance: 0,
        companyContextRelevance: 0,
        phaseRelevance: 0,
        knowledgeBaseRelevance: 0,
        industryRelevance: 0,
        historyRelevance: 0,
        businessHoursRelevance: 1.0,
        engagementRelevance: 0
      });
      vi.mocked(ContextModulePriorityDomainService.applySessionMultipliers).mockReturnValue(mockModules);
      vi.mocked(ContextTokenBudgetDomainService.selectModulesWithinBudget).mockReturnValue({
        selectedModules: mockModules,
        allocation: { corePersona: 200, highPriorityContext: 0, progressionModules: 0, realTimeContext: 0, totalAvailable: 1000, totalUsed: 200 }
      });
      vi.mocked(ContextModulePriorityDomainService.determineConversationPhase).mockReturnValue({
        phase: 'discovery' as const,
        confidence: 0.9,
        indicators: ['greeting', 'initial contact']
      });
      vi.mocked(ContextTokenBudgetDomainService.validateTokenBudget).mockReturnValue({
        isValid: true,
        violations: [],
        recommendations: []
      });

      mockRecommendationService.generateRecommendations = vi.fn().mockReturnValue([]);

      // Act
      const result = await service.selectOptimalContext(
        mockSession,
        mockConfig,
        availableTokens
      );

      // Assert
      expect(result.selectedModules).toEqual(mockModules);
      expect(result.conversationPhase.phase).toBe('discovery');
      expect(result.allocation.totalUsed).toBe(200);
    });

    it('should propagate validation errors', async () => {
      // Arrange
      const validationError = new Error('Invalid token budget');
      vi.mocked(validateInputs).mockImplementation(() => {
        throw validationError;
      });

      // Act & Assert
      await expect(service.selectOptimalContext(
        mockSession,
        mockConfig,
        -100
      )).rejects.toThrow('Invalid token budget');
    });
  });

  describe('getRecommendedTokenBudget', () => {
    it('should return token budget recommendation', async () => {
      // Arrange
      const mockCriteria: ContextSelectionCriteria = {
        availableTokens: 2000,
        messageCount: 5,
        leadScore: 75
      };

      const mockBudgetRecommendation = {
        recommended: 1800,
        minimum: 1000,
        maximum: 2500,
        reasoning: ['High lead score requires detailed context']
      };

      const mockAdjustmentFactors = ['Increase for qualified leads', 'Optimize for conversion'];

      vi.mocked(ContextTokenBudgetDomainService.getRecommendedTokenBudget).mockReturnValue(mockBudgetRecommendation);
      mockRecommendationService.calculateAdjustmentFactors = vi.fn().mockReturnValue(mockAdjustmentFactors);

      // Act
      const result = await service.getRecommendedTokenBudget(mockCriteria);

      // Assert
      expect(validateCriteria).toHaveBeenCalledWith(mockCriteria);
      expect(ContextTokenBudgetDomainService.getRecommendedTokenBudget).toHaveBeenCalledWith(mockCriteria);
      expect(mockRecommendationService.calculateAdjustmentFactors).toHaveBeenCalledWith(mockCriteria);

      expect(result).toEqual({
        ...mockBudgetRecommendation,
        adjustmentFactors: mockAdjustmentFactors
      });
    });

    it('should handle criteria validation errors', async () => {
      // Arrange
      const invalidCriteria = { availableTokens: -1 } as ContextSelectionCriteria;
      const validationError = new Error('Invalid criteria');
      vi.mocked(validateCriteria).mockImplementation(() => {
        throw validationError;
      });

      // Act & Assert
      await expect(service.getRecommendedTokenBudget(invalidCriteria))
        .rejects.toThrow('Invalid criteria');
    });
  });

  describe('optimizeForUseCase', () => {
    it('should optimize context for greeting use case', async () => {
      // Arrange
      vi.mocked(validateInputs).mockImplementation(() => {}); // Reset mock
      const useCase = 'greeting';
      const availableTokens = 1000;
      const mockOptions = {
        includeUserProfile: true,
        includeCompanyContext: false,
        includeConversationPhase: false,
        includeLeadScoring: false,
        includeKnowledgeBase: false,
        includeIndustrySpecific: false,
        includeConversationHistory: false,
        includeBusinessHours: false,
        includeEngagementOptimization: false
      };
      const adjustedTokens = 800;

      vi.mocked(getUseCaseOptions).mockReturnValue(mockOptions);
      vi.mocked(adjustTokensForUseCase).mockReturnValue(adjustedTokens);

      // Setup selectOptimalContext mock response
      const mockResult = {
        selectedModules: [{ type: 'userProfile' as ContextModuleType, content: () => 'Hello!', estimatedTokens: 200, priority: 1000, relevanceScore: 1.0 }],
        allocation: { totalAvailable: adjustedTokens, totalUsed: 200, corePersona: 200, highPriorityContext: 0, progressionModules: 0, realTimeContext: 0 },
        relevanceFactors: { userProfileRelevance: 0, companyContextRelevance: 0, phaseRelevance: 0, knowledgeBaseRelevance: 0, industryRelevance: 0, historyRelevance: 0, businessHoursRelevance: 1.0, engagementRelevance: 0 },
        conversationPhase: { phase: 'discovery' as const, confidence: 0.9, indicators: ['greeting', 'initial contact'] },
        recommendations: []
      };

      // Mock all the dependent services that selectOptimalContext calls
      vi.mocked(buildSelectionCriteria).mockReturnValue({
        availableTokens: adjustedTokens,
        messageCount: 0
      });
      vi.mocked(ContextModuleGeneratorDomainService.generateCandidateModules).mockReturnValue(mockResult.selectedModules);
      vi.mocked(ContextModulePriorityDomainService.calculateRelevanceFactors).mockReturnValue(mockResult.relevanceFactors);
      vi.mocked(ContextModulePriorityDomainService.applySessionMultipliers).mockReturnValue(mockResult.selectedModules);
      vi.mocked(ContextTokenBudgetDomainService.selectModulesWithinBudget).mockReturnValue({
        selectedModules: mockResult.selectedModules,
        allocation: mockResult.allocation
      });
      vi.mocked(ContextModulePriorityDomainService.determineConversationPhase).mockReturnValue(mockResult.conversationPhase);
      vi.mocked(ContextTokenBudgetDomainService.validateTokenBudget).mockReturnValue({
        isValid: true,
        violations: [],
        recommendations: []
      });
      mockRecommendationService.generateRecommendations = vi.fn().mockReturnValue([]);

      // Act
      const result = await service.optimizeForUseCase(
        mockSession,
        mockConfig,
        useCase,
        availableTokens,
        [],
        undefined,
        undefined
      );

      // Assert
      expect(validateInputs).toHaveBeenCalledWith(mockSession, mockConfig, availableTokens);
      expect(validateUseCase).toHaveBeenCalledWith(useCase);
      expect(getUseCaseOptions).toHaveBeenCalledWith(useCase);
      expect(adjustTokensForUseCase).toHaveBeenCalledWith(useCase, availableTokens, undefined);

      expect(result.conversationPhase.phase).toBe('discovery');
      expect(result.allocation.totalAvailable).toBe(adjustedTokens);
    });

    it('should optimize context for qualification use case with entity data', async () => {
      // Arrange
      vi.mocked(validateInputs).mockImplementation(() => {}); // Reset mock
      const useCase = 'qualification';
      const availableTokens = 2000;
      const leadScore = 65;
      const entityData: EntityData = { leadId: 'lead-456', companySize: 'medium' };

      const mockOptions = {
        includeUserProfile: true,
        includeCompanyContext: true,
        includeConversationPhase: true,
        includeLeadScoring: true,
        includeKnowledgeBase: false,
        includeIndustrySpecific: true,
        includeConversationHistory: false,
        includeBusinessHours: false,
        includeEngagementOptimization: false
      };

      vi.mocked(getUseCaseOptions).mockReturnValue(mockOptions);
      vi.mocked(adjustTokensForUseCase).mockReturnValue(availableTokens); // No adjustment for qualification

      // Setup mocks for selectOptimalContext
      const mockResult = {
        selectedModules: [
          { type: 'userProfile' as ContextModuleType, content: () => 'Profile context', estimatedTokens: 400, priority: 850, relevanceScore: 0.9 },
          { type: 'industrySpecific' as ContextModuleType, content: () => 'Industry-specific context', estimatedTokens: 600, priority: 800, relevanceScore: 0.8 }
        ],
        allocation: { totalAvailable: availableTokens, totalUsed: 1000, corePersona: 400, highPriorityContext: 600, progressionModules: 0, realTimeContext: 0 },
        relevanceFactors: { userProfileRelevance: 0.65, companyContextRelevance: 0.8, phaseRelevance: 0.3, knowledgeBaseRelevance: 0.7, industryRelevance: 0.6, historyRelevance: 0.4, businessHoursRelevance: 0.9, engagementRelevance: 0.5 },
        conversationPhase: { phase: 'qualification' as const, confidence: 0.8, indicators: ['lead score', 'qualification questions'] },
        recommendations: ['Focus on qualification questions']
      };

      vi.mocked(buildSelectionCriteria).mockReturnValue({
        availableTokens,
        messageCount: 0,
        leadScore,
        entityData
      });
      vi.mocked(ContextModuleGeneratorDomainService.generateCandidateModules).mockReturnValue(mockResult.selectedModules);
      vi.mocked(ContextModulePriorityDomainService.calculateRelevanceFactors).mockReturnValue(mockResult.relevanceFactors);
      vi.mocked(ContextModulePriorityDomainService.applySessionMultipliers).mockReturnValue(mockResult.selectedModules);
      vi.mocked(ContextTokenBudgetDomainService.selectModulesWithinBudget).mockReturnValue({
        selectedModules: mockResult.selectedModules,
        allocation: mockResult.allocation
      });
      vi.mocked(ContextModulePriorityDomainService.determineConversationPhase).mockReturnValue(mockResult.conversationPhase);
      vi.mocked(ContextTokenBudgetDomainService.validateTokenBudget).mockReturnValue({
        isValid: true,
        violations: [],
        recommendations: []
      });
      mockRecommendationService.generateRecommendations = vi.fn().mockReturnValue(mockResult.recommendations);

      // Act
      const result = await service.optimizeForUseCase(
        mockSession,
        mockConfig,
        useCase,
        availableTokens,
        mockConversationHistory,
        entityData,
        leadScore
      );

      // Assert
      expect(adjustTokensForUseCase).toHaveBeenCalledWith(useCase, availableTokens, leadScore);
      expect(result.conversationPhase.phase).toBe('qualification');
      expect(result.relevanceFactors.userProfileRelevance).toBe(0.65);
      expect(result.recommendations).toContain('Focus on qualification questions');
    });

    it('should handle invalid use case', async () => {
      // Arrange
      vi.mocked(validateInputs).mockImplementation(() => {}); // Reset mock
      const invalidUseCase = 'invalid' as any;
      const validationError = new Error('Invalid use case');
      vi.mocked(validateUseCase).mockImplementation(() => {
        throw validationError;
      });

      // Act & Assert
      await expect(service.optimizeForUseCase(
        mockSession,
        mockConfig,
        invalidUseCase,
        1000
      )).rejects.toThrow('Invalid use case');
    });
  });

  describe('analyzeContextEffectiveness', () => {
    it('should analyze context effectiveness successfully', async () => {
      // Arrange
      const mockResult = {
        selectedModules: [
          { type: 'companyContext' as ContextModuleType, content: () => 'Context 1', estimatedTokens: 500, priority: 900, relevanceScore: 0.9 }
        ],
        allocation: { totalAvailable: 2000, totalUsed: 500, corePersona: 500, highPriorityContext: 0, progressionModules: 0, realTimeContext: 0 },
        relevanceFactors: { userProfileRelevance: 0.8, companyContextRelevance: 0.7, phaseRelevance: 0.6, knowledgeBaseRelevance: 0.75, industryRelevance: 0.65, historyRelevance: 0.5, businessHoursRelevance: 0.9, engagementRelevance: 0.7 },
        conversationPhase: { phase: 'demonstration' as const, confidence: 0.7, indicators: ['demo request', 'feature interest'] },
        recommendations: []
      };

      const mockCriteria: ContextSelectionCriteria = {
        availableTokens: 2000,
        messageCount: 3,
        leadScore: 80
      };

      const expectedUtilization = {
        totalUsed: 500,
        totalAvailable: 2000,
        utilizationRate: 0.25,
        isEfficient: true
      };

      mockEffectivenessService.calculateEffectivenessScore = vi.fn().mockReturnValue(0.82);
      mockEffectivenessService.identifyStrengths = vi.fn().mockReturnValue([
        'High relevance factors',
        'Efficient token usage'
      ]);
      mockEffectivenessService.identifyWeaknesses = vi.fn().mockReturnValue([
        'Low token utilization'
      ]);
      mockEffectivenessService.generateOptimizationSuggestions = vi.fn().mockReturnValue([
        'Consider adding more context modules',
        'Increase lead scoring weight'
      ]);

      // Act
      const result = await service.analyzeContextEffectiveness(mockResult, mockCriteria);

      // Assert
      expect(validateAnalysisInputs).toHaveBeenCalledWith(mockResult, mockCriteria);
      expect(mockEffectivenessService.calculateEffectivenessScore).toHaveBeenCalledWith(
        mockResult.selectedModules,
        expectedUtilization,
        mockResult.relevanceFactors
      );
      expect(mockEffectivenessService.identifyStrengths).toHaveBeenCalledWith(
        mockResult.selectedModules,
        expectedUtilization,
        mockResult.relevanceFactors
      );
      expect(mockEffectivenessService.identifyWeaknesses).toHaveBeenCalledWith(
        mockResult.selectedModules,
        expectedUtilization,
        mockResult.relevanceFactors
      );
      expect(mockEffectivenessService.generateOptimizationSuggestions).toHaveBeenCalledWith(
        mockResult.selectedModules,
        expectedUtilization,
        mockCriteria.messageCount,
        mockCriteria.leadScore
      );

      expect(result).toEqual({
        effectivenessScore: 0.82,
        strengths: ['High relevance factors', 'Efficient token usage'],
        weaknesses: ['Low token utilization'],
        optimizationSuggestions: ['Consider adding more context modules', 'Increase lead scoring weight']
      });
    });

    it('should handle perfect token utilization', async () => {
      // Arrange
      const mockResult = {
        selectedModules: [
          { type: 'userProfile' as ContextModuleType, content: () => 'Context 1', estimatedTokens: 1000, priority: 900, relevanceScore: 0.95 },
          { type: 'companyContext' as ContextModuleType, content: () => 'Context 2', estimatedTokens: 500, priority: 850, relevanceScore: 0.9 }
        ],
        allocation: { totalAvailable: 1500, totalUsed: 1500, corePersona: 750, highPriorityContext: 750, progressionModules: 0, realTimeContext: 0 },
        relevanceFactors: { userProfileRelevance: 0.9, companyContextRelevance: 0.9, phaseRelevance: 0.8, knowledgeBaseRelevance: 0.85, industryRelevance: 0.8, historyRelevance: 0.7, businessHoursRelevance: 1.0, engagementRelevance: 0.9 },
        conversationPhase: { phase: 'closing' as const, confidence: 0.9, indicators: ['purchase intent', 'pricing questions'] },
        recommendations: []
      };

      const mockCriteria: ContextSelectionCriteria = {
        availableTokens: 1500,
        messageCount: 8,
        leadScore: 95
      };

      const expectedUtilization = {
        totalUsed: 1500,
        totalAvailable: 1500,
        utilizationRate: 1.0,
        isEfficient: true
      };

      mockEffectivenessService.calculateEffectivenessScore = vi.fn().mockReturnValue(0.95);
      mockEffectivenessService.identifyStrengths = vi.fn().mockReturnValue([
        'Perfect token utilization',
        'High lead score alignment',
        'Optimal conversation phase context'
      ]);
      mockEffectivenessService.identifyWeaknesses = vi.fn().mockReturnValue([]);
      mockEffectivenessService.generateOptimizationSuggestions = vi.fn().mockReturnValue([
        'Context selection is optimal'
      ]);

      // Act
      const result = await service.analyzeContextEffectiveness(mockResult, mockCriteria);

      // Assert
      expect(result.effectivenessScore).toBe(0.95);
      expect(result.strengths).toContain('Perfect token utilization');
      expect(result.weaknesses).toHaveLength(0);
      expect(result.optimizationSuggestions).toContain('Context selection is optimal');
    });

    it('should handle analysis validation errors', async () => {
      // Arrange
      const invalidResult = {} as any;
      const invalidCriteria = {} as any;
      const validationError = new Error('Invalid analysis inputs');
      vi.mocked(validateAnalysisInputs).mockImplementation(() => {
        throw validationError;
      });

      // Act & Assert
      await expect(service.analyzeContextEffectiveness(invalidResult, invalidCriteria))
        .rejects.toThrow('Invalid analysis inputs');
    });
  });

  describe('Integration Scenarios', () => {
    it('should handle complete workflow from greeting to closing', async () => {
      // Arrange - Simulate a conversation progressing through phases
      vi.mocked(validateInputs).mockImplementation(() => {}); // Reset mock
      vi.mocked(validateUseCase).mockImplementation(() => {}); // Reset mock
      const availableTokens = 2000;
      
      // Mock different phases
      const greetingModules = [
        { type: 'userProfile' as ContextModuleType, content: () => 'Welcome!', estimatedTokens: 300, priority: 1000, relevanceScore: 1.0 }
      ];
      
      const qualificationModules = [
        { type: 'userProfile' as ContextModuleType, content: () => 'Profile context', estimatedTokens: 500, priority: 900, relevanceScore: 0.9 },
        { type: 'leadScoring' as ContextModuleType, content: () => 'Qualification questions', estimatedTokens: 400, priority: 850, relevanceScore: 0.85 }
      ];

      // Setup mocks for different use cases
      vi.mocked(getUseCaseOptions).mockImplementation((useCase) => {
        const baseOptions = {
          includeUserProfile: true,
          includeCompanyContext: false,
          includeConversationPhase: false,
          includeLeadScoring: false,
          includeKnowledgeBase: false,
          includeIndustrySpecific: false,
          includeConversationHistory: false,
          includeBusinessHours: false,
          includeEngagementOptimization: false
        };
        switch (useCase) {
          case 'greeting': return baseOptions;
          case 'qualification': return { ...baseOptions, includeLeadScoring: true, includeIndustrySpecific: true };
          default: return baseOptions;
        }
      });

      vi.mocked(adjustTokensForUseCase).mockImplementation((useCase, tokens) => {
        switch (useCase) {
          case 'greeting': return Math.min(tokens, 800);
          case 'qualification': return tokens;
          default: return tokens;
        }
      });

      // Test greeting phase
      vi.mocked(buildSelectionCriteria).mockReturnValue({ availableTokens: 800, messageCount: 0 });
      vi.mocked(ContextModuleGeneratorDomainService.generateCandidateModules).mockReturnValue(greetingModules);
      vi.mocked(ContextModulePriorityDomainService.calculateRelevanceFactors).mockReturnValue({
        userProfileRelevance: 0, companyContextRelevance: 0, phaseRelevance: 0, knowledgeBaseRelevance: 0, industryRelevance: 0, historyRelevance: 0, businessHoursRelevance: 1.0, engagementRelevance: 0
      });
      vi.mocked(ContextModulePriorityDomainService.applySessionMultipliers).mockReturnValue(greetingModules);
      vi.mocked(ContextTokenBudgetDomainService.selectModulesWithinBudget).mockReturnValue({
        selectedModules: greetingModules,
        allocation: { totalAvailable: 800, totalUsed: 300, corePersona: 300, highPriorityContext: 0, progressionModules: 0, realTimeContext: 0 }
      });
      vi.mocked(ContextModulePriorityDomainService.determineConversationPhase).mockReturnValue({
        phase: 'discovery' as const,
        confidence: 0.9,
        indicators: ['greeting', 'initial contact']
      });
      vi.mocked(ContextTokenBudgetDomainService.validateTokenBudget).mockReturnValue({
        isValid: true, violations: [], recommendations: []
      });
      mockRecommendationService.generateRecommendations = vi.fn().mockReturnValue(['Start with greeting']);

      // Act - Test greeting
      const greetingResult = await service.optimizeForUseCase(
        mockSession,
        mockConfig,
        'greeting',
        availableTokens
      );

      // Assert greeting
      expect(greetingResult.conversationPhase.phase).toBe('discovery');
      expect(greetingResult.allocation.totalAvailable).toBe(800); // Token adjustment for greeting

      // Update mocks for qualification phase
      vi.mocked(buildSelectionCriteria).mockReturnValue({ 
        availableTokens: 2000, 
        messageCount: 2, 
        leadScore: 60 
      });
      vi.mocked(ContextModuleGeneratorDomainService.generateCandidateModules).mockReturnValue(qualificationModules);
      vi.mocked(ContextModulePriorityDomainService.calculateRelevanceFactors).mockReturnValue({
        userProfileRelevance: 0.6, companyContextRelevance: 0.5, phaseRelevance: 0.4, knowledgeBaseRelevance: 0.55, industryRelevance: 0.5, historyRelevance: 0.3, businessHoursRelevance: 0.9, engagementRelevance: 0.4
      });
      vi.mocked(ContextModulePriorityDomainService.applySessionMultipliers).mockReturnValue(qualificationModules);
      vi.mocked(ContextTokenBudgetDomainService.selectModulesWithinBudget).mockReturnValue({
        selectedModules: qualificationModules,
        allocation: { totalAvailable: 2000, totalUsed: 900, corePersona: 500, highPriorityContext: 400, progressionModules: 0, realTimeContext: 0 }
      });
      vi.mocked(ContextModulePriorityDomainService.determineConversationPhase).mockReturnValue({
        phase: 'qualification' as const,
        confidence: 0.8,
        indicators: ['lead score', 'qualification questions']
      });
      mockRecommendationService.generateRecommendations = vi.fn().mockReturnValue(['Focus on qualification']);

      // Act - Test qualification
      const qualificationResult = await service.optimizeForUseCase(
        mockSession,
        mockConfig,
        'qualification',
        availableTokens,
        mockConversationHistory,
        { leadId: 'lead-789' },
        60
      );

      // Assert qualification
      expect(qualificationResult.conversationPhase.phase).toBe('qualification');
      expect(qualificationResult.relevanceFactors.userProfileRelevance).toBe(0.6);
      expect(qualificationResult.recommendations).toContain('Focus on qualification');
    });

    it('should handle low token budget scenarios', async () => {
      // Arrange
      vi.mocked(validateInputs).mockImplementation(() => {}); // Reset mock
      const lowTokenBudget = 200;
      const mockCriteria: ContextSelectionCriteria = {
        availableTokens: lowTokenBudget,
        messageCount: 1
      };

      const minimalModules = [
        { type: 'userProfile' as ContextModuleType, content: () => 'Hi', estimatedTokens: 150, priority: 1000, relevanceScore: 1.0 }
      ];

      // Setup mocks for low budget scenario
      vi.mocked(buildSelectionCriteria).mockReturnValue(mockCriteria);
      vi.mocked(ContextModuleGeneratorDomainService.generateCandidateModules).mockReturnValue(minimalModules);
      vi.mocked(ContextModulePriorityDomainService.calculateRelevanceFactors).mockReturnValue({
        userProfileRelevance: 0, companyContextRelevance: 0, phaseRelevance: 0.2, knowledgeBaseRelevance: 0, industryRelevance: 0, historyRelevance: 0.1, businessHoursRelevance: 1.0, engagementRelevance: 0
      });
      vi.mocked(ContextModulePriorityDomainService.applySessionMultipliers).mockReturnValue(minimalModules);
      vi.mocked(ContextTokenBudgetDomainService.selectModulesWithinBudget).mockReturnValue({
        selectedModules: minimalModules,
        allocation: { totalAvailable: lowTokenBudget, totalUsed: 150, corePersona: 150, highPriorityContext: 0, progressionModules: 0, realTimeContext: 0 }
      });
      vi.mocked(ContextModulePriorityDomainService.determineConversationPhase).mockReturnValue({
        phase: 'discovery' as const,
        confidence: 0.9,
        indicators: ['greeting', 'initial contact']
      });
      vi.mocked(ContextTokenBudgetDomainService.validateTokenBudget).mockReturnValue({
        isValid: true,
        violations: [],
        recommendations: ['Consider increasing token budget for better context']
      });
      mockRecommendationService.generateRecommendations = vi.fn().mockReturnValue(['Use minimal context']);

      // Act
      const result = await service.selectOptimalContext(
        mockSession,
        mockConfig,
        lowTokenBudget
      );

      // Assert
      expect(result.allocation.totalUsed).toBe(150);
      expect(result.recommendations).toContain('Consider increasing token budget for better context');
      expect(result.recommendations).toContain('Use minimal context');
      expect(result.selectedModules).toHaveLength(1);
    });
  });
});