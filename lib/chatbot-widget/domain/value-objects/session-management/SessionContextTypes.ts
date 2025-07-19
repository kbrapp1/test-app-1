/**
 * Session Context Types
 * 
 * AI INSTRUCTIONS:
 * - Single responsibility: Define core SessionContext interface and related types
 * - Domain value objects for conversation tracking and session state
 * - Keep under 150 lines by focusing on core context only
 * - Follow DDD patterns exactly
 */

import { ChatSessionMetadata } from '../../types/ChatbotTypes';
import { AccumulatedEntitiesTypes } from './AccumulatedEntitiesTypes';
import { ConversationFlowTypes } from './ConversationFlowTypes';

export interface PageView {
  url: string;
  title: string;
  timestamp: Date;
  timeOnPage: number;
}

export interface SessionContext {
  previousVisits: number;
  pageViews: PageView[];
  conversationSummary: {
    fullSummary: string; // comprehensive summary of entire conversation
    phaseSummaries?: Array<{
      phase: string;
      summary: string;
      keyOutcomes: string[];
      entitiesExtracted: string[];
      timeframe: { start: Date; end: Date };
    }>;
    criticalMoments?: Array<{
      messageId: string;
      importance: 'high' | 'critical';
      context: string;
      preserveInContext: boolean;
    }>;
  };
  topics: string[];
  interests: string[];
  engagementScore: number;
  journeyState?: {
    stage: string;
    confidence: number;
    metadata: ChatSessionMetadata;
  };
  accumulatedEntities?: AccumulatedEntitiesTypes;
  intentHistory?: {
    businessContextEstablished: boolean;
    lastBusinessIntent: string;
    lastBusinessTurn: number;
    currentConversationMode: 'greeting' | 'business' | 'casual' | 'qualification';
    intentSequence: Array<{
      turn: number;
      intent: string;
      confidence: number;
      timestamp: string;
      messageId: string;
    }>;
    contextFlags: {
      productInterestEstablished: boolean;
      pricingDiscussed: boolean;
      comparisonMode: boolean;
      companyInquiryMade: boolean;
      knowledgeBaseNeeded: boolean;
      lastBusinessQuestionTurn: number;
    };
  };
  // Domain-calculated lead score from DomainConstants.calculateLeadScore()
  leadScore?: number;

  // NEW: Conversation Flow Tracking (Phase 1.2)
  conversationFlow?: ConversationFlowTypes;

  // NEW: Response Quality Tracking (Phase 1.2)
  responseQuality?: {
    coherenceScore: number; // 0-1, how well conversation flows
    userEngagement: 'high' | 'medium' | 'low';
    lastResponseEffective: boolean;
    misunderstandingCount: number;
    topicDrift: number; // how much conversation has wandered
    lastResponseType: 'informational' | 'question' | 'action_request' | 'clarification';
  };

  // NEW: Context Management (Phase 1.2)
  contextMetrics?: {
    totalTokensUsed: number;
    maxTokensAvailable: number;
    utilizationPercentage: number;
    compressionEvents: number;
    lastCompressionAt?: Date;
    preservedMessageIds: string[]; // critical messages never to compress
  };

  // NEW: User Behavioral Patterns (Phase 1.2)
  userBehavior?: {
    communicationStyle: {
      preferredResponseLength: 'brief' | 'detailed' | 'comprehensive';
      formalityLevel: 'casual' | 'professional' | 'technical';
      questioningPattern: 'direct' | 'exploratory' | 'skeptical';
    };
    engagementMetrics: {
      averageSessionDuration: number;
      messagesPerSession: number;
      dropOffPoints: string[]; // topics where user typically disengages
    };
  };
}