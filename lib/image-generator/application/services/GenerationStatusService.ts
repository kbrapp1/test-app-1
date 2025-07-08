import { GenerationRepository } from '../../domain/repositories/GenerationRepository';
import { Generation } from '../../domain/entities/Generation';
import { ProviderFactory } from '../../infrastructure/providers/ProviderFactory';
import { AutoSaveGenerationUseCase } from '../use-cases/AutoSaveGenerationUseCase';
import { GenerationDto } from '../dto';
import { GenerationMapper } from '../mappers/GenerationMapper';
import { 
  GetGenerationResponse, 
  BatchGenerationResponse 
} from '../actions/shared/types';

/**
 * Generation Status Service
 * Single Responsibility: Handle generation status checking and provider communication
 * Application Layer - Coordinates domain objects for status management use cases
 */
export class GenerationStatusService {
  private readonly timeoutThreshold = 60 * 1000; // 60 seconds

  constructor(
    private readonly generationRepository: GenerationRepository,
    private readonly autoSaveUseCase: AutoSaveGenerationUseCase
  ) {}

  /**
   * Check single generation status with provider communication and auto-save
   */
  async checkGenerationStatus(
    generationId: string,
    authContext: { userId: string; organizationId: string }
  ): Promise<GetGenerationResponse> {
    try {
      const generationResult = await this.generationRepository.findById(generationId);
      if (!generationResult.isSuccess()) {
        return { 
          success: false, 
          error: generationResult.getError() || 'Generation not found' 
        };
      }

      const generation = generationResult.getValue();
      if (!generation) {
        return { success: false, error: 'Generation not found' };
      }
      
      // Apply timeout logic for stuck generations
      const wasTimedOut = await this.handleTimeoutCheck(generation);
      if (wasTimedOut) {
        return {
          success: true,
          data: GenerationMapper.toDto(generation)
        };
      }

      // Return cached result for completed/cancelled generations
      if (this.isTerminalStatus(generation)) {
        return {
          success: true,
          data: GenerationMapper.toDto(generation)
        };
      }

      // Check status with provider for active generations
      await this.checkWithProviderAndUpdate(generation, authContext);
      
      return {
        success: true,
        data: GenerationMapper.toDto(generation)
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Status check failed'
      };
    }
  }

  /**
   * Check multiple generation statuses in batch
   */
  async checkMultipleGenerationStatus(
    generationIds: string[],
    authContext: { userId: string; organizationId: string }
  ): Promise<BatchGenerationResponse> {
    try {
      const results: GenerationDto[] = [];
      const errors: { id: string; error: string }[] = [];

      for (const id of generationIds) {
        const result = await this.checkGenerationStatus(id, authContext);
        if (result.success && result.data) {
          results.push(result.data);
        } else {
          errors.push({ id, error: result.error || 'Unknown error' });
        }
      }

      return {
        success: true,
        data: results,
        errors: errors.length > 0 ? errors : undefined
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Batch status check failed'
      };
    }
  }

  /**
   * Handle timeout check for stuck generations
   */
  private async handleTimeoutCheck(generation: Generation): Promise<boolean> {
    const now = new Date();
    const generationAge = now.getTime() - generation.createdAt.getTime();
    
    if (generationAge > this.timeoutThreshold && this.isActiveStatus(generation)) {
      generation.markAsFailed('Generation timed out');
      await this.generationRepository.update(generation);
      return true;
    }
    
    return false;
  }

  /**
   * Check status with provider and update generation accordingly
   */
  private async checkWithProviderAndUpdate(
    generation: Generation, 
    authContext: { userId: string; organizationId: string }
  ): Promise<void> {
    const providerId = generation.providerName;
    
    if (!providerId || !generation.externalProviderId) {
      generation.markAsFailed('Missing provider information');
      await this.generationRepository.update(generation);
      return;
    }

    const registry = ProviderFactory.createProviderRegistry();
    const provider = registry.getProvider(providerId as any);
    
    if (!provider) {
      generation.markAsFailed(`Provider ${providerId} not available`);
      await this.generationRepository.update(generation);
      return;
    }

    const providerResult = await provider.checkStatus(generation.externalProviderId);
    
    // Update generation based on provider response
    if (providerResult.status === 'completed' && providerResult.imageUrl) {
      generation.markAsCompleted(providerResult.imageUrl, 25); // Use estimated time
      await this.generationRepository.update(generation);
      
      // Trigger auto-save in background
      await this.triggerAutoSave(generation);
    } else if (providerResult.status === 'failed') {
      const errorMessage = providerResult.errorMessage || 'Generation failed at provider';
      generation.markAsFailed(errorMessage);
      await this.generationRepository.update(generation);
    }
    // For 'processing' status, no update needed - generation remains in current state
  }

  /**
   * Trigger auto-save for completed generation
   */
  private async triggerAutoSave(generation: Generation): Promise<void> {
    try {
      await this.generationRepository.save(generation);
    } catch (error) {
      // Auto-save failure should not affect the main generation flow
      // Error is logged internally by the use case
    }
  }

  /**
   * Check if generation is in active (non-terminal) status
   */
  private isActiveStatus(generation: Generation): boolean {
    return ['pending', 'processing'].includes(generation.getStatus().value);
  }

  /**
   * Check if generation is in terminal status
   */
  private isTerminalStatus(generation: Generation): boolean {
    return ['completed', 'cancelled'].includes(generation.getStatus().value);
  }
} 