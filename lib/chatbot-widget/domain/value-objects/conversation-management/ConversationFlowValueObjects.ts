/**
 * Conversation Flow Value Objects
 * 
 * AI INSTRUCTIONS:
 * - Keep under 250 lines per @golden-rule
 * - Single responsibility per value object
 * - Ensure immutability and validation
 * - Delegate complex operations to separate methods
 * - No external dependencies in domain layer
 */

import { InvalidConversationPhaseError, ConversationFlowViolationError } from '../../errors/ChatbotWidgetDomainErrors';

export type ConversationPhase = 'discovery' | 'qualification' | 'demo' | 'objection_handling' | 'closing';

// Constants for ConversationPhase values
export const ConversationPhaseValues = {
  DISCOVERY: 'discovery' as const,
  QUALIFICATION: 'qualification' as const,
  DEMO: 'demo' as const,
  OBJECTION_HANDLING: 'objection_handling' as const,
  CLOSING: 'closing' as const
} as const;

/** Core conversation flow management */
export class ConversationFlow {
  private constructor(
    public readonly currentPhase: ConversationPhase,
    public readonly phaseStartedAt: Date,
    public readonly phaseHistory: readonly PhaseTransition[]
  ) {}

  static create(phase: ConversationPhase = 'discovery'): ConversationFlow {
    const now = new Date();
    return new ConversationFlow(
      phase,
      now,
      [PhaseTransition.create(phase, now, 'ongoing')]
    );
  }

  transitionToPhase(newPhase: ConversationPhase): ConversationFlow {
    this.validatePhaseTransition(this.currentPhase, newPhase);
    
    const now = new Date();
    const completedTransition = this.getCurrentTransition().complete(now);
    const newTransition = PhaseTransition.create(newPhase, now, 'ongoing');
    
    return new ConversationFlow(
      newPhase,
      now,
      [...this.phaseHistory.slice(0, -1), completedTransition, newTransition]
    );
  }

  getDurationInCurrentPhase(): number {
    return Date.now() - this.phaseStartedAt.getTime();
  }

  private validatePhaseTransition(from: ConversationPhase, to: ConversationPhase): void {
    const validTransitions: Record<ConversationPhase, ConversationPhase[]> = {
      'discovery': ['qualification', 'demo', 'objection_handling'],
      'qualification': ['demo', 'objection_handling', 'closing'],
      'demo': ['qualification', 'objection_handling', 'closing'],
      'objection_handling': ['qualification', 'demo', 'closing', 'discovery'],
      'closing': ['objection_handling', 'demo']
    };

    if (!validTransitions[from].includes(to)) {
      throw new InvalidConversationPhaseError(from, to, {
        validTransitions: validTransitions[from]
      });
    }
  }

  private getCurrentTransition(): PhaseTransition {
    return this.phaseHistory[this.phaseHistory.length - 1];
  }
}

/**
 * Phase transition tracking for conversation flow
 * 
 * AI INSTRUCTIONS:
 * - Single responsibility: track phase transitions and durations
 * - Immutable with validation for state changes
 * - Handle completion and interruption scenarios
 */
export class PhaseTransition {
  private constructor(
    public readonly phase: ConversationPhase,
    public readonly startedAt: Date,
    public readonly completionStatus: 'completed' | 'interrupted' | 'ongoing',
    public readonly duration?: number
  ) {}

  static create(
    phase: ConversationPhase,
    startedAt: Date,
    status: 'completed' | 'interrupted' | 'ongoing'
  ): PhaseTransition {
    return new PhaseTransition(phase, startedAt, status);
  }

  complete(endTime: Date): PhaseTransition {
    if (this.completionStatus !== 'ongoing') {
      throw new ConversationFlowViolationError(
        `Cannot complete phase that is already ${this.completionStatus}`,
        { phase: this.phase, currentStatus: this.completionStatus }
      );
    }

    const duration = endTime.getTime() - this.startedAt.getTime();
    return new PhaseTransition(this.phase, this.startedAt, 'completed', duration);
  }

  interrupt(endTime: Date): PhaseTransition {
    if (this.completionStatus !== 'ongoing') {
      throw new ConversationFlowViolationError(
        `Cannot interrupt phase that is already ${this.completionStatus}`,
        { phase: this.phase, currentStatus: this.completionStatus }
      );
    }

    const duration = endTime.getTime() - this.startedAt.getTime();
    return new PhaseTransition(this.phase, this.startedAt, 'interrupted', duration);
  }
}

// Re-export value objects and types from separate files
export { ConversationObjectives } from './ConversationObjectives';
export { ResponseQuality, type EngagementLevel, type ResponseType } from './ResponseQuality';
export { UserBehaviorPattern, type CommunicationStyle, type FormalityLevel, type QuestioningPattern } from './UserBehaviorPattern';

 