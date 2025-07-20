/**
 * AI Configuration Value Object
 * 
 * AI INSTRUCTIONS:
 * - Coordinate AI configuration components using composition pattern
 * - Delegate specialized configuration to focused value objects
 */

import { AIConfigurationValidationService } from '../../services/ai-configuration/AIConfigurationValidationService';
import {
  OpenAIConfiguration,
  ContextConfiguration,
  IntentConfiguration,
  EntityConfiguration,
  ConversationConfiguration,
  LeadScoringConfiguration,
  MonitoringConfiguration
} from './ai-config-components';

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
  private readonly openaiConfig: OpenAIConfiguration;
  private readonly contextConfig: ContextConfiguration;
  private readonly intentConfig: IntentConfiguration;
  private readonly entityConfig: EntityConfiguration;
  private readonly conversationConfig: ConversationConfiguration;
  private readonly leadScoringConfig: LeadScoringConfiguration;
  private readonly monitoringConfig: MonitoringConfiguration;

  private constructor(private readonly props: AIConfigurationProps) {
    this.validateProps(props);
    
    // Initialize specialized configuration components
    this.openaiConfig = OpenAIConfiguration.create({
      model: props.openaiModel,
      temperature: props.openaiTemperature,
      maxTokens: props.openaiMaxTokens
    });
    
    this.contextConfig = ContextConfiguration.create({
      maxTokens: props.contextMaxTokens,
      systemPromptTokens: props.contextSystemPromptTokens,
      responseReservedTokens: props.contextResponseReservedTokens,
      summaryTokens: props.contextSummaryTokens
    });
    
    this.intentConfig = IntentConfiguration.create({
      confidenceThreshold: props.intentConfidenceThreshold,
      ambiguityThreshold: props.intentAmbiguityThreshold,
      enableMultiIntentDetection: props.enableMultiIntentDetection,
      enablePersonaInference: props.enablePersonaInference
    });
    
    this.entityConfig = EntityConfiguration.create({
      enableAdvancedEntities: props.enableAdvancedEntities,
      extractionMode: props.entityExtractionMode,
      customEntityTypes: props.customEntityTypes
    });
    
    this.conversationConfig = ConversationConfiguration.create({
      maxConversationTurns: props.maxConversationTurns,
      inactivityTimeoutSeconds: props.inactivityTimeoutSeconds,
      enableJourneyRegression: props.enableJourneyRegression,
      enableContextSwitchDetection: props.enableContextSwitchDetection
    });
    
    this.leadScoringConfig = LeadScoringConfiguration.create({
      enableAdvancedScoring: props.enableAdvancedScoring,
      entityCompletenessWeight: props.entityCompletenessWeight,
      personaConfidenceWeight: props.personaConfidenceWeight,
      journeyProgressionWeight: props.journeyProgressionWeight
    });
    
    this.monitoringConfig = MonitoringConfiguration.create({
      enablePerformanceLogging: props.enablePerformanceLogging,
      enableIntentAnalytics: props.enableIntentAnalytics,
      enablePersonaAnalytics: props.enablePersonaAnalytics,
      responseTimeThresholdMs: props.responseTimeThresholdMs
    });
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

  // Component accessors
  get openAI(): OpenAIConfiguration { return this.openaiConfig; }
  get context(): ContextConfiguration { return this.contextConfig; }
  get intent(): IntentConfiguration { return this.intentConfig; }
  get entity(): EntityConfiguration { return this.entityConfig; }
  get conversation(): ConversationConfiguration { return this.conversationConfig; }
  get leadScoring(): LeadScoringConfiguration { return this.leadScoringConfig; }
  get monitoring(): MonitoringConfiguration { return this.monitoringConfig; }

  // Removed legacy getters - use openaiConfig.model directly
  get openaiTemperature(): number { return this.openaiConfig.temperature; }
  get openaiMaxTokens(): number { return this.openaiConfig.maxTokens; }
  get contextMaxTokens(): number { return this.contextConfig.maxTokens; }
  get intentConfidenceThreshold(): number { return this.intentConfig.confidenceThreshold; }
  get enableAdvancedScoring(): boolean { return this.leadScoringConfig.enableAdvancedScoring; }

  // Configuration update methods
  updateOpenAIConfiguration(updates: Partial<{
    model: AIConfigurationProps['openaiModel'];
    temperature: number;
    maxTokens: number;
  }>): AIConfiguration {
    const newOpenAIConfig = this.openaiConfig.update(updates);
    return this.withUpdatedComponent('openai', newOpenAIConfig);
  }

  updateContextConfiguration(updates: Partial<{
    maxTokens: number;
    systemPromptTokens: number;
    responseReservedTokens: number;
    summaryTokens: number;
  }>): AIConfiguration {
    const newContextConfig = this.contextConfig.update(updates);
    return this.withUpdatedComponent('context', newContextConfig);
  }

  updateIntentConfiguration(updates: Partial<{
    confidenceThreshold: number;
    ambiguityThreshold: number;
    enableMultiIntentDetection: boolean;
    enablePersonaInference: boolean;
  }>): AIConfiguration {
    const newIntentConfig = this.intentConfig.update(updates);
    return this.withUpdatedComponent('intent', newIntentConfig);
  }

  // Business methods
  getAvailableContextTokens(): number {
    return this.contextConfig.getAvailableTokens();
  }

  isHighPerformanceMode(): boolean {
    return this.openaiConfig.isHighPerformanceModel();
  }

  toPlainObject(): AIConfigurationProps {
    return { ...this.props };
  }

  private withUpdatedComponent(
    componentType: string, 
    newComponent: OpenAIConfiguration | ContextConfiguration | IntentConfiguration
  ): AIConfiguration {
    const newProps = { ...this.props };
    
    switch (componentType) {
      case 'openai':
        const openaiComp = newComponent as OpenAIConfiguration;
        newProps.openaiModel = openaiComp.model as AIConfigurationProps['openaiModel'];
        newProps.openaiTemperature = openaiComp.temperature;
        newProps.openaiMaxTokens = openaiComp.maxTokens;
        break;
      case 'context':
        const contextComp = newComponent as ContextConfiguration;
        newProps.contextMaxTokens = contextComp.maxTokens;
        newProps.contextSystemPromptTokens = contextComp.systemPromptTokens;
        newProps.contextResponseReservedTokens = contextComp.responseReservedTokens;
        newProps.contextSummaryTokens = contextComp.summaryTokens;
        break;
      case 'intent':
        const intentComp = newComponent as IntentConfiguration;
        newProps.intentConfidenceThreshold = intentComp.confidenceThreshold;
        newProps.intentAmbiguityThreshold = intentComp.ambiguityThreshold;
        newProps.enableMultiIntentDetection = intentComp.enableMultiIntentDetection;
        newProps.enablePersonaInference = intentComp.enablePersonaInference;
        break;
    }
    
    return new AIConfiguration(newProps);
  }
} 