export enum CommunicationTone {
  PROFESSIONAL = 'professional',
  FRIENDLY = 'friendly',
  CASUAL = 'casual',
  FORMAL = 'formal',
  ENTHUSIASTIC = 'enthusiastic',
  EMPATHETIC = 'empathetic'
}

export enum ResponseLength {
  CONCISE = 'concise',
  MODERATE = 'moderate',
  DETAILED = 'detailed',
  ADAPTIVE = 'adaptive'
}

export enum CommunicationStyle {
  HELPFUL = 'helpful',
  CONSULTATIVE = 'consultative',
  DIRECT = 'direct',
  CONVERSATIONAL = 'conversational',
  EDUCATIONAL = 'educational'
}

export interface EscalationTrigger {
  type: 'keyword' | 'sentiment' | 'complexity' | 'frustration' | 'request';
  value: string;
  threshold?: number; // For sentiment/complexity scores
  description: string;
}

export interface ResponseBehavior {
  useEmojis: boolean;
  askFollowUpQuestions: boolean;
  proactiveOffering: boolean; // Proactively offer help/resources
  personalizeResponses: boolean; // Use visitor's name, reference previous context
  acknowledgePreviousInteractions: boolean;
}

export interface ConversationFlow {
  maxMessagesBeforeLeadCapture: number;
  leadCaptureStrategy: 'progressive' | 'upfront' | 'contextual';
  qualificationQuestionTiming: 'early' | 'mid' | 'late' | 'contextual';
  escalationPreference: 'human' | 'email' | 'phone' | 'form';
}

export class BotPersonality {
  constructor(
    public readonly tone: CommunicationTone,
    public readonly responseLength: ResponseLength,
    public readonly communicationStyle: CommunicationStyle,
    public readonly escalationTriggers: EscalationTrigger[],
    public readonly responseBehavior: ResponseBehavior,
    public readonly conversationFlow: ConversationFlow,
    public readonly customInstructions: string = ''
  ) {
    this.validate();
  }

