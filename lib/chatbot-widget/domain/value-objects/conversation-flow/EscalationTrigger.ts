/**
 * Escalation Trigger Value Object
 * 
 * Domain value object representing escalation trigger configuration and logic.
 * Single responsibility: Encapsulate escalation trigger behavior and validation.
 */

export interface EscalationTrigger {
  type: 'keyword' | 'sentiment' | 'complexity' | 'frustration' | 'request';
  value: string;
  threshold?: number; // For sentiment/complexity scores
  description: string;
}

export class EscalationTriggerCollection {
  constructor(
    public readonly triggers: EscalationTrigger[]
  ) {
    this.validate();
  }

  private validate(): void {
    if (!Array.isArray(this.triggers)) {
      throw new Error('Escalation triggers must be an array');
    }

    this.triggers.forEach((trigger, index) => {
      this.validateEscalationTrigger(trigger, index);
    });
  }

  private validateEscalationTrigger(trigger: EscalationTrigger, index: number): void {
    const validTypes = ['keyword', 'sentiment', 'complexity', 'frustration', 'request'];
    if (!validTypes.includes(trigger.type)) {
      throw new Error(`Invalid escalation trigger type at index ${index}: ${trigger.type}`);
    }

    if (typeof trigger.value !== 'string' || trigger.value.trim().length === 0) {
      throw new Error(`Escalation trigger value is required at index ${index}`);
    }

    if (trigger.threshold !== undefined) {
      if (typeof trigger.threshold !== 'number' || trigger.threshold < 0 || trigger.threshold > 100) {
        throw new Error(`Escalation trigger threshold must be a number between 0 and 100 at index ${index}`);
      }
    }

    if (typeof trigger.description !== 'string' || trigger.description.trim().length === 0) {
      throw new Error(`Escalation trigger description is required at index ${index}`);
    }
  }

  /** Check if a message should trigger escalation */
  public shouldEscalate(message: string, context?: {
    sentimentScore?: number;
    complexityScore?: number;
    frustrationScore?: number;
  }): { shouldEscalate: boolean; trigger?: EscalationTrigger; reason?: string } {
    for (const trigger of this.triggers) {
      switch (trigger.type) {
        case 'keyword':
          const keywords = trigger.value.split(',').map(k => k.trim().toLowerCase());
          const keywordMessageText = message.toLowerCase();
          for (const keyword of keywords) {
            if (keywordMessageText.includes(keyword)) {
              return {
                shouldEscalate: true,
                trigger,
                reason: `Keyword trigger: "${keyword}" found in message`
              };
            }
          }
          break;

        case 'sentiment':
          if (context?.sentimentScore !== undefined && trigger.threshold !== undefined) {
            if (context.sentimentScore <= trigger.threshold) {
              return {
                shouldEscalate: true,
                trigger,
                reason: `Sentiment score ${context.sentimentScore} below threshold ${trigger.threshold}`
              };
            }
          }
          break;

        case 'complexity':
          if (context?.complexityScore !== undefined && trigger.threshold !== undefined) {
            if (context.complexityScore >= trigger.threshold) {
              return {
                shouldEscalate: true,
                trigger,
                reason: `Complexity score ${context.complexityScore} above threshold ${trigger.threshold}`
              };
            }
          }
          break;

        case 'frustration':
          if (context?.frustrationScore !== undefined && trigger.threshold !== undefined) {
            if (context.frustrationScore >= trigger.threshold) {
              return {
                shouldEscalate: true,
                trigger,
                reason: `Frustration score ${context.frustrationScore} above threshold ${trigger.threshold}`
              };
            }
          }
          break;

        case 'request':
          const requestPatterns = trigger.value.split(',').map(p => p.trim().toLowerCase());
          const requestMessageText = message.toLowerCase();
          for (const pattern of requestPatterns) {
            if (requestMessageText.includes(pattern)) {
              return {
                shouldEscalate: true,
                trigger,
                reason: `Request pattern "${pattern}" found in message`
              };
            }
          }
          break;
      }
    }

    return { shouldEscalate: false };
  }

  /** Generate escalation section for system prompt */
  public generateSystemPromptSection(): string {
    if (this.triggers.length === 0) {
      return '';
    }

    let prompt = `\n**Escalation Triggers:**\n`;
    this.triggers.forEach(trigger => {
      prompt += `- ${trigger.description}\n`;
    });
    return prompt;
  }

  /** Create a copy with updated triggers */
  public withTriggers(triggers: EscalationTrigger[]): EscalationTriggerCollection {
    return new EscalationTriggerCollection(triggers);
  }

  /** Add a trigger */
  public addTrigger(trigger: EscalationTrigger): EscalationTriggerCollection {
    return new EscalationTriggerCollection([...this.triggers, trigger]);
  }

  /** Remove a trigger by index */
  public removeTrigger(index: number): EscalationTriggerCollection {
    const newTriggers = [...this.triggers];
    newTriggers.splice(index, 1);
    return new EscalationTriggerCollection(newTriggers);
  }

  /** Check equality with another EscalationTriggerCollection */
  public equals(other: EscalationTriggerCollection): boolean {
    return JSON.stringify(this.triggers) === JSON.stringify(other.triggers);
  }

  /** Convert to JSON for storage */
  public toJSON(): EscalationTrigger[] {
    return this.triggers;
  }

  /** Create from JSON data */
  public static fromJSON(data: EscalationTrigger[]): EscalationTriggerCollection {
    return new EscalationTriggerCollection(data || []);
  }

  /** Create default escalation triggers */
  public static createDefault(): EscalationTriggerCollection {
    return new EscalationTriggerCollection([
      {
        type: 'keyword',
        value: 'speak to human,talk to person,human agent,real person',
        description: 'Request to speak with human agent'
      },
      {
        type: 'frustration',
        value: 'frustration',
        threshold: 70,
        description: 'High frustration level detected'
      },
      {
        type: 'complexity',
        value: 'complexity',
        threshold: 80,
        description: 'Question too complex for chatbot'
      }
    ]);
  }
} 