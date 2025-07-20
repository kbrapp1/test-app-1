import { ChatMessage } from '../../../../domain/entities/ChatMessage';

/**
 * Buying Behavior Analyzer Service
 * 
 * AI INSTRUCTIONS:
 * - Analyze purchase decision patterns and buying signals
 * - Maintain single responsibility for buying behavior analysis
 * - Keep business logic pure, no external dependencies
 * - Follow @golden-rule patterns exactly
 * - Under 100 lines following DDD patterns
 */
export class BuyingBehaviorAnalyzer {

  /** Analyze buying behavior patterns from user messages */
  static analyzeBuyingBehavior(userMessages: ChatMessage[]): string[] {
    const patterns = [];
    
    if (userMessages.some(m => /how much|cost|price|budget/i.test(m.content))) {
      patterns.push('Price-conscious: Shows budget awareness and cost consideration');
    }
    
    if (userMessages.some(m => /demo|show me|see it|example|proof/i.test(m.content))) {
      patterns.push('Evidence-driven: Prefers demonstrations and concrete examples');
    }
    
    if (userMessages.some(m => /compare|versus|vs|alternative|competitor/i.test(m.content))) {
      patterns.push('Comparison-focused: Evaluating multiple options');
    }
    
    if (userMessages.some(m => /trial|test|pilot|try|evaluate/i.test(m.content))) {
      patterns.push('Risk-averse: Prefers testing before commitment');
    }
    
    if (userMessages.some(m => /roi|return|value|benefit|save|efficiency/i.test(m.content))) {
      patterns.push('Value-oriented: Focuses on ROI and business benefits');
    }
    
    return patterns;
  }

  /** Assess purchase intent signals */
  static assessPurchaseIntent(userMessages: ChatMessage[]): {
    intentLevel: 'low' | 'medium' | 'high';
    signals: string[];
  } {
    const signals = [];
    let score = 0;

    if (userMessages.some(m => /pricing|cost|price|budget|quote/i.test(m.content))) {
      signals.push('Pricing inquiry');
      score += 2;
    }

    if (userMessages.some(m => /buy|purchase|order|subscribe|sign up/i.test(m.content))) {
      signals.push('Direct purchase language');
      score += 3;
    }

    if (userMessages.some(m => /when|timeline|start|begin|implement/i.test(m.content))) {
      signals.push('Implementation timeline interest');
      score += 2;
    }

    const intentLevel = score >= 5 ? 'high' : score >= 2 ? 'medium' : 'low';
    
    return { intentLevel, signals };
  }
}