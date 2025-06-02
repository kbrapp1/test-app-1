import { GenerationDto, GenerationStatsDto } from '../../dto';

// Request/Response interfaces for image generation actions
// Following DDD Application Service pattern

export interface GenerateImageRequest {
  prompt: string;
  width?: number;
  height?: number;
  safetyTolerance?: number;
  providerId?: string;
  modelId?: string;
}

export interface GenerateImageWithProviderRequest {
  prompt: string;
  providerId: string;
  modelName: string;
  width?: number;
  height?: number;
  safetyTolerance?: number;
  style?: string;
  goFast?: boolean;
  imageToEdit?: string; // Base64 encoded image
}

export interface GenerateImageResponse {
  success: boolean;
  data?: GenerationDto;
  error?: string;
}

export interface GetGenerationsResponse {
  success: boolean;
  data?: GenerationDto[];
  error?: string;
}

export interface GetGenerationResponse {
  success: boolean;
  data?: GenerationDto;
  error?: string;
}

export interface BatchGenerationResponse {
  success: boolean;
  data?: GenerationDto[];
  errors?: { id: string; error: string }[];
  error?: string;
}

export interface GetGenerationStatsResponse {
  success: boolean;
  data?: GenerationStatsDto;
  error?: string;
}

export interface CancelGenerationResponse {
  success: boolean;
  data?: GenerationDto;
  error?: string;
}

export interface SaveGenerationToDAMResponse {
  success: boolean;
  data?: GenerationDto;
  error?: string;
} 