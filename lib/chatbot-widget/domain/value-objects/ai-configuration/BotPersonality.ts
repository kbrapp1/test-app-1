/**
 * Bot Personality Value Object
 * 
 * Refactored following DDD principles with focused component composition.
 * Single responsibility: Orchestrate personality components and generate system prompts.
 */

import { CommunicationSettings, CommunicationTone, ResponseLength, CommunicationStyle } from './CommunicationSettings';
import { EscalationTriggerCollection, EscalationTrigger } from './EscalationTrigger';
import { ResponseBehaviorSettings, ResponseBehavior } from './ResponseBehavior';
import { ConversationFlowSettings, ConversationFlow } from './ConversationFlow';

export class BotPersonality {
  constructor(
    public readonly communicationSettings: CommunicationSettings,
    public readonly escalationTriggers: EscalationTriggerCollection,
    public readonly responseBehavior: ResponseBehaviorSettings,
    public readonly conversationFlow: ConversationFlowSettings,
    public readonly customInstructions: string = ''
  ) {
    this.validate();
  }

  private validate(): void {
    if (typeof this.customInstructions !== 'string') {
      throw new Error('Custom instructions must be a string');
    }
  }

  /**
   * Generate system prompt instructions based on personality
   */
  public generateSystemPrompt(): string {
    let prompt = `You are an AI chatbot assistant with the following personality characteristics:\n\n`;

    // Communication style section
    prompt += `**Communication Style:**\n`;
    prompt += `- Tone: ${this.communicationSettings.getReadableTone()}\n`;
    prompt += `- Response Length: ${this.communicationSettings.getReadableResponseLength()}\n`;
    prompt += `- Communication Style: ${this.communicationSettings.getReadableCommunicationStyle()}\n\n`;

    // Response behavior section
    prompt += this.responseBehavior.generateSystemPromptSection();

    // Conversation flow section
    prompt += this.conversationFlow.generateSystemPromptSection();

    // Escalation triggers section
    prompt += this.escalationTriggers.generateSystemPromptSection();

    // Custom instructions
    if (this.customInstructions.trim()) {
      prompt += `\n**Additional Instructions:**\n${this.customInstructions}\n`;
    }

    return prompt;
  }

  /**
   * Check if a message should trigger escalation
   */
  public shouldEscalate(message: string, context?: {
    sentimentScore?: number;
    complexityScore?: number;
    frustrationScore?: number;
  }): { shouldEscalate: boolean; trigger?: EscalationTrigger; reason?: string } {
    return this.escalationTriggers.shouldEscalate(message, context);
  }

  /**
   * Get response length guidelines for AI
   */
  public getResponseLengthGuidelines(): { minWords: number; maxWords: number; description: string } {
    return this.communicationSettings.getResponseLengthGuidelines();
  }

  /**
   * Check if lead capture should be triggered
   */
  public shouldTriggerLeadCapture(messageCount: number): boolean {
    return this.conversationFlow.shouldTriggerLeadCapture(messageCount);
  }

  /**
   * Create a copy with updated communication settings
   */
  public withCommunicationSettings(settings: CommunicationSettings): BotPersonality {
    return new BotPersonality(
      settings,
      this.escalationTriggers,
      this.responseBehavior,
      this.conversationFlow,
      this.customInstructions
    );
  }

  /**
   * Create a copy with updated escalation triggers
   */
  public withEscalationTriggers(triggers: EscalationTriggerCollection): BotPersonality {
    return new BotPersonality(
      this.communicationSettings,
      triggers,
      this.responseBehavior,
      this.conversationFlow,
      this.customInstructions
    );
  }

  /**
   * Create a copy with updated response behavior
   */
  public withResponseBehavior(behavior: ResponseBehaviorSettings): BotPersonality {
    return new BotPersonality(
      this.communicationSettings,
      this.escalationTriggers,
      behavior,
      this.conversationFlow,
      this.customInstructions
    );
  }

  /**
   * Create a copy with updated conversation flow
   */
  public withConversationFlow(flow: ConversationFlowSettings): BotPersonality {
    return new BotPersonality(
      this.communicationSettings,
      this.escalationTriggers,
      this.responseBehavior,
      flow,
      this.customInstructions
    );
  }

  /**
   * Create a copy with updated custom instructions
   */
  public withCustomInstructions(customInstructions: string): BotPersonality {
    return new BotPersonality(
      this.communicationSettings,
      this.escalationTriggers,
      this.responseBehavior,
      this.conversationFlow,
      customInstructions
    );
  }

  /**
   * Check equality with another BotPersonality
   */
  public equals(other: BotPersonality): boolean {
    return (
      this.communicationSettings.equals(other.communicationSettings) &&
      this.escalationTriggers.equals(other.escalationTriggers) &&
      this.responseBehavior.equals(other.responseBehavior) &&
      this.conversationFlow.equals(other.conversationFlow) &&
      this.customInstructions === other.customInstructions
    );
  }

  /**
   * Convert to JSON for storage
   */
  public toJSON(): object {
    return {
      tone: this.communicationSettings.tone,
      responseLength: this.communicationSettings.responseLength,
      communicationStyle: this.communicationSettings.communicationStyle,
      escalationTriggers: this.escalationTriggers.toJSON(),
      responseBehavior: this.responseBehavior.toJSON(),
      conversationFlow: this.conversationFlow.toJSON(),
      customInstructions: this.customInstructions
    };
  }

  /**
   * Create from JSON data
   */
  public static fromJSON(data: any): BotPersonality {
    const communicationSettings = CommunicationSettings.fromJSON(data);
    const escalationTriggers = EscalationTriggerCollection.fromJSON(data.escalationTriggers);
    const responseBehavior = ResponseBehaviorSettings.fromJSON(data.responseBehavior);
    const conversationFlow = ConversationFlowSettings.fromJSON(data.conversationFlow);

    return new BotPersonality(
      communicationSettings,
      escalationTriggers,
      responseBehavior,
      conversationFlow,
      data.customInstructions || ''
    );
  }

  /**
   * Create default personality
   */
  public static createDefault(): BotPersonality {
    return new BotPersonality(
      CommunicationSettings.createDefault(),
      EscalationTriggerCollection.createDefault(),
      ResponseBehaviorSettings.createDefault(),
      ConversationFlowSettings.createDefault(),
      ''
    );
  }
}

// Re-export types for backward compatibility
export type { EscalationTrigger, ResponseBehavior, ConversationFlow };
export { CommunicationTone, ResponseLength, CommunicationStyle }; 