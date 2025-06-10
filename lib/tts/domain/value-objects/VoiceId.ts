/**
 * VoiceId Value Object
 * Encapsulates TTS voice identification with validation and business rules
 */

export type VoiceGender = 'Female' | 'Male' | 'Other';
export type VoiceAccent = 'American' | 'British' | 'Other';

export interface TtsVoice {
  id: string;
  name: string;
  gender: VoiceGender;
  accent: VoiceAccent;
}

export class VoiceId {
  private readonly _value: string;
  private readonly _voice?: TtsVoice;

  constructor(voiceId: string, voice?: TtsVoice) {
    this.validateVoiceId(voiceId);
    this._value = voiceId.trim();
    this._voice = voice;
  }

  get value(): string {
    return this._value;
  }

  get voice(): TtsVoice | undefined {
    return this._voice;
  }

  /**
   * Check if this voice ID is for a specific provider
   */
  get isReplicateVoice(): boolean {
    // Replicate Kokoro voices follow pattern: prefix_name (e.g., af_alloy, am_adam)
    return /^[ab][fm]_\w+$/.test(this._value);
  }

  get isElevenLabsVoice(): boolean {
    // ElevenLabs voice IDs are typically 20-character alphanumeric strings
    return /^[A-Za-z0-9]{20,}$/.test(this._value) && !this.isReplicateVoice;
  }

  /**
   * Get the provider this voice belongs to
   */
  get provider(): 'replicate' | 'elevenlabs' | 'unknown' {
    if (this.isReplicateVoice) return 'replicate';
    if (this.isElevenLabsVoice) return 'elevenlabs';
    return 'unknown';
  }

  /**
   * Get voice gender if available
   */
  get gender(): VoiceGender | undefined {
    return this._voice?.gender;
  }

  /**
   * Get voice accent if available
   */
  get accent(): VoiceAccent | undefined {
    return this._voice?.accent;
  }

  /**
   * Get voice display name if available
   */
  get displayName(): string {
    return this._voice?.name || this._value;
  }

  /**
   * Check if voice is suitable for a specific use case
   */
  isSuitableFor(criteria: {
    gender?: VoiceGender;
    accent?: VoiceAccent;
    provider?: string;
  }): boolean {
    if (criteria.provider && this.provider !== criteria.provider) {
      return false;
    }
    
    if (criteria.gender && this.gender !== criteria.gender) {
      return false;
    }
    
    if (criteria.accent && this.accent !== criteria.accent) {
      return false;
    }
    
    return true;
  }

  /**
   * Get voice formatted for UI display
   */
  get forDisplay(): string {
    if (!this._voice) {
      return this._value;
    }
    
    return `${this._voice.name} (${this._voice.gender}, ${this._voice.accent})`;
  }

  /**
   * Validate voice ID according to business rules
   */
  private validateVoiceId(voiceId: string): void {
    if (typeof voiceId !== 'string') {
      throw new Error('Voice ID must be a string');
    }

    const trimmed = voiceId.trim();
    
    if (trimmed.length === 0) {
      throw new Error('Please select a voice.');
    }

    if (trimmed.length > 100) {
      throw new Error('Voice ID cannot exceed 100 characters');
    }

    // Check for invalid characters that might cause issues
    if (!/^[a-zA-Z0-9_-]+$/.test(trimmed)) {
      throw new Error('Voice ID contains invalid characters. Only letters, numbers, hyphens, and underscores are allowed.');
    }
  }

  /**
   * Convert to string for external use
   */
  toString(): string {
    return this._value;
  }

  /**
   * Check equality with another VoiceId or string
   */
  equals(other: VoiceId | string): boolean {
    if (typeof other === 'string') {
      try {
        other = new VoiceId(other);
      } catch {
        return false;
      }
    }
    return this._value === other._value;
  }

  /**
   * Create VoiceId with voice data
   */
  static create(voiceId: string, voice?: TtsVoice): VoiceId {
    return new VoiceId(voiceId, voice);
  }

  /**
   * Create VoiceId from voice object
   */
  static fromVoice(voice: TtsVoice): VoiceId {
    return new VoiceId(voice.id, voice);
  }

  /**
   * Check if a string would be valid without creating the object
   */
  static isValid(voiceId: string): boolean {
    try {
      new VoiceId(voiceId);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get validation error message for a string without throwing
   */
  static getValidationError(voiceId: string): string | null {
    try {
      new VoiceId(voiceId);
      return null;
    } catch (error) {
      return (error as Error).message;
    }
  }

  /**
   * Filter voices by criteria
   */
  static filterVoices(
    voices: TtsVoice[],
    criteria: {
      gender?: VoiceGender;
      accent?: VoiceAccent;
      provider?: string;
      searchTerm?: string;
    }
  ): TtsVoice[] {
    return voices.filter(voice => {
      const voiceId = VoiceId.fromVoice(voice);
      
      if (!voiceId.isSuitableFor(criteria)) {
        return false;
      }
      
      if (criteria.searchTerm) {
        const searchLower = criteria.searchTerm.toLowerCase();
        return voice.name.toLowerCase().includes(searchLower) ||
               voice.id.toLowerCase().includes(searchLower);
      }
      
      return true;
    });
  }

  /**
   * Sort voices by preference (gender, accent, name)
   */
  static sortVoices(voices: TtsVoice[]): TtsVoice[] {
    return [...voices].sort((a, b) => {
      // Sort by gender (Female first)
      if (a.gender !== b.gender) {
        if (a.gender === 'Female') return -1;
        if (b.gender === 'Female') return 1;
      }
      
      // Sort by accent (American first)
      if (a.accent !== b.accent) {
        if (a.accent === 'American') return -1;
        if (b.accent === 'American') return 1;
      }
      
      // Sort by name alphabetically
      return a.name.localeCompare(b.name);
    });
  }
} 