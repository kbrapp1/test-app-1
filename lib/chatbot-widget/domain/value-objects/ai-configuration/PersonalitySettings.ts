/**
 * Personality Settings Value Object
 * 
 * Domain layer value object representing chatbot personality configuration.
 * Immutable object that encapsulates personality-related behavior and validation.
 */

export interface PersonalitySettingsProps {
  tone: 'professional' | 'friendly' | 'casual' | 'formal';
  communicationStyle: 'direct' | 'conversational' | 'helpful' | 'sales-focused';
  responseLength: 'brief' | 'detailed' | 'adaptive';
  escalationTriggers: string[];
  responseBehavior: ResponseBehavior;
  conversationFlow: ConversationFlow;
  customInstructions: string;
}

export interface ResponseBehavior {
  useEmojis: boolean;
  askFollowUpQuestions: boolean;
  proactiveOffering: boolean;
  personalizeResponses: boolean;
  acknowledgePreviousInteractions: boolean;
}

export interface ConversationFlow {
  greetingMessage: string;
  fallbackMessage: string;
  escalationMessage: string;
  endConversationMessage: string;
  leadCapturePrompt: string;
  maxConversationTurns: number;
  inactivityTimeout: number;
}

export class PersonalitySettings {
  private constructor(private readonly props: PersonalitySettingsProps) {
    this.validateProps(props);
  }

  static create(props: PersonalitySettingsProps): PersonalitySettings {
    return new PersonalitySettings(props);
  }

  static createDefault(): PersonalitySettings {
    return new PersonalitySettings({
      tone: 'friendly',
      communicationStyle: 'helpful',
      responseLength: 'adaptive',
      escalationTriggers: ['speak to human', 'talk to agent', 'customer service'],
      responseBehavior: {
        useEmojis: false,
        askFollowUpQuestions: true,
        proactiveOffering: true,
        personalizeResponses: true,
        acknowledgePreviousInteractions: true,
      },
      conversationFlow: {
        greetingMessage: 'Hello! How can I help you today?',
        fallbackMessage: "I'm not sure I understand. Could you please rephrase that?",
        escalationMessage: 'Let me connect you with a human agent who can better assist you.',
        endConversationMessage: 'Thank you for chatting with us today! Have a great day!',
        leadCapturePrompt: 'Would you like to leave your contact information so we can follow up with you?',
        maxConversationTurns: 20,
        inactivityTimeout: 300,
      },
      customInstructions: '',
    });
  }

  private validateProps(props: PersonalitySettingsProps): void {
    if (!props.tone) {
      throw new Error('Tone is required');
    }
    if (!props.communicationStyle) {
      throw new Error('Communication style is required');
    }
    if (!props.responseLength) {
      throw new Error('Response length is required');
    }
    if (!Array.isArray(props.escalationTriggers)) {
      throw new Error('Escalation triggers must be an array');
    }
    if (props.conversationFlow.maxConversationTurns < 1) {
      throw new Error('Max conversation turns must be at least 1');
    }
    if (props.conversationFlow.inactivityTimeout < 30) {
      throw new Error('Inactivity timeout must be at least 30 seconds');
    }
  }

  // Getters
  get tone(): string { return this.props.tone; }
  get communicationStyle(): string { return this.props.communicationStyle; }
  get responseLength(): string { return this.props.responseLength; }
  get escalationTriggers(): string[] { return [...this.props.escalationTriggers]; }
  get responseBehavior(): ResponseBehavior { return { ...this.props.responseBehavior }; }
  get conversationFlow(): ConversationFlow { return { ...this.props.conversationFlow }; }
  get customInstructions(): string { return this.props.customInstructions; }

  // Business methods
  updateTone(tone: PersonalitySettingsProps['tone']): PersonalitySettings {
    return new PersonalitySettings({
      ...this.props,
      tone,
    });
  }

  updateCommunicationStyle(style: PersonalitySettingsProps['communicationStyle']): PersonalitySettings {
    return new PersonalitySettings({
      ...this.props,
      communicationStyle: style,
    });
  }

  addEscalationTrigger(trigger: string): PersonalitySettings {
    if (this.props.escalationTriggers.includes(trigger.toLowerCase())) {
      return this;
    }
    
    return new PersonalitySettings({
      ...this.props,
      escalationTriggers: [...this.props.escalationTriggers, trigger.toLowerCase()],
    });
  }

  removeEscalationTrigger(trigger: string): PersonalitySettings {
    return new PersonalitySettings({
      ...this.props,
      escalationTriggers: this.props.escalationTriggers.filter(t => t !== trigger.toLowerCase()),
    });
  }

  updateCustomInstructions(instructions: string): PersonalitySettings {
    return new PersonalitySettings({
      ...this.props,
      customInstructions: instructions,
    });
  }

  shouldEscalate(message: string): boolean {
    const lowerMessage = message.toLowerCase();
    return this.props.escalationTriggers.some(trigger => lowerMessage.includes(trigger));
  }

  toPlainObject(): PersonalitySettingsProps {
    return { ...this.props };
  }
} 