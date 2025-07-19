/**
 * Chat Session Value Objects - Domain Types
 * 
 * Pure domain value objects for chat session concepts.
 * Core business entities for conversation management.
 */

/**
 * Chat session metadata interface
 * Domain value object for session tracking and analytics
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
 * Communication settings data interface
 * Domain value object defining conversation tone and behavior
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