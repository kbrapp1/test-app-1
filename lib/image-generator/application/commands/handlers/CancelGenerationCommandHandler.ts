import { CancelGenerationCommand, CommandResult } from '../GenerationCommands';
import { GenerationDto } from '../../dto';
import { GenerationMapper } from '../../mappers/GenerationMapper';
import { getCancelGenerationUseCase } from '../../../presentation/hooks/shared/instances';

export class CancelGenerationCommandHandler {
  async handle(command: CancelGenerationCommand): Promise<CommandResult<GenerationDto>> {
    try {
      const result = await getCancelGenerationUseCase().execute(command.generationId);

      if (!result.isSuccess()) {
        return {
          success: false,
          error: result.getError() || 'Failed to cancel generation'
        };
      }

      const dto = GenerationMapper.toDto(result.getValue());
      return {
        success: true,
        data: dto
      };
    } catch (error) {
      console.error('Error in CancelGenerationCommandHandler:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }
} 