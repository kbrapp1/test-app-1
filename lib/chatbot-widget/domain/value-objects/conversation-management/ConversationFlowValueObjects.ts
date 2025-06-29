/**
 * Conversation Flow Value Objects
 * 
 * AI INSTRUCTIONS:
 * - Ensure immutability and validation for all value objects
 * - Delegate complex operations to separate methods
 * - Keep business logic pure, no external dependencies
 * - Follow @golden-rule patterns exactly
 * - Validate inputs using domain-specific business rules
 */

import { InvalidConversationPhaseError, ConversationFlowViolationError } from '../../errors/ContextManagementErrors';

export type ConversationPhase = 'discovery' | 'qualification' | 'demo' | 'objection_handling' | 'closing';

// Constants for ConversationPhase values
export const ConversationPhaseValues = {
  DISCOVERY: 'discovery' as const,
  QUALIFICATION: 'qualification' as const,
  DEMO: 'demo' as const,
  OBJECTION_HANDLING: 'objection_handling' as const,
  CLOSING: 'closing' as const
} as const;

export type ResponseType = 'informational' | 'question' | 'action_request' | 'clarification';

export type EngagementLevel = 'high' | 'medium' | 'low';

export type CommunicationStyle = 'brief' | 'detailed' | 'comprehensive';

export type FormalityLevel = 'casual' | 'professional' | 'technical';

export type QuestioningPattern = 'direct' | 'exploratory' | 'skeptical';

export class ConversationFlow {
  private constructor(
    public readonly currentPhase: ConversationPhase,
    public readonly phaseStartedAt: Date,
    public readonly phaseHistory: readonly PhaseTransition[],
    public readonly objectives: ConversationObjectives
  ) {}

  static create(
    phase: ConversationPhase = 'discovery',
    objectives?: Partial<ConversationObjectives>
  ): ConversationFlow {
    const now = new Date();
    
    return new ConversationFlow(
      phase,
      now,
      [PhaseTransition.create(phase, now, 'ongoing')],
      ConversationObjectives.create(objectives)
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
      [...this.phaseHistory.slice(0, -1), completedTransition, newTransition],
      this.objectives
    );
  }

  updateObjectives(updates: Partial<ConversationObjectives>): ConversationFlow {
    return new ConversationFlow(
      this.currentPhase,
      this.phaseStartedAt,
      this.phaseHistory,
      this.objectives.update(updates)
    );
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

  getDurationInCurrentPhase(): number {
    return Date.now() - this.phaseStartedAt.getTime();
  }

  getPhaseCompletionRate(): number {
    const achievedCount = this.objectives.achieved.length;
    const totalCount = this.objectives.achieved.length + this.objectives.secondary.length + 
                      (this.objectives.primary ? 1 : 0);
    
    return totalCount > 0 ? achievedCount / totalCount : 0;
  }
}

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

export class ConversationObjectives {
  private constructor(
    public readonly primary?: string,
    public readonly secondary: readonly string[] = [],
    public readonly achieved: readonly string[] = [],
    public readonly blocked: readonly string[] = []
  ) {}

  static create(objectives?: Partial<ConversationObjectives>): ConversationObjectives {
    return new ConversationObjectives(
      objectives?.primary,
      objectives?.secondary || [],
      objectives?.achieved || [],
      objectives?.blocked || []
    );
  }

  update(updates: Partial<ConversationObjectives>): ConversationObjectives {
    return new ConversationObjectives(
      updates.primary ?? this.primary,
      updates.secondary ?? this.secondary,
      updates.achieved ?? this.achieved,
      updates.blocked ?? this.blocked
    );
  }

  achieveObjective(objective: string): ConversationObjectives {
    if (this.achieved.includes(objective)) {
      return this; // Already achieved
    }

    // Remove from secondary or blocked if present
    const newSecondary = this.secondary.filter(obj => obj !== objective);
    const newBlocked = this.blocked.filter(obj => obj !== objective);
    const newAchieved = [...this.achieved, objective];

    return new ConversationObjectives(
      this.primary,
      newSecondary,
      newAchieved,
      newBlocked
    );
  }

  blockObjective(objective: string, reason?: string): ConversationObjectives {
    if (this.blocked.includes(objective)) {
      return this; // Already blocked
    }

    const newBlocked = [...this.blocked, objective];
    
    return new ConversationObjectives(
      this.primary,
      this.secondary,
      this.achieved,
      newBlocked
    );
  }

  addSecondaryObjective(objective: string): ConversationObjectives {
    if (this.secondary.includes(objective) || this.achieved.includes(objective)) {
      return this; // Already exists
    }

    return new ConversationObjectives(
      this.primary,
      [...this.secondary, objective],
      this.achieved,
      this.blocked
    );
  }
}

export class ResponseQuality {
  private constructor(
    public readonly coherenceScore: number,
    public readonly userEngagement: EngagementLevel,
    public readonly lastResponseEffective: boolean,
    public readonly misunderstandingCount: number,
    public readonly topicDrift: number,
    public readonly lastResponseType: ResponseType
  ) {
    this.validateCoherenceScore(coherenceScore);
    this.validateTopicDrift(topicDrift);
    this.validateMisunderstandingCount(misunderstandingCount);
  }

