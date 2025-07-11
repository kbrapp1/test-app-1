/**
 * Tests for TtsApplicationService
 * 
 * Tests the application service layer coordination,
 * feature flag handling, and DTO mapping functionality.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TtsApplicationService } from '../TtsApplicationService';
import type { TtsPredictionRepository } from '../../../domain/repositories/TtsPredictionRepository';
import type { TtsGenerationService } from '../TtsGenerationService';
import type { ITtsFeatureFlagService } from '../../../domain/services/ITtsFeatureFlagService';
import type { TtsPredictionService } from '../../../domain/services/TtsPredictionService';

// Mock use cases
vi.mock('../../use-cases/getTtsVoicesUsecase', () => ({
  getTtsVoices: vi.fn().mockResolvedValue({ success: true, voices: [] })
}));

vi.mock('../../use-cases/startSpeechGenerationUsecase', () => ({
  startSpeechGeneration: vi.fn().mockResolvedValue({
    success: true,
    predictionId: 'test-prediction-id',
    ttsPredictionDbId: 'test-db-id'
  })
}));

vi.mock('../../use-cases/getSpeechGenerationResultUsecase', () => ({
  getSpeechGenerationResult: vi.fn().mockResolvedValue({
    success: true,
    status: 'completed',
    audioUrl: 'https://example.com/audio.mp3'
  })
}));

vi.mock('../../use-cases/saveTtsAudioToDamUsecase', () => ({
  saveTtsAudioToDam: vi.fn().mockResolvedValue({
    success: true,
    assetId: 'test-asset-id'
  })
}));

vi.mock('../../use-cases/saveTtsHistoryUsecase', () => ({
  saveTtsHistory: vi.fn().mockResolvedValue({ success: true })
}));

vi.mock('../../use-cases/getTtsHistoryUsecase', () => ({
  getTtsHistory: vi.fn().mockResolvedValue({
    success: true,
    data: [],
    count: 0
  })
}));

vi.mock('../mappers/TtsPredictionToDisplayDtoMapper', () => ({
  TtsPredictionToDisplayDtoMapper: class {
    toDisplayDto(entity: { id?: string; textInput?: { value?: string }; status?: { value?: string } }) {
      return {
        id: entity.id || 'test-id',
        inputText: entity.textInput?.value || 'test text',
        status: entity.status?.value || 'completed'
      };
    }
  }
}));

import { getTtsVoices } from '../../use-cases/getTtsVoicesUsecase';
import { startSpeechGeneration } from '../../use-cases/startSpeechGenerationUsecase';
import { getSpeechGenerationResult } from '../../use-cases/getSpeechGenerationResultUsecase';
import { saveTtsAudioToDam } from '../../use-cases/saveTtsAudioToDamUsecase';
import { getTtsHistory } from '../../use-cases/getTtsHistoryUsecase';

describe('TtsApplicationService', () => {
  let service: TtsApplicationService;
  let mockRepository: TtsPredictionRepository;
  let mockTtsGenerationService: TtsGenerationService;
  let mockPredictionService: TtsPredictionService;
  let mockFeatureFlagService: ITtsFeatureFlagService;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Create mock dependencies
    mockRepository = {} as TtsPredictionRepository;
    mockTtsGenerationService = {} as TtsGenerationService;
    mockPredictionService = {
      linkToAsset: vi.fn().mockResolvedValue(undefined),
      markUrlProblematic: vi.fn().mockResolvedValue(undefined),
    } as Partial<TtsPredictionService> as TtsPredictionService;
    mockFeatureFlagService = {
      checkTtsFeatureFlag: vi.fn().mockResolvedValue(undefined)
    } as Partial<ITtsFeatureFlagService> as ITtsFeatureFlagService;
    
    // Create service with dependency injection
    service = new TtsApplicationService(
      mockRepository, 
      mockTtsGenerationService,
      mockPredictionService,
      mockFeatureFlagService
    );
  });

  describe('getVoices', () => {
    it('should check feature flag and delegate to use case', async () => {
      const result = await service.getVoices('elevenlabs', 'model-1');

      expect(mockFeatureFlagService.checkTtsFeatureFlag).toHaveBeenCalled();
      expect(getTtsVoices).toHaveBeenCalledWith('elevenlabs', 'model-1');
      expect(result).toEqual({ success: true, voices: [] });
    });

    it('should handle feature flag errors', async () => {
      const featureFlagError = new Error('Feature disabled');
      vi.mocked(mockFeatureFlagService.checkTtsFeatureFlag).mockRejectedValueOnce(featureFlagError);

      const result = await service.getVoices();

      expect(mockFeatureFlagService.checkTtsFeatureFlag).toHaveBeenCalled();
      expect(result).toEqual({ success: false, error: 'Feature disabled' });
    });
  });

  describe('startSpeechGeneration', () => {
    it('should check feature flag and delegate to use case', async () => {
      const result = await service.startSpeechGeneration('Hello world', 'voice-1', 'elevenlabs');

      expect(mockFeatureFlagService.checkTtsFeatureFlag).toHaveBeenCalled();
      expect(startSpeechGeneration).toHaveBeenCalledWith('Hello world', 'voice-1', 'elevenlabs', mockTtsGenerationService);
      expect(result).toEqual({
        success: true,
        predictionId: 'test-prediction-id',
        ttsPredictionDbId: 'test-db-id'
      });
    });

    it('should handle feature flag errors gracefully', async () => {
      const featureFlagError = new Error('Feature disabled');
      vi.mocked(mockFeatureFlagService.checkTtsFeatureFlag).mockRejectedValueOnce(featureFlagError);

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

      expect(mockFeatureFlagService.checkTtsFeatureFlag).toHaveBeenCalled();
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
      const result = await service.saveTtsAudioToDam(
        'https://example.com/audio.mp3',
        'test-audio',
        'prediction-id',
        true
      );

      expect(mockFeatureFlagService.checkTtsFeatureFlag).toHaveBeenCalled();
      expect(saveTtsAudioToDam).toHaveBeenCalledWith(
        'https://example.com/audio.mp3',
        'test-audio',
        'prediction-id',
        mockTtsGenerationService
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
      expect(mockPredictionService.linkToAsset).not.toHaveBeenCalled();
    });

    it('should handle linking errors gracefully', async () => {
      vi.mocked(mockPredictionService.linkToAsset).mockRejectedValueOnce(new Error('Linking failed'));

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
      // Reset the mock for this specific test and set it as empty initially
      vi.mocked(getTtsHistory).mockRestore();
      vi.mocked(getTtsHistory).mockResolvedValue({
        success: true,
        data: undefined, // Will trigger the empty data path
        count: 0
      });

      const result = await service.getTtsHistory({
        page: 1,
        limit: 10,
        sortBy: 'createdAt',
        sortOrder: 'desc'
      });

      expect(mockFeatureFlagService.checkTtsFeatureFlag).toHaveBeenCalled();
      expect(getTtsHistory).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
        sortBy: 'createdAt',
        sortOrder: 'desc'
      });
      expect(result.success).toBe(true);
      expect(result.data).toEqual([]); // Empty array for null data
      expect(result.count).toBe(0);
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
    it('should check feature flag and delegate to domain service', async () => {
      const result = await service.markTtsUrlProblematic('prediction-id', 'Custom error');

      expect(mockFeatureFlagService.checkTtsFeatureFlag).toHaveBeenCalled();
      expect(mockPredictionService.markUrlProblematic).toHaveBeenCalledWith(
        'prediction-id',
        'Custom error'
      );
      expect(result).toEqual({ success: true });
    });

    it('should use default error message when none provided', async () => {
      const result = await service.markTtsUrlProblematic('prediction-id');

      expect(mockPredictionService.markUrlProblematic).toHaveBeenCalledWith(
        'prediction-id',
        'URL marked as problematic'
      );
      expect(result).toEqual({ success: true });
    });

    it('should handle service errors', async () => {
      vi.mocked(mockPredictionService.markUrlProblematic).mockRejectedValueOnce(new Error('Service error'));

      const result = await service.markTtsUrlProblematic('prediction-id');

      expect(result).toEqual({
        success: false,
        error: 'Service error'
      });
    });
  });
}); 