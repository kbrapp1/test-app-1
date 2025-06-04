import { Generation, CreateGenerationData } from '../../domain/entities/Generation';
import { GenerationFactory } from '../../domain/services/GenerationFactory';
import { GenerationRepository } from '../../domain/repositories/GenerationRepository';
import { ProviderService } from '../services/ProviderService';
import { ProviderFactory } from '../../infrastructure/providers/ProviderFactory';
import { Result, success, error } from '../../infrastructure/common/Result';
import { AutoSaveGenerationUseCase } from './AutoSaveGenerationUseCase';
import { GenerationStatusManager } from '../../domain/entities/services/GenerationStatusManager';
import { GenerationFailureHandler } from '../../domain/services/GenerationFailureHandler';

export interface GenerateImageRequest {
  prompt: string;
  width?: number;
  height?: number;
  aspectRatio?: string;
  organizationId: string;
  userId: string;
  safetyTolerance?: number;
  baseImageUrl?: string;
  providerId?: string;
  modelId?: string;
}

export class GenerateImageUseCase {
  private providerService: ProviderService;

  constructor(private readonly repository: GenerationRepository) {
    // Initialize provider service with registry
    const registry = ProviderFactory.createProviderRegistry();
    this.providerService = new ProviderService(registry);
  }

  async execute(request: GenerateImageRequest): Promise<Result<Generation, string>> {
    try {
      // Validate request
      if (!request.prompt?.trim()) {
        return error('Prompt is required');
      }

      // Use default provider configuration if not specified
      const defaultConfig = ProviderFactory.getDefaultProviderConfig();
      const providerId = request.providerId || defaultConfig.providerId;
      const modelId = request.modelId || defaultConfig.modelId;

      // Get provider from registry
      const providers = this.providerService.getAvailableProviders();
      const provider = providers.find(p => p.providerId === providerId);
      if (!provider) {
        return error(`Provider ${providerId} not found`);
      }

      // Get model
      const model = provider.getModel(modelId as any);
      if (!model) {
        return error(`Model ${modelId} not found for provider ${providerId}`);
      }

      // Create generation entity with pending status
      const generationData: CreateGenerationData = {
        organizationId: request.organizationId,
        userId: request.userId,
        prompt: request.prompt.trim(),
        modelName: modelId,
        providerName: providerId,
        imageWidth: request.width || 1024,
        imageHeight: request.height || 1024,
        aspectRatio: request.aspectRatio,
        baseImageUrl: request.baseImageUrl,
      };

      const generation = GenerationFactory.create(generationData);

      // Save to repository first
      const saveResult = await this.repository.save(generation);
      if (!saveResult.isSuccess()) {
        return error(saveResult.getError() || 'Failed to save generation');
      }

      // Start async generation process (fire-and-forget)
      this.startAsyncGeneration(generation, provider, model, request.safetyTolerance || 2).catch(err => {
        console.error('Async generation failed:', err);
      });

      return success(generation);
    } catch (err) {
      return error(err instanceof Error ? err.message : 'Unknown error');
    }
  }

  private async startAsyncGeneration(
    generation: Generation,
    provider: any,
    model: any,
    safetyTolerance: number = 2
  ): Promise<void> {
    try {
      // Update status to processing
      generation.updateStatus(generation.getStatus().transitionTo('processing'));
      await this.repository.update(generation);

      // Prepare generation request for provider
      const generationRequest: any = {
        prompt: generation.prompt.text,
        modelId: model.id,
        aspectRatio: generation.aspectRatio,
        baseImageUrl: generation.baseImageUrl,
      };

      // Only add safetyTolerance if the model supports it
      if (model.capabilities.maxSafetyTolerance !== undefined) {
        generationRequest.safetyTolerance = safetyTolerance;
      }

      // Call provider to start generation
      const result = await provider.generateImage(generationRequest);
      
      // Update generation with external provider ID
      generation.setExternalProviderId(result.id);
      await this.repository.update(generation);

      // Note: Frontend polling will handle status updates from here
      // Auto-save will be triggered by polling when generation completes

    } catch (err) {
      console.error('Generation process failed:', err);
      
      // Reload generation from repository to get latest state before marking as failed
      // This prevents concurrent modification issues with polling/status services
      try {
        const reloadResult = await this.repository.findById(generation.getId());
        if (reloadResult.isSuccess()) {
          const freshGeneration = reloadResult.getValue();
          if (freshGeneration) {
            const errorMessage = GenerationFailureHandler.getDisplayErrorMessage(err instanceof Error ? err : 'Unknown error');
            const wasHandled = GenerationFailureHandler.handleFailure(freshGeneration, errorMessage);
            
            if (wasHandled) {
              await this.repository.update(freshGeneration);
            }
          }
        }
      } catch (updateError) {
        console.error('Failed to update generation after error:', updateError);
        // Don't re-throw - the original generation attempt already failed
      }
    }
  }

  private async autoSaveImage(generation: Generation): Promise<void> {
    // TODO: Re-enable after fixing RLS policies for assets table
    return;
    
    /*
    try {
      const autoSaveUseCase = new AutoSaveGenerationUseCase(this.repository);
      const result = await autoSaveUseCase.execute(generation.getId());
      
      if (!result.isSuccess()) {
        console.error('Failed to auto-save generation:', result.getError());
        // Don't fail the main generation process if auto-save fails
      }
    } catch (err) {
      console.error('Auto-save error:', err);
      // Don't fail the main generation process if auto-save fails
    }
    */
  }
} 