/**
 * Business Context Score Domain Service
 * 
 * AI INSTRUCTIONS:
 * - Single responsibility: Calculate business context scores
 * - Pure domain service with lead qualification focus
 * - Follow @golden-rule patterns exactly
 * - Focus on lead score and conversation phase
 * - Keep under 100 lines - focused implementation
 */

import { ChatMessage } from '../../entities/ChatMessage';

/**
 * Domain Service for calculating business context scores
 * Scores messages based on lead qualification and business phase
 */
export class BusinessContextScoreService {
  
  /**
   * Conversation phase scoring weights
   * 
   * AI INSTRUCTIONS:
   * - Higher scores for business-critical conversation phases
   * - Adjust based on lead qualification and business value
   * - Focus on conversion potential
   */
  private static readonly PHASE_SCORES: Record<string, number> = {
    'discovery': 0.6,
    'qualification': 1.0,    // Critical for lead assessment
    'demo': 0.8,
    'objection_handling': 0.9,
    'closing': 1.0,          // Critical business outcome
    'evaluation': 0.9,
    'unknown': 0.3
  };
  
  /**
   * Calculate business context score based on lead qualification signals
   * 
   * AI INSTRUCTIONS:
   * - Simplified scoring focused on lead score and phase
   * - Weight lead score higher than phase
   * - Return score between 0.0 and 1.0
   */
  static calculateBusinessContextScore(
    message: ChatMessage,
    leadScore: number,
    conversationPhase: string
  ): number {
    // Start with lead score as primary business indicator (0-100 scale)
    let businessScore = Math.min(1.0, leadScore / 100);
    
    // Conversation phase influence (business-critical phases get higher scores)
    const phaseScore = this.PHASE_SCORES[conversationPhase] || 0.5;
    
    // Weight lead score higher than phase, but both contribute
    const combinedScore = (businessScore * 0.6) + (phaseScore * 0.4);
    
    return Math.min(1.0, combinedScore);
  }
  
  /**
   * Get conversation phase importance score
   * 
   * AI INSTRUCTIONS:
   * - Return business importance score for specific conversation phases
   * - Higher scores for more conversion-critical phases
   * - Used for weighted calculations
   */
  static getConversationPhaseScore(phase: string): number {
    return this.PHASE_SCORES[phase] || 0.5;
  }
  
  /**
   * Calculate lead score normalization
   * 
   * AI INSTRUCTIONS:
   * - Normalize lead scores to 0.0-1.0 range
   * - Handle edge cases and invalid scores
   * - Provide consistent scoring range
   */
  static normalizeLeadScore(leadScore: number): number {
    // Handle invalid scores
    if (isNaN(leadScore) || leadScore < 0) {
      return 0.0;
    }
    
    // Normalize to 0.0-1.0 range (assuming 0-100 input scale)
    return Math.min(1.0, leadScore / 100);
  }
  
  /**
   * Calculate combined business value score
   * 
   * AI INSTRUCTIONS:
   * - Combine lead score and phase importance
   * - Apply business-optimized weighting
   * - Provide comprehensive business context scoring
   */
  static calculateCombinedBusinessScore(
    leadScore: number,
    conversationPhase: string,
    customWeights?: { leadWeight: number; phaseWeight: number }
  ): number {
    const weights = customWeights || { leadWeight: 0.6, phaseWeight: 0.4 };
    
    const normalizedLeadScore = this.normalizeLeadScore(leadScore);
    const phaseScore = this.getConversationPhaseScore(conversationPhase);
    
    return Math.min(1.0, 
      (normalizedLeadScore * weights.leadWeight) + 
      (phaseScore * weights.phaseWeight)
    );
  }
} 