import { TextInput } from '../value-objects/TextInput';
import { VoiceId } from '../value-objects/VoiceId';
import { SpeechRequest } from '../value-objects/SpeechRequest';

/**
 * Domain service for centralizing all TTS business validation rules.
 * This service contains pure business logic validation that applies
 * across different use cases and contexts.
 */
export class TtsValidationService {
  
  /**
   * Validate text input for TTS generation
   */
  public static validateTextInput(text: string): TextInputValidationResult {
    const errors: string[] = [];
    
    // Length validation
    if (!text || text.trim().length === 0) {
      errors.push('Text input is required');
    } else if (text.length > 5000) {
      errors.push('Text input cannot exceed 5000 characters');
    }
    
    // Content validation
    if (text && this.containsInappropriateContent(text)) {
      errors.push('Text contains inappropriate content');
    }
    
    // Format validation
    if (text && this.hasUnsupportedCharacters(text)) {
      errors.push('Text contains unsupported characters');
    }
    
    const isValid = errors.length === 0;
    const textInput = isValid ? TextInput.create(text) : null;
    
    return {
      isValid,
      errors,
      textInput
    };
  }
  
  /**
   * Validate voice selection for a given provider
   */
  public static validateVoiceSelection(
    voiceId: string, 
    provider: string
  ): VoiceValidationResult {
    const errors: string[] = [];
    
    if (!voiceId) {
      errors.push('Voice selection is required');
    }
    
    // Provider-specific voice validation
    if (voiceId && !this.isVoiceCompatibleWithProvider(voiceId, provider)) {
      errors.push(`Voice "${voiceId}" is not compatible with provider "${provider}"`);
    }
    
    const isValid = errors.length === 0;
    const voice = isValid ? VoiceId.create(voiceId) : null;
    
    return {
      isValid,
      errors,
      voice
    };
  }
  
  /**
   * Validate complete TTS generation request
   */
  public static validateTtsRequest(params: {
    text: string;
    voiceId: string;
    provider: string;
    settings?: Record<string, any>;
  }): TtsRequestValidationResult {
    const errors: string[] = [];
    
    // Validate text input
    const textValidation = this.validateTextInput(params.text);
    if (!textValidation.isValid) {
      errors.push(...textValidation.errors);
    }
    
    // Validate voice selection
    const voiceValidation = this.validateVoiceSelection(params.voiceId, params.provider);
    if (!voiceValidation.isValid) {
      errors.push(...voiceValidation.errors);
    }
    
    // Validate provider
    if (!this.isSupportedProvider(params.provider)) {
      errors.push(`Provider "${params.provider}" is not supported`);
    }
    
    // Validate provider-specific settings
    if (params.settings) {
      const settingsValidation = this.validateProviderSettings(params.provider, params.settings);
      if (!settingsValidation.isValid) {
        errors.push(...settingsValidation.errors);
      }
    }
    
    const isValid = errors.length === 0;
    let speechRequest: SpeechRequest | null = null;
    
    if (isValid && textValidation.textInput && voiceValidation.voice) {
      speechRequest = SpeechRequest.withVoice(
        textValidation.textInput.value,
        voiceValidation.voice,
        params.settings || {}
      );
    }
    
    return {
      isValid,
      errors,
      speechRequest
    };
  }
  
  /**
   * Validate user permissions for TTS generation
   */
  public static validateUserPermissions(
    userId: string,
    organizationId: string,
    textLength: number
  ): PermissionValidationResult {
    const errors: string[] = [];
    
    if (!userId) {
      errors.push('User ID is required');
    }
    
    if (!organizationId) {
      errors.push('Organization ID is required');
    }
    
    // Business rule: Check text length limits based on user tier
    const maxLengthForUser = this.getMaxTextLengthForUser(userId);
    if (textLength > maxLengthForUser) {
      errors.push(`Text length exceeds limit of ${maxLengthForUser} characters for your account`);
    }
    
    // Business rule: Check rate limiting
    if (this.isUserRateLimited(userId)) {
      errors.push('Rate limit exceeded. Please wait before making another request');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
  
  /**
   * Check if content contains inappropriate material
   */
  private static containsInappropriateContent(text: string): boolean {
    // Basic content filtering - in real implementation, this might use
    // external services or more sophisticated filtering
    const inappropriateWords = ['spam', 'scam']; // Simplified example
    const lowerText = text.toLowerCase();
    
    return inappropriateWords.some(word => lowerText.includes(word));
  }
  
  /**
   * Check if text has unsupported characters
   */
  private static hasUnsupportedCharacters(text: string): boolean {
    // Check for control characters or unsupported unicode ranges
    const unsupportedPattern = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/;
    return unsupportedPattern.test(text);
  }
  
  /**
   * Check if voice is compatible with provider
   */
  private static isVoiceCompatibleWithProvider(voiceId: string, provider: string): boolean {
    // This would typically check against a registry of provider-voice compatibility
    if (provider === 'replicate') {
      // Replicate Kokoro voice IDs follow pattern: af_*, am_*, bf_*, bm_* etc.
      const replicateVoicePattern = /^[ab][fm]_[a-z]+$/;
      return replicateVoicePattern.test(voiceId) || ['default', 'standard'].includes(voiceId);
    }
    
    if (provider === 'elevenlabs') {
      // ElevenLabs-specific voice IDs (20-character alphanumeric strings)
      return voiceId.length === 20 || ['default'].includes(voiceId);
    }
    
    return false;
  }
  
  /**
   * Check if provider is supported
   */
  private static isSupportedProvider(provider: string): boolean {
    const supportedProviders = ['replicate', 'elevenlabs'];
    return supportedProviders.includes(provider.toLowerCase());
  }
  
  /**
   * Validate provider-specific settings
   */
  private static validateProviderSettings(
    provider: string, 
    settings: Record<string, any>
  ): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (provider === 'elevenlabs') {
      // ElevenLabs-specific validation
      if (settings.stability !== undefined && (settings.stability < 0 || settings.stability > 1)) {
        errors.push('Stability must be between 0 and 1');
      }
      
      if (settings.similarity_boost !== undefined && (settings.similarity_boost < 0 || settings.similarity_boost > 1)) {
        errors.push('Similarity boost must be between 0 and 1');
      }
    }
    
    if (provider === 'replicate') {
      // Replicate-specific validation
      if (settings.speed !== undefined && (settings.speed < 0.1 || settings.speed > 2.0)) {
        errors.push('Speed must be between 0.1 and 2.0');
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
  
  /**
   * Get maximum text length for a user (business rule)
   */
  private static getMaxTextLengthForUser(userId: string): number {
    // This would typically check user's subscription tier
    // For now, return a default limit
    return 5000;
  }
  
  /**
   * Check if user is rate limited (business rule)
   */
  private static isUserRateLimited(userId: string): boolean {
    // This would typically check against a rate limiting service
    // For now, always return false
    return false;
  }
}

/**
 * Result types for validation operations
 */
export interface TextInputValidationResult {
  isValid: boolean;
  errors: string[];
  textInput: TextInput | null;
}

export interface VoiceValidationResult {
  isValid: boolean;
  errors: string[];
  voice: VoiceId | null;
}

export interface TtsRequestValidationResult {
  isValid: boolean;
  errors: string[];
  speechRequest: SpeechRequest | null;
}

export interface PermissionValidationResult {
  isValid: boolean;
  errors: string[];
} 