/**
 * Workflow Orchestration Types
 * 
 * AI INSTRUCTIONS:
 * - Define all workflow orchestration interfaces and types
 * - Keep types focused and single-purpose
 * - Use readonly properties where appropriate
 * - Maintain type safety across workflow boundaries
 */

import { ChatMessage } from '../../domain/entities/ChatMessage';
import { ChatSession } from '../../domain/entities/ChatSession';
import { ChatbotConfig } from '../../domain/entities/ChatbotConfig';

// Core workflow data structures
export interface WorkflowResponseResult {
  readonly session: ChatSession;
  readonly userMessage: ChatMessage;
  readonly botMessage: ChatMessage;
  readonly allMessages: ChatMessage[];
  readonly config: ChatbotConfig;
  readonly enhancedContext: {
    readonly intentAnalysis?: {
      readonly primaryIntent: string;
      readonly confidence: number;
      readonly entities: Array<{ readonly name: string; readonly value: string; readonly confidence: number }>;
      readonly followUpIntents: string[];
    };
    readonly journeyState?: {
      readonly currentStage: string;
      readonly completedStages: string[];
      readonly nextRecommendedStage?: string;
      readonly progressPercentage: number;
    };
    readonly relevantKnowledge?: {
      readonly items: Array<{
        readonly title: string;
        readonly content: string;
        readonly relevanceScore: number;
        readonly source: string;
      }>;
      readonly totalMatches: number;
    };
    readonly conversationMetrics?: {
      readonly messageCount: number;
      readonly sessionDuration: number;
      readonly engagementScore: number;
      readonly leadQualificationProgress: number;
    };
    readonly unifiedAnalysis?: {
      readonly primaryIntent?: string;
      readonly primaryConfidence?: number;
      readonly entities?: Record<string, unknown>;
    };
    readonly leadScore?: {
      readonly totalScore: number;
      readonly qualificationStatus?: {
        readonly readyForSales?: boolean;
        readonly nextSteps?: string[];
      };
    };
    readonly callToAction?: {
      readonly type: string;
      readonly message: string;
      readonly priority: string;
    };
    readonly [key: string]: unknown;
  };
}

export interface ContextResultData {
  readonly messages: ChatMessage[];
  readonly contextWindow: number;
  readonly summary?: string;
  readonly tokenUsage: {
    readonly messagesTokens: number;
    readonly summaryTokens: number;
    readonly totalTokens: number;
  };
  readonly wasCompressed: boolean;
}

export interface EnhancedContextData {
  readonly intentAnalysis: {
    readonly intent?: string;
    readonly confidence?: number;
    readonly entities?: Record<string, unknown>;
  };
  readonly relevantKnowledge: Array<{
    readonly id: string;
    readonly title: string;
    readonly content: string;
    readonly relevanceScore: number;
  }>;
}

// Workflow context interfaces
export interface WorkflowSession {
  readonly id: string;
  readonly status: string;
}

export interface WorkflowConfig {
  readonly id: string;
  readonly organizationId?: string;
}

export interface WorkflowUserMessage {
  readonly id: string;
  readonly content?: string;
  readonly messageType?: string;
}

export interface WorkflowBotMessage {
  readonly id: string;
  readonly content?: string;
}

// Data transfer interfaces
export interface ConversationMetricsData {
  readonly messageCount?: number;
  readonly sessionDuration?: number;
  readonly engagementScore?: number;
  readonly leadQualificationProgress?: number;
}

export interface JourneyStateData {
  readonly stage?: string;
  readonly phase?: string;
  readonly progress?: number;
}

export interface IntentAnalysisData {
  readonly intent?: string;
  readonly confidence?: number;
  readonly entities?: Record<string, unknown>;
}

export interface SuggestedActionsData {
  readonly action?: string;
  readonly priority?: number;
  readonly description?: string;
}

export interface CallToActionData {
  readonly text?: string;
  readonly type?: string;
  readonly priority?: number;
}

// Workflow context interfaces for type safety
export interface MessageContext {
  readonly session: WorkflowSession;
  readonly config: WorkflowConfig;
  readonly userMessage: WorkflowUserMessage;
}

export interface AnalysisContext {
  readonly session: WorkflowSession;
  readonly config: WorkflowConfig;
  readonly userMessage: WorkflowUserMessage;
  readonly contextResult: ContextResultData;
  readonly enhancedContext: EnhancedContextData;
}

export interface ResponseContext {
  readonly session: WorkflowSession;
  readonly config: WorkflowConfig;
  readonly userMessage: WorkflowUserMessage;
  readonly botMessage: WorkflowBotMessage;
}

export interface FinalWorkflowResult {
  readonly session: WorkflowSession;
  readonly config: WorkflowConfig;
  readonly userMessage: WorkflowUserMessage;
  readonly botMessage: WorkflowBotMessage;
  readonly shouldCaptureLeadInfo: boolean;
  readonly suggestedNextActions: SuggestedActionsData[];
  readonly conversationMetrics: ConversationMetricsData;
  readonly intentAnalysis: IntentAnalysisData;
  readonly journeyState: JourneyStateData;
  readonly relevantKnowledge: Array<{
    readonly id: string;
    readonly title: string;
    readonly content: string;
    readonly relevanceScore: number;
  }>;
  readonly callToAction: CallToActionData;
} 