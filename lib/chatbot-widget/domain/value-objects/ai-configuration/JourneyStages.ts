/**
 * Journey Stages Value Object
 * 
 * Encapsulates journey stage definitions and transition logic
 * following DDD principles for the chatbot domain.
 */

export const JOURNEY_STAGES = [
  'visitor',
  'curious', 
  'interested',
  'evaluating',
  'ready_to_buy',
  'qualified_lead',
  'converted',
  'lost'
] as const;

export type JourneyStage = typeof JOURNEY_STAGES[number];

export const SALES_READY_STAGES: readonly JourneyStage[] = ['ready_to_buy', 'qualified_lead'];
export const ACTIVELY_ENGAGED_STAGES: readonly JourneyStage[] = ['curious', 'interested', 'evaluating', 'ready_to_buy'];

/**
 * Journey Stages Value Object
 * Provides structured access to journey stages and transition rules
 */
export class JourneyStages {
  
  static getAllJourneyStages(): readonly JourneyStage[] {
    return JOURNEY_STAGES;
  }

  static getSalesReadyStages(): readonly JourneyStage[] {
    return SALES_READY_STAGES;
  }

  static getActivelyEngagedStages(): readonly JourneyStage[] {
    return ACTIVELY_ENGAGED_STAGES;
  }

  static isValidJourneyStage(stage: string): stage is JourneyStage {
    return JOURNEY_STAGES.includes(stage as JourneyStage);
  }

  static isSalesReady(stage: JourneyStage): boolean {
    return SALES_READY_STAGES.includes(stage);
  }

  static isActivelyEngaged(stage: JourneyStage): boolean {
    return ACTIVELY_ENGAGED_STAGES.includes(stage);
  }

  static canTransitionTo(fromStage: JourneyStage, toStage: JourneyStage): boolean {
    const fromIndex = JOURNEY_STAGES.indexOf(fromStage);
    const toIndex = JOURNEY_STAGES.indexOf(toStage);
    
    // Allow forward progression or staying in same stage
    // Special case: can transition to 'lost' from any stage
    return toIndex >= fromIndex || toStage === 'lost';
  }

  static getNextStage(currentStage: JourneyStage): JourneyStage | null {
    const currentIndex = JOURNEY_STAGES.indexOf(currentStage);
    
    if (currentIndex === -1 || currentIndex >= JOURNEY_STAGES.length - 1) {
      return null;
    }
    
    return JOURNEY_STAGES[currentIndex + 1];
  }

  static getPreviousStage(currentStage: JourneyStage): JourneyStage | null {
    const currentIndex = JOURNEY_STAGES.indexOf(currentStage);
    
    if (currentIndex <= 0) {
      return null;
    }
    
    return JOURNEY_STAGES[currentIndex - 1];
  }
}