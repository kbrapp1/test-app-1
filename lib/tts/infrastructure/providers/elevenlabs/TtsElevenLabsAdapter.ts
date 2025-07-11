import { ElevenLabsProvider, ElevenLabsVoice } from '@/lib/infrastructure/providers/elevenlabs/ElevenLabsProvider';
import { SpeechRequest, SpeechResult, type TtsVoice } from '../../../domain';

// ElevenLabs User Info interface
interface ElevenLabsUserInfo {
  subscription?: {
    tier?: string;
    character_count?: number;
    character_limit?: number;
    can_extend_character_limit?: boolean;
    allowed_to_extend_character_limit?: boolean;
  };
  is_new_user?: boolean;
  xi_api_key?: string;
  can_use_instant_voice_cloning?: boolean;
  can_use_professional_voice_cloning?: boolean;
  [key: string]: unknown;
}

/**
 * TTS-specific adapter for ElevenLabs provider
 * Handles TTS domain logic, error handling, and data transformation
 */
export class TtsElevenLabsAdapter {
  private readonly maxRetries = 3;
  private readonly retryDelay = 2000;
  private readonly provider: ElevenLabsProvider;

  constructor(provider: ElevenLabsProvider) {
    this.provider = provider;
  }

  /**
   * Get the ElevenLabs provider instance
   */
  private getProvider(): ElevenLabsProvider {
    return this.provider;
  }

  /**
   * List available voices with TTS-specific formatting
   */
  async listVoices(): Promise<TtsVoice[]> {
    const provider = this.getProvider();
    
    try {
      const voices = await provider.listVoices();
      return this.mapElevenLabsVoicesToTtsVoices(voices);
    } catch (error) {
      throw new Error(`Failed to list ElevenLabs voices: ${(error as Error).message}`);
    }
  }

  /**
   * Generate speech from text with TTS-specific logic
   */
  async generateSpeech(request: SpeechRequest): Promise<SpeechResult> {
    const provider = this.getProvider();
    
    // Validate request for ElevenLabs
    const validationError = request.validateForProvider('elevenlabs');
    if (validationError) {
      throw new Error(validationError);
    }

    const elevenLabsRequest = request.forProvider('elevenlabs');
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        const audioBuffer = await provider.generateSpeech({
          text: elevenLabsRequest.text,
          voiceId: elevenLabsRequest.voiceId,
          settings: elevenLabsRequest.elevenLabsSettings,
        });

        return SpeechResult.withAudioBuffer(audioBuffer, 'audio/wav');
      } catch (error) {
        lastError = error as Error;
        
        // Don't retry validation errors or quota errors
        if (this.isNonRetryableError(error)) {
          throw new Error(`ElevenLabs error: ${lastError.message}`);
        }

        if (attempt < this.maxRetries) {
          await this.sleep(this.retryDelay * attempt);
        }
      }
    }

    return SpeechResult.failed(
      `ElevenLabs speech generation failed after ${this.maxRetries} attempts: ${lastError?.message}`
    );
  }

  /**
   * Get user subscription info (useful for quota management)
   */
  async getUserInfo(): Promise<ElevenLabsUserInfo> {
    const provider = this.getProvider();
    
    try {
      return await provider.getUserInfo();
    } catch (error) {
      throw new Error(`Failed to get ElevenLabs user info: ${(error as Error).message}`);
    }
  }

  /**
   * Map ElevenLabs voices to TTS voice format
   */
  private mapElevenLabsVoicesToTtsVoices(voices: ElevenLabsVoice[]): TtsVoice[] {
    return voices.map((voice) => {
      const apiGender = voice.labels?.gender?.toLowerCase();
      const apiAccent = voice.labels?.accent?.toLowerCase();

      let gender: TtsVoice['gender'] = 'Other';
      if (apiGender === 'male') {
        gender = 'Male';
      } else if (apiGender === 'female') {
        gender = 'Female';
      }

      let accent: TtsVoice['accent'] = 'Other';
      if (apiAccent === 'american') {
        accent = 'American';
      } else if (apiAccent === 'british') {
        accent = 'British';
      }

      return {
        id: voice.voice_id,
        name: voice.name,
        gender,
        accent,
      };
    });
  }

  /**
   * Check if error should not be retried
   */
  private isNonRetryableError(error: unknown): boolean {
    const errorMessage = (error as Error).message?.toLowerCase() || '';
    return errorMessage.includes('validation') || 
           errorMessage.includes('invalid') || 
           errorMessage.includes('bad request') ||
           errorMessage.includes('unauthorized') ||
           errorMessage.includes('forbidden') ||
           errorMessage.includes('quota') ||
           errorMessage.includes('rate limit');
  }

  /**
   * Sleep utility for retry delays
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
} 