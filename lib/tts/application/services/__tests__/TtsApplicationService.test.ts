/**
 * Tests for TtsApplicationService
 * 
 * Tests the application service layer coordination,
 * feature flag handling, and DTO mapping functionality.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TtsApplicationService } from '../TtsApplicationService';

// Mock dependencies
vi.mock('@/lib/actions/services/TtsFeatureFlagService', () => ({
  checkTtsFeatureFlag: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../../use-cases/getTtsVoicesUsecase', () => ({
  getTtsVoices: vi.fn().mockResolvedValue({ success: true, voices: [] }),
}));

vi.mock('../../use-cases/startSpeechGenerationUsecase', () => ({
  startSpeechGeneration: vi.fn().mockResolvedValue({
    success: true,
    predictionId: 'test-prediction-id',
    ttsPredictionDbId: 'test-db-id'
  }),
}));

vi.mock('../../use-cases/getSpeechGenerationResultUsecase', () => ({
  getSpeechGenerationResult: vi.fn().mockResolvedValue({
    success: true,
    status: 'completed',
    audioUrl: 'https://example.com/audio.mp3'
  }),
}));

vi.mock('../../use-cases/saveTtsAudioToDamUsecase', () => ({
  saveTtsAudioToDam: vi.fn().mockResolvedValue({
    success: true,
    assetId: 'test-asset-id'
  }),
}));

vi.mock('../../use-cases/getTtsHistoryUsecase', () => ({
  getTtsHistory: vi.fn().mockResolvedValue({
    success: true,
    data: [],
    count: 0
  }),
}));

vi.mock('../../../domain/services/TtsPredictionService', () => ({
  TtsPredictionService: vi.fn().mockImplementation(() => ({
    linkToAsset: vi.fn().mockResolvedValue(undefined),
    markUrlProblematic: vi.fn().mockResolvedValue(undefined),
  })),
}));

vi.mock('../../../infrastructure/persistence/supabase/TtsPredictionSupabaseRepository', () => ({
  TtsPredictionSupabaseRepository: vi.fn().mockImplementation(() => ({})),
}));

vi.mock('../../mappers/TtsPredictionToDisplayDtoMapper', () => ({
  TtsPredictionToDisplayDtoMapper: vi.fn().mockImplementation(() => ({
    toDisplayDto: vi.fn().mockReturnValue({
      id: 'test-id',
      inputText: 'test text',
      status: 'completed',
    }),
  })),
}));

import { checkTtsFeatureFlag } from '@/lib/actions/services/TtsFeatureFlagService';
import { getTtsVoices } from '../../use-cases/getTtsVoicesUsecase';
import { startSpeechGeneration } from '../../use-cases/startSpeechGenerationUsecase';
import { getSpeechGenerationResult } from '../../use-cases/getSpeechGenerationResultUsecase';
import { saveTtsAudioToDam } from '../../use-cases/saveTtsAudioToDamUsecase';
import { getTtsHistory } from '../../use-cases/getTtsHistoryUsecase';

describe('TtsApplicationService', () => {
  let service: TtsApplicationService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new TtsApplicationService();
  });

  describe('getVoices', () => {
    it('should check feature flag and delegate to use case', async () => {
      const result = await service.getVoices('elevenlabs', 'model-1');

      expect(checkTtsFeatureFlag).toHaveBeenCalled();
      expect(getTtsVoices).toHaveBeenCalledWith('elevenlabs', 'model-1');
      expect(result).toEqual({ success: true, voices: [] });
    });

    it('should handle feature flag errors', async () => {
      const featureFlagError = new Error('Feature disabled');
      vi.mocked(checkTtsFeatureFlag).mockRejectedValueOnce(featureFlagError);

      const result = await service.getVoices();

      expect(checkTtsFeatureFlag).toHaveBeenCalled();
      expect(result).toEqual({ success: false, error: 'Feature disabled' });
    });
  });

  describe('startSpeechGeneration', () => {
    it('should check feature flag and delegate to use case', async () => {
      const result = await service.startSpeechGeneration('Hello world', 'voice-1', 'elevenlabs');

      expect(checkTtsFeatureFlag).toHaveBeenCalled();
      expect(startSpeechGeneration).toHaveBeenCalledWith('Hello world', 'voice-1', 'elevenlabs');
      expect(result).toEqual({
        success: true,
        predictionId: 'test-prediction-id',
        ttsPredictionDbId: 'test-db-id'
      });
    });

    it('should handle feature flag errors gracefully', async () => {
      const featureFlagError = new Error('Feature disabled');
      vi.mocked(checkTtsFeatureFlag).mockRejectedValueOnce(featureFlagError);

      const result = await service.startSpeechGeneration('Hello world', 'voice-1', 'elevenlabs');

      expect(result).toEqual({
        success: false,
        error: 'Feature disabled'
      });
    });
  });

  describe('getSpeechGenerationResult', () => {
    it('should check feature flag and delegate to use case', async () => {
      const result = await service.getSpeechGenerationResult('test-id');

      expect(checkTtsFeatureFlag).toHaveBeenCalled();
      expect(getSpeechGenerationResult).toHaveBeenCalledWith('test-id');
      expect(result).toEqual({
        success: true,
        status: 'completed',
        audioUrl: 'https://example.com/audio.mp3'
      });
    });

    it('should handle use case errors', async () => {
      const useCaseError = new Error('Prediction not found');
      vi.mocked(getSpeechGenerationResult).mockRejectedValueOnce(useCaseError);

      const result = await service.getSpeechGenerationResult('invalid-id');

      expect(result).toEqual({
        success: false,
        error: 'Prediction not found'
      });
    });
  });

  describe('saveTtsAudioToDam', () => {
    it('should save audio and link to prediction when successful', async () => {
      const mockPredictionService = {
        linkToAsset: vi.fn().mockResolvedValue(undefined),
        markUrlProblematic: vi.fn().mockResolvedValue(undefined),
      };
      
      // Access the private predictionService to mock it
      (service as any).predictionService = mockPredictionService;

      const result = await service.saveTtsAudioToDam(
        'https://example.com/audio.mp3',
        'test-audio',
        'prediction-id',
        true
      );

      expect(checkTtsFeatureFlag).toHaveBeenCalled();
      expect(saveTtsAudioToDam).toHaveBeenCalledWith(
        'https://example.com/audio.mp3',
        'test-audio',
        'prediction-id'
      );
      expect(mockPredictionService.linkToAsset).toHaveBeenCalledWith('prediction-id', 'test-asset-id');
      expect(result).toEqual({
        success: true,
        assetId: 'test-asset-id'
      });
    });

    it('should not link when linkToPrediction is false', async () => {
      const result = await service.saveTtsAudioToDam(
        'https://example.com/audio.mp3',
        'test-audio',
        'prediction-id',
        false
      );

      expect(result).toEqual({
        success: true,
        assetId: 'test-asset-id'
      });
    });

    it('should handle linking errors gracefully', async () => {
      const mockPredictionService = {
        linkToAsset: vi.fn().mockRejectedValue(new Error('Linking failed')),
        markUrlProblematic: vi.fn().mockResolvedValue(undefined),
      };
      
      (service as any).predictionService = mockPredictionService;

      const result = await service.saveTtsAudioToDam(
        'https://example.com/audio.mp3',
        'test-audio',
        'prediction-id',
        true
      );

      expect(result).toEqual({
        success: false,
        error: 'Failed to link asset to prediction.',
        assetId: undefined
      });
    });
  });

  describe('getTtsHistory', () => {
    it('should check feature flag and use DTO mapper', async () => {
      const mockEntity = {
        id: 'test-id',
        textInput: { value: 'test text' },
        status: { value: 'completed' },
      };

      vi.mocked(getTtsHistory).mockResolvedValueOnce({
        success: true,
        data: [mockEntity as any],
        count: 1
      });

      const result = await service.getTtsHistory({
        page: 1,
        limit: 10,
        sortBy: 'createdAt',
        sortOrder: 'desc'
      });

      expect(checkTtsFeatureFlag).toHaveBeenCalled();
      expect(getTtsHistory).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
        sortBy: 'createdAt',
        sortOrder: 'desc'
      });
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.count).toBe(1);
    });

    it('should handle use case failures', async () => {
      vi.mocked(getTtsHistory).mockResolvedValueOnce({
        success: false,
        error: 'Database error',
        count: undefined
      });

      const result = await service.getTtsHistory();

      expect(result).toEqual({
        success: false,
        error: 'Database error',
        count: undefined
      });
    });
  });

  describe('markTtsUrlProblematic', () => {
    it('should mark URL as problematic using domain service', async () => {
      const mockPredictionService = {
        linkToAsset: vi.fn().mockResolvedValue(undefined),
        markUrlProblematic: vi.fn().mockResolvedValue(undefined),
      };
      
      (service as any).predictionService = mockPredictionService;

      const result = await service.markTtsUrlProblematic('prediction-id', 'URL expired');

      expect(checkTtsFeatureFlag).toHaveBeenCalled();
      expect(mockPredictionService.markUrlProblematic).toHaveBeenCalledWith(
        'prediction-id',
        'URL expired'
      );
      expect(result).toEqual({ success: true });
    });

    it('should use default error message when none provided', async () => {
      const mockPredictionService = {
        linkToAsset: vi.fn().mockResolvedValue(undefined),
        markUrlProblematic: vi.fn().mockResolvedValue(undefined),
      };
      
      (service as any).predictionService = mockPredictionService;

      await service.markTtsUrlProblematic('prediction-id', null);

      expect(mockPredictionService.markUrlProblematic).toHaveBeenCalledWith(
        'prediction-id',
        'URL marked as problematic'
      );
    });

    it('should handle domain service errors', async () => {
      const mockPredictionService = {
        linkToAsset: vi.fn().mockResolvedValue(undefined),
        markUrlProblematic: vi.fn().mockRejectedValue(new Error('Prediction not found')),
      };
      
      (service as any).predictionService = mockPredictionService;

      const result = await service.markTtsUrlProblematic('invalid-id', 'error');

      expect(result).toEqual({
        success: false,
        error: 'Prediction not found'
      });
    });
  });
}); 