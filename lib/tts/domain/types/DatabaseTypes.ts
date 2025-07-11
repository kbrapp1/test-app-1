/**
 * TTS Domain Database Types
 * 
 * AI INSTRUCTIONS:
 * - Replace all 'any' types in TTS domain with proper interfaces
 * - Follow @golden-rule DDD patterns exactly
 * - Security-critical: organizationId fields must be preserved
 * - Single responsibility: Database type definitions only
 * - Keep under 250 lines - focused on data contracts
 */

/**
 * Database row interface for TTS predictions table
 * Maps directly to Supabase table structure
 */
export interface TtsPredictionDatabaseRow {
  readonly id: string;
  readonly replicatePredictionId: string;
  readonly inputText: string;
  readonly status: string;
  readonly outputUrl: string | null;
  readonly createdAt: string; // ISO timestamp
  readonly updatedAt: string; // ISO timestamp
  readonly userId: string;
  readonly organization_id: string; // SECURITY-CRITICAL: Organization isolation
  readonly sourceAssetId: string | null;
  readonly outputAssetId: string | null;
  readonly voiceId: string | null;
  readonly errorMessage: string | null;
  readonly prediction_provider: string | null;
  readonly is_output_url_problematic: boolean;
  readonly output_url_last_error: string | null;
  readonly output_storage_path: string | null;
  readonly output_content_type: string | null;
  readonly output_file_size: number | null;
}

/**
 * Replicate prediction response interface
 * Replaces any types from external API
 */
export interface ReplicatePredictionResponse {
  readonly id: string;
  readonly status: 'starting' | 'processing' | 'succeeded' | 'completed' | 'failed' | 'canceled';
  readonly output?: string | string[] | null; // URL(s) to generated audio
  readonly error?: string | null;
  readonly created_at: string;
  readonly started_at?: string | null;
  readonly completed_at?: string | null;
  readonly urls?: {
    readonly get?: string;
    readonly cancel?: string;
  };
  readonly metrics?: {
    readonly predict_time?: number;
    readonly total_time?: number;
  };
  readonly logs?: string;
  readonly input?: ReplicatePredictionInput;
}

/**
 * Replicate prediction input interface
 */
export interface ReplicatePredictionInput {
  readonly text: string;
  readonly voice?: string;
  readonly model_name?: string;
  readonly voice_settings?: {
    readonly stability?: number;
    readonly similarity_boost?: number;
    readonly style?: number;
    readonly use_speaker_boost?: boolean;
  };
  readonly output_format?: 'mp3_22050_32' | 'mp3_44100_32' | 'pcm_16000' | 'pcm_22050' | 'pcm_24000' | 'pcm_44100';
  readonly optimize_streaming_latency?: number;
  readonly previous_text?: string;
  readonly previous_request_ids?: string[];
  readonly seed?: number;
}

/**
 * ElevenLabs API response interface
 */
export interface ElevenLabsResponse {
  readonly audio?: ArrayBuffer;
  readonly status: 'completed' | 'processing' | 'failed';
  readonly error?: string;
  readonly request_id?: string;
  readonly content_type?: string;
  readonly audio_length?: number;
}

/**
 * Voice data interface for voice selection
 */
export interface VoiceData {
  readonly voice_id: string;
  readonly name: string;
  readonly category?: string;
  readonly description?: string;
  readonly preview_url?: string;
  readonly available_for_tiers?: string[];
  readonly settings?: {
    readonly stability?: number;
    readonly similarity_boost?: number;
    readonly style?: number;
    readonly use_speaker_boost?: boolean;
  };
  readonly labels?: Record<string, string>;
  readonly samples?: Array<{
    readonly sample_id: string;
    readonly file_name: string;
    readonly mime_type: string;
    readonly size_bytes: number;
    readonly hash: string;
  }>;
}

/**
 * TTS history save input interface
 * Replaces any type in saveTtsHistory use case
 */
export interface TtsHistorySaveInput {
  readonly replicatePredictionId: string;
  readonly userId: string;
  readonly organizationId: string; // SECURITY-CRITICAL: Organization isolation
  readonly inputText: string;
  readonly voiceId?: string;
  readonly status: string;
  readonly outputUrl?: string;
  readonly outputAssetId?: string;
  readonly errorMessage?: string;
  readonly predictionProvider?: string;
  readonly metadata?: TtsMetadata;
}

/**
 * TTS metadata interface for provider-specific data
 */
export interface TtsMetadata {
  readonly predictionId?: string;
  readonly processingTime?: number;
  readonly modelUsed?: string;
  readonly voiceUsed?: string;
  readonly audioFormat?: string;
  readonly audioDuration?: number;
  readonly audioSize?: number;
  readonly providerSpecific?: Record<string, unknown>;
}

/**
 * Database update data interface
 * For partial updates to TTS predictions
 */
export interface TtsPredictionUpdateData {
  readonly status?: string;
  readonly outputUrl?: string | null;
  readonly errorMessage?: string | null;
  readonly updatedAt?: string;
  readonly outputAssetId?: string | null;
  readonly is_output_url_problematic?: boolean;
  readonly output_url_last_error?: string | null;
  readonly output_storage_path?: string | null;
  readonly output_content_type?: string | null;
  readonly output_file_size?: number | null;
}

/**
 * TTS generation request interface
 * For new prediction creation
 */
export interface TtsGenerationRequest {
  readonly text: string;
  readonly voiceId?: string;
  readonly userId: string;
  readonly organizationId: string; // SECURITY-CRITICAL: Organization isolation
  readonly sourceAssetId?: string;
  readonly predictionProvider?: string;
  readonly voiceSettings?: {
    readonly stability?: number;
    readonly similarity_boost?: number;
    readonly style?: number;
    readonly use_speaker_boost?: boolean;
  };
  readonly outputFormat?: string;
}

/**
 * Provider status response interface
 * For checking prediction status across providers
 */
export interface ProviderStatusResponse {
  readonly id: string;
  readonly status: string;
  readonly output?: string | string[] | ArrayBuffer | null;
  readonly error?: string | null;
  readonly progress?: number;
  readonly metadata?: TtsMetadata;
}

/**
 * Audio processing result interface
 * For DAM integration and file handling
 */
export interface AudioProcessingResult {
  readonly success: boolean;
  readonly audioUrl?: string;
  readonly audioBuffer?: ArrayBuffer;
  readonly contentType?: string;
  readonly duration?: number;
  readonly size?: number;
  readonly assetId?: string;
  readonly error?: string;
}

/**
 * TTS service response interface
 * Standardized response format for all TTS operations
 */
export interface TtsServiceResponse<T = unknown> {
  readonly success: boolean;
  readonly data?: T;
  readonly error?: {
    readonly code: string;
    readonly message: string;
    readonly context?: Record<string, unknown>;
  };
  readonly metadata?: TtsMetadata;
} 