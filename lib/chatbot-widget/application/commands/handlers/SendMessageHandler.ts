/**
 * Send Message Command Handler
 * 
 * CQRS Command Handler that processes chat message sending commands.
 * Delegates to the Process Chat Message Use Case for business logic execution.
 * 
 * Single Responsibility: Handle SendMessageCommand processing
 */

import { SendMessageCommand, SendMessageResult } from '../SendMessageCommand';
import { ProcessChatMessageUseCase } from '../../use-cases/ProcessChatMessageUseCase';

export class SendMessageHandler {
  constructor(
    private readonly processChatMessageUseCase: ProcessChatMessageUseCase
  ) {}

  /**
   * Handle the send message command
   * Note: This requires AI Conversation Service to be fully implemented
   */
  async handle(command: SendMessageCommand): Promise<SendMessageResult> {
    try {
      // Delegate to Use Case for business logic
      const result = await this.processChatMessageUseCase.execute({
        sessionId: command.sessionId,
        userMessage: command.userMessage,
        clientInfo: command.clientInfo
      });

      return {
        messageId: result.userMessage.id,
        botResponseId: result.botResponse.id,
        success: true,
        shouldCaptureLeadInfo: result.shouldCaptureLeadInfo,
        suggestedNextActions: result.suggestedNextActions,
        conversationMetrics: result.conversationMetrics
      };
    } catch (error) {
      // Re-throw with context for upper layers to handle
      throw new Error(`Failed to send message: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
} 