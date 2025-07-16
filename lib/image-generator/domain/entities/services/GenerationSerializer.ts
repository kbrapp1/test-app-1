import { Prompt } from '../../value-objects/Prompt';
import { GenerationStatus } from '../../value-objects/GenerationStatus';

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
  externalProviderId: string | null; // 🆕 Generic provider tracking ID
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

export interface GenerationData {
  id: string;
  organizationId: string;
  userId: string;
  prompt: Prompt;
  modelName: string;
  providerName: string;
  status: GenerationStatus;
  resultImageUrl: string | null;
  baseImageUrl: string | null;
  secondImageUrl: string | null;
  externalProviderId: string | null; // 🆕 Generic provider tracking ID
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

export class GenerationSerializer {
  static toSnapshot(data: GenerationData): GenerationSnapshot {
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

  static fromSnapshot(snapshot: GenerationSnapshot): GenerationData {
    const prompt = Prompt.create(snapshot.prompt);
    if (!prompt.isSuccess()) {
      throw new Error(`Invalid prompt in snapshot: ${prompt.getError()}`);
    }

    return {
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
  }
} 