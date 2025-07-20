import { ChatMessage } from '../../../../domain/entities/ChatMessage';

/**
 * Engagement Assessment Analyzer Service
 * 
 * AI INSTRUCTIONS:
 * - Analyze engagement progression and conversation readiness
 * - Maintain single responsibility for engagement assessment
 * - Keep business logic pure, no external dependencies
 * - Follow @golden-rule patterns exactly
 * - Under 150 lines following DDD patterns
 */
export class EngagementAssessmentAnalyzer {

  /** Analyze urgency and timeline patterns */
  static analyzeUrgencyPatterns(userMessages: ChatMessage[]): string[] {
    const patterns = [];
    
    if (userMessages.some(m => /urgent|asap|quickly|soon|immediately/i.test(m.content))) {
      patterns.push('Urgency-driven: Has time-sensitive requirements');
    }
    
    if (userMessages.some(m => /deadline|timeline|schedule|by when|timeframe/i.test(m.content))) {
      patterns.push('Timeline-conscious: Focused on implementation schedules');
    }
    
    if (userMessages.some(m => /planning|future|roadmap|long.term|strategy/i.test(m.content))) {
      patterns.push('Strategic planner: Takes long-term view of implementation');
    }
    
    if (userMessages.some(m => /now|today|this week|this month|current/i.test(m.content))) {
      patterns.push('Immediate-need: Requires quick implementation');
    }
    
    return patterns;
  }

  /** Analyze engagement progression patterns */
  static analyzeEngagementProgression(conversationHistory: ChatMessage[]): {
    trend: string;
    quality: string;
    depth: string;
  } {
    const userMessages = conversationHistory.filter(m => m.messageType === 'user');
    
    if (userMessages.length < 2) {
      return { trend: 'initial', quality: 'baseline', depth: 'surface' };
    }
    
    // Analyze message length progression
    const firstHalf = userMessages.slice(0, Math.ceil(userMessages.length / 2));
    const secondHalf = userMessages.slice(Math.ceil(userMessages.length / 2));
    
    const firstHalfAvg = firstHalf.reduce((sum, m) => sum + m.content.length, 0) / firstHalf.length;
    const secondHalfAvg = secondHalf.reduce((sum, m) => sum + m.content.length, 0) / secondHalf.length;
    
    const trend = secondHalfAvg > firstHalfAvg * 1.2 ? 'increasing' : 
                  secondHalfAvg < firstHalfAvg * 0.8 ? 'decreasing' : 'stable';
    
    // Analyze engagement quality
    const businessTermCount = userMessages.filter(m => 
      /company|business|team|organization|solution|implement|integrate/i.test(m.content)
    ).length;
    
    const quality = businessTermCount / userMessages.length > 0.5 ? 'high' : 
                   businessTermCount / userMessages.length > 0.2 ? 'medium' : 'low';
    
    // Analyze conversation depth
    const detailLevel = userMessages.some(m => m.content.length > 150) ? 'deep' :
                       userMessages.some(m => m.content.length > 75) ? 'medium' : 'surface';
    
    return { trend, quality, depth: detailLevel };
  }

  /** Identify conversation momentum indicators */
  static identifyMomentumIndicators(conversationHistory: ChatMessage[]): string[] {
    const userMessages = conversationHistory.filter(m => m.messageType === 'user');
    const indicators = [];
    
    if (userMessages.length > 5) {
      indicators.push('Extended engagement demonstrates sustained interest');
    }
    
    if (userMessages.some(m => m.content.length > 150)) {
      indicators.push('Detailed responses indicate high investment level');
    }
    
    if (userMessages.filter(m => m.content.includes('?')).length > 2) {
      indicators.push('Multiple questions show active information seeking');
    }
    
    const businessContext = userMessages.filter(m => 
      /company|business|team|organization|budget|timeline|decision/i.test(m.content)
    ).length;
    
    if (businessContext > 1) {
      indicators.push('Business context sharing indicates qualification progression');
    }
    
    const recentMessages = userMessages.slice(-2);
    if (recentMessages.some(m => /when|how|next|start|begin|implement/i.test(m.content))) {
      indicators.push('Forward-looking language suggests readiness to proceed');
    }
    
    return indicators.length > 0 ? indicators : ['Building initial engagement momentum'];
  }

  /** Assess conversation readiness for next action */
  static assessActionReadiness(conversationHistory: ChatMessage[]): {
    readyForDemo: boolean;
    readyForContact: boolean;
    readyForEscalation: boolean;
    confidence: number;
  } {
    const userMessages = conversationHistory.filter(m => m.messageType === 'user');
    
    const hasBusinessContext = userMessages.some(m => 
      /company|business|organization|team/i.test(m.content)
    );
    
    const hasAuthoritySignals = userMessages.some(m => 
      /decision|budget|approve|purchase|manager|director|ceo/i.test(m.content)
    );
    
    const hasInterest = userMessages.some(m => 
      /interested|demo|show|example|pricing|cost/i.test(m.content)
    );
    
    const hasUrgency = userMessages.some(m => 
      /urgent|soon|asap|timeline|deadline/i.test(m.content)
    );
    
    const engagementLevel = userMessages.length > 3 && 
      userMessages.reduce((sum, m) => sum + m.content.length, 0) / userMessages.length > 50;
    
    const readyForDemo = hasInterest && (hasBusinessContext || engagementLevel);
    const readyForContact = hasBusinessContext && hasAuthoritySignals && hasInterest;
    const readyForEscalation = hasAuthoritySignals && hasUrgency && hasBusinessContext;
    
    let confidence = 0;
    if (hasBusinessContext) confidence += 25;
    if (hasAuthoritySignals) confidence += 25;
    if (hasInterest) confidence += 25;
    if (engagementLevel) confidence += 25;
    
    return { readyForDemo, readyForContact, readyForEscalation, confidence };
  }
}