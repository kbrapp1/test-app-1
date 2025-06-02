import { GenerationCommand, CommandResult } from './GenerationCommands';
import { GenerateImageCommandHandler } from './handlers/GenerateImageCommandHandler';
import { CancelGenerationCommandHandler } from './handlers/CancelGenerationCommandHandler';
import { SaveGenerationToDAMCommandHandler } from './handlers/SaveGenerationToDAMCommandHandler';
import { UpdateGenerationCommandHandler } from './handlers/UpdateGenerationCommandHandler';

export class CommandBus {
  private generateImageHandler = new GenerateImageCommandHandler();
  private cancelGenerationHandler = new CancelGenerationCommandHandler();
  private saveGenerationToDAMHandler = new SaveGenerationToDAMCommandHandler();
  private updateGenerationHandler = new UpdateGenerationCommandHandler();

  async execute(command: GenerationCommand): Promise<CommandResult> {
    switch (command.type) {
      case 'GenerateImage':
        return await this.generateImageHandler.handle(command);
      
      case 'CancelGeneration':
        return await this.cancelGenerationHandler.handle(command);
      
      case 'SaveGenerationToDAM':
        return await this.saveGenerationToDAMHandler.handle(command);
      
      case 'UpdateGeneration':
        return await this.updateGenerationHandler.handle(command);
      
      default:
        return {
          success: false,
          error: `Unknown command type: ${(command as any).type}`
        };
    }
  }
}

// Singleton instance
export const commandBus = new CommandBus(); 