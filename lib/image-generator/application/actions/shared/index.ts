// Shared utilities for image generation actions
// Following DDD Application Layer principles

export { getAuthContext } from './auth-context';
export type { AuthContext, AuthContextResult } from './auth-context';

export type {
  GenerateImageRequest,
  GenerateImageResponse,
  GetGenerationsResponse,
  GetGenerationResponse,
  GetGenerationStatsResponse,
  CancelGenerationResponse,
  SaveGenerationToDAMResponse
} from './types'; 