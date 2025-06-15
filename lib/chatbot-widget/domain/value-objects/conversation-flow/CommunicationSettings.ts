/**
 * Communication Settings Value Object
 * 
 * Domain value object representing communication tone, style, and response length settings.
 * Single responsibility: Encapsulate communication configuration and behavior.
 */

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

export class CommunicationSettings {
  constructor(
    public readonly tone: CommunicationTone,
    public readonly responseLength: ResponseLength,
    public readonly communicationStyle: CommunicationStyle
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

  /**
   * Generate readable descriptions for system prompts
   */
  public getReadableTone(): string {
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

  public getReadableResponseLength(): string {
    switch (this.responseLength) {
      case ResponseLength.CONCISE: return 'Brief and direct';
      case ResponseLength.MODERATE: return 'Balanced detail level';
      case ResponseLength.DETAILED: return 'Comprehensive and thorough';
      case ResponseLength.ADAPTIVE: return 'Adapts to context';
      default: return this.responseLength;
    }
  }

  public getReadableCommunicationStyle(): string {
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
  public withTone(tone: CommunicationTone): CommunicationSettings {
    return new CommunicationSettings(tone, this.responseLength, this.communicationStyle);
  }

  /**
   * Create a copy with updated response length
   */
  public withResponseLength(responseLength: ResponseLength): CommunicationSettings {
    return new CommunicationSettings(this.tone, responseLength, this.communicationStyle);
  }

  /**
   * Create a copy with updated communication style
   */
  public withCommunicationStyle(communicationStyle: CommunicationStyle): CommunicationSettings {
    return new CommunicationSettings(this.tone, this.responseLength, communicationStyle);
  }

  /**
   * Check equality with another CommunicationSettings
   */
  public equals(other: CommunicationSettings): boolean {
    return (
      this.tone === other.tone &&
      this.responseLength === other.responseLength &&
      this.communicationStyle === other.communicationStyle
    );
  }

  /**
   * Convert to JSON for storage
   */
  public toJSON(): object {
    return {
      tone: this.tone,
      responseLength: this.responseLength,
      communicationStyle: this.communicationStyle
    };
  }

  /**
   * Create from JSON data
   */
  public static fromJSON(data: any): CommunicationSettings {
    return new CommunicationSettings(
      data.tone || CommunicationTone.PROFESSIONAL,
      data.responseLength || ResponseLength.ADAPTIVE,
      data.communicationStyle || CommunicationStyle.HELPFUL
    );
  }

  /**
   * Create default communication settings
   */
  public static createDefault(): CommunicationSettings {
    return new CommunicationSettings(
      CommunicationTone.PROFESSIONAL,
      ResponseLength.ADAPTIVE,
      CommunicationStyle.HELPFUL
    );
  }
} 