import { ChatMessage } from '../../../../domain/entities/ChatMessage';
import { BehavioralPatternOrchestrator } from './BehavioralPatternOrchestrator';

/**
 * Behavioral Pattern Analyzer Service (Backward Compatibility Layer)
 * 
 * AI INSTRUCTIONS:
 * - Maintains backward compatibility with existing API
 * - Delegates to specialized analyzer services via orchestrator
 * - Keep business logic pure, no external dependencies
 * - Follow @golden-rule patterns exactly
 * - Under 50 lines following DDD patterns
 * 
 * @deprecated Use BehavioralPatternOrchestrator for new implementations
 */
export class BehavioralPatternAnalyzer {

  /** Extract comprehensive behavioral patterns from conversation */
  static extractBehaviorSignals(conversationHistory: ChatMessage[]): string[] {
    return BehavioralPatternOrchestrator.extractBehaviorSignals(conversationHistory);
  }

  /** Analyze engagement progression patterns */
  static analyzeEngagementProgression(conversationHistory: ChatMessage[]): {
    trend: string;
    quality: string;
    depth: string;
  } {
    return BehavioralPatternOrchestrator.analyzeEngagementProgression(conversationHistory);
  }

  /** Identify conversation momentum indicators */
  static identifyMomentumIndicators(conversationHistory: ChatMessage[]): string[] {
    return BehavioralPatternOrchestrator.identifyMomentumIndicators(conversationHistory);
  }

  /** Assess conversation readiness for next action */
  static assessActionReadiness(conversationHistory: ChatMessage[]): {
    readyForDemo: boolean;
    readyForContact: boolean;
    readyForEscalation: boolean;
    confidence: number;
  } {
    return BehavioralPatternOrchestrator.assessActionReadiness(conversationHistory);
  }
}