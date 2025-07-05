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
import { ContextInjectionApplicationService, ContextInjectionResult } from './ContextInjectionApplicationService';
import {
  ContextModule,
  ContextSelectionCriteria,
  EntityData,
  ContextGenerationOptions,
  TokenBudgetAllocation,
  ContextRelevanceFactors,
  ConversationPhase
} from '../../domain/services/interfaces/ContextInjectionTypes';

export class ContextInjectionServiceFacade {
  private applicationService: ContextInjectionApplicationService;

  constructor() {
    this.applicationService = new ContextInjectionApplicationService();
  }

  /**
   * Main entry point for intelligent context selection
   * 
   * AI INSTRUCTIONS:
   * - Delegate to application service
   * - Maintain clean interface
   * - Handle common use cases simply
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
   * 
   * AI INSTRUCTIONS:
   * - Extended interface for full context data
   * - Include analytics and recommendations
   * - Useful for optimization and monitoring
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
   * 
   * AI INSTRUCTIONS:
   * - Use case specific optimization
   * - Apply business rules for different phases
   * - Return optimized context selection
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
   * 
   * AI INSTRUCTIONS:
   * - Intelligent budget recommendations
   * - Consider conversation complexity
   * - Provide actionable guidance
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
    const criteria: ContextSelectionCriteria = {
      availableTokens: 0, // Not used for recommendation
      messageCount,
      entityData,
      leadScore,
      qualificationStatus
    };
    
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
   * 
   * AI INSTRUCTIONS:
   * - Evaluate context quality
   * - Provide improvement recommendations
   * - Support continuous optimization
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
    const criteria: ContextSelectionCriteria = {
      availableTokens: result.allocation.totalAvailable,
      messageCount,
      entityData,
      leadScore
    };
    
    return await this.applicationService.analyzeContextEffectiveness(result, criteria);
  }

  /**
   * Simplified interface for early conversations (greetings)
   * 
   * AI INSTRUCTIONS:
   * - Optimized for minimal token usage
   * - Focus on essential context only
   * - Fast response for initial interactions
   */
  async selectMinimalContext(
    session: ChatSession,
    chatbotConfig: ChatbotConfig,
    entityData?: EntityData
  ): Promise<ContextModule[]> {
    const minimalTokens = 800; // Conservative budget for greetings
    
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
   * 
   * AI INSTRUCTIONS:
   * - Comprehensive context for high-value prospects
   * - Include all relevant modules
   * - Optimize for conversion
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
    const enhancedOptions: ContextGenerationOptions = {
      includeUserProfile: true,
      includeCompanyContext: true,
      includeConversationPhase: true,
      includeLeadScoring: true,
      includeKnowledgeBase: true,
      includeIndustrySpecific: true,
      includeConversationHistory: true,
      includeBusinessHours: true,
      includeEngagementOptimization: true
    };
    
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
   * 
   * AI INSTRUCTIONS:
   * - Convert modules to usable content
   * - Handle content generation efficiently
   * - Return formatted context strings
   */
  generateContextContent(modules: ContextModule[]): string[] {
    return modules.map(module => {
      try {
        return module.content();
      } catch (error) {
        console.warn(`Failed to generate content for module ${module.type}:`, error);
        return `${module.type}: Content generation failed`;
      }
    });
  }

  /**
   * Get context summary for monitoring and debugging
   * 
   * AI INSTRUCTIONS:
   * - Provide context selection summary
   * - Include key metrics and decisions
   * - Support debugging and optimization
   */
  getContextSummary(
    selectedModules: ContextModule[],
    allocation: TokenBudgetAllocation
  ): {
    moduleCount: number;
    moduleTypes: string[];
    totalTokens: number;
    utilizationPercent: number;
    priorityBreakdown: Record<string, number>;
  } {
    const moduleTypes = selectedModules.map(m => m.type);
    const totalTokens = allocation.totalUsed;
    const utilizationPercent = Math.round((totalTokens / allocation.totalAvailable) * 100);
    
    // Calculate priority breakdown
    const priorityBreakdown = selectedModules.reduce((acc, module) => {
      const priority = module.adjustedPriority || module.priority;
      acc[module.type] = priority;
      return acc;
    }, {} as Record<string, number>);
    
    return {
      moduleCount: selectedModules.length,
      moduleTypes,
      totalTokens,
      utilizationPercent,
      priorityBreakdown
    };
  }

  /**
   * Validate context selection for quality assurance
   * 
   * AI INSTRUCTIONS:
   * - Check context quality and completeness
   * - Validate business rules compliance
   * - Return validation results
   */
  validateContextSelection(
    selectedModules: ContextModule[],
    allocation: TokenBudgetAllocation,
    criteria: ContextSelectionCriteria
  ): {
    isValid: boolean;
    warnings: string[];
    errors: string[];
    suggestions: string[];
  } {
    const warnings: string[] = [];
    const errors: string[] = [];
    const suggestions: string[] = [];
    
    // Check for essential modules
    const hasEssential = selectedModules.some(m => 
      m.type === 'userProfile' || m.type === 'conversationPhase'
    );
    if (!hasEssential) {
      errors.push('Missing essential context modules');
    }
    
    // Check token utilization
    const utilization = allocation.totalUsed / allocation.totalAvailable;
    if (utilization < 0.3) {
      warnings.push('Low token utilization - consider adding more context');
    } else if (utilization > 0.95) {
      warnings.push('Very high token utilization - risk of budget overflow');
    }
    
    // Check for high-value lead optimization
    if (criteria.leadScore && criteria.leadScore > 70) {
      const hasLeadScoring = selectedModules.some(m => m.type === 'leadScoring');
      if (!hasLeadScoring) {
        suggestions.push('Consider including lead scoring context for high-value prospects');
      }
    }
    
    return {
      isValid: errors.length === 0,
      warnings,
      errors,
      suggestions
    };
  }
} 