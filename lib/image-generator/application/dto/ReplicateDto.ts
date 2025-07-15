// External API DTOs - Used for communication with Replicate API

export interface ReplicateGenerationRequestDto {
  prompt: string;
  width: number;
  height: number;
  model: string;
  webhook?: string;
}

export interface ReplicateGenerationResponseDto {
  id: string;
  status: ReplicateStatusDto;
  input: {
    prompt: string;
    width: number;
    height: number;
  };
  output?: string[];
  error?: string;
  created_at: string;
  started_at?: string;
  completed_at?: string;
  urls: {
    get: string;
    cancel: string;
  };
}

export type ReplicateStatusDto = 
  | 'starting' 
  | 'processing' 
  | 'succeeded' 
  | 'failed' 
  | 'canceled';

export interface ReplicatePredictionDto {
  id: string;
  status: ReplicateStatusDto;
  input: Record<string, unknown>;
  output?: unknown;
  error?: string;
  created_at: string;
  started_at?: string;
  completed_at?: string;
}

export interface ReplicateErrorDto {
  detail: string;
  type: string;
  title: string;
} 