import { BaseProvider, ProviderType, ProviderConfig } from '../registry/types';

export interface ElevenLabsConfig extends ProviderConfig {
  apiKey: string;
  apiUrl: string;
}

export interface ElevenLabsVoice {
  voice_id: string;
  name: string;
  labels?: {
    gender?: string;
    accent?: string;
    [key: string]: string | undefined;
  };
}

export interface TextToSpeechRequest {
  text: string;
  voiceId: string;
  settings?: {
    stability?: number;
    similarity_boost?: number;
    style?: number;
    use_speaker_boost?: boolean;
  };
}

/**
 * Shared ElevenLabs provider for all domains
 * Handles authentication, API operations, and health checking
 */
export class ElevenLabsProvider implements BaseProvider {
  readonly type = ProviderType.ELEVENLABS;
  private config: ElevenLabsConfig;

  constructor(config: ElevenLabsConfig) {
    this.config = config;
  }

  get isConnected(): boolean {
    // ElevenLabs is HTTP-based, so we're "connected" if we have valid config
    return !!(this.config.apiKey && this.config.apiUrl);
  }

  async connect(): Promise<void> {
    if (!this.config.apiKey) {
      throw new Error('ElevenLabs API key is required');
    }
    if (!this.config.apiUrl) {
      throw new Error('ElevenLabs API URL is required');
    }
    // No persistent connection needed for HTTP API
  }

  async disconnect(): Promise<void> {
    // No persistent connection to close
  }

  async healthCheck(): Promise<boolean> {
    if (!this.isConnected) {
      return false;
    }

    try {
      // Simple health check - try to list voices
      const response = await fetch(`${this.config.apiUrl}/voices`, {
        headers: {
          'xi-api-key': this.config.apiKey,
        },
      });
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  /**
   * List available voices from ElevenLabs
   */
  async listVoices(): Promise<ElevenLabsVoice[]> {
    if (!this.isConnected) {
      throw new Error('ElevenLabs provider not connected. Call connect() first.');
    }

    const response = await fetch(`${this.config.apiUrl}/voices`, {
      headers: {
        'xi-api-key': this.config.apiKey,
      },
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`ElevenLabs: Failed to list voices (${response.status}): ${response.statusText}. Body: ${errorBody}`);
    }

    const json = await response.json();
    return Array.isArray(json.voices) ? json.voices : (json as ElevenLabsVoice[]);
  }

  /**
   * Generate speech from text using ElevenLabs
   */
  async generateSpeech(request: TextToSpeechRequest): Promise<ArrayBuffer> {
    if (!this.isConnected) {
      throw new Error('ElevenLabs provider not connected. Call connect() first.');
    }

    const requestBody = {
      text: request.text,
      ...(request.settings && request.settings),
    };

    const response = await fetch(`${this.config.apiUrl}/text-to-speech/${request.voiceId}/stream`, {
      method: 'POST',
      headers: {
        'xi-api-key': this.config.apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`ElevenLabs: TTS generation failed (${response.status}): ${response.statusText}. Body: ${errorBody}`);
    }

    return await response.arrayBuffer();
  }

  /**
   * Get user subscription info (useful for quota checking)
   */
  async getUserInfo(): Promise<any> {
    if (!this.isConnected) {
      throw new Error('ElevenLabs provider not connected. Call connect() first.');
    }

    const response = await fetch(`${this.config.apiUrl}/user`, {
      headers: {
        'xi-api-key': this.config.apiKey,
      },
    });

    if (!response.ok) {
      throw new Error(`ElevenLabs: Failed to get user info (${response.status}): ${response.statusText}`);
    }

    return await response.json();
  }
} 