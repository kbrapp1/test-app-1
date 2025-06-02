import { GenerationStatsDto } from '../../../application/dto';

// Shared interfaces for image generation hooks
export interface GenerateImageRequest {
  prompt: string;
  width?: number;
  height?: number;
}

export interface GetGenerationsFilters {
  status?: string;
  limit?: number;
  offset?: number;
  startDate?: Date;
  endDate?: Date;
}

// Re-export DTO type for external use
export type GenerationStats = GenerationStatsDto; 