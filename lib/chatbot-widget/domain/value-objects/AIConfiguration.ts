/**
 * AI Configuration Value Object
 * 
 * Domain layer value object representing chatbot AI settings and parameters.
 * Immutable object that encapsulates AI-related configuration and validation.
 */

import { AIConfigurationValidationService } from '../services/AIConfigurationValidationService';

export interface AIConfigurationProps {
  // OpenAI Configuration
  openaiModel: 'gpt-4o' | 'gpt-4o-mini' | 'gpt-4-turbo' | 'gpt-3.5-turbo';
  openaiTemperature: number;
  openaiMaxTokens: number;
  
  // Context Window Configuration
  contextMaxTokens: number;
  contextSystemPromptTokens: number;
  contextResponseReservedTokens: number;
  contextSummaryTokens: number;
  
  // Intent Classification
  intentConfidenceThreshold: number;
  intentAmbiguityThreshold: number;
  enableMultiIntentDetection: boolean;
  enablePersonaInference: boolean;
  
  // Entity Extraction
  enableAdvancedEntities: boolean;
  entityExtractionMode: 'basic' | 'comprehensive' | 'custom';
  customEntityTypes: string[];
  
  // Conversation Flow
  maxConversationTurns: number;
  inactivityTimeoutSeconds: number;
  enableJourneyRegression: boolean;
  enableContextSwitchDetection: boolean;
  
  // Lead Scoring
  enableAdvancedScoring: boolean;
  entityCompletenessWeight: number;
  personaConfidenceWeight: number;
  journeyProgressionWeight: number;
  
  // Performance & Monitoring
  enablePerformanceLogging: boolean;
  enableIntentAnalytics: boolean;
  enablePersonaAnalytics: boolean;
  responseTimeThresholdMs: number;
}

export class AIConfiguration {
  private constructor(private readonly props: AIConfigurationProps) {
    this.validateProps(props);
  }

  static create(props: AIConfigurationProps): AIConfiguration {
    return new AIConfiguration(props);
  }

  static createDefault(): AIConfiguration {
    return new AIConfiguration({
      // OpenAI Configuration
      openaiModel: 'gpt-4o-mini', // Default to mini per user preference
      openaiTemperature: 0.3,
      openaiMaxTokens: 1000,
      
      // Context Window Configuration
      contextMaxTokens: 12000,
      contextSystemPromptTokens: 500,
      contextResponseReservedTokens: 3000,
      contextSummaryTokens: 200,
      
      // Intent Classification
      intentConfidenceThreshold: 0.7,
      intentAmbiguityThreshold: 0.2,
      enableMultiIntentDetection: true,
      enablePersonaInference: true,
      
      // Entity Extraction
      enableAdvancedEntities: true,
      entityExtractionMode: 'comprehensive',
      customEntityTypes: [],
      
      // Conversation Flow
      maxConversationTurns: 20,
      inactivityTimeoutSeconds: 300,
      enableJourneyRegression: true,
      enableContextSwitchDetection: true,
      
      // Lead Scoring
      enableAdvancedScoring: true,
      entityCompletenessWeight: 0.3,
      personaConfidenceWeight: 0.2,
      journeyProgressionWeight: 0.25,
      
      // Performance & Monitoring
      enablePerformanceLogging: true,
      enableIntentAnalytics: true,
      enablePersonaAnalytics: true,
      responseTimeThresholdMs: 2000,
    });
  }

  private validateProps(props: AIConfigurationProps): void {
    AIConfigurationValidationService.validateProps(props);
  }

  // Getters
  get openaiModel(): string { return this.props.openaiModel; }
  get openaiTemperature(): number { return this.props.openaiTemperature; }
  get openaiMaxTokens(): number { return this.props.openaiMaxTokens; }
  get contextMaxTokens(): number { return this.props.contextMaxTokens; }
  get contextSystemPromptTokens(): number { return this.props.contextSystemPromptTokens; }
  get contextResponseReservedTokens(): number { return this.props.contextResponseReservedTokens; }
  get contextSummaryTokens(): number { return this.props.contextSummaryTokens; }
  get intentConfidenceThreshold(): number { return this.props.intentConfidenceThreshold; }
  get intentAmbiguityThreshold(): number { return this.props.intentAmbiguityThreshold; }
  get enableMultiIntentDetection(): boolean { return this.props.enableMultiIntentDetection; }
  get enablePersonaInference(): boolean { return this.props.enablePersonaInference; }
  get enableAdvancedEntities(): boolean { return this.props.enableAdvancedEntities; }
  get entityExtractionMode(): string { return this.props.entityExtractionMode; }
  get customEntityTypes(): string[] { return [...this.props.customEntityTypes]; }
  get maxConversationTurns(): number { return this.props.maxConversationTurns; }
  get inactivityTimeoutSeconds(): number { return this.props.inactivityTimeoutSeconds; }
  get enableJourneyRegression(): boolean { return this.props.enableJourneyRegression; }
  get enableContextSwitchDetection(): boolean { return this.props.enableContextSwitchDetection; }
  get enableAdvancedScoring(): boolean { return this.props.enableAdvancedScoring; }
  get entityCompletenessWeight(): number { return this.props.entityCompletenessWeight; }
  get personaConfidenceWeight(): number { return this.props.personaConfidenceWeight; }
  get journeyProgressionWeight(): number { return this.props.journeyProgressionWeight; }
  get enablePerformanceLogging(): boolean { return this.props.enablePerformanceLogging; }
  get enableIntentAnalytics(): boolean { return this.props.enableIntentAnalytics; }
  get enablePersonaAnalytics(): boolean { return this.props.enablePersonaAnalytics; }
  get responseTimeThresholdMs(): number { return this.props.responseTimeThresholdMs; }

