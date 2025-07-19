/**
 * Context Analysis Application Types
 * 
 * Application layer types for context analysis use cases.
 * Orchestration contracts for conversation understanding.
 */

import { EntityValue } from '../../domain/value-objects/EntityValueObject';

/**
 * Context analysis input interface
 * Application layer contract for context analysis operations
 */
export interface ContextAnalysisInput {
  readonly messages: Array<{
    readonly id: string;
    readonly content: string;
    readonly role: 'user' | 'assistant' | 'system';
    readonly timestamp: Date;
    readonly metadata?: Record<string, unknown>;
  }>;
  readonly sessionContext?: {
    readonly sessionId: string;
    readonly organizationId: string; // SECURITY-CRITICAL: Organization isolation
    readonly userId?: string;
    readonly customData?: Record<string, unknown>;
  };
  readonly analysisOptions?: {
    readonly includeEntities?: boolean;
    readonly includeIntent?: boolean;
    readonly includeSentiment?: boolean;
    readonly contextWindow?: number;
  };
}

/**
 * Context injection data interface
 * Application layer contract for context injection in conversations
 */
export interface ContextInjectionData {
  readonly sessionId: string;
  readonly organizationId: string; // SECURITY-CRITICAL: Organization isolation
  readonly userId?: string;
  readonly conversationHistory: Array<{
    readonly role: 'user' | 'assistant';
    readonly content: string;
    readonly timestamp: Date;
  }>;
  readonly entities: Record<string, EntityValue>;
  readonly intent: {
    readonly primary: string;
    readonly confidence: number;
    readonly alternatives?: Array<{
      readonly intent: string;
      readonly confidence: number;
    }>;
  };
  readonly customContext: Record<string, unknown>;
}

/**
 * Intent persistence interface
 * Application layer type for intent persistence operations
 */
export interface IntentPersistenceData {
  readonly intentName: string;
  readonly confidence: number;
  readonly entities: Record<string, EntityValue>;
  readonly context: {
    readonly turnNumber: number;
    readonly messageId: string;
    readonly timestamp: Date;
  };
  readonly metadata: {
    readonly extractionMethod: 'rule' | 'ml' | 'hybrid';
    readonly processingTime: number;
    readonly alternatives?: Array<{
      readonly intent: string;
      readonly confidence: number;
    }>;
  };
}