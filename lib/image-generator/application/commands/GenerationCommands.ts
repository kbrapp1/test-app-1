// Command Pattern for Write Operations
export interface Command {
  commandId: string;
  userId: string;
  organizationId: string;
  timestamp: Date;
}

export interface GenerateImageCommand extends Command {
  type: 'GenerateImage';
  prompt: string;
  imageWidth?: number;
  imageHeight?: number;
  aspectRatio?: string;
  modelName?: string;
  providerId?: string;
  modelId?: string;
  safetyTolerance?: number;
  baseImageUrl?: string;
  secondImageUrl?: string;
  metadata?: Record<string, any>;
}

export interface CancelGenerationCommand extends Command {
  type: 'CancelGeneration';
  generationId: string;
  reason?: string;
}

export interface SaveGenerationToDAMCommand extends Command {
  type: 'SaveGenerationToDAM';
  generationId: string;
  folderId?: string;
}

export interface UpdateGenerationCommand extends Command {
  type: 'UpdateGeneration';
  generationId: string;
  status?: string;
  imageUrl?: string;
  errorMessage?: string;
  generationTimeSeconds?: number;
}

export interface DeleteGenerationCommand extends Command {
  type: 'DeleteGeneration';
  generationId: string;
  reason?: string;
}

// Command Type Union
export type GenerationCommand = 
  | GenerateImageCommand
  | CancelGenerationCommand
  | SaveGenerationToDAMCommand
  | UpdateGenerationCommand
  | DeleteGenerationCommand;

// Command Result
export interface CommandResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  eventId?: string;
} 