  private validate(): void {
    if (!Object.values(CommunicationTone).includes(this.tone)) {
      throw new Error(`Invalid communication tone: ${this.tone}`);
    }

    if (!Object.values(ResponseLength).includes(this.responseLength)) {
      throw new Error(`Invalid response length: ${this.responseLength}`);
    }

    if (!Object.values(CommunicationStyle).includes(this.communicationStyle)) {
      throw new Error(`Invalid communication style: ${this.communicationStyle}`);
    }

    if (!Array.isArray(this.escalationTriggers)) {
      throw new Error('Escalation triggers must be an array');
    }

    this.escalationTriggers.forEach((trigger, index) => {
      this.validateEscalationTrigger(trigger, index);
    });

    this.validateResponseBehavior(this.responseBehavior);
    this.validateConversationFlow(this.conversationFlow);

    if (typeof this.customInstructions !== 'string') {
      throw new Error('Custom instructions must be a string');
    }
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
   * Generate system prompt instructions based on personality
   */
  public generateSystemPrompt(): string {
    let prompt = `You are an AI chatbot assistant with the following personality characteristics:\n\n`;

    // Tone and style
    prompt += `**Communication Style:**\n`;
    prompt += `- Tone: ${this.getReadableTone()}\n`;
    prompt += `- Response Length: ${this.getReadableResponseLength()}\n`;
    prompt += `- Communication Style: ${this.getReadableCommunicationStyle()}\n\n`;

    // Response behavior
    prompt += `**Behavior Guidelines:**\n`;
    if (this.responseBehavior.useEmojis) {
      prompt += `- Use emojis appropriately to enhance communication\n`;
    } else {
      prompt += `- Maintain professional communication without emojis\n`;
    }

    if (this.responseBehavior.askFollowUpQuestions) {
      prompt += `- Ask relevant follow-up questions to maintain engagement\n`;
    }

    if (this.responseBehavior.proactiveOffering) {
      prompt += `- Proactively offer help and relevant resources\n`;
    }

    if (this.responseBehavior.personalizeResponses) {
      prompt += `- Personalize responses using visitor's name and context\n`;
    }

    if (this.responseBehavior.acknowledgePreviousInteractions) {
      prompt += `- Reference previous interactions when relevant\n`;
    }

    // Conversation flow
    prompt += `\n**Conversation Management:**\n`;
    prompt += `- Lead capture strategy: ${this.conversationFlow.leadCaptureStrategy}\n`;
    prompt += `- Qualification timing: ${this.conversationFlow.qualificationQuestionTiming}\n`;
    prompt += `- Max messages before lead capture: ${this.conversationFlow.maxMessagesBeforeLeadCapture}\n`;

    // Escalation triggers
    if (this.escalationTriggers.length > 0) {
      prompt += `\n**Escalation Triggers:**\n`;
      this.escalationTriggers.forEach(trigger => {
        prompt += `- ${trigger.description}\n`;
      });
    }

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
    for (const trigger of this.escalationTriggers) {
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

  /**
   * Get response length guidelines for AI
   */
  public getResponseLengthGuidelines(): { minWords: number; maxWords: number; description: string } {
    switch (this.responseLength) {
      case ResponseLength.CONCISE:
        return {
          minWords: 5,
          maxWords: 25,
          description: 'Keep responses brief and to the point'
        };
      case ResponseLength.MODERATE:
        return {
          minWords: 15,
          maxWords: 50,
          description: 'Provide balanced responses with adequate detail'
        };
      case ResponseLength.DETAILED:
        return {
          minWords: 30,
          maxWords: 100,
          description: 'Provide comprehensive and detailed responses'
        };
      case ResponseLength.ADAPTIVE:
        return {
          minWords: 5,
          maxWords: 75,
          description: 'Adapt response length based on question complexity and context'
        };
      default:
        return {
          minWords: 15,
          maxWords: 50,
          description: 'Standard balanced responses'
        };
    }
  }

  private getReadableTone(): string {
    switch (this.tone) {
      case CommunicationTone.PROFESSIONAL: return 'Professional and business-appropriate';
      case CommunicationTone.FRIENDLY: return 'Warm and approachable';
      case CommunicationTone.CASUAL: return 'Relaxed and informal';
      case CommunicationTone.FORMAL: return 'Formal and structured';
      case CommunicationTone.ENTHUSIASTIC: return 'Energetic and positive';
      case CommunicationTone.EMPATHETIC: return 'Understanding and compassionate';
      default: return this.tone;
    }
  }

  private getReadableResponseLength(): string {
    switch (this.responseLength) {
      case ResponseLength.CONCISE: return 'Brief and direct';
      case ResponseLength.MODERATE: return 'Balanced detail level';
      case ResponseLength.DETAILED: return 'Comprehensive and thorough';
      case ResponseLength.ADAPTIVE: return 'Adapts to context';
      default: return this.responseLength;
    }
  }

  private getReadableCommunicationStyle(): string {
    switch (this.communicationStyle) {
      case CommunicationStyle.HELPFUL: return 'Focused on helping and supporting';
      case CommunicationStyle.CONSULTATIVE: return 'Advisory and solution-oriented';
      case CommunicationStyle.DIRECT: return 'Straightforward and clear';
      case CommunicationStyle.CONVERSATIONAL: return 'Natural and engaging';
      case CommunicationStyle.EDUCATIONAL: return 'Informative and teaching-focused';
      default: return this.communicationStyle;
    }
  }

  /**
   * Create a copy with updated tone
   */
  public withTone(tone: CommunicationTone): BotPersonality {
    return new BotPersonality(
      tone,
      this.responseLength,
      this.communicationStyle,
      this.escalationTriggers,
      this.responseBehavior,
      this.conversationFlow,
      this.customInstructions
    );
  }

  /**
   * Create a copy with updated response length
   */
  public withResponseLength(responseLength: ResponseLength): BotPersonality {
    return new BotPersonality(
      this.tone,
      responseLength,
      this.communicationStyle,
      this.escalationTriggers,
      this.responseBehavior,
      this.conversationFlow,
      this.customInstructions
    );
  }

  /**
   * Create a copy with updated communication style
   */
  public withCommunicationStyle(communicationStyle: CommunicationStyle): BotPersonality {
    return new BotPersonality(
      this.tone,
      this.responseLength,
      communicationStyle,
      this.escalationTriggers,
      this.responseBehavior,
      this.conversationFlow,
      this.customInstructions
    );
  }

  /**
   * Create a copy with updated escalation triggers
   */
  public withEscalationTriggers(escalationTriggers: EscalationTrigger[]): BotPersonality {
    return new BotPersonality(
      this.tone,
      this.responseLength,
      this.communicationStyle,
      escalationTriggers,
      this.responseBehavior,
      this.conversationFlow,
      this.customInstructions
    );
  }

  /**
   * Create a copy with updated response behavior
   */
  public withResponseBehavior(responseBehavior: ResponseBehavior): BotPersonality {
    return new BotPersonality(
      this.tone,
      this.responseLength,
      this.communicationStyle,
      this.escalationTriggers,
      responseBehavior,
      this.conversationFlow,
      this.customInstructions
    );
  }

  /**
   * Create a copy with updated conversation flow
   */
  public withConversationFlow(conversationFlow: ConversationFlow): BotPersonality {
    return new BotPersonality(
      this.tone,
      this.responseLength,
      this.communicationStyle,
      this.escalationTriggers,
      this.responseBehavior,
      conversationFlow,
      this.customInstructions
    );
  }

  /**
   * Create a copy with updated custom instructions
   */
  public withCustomInstructions(customInstructions: string): BotPersonality {
    return new BotPersonality(
      this.tone,
      this.responseLength,
      this.communicationStyle,
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
      this.tone === other.tone &&
      this.responseLength === other.responseLength &&
      this.communicationStyle === other.communicationStyle &&
      this.customInstructions === other.customInstructions &&
      JSON.stringify(this.escalationTriggers) === JSON.stringify(other.escalationTriggers) &&
      JSON.stringify(this.responseBehavior) === JSON.stringify(other.responseBehavior) &&
      JSON.stringify(this.conversationFlow) === JSON.stringify(other.conversationFlow)
    );
  }

  /**
   * Convert to JSON for storage
   */
  public toJSON(): object {
    return {
      tone: this.tone,
      responseLength: this.responseLength,
      communicationStyle: this.communicationStyle,
      escalationTriggers: this.escalationTriggers,
      responseBehavior: this.responseBehavior,
      conversationFlow: this.conversationFlow,
      customInstructions: this.customInstructions
    };
  }

  /**
   * Create from JSON data
   */
  public static fromJSON(data: any): BotPersonality {
    return new BotPersonality(
      data.tone || CommunicationTone.PROFESSIONAL,
      data.responseLength || ResponseLength.ADAPTIVE,
      data.communicationStyle || CommunicationStyle.HELPFUL,
      data.escalationTriggers || [],
      data.responseBehavior || BotPersonality.getDefaultResponseBehavior(),
      data.conversationFlow || BotPersonality.getDefaultConversationFlow(),
      data.customInstructions || ''
    );
  }

  /**
   * Create default personality
   */
  public static createDefault(): BotPersonality {
    return new BotPersonality(
      CommunicationTone.PROFESSIONAL,
      ResponseLength.ADAPTIVE,
      CommunicationStyle.HELPFUL,
      BotPersonality.getDefaultEscalationTriggers(),
      BotPersonality.getDefaultResponseBehavior(),
      BotPersonality.getDefaultConversationFlow(),
      ''
    );
  }

  /**
   * Get default escalation triggers
   */
  public static getDefaultEscalationTriggers(): EscalationTrigger[] {
    return [
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
    ];
  }

  /**
   * Get default response behavior
   */
  public static getDefaultResponseBehavior(): ResponseBehavior {
    return {
      useEmojis: false,
      askFollowUpQuestions: true,
      proactiveOffering: true,
      personalizeResponses: true,
      acknowledgePreviousInteractions: true
    };
  }

  /**
   * Get default conversation flow
   */
  public static getDefaultConversationFlow(): ConversationFlow {
    return {
      maxMessagesBeforeLeadCapture: 5,
      leadCaptureStrategy: 'contextual',
      qualificationQuestionTiming: 'mid',
      escalationPreference: 'human'
    };
  }
} 