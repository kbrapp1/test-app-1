import { ChatMessage } from '../../../../domain/entities/ChatMessage';

/**
 * Behavioral Pattern Analyzer Service
 * 
 * AI INSTRUCTIONS:
 * - Analyze user behavioral patterns for conversation optimization
 * - Maintain single responsibility for behavior analysis
 * - Keep business logic pure, no external dependencies
 * - Follow @golden-rule patterns exactly
 * - Delegate pattern recognition to separate methods
 * - Under 250 lines following DDD patterns
 */
export class BehavioralPatternAnalyzer {

  /** Extract comprehensive behavioral patterns from conversation */
  static extractBehaviorSignals(conversationHistory: ChatMessage[]): string[] {
    const patterns = [];
    const userMessages = conversationHistory.filter(m => m.messageType === 'user');
    
    // Analyze buying behavior patterns
    patterns.push(...this.analyzeBuyingBehavior(userMessages));
    
    // Analyze communication patterns
    patterns.push(...this.analyzeCommunicationStyle(userMessages));
    
    // Analyze decision-making patterns
    patterns.push(...this.analyzeDecisionMakingStyle(userMessages));
    
    // Analyze technical sophistication
    patterns.push(...this.analyzeTechnicalSophistication(userMessages));
    
    // Analyze urgency patterns
    patterns.push(...this.analyzeUrgencyPatterns(userMessages));
    
    return patterns.length > 0 ? patterns : ['Standard information-seeking behavior'];
  }

  /** Analyze buying behavior patterns */
  private static analyzeBuyingBehavior(userMessages: ChatMessage[]): string[] {
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

  /** Analyze communication style patterns */
  private static analyzeCommunicationStyle(userMessages: ChatMessage[]): string[] {
    const patterns = [];
    
    const avgMessageLength = userMessages.reduce((sum, m) => sum + m.content.length, 0) / userMessages.length;
    
    if (avgMessageLength > 100) {
      patterns.push('Detailed communicator: Provides comprehensive context');
    } else if (avgMessageLength < 30) {
      patterns.push('Concise communicator: Prefers brief interactions');
    }
    
    const questionCount = userMessages.filter(m => m.content.includes('?')).length;
    const questionRatio = questionCount / userMessages.length;
    
    if (questionRatio > 0.7) {
      patterns.push('Inquisitive: Asks many clarifying questions');
    }
    
    if (userMessages.some(m => /please|thank you|appreciate|grateful/i.test(m.content))) {
      patterns.push('Polite: Uses courteous language consistently');
    }
    
    if (userMessages.some(m => /immediately|asap|urgent|quickly|fast/i.test(m.content))) {
      patterns.push('Direct: Expresses urgency and time sensitivity');
    }
    
    return patterns;
  }

  /** Analyze decision-making style patterns */
  private static analyzeDecisionMakingStyle(userMessages: ChatMessage[]): string[] {
    const patterns = [];
    
    if (userMessages.some(m => /team|company|organization|we|our|us/i.test(m.content))) {
      patterns.push('Collaborative: Considers team and organizational impact');
    }
    
    if (userMessages.some(m => /decide|decision|choose|select|approve/i.test(m.content))) {
      patterns.push('Decisive: Shows clear decision-making authority');
    }
    
    if (userMessages.some(m => /process|steps|procedure|workflow|implementation/i.test(m.content))) {
      patterns.push('Process-oriented: Focuses on implementation details');
    }
    
    if (userMessages.some(m => /stakeholder|boss|manager|approval|budget owner/i.test(m.content))) {
      patterns.push('Consultative: Involves other stakeholders in decisions');
    }
    
    if (userMessages.some(m => /research|evaluate|analyze|study|investigate/i.test(m.content))) {
      patterns.push('Analytical: Conducts thorough research before deciding');
    }
    
    return patterns;
  }

  /** Analyze technical sophistication patterns */
  private static analyzeTechnicalSophistication(userMessages: ChatMessage[]): string[] {
    const patterns = [];
    
    if (userMessages.some(m => /integrate|api|technical|system|architecture/i.test(m.content))) {
      patterns.push('Technical focus: Interested in implementation and integration details');
    }
    
    if (userMessages.some(m => /security|compliance|gdpr|hipaa|soc2/i.test(m.content))) {
      patterns.push('Security-conscious: Prioritizes compliance and data protection');
    }
    
    if (userMessages.some(m => /scale|scalability|performance|load|volume/i.test(m.content))) {
      patterns.push('Scalability-focused: Considers growth and performance requirements');
    }
    
    if (userMessages.some(m => /feature|functionality|capability|tool|software/i.test(m.content))) {
      patterns.push('Feature-oriented: Evaluates specific capabilities and tools');
    }
    
    if (userMessages.some(m => /user experience|ux|ui|interface|usability/i.test(m.content))) {
      patterns.push('UX-aware: Values user experience and interface design');
    }
    
    return patterns;
  }

  /** Analyze urgency and timeline patterns */
  private static analyzeUrgencyPatterns(userMessages: ChatMessage[]): string[] {
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

  /** Analyze engagement progression patterns */
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

  /** Identify conversation momentum indicators */
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

  /** Assess conversation readiness for next action */
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