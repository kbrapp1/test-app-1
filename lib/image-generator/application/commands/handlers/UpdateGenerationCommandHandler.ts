import { UpdateGenerationCommand, CommandResult } from '../GenerationCommands';
import { GenerationDto } from '../../dto';

export class UpdateGenerationCommandHandler {
  async handle(command: UpdateGenerationCommand): Promise<CommandResult<GenerationDto>> {
    // TODO: Implement when update generation use case is available
    return {
      success: false,
      error: 'UpdateGenerationCommandHandler not yet implemented'
    };
  }
} 