/**
 * Message Intent Analysis Service
 * 
 * AI INSTRUCTIONS:
 * - Handle intent detection and classification from messages
 * - Focus on user intent patterns and keyword matching
 * - Keep under 200 lines following @golden-rule patterns
 * - Use domain-specific intent categories
 * - Maintain single responsibility for intent analysis
 */

import { ChatMessage } from '../../entities/ChatMessage';

export class MessageIntentAnalysisService {
  /**
   * Detect user intent from messages
   */
  detectUserIntent(userMessages: ChatMessage[]): string {
    const intentKeywords = {
      'purchase': ['buy', 'purchase', 'order', 'payment', 'checkout'],
      'information': ['info', 'information', 'learn', 'tell me', 'what is'],
      'demo': ['demo', 'demonstration', 'show me', 'see it'],
      'trial': ['trial', 'test', 'try'],
      'support': ['help', 'problem', 'issue', 'support'],
      'pricing': ['price', 'cost', 'pricing', 'how much'],
      'comparison': ['compare', 'vs', 'versus', 'alternative'],
    };

    const intentCounts: Record<string, number> = {};
    
    userMessages.forEach(message => {
      const content = message.content.toLowerCase();
      
      Object.entries(intentKeywords).forEach(([intent, keywords]) => {
        const matches = keywords.filter(keyword => content.includes(keyword));
        intentCounts[intent] = (intentCounts[intent] || 0) + matches.length;
      });
    });

    const topIntent = Object.entries(intentCounts)
      .sort(([,a], [,b]) => b - a)[0];
    
    return topIntent ? topIntent[0] : 'general_inquiry';
  }

  /**
   * Analyze intent confidence level
   */
  analyzeIntentConfidence(userMessages: ChatMessage[], detectedIntent: string): number {
    if (userMessages.length === 0) return 0;

    const intentKeywords = this.getIntentKeywords();
    const keywords = intentKeywords[detectedIntent] || [];
    
    let matchCount = 0;
    let totalWords = 0;

    userMessages.forEach(message => {
      const content = message.content.toLowerCase();
      const words = content.split(/\s+/);
      totalWords += words.length;
      
      keywords.forEach(keyword => {
        if (content.includes(keyword)) {
          matchCount++;
        }
      });
    });

    // Calculate confidence based on keyword density
    const confidence = Math.min(matchCount / Math.max(totalWords / 10, 1), 1);
    return Math.round(confidence * 100) / 100; // Round to 2 decimal places
  }

  /**
   * Get all possible intents with their keywords
   */
  private getIntentKeywords(): Record<string, string[]> {
    return {
      'purchase': ['buy', 'purchase', 'order', 'payment', 'checkout', 'subscribe', 'sign up'],
      'information': ['info', 'information', 'learn', 'tell me', 'what is', 'how does', 'explain'],
      'demo': ['demo', 'demonstration', 'show me', 'see it', 'preview', 'walkthrough'],
      'trial': ['trial', 'test', 'try', 'free trial', 'evaluate', 'pilot'],
      'support': ['help', 'problem', 'issue', 'support', 'assistance', 'trouble'],
      'pricing': ['price', 'cost', 'pricing', 'how much', 'expensive', 'budget'],
      'comparison': ['compare', 'vs', 'versus', 'alternative', 'competitor', 'difference'],
      'integration': ['integrate', 'api', 'connect', 'sync', 'import', 'export'],
      'features': ['feature', 'functionality', 'capability', 'can it', 'does it'],
      'security': ['secure', 'security', 'privacy', 'data protection', 'compliance']
    };
  }

  /**
   * Detect multiple intents in messages
   */
  detectMultipleIntents(userMessages: ChatMessage[]): Array<{
    intent: string;
    confidence: number;
    keywords: string[];
  }> {
    const intentKeywords = this.getIntentKeywords();
    const intentResults: Array<{ intent: string; confidence: number; keywords: string[] }> = [];

    Object.entries(intentKeywords).forEach(([intent, keywords]) => {
      let matchCount = 0;
      const foundKeywords: string[] = [];

      userMessages.forEach(message => {
        const content = message.content.toLowerCase();
        
        keywords.forEach(keyword => {
          if (content.includes(keyword)) {
            matchCount++;
            if (!foundKeywords.includes(keyword)) {
              foundKeywords.push(keyword);
            }
          }
        });
      });

      if (matchCount > 0) {
        const confidence = this.analyzeIntentConfidence(userMessages, intent);
        intentResults.push({
          intent,
          confidence,
          keywords: foundKeywords
        });
      }
    });

    // Sort by confidence and return top intents
    return intentResults
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 3); // Return top 3 intents
  }

  /**
   * Classify intent category
   */
  classifyIntentCategory(intent: string): 'sales' | 'support' | 'information' | 'technical' {
    const salesIntents = ['purchase', 'pricing', 'trial', 'demo', 'comparison'];
    const supportIntents = ['support', 'help', 'problem'];
    const informationIntents = ['information', 'general_inquiry'];
    const technicalIntents = ['integration', 'features', 'security'];

    if (salesIntents.includes(intent)) return 'sales';
    if (supportIntents.includes(intent)) return 'support';
    if (technicalIntents.includes(intent)) return 'technical';
    return 'information';
  }

  /**
   * Comprehensive intent analysis
   */
  analyzeIntentComprehensive(userMessages: ChatMessage[]): {
    primaryIntent: string;
    confidence: number;
    category: 'sales' | 'support' | 'information' | 'technical';
    allIntents: Array<{ intent: string; confidence: number; keywords: string[] }>;
  } {
    const primaryIntent = this.detectUserIntent(userMessages);
    const confidence = this.analyzeIntentConfidence(userMessages, primaryIntent);
    const category = this.classifyIntentCategory(primaryIntent);
    const allIntents = this.detectMultipleIntents(userMessages);

    return {
      primaryIntent,
      confidence,
      category,
      allIntents
    };
  }
} 