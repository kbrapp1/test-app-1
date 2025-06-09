import { ImageGenerationProvider, GenerationRequest, GenerationResult } from '../../../domain/repositories/ImageGenerationProvider';
import { ProviderId, ModelId, ProviderModel } from '../../../domain/value-objects/Provider';
import { ReplicateClient } from './ReplicateClient';
import { StatusMapper } from './StatusMapper';
import { LazyProviderLoader } from '../LazyProviderLoader';

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
    const validation = await this.validateRequest(request);
    if (!validation.isValid) {
      throw new Error(`Invalid generation request: ${validation.errors.join(', ')}`);
    }

    const model = await this.getModel(request.modelId);
    if (!model) {
      throw new Error(`Model ${request.modelId} not found`);
    }

    const modelMapping = this.getReplicateModelId(request.modelId);
    const input = await this.createInput(request);
    
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

  async getSupportedModels(): Promise<ProviderModel[]> {
    return await LazyProviderLoader.loadReplicateModels();
  }

  async getModel(modelId: ModelId): Promise<ProviderModel | undefined> {
    const models = await this.getSupportedModels();
    return models.find(model => model.id === modelId);
  }

  async validateRequest(request: GenerationRequest): Promise<{ isValid: boolean; errors: string[] }> {
    const errors: string[] = [];
    const model = await this.getModel(request.modelId);

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
    if (request.modelId === 'imagen-4') {
      if (request.baseImageUrl) {
        errors.push('Image editing not supported by Imagen-4 model - use text prompts only');
      }
      if (request.safetyTolerance !== undefined) {
        errors.push('Safety tolerance not configurable for Imagen-4 - Google handles safety internally');
      }
    }

    if (request.modelId === 'flux-kontext-pro-multi') {
      // Dual-image model requires both images
      if (!request.baseImageUrl) {
        errors.push('First input image is required for multi-image Kontext Pro model');
      }
      if (!request.secondImageUrl) {
        errors.push('Second input image is required for multi-image Kontext Pro model');
      }
      
      // Validate image URL formats
      if (request.baseImageUrl && !request.baseImageUrl.startsWith('http')) {
        errors.push('First image must be uploaded to storage before generation. Please wait for upload to complete.');
      }
      if (request.secondImageUrl && !request.secondImageUrl.startsWith('http')) {
        errors.push('Second image must be uploaded to storage before generation. Please wait for upload to complete.');
      }
      
      // Validate safety tolerance range
      if (request.safetyTolerance !== undefined) {
        const min = model.capabilities.minSafetyTolerance || 0;
        const max = model.capabilities.maxSafetyTolerance || 2;
        if (request.safetyTolerance < min || request.safetyTolerance > max) {
          errors.push(`Safety tolerance must be between ${min} and ${max}`);
        }
      }
    }

    if (request.modelId === 'flux-schnell') {
      if (request.baseImageUrl) {
        errors.push('Image editing not supported by flux-schnell model');
      }
      if (request.safetyTolerance !== undefined) {
        errors.push('Safety tolerance not configurable for flux-schnell model');
      }
    }

    if (request.modelId === 'flux-kontext-max') {
      // Validate base image URL format for Kontext
      if (request.baseImageUrl && !request.baseImageUrl.startsWith('http')) {
        errors.push('Base image must be uploaded to storage before generation. Please wait for upload to complete.');
      }
      
      if (request.safetyTolerance !== undefined) {
        const min = model.capabilities.minSafetyTolerance || 1;
        const max = model.capabilities.maxSafetyTolerance || 6;
        if (request.safetyTolerance < min || request.safetyTolerance > max) {
          errors.push(`Safety tolerance must be between ${min} and ${max}`);
        }
      }
    }

    return { isValid: errors.length === 0, errors };
  }

  async estimateCost(request: GenerationRequest): Promise<number> {
    const model = await this.getModel(request.modelId);
    return model?.capabilities.costPerGeneration || 0;
  }

  private getReplicateModelId(modelId: ModelId): string {
    switch (modelId) {
      case 'imagen-4':
        return 'google/imagen-4';
      case 'flux-kontext-max':
        return 'black-forest-labs/flux-kontext-max';
      case 'flux-kontext-pro-multi':
        return 'flux-kontext-apps/multi-image-kontext-pro';
      case 'flux-schnell':
        return 'black-forest-labs/flux-schnell';
      case 'flux-dev':
        return 'black-forest-labs/flux-dev';
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

  private async createInput(request: GenerationRequest): Promise<Record<string, unknown>> {
    const model = await this.getModel(request.modelId);
    const defaults = model?.capabilities.defaultSettings;

    const input: Record<string, unknown> = {
      prompt: request.prompt,
      output_format: request.outputFormat || defaults?.outputFormat,
    };

    // Model-specific input parameters
    if (request.modelId === 'imagen-4') {
      // Imagen-4 specific parameters
      // Google handles safety internally, no safety tolerance needed
      // No image input support for this text-to-image model
    } else if (request.modelId === 'flux-kontext-pro-multi') {
      // Multi-image Kontext Pro requires both images
      input.safety_tolerance = request.safetyTolerance || defaults?.safetyTolerance;
      if (request.baseImageUrl && request.baseImageUrl.startsWith('http')) {
        input.input_image_1 = request.baseImageUrl;
      }
      if (request.secondImageUrl && request.secondImageUrl.startsWith('http')) {
        input.input_image_2 = request.secondImageUrl;
      }
    } else if (request.modelId === 'flux-kontext-max') {
      input.safety_tolerance = request.safetyTolerance || defaults?.safetyTolerance;
      if (request.baseImageUrl && request.baseImageUrl.startsWith('http')) {
        // Only use properly uploaded URLs - validation above ensures this
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

    // For Kontext with input image, use "match_input_image" aspect ratio
    if (request.modelId === 'flux-kontext-max' && request.baseImageUrl) {
      input.aspect_ratio = 'match_input_image';
    }
    
    // For multi-image Kontext Pro, default to match_input_image if not specified
    if (request.modelId === 'flux-kontext-pro-multi' && !request.aspectRatio) {
      input.aspect_ratio = 'match_input_image';
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