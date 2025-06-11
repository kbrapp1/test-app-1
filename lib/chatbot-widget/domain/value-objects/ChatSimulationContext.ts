/**
 * Value object representing the context and configuration for chat simulation
 * Used by the testing system to provide controlled simulation environments
 */
export interface ChatSimulationContextProps {
  readonly simulationType: 'testing' | 'preview' | 'validation';
  readonly chatbotConfigId: string;
  readonly testScenarioId?: string;
  readonly simulatedUserProfile: SimulatedUserProfile;
  readonly responseMode: 'mock' | 'live';
  readonly testingGoals: TestingGoal[];
  readonly simulationConstraints: SimulationConstraints;
}

export interface SimulatedUserProfile {
  readonly name: string;
  readonly intent: 'browsing' | 'shopping' | 'support' | 'lead_qualification';
  readonly engagementLevel: 'low' | 'medium' | 'high';
  readonly previousKnowledge: 'none' | 'basic' | 'advanced';
  readonly leadReadiness: 'cold' | 'warm' | 'hot';
}

export interface TestingGoal {
  readonly type: 'knowledge_validation' | 'lead_capture' | 'conversation_flow' | 'response_quality';
  readonly criteria: string;
  readonly expectedOutcome: string;
}

export interface SimulationConstraints {
  readonly maxMessages: number;
  readonly timeLimit?: number; // in seconds
  readonly requireLeadCapture: boolean;
  readonly allowedTopics: string[];
  readonly restrictedPhrases: string[];
}

export class ChatSimulationContext {
  private constructor(private readonly props: ChatSimulationContextProps) {
    this.validateProps(props);
  }

  static create(props: ChatSimulationContextProps): ChatSimulationContext {
    return new ChatSimulationContext(props);
  }

  static createTesting(
    chatbotConfigId: string,
    userProfile: SimulatedUserProfile,
    goals: TestingGoal[]
  ): ChatSimulationContext {
    return new ChatSimulationContext({
      simulationType: 'testing',
      chatbotConfigId,
      simulatedUserProfile: userProfile,
      responseMode: 'live',
      testingGoals: goals,
      simulationConstraints: {
        maxMessages: 20,
        timeLimit: 300, // 5 minutes
        requireLeadCapture: false,
        allowedTopics: [],
        restrictedPhrases: [],
      },
    });
  }

  static createPreview(
    chatbotConfigId: string,
    userProfile: SimulatedUserProfile
  ): ChatSimulationContext {
    return new ChatSimulationContext({
      simulationType: 'preview',
      chatbotConfigId,
      simulatedUserProfile: userProfile,
      responseMode: 'mock',
      testingGoals: [],
      simulationConstraints: {
        maxMessages: 10,
        requireLeadCapture: false,
        allowedTopics: [],
        restrictedPhrases: [],
      },
    });
  }

  private validateProps(props: ChatSimulationContextProps): void {
    if (!props.chatbotConfigId?.trim()) {
      throw new Error('Chatbot config ID is required');
    }

    if (props.simulationConstraints.maxMessages < 1) {
      throw new Error('Max messages must be at least 1');
    }

    if (props.simulationConstraints.timeLimit && props.simulationConstraints.timeLimit < 10) {
      throw new Error('Time limit must be at least 10 seconds');
    }

    if (!props.simulatedUserProfile.name?.trim()) {
      throw new Error('Simulated user profile name is required');
    }
  }

  // Getters
  get simulationType(): string { return this.props.simulationType; }
  get chatbotConfigId(): string { return this.props.chatbotConfigId; }
  get testScenarioId(): string | undefined { return this.props.testScenarioId; }
  get simulatedUserProfile(): SimulatedUserProfile { return this.props.simulatedUserProfile; }
  get responseMode(): string { return this.props.responseMode; }
  get testingGoals(): TestingGoal[] { return this.props.testingGoals; }
  get simulationConstraints(): SimulationConstraints { return this.props.simulationConstraints; }

  // Business methods
  shouldUseMockResponses(): boolean {
    return this.props.responseMode === 'mock';
  }

  isWithinMessageLimit(currentMessageCount: number): boolean {
    return currentMessageCount < this.props.simulationConstraints.maxMessages;
  }

  isWithinTimeLimit(simulationStartTime: Date): boolean {
    if (!this.props.simulationConstraints.timeLimit) {
      return true;
    }

    const elapsedSeconds = (Date.now() - simulationStartTime.getTime()) / 1000;
    return elapsedSeconds < this.props.simulationConstraints.timeLimit;
  }

  shouldRequireLeadCapture(): boolean {
    return this.props.simulationConstraints.requireLeadCapture;
  }

  isTopicAllowed(topic: string): boolean {
    if (this.props.simulationConstraints.allowedTopics.length === 0) {
      return true; // No restrictions
    }
    return this.props.simulationConstraints.allowedTopics.includes(topic.toLowerCase());
  }

  containsRestrictedPhrases(message: string): boolean {
    const lowerMessage = message.toLowerCase();
    return this.props.simulationConstraints.restrictedPhrases.some(phrase =>
      lowerMessage.includes(phrase.toLowerCase())
    );
  }

  withUpdatedConstraints(constraints: Partial<SimulationConstraints>): ChatSimulationContext {
    return new ChatSimulationContext({
      ...this.props,
      simulationConstraints: {
        ...this.props.simulationConstraints,
        ...constraints,
      },
    });
  }

  withTestScenario(testScenarioId: string): ChatSimulationContext {
    return new ChatSimulationContext({
      ...this.props,
      testScenarioId,
    });
  }

  // Export methods
  toPlainObject(): ChatSimulationContextProps {
    return { ...this.props };
  }

  getTestingGoalsSummary(): string {
    return this.props.testingGoals
      .map(goal => `${goal.type}: ${goal.criteria}`)
      .join(', ');
  }

  getSimulationDescription(): string {
    const user = this.props.simulatedUserProfile;
    return `${user.name} (${user.intent}, ${user.engagementLevel} engagement, ${user.leadReadiness} lead)`;
  }
} 