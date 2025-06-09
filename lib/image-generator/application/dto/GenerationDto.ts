// Application Layer DTOs - Used for data transfer between layers

export interface GenerationDto {
  id: string;
  prompt: string;
  imageUrl?: string;
  baseImageUrl?: string; // For image editing mode
  secondImageUrl?: string; // For multi-image generation models
  status: GenerationStatusDto;
  width: number;
  height: number;
  aspectRatio?: string;
  costCents: number;
  createdAt: string;
  updatedAt: string;
  generationTimeSeconds?: number;
  savedToDAM: boolean;
  replicateId?: string;
  errorMessage?: string;
  editType: GenerationTypeDto;
  damAssetId?: string; // ID of the base image asset from DAM
  modelName: string; // AI model used for generation
}

export type GenerationStatusDto = 
  | 'pending' 
  | 'processing' 
  | 'completed' 
  | 'failed' 
  | 'cancelled';

export type GenerationTypeDto = 
  | 'text-to-image'    // Generate new image from text
  | 'image-editing'    // Edit existing image with text
  | 'style-transfer'   // Change style while preserving content
  | 'background-swap'; // Change background only

export interface CreateGenerationDto {
  prompt: string;
  width?: number;
  height?: number;
  aspectRatio?: string;
  baseImageUrl?: string; // Base64 or URL for editing
  editType?: GenerationTypeDto;
  damAssetId?: string;
  seed?: number;
}

export interface UpdateGenerationDto {
  id: string;
  imageUrl?: string;
  status?: GenerationStatusDto;
  generationTimeSeconds?: number;
  errorMessage?: string;
}

export interface GenerationListDto {
  generations: GenerationDto[];
  totalCount: number;
  hasMore: boolean;
}

export interface GenerationStatsDto {
  totalGenerations: number;
  completedGenerations: number;
  failedGenerations: number;
  totalCostCents: number;
  avgGenerationTimeSeconds: number;
  savedToDAMCount: number;
  textToImageCount: number;
  imageEditingCount: number;
} 