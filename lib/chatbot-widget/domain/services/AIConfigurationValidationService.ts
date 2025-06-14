/**
 * AI Configuration Validation Service
 * 
 * Domain service responsible for validating AI configuration parameters.
 * Single responsibility: Validate AI configuration business rules.
 */

import { AIConfigurationProps } from '../value-objects/AIConfiguration';

export class AIConfigurationValidationService {
  static validateProps(props: AIConfigurationProps): void {
    this.validateOpenAIConfiguration(props);
    this.validateContextConfiguration(props);
    this.validateIntentConfiguration(props);
    this.validateEntityConfiguration(props);
    this.validateConversationConfiguration(props);
    this.validateLeadScoringConfiguration(props);
    this.validatePerformanceConfiguration(props);
  }

  private static validateOpenAIConfiguration(props: AIConfigurationProps): void {
    if (!props.openaiModel) {
      throw new Error('OpenAI model is required');
    }
    if (props.openaiTemperature < 0 || props.openaiTemperature > 2) {
      throw new Error('OpenAI temperature must be between 0 and 2');
    }
    if (props.openaiMaxTokens < 1 || props.openaiMaxTokens > 4000) {
      throw new Error('OpenAI max tokens must be between 1 and 4000');
    }
  }

  private static validateContextConfiguration(props: AIConfigurationProps): void {
    if (props.contextMaxTokens < 1000) {
      throw new Error('Context max tokens must be at least 1000');
    }
    if (props.contextSystemPromptTokens < 100) {
      throw new Error('Context system prompt tokens must be at least 100');
    }
    if (props.contextResponseReservedTokens < 500) {
      throw new Error('Context response reserved tokens must be at least 500');
    }
  }

  private static validateIntentConfiguration(props: AIConfigurationProps): void {
    if (props.intentConfidenceThreshold < 0 || props.intentConfidenceThreshold > 1) {
      throw new Error('Intent confidence threshold must be between 0 and 1');
    }
    if (props.intentAmbiguityThreshold < 0 || props.intentAmbiguityThreshold > 1) {
      throw new Error('Intent ambiguity threshold must be between 0 and 1');
    }
  }

  private static validateEntityConfiguration(props: AIConfigurationProps): void {
    if (!Array.isArray(props.customEntityTypes)) {
      throw new Error('Custom entity types must be an array');
    }
  }

  private static validateConversationConfiguration(props: AIConfigurationProps): void {
    if (props.maxConversationTurns < 1) {
      throw new Error('Max conversation turns must be at least 1');
    }
    if (props.inactivityTimeoutSeconds < 30) {
      throw new Error('Inactivity timeout must be at least 30 seconds');
    }
  }

  private static validateLeadScoringConfiguration(props: AIConfigurationProps): void {
    if (props.entityCompletenessWeight < 0 || props.entityCompletenessWeight > 1) {
      throw new Error('Entity completeness weight must be between 0 and 1');
    }
    if (props.personaConfidenceWeight < 0 || props.personaConfidenceWeight > 1) {
      throw new Error('Persona confidence weight must be between 0 and 1');
    }
    if (props.journeyProgressionWeight < 0 || props.journeyProgressionWeight > 1) {
      throw new Error('Journey progression weight must be between 0 and 1');
    }
  }

  private static validatePerformanceConfiguration(props: AIConfigurationProps): void {
    if (props.responseTimeThresholdMs < 100) {
      throw new Error('Response time threshold must be at least 100ms');
    }
  }
} 