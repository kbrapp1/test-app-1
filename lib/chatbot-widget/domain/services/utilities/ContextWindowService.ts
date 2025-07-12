/**
 * Context Window Service
 * 
 * Domain service for managing conversation context windows and token optimization.
 * Single responsibility: Handle context window management and message compression.
 */

import { ChatMessage } from '../../entities/ChatMessage';
import { ConversationContextWindow } from '../../value-objects/session-management/ConversationContextWindow';
import { ITokenCountingService } from '../interfaces/ITokenCountingService';
import { ContextWindowResult } from '../../value-objects/message-processing/ContextAnalysis';

export class ContextWindowService {
  constructor(
    private tokenCountingService: ITokenCountingService
  ) {}

  /** Get messages that fit within context window with token management */
  async getMessagesForContextWindow(
    messages: ChatMessage[],
    contextWindow: ConversationContextWindow,
    existingSummary?: string
  ): Promise<ContextWindowResult> {
    if (messages.length === 0) {
      return {
        messages: [],
        tokenUsage: { messagesTokens: 0, summaryTokens: 0, totalTokens: 0 },
        wasCompressed: false
      };
    }

    // Always include the last 2 messages for immediate context
    const criticalMessages = messages.slice(-2);
    const remainingMessages = messages.slice(0, -2);

    // Count tokens for critical messages
    const criticalTokens = await this.tokenCountingService.countMessagesTokens(criticalMessages);
    
    // Count existing summary tokens
    const summaryTokens = existingSummary 
      ? await this.tokenCountingService.countTextTokens(existingSummary)
      : 0;

    // Calculate available tokens for additional messages
    const availableTokens = contextWindow.getAvailableTokensForMessages() - criticalTokens - summaryTokens;

    if (availableTokens <= 0) {
      // Only critical messages fit
      return {
        messages: criticalMessages.map(msg => ({
          id: msg.id,
          content: msg.content,
          role: msg.messageType === 'user' ? 'user' as const : 
                msg.messageType === 'bot' ? 'assistant' as const : 'system' as const,
          timestamp: msg.timestamp,
          metadata: { 
            sessionId: msg.sessionId,
            processingTime: msg.processingTime,
            isVisible: msg.isVisible
          }
        })),
        summary: existingSummary,
        tokenUsage: {
          messagesTokens: criticalTokens,
          summaryTokens,
          totalTokens: criticalTokens + summaryTokens
        },
        wasCompressed: remainingMessages.length > 0
      };
    }

    // Add messages from most recent backwards until we hit token limit
    const selectedMessages: ChatMessage[] = [...criticalMessages];
    let currentTokens = criticalTokens;

    for (let i = remainingMessages.length - 1; i >= 0; i--) {
      const message = remainingMessages[i];
      const messageTokens = await this.tokenCountingService.countMessageTokens(message);
      
      if (currentTokens + messageTokens <= availableTokens) {
        selectedMessages.unshift(message);
        currentTokens += messageTokens;
      } else {
        break;
      }
    }

    const wasCompressed = selectedMessages.length < messages.length;

    return {
      messages: selectedMessages.map(msg => ({
        id: msg.id,
        content: msg.content,
        role: msg.messageType === 'user' ? 'user' as const : 
              msg.messageType === 'bot' ? 'assistant' as const : 'system' as const,
        timestamp: msg.timestamp,
        metadata: { 
          sessionId: msg.sessionId,
          processingTime: msg.processingTime,
          isVisible: msg.isVisible
        }
      })),
      summary: existingSummary,
      tokenUsage: {
        messagesTokens: currentTokens,
        summaryTokens,
        totalTokens: currentTokens + summaryTokens
      },
      wasCompressed
    };
  }

  /** Create AI-generated summary of older messages */
  async createAISummary(
    messages: ChatMessage[],
    maxTokens: number = 200
  ): Promise<string> {
    if (messages.length === 0) return '';

    // Safety check: Filter out any non-ChatMessage objects
    const validMessages = messages.filter(m => m && typeof m.isFromUser === 'function');
    const userMessages = validMessages.filter(m => m.isFromUser());
    const botMessages = validMessages.filter(m => !m.isFromUser());

    // Create a structured summary prompt
    const summaryPrompt = `Summarize this conversation in ${maxTokens} tokens or less. Focus on:
- Key topics discussed
- User's main needs/interests
- Important context for future responses

User messages: ${userMessages.map(m => m.content).join(' | ')}
Bot responses: ${botMessages.map(m => m.content).join(' | ')}

Summary:`;

    // This would typically call an AI service to generate the summary
    // For now, return a basic summary
    const topics = this.extractBasicTopics(userMessages);
    const interests = this.extractBasicInterests(userMessages);
    
    return `Conversation covered: ${topics.join(', ')}. User interested in: ${interests.join(', ')}. ${userMessages.length} user messages exchanged.`;
  }

  /** Extract basic topics for summary (simplified version) */
  private extractBasicTopics(userMessages: ChatMessage[]): string[] {
    const topics = new Set<string>();
    const topicKeywords = {
      'pricing': ['price', 'cost', 'pricing'],
      'features': ['feature', 'functionality'],
      'support': ['help', 'support'],
      'demo': ['demo', 'demonstration'],
      'trial': ['trial', 'test']
    };

    userMessages.forEach(message => {
      const content = message.content.toLowerCase();
      Object.entries(topicKeywords).forEach(([topic, keywords]) => {
        if (keywords.some(keyword => content.includes(keyword))) {
          topics.add(topic);
        }
      });
    });

    return Array.from(topics).slice(0, 3);
  }

  /** Extract basic interests for summary (simplified version) */
  private extractBasicInterests(userMessages: ChatMessage[]): string[] {
    const interests = new Set<string>();
    const interestPatterns = [
      /interested in ([\w\s]+)/gi,
      /looking for ([\w\s]+)/gi,
      /need ([\w\s]+)/gi
    ];

    userMessages.forEach(message => {
      interestPatterns.forEach(pattern => {
        const matches = message.content.match(pattern);
        if (matches) {
          matches.forEach(match => {
            const interest = match.split(' ').slice(2).join(' ').trim();
            if (interest.length > 2 && interest.length < 30) {
              interests.add(interest);
            }
          });
        }
      });
    });

    return Array.from(interests).slice(0, 3);
  }
} 