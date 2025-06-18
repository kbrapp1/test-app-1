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

/**
 * Analysis result from OpenAI service
 */
export interface AnalysisResult {
  intent: {
    primaryIntent: string;
    primaryConfidence: number;
    reasoning: string;
    alternativeIntents?: any[];
  };
  entities: any;
  corrections: any;
  persona: any;
  processingTime: number;
}

/**
 * Complete chatbot interaction processing context
 */
export interface ChatbotProcessingContext {
  messageHistory: ChatMessage[];
  sessionId: string;
  organizationId?: string;
  userData?: any;
  systemPrompt?: string;
  sharedLogFile?: string;
}

/**
 * Complete chatbot interaction result
 */
export interface ChatbotProcessingResult {
  analysis: {
    primaryIntent: string;
    primaryConfidence: number;
    entities: any;
    personaInference?: any;
    corrections?: any;
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

/**
 * Message analysis context for detailed analysis
 */
export interface MessageAnalysisContext {
  messageHistory?: ChatMessage[];
  defaultConfidence?: number;
} 