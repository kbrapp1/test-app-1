import { PredictionStatus } from './PredictionStatus';
import { ReplicatePredictionResponse } from '../types/DatabaseTypes';

/**
 * Audio output data for speech results
 */
export interface AudioOutput {
  url?: string;           // For Replicate (URL to audio file)
  buffer?: ArrayBuffer;   // For ElevenLabs (direct audio data)
  duration?: number;      // Duration in seconds
  contentType?: string;   // MIME type (e.g., 'audio/wav', 'audio/mp3')
  size?: number;          // File size in bytes
}

/**
 * Provider-specific metadata for speech results
 */
export interface ProviderMetadata {
  predictionId?: string;  // Replicate prediction ID
  processingTime?: number; // Time taken to generate
  modelUsed?: string;     // Model identifier
  voiceUsed?: string;     // Voice identifier
  [key: string]: unknown;     // Additional provider-specific data
}

/**
 * Speech Result value object
 * Represents the result of speech generation from TTS providers
 */
export class SpeechResult {
  private readonly _status: PredictionStatus;
  private readonly _audio: AudioOutput;
  private readonly _error: string | null;
  private readonly _metadata: ProviderMetadata;

  constructor(
    status: string,
    audio: AudioOutput = {},
    error: string | null = null,
    metadata: ProviderMetadata = {}
  ) {
    this._status = new PredictionStatus(status);
    this._audio = { ...audio };
    this._error = error;
    this._metadata = { ...metadata };
    
    this.validateConsistency();
  }

  /**
   * Get the prediction status
   */
  get status(): string {
    return this._status.value;
  }

  /**
   * Get the status value object
   */
  get predictionStatus(): PredictionStatus {
    return this._status;
  }

  /**
   * Check if speech generation was successful
   */
  get isSuccessful(): boolean {
    return this._status.isSuccessful;
  }

  /**
   * Check if speech generation is still processing
   */
  get isProcessing(): boolean {
    return this._status.isProcessing;
  }

  /**
   * Check if speech generation is in a final state
   */
  get isFinal(): boolean {
    return this._status.isFinal;
  }

  /**
   * Get error message if any
   */
  get error(): string | null {
    return this._error;
  }

  /**
   * Get audio URL (for Replicate results)
   */
  get audioUrl(): string | null {
    return this._audio.url || null;
  }

  /**
   * Get audio buffer (for ElevenLabs results)
   */
  get audioBuffer(): ArrayBuffer | null {
    return this._audio.buffer || null;
  }

  /**
   * Get audio duration in seconds
   */
  get duration(): number | undefined {
    return this._audio.duration;
  }

  /**
   * Get audio content type
   */
  get contentType(): string | undefined {
    return this._audio.contentType;
  }

  /**
   * Get audio file size in bytes
   */
  get audioSize(): number | undefined {
    return this._audio.size;
  }

  /**
   * Get provider metadata
   */
  get metadata(): ProviderMetadata {
    return { ...this._metadata };
  }

  /**
   * Get prediction ID if available
   */
  get predictionId(): string | undefined {
    return this._metadata.predictionId;
  }

  /**
   * Check if result has audio data
   */
  get hasAudio(): boolean {
    return !!(this._audio.url || this._audio.buffer);
  }

  /**
   * Check if result has downloadable content
   */
  get isDownloadable(): boolean {
    return this.isSuccessful && this.hasAudio;
  }

  /**
   * Get the type of audio output
   */
  get outputType(): 'url' | 'buffer' | 'none' {
    if (this._audio.url) return 'url';
    if (this._audio.buffer) return 'buffer';
    return 'none';
  }

  /**
   * Get audio output optimized for provider type
   */
  getAudioFor(provider: 'replicate' | 'elevenlabs'): AudioOutput {
    if (provider === 'replicate') {
      return {
        url: this._audio.url,
        duration: this._audio.duration,
        contentType: this._audio.contentType,
        size: this._audio.size,
      };
    }
    
    if (provider === 'elevenlabs') {
      return {
        buffer: this._audio.buffer,
        contentType: this._audio.contentType,
        size: this._audio.size,
      };
    }
    
    return this._audio;
  }

