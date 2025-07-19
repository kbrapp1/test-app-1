/**
 * Configuration Application Types
 * 
 * Application layer types for AI and system configuration.
 * Use case contracts for configuration management.
 */

/**
 * AI Configuration component interface
 * Application layer type for AI system configuration
 */
export interface AIConfigurationComponent {
  readonly type: string;
  readonly enabled: boolean;
  readonly settings: Record<string, unknown>;
  readonly metadata?: Record<string, unknown>;
}

/**
 * Chatbot service response interface
 * Standardized application layer response format for all chatbot operations
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