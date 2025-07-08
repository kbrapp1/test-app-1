/**
 * Intent Alignment Score Domain Service
 * 
 * AI INSTRUCTIONS:
 * - Single responsibility: Calculate intent alignment scores
 * - Pure domain service with conversation intent focus
 * - Follow @golden-rule patterns exactly
 * - Trust AI intent determination over keyword matching
 * - Keep under 100 lines - focused implementation
 */

import { ChatMessage } from '../../entities/ChatMessage';
import { IntentResult } from '../../value-objects/message-processing/IntentResult';

/**
 * Domain Service for calculating intent alignment scores
 * Scores messages based on alignment with current conversation intent
 */
export class IntentAlignmentScoreService {
  
  /** Phase-based relevance scoring weights */
  private static readonly PHASE_SCORES: Record<string, number> = {
    'faq_pricing': 0.8,      // High business value
    'faq_features': 0.7,     // Product understanding
    'demo_request': 0.95,    // Critical conversion moment
    'support_request': 0.6,  // Moderate business value
    'sales_inquiry': 0.9,    // High conversion potential
    'booking_request': 1.0,  // Critical business outcome
    'qualification': 1.0,    // Essential lead data
    'unknown': 0.3           // Low but not zero
  };
  
  /** Calculate intent alignment score based on current conversation intent */
  static calculateIntentAlignmentScore(
    message: ChatMessage,
    currentIntent: IntentResult
  ): number {
    if (!currentIntent?.intent) {
      return 0.3; // Base score when no intent context available
    }
    
    // Trust AI intent determination - high confidence intents indicate important messages
    const confidenceScore = currentIntent.confidence || 0.5;
    
    // Phase-based relevance scoring (business context over keyword matching)
    const phaseScore = this.PHASE_SCORES[currentIntent.intent] || 0.5;
    
    // Combine confidence and phase importance
    return Math.min(1.0, (confidenceScore * 0.4) + (phaseScore * 0.6));
  }
  
  /** Get phase importance score */
  static getPhaseImportanceScore(intent: string): number {
    return this.PHASE_SCORES[intent] || 0.5;
  }
  
  /**
   * Calculate confidence-weighted score
   * 
   * AI INSTRUCTIONS:
   * - Weight intent score by AI confidence level
   * - Higher confidence = more reliable scoring
   * - Provide fallback for low confidence intents
   */
  static calculateConfidenceWeightedScore(
    intentResult: IntentResult,
    baseScore: number = 0.5
  ): number {
    if (!intentResult?.confidence) {
      return baseScore;
    }
    
    // Apply confidence weighting
    const confidenceWeight = Math.min(1.0, intentResult.confidence);
    const weightedScore = baseScore * confidenceWeight;
    
    // Ensure minimum score for any identified intent
    return Math.max(0.2, weightedScore);
  }
} 