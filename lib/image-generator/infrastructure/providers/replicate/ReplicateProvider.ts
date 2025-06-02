import { ImageGenerationProvider, GenerationRequest, GenerationResult } from '../../../domain/repositories/ImageGenerationProvider';
import { ProviderId, ModelId, ProviderModel } from '../../../domain/value-objects/Provider';
import { ReplicateClient } from './ReplicateClient';
import { StatusMapper } from './StatusMapper';

export class ReplicateProvider implements ImageGenerationProvider {
  public readonly providerId: ProviderId = 'replicate';
  private client: ReplicateClient | null = null;
  private readonly statusMapper: StatusMapper;

  constructor(private readonly apiToken?: string) {
    this.statusMapper = new StatusMapper();
  }

  private getClient(): ReplicateClient {
    if (!this.client) {
      this.client = new ReplicateClient(this.apiToken);
    }
    return this.client;
  }

  async generateImage(request: GenerationRequest): Promise<GenerationResult> {
    const validation = this.validateRequest(request);
    if (!validation.isValid) {
      throw new Error(`Invalid generation request: ${validation.errors.join(', ')}`);
    }

    const model = this.getModel(request.modelId);
    if (!model) {
      throw new Error(`Model ${request.modelId} not found`);
    }

    const modelMapping = this.getReplicateModelId(request.modelId);
    const input = this.createInput(request);
    
    const prediction = await this.getClient().createPrediction({
      model: modelMapping,
      input,
    });

    return {
      id: prediction.id,
      status: this.mapToDomainStatus(this.statusMapper.mapReplicateStatus(prediction.status)),
      estimatedTimeSeconds: model.capabilities.estimatedTimeSeconds,
    };
  }

  async checkStatus(generationId: string): Promise<GenerationResult> {
    const prediction = await this.getClient().getPrediction(generationId);
    const status = this.statusMapper.mapToPredictionStatus(prediction);
    
    return {
      id: generationId,
      status: this.mapToDomainStatus(status.status),
      imageUrl: this.statusMapper.getImageUrl(status) || undefined,
      errorMessage: status.error || undefined,
    };
  }

  async cancelGeneration(generationId: string): Promise<void> {
    await this.getClient().cancelPrediction(generationId);
  }

  getSupportedModels(): ProviderModel[] {
    return [
      {
        id: 'flux-kontext-max',
        name: 'FLUX Kontext Max',
        description: 'Advanced image editing and generation with enhanced typography capabilities',
        capabilities: {
          maxPromptLength: 2000,
          supportedAspectRatios: ['1:1', '3:4', '4:3', '16:9', '9:16', '21:9', '9:21', '3:7', '7:3'],
          defaultSettings: {
            aspectRatio: '1:1',
            outputFormat: 'jpeg',
            safetyTolerance: 2,
          },
          costPerGeneration: 8, // 8 cents
          estimatedTimeSeconds: 25,
          supportsImageEditing: true,
          supportsTextToImage: true,
          supportsCustomDimensions: true,
          supportsStyleControls: true,
          supportedOutputFormats: ['jpeg', 'png'],
          maxSafetyTolerance: 6,
          minSafetyTolerance: 1,
        },
        isDefault: false,
      },
      {
        id: 'flux-schnell',
        name: 'FLUX Schnell',
        description: 'Fastest image generation model for rapid prototyping and testing',
        capabilities: {
          maxPromptLength: 2000,
          supportedAspectRatios: ['1:1', '16:9', '9:16', '4:3', '3:4'],
          defaultSettings: {
            aspectRatio: '1:1',
            outputFormat: 'png',
          },
          costPerGeneration: 1, // 1 cent - much cheaper!
          estimatedTimeSeconds: 10,
          supportsImageEditing: false, // Schnell is text-to-image only
          supportsTextToImage: true,
          supportsCustomDimensions: false,
          supportsStyleControls: false,
          supportedOutputFormats: ['png', 'webp', 'jpg'],
        },
        isDefault: true,
      },
    ];
  }

  getModel(modelId: ModelId): ProviderModel | undefined {
    return this.getSupportedModels().find(model => model.id === modelId);
  }

  validateRequest(request: GenerationRequest): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    const model = this.getModel(request.modelId);

    if (!model) {
      errors.push(`Model ${request.modelId} not supported by ${this.providerId}`);
      return { isValid: false, errors };
    }

    if (!request.prompt?.trim()) {
      errors.push('Prompt is required');
    }

    if (request.prompt && request.prompt.length > model.capabilities.maxPromptLength) {
      errors.push(`Prompt exceeds maximum length of ${model.capabilities.maxPromptLength} characters`);
    }

    if (request.aspectRatio && !model.capabilities.supportedAspectRatios.includes(request.aspectRatio)) {
      errors.push(`Aspect ratio ${request.aspectRatio} not supported`);
    }

    // Model-specific validations
    if (request.modelId === 'flux-schnell') {
      if (request.baseImageUrl) {
        errors.push('Image editing not supported by flux-schnell model');
      }
      if (request.safetyTolerance !== undefined) {
        errors.push('Safety tolerance not configurable for flux-schnell model');
      }
    }

    if (request.modelId === 'flux-kontext-max' && request.safetyTolerance !== undefined) {
      const min = model.capabilities.minSafetyTolerance || 1;
      const max = model.capabilities.maxSafetyTolerance || 6;
      if (request.safetyTolerance < min || request.safetyTolerance > max) {
        errors.push(`Safety tolerance must be between ${min} and ${max}`);
      }
    }

    return { isValid: errors.length === 0, errors };
  }

  estimateCost(request: GenerationRequest): number {
    const model = this.getModel(request.modelId);
    return model?.capabilities.costPerGeneration || 0;
  }

  private getReplicateModelId(modelId: ModelId): string {
    switch (modelId) {
      case 'flux-kontext-max':
        return 'black-forest-labs/flux-kontext-max';
      case 'flux-schnell':
        return 'black-forest-labs/flux-schnell';
      default:
        throw new Error(`Unknown model ID: ${modelId}`);
    }
  }

  private mapToDomainStatus(replicateStatus: import('./StatusMapper').DomainStatus): GenerationResult['status'] {
    switch (replicateStatus) {
      case 'starting':
        return 'starting';
      case 'processing':
        return 'processing';
      case 'succeeded':
        return 'completed';
      case 'failed':
        return 'failed';
      case 'canceled':
        return 'cancelled';
      default:
        return 'processing';
    }
  }

  private createInput(request: GenerationRequest): Record<string, unknown> {
    const model = this.getModel(request.modelId);
    const defaults = model?.capabilities.defaultSettings;

    const input: Record<string, unknown> = {
      prompt: request.prompt,
      output_format: request.outputFormat || defaults?.outputFormat,
    };

    // Model-specific input parameters
    if (request.modelId === 'flux-kontext-max') {
      input.safety_tolerance = request.safetyTolerance || defaults?.safetyTolerance;
      if (request.baseImageUrl) {
        input.input_image = request.baseImageUrl;
      }
    } else if (request.modelId === 'flux-schnell') {
      input.go_fast = true; // Enable optimized inference for schnell
    }

    if (request.aspectRatio) {
      input.aspect_ratio = request.aspectRatio;
    } else {
      input.aspect_ratio = defaults?.aspectRatio;
    }

    if (request.seed !== undefined && request.seed !== null) {
      input.seed = request.seed;
    }

    if (request.outputQuality !== undefined) {
      input.output_quality = request.outputQuality;
    }

    return input;
  }
} 