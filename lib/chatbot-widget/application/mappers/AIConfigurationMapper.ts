/**
 * AI Configuration Mapper
 * 
 * AI INSTRUCTIONS:
 * - Handles bidirectional mapping between AIConfiguration domain value objects and DTOs
 * - Manages complex AI settings, model configurations, and performance parameters
 * - Maintains DDD principle: Clean transformation preserving AI configuration integrity
 * - Supports OpenAI model settings, context management, and monitoring configurations
 */

import { AIConfiguration } from '../../domain/value-objects/ai-configuration/AIConfiguration';
import { AIConfigurationDto } from '../dto/ChatbotConfigDto';

export class AIConfigurationMapper {
  static toDto(aiConfig: AIConfiguration): AIConfigurationDto {
    return {
      openaiModel: aiConfig.openAI.model,
      openaiTemperature: aiConfig.openaiTemperature,
      openaiMaxTokens: aiConfig.openaiMaxTokens,
      contextMaxTokens: aiConfig.contextMaxTokens,
      contextSystemPromptTokens: aiConfig.context.systemPromptTokens,
      contextResponseReservedTokens: aiConfig.context.responseReservedTokens,
      contextSummaryTokens: aiConfig.context.summaryTokens,
      intentConfidenceThreshold: aiConfig.intentConfidenceThreshold,
      intentAmbiguityThreshold: aiConfig.intent.ambiguityThreshold,
      enableMultiIntentDetection: aiConfig.intent.enableMultiIntentDetection,
      enablePersonaInference: aiConfig.intent.enablePersonaInference,
      enableAdvancedEntities: aiConfig.entity.enableAdvancedEntities,
      entityExtractionMode: aiConfig.entity.extractionMode,
      customEntityTypes: aiConfig.entity.customEntityTypes,
      maxConversationTurns: aiConfig.conversation.maxConversationTurns,
      inactivityTimeoutSeconds: aiConfig.conversation.inactivityTimeoutSeconds,
      enableJourneyRegression: aiConfig.conversation.enableJourneyRegression,
      enableContextSwitchDetection: aiConfig.conversation.enableContextSwitchDetection,
      enableAdvancedScoring: aiConfig.enableAdvancedScoring,
      entityCompletenessWeight: aiConfig.leadScoring.entityCompletenessWeight,
      personaConfidenceWeight: aiConfig.leadScoring.personaConfidenceWeight,
      journeyProgressionWeight: aiConfig.leadScoring.journeyProgressionWeight,
      enablePerformanceLogging: aiConfig.monitoring.enablePerformanceLogging,
      enableIntentAnalytics: aiConfig.monitoring.enableIntentAnalytics,
      enablePersonaAnalytics: aiConfig.monitoring.enablePersonaAnalytics,
      responseTimeThresholdMs: aiConfig.monitoring.responseTimeThresholdMs,
    };
  }

  static fromDto(dto: AIConfigurationDto): AIConfiguration {
    return AIConfiguration.create({
      openaiModel: dto.openaiModel as 'gpt-4o' | 'gpt-4o-mini' | 'gpt-4-turbo' | 'gpt-3.5-turbo',
      openaiTemperature: dto.openaiTemperature,
      openaiMaxTokens: dto.openaiMaxTokens,
      contextMaxTokens: dto.contextMaxTokens,
      contextSystemPromptTokens: dto.contextSystemPromptTokens,
      contextResponseReservedTokens: dto.contextResponseReservedTokens,
      contextSummaryTokens: dto.contextSummaryTokens,
      intentConfidenceThreshold: dto.intentConfidenceThreshold,
      intentAmbiguityThreshold: dto.intentAmbiguityThreshold,
      enableMultiIntentDetection: dto.enableMultiIntentDetection,
      enablePersonaInference: dto.enablePersonaInference,
      enableAdvancedEntities: dto.enableAdvancedEntities,
      entityExtractionMode: dto.entityExtractionMode as 'basic' | 'comprehensive' | 'custom',
      customEntityTypes: dto.customEntityTypes,
      maxConversationTurns: dto.maxConversationTurns,
      inactivityTimeoutSeconds: dto.inactivityTimeoutSeconds,
      enableJourneyRegression: dto.enableJourneyRegression,
      enableContextSwitchDetection: dto.enableContextSwitchDetection,
      enableAdvancedScoring: dto.enableAdvancedScoring,
      entityCompletenessWeight: dto.entityCompletenessWeight,
      personaConfidenceWeight: dto.personaConfidenceWeight,
      journeyProgressionWeight: dto.journeyProgressionWeight,
      enablePerformanceLogging: dto.enablePerformanceLogging,
      enableIntentAnalytics: dto.enableIntentAnalytics,
      enablePersonaAnalytics: dto.enablePersonaAnalytics,
      responseTimeThresholdMs: dto.responseTimeThresholdMs,
    });
  }
}
