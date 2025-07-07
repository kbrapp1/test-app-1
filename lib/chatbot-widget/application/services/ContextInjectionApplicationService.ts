/**
 * Context Injection Application Service
 * 
 * AI Instructions:
 * - Orchestrate context selection workflow using domain services
 * - Validate inputs and delegate to appropriate domain services
 * - Keep this service under 250 lines - pure orchestration only
 * - Use helper functions for complex logic
 * - Always validate inputs before processing
 */

import { ChatSession } from '../../domain/entities/ChatSession';
import { ChatbotConfig } from '../../domain/entities/ChatbotConfig';
import { ChatMessage } from '../../domain/entities/ChatMessage';
import { ContextModulePriorityDomainService } from '../../domain/services/context-injection/ContextModulePriorityDomainService';
import { ContextModuleGeneratorDomainService } from '../../domain/services/context-injection/ContextModuleGeneratorDomainService';
import { ContextTokenBudgetDomainService } from '../../domain/services/context-injection/ContextTokenBudgetDomainService';
import { ContextEffectivenessDomainService } from '../../domain/services/context-injection/ContextEffectivenessDomainService';
import { ContextRecommendationDomainService } from '../../domain/services/context-injection/ContextRecommendationDomainService';
import {
  ContextModule,
  ContextSelectionCriteria,
  EntityData,
  TokenBudgetAllocation,
  ContextGenerationOptions,
  ContextRelevanceFactors,
  ConversationPhase
} from '../../domain/services/interfaces/ContextInjectionTypes';

import { buildSelectionCriteria, getUseCaseOptions, adjustTokensForUseCase } from './ContextInjectionHelpers';
import { validateInputs, validateCriteria, validateUseCase, validateAnalysisInputs } from './ContextInjectionValidation';

type UseCase = 'greeting' | 'qualification' | 'demonstration' | 'closing';

export interface ContextInjectionResult {
  selectedModules: ContextModule[];
  allocation: TokenBudgetAllocation;
  relevanceFactors: ContextRelevanceFactors;
  conversationPhase: ConversationPhase;
  recommendations: string[];
}

export interface TokenBudgetRecommendation {
  recommended: number;
  minimum: number;
  maximum: number;
  reasoning: string[];
  adjustmentFactors: string[];
}

export class ContextInjectionApplicationService {
  
  constructor(
    private readonly contextEffectivenessService: ContextEffectivenessDomainService,
    private readonly contextRecommendationService: ContextRecommendationDomainService
  ) {}
  
  // Select optimal context for conversation
  async selectOptimalContext(
    session: ChatSession,
    chatbotConfig: ChatbotConfig,
    availableTokens: number,
    conversationHistory: ChatMessage[] = [],
    entityData?: EntityData,
    leadScore?: number,
    qualificationStatus?: string,
    options?: ContextGenerationOptions
  ): Promise<ContextInjectionResult> {
    validateInputs(session, chatbotConfig, availableTokens);

    const criteria = buildSelectionCriteria(
      availableTokens,
      conversationHistory,
      entityData,
      leadScore,
      qualificationStatus
    );

    const candidateModules = ContextModuleGeneratorDomainService.generateCandidateModules(
      session,
      chatbotConfig,
      conversationHistory,
      entityData,
      leadScore,
      qualificationStatus,
      options
    );

    const relevanceFactors = ContextModulePriorityDomainService.calculateRelevanceFactors(
      session,
      conversationHistory,
      entityData,
      leadScore,
      chatbotConfig.operatingHours
    );

    const prioritizedModules = ContextModulePriorityDomainService.applySessionMultipliers(
      candidateModules,
      session,
      conversationHistory,
      entityData,
      leadScore
    );

    const { selectedModules, allocation } = ContextTokenBudgetDomainService.selectModulesWithinBudget(
      prioritizedModules,
      availableTokens,
      criteria
    );

    const conversationPhase = ContextModulePriorityDomainService.determineConversationPhase(
      leadScore,
      entityData,
      conversationHistory
    );

    const validation = ContextTokenBudgetDomainService.validateTokenBudget(
      selectedModules,
      availableTokens
    );

    const recommendations = this.contextRecommendationService.generateRecommendations(
      selectedModules,
      allocation,
      criteria
    );

    return {
      selectedModules,
      allocation,
      relevanceFactors,
      conversationPhase,
      recommendations: [...validation.recommendations, ...recommendations]
    };
  }

  // Get recommended token budget
  async getRecommendedTokenBudget(
    criteria: ContextSelectionCriteria
  ): Promise<TokenBudgetRecommendation> {
    validateCriteria(criteria);
    
    const budgetRecommendation = ContextTokenBudgetDomainService.getRecommendedTokenBudget(criteria);
    const adjustmentFactors = this.contextRecommendationService.calculateAdjustmentFactors(criteria);
    
    return {
      ...budgetRecommendation,
      adjustmentFactors
    };
  }

  // Optimize context for specific use case
  async optimizeForUseCase(
    session: ChatSession,
    chatbotConfig: ChatbotConfig,
    useCase: UseCase,
    availableTokens: number,
    conversationHistory: ChatMessage[] = [],
    entityData?: EntityData,
    leadScore?: number
  ): Promise<ContextInjectionResult> {
    validateInputs(session, chatbotConfig, availableTokens);
    validateUseCase(useCase);
    
    const options = getUseCaseOptions(useCase);
    const adjustedTokens = adjustTokensForUseCase(useCase, availableTokens, leadScore);
    
    return this.selectOptimalContext(
      session,
      chatbotConfig,
      adjustedTokens,
      conversationHistory,
      entityData,
      leadScore,
      undefined,
      options
    );
  }

  // Analyze context effectiveness
  async analyzeContextEffectiveness(
    result: ContextInjectionResult,
    criteria: ContextSelectionCriteria
  ): Promise<{
    effectivenessScore: number;
    strengths: string[];
    weaknesses: string[];
    optimizationSuggestions: string[];
  }> {
    validateAnalysisInputs(result, criteria);
    
    const utilization = {
      totalUsed: result.allocation.totalUsed,
      totalAvailable: result.allocation.totalAvailable,
      utilizationRate: result.allocation.totalUsed / result.allocation.totalAvailable,
      isEfficient: true
    };
    
    const effectivenessScore = this.contextEffectivenessService.calculateEffectivenessScore(
      result.selectedModules,
      utilization,
      result.relevanceFactors
    );
    
    const strengths = this.contextEffectivenessService.identifyStrengths(
      result.selectedModules,
      utilization,
      result.relevanceFactors
    );
    
    const weaknesses = this.contextEffectivenessService.identifyWeaknesses(
      result.selectedModules,
      utilization,
      result.relevanceFactors
    );
    
    const optimizationSuggestions = this.contextEffectivenessService.generateOptimizationSuggestions(
      result.selectedModules,
      utilization,
      criteria.messageCount,
      criteria.leadScore
    );
    
    return {
      effectivenessScore,
      strengths,
      weaknesses,
      optimizationSuggestions
    };
  }
}