/**
 * Intent Analysis Result Value Object
 * 
 * Immutable value object representing the complete result of intent analysis
 * - Type-safe intent analysis data
 * - Encapsulates all intent-related analysis in single object
 * - Follows DDD value object patterns
 */
export interface IntentAnalysisResult {
  readonly intent: string;
  readonly sentiment: string;
  readonly engagementLevel: string;
  readonly conversationPhase: string;
  readonly confidence: number;
  readonly analysisTimestamp: Date;
}

export class IntentAnalysisResultBuilder {
  private _intent: string = 'discovery';
  private _sentiment: string = 'neutral';
  private _engagementLevel: string = 'low';
  private _conversationPhase: string = 'initial';
  private _confidence: number = 50;

  withIntent(intent: string): IntentAnalysisResultBuilder {
    this._intent = intent;
    return this;
  }

  withSentiment(sentiment: string): IntentAnalysisResultBuilder {
    this._sentiment = sentiment;
    return this;
  }

  withEngagementLevel(level: string): IntentAnalysisResultBuilder {
    this._engagementLevel = level;
    return this;
  }

  withConversationPhase(phase: string): IntentAnalysisResultBuilder {
    this._conversationPhase = phase;
    return this;
  }

  withConfidence(confidence: number): IntentAnalysisResultBuilder {
    this._confidence = confidence;
    return this;
  }

  build(): IntentAnalysisResult {
    return {
      intent: this._intent,
      sentiment: this._sentiment,
      engagementLevel: this._engagementLevel,
      conversationPhase: this._conversationPhase,
      confidence: this._confidence,
      analysisTimestamp: new Date()
    };
  }
}