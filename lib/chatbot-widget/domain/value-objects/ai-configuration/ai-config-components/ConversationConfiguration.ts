/**
 * Conversation Configuration Value Object
 * 
 * AI INSTRUCTIONS:
 * - Single responsibility: Manage conversation flow configuration
 * - Handle conversation limits and flow control
 * - Keep under 200-250 lines
 * - Focus on conversation configuration only
 * - Follow @golden-rule patterns exactly
 */

export interface ConversationConfigurationProps {
  maxConversationTurns: number;
  inactivityTimeoutSeconds: number;
  enableJourneyRegression: boolean;
  enableContextSwitchDetection: boolean;
}

export class ConversationConfiguration {
  private constructor(private readonly props: ConversationConfigurationProps) {
    this.validateProps(props);
  }

  static create(props: ConversationConfigurationProps): ConversationConfiguration {
    return new ConversationConfiguration(props);
  }

  static createDefault(): ConversationConfiguration {
    return new ConversationConfiguration({
      maxConversationTurns: 20,
      inactivityTimeoutSeconds: 300,
      enableJourneyRegression: true,
      enableContextSwitchDetection: true
    });
  }

  private validateProps(props: ConversationConfigurationProps): void {
    if (props.maxConversationTurns < 1) {
      throw new Error('Max conversation turns must be at least 1');
    }
    
    if (props.maxConversationTurns > 100) {
      throw new Error('Max conversation turns cannot exceed 100');
    }
    
    if (props.inactivityTimeoutSeconds < 30) {
      throw new Error('Inactivity timeout must be at least 30 seconds');
    }
    
    if (props.inactivityTimeoutSeconds > 3600) {
      throw new Error('Inactivity timeout cannot exceed 1 hour');
    }
  }

  // Getters
  get maxConversationTurns(): number { return this.props.maxConversationTurns; }
  get inactivityTimeoutSeconds(): number { return this.props.inactivityTimeoutSeconds; }
  get enableJourneyRegression(): boolean { return this.props.enableJourneyRegression; }
  get enableContextSwitchDetection(): boolean { return this.props.enableContextSwitchDetection; }

  // Business methods
  update(updates: Partial<ConversationConfigurationProps>): ConversationConfiguration {
    return new ConversationConfiguration({
      ...this.props,
      ...updates
    });
  }

  updateMaxTurns(maxTurns: number): ConversationConfiguration {
    return this.update({ maxConversationTurns: maxTurns });
  }

  updateInactivityTimeout(timeoutSeconds: number): ConversationConfiguration {
    return this.update({ inactivityTimeoutSeconds: timeoutSeconds });
  }

  enableJourney(): ConversationConfiguration {
    return this.update({ enableJourneyRegression: true });
  }

  disableJourney(): ConversationConfiguration {
    return this.update({ enableJourneyRegression: false });
  }

  enableContextSwitch(): ConversationConfiguration {
    return this.update({ enableContextSwitchDetection: true });
  }

  disableContextSwitch(): ConversationConfiguration {
    return this.update({ enableContextSwitchDetection: false });
  }

  isConversationLimitReached(currentTurns: number): boolean {
    return currentTurns >= this.props.maxConversationTurns;
  }

  getRemainingTurns(currentTurns: number): number {
    return Math.max(0, this.props.maxConversationTurns - currentTurns);
  }

  getInactivityTimeoutMinutes(): number {
    return Math.round(this.props.inactivityTimeoutSeconds / 60);
  }

  isShortConversation(): boolean {
    return this.props.maxConversationTurns <= 5;
  }

  isLongConversation(): boolean {
    return this.props.maxConversationTurns >= 50;
  }

  isQuickTimeout(): boolean {
    return this.props.inactivityTimeoutSeconds <= 60;
  }

  isExtendedTimeout(): boolean {
    return this.props.inactivityTimeoutSeconds >= 1800; // 30 minutes
  }

  getConversationStyle(): 'brief' | 'standard' | 'extended' {
    if (this.isShortConversation()) return 'brief';
    if (this.isLongConversation()) return 'extended';
    return 'standard';
  }

  toPlainObject(): ConversationConfigurationProps {
    return { ...this.props };
  }
} 