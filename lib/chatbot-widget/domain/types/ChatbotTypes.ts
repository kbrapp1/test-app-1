/**
 * Chatbot Widget Domain Types
 * 
 * AI INSTRUCTIONS:
 * - Replace all 'any' types in chatbot widget domain with proper interfaces
 * - Follow @golden-rule DDD patterns exactly
 * - Security-critical: organizationId fields must be preserved
 * - Single responsibility: Chatbot type definitions only
 * - Keep under 250 lines - focused on data contracts
 */

/**
 * AI Configuration component interface
 * Replaces any types in AIConfiguration
 */
export interface AIConfigurationComponent {
  readonly type: string;
  readonly enabled: boolean;
  readonly settings: Record<string, unknown>;
  readonly metadata?: Record<string, unknown>;
}

/**
 * Lead scoring calculation interface
 * Replaces any types in DomainConstants
 */
export interface LeadScoringEntities {
  readonly contactInfo: {
    readonly email?: string;
    readonly phone?: string;
    readonly name?: string;
  };
  readonly businessInfo: {
    readonly company?: string;
    readonly industry?: string;
    readonly size?: string;
  };
  readonly intentSignals: {
    readonly urgency?: 'low' | 'medium' | 'high';
    readonly budget?: 'low' | 'medium' | 'high';
    readonly timeline?: 'immediate' | 'short' | 'medium' | 'long';
  };
  readonly engagementMetrics: {
    readonly messageCount?: number;
    readonly sessionDuration?: number;
    readonly responseTime?: number;
  };
  readonly role?: string; // User's role/title for authority-based scoring
}

/**
 * Chat session metadata interface
 * Replaces any types in ChatSessionTypes
 */
export interface ChatSessionMetadata {
  readonly userAgent?: string;
  readonly referrer?: string;
  readonly ipAddress?: string;
  readonly geolocation?: {
    readonly country?: string;
    readonly city?: string;
    readonly region?: string;
  };
  readonly sessionStartTime: Date;
  readonly lastActivity: Date;
  readonly totalMessages: number;
  readonly averageResponseTime: number;
  readonly customData?: Record<string, unknown>;
}

/**
 * Entity value interface with type safety
 * Replaces any types in entity management
 */
export interface EntityValue {
  readonly type: 'string' | 'number' | 'boolean' | 'date' | 'object' | 'array';
  readonly value: string | number | boolean | Date | Record<string, unknown> | unknown[];
  readonly confidence: number;
  readonly source: 'user' | 'inferred' | 'system';
  readonly extractedAt: Date;
  readonly metadata?: Record<string, unknown>;
}

/**
 * Entity change tracking interface
 * Replaces any types in EntityCorrections
 */
export interface EntityChange {
  readonly entityType: string;
  readonly messageId: string;
  readonly previousValue?: EntityValue;
  readonly newValue: EntityValue;
  readonly confidence: number;
  readonly timestamp: Date;
  readonly reason: 'correction' | 'update' | 'addition' | 'removal';
}

/**
 * Context analysis input interface
 * Replaces any types in ContextAnalysis
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
 * Communication settings JSON interface
 * Replaces any types in CommunicationSettings
 */
export interface CommunicationSettingsData {
  readonly tone: 'professional' | 'friendly' | 'casual' | 'formal' | 'enthusiastic' | 'empathetic';
  readonly responseLength: 'concise' | 'moderate' | 'detailed' | 'adaptive';
  readonly communicationStyle: 'helpful' | 'consultative' | 'direct' | 'conversational' | 'educational';
  readonly maxResponseLength?: number;
  readonly includeEmojis?: boolean;
  readonly language?: string;
  readonly personalization?: {
    readonly useUserName: boolean;
    readonly referenceHistory: boolean;
    readonly adaptToUserStyle: boolean;
  };
  readonly fallbackBehavior?: {
    readonly escalateToHuman: boolean;
    readonly provideAlternatives: boolean;
    readonly requestClarification: boolean;
  };
}

/**
 * Debug information interface
 * Replaces any types in IDebugInformationService
 */