  // Business methods
  updateOpenAIModel(model: AIConfigurationProps['openaiModel']): AIConfiguration {
    return new AIConfiguration({
      ...this.props,
      openaiModel: model,
    });
  }

  updateTemperature(temperature: number): AIConfiguration {
    return new AIConfiguration({
      ...this.props,
      openaiTemperature: temperature,
    });
  }

  updateMaxTokens(maxTokens: number): AIConfiguration {
    return new AIConfiguration({
      ...this.props,
      openaiMaxTokens: maxTokens,
    });
  }

  updateContextConfiguration(config: {
    maxTokens?: number;
    systemPromptTokens?: number;
    responseReservedTokens?: number;
    summaryTokens?: number;
  }): AIConfiguration {
    return new AIConfiguration({
      ...this.props,
      contextMaxTokens: config.maxTokens ?? this.props.contextMaxTokens,
      contextSystemPromptTokens: config.systemPromptTokens ?? this.props.contextSystemPromptTokens,
      contextResponseReservedTokens: config.responseReservedTokens ?? this.props.contextResponseReservedTokens,
      contextSummaryTokens: config.summaryTokens ?? this.props.contextSummaryTokens,
    });
  }

  updateIntentConfiguration(config: {
    confidenceThreshold?: number;
    ambiguityThreshold?: number;
    enableMultiIntent?: boolean;
    enablePersonaInference?: boolean;
  }): AIConfiguration {
    return new AIConfiguration({
      ...this.props,
      intentConfidenceThreshold: config.confidenceThreshold ?? this.props.intentConfidenceThreshold,
      intentAmbiguityThreshold: config.ambiguityThreshold ?? this.props.intentAmbiguityThreshold,
      enableMultiIntentDetection: config.enableMultiIntent ?? this.props.enableMultiIntentDetection,
      enablePersonaInference: config.enablePersonaInference ?? this.props.enablePersonaInference,
    });
  }

  addCustomEntityType(entityType: string): AIConfiguration {
    if (this.props.customEntityTypes.includes(entityType)) {
      return this;
    }

    return new AIConfiguration({
      ...this.props,
      customEntityTypes: [...this.props.customEntityTypes, entityType],
    });
  }

  removeCustomEntityType(entityType: string): AIConfiguration {
    return new AIConfiguration({
      ...this.props,
      customEntityTypes: this.props.customEntityTypes.filter(type => type !== entityType),
    });
  }

  updateLeadScoringWeights(weights: {
    entityCompleteness?: number;
    personaConfidence?: number;
    journeyProgression?: number;
  }): AIConfiguration {
    return new AIConfiguration({
      ...this.props,
      entityCompletenessWeight: weights.entityCompleteness ?? this.props.entityCompletenessWeight,
      personaConfidenceWeight: weights.personaConfidence ?? this.props.personaConfidenceWeight,
      journeyProgressionWeight: weights.journeyProgression ?? this.props.journeyProgressionWeight,
    });
  }

  enableFeature(feature: 'advancedEntities' | 'journeyRegression' | 'contextSwitchDetection' | 'advancedScoring' | 'performanceLogging' | 'intentAnalytics' | 'personaAnalytics'): AIConfiguration {
    const updates: Partial<AIConfigurationProps> = {};
    
    switch (feature) {
      case 'advancedEntities':
        updates.enableAdvancedEntities = true;
        break;
      case 'journeyRegression':
        updates.enableJourneyRegression = true;
        break;
      case 'contextSwitchDetection':
        updates.enableContextSwitchDetection = true;
        break;
      case 'advancedScoring':
        updates.enableAdvancedScoring = true;
        break;
      case 'performanceLogging':
        updates.enablePerformanceLogging = true;
        break;
      case 'intentAnalytics':
        updates.enableIntentAnalytics = true;
        break;
      case 'personaAnalytics':
        updates.enablePersonaAnalytics = true;
        break;
    }

    return new AIConfiguration({
      ...this.props,
      ...updates,
    });
  }

  disableFeature(feature: 'advancedEntities' | 'journeyRegression' | 'contextSwitchDetection' | 'advancedScoring' | 'performanceLogging' | 'intentAnalytics' | 'personaAnalytics'): AIConfiguration {
    const updates: Partial<AIConfigurationProps> = {};
    
    switch (feature) {
      case 'advancedEntities':
        updates.enableAdvancedEntities = false;
        break;
      case 'journeyRegression':
        updates.enableJourneyRegression = false;
        break;
      case 'contextSwitchDetection':
        updates.enableContextSwitchDetection = false;
        break;
      case 'advancedScoring':
        updates.enableAdvancedScoring = false;
        break;
      case 'performanceLogging':
        updates.enablePerformanceLogging = false;
        break;
      case 'intentAnalytics':
        updates.enableIntentAnalytics = false;
        break;
      case 'personaAnalytics':
        updates.enablePersonaAnalytics = false;
        break;
    }

    return new AIConfiguration({
      ...this.props,
      ...updates,
    });
  }

  getAvailableContextTokens(): number {
    return this.props.contextMaxTokens - 
           this.props.contextSystemPromptTokens - 
           this.props.contextResponseReservedTokens - 
           this.props.contextSummaryTokens;
  }

  isHighPerformanceMode(): boolean {
    return this.props.openaiModel === 'gpt-4o' || this.props.openaiModel === 'gpt-4-turbo';
  }

  toPlainObject(): AIConfigurationProps {
    return { ...this.props };
  }
} 