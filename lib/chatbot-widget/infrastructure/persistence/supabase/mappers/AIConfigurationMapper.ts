/**
 * AI Configuration Infrastructure Mapper
 * 
 * Infrastructure layer mapper for AIConfiguration value object.
 * Handles JSONB transformation for AI model settings and parameters.
 */

import { AIConfiguration } from '../../../../domain/value-objects/ai-configuration/AIConfiguration';

/**
 * Infrastructure mapper for AIConfiguration JSONB data
 * Handles AI model parameters with proper validation and defaults
 */
export class AIConfigurationMapper {
  
  /**
   * Map JSONB AI configuration data to domain value object
   * Infrastructure operation: JSONB to domain object transformation
   */
  static fromJsonb(data: unknown): AIConfiguration {
    if (!data) {
      return AIConfiguration.createDefault();
    }
    
    const config = data as Record<string, unknown>;
    
    return AIConfiguration.create({
      openaiModel: (config?.openaiModel as 'gpt-4o-mini' | 'gpt-4o' | 'gpt-4-turbo' | 'gpt-3.5-turbo') || 'gpt-4o-mini',
      openaiTemperature: (config?.openaiTemperature as number) || 0.3,
      openaiMaxTokens: (config?.openaiMaxTokens as number) || 1000,
      contextMaxTokens: (config?.contextMaxTokens as number) || 12000,
      contextSystemPromptTokens: (config?.contextSystemPromptTokens as number) || 500,
      contextResponseReservedTokens: (config?.contextResponseReservedTokens as number) || 3000,
      contextSummaryTokens: (config?.contextSummaryTokens as number) || 200,
      intentConfidenceThreshold: (config?.intentConfidenceThreshold as number) || 0.7,
      intentAmbiguityThreshold: (config?.intentAmbiguityThreshold as number) || 0.2,
      enableMultiIntentDetection: (config?.enableMultiIntentDetection as boolean) !== false, // Default true
      enablePersonaInference: (config?.enablePersonaInference as boolean) !== false, // Default true
      enableAdvancedEntities: (config?.enableAdvancedEntities as boolean) !== false, // Default true
      entityExtractionMode: (config?.entityExtractionMode as 'comprehensive' | 'basic' | 'custom') || 'comprehensive',
      customEntityTypes: (config?.customEntityTypes as string[]) || [],
      maxConversationTurns: (config?.maxConversationTurns as number) || 20,
      inactivityTimeoutSeconds: (config?.inactivityTimeoutSeconds as number) || 300,
      enableJourneyRegression: (config?.enableJourneyRegression as boolean) !== false, // Default true
      enableContextSwitchDetection: (config?.enableContextSwitchDetection as boolean) !== false, // Default true
      enableAdvancedScoring: (config?.enableAdvancedScoring as boolean) !== false, // Default true
      entityCompletenessWeight: (config?.entityCompletenessWeight as number) || 0.3,
      personaConfidenceWeight: (config?.personaConfidenceWeight as number) || 0.2,
      journeyProgressionWeight: (config?.journeyProgressionWeight as number) || 0.25,
      enablePerformanceLogging: (config?.enablePerformanceLogging as boolean) !== false, // Default true
      enableIntentAnalytics: (config?.enableIntentAnalytics as boolean) !== false, // Default true
      enablePersonaAnalytics: (config?.enablePersonaAnalytics as boolean) !== false, // Default true
      responseTimeThresholdMs: (config?.responseTimeThresholdMs as number) || 2000,
    });
  }

  /**
   * Map domain AIConfiguration to JSONB data
   * Infrastructure operation: domain object to JSONB transformation
   */
  static toJsonb(aiConfiguration: AIConfiguration): unknown {
    return aiConfiguration.toPlainObject();
  }
}