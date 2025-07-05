/**
 * Business Domain and Configuration Errors
 * 
 * AI INSTRUCTIONS:
 * - Single responsibility: Business configuration and domain-specific errors
 * - Follow @golden-rule DDD error handling patterns exactly
 * - Create specific error types for each business configuration rule
 * - Include relevant context for debugging and business analysis
 * - Keep under 250 lines - focused domain responsibility
 * - Import base patterns from DomainErrorBase
 */

import { DomainError, ErrorSeverity } from './base/DomainErrorBase';

// ===== CONFIGURATION ERRORS =====

export class ChatbotConfigurationError extends DomainError {
  readonly code = 'CHATBOT_CONFIGURATION_ERROR';
  readonly severity = ErrorSeverity.HIGH;
  
  constructor(configField: string, context: Record<string, any> = {}) {
    super(`Chatbot configuration error: ${configField}`, context);
  }
}

export class IntegrationConfigurationError extends DomainError {
  readonly code = 'INTEGRATION_CONFIGURATION_ERROR';
  readonly severity = ErrorSeverity.HIGH;
  
  constructor(integrationType: string, context: Record<string, any> = {}) {
    super(`Integration configuration error: ${integrationType}`, context);
  }
} 