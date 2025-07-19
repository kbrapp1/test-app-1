/**
 * Journey Stage Mapper
 * 
 * AI INSTRUCTIONS:
 * - Maps lead scores to customer journey stages following business rules
 * - Handles stage progression and completion tracking
 * - Maintains DDD principle: Pure mapping logic without external dependencies
 * - Supports consistent journey stage determination across the application
 */

import { EnhancedContext, JourneyState, IntentAnalysis, UnifiedAnalysis } from './WorkflowTypes';

export class JourneyStageMapper {
  /**
   * Build journey state from enhanced context lead scoring data
   */
  static buildJourneyState(enhancedContext: EnhancedContext): JourneyState | undefined {
    if (enhancedContext?.leadScore) {
      const leadScore = enhancedContext.leadScore;
      const stage = this.mapLeadScoreToStage(leadScore.totalScore);
      return {
        currentStage: stage,
        completedStages: this.getCompletedStages(stage),
        nextRecommendedStage: this.getNextStage(stage),
        progressPercentage: leadScore.totalScore
      };
    }

    return undefined;
  }

  /**
   * Build intent analysis from unified API response
   */
  static buildIntentAnalysis(enhancedContext: EnhancedContext): IntentAnalysis | undefined {
    if (enhancedContext?.unifiedAnalysis) {
      const analysis = enhancedContext.unifiedAnalysis;
      return {
        primaryIntent: analysis.primaryIntent || 'unknown',
        confidence: analysis.primaryConfidence || 0,
        entities: this.extractEntitiesFromAnalysis(analysis),
        followUpIntents: []
      };
    }

    return undefined;
  }

  /**
   * Map lead score to journey stage using business rules
   */
  private static mapLeadScoreToStage(totalScore: number): string {
    if (totalScore >= 80) return 'qualified-ready';
    if (totalScore >= 70) return 'qualified';
    if (totalScore >= 50) return 'interested';
    if (totalScore >= 30) return 'engaged';
    return 'initial';
  }

  /**
   * Get completed stages based on current stage
   */
  private static getCompletedStages(currentStage: string): string[] {
    const stageOrder = ['initial', 'engaged', 'interested', 'qualified', 'qualified-ready'];
    const currentIndex = stageOrder.indexOf(currentStage);
    return currentIndex > 0 ? stageOrder.slice(0, currentIndex) : [];
  }

  /**
   * Get next recommended stage in progression
   */
  private static getNextStage(currentStage: string): string | undefined {
    const stageOrder = ['initial', 'engaged', 'interested', 'qualified', 'qualified-ready'];
    const currentIndex = stageOrder.indexOf(currentStage);
    return currentIndex < stageOrder.length - 1 ? stageOrder[currentIndex + 1] : undefined;
  }

  /**
   * Extract entities from unified analysis response
   */
  private static extractEntitiesFromAnalysis(analysis: UnifiedAnalysis): Array<{ name: string; value: string; confidence: number }> {
    if (!analysis.entities) return [];
    
    return Object.entries(analysis.entities).map(([name, value]) => ({
      name,
      value: String(value),
      confidence: 1.0
    }));
  }
}