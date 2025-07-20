/**
 * Error Tracking Utilities Service
 * 
 * AI INSTRUCTIONS:
 * - Single responsibility: provide utilities for error tracking operations
 * - Follow @golden-rule patterns exactly
 * - Keep under 80 lines
 * - Support logging, sanitization, and helper functions
 * - No direct dependencies on external services
 */

import { ChatbotErrorContext } from './ErrorCategoryTrackersService';

export class ErrorTrackingUtilitiesService {
  /**
   * AI INSTRUCTIONS:
   * - Provide utility functions for error tracking
   * - Handle logging based on severity levels
   * - Sanitize data for safe storage and logging
   * - Keep organizationId security context in logging
   */

  logError(error: Error & { code: string; timestamp?: Date }, severity: string, context: ChatbotErrorContext): void {
    const logData = {
      errorCode: error.code,
      errorMessage: error.message,
      severity,
      sessionId: context.sessionId,
      userId: context.userId,
      organizationId: context.organizationId,
      timestamp: error.timestamp?.toISOString() || new Date().toISOString()
    };

    switch (severity) {
      case 'critical':
        console.error('CRITICAL CHATBOT ERROR:', logData);
        break;
      case 'high':
        console.error('HIGH CHATBOT ERROR:', logData);
        break;
      case 'medium':
        console.warn('MEDIUM CHATBOT ERROR:', logData);
        break;
      case 'low':
        console.info('LOW CHATBOT ERROR:', logData);
        break;
      default:
        // AI: Removed console.log - use proper logging service in production
        break;
    }
  }

  sanitizeUnifiedResult(result: unknown): Record<string, unknown> | null {
    if (!result) return null;
    
    const resultObj = result as Record<string, unknown>;
    
    const analysis = resultObj.analysis as Record<string, unknown> | undefined;
    const response = analysis?.response as Record<string, unknown> | undefined;
    const content = response?.content as string | undefined;
    
    return {
      hasAnalysis: !!analysis,
      hasResponse: !!response,
      hasContent: !!content,
      contentLength: content?.length || 0,
      structure: Object.keys(resultObj).join(', '),
      analysisKeys: analysis ? Object.keys(analysis).join(', ') : null,
      responseKeys: response ? Object.keys(response).join(', ') : null
    };
  }

  sanitizeErrorMessage(message: string): string {
    // Remove potentially sensitive information from error messages
    return message
      .replace(/password[=:]\s*\S+/gi, 'password=***')
      .replace(/token[=:]\s*\S+/gi, 'token=***')
      .replace(/key[=:]\s*\S+/gi, 'key=***')
      .replace(/secret[=:]\s*\S+/gi, 'secret=***');
  }

  extractErrorMetadata(error: Error): Record<string, unknown> {
    return {
      name: error.name,
      stack: error.stack,
      cause: (error as unknown as { cause?: unknown }).cause || null,
      timestamp: new Date().toISOString()
    };
  }
}