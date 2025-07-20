/**
 * OpenAI Message Builder
 * 
 * Infrastructure Layer: Handles OpenAI message construction logic.
 * Extracted from OpenAIChatbotProcessingService following DDD patterns.
 * Pure infrastructure concern - no business logic.
 */

import { ChatMessage } from '../../../../domain/entities/ChatMessage';

// OpenAI message interface
export interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

// Function call schema interface
export interface FunctionSchema {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
}

// Processing context for message building
export interface MessageBuildingContext {
  messageHistory: ChatMessage[];
  sessionId: string;
  organizationId?: string; // SECURITY: Never remove - required for tenant isolation
  userData?: Record<string, unknown>;
  systemPrompt?: string;
  sharedLogFile?: string;
}

export class OpenAIMessageBuilder {
  
  /**
   * Build messages with proper knowledge base integration for OpenAI API
   */
  public buildMessagesWithKnowledgeBase(
    userMessage: string,
    context: MessageBuildingContext,
    schema: FunctionSchema,
    systemPrompt: string
  ): OpenAIMessage[] {
    
    // SECURITY: Preserve organizationId context
    if (context.organizationId) {
      // organizationId is preserved for potential validation/logging
    }

    const messages: OpenAIMessage[] = [
      {
        role: 'system',
        content: systemPrompt // This includes full knowledge base integration
      }
    ];

    // Add conversation history (filter out current message to prevent duplication)
    if (context.messageHistory && context.messageHistory.length > 0) {
      const filteredHistory = context.messageHistory.filter((msg: ChatMessage) => 
        !(msg.messageType === 'user' && msg.content.trim() === userMessage.trim())
      );
      
      filteredHistory.forEach((msg: ChatMessage) => {
        messages.push({
          role: msg.messageType === 'user' ? 'user' : 'assistant',
          content: msg.content
        });
      });
    }

    // Add current user message (now guaranteed to be unique)
    messages.push({
      role: 'user',
      content: userMessage
    });

    // Add function schema instruction
    messages.push({
      role: 'system',
      content: `You must respond using the ${schema.name} function with all required fields filled out based on the conversation context and knowledge base information provided above.`
    });

    return messages;
  }

  /**
   * Validate message structure for OpenAI API requirements
   */
  public validateMessages(messages: OpenAIMessage[]): boolean {
    if (!messages || messages.length === 0) {
      return false;
    }

    // Check that all messages have required properties
    return messages.every(msg => 
      msg.role && 
      ['system', 'user', 'assistant'].includes(msg.role) &&
      typeof msg.content === 'string' &&
      msg.content.length > 0
    );
  }

  /**
   * Calculate approximate token count for message array
   */
  public estimateTokenCount(messages: OpenAIMessage[]): number {
    // Simple estimation: ~4 characters per token
    const totalCharacters = messages.reduce((sum, msg) => sum + msg.content.length, 0);
    return Math.ceil(totalCharacters / 4);
  }

  /**
   * Trim messages if they exceed token limits
   */
  public trimMessagesForTokenLimit(messages: OpenAIMessage[], maxTokens: number): OpenAIMessage[] {
    const estimatedTokens = this.estimateTokenCount(messages);
    
    if (estimatedTokens <= maxTokens) {
      return messages;
    }

    // Keep system messages and recent conversation
    const systemMessages = messages.filter(msg => msg.role === 'system');
    const conversationMessages = messages.filter(msg => msg.role !== 'system');
    
    // Calculate how many conversation messages we can keep
    const systemTokens = this.estimateTokenCount(systemMessages);
    const availableTokens = maxTokens - systemTokens;
    
    const trimmedConversation: OpenAIMessage[] = [];
    let currentTokens = 0;
    
    // Add messages from the end (most recent first)
    for (let i = conversationMessages.length - 1; i >= 0; i--) {
      const msgTokens = this.estimateTokenCount([conversationMessages[i]]);
      if (currentTokens + msgTokens <= availableTokens) {
        trimmedConversation.unshift(conversationMessages[i]);
        currentTokens += msgTokens;
      } else {
        break;
      }
    }
    
    return [...systemMessages, ...trimmedConversation];
  }
}