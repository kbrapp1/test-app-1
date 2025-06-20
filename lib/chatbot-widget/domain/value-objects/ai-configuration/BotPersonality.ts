/**
 * Bot Personality Value Object
 * 
 * AI INSTRUCTIONS:
 * - UPDATED: Removed ConversationFlow dependency (now AI-driven)
 * - Pure value object for bot personality configuration
 * - No business rule dependencies
 * - Follow @golden-rule.mdc immutable value object patterns
 */

export interface BotPersonalityData {
  tone: 'professional' | 'friendly' | 'casual' | 'enthusiastic';
  style: 'concise' | 'detailed' | 'conversational' | 'technical';
  responseLength: 'short' | 'medium' | 'long';
  empathy: 'low' | 'medium' | 'high';
  assertiveness: 'passive' | 'balanced' | 'assertive';
  // AI will determine conversation flow dynamically
  aiDrivenFlow: boolean;
}

export class BotPersonality {
  constructor(private readonly data: BotPersonalityData) {
    this.validatePersonality(data);
  }

  static create(data: Partial<BotPersonalityData> = {}): BotPersonality {
    const defaultData: BotPersonalityData = {
      tone: 'professional',
      style: 'conversational', 
      responseLength: 'medium',
      empathy: 'medium',
      assertiveness: 'balanced',
      aiDrivenFlow: true // Default to AI-driven conversation flow
    };

    return new BotPersonality({ ...defaultData, ...data });
  }

  private validatePersonality(data: BotPersonalityData): void {
    const validTones = ['professional', 'friendly', 'casual', 'enthusiastic'];
    const validStyles = ['concise', 'detailed', 'conversational', 'technical'];
    const validLengths = ['short', 'medium', 'long'];
    const validEmpathy = ['low', 'medium', 'high'];
    const validAssertiveness = ['passive', 'balanced', 'assertive'];

    if (!validTones.includes(data.tone)) {
      throw new Error(`Invalid tone: ${data.tone}`);
    }
    if (!validStyles.includes(data.style)) {
      throw new Error(`Invalid style: ${data.style}`);
    }
    if (!validLengths.includes(data.responseLength)) {
      throw new Error(`Invalid response length: ${data.responseLength}`);
    }
    if (!validEmpathy.includes(data.empathy)) {
      throw new Error(`Invalid empathy level: ${data.empathy}`);
    }
    if (!validAssertiveness.includes(data.assertiveness)) {
      throw new Error(`Invalid assertiveness: ${data.assertiveness}`);
    }
  }

  get tone(): string {
    return this.data.tone;
  }

  get style(): string {
    return this.data.style;
  }

  get responseLength(): string {
    return this.data.responseLength;
  }

  get empathy(): string {
    return this.data.empathy;
  }

  get assertiveness(): string {
    return this.data.assertiveness;
  }

  get isAIDriven(): boolean {
    return this.data.aiDrivenFlow;
  }

  toPlainObject(): BotPersonalityData {
    return { ...this.data };
  }

  toString(): string {
    return `${this.data.tone} ${this.data.style} bot with ${this.data.empathy} empathy`;
  }
} 