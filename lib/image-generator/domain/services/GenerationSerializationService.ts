// Generation Serialization Domain Service - DDD Domain Layer  
// Single Responsibility: Handle generation data serialization and deserialization
// Following Golden Rule: Domain service for cross-cutting serialization concerns

import { Generation, GenerationData } from '../entities/Generation';
import { Prompt } from '../value-objects/Prompt';
import { GenerationStatus } from '../value-objects/GenerationStatus';

export interface GenerationSnapshot {
  id: string;
  organizationId: string;
  userId: string;
  prompt: string;
  modelName: string;
  providerName: string;
  status: string;
  resultImageUrl: string | null;
  baseImageUrl: string | null;
  secondImageUrl: string | null;
  externalProviderId: string | null;
  costCents: number;
  generationTimeSeconds: number | null;
  imageWidth: number;
  imageHeight: number;
  aspectRatio: string;
  editType: 'text-to-image' | 'image-editing' | 'style-transfer' | 'background-swap';
  savedToDAM: boolean;
  damAssetId: string | null;
  sourceDamAssetId: string | null;
  errorMessage: string | null;
  metadata: Record<string, unknown>;
  seed: number | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Generation Serialization Domain Service
 * Handles conversion between domain entities and serialized data formats
 * Following Golden Rule DDD: Focused service under 250 lines
 */
export class GenerationSerializationService {
  
  /**
   * Convert generation entity to snapshot for storage/transport
   */
  static toSnapshot(generation: Generation): GenerationSnapshot {
    const data = generation.toData();
    
    return {
      id: data.id,
      organizationId: data.organizationId,
      userId: data.userId,
      prompt: data.prompt.toString(),
      modelName: data.modelName,
      providerName: data.providerName,
      status: data.status.value,
      resultImageUrl: data.resultImageUrl,
      baseImageUrl: data.baseImageUrl,
      secondImageUrl: data.secondImageUrl,
      externalProviderId: data.externalProviderId,
      costCents: data.costCents,
      generationTimeSeconds: data.generationTimeSeconds,
      imageWidth: data.imageWidth,
      imageHeight: data.imageHeight,
      aspectRatio: data.aspectRatio,
      editType: data.editType,
      savedToDAM: data.savedToDAM,
      damAssetId: data.damAssetId,
      sourceDamAssetId: data.sourceDamAssetId,
      errorMessage: data.errorMessage,
      metadata: data.metadata,
      seed: data.seed,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };
  }

  /**
   * Convert snapshot back to generation entity
   */
  static fromSnapshot(snapshot: GenerationSnapshot): Generation {
    const prompt = Prompt.create(snapshot.prompt);
    if (!prompt.isSuccess()) {
      throw new Error(`Invalid prompt in snapshot: ${prompt.getError()}`);
    }

    const generationData: GenerationData = {
      id: snapshot.id,
      organizationId: snapshot.organizationId,
      userId: snapshot.userId,
      prompt: prompt.getValue(),
      modelName: snapshot.modelName,
      providerName: snapshot.providerName,
      status: GenerationStatus.create(snapshot.status),
      resultImageUrl: snapshot.resultImageUrl,
      baseImageUrl: snapshot.baseImageUrl,
      secondImageUrl: snapshot.secondImageUrl,
      externalProviderId: snapshot.externalProviderId,
      costCents: snapshot.costCents,
      generationTimeSeconds: snapshot.generationTimeSeconds,
      imageWidth: snapshot.imageWidth,
      imageHeight: snapshot.imageHeight,
      aspectRatio: snapshot.aspectRatio,
      editType: snapshot.editType,
      savedToDAM: snapshot.savedToDAM,
      damAssetId: snapshot.damAssetId,
      sourceDamAssetId: snapshot.sourceDamAssetId,
      errorMessage: snapshot.errorMessage,
      metadata: snapshot.metadata,
      seed: snapshot.seed,
      createdAt: snapshot.createdAt,
      updatedAt: snapshot.updatedAt,
    };

    return Generation.fromData(generationData);
  }

  /**
   * Convert to minimal snapshot for performance-critical contexts
   */
  static toMinimalSnapshot(generation: Generation): Pick<GenerationSnapshot, 
    'id' | 'status' | 'resultImageUrl' | 'errorMessage' | 'updatedAt'> {
    return {
      id: generation.id,
      status: generation.status.value,
      resultImageUrl: generation.resultImageUrl,
      errorMessage: generation.errorMessage,
      updatedAt: generation.updatedAt
    };
  }

  /**
   * Validate snapshot data integrity
   */
  static validateSnapshot(snapshot: GenerationSnapshot): string[] {
    const errors: string[] = [];

    if (!snapshot.id?.trim()) {
      errors.push('Snapshot missing required ID');
    }

    if (!snapshot.organizationId?.trim()) {
      errors.push('Snapshot missing organization ID');
    }

    if (!snapshot.userId?.trim()) {
      errors.push('Snapshot missing user ID');
    }

    if (!snapshot.prompt?.trim()) {
      errors.push('Snapshot missing prompt');
    }

    if (!['pending', 'processing', 'completed', 'failed'].includes(snapshot.status)) {
      errors.push(`Invalid status: ${snapshot.status}`);
    }

    if (snapshot.status === 'completed' && !snapshot.resultImageUrl) {
      errors.push('Completed generation missing result image URL');
    }

    if (snapshot.status === 'failed' && !snapshot.errorMessage) {
      errors.push('Failed generation missing error message');
    }

    return errors;
  }

  /**
   * Create snapshot with only essential data for API responses
   */
  static toAPISnapshot(generation: Generation): Partial<GenerationSnapshot> {
    return {
      id: generation.id,
      status: generation.status.value,
      prompt: generation.prompt.toString(),
      modelName: generation.modelName,
      resultImageUrl: generation.resultImageUrl,
      errorMessage: generation.errorMessage,
      costCents: generation.costCents,
      generationTimeSeconds: generation.generationTimeSeconds,
      imageWidth: generation.imageWidth,
      imageHeight: generation.imageHeight,
      editType: generation.editType,
      savedToDAM: generation.savedToDAM,
      createdAt: generation.createdAt,
      updatedAt: generation.updatedAt
    };
  }
} 