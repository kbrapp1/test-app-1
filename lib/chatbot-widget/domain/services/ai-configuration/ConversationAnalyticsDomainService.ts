/**
 * Conversation Analytics Domain Service
 * 
 * Pure business logic for analyzing conversation patterns and user behavior
 * - Sentiment analysis, engagement assessment, conversation phase logic
 * - No external dependencies, pure domain logic
 * - Follows single responsibility for conversation analytics
 * - Under 80 lines following DDD patterns
 */
export class ConversationAnalyticsDomainService {

  /** Infer sentiment from message content */
  static inferSentiment(content: string): string {
    const positiveWords = /great|excellent|love|amazing|perfect|awesome|fantastic|wonderful|outstanding|impressed/i;
    const negativeWords = /problem|issue|concern|worry|frustrated|difficult|bad|terrible|awful|disappointed|angry/i;
    const neutralWords = /okay|fine|alright|sure|maybe|perhaps/i;
    
    if (positiveWords.test(content)) return 'positive';
    if (negativeWords.test(content)) return 'negative';
    if (neutralWords.test(content)) return 'neutral';
    
    // Analyze sentence structure for sentiment
    if (content.includes('!') && !negativeWords.test(content)) return 'positive';
    if (content.includes('?') && content.length > 50) return 'curious';
    
    return 'neutral';
  }

  /** Assess engagement level from message content */
  static assessEngagementLevel(content: string): string {
    const wordCount = content.split(' ').length;
    const hasQuestions = content.includes('?');
    const hasExclamation = content.includes('!');
    const hasBusinessTerms = /company|business|team|solution|implement|integrate/i.test(content);
    
    let score = 0;
    
    // Length-based scoring
    if (wordCount > 20) score += 2;
    else if (wordCount > 10) score += 1;
    
    // Engagement indicators
    if (hasQuestions) score += 1;
    if (hasExclamation) score += 1;
    if (hasBusinessTerms) score += 2;
    
    // Special patterns for high engagement
    if (/detailed|specific|comprehensive|thorough/i.test(content)) score += 1;
    if (/when|how|what|why|where/i.test(content)) score += 1;
    
    if (score >= 5) return 'high';
    if (score >= 3) return 'medium';
    return 'low';
  }

  /** Determine conversation phase based on intent progression */
  static determineConversationPhase(recentIntents: string[]): string {
    if (recentIntents.length === 0) return 'initial';
    
    // Analyze intent progression
    const hasGreeting = recentIntents.includes('greeting');
    const hasDiscovery = recentIntents.includes('discovery') || recentIntents.includes('faq_general');
    const hasQualification = recentIntents.includes('qualification');
    const hasInterest = recentIntents.includes('sales_inquiry') || recentIntents.includes('demo_request');
    const hasClosing = recentIntents.includes('closing') || recentIntents.includes('booking_request');
    
    if (hasClosing) return 'closing';
    if (hasInterest && hasQualification) return 'qualification';
    if (hasInterest) return 'exploration';
    if (hasDiscovery) return 'discovery';
    if (hasGreeting) return 'greeting';
    
    return 'discovery'; // Default phase
  }

  /** Calculate intent confidence score */
  static calculateIntentConfidence(content: string, inferredIntent: string): number {
    const wordCount = content.split(' ').length;
    
    let confidence = 50; // Base confidence
    
    // Adjust based on content quality
    if (wordCount > 10) confidence += 10;
    if (wordCount > 20) confidence += 10;
    
    // Adjust based on intent-specific patterns
    switch (inferredIntent) {
      case 'greeting':
        confidence += /^(hello|hi|hey)/i.test(content) ? 30 : 10;
        break;
      case 'faq_pricing':
        confidence += /price|cost|budget/i.test(content) ? 25 : 0;
        break;
      case 'demo_request':
        confidence += /demo|show|see/i.test(content) ? 25 : 0;
        break;
      case 'booking_request':
        confidence += /meeting|schedule|call/i.test(content) ? 25 : 0;
        break;
      default:
        confidence += 5; // Small boost for other intents
    }
    
    // Cap confidence at 95
    return Math.min(confidence, 95);
  }
}