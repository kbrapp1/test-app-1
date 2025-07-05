/**
 * Context Injection Service - DDD Refactored
 * 
 * AI INSTRUCTIONS:
 * - Clean facade using new DDD architecture
 * - Delegates to ContextInjectionServiceFacade for all operations
 * - Maintains interface compatibility
 * - Follow @golden-rule patterns exactly
 * - Under 250 lines by delegating to specialized services
 */

import { ChatSession } from '../../entities/ChatSession';
import { ChatbotConfig } from '../../entities/ChatbotConfig';
import { ChatMessage } from '../../entities/ChatMessage';
import { ContextInjectionServiceFacade } from '../../../application/services/ContextInjectionServiceFacade';
import {
  ContextModule,
  EntityData,
  ModulePriority,
  SelectedModules
} from '../interfaces/ContextInjectionTypes';

export class ContextInjectionService {
  private facade: ContextInjectionServiceFacade;

  constructor() {
    this.facade = new ContextInjectionServiceFacade();
  }

  /**
   * Main entry point for context module selection
   * 
   * AI INSTRUCTIONS:
   * - Delegate to facade service
   * - Maintain backward compatibility
   * - Keep interface clean and simple
   */
  static selectContextModules(
    session: ChatSession, 
    chatbotConfig: ChatbotConfig, 
    availableTokens: number,
    conversationHistory?: ChatMessage[],
    entityData?: EntityData,
    leadScore?: number,
    qualificationStatus?: string
  ): Promise<ContextModule[]> {
    const service = new ContextInjectionService();
    return service.facade.selectContextModules(
      session,
      chatbotConfig,
      availableTokens,
      conversationHistory,
      entityData,
      leadScore,
      qualificationStatus
    );
  }

  /**
   * Get recommended token budget
   * 
   * AI INSTRUCTIONS:
   * - Delegate to facade for budget calculation
   * - Provide simple interface for recommendations
   */
  static async getRecommendedTokenBudget(
    messageCount: number,
    entityData?: EntityData,
    leadScore?: number
  ): Promise<{ recommended: number; minimum: number; maximum: number }> {
    const service = new ContextInjectionService();
    const result = await service.facade.getRecommendedTokenBudget(
      messageCount,
      entityData,
      leadScore
    );
    
    return {
      recommended: result.recommended,
      minimum: result.minimum,
      maximum: result.maximum
    };
  }

  /**
   * Optimize for conversation phase
   * 
   * AI INSTRUCTIONS:
   * - Use phase-specific optimization
   * - Delegate to facade for specialized handling
   */
  static async optimizeForPhase(
    session: ChatSession,
    chatbotConfig: ChatbotConfig,
    phase: 'greeting' | 'qualification' | 'demonstration' | 'closing',
    availableTokens: number,
    conversationHistory?: ChatMessage[],
    entityData?: EntityData,
    leadScore?: number
  ): Promise<ContextModule[]> {
    const service = new ContextInjectionService();
    return service.facade.optimizeForConversationPhase(
      session,
      chatbotConfig,
      phase,
      availableTokens,
      conversationHistory,
      entityData,
      leadScore
    );
  }

  /**
   * Generate context content from modules
   * 
   * AI INSTRUCTIONS:
   * - Convert modules to usable content strings
   * - Handle content generation safely
   */
  static generateContextContent(modules: ContextModule[]): string[] {
    const service = new ContextInjectionService();
    return service.facade.generateContextContent(modules);
  }

  /**
   * Legacy method support for backward compatibility
   * 
   * AI INSTRUCTIONS:
   * - Support old interface patterns
   * - Map to new DDD architecture
   * - Maintain functionality while improving structure
   */
  calculatePriorityScores(
    conversationHistory: ChatMessage[],
    entityData: EntityData,
    leadScore: number
  ): ModulePriority {
    // Simple mapping to new architecture
    const messageCount = conversationHistory.length;
    
    if (messageCount <= 2) {
      return {
        corePersona: 1.0,
        highPriorityContext: 0.2,
        progressionModules: 0.1,
        realTimeContext: 0.5
      };
    }
    
    const hasComplexEntities = Object.keys(entityData).length > 3;
    const isHighValueLead = leadScore > 60;
    const conversationDepth = Math.min(messageCount / 10, 1);
    
    return {
      corePersona: 1.0,
      highPriorityContext: hasComplexEntities ? 0.9 : 0.4,
      progressionModules: isHighValueLead ? 0.8 : 0.3,
      realTimeContext: 0.6 + (conversationDepth * 0.3)
    };
  }

  /**
   * Legacy method for module selection
   * 
   * AI INSTRUCTIONS:
   * - Support old selection patterns
   * - Map to new token budget service
   * - Maintain backward compatibility
   */
  selectModulesForBudget(
    priorities: ModulePriority,
    tokenBudget: number,
    conversationHistory: ChatMessage[]
  ): SelectedModules {
    // For greetings and early conversation, use minimal modules
    if (conversationHistory.length <= 2) {
      return {
        corePersona: true,
        highPriorityContext: false,
        progressionModules: false,
        realTimeContext: true,
        estimatedTokens: 900
      };
    }
    
    const baseTokens = 800;
    let currentTokens = baseTokens;
    
    const selected: SelectedModules = {
      corePersona: true,
      highPriorityContext: false,
      progressionModules: false,
      realTimeContext: false,
      estimatedTokens: baseTokens
    };
    
    if (currentTokens + 400 <= tokenBudget && priorities.highPriorityContext > 0.6) {
      selected.highPriorityContext = true;
      currentTokens += 400;
    }
    
    if (currentTokens + 400 <= tokenBudget && priorities.progressionModules > 0.6) {
      selected.progressionModules = true;
      currentTokens += 400;
    }
    
    if (currentTokens + 300 <= tokenBudget && priorities.realTimeContext > 0.5) {
      selected.realTimeContext = true;
      currentTokens += 300;
    }
    
    selected.estimatedTokens = currentTokens;
    return selected;
  }
}

// Export types for backward compatibility
export type { ContextModule, EntityData, ModulePriority, SelectedModules }; 