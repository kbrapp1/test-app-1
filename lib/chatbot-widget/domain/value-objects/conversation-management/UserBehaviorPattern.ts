/**
 * User Behavior Pattern Value Object
 * 
 * AI INSTRUCTIONS:
 * - Single responsibility: track user communication patterns
 * - Immutable value object with focused operations
 * - Keep under 250 lines per @golden-rule
 * - Provide clear defaults and update methods
 */

export type CommunicationStyle = 'brief' | 'detailed' | 'comprehensive';
export type FormalityLevel = 'casual' | 'professional' | 'technical';
export type QuestioningPattern = 'direct' | 'exploratory' | 'skeptical';

/** Tracks user communication style and engagement patterns */
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