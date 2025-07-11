/**
 * OpenAI Intent Classification Types
 * 
 * AI INSTRUCTIONS:
 * - Extract complex type definitions from main service
 * - Follow @golden-rule.mdc: organize types for readability
 * - Single responsibility: Define intent classification data structures
 * - Maintain backward compatibility with existing callers
 */

import { ChatMessage } from '../../../../domain/entities/ChatMessage';
import { ExtractedEntities } from '../../../../domain/value-objects/message-processing/IntentResult';
import { PersonaInference } from './OpenAITypes';

/** Analysis result from OpenAI service
 */
export interface AnalysisResult {
  intent: {
    primaryIntent: string;
    primaryConfidence: number;
    reasoning: string;
    alternativeIntents?: Array<{ intent: string; confidence: number }>;
  };
  entities: ExtractedEntities;
  corrections: Record<string, unknown>;
  persona: PersonaInference;
  processingTime: number;
}

/** Complete chatbot interaction processing context
 */
export interface ChatbotProcessingContext {
  messageHistory: ChatMessage[];
  sessionId: string;
  organizationId?: string;
  userData?: Record<string, unknown>;
  systemPrompt?: string;
  sharedLogFile?: string;
}

/** Complete chatbot interaction result
 */
export interface ChatbotProcessingResult {
  analysis: {
    primaryIntent: string;
    primaryConfidence: number;
    entities: ExtractedEntities;
    personaInference?: PersonaInference;
    corrections?: Record<string, unknown>;
    reasoning: string;
  };
  leadScore: {
    totalScore: number;
    scoreBreakdown: {
      intentQuality: number;
      entityCompleteness: number;
      personaFit: number;
      engagementLevel: number;
    };
    scoringReasoning: string;
    qualificationStatus: {
      isQualified: boolean;
      readyForSales: boolean;
      qualificationLevel: 'low' | 'medium' | 'high';
    };
  };
  response: {
    content: string;
    tone: string;
    callToAction?: string;
    shouldTriggerLeadCapture: boolean;
    personalization?: string;
  };
}

/** Message analysis context for detailed analysis
 */
export interface MessageAnalysisContext {
  messageHistory?: ChatMessage[];
  defaultConfidence?: number;
} 