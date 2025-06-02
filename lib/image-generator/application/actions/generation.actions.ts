// Image Generation Actions - DDD Application Layer
// Single Responsibility: Aggregate and expose image generation actions for presentation layer
// Following CQRS pattern with clear command/query separation

// Command Actions (Write Operations)
export { 
  generateImage, 
  cancelGeneration, 
  saveGenerationToDAM,
  checkGenerationStatus
} from './commands/command-actions';

// Query Actions (Read Operations)  
export { 
  getGenerations, 
  getGeneration, 
  getGenerationStats 
} from './queries/query-actions';

// DTOs for Layer Boundaries
export type {
  GenerateImageRequest,
  GenerateImageResponse,
  GetGenerationsResponse,
  GetGenerationResponse,
  GetGenerationStatsResponse,
  CancelGenerationResponse,
  SaveGenerationToDAMResponse,
  BatchGenerationResponse
} from './shared/types'; 