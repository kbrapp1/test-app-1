/**
 * Response Quality Value Object
 * 
 * AI INSTRUCTIONS:
 * - Single responsibility: track response quality metrics
 * - Immutable value object with validation
 * - Keep under 250 lines per @golden-rule
 * - Validate numeric ranges and business rules
 */

import { ConversationFlowViolationError } from '../../errors/ChatbotWidgetDomainErrors';

export type EngagementLevel = 'high' | 'medium' | 'low';
export type ResponseType = 'informational' | 'question' | 'action_request' | 'clarification';

/**
 * Tracks quality metrics for conversation responses
 * 
 * AI INSTRUCTIONS:
 * - Validate score ranges in constructor
 * - Provide immutable update methods
 * - Calculate overall quality score using business rules
 */
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
}