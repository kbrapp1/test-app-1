/**
 * Intent Inference Service
 * 
 * AI INSTRUCTIONS:
 * - Handle sophisticated intent classification and pattern recognition
 * - Maintain single responsibility for intent inference logic
 * - Keep business logic pure, no external dependencies
 * - Follow @golden-rule patterns exactly
 * - Delegate intent classification to separate methods
 * - Under 250 lines following DDD patterns
 */
export class IntentInferenceService {

  /** Infer intent from message content using advanced pattern recognition */
  static inferIntentFromMessage(content: string): string {
    const normalizedContent = content.toLowerCase().trim();
    
    // Greeting patterns
    if (this.isGreetingIntent(normalizedContent)) return 'greeting';
    
    // Pricing and budget patterns
    if (this.isPricingIntent(normalizedContent)) return 'faq_pricing';
    
    // Demo and demonstration patterns
    if (this.isDemoIntent(normalizedContent)) return 'demo_request';
    
    // Meeting and booking patterns
    if (this.isBookingIntent(normalizedContent)) return 'booking_request';
    
    // Feature and capability patterns
    if (this.isFeatureIntent(normalizedContent)) return 'faq_features';
    
    // Sales and purchase patterns
    if (this.isSalesIntent(normalizedContent)) return 'sales_inquiry';
    
    // Support and help patterns
    if (this.isSupportIntent(normalizedContent)) return 'support_request';
    
    // Qualification and business context patterns
    if (this.isQualificationIntent(normalizedContent)) return 'qualification';
    
    // Objection and concern patterns
    if (this.isObjectionIntent(normalizedContent)) return 'objection_handling';
    
    // Closing and next steps patterns
    if (this.isClosingIntent(normalizedContent)) return 'closing';
    
    // Escalation patterns
    if (this.isEscalationIntent(normalizedContent)) return 'escalation_request';
    
    // General FAQ patterns
    if (this.isGeneralFAQIntent(normalizedContent)) return 'faq_general';
    
    // Default to discovery for exploratory conversations
    return 'discovery';
  }

  /** Detect greeting intent patterns */
  private static isGreetingIntent(content: string): boolean {
    const greetingPatterns = [
      /^(hello|hi|hey|good morning|good afternoon|good evening)/i,
      /^(greetings|salutations|howdy)/i,
      /^(what's up|how are you|how's it going)/i
    ];
    
    return greetingPatterns.some(pattern => pattern.test(content));
  }

  /** Detect pricing and budget intent patterns */
  private static isPricingIntent(content: string): boolean {
    const pricingPatterns = [
      /price|cost|budget|how much|pricing|expensive|cheap|affordable/i,
      /investment|spend|pay|payment|subscription|fee/i,
      /quote|estimate|proposal|rate|charge/i
    ];
    
    return pricingPatterns.some(pattern => pattern.test(content));
  }

  /** Detect demo and demonstration intent patterns */
  private static isDemoIntent(content: string): boolean {
    const demoPatterns = [
      /demo|demonstration|show me|see it|preview|walkthrough/i,
      /example|sample|proof|evidence|trial/i,
      /can you show|let me see|i want to see/i
    ];
    
    return demoPatterns.some(pattern => pattern.test(content));
  }

  /** Detect booking and meeting intent patterns */
  private static isBookingIntent(content: string): boolean {
    const bookingPatterns = [
      /meeting|schedule|book|call|appointment|consultation/i,
      /when can we|let's meet|set up a time|calendar/i,
      /available|availability|free time|speak with someone/i
    ];
    
    return bookingPatterns.some(pattern => pattern.test(content));
  }

  /** Detect feature and capability intent patterns */
  private static isFeatureIntent(content: string): boolean {
    const featurePatterns = [
      /feature|capability|function|how does|what can|functionality/i,
      /tool|software|platform|system|solution/i,
      /does it|can it|is it possible|support/i
    ];
    
    return featurePatterns.some(pattern => pattern.test(content));
  }

  /** Detect sales and purchase intent patterns */
  private static isSalesIntent(content: string): boolean {
    const salesPatterns = [
      /buy|purchase|get started|sign up|interested in buying/i,
      /ready to|want to purchase|looking to buy/i,
      /how to get|where to buy|acquisition/i
    ];
    
    return salesPatterns.some(pattern => pattern.test(content));
  }

  /** Detect support and help intent patterns */
  private static isSupportIntent(content: string): boolean {
    const supportPatterns = [
      /help|support|problem|issue|trouble|error/i,
      /not working|broken|fix|resolve|assistance/i,
      /technical|bug|glitch|malfunction/i
    ];
    
    return supportPatterns.some(pattern => pattern.test(content));
  }

  /** Detect qualification and business context intent patterns */
  private static isQualificationIntent(content: string): boolean {
    const qualificationPatterns = [
      /company|business|team|organization|department/i,
      /we are|our company|my business|our team/i,
      /industry|sector|market|vertical/i
    ];
    
    return qualificationPatterns.some(pattern => pattern.test(content));
  }

  /** Detect objection and concern intent patterns */
  private static isObjectionIntent(content: string): boolean {
    const objectionPatterns = [
      /concern|worry|but|however|what if|problem with/i,
      /not sure|uncertain|doubt|hesitant|skeptical/i,
      /competitor|alternative|versus|compared to/i
    ];
    
    return objectionPatterns.some(pattern => pattern.test(content));
  }

  /** Detect closing and next steps intent patterns */
  private static isClosingIntent(content: string): boolean {
    const closingPatterns = [
      /next step|move forward|proceed|ready to start/i,
      /let's do it|sounds good|i'm in|count me in/i,
      /when can we begin|how do we start|what's next/i
    ];
    
    return closingPatterns.some(pattern => pattern.test(content));
  }

  /** Detect escalation intent patterns */
  private static isEscalationIntent(content: string): boolean {
    const escalationPatterns = [
      /speak to someone|talk to a person|human|representative/i,
      /manager|supervisor|sales team|expert/i,
      /complex|complicated|specific requirements/i
    ];
    
    return escalationPatterns.some(pattern => pattern.test(content));
  }

  /** Detect general FAQ intent patterns */
  private static isGeneralFAQIntent(content: string): boolean {
    const generalPatterns = [
      /what is|who are|where are|when did|why do/i,
      /tell me about|information about|learn more/i,
      /how long|how many|what kind/i
    ];
    
    return generalPatterns.some(pattern => pattern.test(content));
  }

  /** Infer sentiment from message content */
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

  /** Assess engagement level from message content */
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

  /** Determine conversation phase based on intent progression */
  static determineConversationPhase(recentIntents: string[]): string {
    if (recentIntents.length === 0) return 'initial';
    
    const _latestIntent = recentIntents[recentIntents.length - 1];
    
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

  /** Calculate intent confidence score */
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