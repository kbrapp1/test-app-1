import { DeleteGenerationCommand, CommandResult } from '../GenerationCommands';
import { getDeleteGenerationUseCase } from '../../../presentation/hooks/shared/instances';

export class DeleteGenerationCommandHandler {
  async handle(command: DeleteGenerationCommand): Promise<CommandResult<boolean>> {
    try {
      const result = await getDeleteGenerationUseCase().execute(command.generationId);

      if (!result.isSuccess()) {
        return {
          success: false,
          error: result.getError() || 'Failed to delete generation'
        };
      }

      return {
        success: true,
        data: true
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }
} 