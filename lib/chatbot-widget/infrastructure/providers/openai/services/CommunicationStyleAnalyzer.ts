import { ChatMessage } from '../../../../domain/entities/ChatMessage';

/**
 * Communication Style Analyzer Service
 * 
 * AI INSTRUCTIONS:
 * - Analyze user communication patterns and interaction styles
 * - Maintain single responsibility for communication analysis
 * - Keep business logic pure, no external dependencies
 * - Follow @golden-rule patterns exactly
 * - Under 100 lines following DDD patterns
 */
export class CommunicationStyleAnalyzer {

  /** Analyze communication style patterns from user messages */
  static analyzeCommunicationStyle(userMessages: ChatMessage[]): string[] {
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

  /** Analyze message engagement metrics */
  static analyzeEngagementMetrics(userMessages: ChatMessage[]): {
    averageLength: number;
    questionRatio: number;
    formalityLevel: 'formal' | 'casual' | 'mixed';
    responsePattern: string;
  } {
    const avgLength = userMessages.reduce((sum, m) => sum + m.content.length, 0) / userMessages.length;
    const questionCount = userMessages.filter(m => m.content.includes('?')).length;
    const questionRatio = questionCount / userMessages.length;

    // Analyze formality
    const formalTerms = userMessages.filter(m => 
      /please|thank you|appreciate|would like|could you|may I/i.test(m.content)
    ).length;
    const casualTerms = userMessages.filter(m => 
      /hey|hi|what's up|cool|awesome|sure|ok|yeah/i.test(m.content)
    ).length;

    let formalityLevel: 'formal' | 'casual' | 'mixed';
    if (formalTerms > casualTerms * 1.5) {
      formalityLevel = 'formal';
    } else if (casualTerms > formalTerms * 1.5) {
      formalityLevel = 'casual';
    } else {
      formalityLevel = 'mixed';
    }

    // Determine response pattern
    let responsePattern = 'Standard interaction';
    if (avgLength > 150) {
      responsePattern = 'Comprehensive responses with detailed context';
    } else if (avgLength < 25) {
      responsePattern = 'Brief, focused responses';
    } else if (questionRatio > 0.6) {
      responsePattern = 'Question-driven exploration';
    }

    return {
      averageLength: Math.round(avgLength),
      questionRatio: Math.round(questionRatio * 100) / 100,
      formalityLevel,
      responsePattern
    };
  }
}