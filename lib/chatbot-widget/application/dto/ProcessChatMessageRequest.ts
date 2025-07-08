/**
 * ProcessChatMessageRequest DTO
 * 
 * AI INSTRUCTIONS:
 * - Clean data contract for message processing requests
 * - Include input validation and sanitization methods
 * - Ensure immutable structure after validation
 * - Handle required vs optional fields explicitly
 * - Provide clear error messages for validation failures
 */

export interface ProcessChatMessageRequest {
  readonly userMessage: string;
  readonly sessionId: string;
  readonly organizationId: string; // AI: Required - never undefined
  readonly metadata?: {
    readonly userId?: string;
    readonly timestamp?: string;
    readonly clientInfo?: Record<string, any>;
  };
}

export class ProcessChatMessageRequestValidator {
  
  static validate(input: any): ProcessChatMessageRequest {
    // AI: Validate required string fields
    if (!input.userMessage?.trim()) {
      throw new Error('User message is required and cannot be empty');
    }
    
    if (!input.sessionId?.trim()) {
      throw new Error('Session ID is required and cannot be empty');
    }
    
    if (!input.organizationId?.trim()) {
      throw new Error('Organization ID is required and cannot be empty');
    }
    
    // AI: Sanitize user input
    const sanitizedMessage = this.sanitizeUserInput(input.userMessage);
    
    return {
      userMessage: sanitizedMessage,
      sessionId: input.sessionId.trim(),
      organizationId: input.organizationId.trim(),
      metadata: input.metadata ? {
        userId: input.metadata.userId?.trim(),
        timestamp: input.metadata.timestamp,
        clientInfo: input.metadata.clientInfo
      } : undefined
    };
  }
  
  private static sanitizeUserInput(message: string): string {
    // AI: Basic sanitization to prevent common injection attacks
    return message
      .trim()
      .replace(/[<>]/g, '') // Remove potential HTML tags
      .substring(0, 4000); // Limit message length
  }
} 