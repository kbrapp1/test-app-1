/**
 * Summary Extraction Service
 * 
 * AI INSTRUCTIONS:
 * - Single responsibility: Extract string content from summary objects
 * - Consolidates extractSummaryText and ensureStringFormat logic
 * - Follow @golden-rule patterns: Pure functions, type-safe
 * - Keep under 150 lines following DRY principle
 */

export interface ConversationSummaryObject {
  fullSummary?: string;
  overview?: string;
  [key: string]: unknown;
}

export class SummaryExtractionService {
  
  /**
   * Extract string from any conversation summary format
   * Consolidates: extractSummaryText() and ensureStringFormat()
   */
  static extractSummaryText(summary?: string | ConversationSummaryObject): string {
    if (!summary) return '';
    if (typeof summary === 'string') return summary;
    
    if (typeof summary === 'object') {
      // Handle enhanced summary format with fullSummary property
      if (summary.fullSummary && typeof summary.fullSummary === 'string') {
        return summary.fullSummary;
      }
      
      // Handle case where summary object has overview property
      if (summary.overview && typeof summary.overview === 'string') {
        return summary.overview;
      }
      
      // Handle any object by extracting first string value
      const stringValues = Object.values(summary).filter(value => 
        typeof value === 'string' && value.length > 0
      );
      
      if (stringValues.length > 0) {
        return stringValues[0] as string;
      }
      
      // Last resort: stringify the object
      try {
        return JSON.stringify(summary);
      } catch {
        return '';
      }
    }
    
    // Convert any other type to string
    return String(summary);
  }

  /**
   * Create a simple conversation summary from message count and content preview
   * Consolidates createSimpleConversationSummary patterns
   */
  static createSimpleSummary(
    userMessageCount: number,
    totalMessageCount: number,
    lastUserMessageContent?: string
  ): string {
    if (userMessageCount === 0) {
      return 'No user messages yet';
    }

    let summary = `Conversation with ${userMessageCount} user messages (${totalMessageCount} total).`;
    
    if (lastUserMessageContent) {
      const preview = lastUserMessageContent.substring(0, 100);
      summary += ` Latest user message: "${preview}${lastUserMessageContent.length > 100 ? '...' : ''}"`;
    }

    return summary;
  }

  /**
   * Extract conversation summary for lead data
   * Consolidates LeadDataFactory.createConversationSummary pattern
   */
  static extractForLeadData(
    conversationSummary?: ConversationSummaryObject | string,
    fallbackTopics?: string[]
  ): string {
    // Try to extract from summary object first
    const extractedSummary = this.extractSummaryText(conversationSummary);
    
    if (extractedSummary && extractedSummary !== 'New conversation started') {
      return extractedSummary;
    }

    // Fallback to topics if available
    if (fallbackTopics && fallbackTopics.length > 0) {
      return `Chatbot session discussing: ${fallbackTopics.join(', ')}`;
    }

    return 'General chatbot conversation session';
  }

  /**
   * Validate if a summary object has meaningful content
   */
  static hasValidSummaryContent(summary?: string | ConversationSummaryObject): boolean {
    const extracted = this.extractSummaryText(summary);
    return extracted.length > 0 && 
           extracted !== 'New conversation started' && 
           extracted !== 'No user messages yet' &&
           extracted !== 'No valid messages yet';
  }

  /**
   * Get summary length for token counting
   */
  static getSummaryLength(summary?: string | ConversationSummaryObject): number {
    const extracted = this.extractSummaryText(summary);
    return extracted.length;
  }

  /**
   * Normalize summary for storage
   * Ensures consistent format when saving to database
   */
  static normalizeForStorage(summary: string): ConversationSummaryObject {
    return {
      fullSummary: summary,
      phaseSummaries: [],
      criticalMoments: []
    };
  }
} 