/**
 * Context Relevance Types
 * 
 * AI INSTRUCTIONS:
 * - Define all types and interfaces for context relevance domain
 * - Keep types focused on business domain concepts
 * - Follow @golden-rule patterns for type definitions
 * - Single responsibility: Type definitions for relevance scoring
 */

import { ChatMessage } from '../../../entities/ChatMessage';
import { IntentResult } from '../../../value-objects/message-processing/IntentResult';

export interface RelevanceScore {
  messageId: string;
  overallScore: number;
  componentScores: {
    recencyScore: number;
    entityRelevanceScore: number;
    intentAlignmentScore: number;
    businessContextScore: number;
    engagementScore: number;
  };
  retentionPriority: 'critical' | 'high' | 'medium' | 'low';
  reasonsForRetention: string[];
}

export interface RelevanceContext {
  currentIntent: IntentResult;
  businessEntities: Record<string, unknown>;
  conversationPhase: string;
  leadScore: number;
  maxRetentionMessages: number;
}

export interface PrioritizedMessages {
  criticalMessages: ChatMessage[];
  highPriorityMessages: ChatMessage[];
  mediumPriorityMessages: ChatMessage[];
  lowPriorityMessages: ChatMessage[];
  totalRelevanceScore: number;
  retentionRecommendation: {
    shouldCompress: boolean;
    messagesToCompress: ChatMessage[];
    messagesToRetain: ChatMessage[];
  };
}

export interface ScoredMessage {
  message: ChatMessage;
  score: RelevanceScore;
}

export interface CategorizedMessages {
  critical: ScoredMessage[];
  high: ScoredMessage[];
  medium: ScoredMessage[];
  low: ScoredMessage[];
}

export interface ComponentScores {
  recencyScore: number;
  entityRelevanceScore: number;
  intentAlignmentScore: number;
  businessContextScore: number;
  engagementScore: number;
}

export interface RetentionRecommendation {
  shouldCompress: boolean;
  messagesToCompress: ChatMessage[];
  messagesToRetain: ChatMessage[];
} 