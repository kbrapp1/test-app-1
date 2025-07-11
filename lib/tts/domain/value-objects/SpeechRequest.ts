import { TextInput } from './TextInput';
import { VoiceId } from './VoiceId';

/**
 * Provider-specific settings for speech generation
 */
export interface ProviderSettings {
  // Replicate settings
  model?: string;
  speed?: number;
  
  // ElevenLabs settings
  stability?: number;
  similarity_boost?: number;
  style?: number;
  use_speaker_boost?: boolean;
  
  // Common settings
  [key: string]: unknown;
}

/**
 * Speech Request value object
 * Represents a request to generate speech from text using TTS providers
 */
export class SpeechRequest {
  private readonly _text: TextInput;
  private readonly _voice: VoiceId;
  private readonly _settings: ProviderSettings;

  constructor(text: string, voiceId: string, settings: ProviderSettings = {}) {
    this._text = new TextInput(text);
    this._voice = new VoiceId(voiceId);
    this._settings = { ...settings };
  }

  /**
   * Get the validated text input
   */
  get text(): string {
    return this._text.forTts;
  }

  /**
   * Get the original text input value object
   */
  get textInput(): TextInput {
    return this._text;
  }

  /**
   * Get the voice ID
   */
  get voiceId(): string {
    return this._voice.value;
  }

  /**
   * Get the voice value object
   */
  get voice(): VoiceId {
    return this._voice;
  }

  /**
   * Get provider settings
   */
  get settings(): ProviderSettings {
    return { ...this._settings };
  }

  /**
   * Get model for Replicate provider
   */
  get model(): string | undefined {
    return this._settings.model;
  }

  /**
   * Get ElevenLabs-specific settings
   */
  get elevenLabsSettings(): {
    stability?: number;
    similarity_boost?: number;
    style?: number;
    use_speaker_boost?: boolean;
  } {
    const { stability, similarity_boost, style, use_speaker_boost } = this._settings;
    return { stability, similarity_boost, style, use_speaker_boost };
  }

  /**
   * Get Replicate-specific settings
   */
  get replicateSettings(): {
    model?: string;
    speed?: number;
  } {
    const { model, speed } = this._settings;
    return { model, speed };
  }

  /**
   * Check if request is suitable for a specific provider
   */
  isSuitableFor(provider: 'replicate' | 'elevenlabs'): boolean {
    if (provider === 'replicate') {
      return this._voice.isReplicateVoice || this._voice.provider === 'unknown';
    }
    
    if (provider === 'elevenlabs') {
      return this._voice.isElevenLabsVoice || this._voice.provider === 'unknown';
    }
    
    return false;
  }

  /**
   * Get request optimized for specific provider
   */
  forProvider(provider: 'replicate' | 'elevenlabs'): SpeechRequest {
    if (provider === 'replicate') {
      const replicateSettings: ProviderSettings = {
        model: this._settings.model,
        speed: this._settings.speed || 1,
      };
      return new SpeechRequest(this.text, this.voiceId, replicateSettings);
    }
    
    if (provider === 'elevenlabs') {
      const elevenLabsSettings: ProviderSettings = {
        stability: this._settings.stability,
        similarity_boost: this._settings.similarity_boost,
        style: this._settings.style,
        use_speaker_boost: this._settings.use_speaker_boost,
      };
      return new SpeechRequest(this.text, this.voiceId, elevenLabsSettings);
    }
    
    return this;
  }

  /**
   * Validate request for specific provider requirements
   */
  validateForProvider(provider: 'replicate' | 'elevenlabs'): string | null {
    if (!this.isSuitableFor(provider)) {
      return `Voice ${this.voiceId} is not compatible with ${provider} provider`;
    }

    if (provider === 'elevenlabs' && !this.voiceId) {
      return 'Voice ID is required for ElevenLabs speech generation';
    }

    return null;
  }

  /**
   * Get estimated processing time based on text length and provider
   */
  getEstimatedDuration(provider: 'replicate' | 'elevenlabs'): number {
    const wordCount = this._text.wordCount;
    
    // Rough estimates based on provider characteristics
    if (provider === 'replicate') {
      return Math.max(30, wordCount * 2); // 2 seconds per word, min 30 seconds
    }
    
    if (provider === 'elevenlabs') {
      return Math.max(10, wordCount * 1); // 1 second per word, min 10 seconds
    }
    
    return 60; // Default fallback
  }

  /**
   * Create SpeechRequest with voice object
   */
  static withVoice(text: string, voice: VoiceId, settings: ProviderSettings = {}): SpeechRequest {
    return new SpeechRequest(text, voice.value, settings);
  }

  /**
   * Create SpeechRequest for specific provider
   */
  static forProvider(
    text: string, 
    voiceId: string, 
    provider: 'replicate' | 'elevenlabs',
    providerSettings: ProviderSettings = {}
  ): SpeechRequest {
    const request = new SpeechRequest(text, voiceId, providerSettings);
    return request.forProvider(provider);
  }

  /**
   * Validate input without creating object
   */
  static isValid(text: string, voiceId: string): boolean {
    try {
      new SpeechRequest(text, voiceId);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get validation error without creating object
   */
  static getValidationError(text: string, voiceId: string): string | null {
    try {
      new SpeechRequest(text, voiceId);
      return null;
    } catch (error) {
      return (error as Error).message;
    }
  }
} 