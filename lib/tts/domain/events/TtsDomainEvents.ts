/**
 * TTS Domain Events for Audit Trail and Cross-Aggregate Communication
 * 
 * AI INSTRUCTIONS:
 * - Include organization context in all events
 * - Capture relevant business data for compliance
 * - Enable cross-domain event handling
 * - Follow immutable event pattern
 * - Use for audit trail and business analytics
 */

export abstract class TtsDomainEvent {
  public readonly eventType: string;
  public readonly timestamp: Date;
  public readonly eventId: string;

  constructor(eventType: string, timestamp: Date = new Date()) {
    this.eventType = eventType;
    this.timestamp = timestamp;
    this.eventId = crypto.randomUUID();
  }
}

/**
 * Event published when a speech generation request is initiated
 * 
 * AI INSTRUCTIONS:
 * - Captures initial request for audit trail
 * - Includes text length for usage analytics
 * - Organization context for data isolation
 */
export class SpeechGenerationRequestedEvent extends TtsDomainEvent {
  constructor(
    public readonly predictionId: string,
    public readonly userId: string,
    public readonly organizationId: string,
    public readonly textLength: number,
    public readonly voiceId: string,
    public readonly provider: string,
    timestamp: Date = new Date()
  ) {
    super('SpeechGenerationRequested', timestamp);
  }
}

/**
 * Event published when speech generation completes successfully
 * 
 * AI INSTRUCTIONS:
 * - Captures successful completion for analytics
 * - Includes processing metrics for performance monitoring
 * - Audio URL for downstream processing
 */
export class SpeechGenerationCompletedEvent extends TtsDomainEvent {
  constructor(
    public readonly predictionId: string,
    public readonly userId: string,
    public readonly organizationId: string,
    public readonly audioUrl: string,
    public readonly processingTimeMs: number,
    public readonly provider: string,
    public readonly audioLengthSeconds?: number,
    timestamp: Date = new Date()
  ) {
    super('SpeechGenerationCompleted', timestamp);
  }
}

/**
 * Event published when speech generation fails
 * 
 * AI INSTRUCTIONS:
 * - Captures failures for error analysis
 * - Includes error context for debugging
 * - Enables failure rate monitoring
 */
export class SpeechGenerationFailedEvent extends TtsDomainEvent {
  constructor(
    public readonly predictionId: string,
    public readonly userId: string,
    public readonly organizationId: string,
    public readonly errorMessage: string,
    public readonly errorCode: string,
    public readonly provider: string,
    public readonly processingTimeMs: number,
    timestamp: Date = new Date()
  ) {
    super('SpeechGenerationFailed', timestamp);
  }
}

/**
 * Event published when TTS audio is saved to DAM system
 * 
 * AI INSTRUCTIONS:
 * - Captures cross-domain integration
 * - Links TTS prediction to DAM asset
 * - Enables asset lifecycle tracking
 */
export class TtsAudioSavedToDamEvent extends TtsDomainEvent {
  constructor(
    public readonly predictionId: string,
    public readonly damAssetId: string,
    public readonly userId: string,
    public readonly organizationId: string,
    public readonly fileName: string,
    public readonly audioUrl: string,
    timestamp: Date = new Date()
  ) {
    super('TtsAudioSavedToDam', timestamp);
  }
}

/**
 * Event published when TTS history item is deleted
 * 
 * AI INSTRUCTIONS:
 * - Captures data deletion for compliance
 * - Includes metadata for audit trail
 * - Enables cleanup tracking
 */
export class TtsHistoryDeletedEvent extends TtsDomainEvent {
  constructor(
    public readonly predictionId: string,
    public readonly userId: string,
    public readonly organizationId: string,
    public readonly deletedBy: string,
    public readonly textLength: number,
    public readonly hadAudio: boolean,
    timestamp: Date = new Date()
  ) {
    super('TtsHistoryDeleted', timestamp);
  }
}

/**
 * Event published when TTS audio is exported/downloaded
 * 
 * AI INSTRUCTIONS:
 * - Captures export activity for usage analytics
 * - Includes export format and context
 * - Enables download tracking
 */
export class TtsAudioExportedEvent extends TtsDomainEvent {
  constructor(
    public readonly predictionId: string,
    public readonly userId: string,
    public readonly organizationId: string,
    public readonly exportFormat: string,
    public readonly fileName: string,
    timestamp: Date = new Date()
  ) {
    super('TtsAudioExported', timestamp);
  }
}

/**
 * Event published when TTS settings are modified
 * 
 * AI INSTRUCTIONS:
 * - Captures configuration changes for audit
 * - Includes old and new values for comparison
 * - Organization-level settings tracking
 */
export class TtsSettingsUpdatedEvent extends TtsDomainEvent {
  constructor(
    public readonly organizationId: string,
    public readonly updatedBy: string,
    public readonly settingName: string,
    public readonly oldValue: unknown,
    public readonly newValue: unknown,
    timestamp: Date = new Date()
  ) {
    super('TtsSettingsUpdated', timestamp);
  }
}

/**
 * Union type of all TTS domain events for type safety
 * 
 * AI INSTRUCTIONS:
 * - Use for event handler type checking
 * - Enables exhaustive pattern matching
 * - Maintains type safety across event processing
 */
export type TtsDomainEventUnion =
  | SpeechGenerationRequestedEvent
  | SpeechGenerationCompletedEvent
  | SpeechGenerationFailedEvent
  | TtsAudioSavedToDamEvent
  | TtsHistoryDeletedEvent
  | TtsAudioExportedEvent
  | TtsSettingsUpdatedEvent; 