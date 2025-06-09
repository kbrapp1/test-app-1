import { GenerationRepository } from '../../domain/repositories/GenerationRepository';
import { SupabaseGenerationRepository } from '../../infrastructure/persistence/supabase/SupabaseGenerationRepository';
import { AutoSaveGenerationUseCase } from '../use-cases/AutoSaveGenerationUseCase';
import { GenerationStatusService } from './GenerationStatusService';

/**
 * Generation Orchestration Service
 * Single Responsibility: Coordinate service dependencies and provide configured instances
 * Application Layer - Service factory and dependency coordination
 */
export class GenerationOrchestrationService {
  private static generationRepository: GenerationRepository;
  private static autoSaveUseCase: AutoSaveGenerationUseCase;
  private static statusService: GenerationStatusService;

  /**
   * Get configured generation repository instance
   */
  static getGenerationRepository(): GenerationRepository {
    if (!this.generationRepository) {
      this.generationRepository = new SupabaseGenerationRepository();
    }
    return this.generationRepository;
  }

  /**
   * Get configured auto-save use case instance
   */
  static getAutoSaveUseCase(): AutoSaveGenerationUseCase {
    if (!this.autoSaveUseCase) {
      this.autoSaveUseCase = new AutoSaveGenerationUseCase();
    }
    return this.autoSaveUseCase;
  }

  /**
   * Get configured status service instance
   */
  static getStatusService(): GenerationStatusService {
    if (!this.statusService) {
      this.statusService = new GenerationStatusService(
        this.getGenerationRepository(),
        this.getAutoSaveUseCase()
      );
    }
    return this.statusService;
  }

  /**
   * Reset instances (useful for testing)
   */
  static reset(): void {
    this.generationRepository = undefined as any;
    this.autoSaveUseCase = undefined as any;
    this.statusService = undefined as any;
  }
} 