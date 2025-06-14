/**
 * Advanced Parameters Types
 * 
 * Presentation layer types for advanced chatbot configuration parameters.
 * These types are specific to the UI layer and separate from domain entities.
 */

export interface AdvancedParameters {
  // OpenAI Configuration
  openaiModel: string;
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

export interface ParameterUpdateHandler {
  <K extends keyof AdvancedParameters>(key: K, value: AdvancedParameters[K]): void;
}

export interface ParameterSectionProps {
  parameters: AdvancedParameters;
  updateParameter: ParameterUpdateHandler;
  isEditing: boolean;
}

export interface TabConfig {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
} 