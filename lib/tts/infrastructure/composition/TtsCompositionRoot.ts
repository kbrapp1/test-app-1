import { TtsApplicationService } from '../../application/services/TtsApplicationService';
import { TtsPredictionSupabaseRepository } from '../persistence/supabase/TtsPredictionSupabaseRepository';
import { ConcreteTtsGenerationService } from '../services/ConcreteTtsGenerationService';
import { TtsPredictionService } from '../../domain/services/TtsPredictionService';
import { TtsFeatureFlagAdapter } from '../adapters/TtsFeatureFlagAdapter';

export class TtsCompositionRoot {
  private static _ttsApplicationService: TtsApplicationService | null = null;

  static getTtsApplicationService(): TtsApplicationService {
    if (!this._ttsApplicationService) {
      // Create infrastructure dependencies
      const repository = new TtsPredictionSupabaseRepository();
      const ttsGenerationService = new ConcreteTtsGenerationService();
      const featureFlagService = new TtsFeatureFlagAdapter();
      
      // Create domain services with injected dependencies
      const predictionService = new TtsPredictionService(repository);
      
      // Wire everything together
      this._ttsApplicationService = new TtsApplicationService(
        repository,
        ttsGenerationService,
        predictionService,
        featureFlagService
      );
    }
    return this._ttsApplicationService;
  }

  // For testing - allows dependency injection
  static setTtsApplicationService(service: TtsApplicationService): void {
    this._ttsApplicationService = service;
  }

  // For testing - reset to force recreation
  static reset(): void {
    this._ttsApplicationService = null;
  }
} 