export interface DebugApiCall {
  readonly endpoint: string;
  readonly method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  readonly payload: Record<string, unknown>;
  readonly response: {
    readonly status: number;
    readonly data: unknown;
    readonly headers?: Record<string, string>;
  };
  readonly timestamp: Date;
  readonly duration: number;
  readonly sessionId: string;
  readonly organizationId: string; // SECURITY-CRITICAL: Organization isolation
}

/**
 * Logging context interface
 * Replaces any types in IChatbotLoggingService
 */
export interface LoggingContext {
  readonly sessionId?: string;
  readonly organizationId?: string; // SECURITY-CRITICAL: Organization isolation
  readonly userId?: string;
  readonly operation?: string;
  readonly correlationId?: string;
  readonly customData?: Record<string, unknown>;
}

/**
 * Log entry interface
 * Replaces any types in logging services
 */
export interface LogEntry {
  readonly type: 'info' | 'warning' | 'error' | 'debug';
  readonly message: string;
  readonly data?: Record<string, unknown>;
  readonly timestamp: Date;
  readonly level: 'low' | 'medium' | 'high' | 'critical';
  readonly context?: LoggingContext;
}

/**
 * API call logging interface
 * Replaces any types in API call logging
 */
export interface ApiCallLog {
  readonly endpoint: string;
  readonly request: {
    readonly method: string;
    readonly headers?: Record<string, string>;
    readonly body?: unknown;
  };
  readonly response: {
    readonly status: number;
    readonly data: unknown;
    readonly headers?: Record<string, string>;
  };
  readonly duration: number;
  readonly timestamp: Date;
  readonly sessionId?: string;
  readonly organizationId?: string; // SECURITY-CRITICAL: Organization isolation
}

/**
 * Context injection data interface
 * Replaces any types in ContextInjectionTypes
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
 * Persistence data interface
 * Replaces any types in ChatSessionFactory
 */
export interface ChatSessionPersistenceData {
  readonly sessionId: string;
  readonly organizationId: string; // SECURITY-CRITICAL: Organization isolation
  readonly userId?: string;
  readonly createdAt: string; // ISO timestamp
  readonly updatedAt: string; // ISO timestamp
  readonly status: 'active' | 'completed' | 'abandoned' | 'escalated';
  readonly context: {
    readonly entities: Record<string, EntityValue>;
    readonly intent: Record<string, unknown>;
    readonly metadata: ChatSessionMetadata;
  };
  readonly qualificationState: {
    readonly isQualified: boolean;
    readonly score: number;
    readonly level: 'low' | 'medium' | 'high';
    readonly breakdown: Record<string, number>;
  };
  readonly messages: Array<{
    readonly id: string;
    readonly content: string;
    readonly role: 'user' | 'assistant' | 'system';
    readonly timestamp: string; // ISO timestamp
    readonly metadata?: Record<string, unknown>;
  }>;
}

/**
 * Intent persistence interface
 * Replaces any types in IntentPersistenceService
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

/**
 * Lead qualification parameters interface
 * Replaces any types in LeadScoreValidationService
 */
export interface LeadQualificationParams {
  readonly score: number;
  readonly qualificationLevel: 'low' | 'medium' | 'high';
  readonly breakdown: {
    readonly contactInfo: number;
    readonly businessInfo: number;
    readonly intentSignals: number;
    readonly engagementMetrics: number;
  };
  readonly calculatedAt: Date;
  readonly organizationId: string; // SECURITY-CRITICAL: Organization isolation
}

/**
 * Chatbot service response interface
 * Standardized response format for all chatbot operations
 */
export interface ChatbotServiceResponse<T = unknown> {
  readonly success: boolean;
  readonly data?: T;
  readonly error?: {
    readonly code: string;
    readonly message: string;
    readonly context?: Record<string, unknown>;
  };
  readonly metadata?: {
    readonly processingTime?: number;
    readonly sessionId?: string;
    readonly organizationId?: string; // SECURITY-CRITICAL: Organization isolation
  };
} 