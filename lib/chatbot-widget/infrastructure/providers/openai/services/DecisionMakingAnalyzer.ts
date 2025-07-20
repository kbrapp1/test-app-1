import { ChatMessage } from '../../../../domain/entities/ChatMessage';

/**
 * Decision Making Analyzer Service
 * 
 * AI INSTRUCTIONS:
 * - Analyze decision-making patterns and authority signals
 * - Maintain single responsibility for decision analysis
 * - Keep business logic pure, no external dependencies
 * - Follow @golden-rule patterns exactly
 * - Under 100 lines following DDD patterns
 */
export class DecisionMakingAnalyzer {

  /** Analyze decision-making style patterns from user messages */
  static analyzeDecisionMakingStyle(userMessages: ChatMessage[]): string[] {
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

  /** Analyze technical sophistication patterns */
  static analyzeTechnicalSophistication(userMessages: ChatMessage[]): string[] {
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

  /** Assess decision authority level */
  static assessAuthorityLevel(userMessages: ChatMessage[]): {
    level: 'individual' | 'influencer' | 'decision-maker';
    signals: string[];
  } {
    const signals = [];
    let score = 0;

    if (userMessages.some(m => /I decide|I choose|I approve|my decision/i.test(m.content))) {
      signals.push('Direct decision authority');
      score += 3;
    }

    if (userMessages.some(m => /manager|director|ceo|head of|lead|owner/i.test(m.content))) {
      signals.push('Leadership role indicators');
      score += 2;
    }

    if (userMessages.some(m => /budget|procurement|purchasing|vendor/i.test(m.content))) {
      signals.push('Budget authority signals');
      score += 2;
    }

    if (userMessages.some(m => /team|staff|employees|department/i.test(m.content))) {
      signals.push('Team leadership references');
      score += 1;
    }

    const level = score >= 4 ? 'decision-maker' : score >= 2 ? 'influencer' : 'individual';
    
    return { level, signals };
  }
}