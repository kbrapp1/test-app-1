/**
 * Message Analysis Extractor Application Service
 * 
 * AI INSTRUCTIONS:
 * - Application service for extracting analysis data from unified AI responses
 * - Replaces multiple separate API calls with efficient unified extraction
 * - Follow @golden-rule patterns exactly - single responsibility for analysis extraction
 * - Keep business logic isolated and focused on data extraction coordination
 */

import { ChatMessage } from '../../../domain/entities/ChatMessage';
import { IChatMessageRepository } from '../../../domain/repositories/IChatMessageRepository';

export class MessageAnalysisExtractorService {
  
  constructor(
    private readonly messageRepository: IChatMessageRepository
  ) {}

  /**
   * Extract and apply analysis data to user message from unified AI response
   * This replaces 3 separate API calls (sentiment, urgency, engagement) for 2.8s performance gain
   */
  async extractAndApplyAnalysis(
    userMessage: ChatMessage,
    unifiedResult: Record<string, unknown>,
    logFileName: string
  ): Promise<ChatMessage> {
    try {
      // Extract analysis data directly from unified response
      const sentiment = this.extractSentimentFromUnified(unifiedResult);
      const urgency = this.extractUrgencyFromUnified(unifiedResult);
      const engagement = this.extractEngagementFromUnified(unifiedResult);
      
      // Apply analysis data to user message using domain methods
      const messageWithSentiment = userMessage.updateSentiment(sentiment);
      const messageWithUrgency = messageWithSentiment.updateUrgency(urgency);
      const messageWithEngagement = messageWithUrgency.updateEngagement(engagement);
      
      // Save updated message with analysis data
      const updatedUserMessage = await this.messageRepository.save(messageWithEngagement, logFileName);
      
      // Return updated message or fallback to original if save failed
      return updatedUserMessage || userMessage;
      
    } catch (error) {
      // If extraction fails, continue with original message
      console.error('Failed to extract analysis from unified response:', error);
      return userMessage;
    }
  }

  /** Extract sentiment from unified API response with multiple fallback paths */
  private extractSentimentFromUnified(unifiedResult: Record<string, unknown>): 'positive' | 'neutral' | 'negative' {
    // Try multiple paths in unified response for robust extraction
    const analysis = unifiedResult?.analysis as Record<string, unknown>;
    const response = unifiedResult?.response as Record<string, unknown>;
    const sentiment = analysis?.sentiment ||
                     response?.sentiment ||
                     'neutral'; // Default fallback
    
    // Validate and normalize sentiment value
    if (sentiment === 'positive' || sentiment === 'negative' || sentiment === 'neutral') {
      return sentiment;
    }
    
    return 'neutral'; // Safe fallback
  }

  /** Extract urgency from unified API response with multiple fallback paths */
  private extractUrgencyFromUnified(unifiedResult: Record<string, unknown>): 'low' | 'medium' | 'high' {
    // Try multiple paths in unified response for robust extraction
    const analysis = unifiedResult?.analysis as Record<string, unknown>;
    const entities = analysis?.entities as Record<string, unknown>;
    const conversationFlow = unifiedResult?.conversationFlow as Record<string, unknown>;
    const urgency = entities?.urgency ||
                   conversationFlow?.urgency ||
                   'low'; // Default fallback
    
    // Validate and normalize urgency value
    if (urgency === 'high' || urgency === 'medium' || urgency === 'low') {
      return urgency;
    }
    
    return 'low'; // Safe fallback
  }

  /** Extract engagement from unified API response with multiple fallback paths */
  private extractEngagementFromUnified(unifiedResult: Record<string, unknown>): 'low' | 'medium' | 'high' {
    // Try multiple paths in unified response for robust extraction
    const conversationFlow = unifiedResult?.conversationFlow as Record<string, unknown>;
    const analysis = unifiedResult?.analysis as Record<string, unknown>;
    const engagement = conversationFlow?.engagementLevel ||
                      analysis?.engagementLevel ||
                      'low'; // Default fallback
    
    // Validate and normalize engagement value
    if (engagement === 'high' || engagement === 'medium' || engagement === 'low') {
      return engagement;
    }
    
    return 'low'; // Safe fallback
  }
}