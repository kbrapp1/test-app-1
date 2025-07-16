// Generation Entity - DDD Domain Layer
// Single Responsibility: Core business object representing an AI image generation
// Following Golden Rule: Pure domain entity with identity, no external service dependencies

import { Prompt } from '../value-objects/Prompt';
import { GenerationStatus } from '../value-objects/GenerationStatus';
import { ImageDimensions } from '../value-objects/ImageDimensions';
import { GenerationCost } from '../value-objects/GenerationCost';
import { GenerationValidationService } from '../services/GenerationValidationService';

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
  secondImageUrl?: string | null;
  externalProviderId?: string | null;
  editType?: 'text-to-image' | 'image-editing' | 'style-transfer' | 'background-swap';
  damAssetId?: string;
  metadata?: Record<string, unknown>;
  seed?: number;
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
 * Generation Entity
 * Core domain entity representing an AI image generation request and its lifecycle
 * Following Golden Rule DDD: Pure entity with business rules, focused responsibility
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
  private _secondImageUrl: string | null;
  private _externalProviderId: string | null;
  private _cost: GenerationCost;
  private _generationTimeSeconds: number | null;
  private _dimensions: ImageDimensions;
  private _editType: 'text-to-image' | 'image-editing' | 'style-transfer' | 'background-swap';
  private _savedToDAM: boolean;
  private _damAssetId: string | null;
  private _sourceDamAssetId: string | null;
  private _errorMessage: string | null;
  private _metadata: Record<string, unknown>;
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
    this._secondImageUrl = data.secondImageUrl;
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
  get secondImageUrl(): string | null { return this._secondImageUrl; }
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
  get metadata(): Record<string, unknown> { return { ...this._metadata }; }
  get updatedAt(): Date { return this._updatedAt; }
  get seed(): number | null { return this._seed; }

  // Factory Method for Direct Data Construction
  static fromData(data: GenerationData): Generation {
    return new Generation(data);
  }

  // Core Business Operations - Pure Entity Methods
  updateStatus(status: GenerationStatus): void {
    GenerationValidationService.validateStatusTransition(this._status, status);
    this._status = status;
    this._updatedAt = new Date();
  }

  markAsCompleted(imageUrl: string, generationTime: number): void {
    this.updateStatus(GenerationStatus.completed());
    this._resultImageUrl = imageUrl;
    this._generationTimeSeconds = generationTime;
    this._updatedAt = new Date();
  }

  markAsFailed(errorMessage: string): void {
    this.updateStatus(GenerationStatus.failed());
    this._errorMessage = errorMessage;
    this._updatedAt = new Date();
  }

  markAsProcessing(): void {
    this.updateStatus(GenerationStatus.processing());
    this._updatedAt = new Date();
  }

  setExternalProviderId(providerId: string): void {
    GenerationValidationService.validateExternalProviderId(providerId);
    this._externalProviderId = providerId;
    this._updatedAt = new Date();
  }

  setAutoSavedImageUrl(permanentUrl: string): void {
    GenerationValidationService.validatePermanentUrl(permanentUrl);
    this._resultImageUrl = permanentUrl;
    this._updatedAt = new Date(Date.now() + 1);
  }

  linkToDAMAsset(assetId: string): void {
    GenerationValidationService.validateDAMLinking(this);
    this._damAssetId = assetId;
    this._savedToDAM = true;
    this._updatedAt = new Date();
  }

  // Simple Business Rules - Core Entity Queries
  isCompleted(): boolean { 
    return this._status.value === 'completed'; 
  }
  
  isFailed(): boolean { 
    return this._status.value === 'failed'; 
  }
  
  isPending(): boolean { 
    return this._status.value === 'pending'; 
  }
  
  isProcessing(): boolean { 
    return this._status.value === 'processing'; 
  }
  
  canSaveToDAM(): boolean {
    return GenerationValidationService.canSaveToDAM(this);
  }

  isEditingMode(): boolean {
    return GenerationValidationService.isEditingMode(this);
  }

  hasBaseImage(): boolean {
    return GenerationValidationService.hasBaseImage(this);
  }

  // Data Export for Persistence Layer
  toData(): GenerationData {
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
      secondImageUrl: this._secondImageUrl,
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

  // Legacy Support Methods - Will be deprecated
  getId(): string { return this.id; }
  getStatus(): GenerationStatus { return this._status; }
  getCostCents(): number { return this._cost.cents; }
  getGenerationTimeSeconds(): number | null { return this._generationTimeSeconds; }
  isSavedToDAM(): boolean { return this._savedToDAM; }
} 