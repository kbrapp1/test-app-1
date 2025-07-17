/**
 * Unified Result Types for Message Processing
 * 
 * Defines type-safe interfaces for AI service responses and internal data structures
 * to eliminate `any` types in chatbot widget domain services.
 */

// Core AI Analysis Response Structure
export interface UnifiedAnalysisResult {
  primaryIntent: string;
  primaryConfidence: number;
  sentiment?: 'positive' | 'neutral' | 'negative';
  emotionalTone?: string;
  entities?: UnifiedEntities;
  conversationFlow?: ConversationFlowData;
  personaInference?: PersonaInferenceData;
}

// Entity structure from AI responses
export interface UnifiedEntities {
  visitorName?: string;
  budget?: string;
  timeline?: string;
  company?: string;
  industry?: string;
  teamSize?: string;
  role?: string;
  urgency?: 'low' | 'medium' | 'high';
  contactMethod?: string;
  location?: string;
  currentSolution?: string;
  preferredTime?: string;
  sentiment?: string;
  emotionalTone?: string;
  conversationPhase?: string;
  engagementLevel?: string;
  goals?: string[];
  painPoints?: string[];
  decisionMakers?: string[];
  integrationNeeds?: string[];
  evaluationCriteria?: string[];
}

// Conversation flow analysis data
export interface ConversationFlowData {
  conversationPhase?: string;
  engagementLevel?: string;
  shouldCaptureLeadNow?: boolean;
  shouldAskQualificationQuestions?: boolean;
  shouldEscalateToHuman?: boolean;
  nextBestAction?: string;
  flowReasoning?: string;
}

// Persona inference data
export interface PersonaInferenceData {
  role?: string;
  industry?: string;
  evidence?: string[];
}

// Response structure from AI services
export interface UnifiedResponseData {
  capture_contact?: boolean;
  callToAction?: CallToActionData;
}

// Call to action structure
export interface CallToActionData {
  type: string;
  priority: 'low' | 'medium' | 'high';
  content?: string;
}

// Lead scoring data structure
export interface LeadScoringData {
  scoreBreakdown?: {
    engagementLevel?: number;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

// Complete unified result from AI processing
export interface UnifiedProcessingResult {
  analysis: UnifiedAnalysisResult;
  response: UnifiedResponseData;
  leadScore?: LeadScoringData;
  intent?: string;
  lead_data?: Record<string, unknown>;
}

// Configuration object structure
export interface ProcessingConfig {
  organizationId: string;
  name?: string;
  [key: string]: unknown;
}

// Session data structure
export interface ProcessingSession {
  id: string;
  conversationId?: string;
  contextData?: {
    accumulatedEntities?: Record<string, unknown>;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

// Enhanced context structure
export interface EnhancedProcessingContext {
  entityContextPrompt?: string;
  sharedLogFile?: string;
  unifiedAnalysis?: UnifiedAnalysisResult;
  conversationFlow?: ConversationFlowData | null;
  callToAction?: CallToActionData;
  [key: string]: unknown;
}

// Array entity types for processing
export interface ArrayEntities {
  goals: string[];
  painPoints: string[];
  decisionMakers: string[];
  integrationNeeds: string[];
  evaluationCriteria: string[];
}

// API provided data structure for output
export interface ApiProvidedData {
  entities: {
    urgency: 'low' | 'medium' | 'high';
    goals: string[];
    painPoints: string[];
    integrationNeeds: string[];
    evaluationCriteria: string[];
    company?: string;
    role?: string;
    budget?: string;
    timeline?: string;
    teamSize?: string;
    industry?: string;
    contactMethod?: string;
    visitorName?: string;
  };
  personaInference: {
    role?: string;
    industry?: string;
    evidence: string[];
  };
  leadScore: {
    scoreBreakdown: {
      engagementLevel: number;
    };
  };
}

// AI Flow decision structure
export interface AIFlowDecision {
  shouldCaptureLeadNow: boolean;
  shouldAskQualificationQuestions: boolean;
  shouldEscalateToHuman: boolean;
  nextBestAction: string;
  conversationPhase: string;
  engagementLevel: string;
  flowReasoning?: string;
}

// Lead scoring entities for readiness calculation
export interface LeadScoringEntities {
  budget?: string;
  timeline?: string;
  company?: string;
  industry?: string;
  teamSize?: string;
  urgency?: string;
  contactMethod?: string;
  role?: string;
  [key: string]: unknown;
}

// Readiness calculation context
export interface ReadinessCalculationContext {
  leadScore: number;
  entities: LeadScoringEntities;
  conversationPhase: string;
  engagementLevel: string;
}

// Accumulated entities for API processing
export interface AccumulatedEntityData {
  [key: string]: {
    value: unknown;
    confidence?: number;
  } | Array<{ value: unknown; confidence?: number }> | unknown;
}