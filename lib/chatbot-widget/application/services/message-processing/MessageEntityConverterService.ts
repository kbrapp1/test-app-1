/**
 * Message Entity Converter Application Service
 * 
 * AI INSTRUCTIONS:
 * - Application service for converting plain message objects to ChatMessage entities
 * - Maintains proper domain boundaries and repository patterns
 * - Follow @golden-rule patterns exactly - single responsibility for entity conversion
 * - Ensures type safety between application and domain layers
 */

import { ChatMessage } from '../../../domain/entities/ChatMessage';
import { IChatMessageRepository } from '../../../domain/repositories/IChatMessageRepository';

export class MessageEntityConverterService {
  
  constructor(
    private readonly messageRepository: IChatMessageRepository
  ) {}

  /**
   * Converts an array of plain message objects to ChatMessage entities using the repository.
   * This ensures proper domain boundaries and consistency.
   * 
   * Uses repository to fetch existing entities when possible to maintain data integrity.
   */
  async convertPlainMessagesToEntities(
    messages: Record<string, unknown>[], 
    logFileName: string
  ): Promise<ChatMessage[]> {
    const chatMessages: ChatMessage[] = [];
    
    for (const msg of messages) {
      const convertedMessage = await this.convertSingleMessage(msg, logFileName);
      if (convertedMessage) {
        chatMessages.push(convertedMessage);
      }
    }
    
    return chatMessages;
  }

  /**
   * Convert a single plain message object to ChatMessage entity
   * Prioritizes repository lookup for data consistency
   */
  private async convertSingleMessage(
    msg: Record<string, unknown>, 
    _logFileName: string
  ): Promise<ChatMessage | null> {
    if (!msg.id) {
      console.warn('Skipping message with missing ID:', msg);
      return null;
    }
    
    try {
      // First try to get the entity from repository (preferred approach)
      const existingMessage = await this.messageRepository.findById(msg.id as string);
      if (existingMessage) {
        return existingMessage;
      }
      
      // If not found in repository, check if it's already a ChatMessage entity
      if (this.isValidChatMessageEntity(msg)) {
        return msg as unknown as ChatMessage;
      }
      
      // Log warning for missing messages that should exist in repository
      console.warn(`Message ${msg.id} not found in repository and not a valid ChatMessage entity`);
      return null;
      
    } catch (error) {
      console.error(`Error converting message ${msg.id}:`, error);
      return null;
    }
  }

  /**
   * Validate if a plain object is already a ChatMessage entity
   * Checks for entity methods to ensure proper domain object
   */
  private isValidChatMessageEntity(msg: Record<string, unknown>): boolean {
    return Boolean(
      msg.isFromUser && 
      typeof msg.isFromUser === 'function'
    );
  }

  /**
   * Merge converted messages with existing messages, avoiding duplicates
   * Ensures user message is included in context without duplication
   */
  mergeMessagesWithUserMessage(
    contextMessages: ChatMessage[], 
    userMessage: ChatMessage
  ): ChatMessage[] {
    // Check if userMessage is already in context messages to avoid duplication
    const isUserMessageInContext = contextMessages.some(
      (msg: ChatMessage) => msg.id === userMessage.id
    );
    
    return isUserMessageInContext 
      ? contextMessages 
      : [...contextMessages, userMessage];
  }

  /**
   * Update message array with updated user message after analysis
   * Replaces the original user message with the analyzed version
   */
  updateMessagesWithAnalyzedMessage(
    allMessages: ChatMessage[], 
    updatedUserMessage: ChatMessage
  ): ChatMessage[] {
    if (!updatedUserMessage) {
      return allMessages;
    }

    return allMessages.map((msg: ChatMessage) => 
      msg.id === updatedUserMessage.id ? updatedUserMessage : msg
    );
  }
}