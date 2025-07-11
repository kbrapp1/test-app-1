/**
 * OpenAI Provider Types
 * 
 * Infrastructure layer types specific to OpenAI integration.
 * Single responsibility: Define OpenAI-specific data structures and configurations.
 */

import { IntentType, ExtractedEntities } from '../../../../domain/value-objects/message-processing/IntentResult';

export interface OpenAIIntentConfig {
  apiKey: string;
  model: string;
  temperature: number;
  maxTokens: number;
}

export interface OpenAIFunctionSchema {
  name: string;
  description: string;
  parameters: {
    type: string;
    properties: Record<string, any>;
    required: string[];
  };
}

export interface OpenAIRequestData {
  endpoint: string;
  method: string;
  timestamp: string;
  payload: any;
  payloadSize: string;
  messageCount: number;
  conversationHistoryLength: number;
  userMessage: string;
}

export interface OpenAIResponseData {
  timestamp: string;
  processingTime: string;
  response: any;
  responseSize: string;
}

export interface ClassificationResult {
  intent: IntentType;
  confidence: number;
  entities: ExtractedEntities;
  reasoning: string;
  alternativeIntents: Array<{ intent: IntentType; confidence: number }>;
}

export interface PersonaInference {
  role: string;
  industry: string;
  companySize: string;
  confidence: number;
  evidence: string[];
}

export interface DisambiguationContext {
  isAmbiguous: boolean;
  contextualClues: string[];
  suggestedClarifications: string[];
} 