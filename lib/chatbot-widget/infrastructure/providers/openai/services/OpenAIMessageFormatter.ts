/**
 * OpenAI Message Formatter
 * 
 * Service for formatting messages for OpenAI API calls.
 * Single responsibility: Convert ChatMessage entities to OpenAI API format.
 */

import OpenAI from 'openai';
import { ChatMessage } from '../../../../domain/entities/ChatMessage';

export class OpenAIMessageFormatter {
  /** Convert ChatMessage history to OpenAI message format */
  static formatConversationHistory(
    messageHistory: ChatMessage[]
  ): OpenAI.Chat.Completions.ChatCompletionMessageParam[] {
    return messageHistory.slice(-18).map(msg => ({
      role: msg.messageType === 'user' ? 'user' as const : 'assistant' as const,
      content: msg.content
    }));
  }

  /** Build complete message array for OpenAI API */
  static buildMessageArray(
    systemPrompt: string,
    messageHistory: ChatMessage[],
    currentMessage: string,
    excludeCurrentFromHistory: boolean = true
  ): OpenAI.Chat.Completions.ChatCompletionMessageParam[] {
    // Remove current message from history to avoid duplication if requested
    const historyToUse = excludeCurrentFromHistory 
      ? messageHistory.filter(msg => 
          !(msg.messageType === 'user' && msg.content.trim() === currentMessage.trim())
        )
      : messageHistory;

    return [
      { role: "system", content: systemPrompt },
      ...this.formatConversationHistory(historyToUse),
      { role: "user", content: currentMessage }
    ];
  }
} 