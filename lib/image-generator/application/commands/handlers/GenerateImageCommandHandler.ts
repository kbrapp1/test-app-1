import { GenerateImageCommand, CommandResult } from '../GenerationCommands';
import { GenerationDto } from '../../dto';
import { GenerationMapper } from '../../mappers/GenerationMapper';
import { getGenerateImageUseCase } from '../../../presentation/hooks/shared/instances';

export class GenerateImageCommandHandler {
  async handle(command: GenerateImageCommand): Promise<CommandResult<GenerationDto>> {
    try {
      const result = await getGenerateImageUseCase().execute({
        prompt: command.prompt,
        width: command.imageWidth || 1024,
        height: command.imageHeight || 1024,
        aspectRatio: command.aspectRatio,
        organizationId: command.organizationId,
        userId: command.userId,
        safetyTolerance: command.safetyTolerance,
        providerId: command.providerId,
        modelId: command.modelId,
        baseImageUrl: command.baseImageUrl,
        secondImageUrl: command.secondImageUrl,
      });

      if (!result.isSuccess()) {
        return {
          success: false,
          error: result.getError() || 'Failed to generate image'
        };
      }

      const dto = GenerationMapper.toDto(result.getValue());
      return {
        success: true,
        data: dto
      };
    } catch (error) {
      console.error('Error in GenerateImageCommandHandler:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }
} 