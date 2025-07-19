/**
 * Workflow Types and Interfaces
 * 
 * AI INSTRUCTIONS:
 * - Centralized type definitions for message processing workflow
 * - Maintains consistent data contracts across workflow components
 * - Supports DDD principle: Clear boundary definitions for application layer
 */

export interface ResponseResult {
  session: ChatSession;
  userMessage: ChatMessage;
  botMessage: ChatMessage;
  allMessages: ChatMessage[];
  config: ChatbotConfig;
  enhancedContext: EnhancedContext;
}

export interface UnifiedAnalysis {
  primaryIntent?: string;
  primaryConfidence?: number;
  entities?: Record<string, unknown>;
}

export interface LeadScore {
  totalScore: number;
  qualificationStatus?: {
    readyForSales?: boolean;
    nextSteps?: string[];
  };
}

export interface CallToAction {
  type: string;
  message: string;
  priority: string;
}

export interface EnhancedContext {
  intentAnalysis?: IntentAnalysis;
  journeyState?: JourneyState;
  relevantKnowledge?: RelevantKnowledge;
  conversationMetrics?: ConversationMetrics;
  unifiedAnalysis?: UnifiedAnalysis;
  leadScore?: LeadScore;
  callToAction?: CallToAction;
  [key: string]: unknown;
}

export interface MessageMetadata {
  userAgent?: string;
  ipAddress?: string;
  timestamp?: Date;
  referrer?: string;
  deviceType?: 'desktop' | 'mobile' | 'tablet';
  [key: string]: unknown;
}

export interface ProcessMessageRequest {
  userMessage: string;
  sessionId: string;
  organizationId: string; // AI: Required - should never be undefined
  metadata?: MessageMetadata;
}

export interface WorkflowContext {
  session: ChatSession;
  config: ChatbotConfig;
  userMessage: ChatMessage;
}

export interface ConversationMetrics {
  messageCount: number;
  sessionDuration: number;
  engagementScore: number;
  leadQualificationProgress: number;
}

export interface IntentAnalysis {
  primaryIntent: string;
  confidence: number;
  entities: Array<{ name: string; value: string; confidence: number }>;
  followUpIntents: string[];
}

export interface JourneyState {
  currentStage: string;
  completedStages: string[];
  nextRecommendedStage?: string;
  progressPercentage: number;
}

export interface RelevantKnowledge {
  items: Array<{
    title: string;
    content: string;
    relevanceScore: number;
    source: string;
  }>;
  totalMatches: number;
}

export interface WorkflowFinalResult {
  session: ChatSession;
  userMessage: ChatMessage;
  botMessage: ChatMessage;
  shouldCaptureLeadInfo: boolean;
  suggestedNextActions: string[];
  conversationMetrics: ConversationMetrics;
  intentAnalysis?: IntentAnalysis;
  journeyState?: JourneyState;
  relevantKnowledge?: RelevantKnowledge;
  callToAction?: {
    type: string;
    message: string;
    priority: string;
  };
}

// Import dependencies for type definitions
import { ChatSession } from '../../../domain/entities/ChatSession';
import { ChatMessage } from '../../../domain/entities/ChatMessage';
import { ChatbotConfig } from '../../../domain/entities/ChatbotConfig';