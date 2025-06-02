// Generation Entity - DDD Domain Layer
// Single Responsibility: Core business object representing an AI image generation
// Pure domain entity with identity, following DDD entity principles

import { Prompt } from '../value-objects/Prompt';
import { GenerationStatus } from '../value-objects/GenerationStatus';
import { ImageDimensions } from '../value-objects/ImageDimensions';
import { GenerationCost } from '../value-objects/GenerationCost';
import { GenerationDisplayService } from './services/GenerationDisplayService';
import { DAMIntegrationService } from './services/DAMIntegrationService';
import { GenerationLifecycle } from '../services/GenerationLifecycle';
import { 
  GenerationSerializer, 
  type GenerationSnapshot, 
  type GenerationData 
} from './services/GenerationSerializer';

export interface CreateGenerationData {
  organizationId: string;
  userId: string;
  prompt: string;
  modelName: string;
  providerName: string;
  imageWidth?: number;
  imageHeight?: number;
  aspectRatio?: string;
  baseImageUrl?: string | null;
  externalProviderId?: string | null;
  editType?: 'text-to-image' | 'image-editing' | 'style-transfer' | 'background-swap';
  damAssetId?: string;
  metadata?: Record<string, any>;
  seed?: number;
}

/**
 * Generation Entity
 * Core domain entity representing an AI image generation request and its lifecycle
 * Maintains identity and encapsulates generation business rules following DDD principles
 */
export class Generation {
  public readonly id: string;
  public readonly organizationId: string;
  public readonly userId: string;
  public readonly prompt: Prompt;
  public readonly modelName: string;
  public readonly providerName: string;
  public readonly createdAt: Date;
  
  private _status: GenerationStatus;
  private _resultImageUrl: string | null;
  private _baseImageUrl: string | null;
  private _externalProviderId: string | null;
  private _cost: GenerationCost;
  private _generationTimeSeconds: number | null;
  private _dimensions: ImageDimensions;
  private _editType: 'text-to-image' | 'image-editing' | 'style-transfer' | 'background-swap';
  private _savedToDAM: boolean;
  private _damAssetId: string | null;
  private _sourceDamAssetId: string | null;
  private _errorMessage: string | null;
  private _metadata: Record<string, any>;
  private _updatedAt: Date;
  private _seed: number | null;

  private constructor(data: GenerationData) {
    this.id = data.id;
    this.organizationId = data.organizationId;
    this.userId = data.userId;
    this.prompt = data.prompt;
    this.modelName = data.modelName;
    this.providerName = data.providerName;
    this.createdAt = data.createdAt;
    
    this._status = data.status;
    this._resultImageUrl = data.resultImageUrl;
    this._baseImageUrl = data.baseImageUrl;
    this._externalProviderId = data.externalProviderId || null;
    this._cost = GenerationCost.fromCents(data.costCents, data.modelName);
    this._generationTimeSeconds = data.generationTimeSeconds;
    this._dimensions = ImageDimensions.create(data.imageWidth, data.imageHeight, data.aspectRatio);
    this._editType = data.editType;
    this._savedToDAM = data.savedToDAM;
    this._damAssetId = data.damAssetId;
    this._sourceDamAssetId = data.sourceDamAssetId;
    this._errorMessage = data.errorMessage;
    this._metadata = data.metadata;
    this._updatedAt = data.updatedAt;
    this._seed = data.seed;
  }

  // Core Properties - DDD Entity Identity and Value Access
  get status(): GenerationStatus { return this._status; }
  get resultImageUrl(): string | null { return this._resultImageUrl; }
  get baseImageUrl(): string | null { return this._baseImageUrl; }
  get externalProviderId(): string | null { return this._externalProviderId; }
  get costCents(): number { return this._cost.cents; }
  get generationTimeSeconds(): number | null { return this._generationTimeSeconds; }
  get imageWidth(): number { return this._dimensions.width; }
  get imageHeight(): number { return this._dimensions.height; }
  get aspectRatio(): string { return this._dimensions.aspectRatio; }
  get editType(): 'text-to-image' | 'image-editing' | 'style-transfer' | 'background-swap' { return this._editType; }
  get savedToDAM(): boolean { return this._savedToDAM; }
  get damAssetId(): string | null { return this._damAssetId; }
  get sourceDamAssetId(): string | null { return this._sourceDamAssetId; }
  get errorMessage(): string | null { return this._errorMessage; }
  get metadata(): Record<string, any> { return { ...this._metadata }; }
  get updatedAt(): Date { return this._updatedAt; }
  get seed(): number | null { return this._seed; }

