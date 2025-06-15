/**
 * Conversation Flow Value Object
 * 
 * Domain value object representing conversation flow configuration.
 * Single responsibility: Encapsulate conversation flow settings and validation.
 */

export interface ConversationFlow {
  maxMessagesBeforeLeadCapture: number;
  leadCaptureStrategy: 'progressive' | 'upfront' | 'contextual';
  qualificationQuestionTiming: 'early' | 'mid' | 'late' | 'contextual';
  escalationPreference: 'human' | 'email' | 'phone' | 'form';
}

export class ConversationFlowSettings {
  constructor(
    public readonly flow: ConversationFlow
  ) {
    this.validate();
  }

  private validate(): void {
    this.validateConversationFlow(this.flow);
  }

  private validateConversationFlow(flow: ConversationFlow): void {
    if (typeof flow.maxMessagesBeforeLeadCapture !== 'number' || flow.maxMessagesBeforeLeadCapture < 1) {
      throw new Error('maxMessagesBeforeLeadCapture must be a positive number');
    }

    const validStrategies = ['progressive', 'upfront', 'contextual'];
    if (!validStrategies.includes(flow.leadCaptureStrategy)) {
      throw new Error(`Invalid lead capture strategy: ${flow.leadCaptureStrategy}`);
    }

    const validTimings = ['early', 'mid', 'late', 'contextual'];
    if (!validTimings.includes(flow.qualificationQuestionTiming)) {
      throw new Error(`Invalid qualification question timing: ${flow.qualificationQuestionTiming}`);
    }

    const validEscalations = ['human', 'email', 'phone', 'form'];
    if (!validEscalations.includes(flow.escalationPreference)) {
      throw new Error(`Invalid escalation preference: ${flow.escalationPreference}`);
    }
  }

  /**
   * Generate conversation management section for system prompt
   */
  public generateSystemPromptSection(): string {
    let prompt = `\n**Conversation Management:**\n`;
    prompt += `- Lead capture strategy: ${this.flow.leadCaptureStrategy}\n`;
    prompt += `- Qualification timing: ${this.flow.qualificationQuestionTiming}\n`;
    prompt += `- Max messages before lead capture: ${this.flow.maxMessagesBeforeLeadCapture}\n`;
    return prompt;
  }

  /**
   * Check if lead capture should be triggered based on message count
   */
  public shouldTriggerLeadCapture(messageCount: number): boolean {
    return messageCount >= this.flow.maxMessagesBeforeLeadCapture;
  }

  /**
   * Get lead capture strategy description
   */
  public getLeadCaptureStrategyDescription(): string {
    switch (this.flow.leadCaptureStrategy) {
      case 'progressive':
        return 'Gradually collect lead information over multiple interactions';
      case 'upfront':
        return 'Request lead information early in the conversation';
      case 'contextual':
        return 'Capture lead information when contextually appropriate';
      default:
        return this.flow.leadCaptureStrategy;
    }
  }

  /**
   * Get qualification timing description
   */
  public getQualificationTimingDescription(): string {
    switch (this.flow.qualificationQuestionTiming) {
      case 'early':
        return 'Ask qualification questions at the beginning of conversation';
      case 'mid':
        return 'Ask qualification questions in the middle of conversation';
      case 'late':
        return 'Ask qualification questions towards the end of conversation';
      case 'contextual':
        return 'Ask qualification questions when contextually relevant';
      default:
        return this.flow.qualificationQuestionTiming;
    }
  }

  /**
   * Get escalation preference description
   */
  public getEscalationPreferenceDescription(): string {
    switch (this.flow.escalationPreference) {
      case 'human':
        return 'Transfer to human agent';
      case 'email':
        return 'Collect email for follow-up';
      case 'phone':
        return 'Schedule phone call';
      case 'form':
        return 'Direct to contact form';
      default:
        return this.flow.escalationPreference;
    }
  }

  /**
   * Create a copy with updated flow
   */
  public withFlow(flow: ConversationFlow): ConversationFlowSettings {
    return new ConversationFlowSettings(flow);
  }

  /**
   * Create a copy with updated max messages
   */
  public withMaxMessagesBeforeLeadCapture(maxMessages: number): ConversationFlowSettings {
    return new ConversationFlowSettings({
      ...this.flow,
      maxMessagesBeforeLeadCapture: maxMessages
    });
  }

  /**
   * Create a copy with updated lead capture strategy
   */
  public withLeadCaptureStrategy(strategy: ConversationFlow['leadCaptureStrategy']): ConversationFlowSettings {
    return new ConversationFlowSettings({
      ...this.flow,
      leadCaptureStrategy: strategy
    });
  }

  /**
   * Create a copy with updated qualification timing
   */
  public withQualificationQuestionTiming(timing: ConversationFlow['qualificationQuestionTiming']): ConversationFlowSettings {
    return new ConversationFlowSettings({
      ...this.flow,
      qualificationQuestionTiming: timing
    });
  }

  /**
   * Create a copy with updated escalation preference
   */
  public withEscalationPreference(preference: ConversationFlow['escalationPreference']): ConversationFlowSettings {
    return new ConversationFlowSettings({
      ...this.flow,
      escalationPreference: preference
    });
  }

  /**
   * Check equality with another ConversationFlowSettings
   */
  public equals(other: ConversationFlowSettings): boolean {
    return JSON.stringify(this.flow) === JSON.stringify(other.flow);
  }

  /**
   * Convert to JSON for storage
   */
  public toJSON(): ConversationFlow {
    return this.flow;
  }

  /**
   * Create from JSON data
   */
  public static fromJSON(data: ConversationFlow): ConversationFlowSettings {
    return new ConversationFlowSettings(data || ConversationFlowSettings.getDefaultFlow());
  }

  /**
   * Create default conversation flow
   */
  public static createDefault(): ConversationFlowSettings {
    return new ConversationFlowSettings(ConversationFlowSettings.getDefaultFlow());
  }

  /**
   * Get default conversation flow
   */
  public static getDefaultFlow(): ConversationFlow {
    return {
      maxMessagesBeforeLeadCapture: 5,
      leadCaptureStrategy: 'contextual',
      qualificationQuestionTiming: 'mid',
      escalationPreference: 'human'
    };
  }
} 