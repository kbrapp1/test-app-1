/**
 * Session Initialized Domain Event
 * 
 * AI INSTRUCTIONS:
 * - Represents the business event of a chat session being initialized
 * - Immutable data structure with all relevant context
 * - Follow @golden-rule domain event patterns
 * - Include timestamp and aggregate information
 */

export class SessionInitializedEvent {
  public readonly eventType = 'SessionInitialized';
  public readonly occurredAt: Date;

  constructor(
    public readonly sessionId: string,
    public readonly chatbotConfigId: string,
    public readonly visitorId: string,
    public readonly context: {
      configName: string;
      cacheWarmed: boolean;
      timestamp: Date;
    }
  ) {
    this.occurredAt = new Date();
  }

  /**
   * Get event data for serialization
   * 
   * AI INSTRUCTIONS:
   * - Provide clean data structure for event persistence
   * - Include all relevant context for event handlers
   */
  toEventData(): Record<string, any> {
    return {
      eventType: this.eventType,
      sessionId: this.sessionId,
      chatbotConfigId: this.chatbotConfigId,
      visitorId: this.visitorId,
      configName: this.context.configName,
      cacheWarmed: this.context.cacheWarmed,
      occurredAt: this.occurredAt.toISOString(),
      timestamp: this.context.timestamp.toISOString()
    };
  }
} 