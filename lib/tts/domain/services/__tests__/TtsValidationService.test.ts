/**
 * TtsValidationService Tests
 * 
 * Tests for voice compatibility validation and other business rules
 */

import { describe, it, expect } from 'vitest';
import { TtsValidationService } from '../TtsValidationService';

describe('TtsValidationService', () => {
  describe('Voice Compatibility Validation', () => {
    describe('Replicate Provider', () => {
      it('should accept valid Replicate Kokoro voice IDs', () => {
        const validVoices = [
          'af_aoede',
          'af_alloy', 
          'af_bella',
          'am_adam',
          'am_echo',
          'bf_alice',
          'bm_daniel',
        ];

        validVoices.forEach(voiceId => {
          const result = TtsValidationService.validateVoiceSelection(voiceId, 'replicate');
          expect(result.isValid).toBe(true);
          expect(result.errors).toHaveLength(0);
          expect(result.voice).toBeTruthy();
        });
      });

      it('should accept standard fallback voices for Replicate', () => {
        const fallbackVoices = ['default', 'standard'];

        fallbackVoices.forEach(voiceId => {
          const result = TtsValidationService.validateVoiceSelection(voiceId, 'replicate');
          expect(result.isValid).toBe(true);
          expect(result.errors).toHaveLength(0);
        });
      });

      it('should reject invalid voice IDs for Replicate', () => {
        const invalidVoices = [
          'MF3mGyEYCl7XYWbV9V6O', // ElevenLabs format
          'replicate_voice',        // Old incorrect pattern
          'invalid_voice',
          'af_',                    // Incomplete
          'zf_invalid',            // Wrong prefix
          'af_Voice',              // Uppercase
          '',
        ];

        invalidVoices.forEach(voiceId => {
          const result = TtsValidationService.validateVoiceSelection(voiceId, 'replicate');
          if (voiceId === '') {
            // Empty voice has a different error message
            expect(result.isValid).toBe(false);
            expect(result.errors[0]).toContain('Voice selection is required');
          } else {
            expect(result.isValid).toBe(false);
            expect(result.errors[0]).toContain('is not compatible with provider "replicate"');
          }
        });
      });
    });

    describe('ElevenLabs Provider', () => {
      it('should accept valid ElevenLabs voice IDs', () => {
        const validVoices = [
          'MF3mGyEYCl7XYWbV9V6O', // 20-character format
          'SOYHLrjzK2X1ezoPC6cr', // 20-character format
          'default',               // Fallback
        ];

        validVoices.forEach(voiceId => {
          const result = TtsValidationService.validateVoiceSelection(voiceId, 'elevenlabs');
          expect(result.isValid).toBe(true);
          expect(result.errors).toHaveLength(0);
          if (voiceId !== 'default') {
            expect(result.voice).toBeTruthy();
          }
        });
      });

      it('should reject invalid voice IDs for ElevenLabs', () => {
        const invalidVoices = [
          'af_aoede',              // Replicate format
          'shortid',               // Too short
          'toolongvoiceidthatexceeds20chars', // Too long
          'MF3mGyEYCl7XYWbV9V6', // 19 characters (too short)
          '',
        ];

        invalidVoices.forEach(voiceId => {
          const result = TtsValidationService.validateVoiceSelection(voiceId, 'elevenlabs');
          if (voiceId === '') {
            expect(result.isValid).toBe(false);
            expect(result.errors[0]).toContain('Voice selection is required');
          } else {
            expect(result.isValid).toBe(false);
            expect(result.errors[0]).toContain('is not compatible with provider "elevenlabs"');
          }
        });
      });
    });

    describe('Unknown Provider', () => {
      it('should reject any voice for unknown provider', () => {
        const result = TtsValidationService.validateVoiceSelection('af_aoede', 'unknown_provider');
        expect(result.isValid).toBe(false);
        expect(result.errors[0]).toContain('is not compatible with provider "unknown_provider"');
      });
    });
  });

  describe('Text Input Validation', () => {
    it('should accept valid text input', () => {
      const result = TtsValidationService.validateTextInput('Hello, world!');
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.textInput).toBeTruthy();
    });

    it('should reject empty text', () => {
      const result = TtsValidationService.validateTextInput('');
      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain('Text input is required');
    });

    it('should reject text that is too long', () => {
      const longText = 'a'.repeat(10001); // Over 10,000 characters
      const result = TtsValidationService.validateTextInput(longText);
      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain('cannot exceed');
    });
  });

  describe('Complete TTS Request Validation', () => {
    it('should validate a complete valid request', () => {
      const result = TtsValidationService.validateTtsRequest({
        text: 'Hello, world!',
        voiceId: 'af_aoede',
        provider: 'replicate',
      });

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.speechRequest).toBeTruthy();
    });

    it('should catch multiple validation errors', () => {
      const result = TtsValidationService.validateTtsRequest({
        text: '',
        voiceId: 'invalid_voice',
        provider: 'unknown_provider',
      });

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(1);
      expect(result.speechRequest).toBeNull();
    });
  });
}); 