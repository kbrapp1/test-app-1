// GenerationFactory Domain Service - DDD Domain Layer
// Single Responsibility: Handle complex Generation entity creation logic
// Factory pattern for encapsulating creation rules and validation

import type { CreateGenerationData } from '../entities/Generation';
import { Generation } from '../entities/Generation';
import { Prompt } from '../value-objects/Prompt';
import { GenerationStatus } from '../value-objects/GenerationStatus';
import { ImageDimensions } from '../value-objects/ImageDimensions';
import { GenerationCost } from '../value-objects/GenerationCost';
import type { GenerationData } from '../entities/Generation';

export class GenerationFactory {
  /**
   * Create a new Generation entity with all business rules applied
   * Validates input, applies defaults, and constructs valid domain object
   */
  static create(data: CreateGenerationData): Generation {
    const prompt = GenerationFactory.validateAndCreatePrompt(data.prompt);
    const dimensions = GenerationFactory.createDimensions(data);
    const cost = GenerationCost.fromModel(data.modelName || 'flux-schnell');
    const editType = GenerationFactory.determineEditType(data);

    const generationData: GenerationData = {
      id: crypto.randomUUID(),
      organizationId: data.organizationId,
      userId: data.userId,
      prompt,
      modelName: data.modelName || 'flux-schnell',
      providerName: data.providerName || 'replicate',
      status: GenerationStatus.pending(),
      resultImageUrl: null,
      baseImageUrl: data.baseImageUrl || null,
      secondImageUrl: data.secondImageUrl || null,
      externalProviderId: null,
      costCents: cost.cents,
      generationTimeSeconds: null,
      imageWidth: dimensions.width,
      imageHeight: dimensions.height,
      aspectRatio: dimensions.aspectRatio,
      editType,
      savedToDAM: false,
      damAssetId: null,
      sourceDamAssetId: data.damAssetId || null,
      errorMessage: null,
      metadata: data.metadata || {},
      seed: data.seed || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    return Generation.fromData(generationData);
  }

  private static validateAndCreatePrompt(promptText: string): Prompt {
    const prompt = Prompt.create(promptText);
    if (!prompt.isSuccess()) {
      throw new Error(`Invalid prompt: ${prompt.getError()}`);
    }
    return prompt.getValue();
  }

  private static createDimensions(data: CreateGenerationData): ImageDimensions {
    if (data.aspectRatio && !data.imageWidth && !data.imageHeight) {
      return ImageDimensions.fromAspectRatio(data.aspectRatio);
    }
    
    return ImageDimensions.create(
      data.imageWidth || 1024,
      data.imageHeight || 1024,
      data.aspectRatio
    );
  }

  private static determineEditType(
    data: CreateGenerationData
  ): 'text-to-image' | 'image-editing' | 'style-transfer' | 'background-swap' {
    if (data.editType) return data.editType;
    return data.baseImageUrl ? 'image-editing' : 'text-to-image';
  }
} 