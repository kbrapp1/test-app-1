'use server';

// Command Actions - DDD Application Layer
// Single Responsibility: Handle command-based operations for image generation
// Following CQRS pattern with proper error handling and domain isolation

import { commandBus } from '../../commands/CommandBus';
import { 
  GenerateImageCommand, 
  CancelGenerationCommand, 
  SaveGenerationToDAMCommand,
  DeleteGenerationCommand
} from '../../commands/GenerationCommands';
import { 
  GenerateImageRequest, 
  GenerateImageResponse, 
  CancelGenerationResponse, 
  SaveGenerationToDAMResponse,
  DeleteGenerationResponse,
  GetGenerationResponse,
  BatchGenerationResponse
} from '../shared/types';
import { getAuthContext } from '../shared/auth-context';
import { GenerationOrchestrationService } from '../../services/GenerationOrchestrationService';

/**
 * Generate Image Command Action
 * Orchestrates image generation request through command bus
 */
export async function generateImage(request: GenerateImageRequest): Promise<GenerateImageResponse> {
  try {
    const authResult = await getAuthContext();
    if (!authResult.success || !authResult.context) {
      return { success: false, error: authResult.error };
    }

    const { userId, organizationId } = authResult.context;

    const command: GenerateImageCommand = {
      commandId: crypto.randomUUID(),
      type: 'GenerateImage',
      userId,
      organizationId,
      timestamp: new Date(),
      prompt: request.prompt,
      imageWidth: request.width,
      imageHeight: request.height,
      aspectRatio: request.aspectRatio,
      safetyTolerance: request.safetyTolerance,
      providerId: request.providerId,
      modelId: request.modelId,
      baseImageUrl: request.baseImageUrl,
      secondImageUrl: request.secondImageUrl
    };

    const result = await commandBus.execute(command);
    return {
      success: result.success,
      data: result.data,
      error: result.error
    } as GenerateImageResponse;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Image generation failed'
    };
  }
}

/**
 * Cancel Generation Command Action
 * Handles generation cancellation through command bus
 */
export async function cancelGeneration(id: string): Promise<CancelGenerationResponse> {
  try {
    const authResult = await getAuthContext();
    if (!authResult.success || !authResult.context) {
      return { success: false, error: authResult.error };
    }

    const { userId, organizationId } = authResult.context;

    const command: CancelGenerationCommand = {
      commandId: crypto.randomUUID(),
      type: 'CancelGeneration',
      userId,
      organizationId,
      timestamp: new Date(),
      generationId: id
    };

    const result = await commandBus.execute(command);
    return {
      success: result.success,
      data: result.data,
      error: result.error
    } as CancelGenerationResponse;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Generation cancellation failed'
    };
  }
}

/**
 * Save Generation to DAM Command Action
 * Handles saving generation to digital asset management
 */
export async function saveGenerationToDAM(id: string): Promise<SaveGenerationToDAMResponse> {
  try {
    const authResult = await getAuthContext();
    if (!authResult.success || !authResult.context) {
      return { success: false, error: authResult.error };
    }

    const { userId, organizationId } = authResult.context;

    const command: SaveGenerationToDAMCommand = {
      commandId: crypto.randomUUID(),
      type: 'SaveGenerationToDAM',
      userId,
      organizationId,
      timestamp: new Date(),
      generationId: id
    };

    const result = await commandBus.execute(command);
    return {
      success: result.success,
      data: result.data,
      error: result.error
    } as SaveGenerationToDAMResponse;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Save to DAM failed'
    };
  }
}

/**
 * Delete Generation Command Action
 * Handles generation deletion through command bus
 */
export async function deleteGeneration(id: string): Promise<DeleteGenerationResponse> {
  try {
    const authResult = await getAuthContext();
    if (!authResult.success || !authResult.context) {
      return { success: false, error: authResult.error };
    }

    const { userId, organizationId } = authResult.context;

    const command: DeleteGenerationCommand = {
      commandId: crypto.randomUUID(),
      type: 'DeleteGeneration',
      userId,
      organizationId,
      timestamp: new Date(),
      generationId: id
    };

    const result = await commandBus.execute(command);
    return {
      success: result.success,
      data: result.data,
      error: result.error
    } as DeleteGenerationResponse;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Generation deletion failed'
    };
  }
}

/**
 * Check Generation Status Action
 * Monitors generation progress and handles auto-save when completed
 */
export async function checkGenerationStatus(id: string): Promise<GetGenerationResponse> {
  try {
    const authResult = await getAuthContext();
    if (!authResult.success || !authResult.context) {
      return { success: false, error: authResult.error };
    }

    const statusService = GenerationOrchestrationService.getStatusService();
    return await statusService.checkGenerationStatus(id, authResult.context);
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Status check failed'
    };
  }
}

/**
 * Check Multiple Generation Status Action
 * Batch operation for efficient status checking of multiple generations
 */
export async function checkMultipleGenerationStatus(ids: string[]): Promise<BatchGenerationResponse> {
  try {
    const authResult = await getAuthContext();
    if (!authResult.success || !authResult.context) {
      return { success: false, error: authResult.error };
    }

    const statusService = GenerationOrchestrationService.getStatusService();
    return await statusService.checkMultipleGenerationStatus(ids, authResult.context);
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Batch status check failed'
    };
  }
}

