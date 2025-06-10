/**
 * SpeechResult Tests
 * 
 * Tests for speech result creation and status mapping
 */

import { describe, it, expect } from 'vitest';
import { SpeechResult } from '../SpeechResult';

describe('SpeechResult', () => {
  describe('fromReplicate', () => {
    it('should create successful result for succeeded status with output', () => {
      const prediction = {
        status: 'succeeded',
        output: 'https://example.com/audio.wav',
        id: 'test-prediction-id'
      };

      const result = SpeechResult.fromReplicate(prediction);

      expect(result.status).toBe('succeeded');
      expect(result.isSuccessful).toBe(true);
      expect(result.audioUrl).toBe('https://example.com/audio.wav');
      expect(result.predictionId).toBe('test-prediction-id');
    });

    it('should create successful result for completed status with output', () => {
      const prediction = {
        status: 'completed', // This is what kokoro-82m model uses
        output: 'https://example.com/audio.wav',
        id: 'test-prediction-id'
      };

      const result = SpeechResult.fromReplicate(prediction);

      expect(result.status).toBe('succeeded');
      expect(result.isSuccessful).toBe(true);
      expect(result.audioUrl).toBe('https://example.com/audio.wav');
      expect(result.predictionId).toBe('test-prediction-id');
    });

    it('should create processing result for other statuses', () => {
      const prediction = {
        status: 'processing',
        id: 'test-prediction-id'
      };

      const result = SpeechResult.fromReplicate(prediction);

      expect(result.status).toBe('processing');
      expect(result.isProcessing).toBe(true);
      expect(result.isSuccessful).toBe(false);
      expect(result.audioUrl).toBe(null);
    });

    it('should create failed result for failed status', () => {
      const prediction = {
        status: 'failed',
        error: 'Generation failed',
        id: 'test-prediction-id'
      };

      const result = SpeechResult.fromReplicate(prediction);

      expect(result.status).toBe('failed');
      expect(result.isFinal).toBe(true);
      expect(result.isSuccessful).toBe(false);
      expect(result.error).toBe('Generation failed');
    });

    it('should handle array output format', () => {
      const prediction = {
        status: 'succeeded',
        output: ['https://example.com/audio.wav'],
        id: 'test-prediction-id'
      };

      const result = SpeechResult.fromReplicate(prediction);

      expect(result.status).toBe('succeeded');
      expect(result.audioUrl).toBe('https://example.com/audio.wav');
    });

    it('should handle object output format with url property', () => {
      const prediction = {
        status: 'completed',
        output: { url: 'https://example.com/audio.wav' },
        id: 'test-prediction-id'
      };

      const result = SpeechResult.fromReplicate(prediction);

      expect(result.status).toBe('succeeded');
      expect(result.audioUrl).toBe('https://example.com/audio.wav');
    });

    it('should return processing if status is succeeded but no output', () => {
      const prediction = {
        status: 'succeeded',
        // No output provided
        id: 'test-prediction-id'
      };

      const result = SpeechResult.fromReplicate(prediction);

      expect(result.status).toBe('processing'); // Falls back to processing
      expect(result.isSuccessful).toBe(false);
    });
  });
}); 