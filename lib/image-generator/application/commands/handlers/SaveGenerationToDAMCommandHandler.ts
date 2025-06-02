import { SaveGenerationToDAMCommand, CommandResult } from '../GenerationCommands';
import { GenerationDto } from '../../dto';
import { GenerationMapper } from '../../mappers/GenerationMapper';
import { getSaveGenerationToDAMUseCase } from '../../../presentation/hooks/shared/instances';

export class SaveGenerationToDAMCommandHandler {
  async handle(command: SaveGenerationToDAMCommand): Promise<CommandResult<GenerationDto>> {
    try {
      const result = await getSaveGenerationToDAMUseCase().execute(command.generationId);

      if (!result.isSuccess()) {
        return {
          success: false,
          error: result.getError() || 'Failed to save generation to DAM'
        };
      }

      const dto = GenerationMapper.toDto(result.getValue());
      return {
        success: true,
        data: dto
      };
    } catch (error) {
      console.error('Error in SaveGenerationToDAMCommandHandler:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }
} 