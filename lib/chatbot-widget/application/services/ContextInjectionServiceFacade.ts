/**
 * Context Injection Service Facade
 * 
 * AI INSTRUCTIONS:
 * - Clean unified interface for context injection operations
 * - Orchestrates all domain and application services
 * - Keep under 250 lines by focusing on coordination
 * - Follow @golden-rule patterns exactly
 * - Single responsibility: unified context injection interface
 */

import { ChatSession } from '../../domain/entities/ChatSession';
import { ChatbotConfig } from '../../domain/entities/ChatbotConfig';
import { ChatMessage } from '../../domain/entities/ChatMessage';
import { ContextInjectionApplicationService } from './ContextInjectionApplicationService';
import { ContextInjectionResult } from '../types/ContextInjectionApplicationTypes';
import { ContextEffectivenessDomainService } from '../../domain/services/context-injection/ContextEffectivenessDomainService';
import { ContextRecommendationDomainService } from '../../domain/services/context-injection/ContextRecommendationDomainService';
import {
  ContextModule,
  ContextSelectionCriteria,
  EntityData,
  ContextGenerationOptions,
  TokenBudgetAllocation
} from '../../domain/services/interfaces/ContextInjectionTypes';

// Helper imports following @golden-rule patterns
import {
  generateContextContent,
  getContextSummary,
  buildEnhancedContextOptions,
  getMinimalTokenBudget,
  buildTokenBudgetCriteria,
  buildEffectivenessCriteria
} from './ContextInjectionFacadeHelpers';
import {
  validateContextSelection,
  ValidationResult
} from './ContextInjectionFacadeValidation';

export class ContextInjectionServiceFacade {
  private applicationService: ContextInjectionApplicationService;

  constructor() {
    // Initialize domain services
    const contextEffectivenessService = new ContextEffectivenessDomainService();
    const contextRecommendationService = new ContextRecommendationDomainService();
    
    // Inject dependencies into application service
    this.applicationService = new ContextInjectionApplicationService(
      contextEffectivenessService,
      contextRecommendationService
    );
  }

  /**
   * Main entry point for intelligent context selection
   * AI INSTRUCTIONS: Delegate to application service, clean interface
   */
  async selectContextModules(
    session: ChatSession,
    chatbotConfig: ChatbotConfig,
    availableTokens: number,
    conversationHistory?: ChatMessage[],
    entityData?: EntityData,
    leadScore?: number,
    qualificationStatus?: string
  ): Promise<ContextModule[]> {
    const result = await this.applicationService.selectOptimalContext(
      session,
      chatbotConfig,
      availableTokens,
      conversationHistory || [],
      entityData,
      leadScore,
      qualificationStatus
    );
    
    return result.selectedModules;
  }

  /**
   * Get comprehensive context injection analysis
   * AI INSTRUCTIONS: Extended interface with analytics
   */
  async selectOptimalContextWithAnalytics(
    session: ChatSession,
    chatbotConfig: ChatbotConfig,
    availableTokens: number,
    conversationHistory?: ChatMessage[],
    entityData?: EntityData,
    leadScore?: number,
    qualificationStatus?: string,
    options?: ContextGenerationOptions
  ): Promise<ContextInjectionResult> {
    return await this.applicationService.selectOptimalContext(
      session,
      chatbotConfig,
      availableTokens,
      conversationHistory || [],
      entityData,
      leadScore,
      qualificationStatus,
      options
    );
  }

  /**
   * Optimize context for specific conversation phases
   * AI INSTRUCTIONS: Phase-specific optimization
   */
  async optimizeForConversationPhase(
    session: ChatSession,
    chatbotConfig: ChatbotConfig,
    phase: 'greeting' | 'qualification' | 'demonstration' | 'closing',
    availableTokens: number,
    conversationHistory?: ChatMessage[],
    entityData?: EntityData,
    leadScore?: number
  ): Promise<ContextModule[]> {
    const result = await this.applicationService.optimizeForUseCase(
      session,
      chatbotConfig,
      phase,
      availableTokens,
      conversationHistory || [],
      entityData,
      leadScore
    );
    
    return result.selectedModules;
  }

  /**
   * Get recommended token budget for conversation context
   * AI INSTRUCTIONS: Budget recommendations, uses helper for criteria
   */
  async getRecommendedTokenBudget(
    messageCount: number,
    entityData?: EntityData,
    leadScore?: number,
    qualificationStatus?: string
  ): Promise<{
    recommended: number;
    minimum: number;
    maximum: number;
    reasoning: string[];
  }> {
    const criteria = buildTokenBudgetCriteria(messageCount, entityData, leadScore, qualificationStatus);
    const result = await this.applicationService.getRecommendedTokenBudget(criteria);
    
    return {
      recommended: result.recommended,
      minimum: result.minimum,
      maximum: result.maximum,
      reasoning: result.reasoning
    };
  }

  /**
   * Analyze context effectiveness and get optimization insights
   * AI INSTRUCTIONS: Effectiveness analysis, uses helper for criteria
   */
  async analyzeContextEffectiveness(
    result: ContextInjectionResult,
    messageCount: number,
    entityData?: EntityData,
    leadScore?: number
  ): Promise<{
    effectivenessScore: number;
    strengths: string[];
    weaknesses: string[];
    optimizationSuggestions: string[];
  }> {
    const criteria = buildEffectivenessCriteria(result.allocation, messageCount, entityData, leadScore);
    return await this.applicationService.analyzeContextEffectiveness(result, criteria);
  }

  /**
   * Simplified interface for early conversations (greetings)
   * AI INSTRUCTIONS: Minimal token usage, uses helper for budget
   */
  async selectMinimalContext(
    session: ChatSession,
    chatbotConfig: ChatbotConfig,
    entityData?: EntityData
  ): Promise<ContextModule[]> {
    const minimalTokens = getMinimalTokenBudget();
    
    return await this.optimizeForConversationPhase(
      session,
      chatbotConfig,
      'greeting',
      minimalTokens,
      [], // No conversation history for greetings
      entityData
    );
  }

  /**
   * Enhanced interface for qualified leads
   * AI INSTRUCTIONS: Comprehensive context, uses helper for options
   */
  async selectEnhancedContext(
    session: ChatSession,
    chatbotConfig: ChatbotConfig,
    availableTokens: number,
    conversationHistory: ChatMessage[],
    entityData: EntityData,
    leadScore: number,
    qualificationStatus: string = 'qualified'
  ): Promise<ContextModule[]> {
    const enhancedOptions = buildEnhancedContextOptions();
    
    const result = await this.applicationService.selectOptimalContext(
      session,
      chatbotConfig,
      availableTokens,
      conversationHistory,
      entityData,
      leadScore,
      qualificationStatus,
      enhancedOptions
    );
    
    return result.selectedModules;
  }

  /**
   * Get context module content as formatted strings
   * AI INSTRUCTIONS: Delegates to helper function
   */
  generateContextContent(modules: ContextModule[]): string[] {
    return generateContextContent(modules);
  }

  /**
   * Get context summary for monitoring and debugging
   * AI INSTRUCTIONS: Delegates to helper function
   */
  getContextSummary(selectedModules: ContextModule[], allocation: TokenBudgetAllocation) {
    return getContextSummary(selectedModules, allocation);
  }

  /**
   * Validate context selection for quality assurance
   * AI INSTRUCTIONS: Delegates to validation helper
   */
  validateContextSelection(selectedModules: ContextModule[], allocation: TokenBudgetAllocation, criteria: ContextSelectionCriteria): ValidationResult {
    return validateContextSelection(selectedModules, allocation, criteria);
  }
} 