/**
 * Response Behavior Value Object
 * 
 * Domain value object representing bot response behavior configuration.
 * Single responsibility: Encapsulate response behavior settings and validation.
 */

export interface ResponseBehavior {
  useEmojis: boolean;
  askFollowUpQuestions: boolean;
  proactiveOffering: boolean; // Proactively offer help/resources
  personalizeResponses: boolean; // Use visitor's name, reference previous context
  acknowledgePreviousInteractions: boolean;
}

export class ResponseBehaviorSettings {
  constructor(
    public readonly behavior: ResponseBehavior
  ) {
    this.validate();
  }

  private validate(): void {
    this.validateResponseBehavior(this.behavior);
  }

  private validateResponseBehavior(behavior: ResponseBehavior): void {
    if (typeof behavior.useEmojis !== 'boolean') {
      throw new Error('useEmojis must be a boolean');
    }

    if (typeof behavior.askFollowUpQuestions !== 'boolean') {
      throw new Error('askFollowUpQuestions must be a boolean');
    }

    if (typeof behavior.proactiveOffering !== 'boolean') {
      throw new Error('proactiveOffering must be a boolean');
    }

    if (typeof behavior.personalizeResponses !== 'boolean') {
      throw new Error('personalizeResponses must be a boolean');
    }

    if (typeof behavior.acknowledgePreviousInteractions !== 'boolean') {
      throw new Error('acknowledgePreviousInteractions must be a boolean');
    }
  }

  /** Generate behavior guidelines section for system prompt */
  public generateSystemPromptSection(): string {
    let prompt = `**Behavior Guidelines:**\n`;
    
    if (this.behavior.useEmojis) {
      prompt += `- Use emojis appropriately to enhance communication\n`;
    } else {
      prompt += `- Maintain professional communication without emojis\n`;
    }

    if (this.behavior.askFollowUpQuestions) {
      prompt += `- Ask relevant follow-up questions to maintain engagement\n`;
    }

    if (this.behavior.proactiveOffering) {
      prompt += `- Proactively offer help and relevant resources\n`;
    }

    if (this.behavior.personalizeResponses) {
      prompt += `- Personalize responses using visitor's name and context\n`;
    }

    if (this.behavior.acknowledgePreviousInteractions) {
      prompt += `- Reference previous interactions when relevant\n`;
    }

    return prompt;
  }

  /** Create a copy with updated behavior */
  public withBehavior(behavior: ResponseBehavior): ResponseBehaviorSettings {
    return new ResponseBehaviorSettings(behavior);
  }

  /** Create a copy with updated emoji usage */
  public withUseEmojis(useEmojis: boolean): ResponseBehaviorSettings {
    return new ResponseBehaviorSettings({
      ...this.behavior,
      useEmojis
    });
  }

  /** Create a copy with updated follow-up questions setting */
  public withAskFollowUpQuestions(askFollowUpQuestions: boolean): ResponseBehaviorSettings {
    return new ResponseBehaviorSettings({
      ...this.behavior,
      askFollowUpQuestions
    });
  }

  /** Create a copy with updated proactive offering setting */
  public withProactiveOffering(proactiveOffering: boolean): ResponseBehaviorSettings {
    return new ResponseBehaviorSettings({
      ...this.behavior,
      proactiveOffering
    });
  }

  /** Create a copy with updated personalization setting */
  public withPersonalizeResponses(personalizeResponses: boolean): ResponseBehaviorSettings {
    return new ResponseBehaviorSettings({
      ...this.behavior,
      personalizeResponses
    });
  }

  /** Create a copy with updated acknowledgment setting */
  public withAcknowledgePreviousInteractions(acknowledgePreviousInteractions: boolean): ResponseBehaviorSettings {
    return new ResponseBehaviorSettings({
      ...this.behavior,
      acknowledgePreviousInteractions
    });
  }

  /** Check equality with another ResponseBehaviorSettings */
  public equals(other: ResponseBehaviorSettings): boolean {
    return JSON.stringify(this.behavior) === JSON.stringify(other.behavior);
  }

  /** Convert to JSON for storage */
  public toJSON(): ResponseBehavior {
    return this.behavior;
  }

  /** Create from JSON data */
  public static fromJSON(data: ResponseBehavior): ResponseBehaviorSettings {
    return new ResponseBehaviorSettings(data || ResponseBehaviorSettings.getDefaultBehavior());
  }

  /** Create default response behavior */
  public static createDefault(): ResponseBehaviorSettings {
    return new ResponseBehaviorSettings(ResponseBehaviorSettings.getDefaultBehavior());
  }

  /** Get default response behavior */
  public static getDefaultBehavior(): ResponseBehavior {
    return {
      useEmojis: false,
      askFollowUpQuestions: true,
      proactiveOffering: true,
      personalizeResponses: true,
      acknowledgePreviousInteractions: true
    };
  }
} 