  /**
   * Convert to legacy interface format for backward compatibility
   */
  toLegacyFormat(): {
    audioUrl: string;
    duration?: number;
    status: 'completed' | 'processing' | 'failed';
    error?: string;
  } {
    return {
      audioUrl: this._audio.url || '',
      duration: this._audio.duration,
      status: this.mapToLegacyStatus(),
      error: this._error || undefined,
    };
  }

  /**
   * Convert to ElevenLabs format for backward compatibility
   */
  toElevenLabsFormat(): {
    audioBuffer: ArrayBuffer;
    status: 'completed' | 'processing' | 'failed';
    error?: string;
  } {
    return {
      audioBuffer: this._audio.buffer || new ArrayBuffer(0),
      status: this.mapToLegacyStatus(),
      error: this._error || undefined,
    };
  }

  /**
   * Create successful result with audio URL (for Replicate)
   */
  static withAudioUrl(
    audioUrl: string,
    duration?: number,
    metadata: ProviderMetadata = {}
  ): SpeechResult {
    return new SpeechResult(
      'succeeded',
      { 
        url: audioUrl, 
        duration,
        contentType: 'audio/wav' // Default assumption
      },
      null,
      metadata
    );
  }

  /**
   * Create successful result with audio buffer (for ElevenLabs)
   */
  static withAudioBuffer(
    audioBuffer: ArrayBuffer,
    contentType: string = 'audio/wav',
    metadata: ProviderMetadata = {}
  ): SpeechResult {
    return new SpeechResult(
      'succeeded',
      { 
        buffer: audioBuffer, 
        contentType,
        size: audioBuffer.byteLength
      },
      null,
      metadata
    );
  }

  /**
   * Create failed result
   */
  static failed(error: string, metadata: ProviderMetadata = {}): SpeechResult {
    return new SpeechResult('failed', {}, error, metadata);
  }

  /**
   * Create processing result
   */
  static processing(metadata: ProviderMetadata = {}): SpeechResult {
    return new SpeechResult('processing', {}, null, metadata);
  }

  /**
   * Create result from Replicate prediction
   */
  static fromReplicate(prediction: ReplicatePredictionResponse): SpeechResult {
    if (prediction.status === 'failed' || prediction.error) {
      return SpeechResult.failed(
        prediction.error || 'Speech generation failed',
        { predictionId: prediction.id }
      );
    }

    // Handle both 'succeeded' and 'completed' status as successful
    if ((prediction.status === 'succeeded' || prediction.status === 'completed') && prediction.output) {
      // Handle different output formats
      let audioUrl = '';
      
      if (typeof prediction.output === 'string') {
        audioUrl = prediction.output;
      } else if (Array.isArray(prediction.output) && prediction.output.length > 0) {
        audioUrl = prediction.output[0] as string;
      } else if (typeof prediction.output === 'object' && prediction.output !== null) {
        // Handle object output (not array)
        if (!Array.isArray(prediction.output)) {
          const outputObj = prediction.output as Record<string, unknown>;
          if (typeof outputObj.url === 'function') {
            const urlResult = outputObj.url();
            audioUrl = typeof urlResult === 'string' ? urlResult : String(urlResult);
          } else {
            // Handle object with url property
            audioUrl = String(outputObj.url || outputObj.audio || outputObj.output || '');
          }
        }
      }

      return SpeechResult.withAudioUrl(
        audioUrl,
        undefined,
        { predictionId: prediction.id }
      );
    }

    return SpeechResult.processing({ predictionId: prediction.id });
  }

  /**
   * Validate internal consistency
   */
  private validateConsistency(): void {
    if (this._status.isSuccessful && !this.hasAudio && !this._error) {
      throw new Error('Successful speech result must have audio output');
    }

    if (this._status.value === 'failed' && !this._error) {
      throw new Error('Failed speech result must have error message');
    }
  }

  /**
   * Map to legacy status format
   */
  private mapToLegacyStatus(): 'completed' | 'processing' | 'failed' {
    if (this._status.isSuccessful) return 'completed';
    if (this._status.isFinal) return 'failed';
    return 'processing';
  }
} 