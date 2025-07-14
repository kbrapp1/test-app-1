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
    readonly clientInfo?: Record<string, unknown>;
  };
}

export class ProcessChatMessageRequestValidator {
  
  static validate(input: unknown): ProcessChatMessageRequest {
    const inputObj = input as Record<string, any>;
    
    // AI: Validate required string fields
    if (!inputObj.userMessage?.trim()) {
      throw new Error('User message is required and cannot be empty');
    }
    
    if (!inputObj.sessionId?.trim()) {
      throw new Error('Session ID is required and cannot be empty');
    }
    
    if (!inputObj.organizationId?.trim()) {
      throw new Error('Organization ID is required and cannot be empty');
    }
    
    // AI: Sanitize user input
    const sanitizedMessage = this.sanitizeUserInput(inputObj.userMessage);
    
    return {
      userMessage: sanitizedMessage,
      sessionId: inputObj.sessionId.trim(),
      organizationId: inputObj.organizationId.trim(),
      metadata: inputObj.metadata ? {
        userId: inputObj.metadata.userId?.trim(),
        timestamp: inputObj.metadata.timestamp,
        clientInfo: inputObj.metadata.clientInfo
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