  // Factory Method for Direct Data Construction (used by GenerationFactory)
  static fromData(data: GenerationData): Generation {
    return new Generation(data);
  }

  // Business Logic - Delegated to Domain Services
  updateStatus(status: GenerationStatus): void {
    GenerationLifecycle.updateStatus(this, status);
  }

  markAsCompleted(imageUrl: string, generationTime: number): void {
    GenerationLifecycle.markAsCompleted(this, imageUrl, generationTime);
  }

  markAsFailed(errorMessage: string): void {
    GenerationLifecycle.markAsFailed(this, errorMessage);
  }

  markAsProcessing(): void {
    GenerationLifecycle.markAsProcessing(this);
  }

  setExternalProviderId(providerId: string): void {
    GenerationLifecycle.setExternalProviderId(this, providerId);
  }

  setAutoSavedImageUrl(permanentUrl: string): void {
    GenerationLifecycle.setAutoSavedImageUrl(this, permanentUrl);
  }

  getAutoSaveStoragePath(): string {
    return `${this.organizationId}/${this.userId}/ai-generations/${this.id}.webp`;
  }

  // DAM Integration
  linkToDAMAsset(assetId: string): void {
    DAMIntegrationService.validateDAMSave(
      this.isCompleted(), 
      this._savedToDAM, 
      this._resultImageUrl
    );
    this._damAssetId = assetId;
    this._savedToDAM = true;
    this._updatedAt = new Date();
  }

  // Business Rules - Domain Logic Queries
  isCompleted(): boolean { return this._status.value === 'completed'; }
  isFailed(): boolean { return this._status.value === 'failed'; }
  isPending(): boolean { return this._status.value === 'pending'; }
  isProcessing(): boolean { return this._status.value === 'processing'; }
  
  canSaveToDAM(): boolean {
    return DAMIntegrationService.canSaveToDAM(
      this.isCompleted(), 
      this._savedToDAM, 
      this._resultImageUrl
    );
  }

  isEditingMode(): boolean {
    return this._editType !== 'text-to-image';
  }

  hasBaseImage(): boolean {
    return !!this._baseImageUrl;
  }

  // Display Operations - Delegated to Domain Services
  getDisplayTitle(): string {
    return GenerationDisplayService.getDisplayTitle(this.prompt);
  }

  getDurationString(): string {
    return GenerationDisplayService.getDurationString(this._generationTimeSeconds);
  }

  getCostDisplay(): string {
    return this._cost.toDisplayString();
  }

  calculateEstimatedCost(): number {
    return this._cost.cents;
  }

  // Serialization - Using Domain Services
  toSnapshot(): GenerationSnapshot {
    return GenerationSerializer.toSnapshot(this.toGenerationData());
  }

  static fromSnapshot(snapshot: GenerationSnapshot): Generation {
    const generationData = GenerationSerializer.fromSnapshot(snapshot);
    return new Generation(generationData);
  }

  private toGenerationData(): GenerationData {
    return {
      id: this.id,
      organizationId: this.organizationId,
      userId: this.userId,
      prompt: this.prompt,
      modelName: this.modelName,
      providerName: this.providerName,
      status: this._status,
      resultImageUrl: this._resultImageUrl,
      baseImageUrl: this._baseImageUrl,
      externalProviderId: this._externalProviderId,
      costCents: this._cost.cents,
      generationTimeSeconds: this._generationTimeSeconds,
      imageWidth: this._dimensions.width,
      imageHeight: this._dimensions.height,
      aspectRatio: this._dimensions.aspectRatio,
      editType: this._editType,
      savedToDAM: this._savedToDAM,
      damAssetId: this._damAssetId,
      sourceDamAssetId: this._sourceDamAssetId,
      errorMessage: this._errorMessage,
      metadata: this._metadata,
      seed: this._seed,
      createdAt: this.createdAt,
      updatedAt: this._updatedAt,
    };
  }

  // Legacy Methods - Backward Compatibility
  getId(): string { return this.id; }
  getStatus(): GenerationStatus { return this._status; }
  getCostCents(): number { return this._cost.cents; }
  getGenerationTimeSeconds(): number | null { return this._generationTimeSeconds; }
  isSavedToDAM(): boolean { return this._savedToDAM; }
}

export type { GenerationSnapshot }; 