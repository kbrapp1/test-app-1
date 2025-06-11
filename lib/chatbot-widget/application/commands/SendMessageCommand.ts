/**
 * Send Message Command
 * 
 * CQRS Command for sending chat messages.
 * Represents a write operation request for message processing.
 * 
 * Single Responsibility: Encapsulate message sending request data
 */

export interface SendMessageCommand {
  sessionId: string;
  userMessage: string;
  clientInfo?: {
    userAgent?: string;
    ipAddress?: string;
    location?: string;
  };
}

export interface SendMessageResult {
  messageId: string;
  botResponseId: string;
  success: boolean;
  shouldCaptureLeadInfo: boolean;
  suggestedNextActions: string[];
  conversationMetrics: {
    messageCount: number;
    sessionDuration: number;
    engagementScore: number;
    leadQualificationProgress: number;
  };
} 