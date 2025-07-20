/**
 * Context Injection Application Service
 * 
 * Main orchestrator for context injection operations.
 * Pure orchestration - delegates to specialized services for validation, configuration, and criteria building.
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
  ContextSelectionCriteria,
  EntityData,
  ContextGenerationOptions
} from '../../domain/services/interfaces/ContextInjectionTypes';

// Application service types
import { 
  ContextInjectionResult, 
  TokenBudgetRecommendation, 
  UseCase 
} from '../types/ContextInjectionApplicationTypes';

// Extracted application services
import { ContextInjectionValidationService } from './context-injection/ContextInjectionValidationService';
import { ContextInjectionUseCaseConfigurationService } from './context-injection/ContextInjectionUseCaseConfigurationService';
import { ContextInjectionCriteriaBuilder } from './context-injection/ContextInjectionCriteriaBuilder';

export class ContextInjectionApplicationService {
  private readonly validationService: ContextInjectionValidationService;
  private readonly useCaseConfigurationService: ContextInjectionUseCaseConfigurationService;
  private readonly criteriaBuilder: ContextInjectionCriteriaBuilder;
  
  constructor(
    private readonly contextEffectivenessService: ContextEffectivenessDomainService,
    private readonly contextRecommendationService: ContextRecommendationDomainService
  ) {
    // Initialize extracted application services
    this.validationService = new ContextInjectionValidationService();
    this.useCaseConfigurationService = new ContextInjectionUseCaseConfigurationService();
    this.criteriaBuilder = new ContextInjectionCriteriaBuilder();
  }
  
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
    this.validationService.validateInputs(session, chatbotConfig, availableTokens);

    const criteria = this.criteriaBuilder.buildSelectionCriteria(
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
    this.validationService.validateCriteria(criteria);
    
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
    this.validationService.validateInputs(session, chatbotConfig, availableTokens);
    this.validationService.validateUseCase(useCase);
    
    const options = this.useCaseConfigurationService.getUseCaseOptions(useCase);
    const adjustedTokens = this.useCaseConfigurationService.adjustTokensForUseCase(useCase, availableTokens, leadScore);
    
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
    this.validationService.validateAnalysisInputs(result, criteria);
    
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