import { ChatMessage } from '../../../../domain/entities/ChatMessage';
import { BuyingBehaviorAnalyzer } from './BuyingBehaviorAnalyzer';
import { CommunicationStyleAnalyzer } from './CommunicationStyleAnalyzer';
import { DecisionMakingAnalyzer } from './DecisionMakingAnalyzer';
import { EngagementAssessmentAnalyzer } from './EngagementAssessmentAnalyzer';

/**
 * Behavioral Pattern Orchestrator Service
 * 
 * AI INSTRUCTIONS:
 * - Orchestrate all behavioral pattern analyzers with single API
 * - Maintain backward compatibility with original BehavioralPatternAnalyzer
 * - Keep business logic pure, no external dependencies
 * - Follow @golden-rule patterns exactly
 * - Under 100 lines following DDD patterns
 */
export class BehavioralPatternOrchestrator {

  /** Extract comprehensive behavioral patterns from conversation (Original API) */
  static extractBehaviorSignals(conversationHistory: ChatMessage[]): string[] {
    const patterns = [];
    const userMessages = conversationHistory.filter(m => m.messageType === 'user');
    
    // Analyze buying behavior patterns
    patterns.push(...BuyingBehaviorAnalyzer.analyzeBuyingBehavior(userMessages));
    
    // Analyze communication patterns
    patterns.push(...CommunicationStyleAnalyzer.analyzeCommunicationStyle(userMessages));
    
    // Analyze decision-making patterns
    patterns.push(...DecisionMakingAnalyzer.analyzeDecisionMakingStyle(userMessages));
    
    // Analyze technical sophistication
    patterns.push(...DecisionMakingAnalyzer.analyzeTechnicalSophistication(userMessages));
    
    // Analyze urgency patterns
    patterns.push(...EngagementAssessmentAnalyzer.analyzeUrgencyPatterns(userMessages));
    
    return patterns.length > 0 ? patterns : ['Standard information-seeking behavior'];
  }

  /** Analyze engagement progression patterns (Original API) */
  static analyzeEngagementProgression(conversationHistory: ChatMessage[]): {
    trend: string;
    quality: string;
    depth: string;
  } {
    return EngagementAssessmentAnalyzer.analyzeEngagementProgression(conversationHistory);
  }

  /** Identify conversation momentum indicators (Original API) */
  static identifyMomentumIndicators(conversationHistory: ChatMessage[]): string[] {
    return EngagementAssessmentAnalyzer.identifyMomentumIndicators(conversationHistory);
  }

  /** Assess conversation readiness for next action (Original API) */
  static assessActionReadiness(conversationHistory: ChatMessage[]): {
    readyForDemo: boolean;
    readyForContact: boolean;
    readyForEscalation: boolean;
    confidence: number;
  } {
    return EngagementAssessmentAnalyzer.assessActionReadiness(conversationHistory);
  }

  /** Comprehensive behavioral analysis with all patterns */
  static getComprehensiveAnalysis(conversationHistory: ChatMessage[]): {
    behaviorSignals: string[];
    buyingIntent: ReturnType<typeof BuyingBehaviorAnalyzer.assessPurchaseIntent>;
    communicationMetrics: ReturnType<typeof CommunicationStyleAnalyzer.analyzeEngagementMetrics>;
    authorityLevel: ReturnType<typeof DecisionMakingAnalyzer.assessAuthorityLevel>;
    engagementProgression: ReturnType<typeof EngagementAssessmentAnalyzer.analyzeEngagementProgression>;
    momentumIndicators: string[];
    actionReadiness: ReturnType<typeof EngagementAssessmentAnalyzer.assessActionReadiness>;
  } {
    const userMessages = conversationHistory.filter(m => m.messageType === 'user');

    return {
      behaviorSignals: this.extractBehaviorSignals(conversationHistory),
      buyingIntent: BuyingBehaviorAnalyzer.assessPurchaseIntent(userMessages),
      communicationMetrics: CommunicationStyleAnalyzer.analyzeEngagementMetrics(userMessages),
      authorityLevel: DecisionMakingAnalyzer.assessAuthorityLevel(userMessages),
      engagementProgression: this.analyzeEngagementProgression(conversationHistory),
      momentumIndicators: this.identifyMomentumIndicators(conversationHistory),
      actionReadiness: this.assessActionReadiness(conversationHistory)
    };
  }
}