  static create(
    coherenceScore: number,
    engagement: EngagementLevel,
    effective: boolean,
    misunderstandings: number,
    drift: number,
    responseType: ResponseType
  ): ResponseQuality {
    return new ResponseQuality(
      coherenceScore,
      engagement,
      effective,
      misunderstandings,
      drift,
      responseType
    );
  }

  static createDefault(): ResponseQuality {
    return new ResponseQuality(0.8, 'medium', true, 0, 0.0, 'informational');
  }

  updateCoherence(newScore: number): ResponseQuality {
    return new ResponseQuality(
      newScore,
      this.userEngagement,
      this.lastResponseEffective,
      this.misunderstandingCount,
      this.topicDrift,
      this.lastResponseType
    );
  }

  recordMisunderstanding(): ResponseQuality {
    return new ResponseQuality(
      this.coherenceScore,
      this.userEngagement,
      false,
      this.misunderstandingCount + 1,
      this.topicDrift,
      this.lastResponseType
    );
  }

  updateEngagement(level: EngagementLevel): ResponseQuality {
    return new ResponseQuality(
      this.coherenceScore,
      level,
      this.lastResponseEffective,
      this.misunderstandingCount,
      this.topicDrift,
      this.lastResponseType
    );
  }

  updateTopicDrift(drift: number): ResponseQuality {
    return new ResponseQuality(
      this.coherenceScore,
      this.userEngagement,
      this.lastResponseEffective,
      this.misunderstandingCount,
      drift,
      this.lastResponseType
    );
  }

  updateResponseType(type: ResponseType, effective: boolean): ResponseQuality {
    return new ResponseQuality(
      this.coherenceScore,
      this.userEngagement,
      effective,
      this.misunderstandingCount,
      this.topicDrift,
      type
    );
  }

  private validateCoherenceScore(score: number): void {
    if (score < 0 || score > 1) {
      throw new ConversationFlowViolationError(
        'Coherence score must be between 0 and 1',
        { providedScore: score }
      );
    }
  }

  private validateTopicDrift(drift: number): void {
    if (drift < 0 || drift > 1) {
      throw new ConversationFlowViolationError(
        'Topic drift must be between 0 and 1',
        { providedDrift: drift }
      );
    }
  }

  private validateMisunderstandingCount(count: number): void {
    if (count < 0 || !Number.isInteger(count)) {
      throw new ConversationFlowViolationError(
        'Misunderstanding count must be a non-negative integer',
        { providedCount: count }
      );
    }
  }

  getOverallQualityScore(): number {
    const engagementScore = this.userEngagement === 'high' ? 1.0 : 
                           this.userEngagement === 'medium' ? 0.6 : 0.3;
    const effectivenessScore = this.lastResponseEffective ? 1.0 : 0.0;
    const misunderstandingPenalty = Math.min(this.misunderstandingCount * 0.1, 0.5);
    
    return Math.max(0, (
      this.coherenceScore * 0.3 +
      engagementScore * 0.3 +
      effectivenessScore * 0.2 +
      (1 - this.topicDrift) * 0.2 -
      misunderstandingPenalty
    ));
  }
}

export class UserBehaviorPattern {
  private constructor(
    public readonly communicationStyle: {
      preferredResponseLength: CommunicationStyle;
      formalityLevel: FormalityLevel;
      questioningPattern: QuestioningPattern;
    },
    public readonly engagementMetrics: {
      averageSessionDuration: number;
      messagesPerSession: number;
      dropOffPoints: readonly string[];
    }
  ) {}

  static create(
    style: {
      preferredResponseLength: CommunicationStyle;
      formalityLevel: FormalityLevel;
      questioningPattern: QuestioningPattern;
    },
    metrics: {
      averageSessionDuration: number;
      messagesPerSession: number;
      dropOffPoints: readonly string[];
    }
  ): UserBehaviorPattern {
    return new UserBehaviorPattern(style, metrics);
  }

  static createDefault(): UserBehaviorPattern {
    return new UserBehaviorPattern(
      {
        preferredResponseLength: 'detailed',
        formalityLevel: 'professional',
        questioningPattern: 'direct'
      },
      {
        averageSessionDuration: 0,
        messagesPerSession: 0,
        dropOffPoints: []
      }
    );
  }

  updateCommunicationStyle(updates: Partial<UserBehaviorPattern['communicationStyle']>): UserBehaviorPattern {
    return new UserBehaviorPattern(
      {
        ...this.communicationStyle,
        ...updates
      },
      this.engagementMetrics
    );
  }

  updateEngagementMetrics(updates: Partial<UserBehaviorPattern['engagementMetrics']>): UserBehaviorPattern {
    return new UserBehaviorPattern(
      this.communicationStyle,
      {
        ...this.engagementMetrics,
        ...updates
      }
    );
  }

  addDropOffPoint(point: string): UserBehaviorPattern {
    if (this.engagementMetrics.dropOffPoints.includes(point)) {
      return this; // Already exists
    }

    return new UserBehaviorPattern(
      this.communicationStyle,
      {
        ...this.engagementMetrics,
        dropOffPoints: [...this.engagementMetrics.dropOffPoints, point]
      }
    );
  }
} 