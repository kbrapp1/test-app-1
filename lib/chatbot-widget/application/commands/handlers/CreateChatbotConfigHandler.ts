/**
 * Create Chatbot Config Command Handler
 * 
 * CQRS Command Handler that processes chatbot configuration creation commands.
 * Delegates to the Configure Chatbot Use Case for business logic execution.
 * 
 * Single Responsibility: Handle CreateChatbotConfigCommand processing
 */

import { CreateChatbotConfigCommand, CreateChatbotConfigResult } from '../CreateChatbotConfigCommand';
import { ConfigureChatbotUseCase } from '../../use-cases/ConfigureChatbotUseCase';

export class CreateChatbotConfigHandler {
  constructor(
    private readonly configureChatbotUseCase: ConfigureChatbotUseCase
  ) {}

  /**
   * Handle the create chatbot config command
   */
  async handle(command: CreateChatbotConfigCommand): Promise<CreateChatbotConfigResult> {
    try {
      // Delegate to Use Case for business logic
      const result = await this.configureChatbotUseCase.execute({
        organizationId: command.organizationId,
        name: command.name,
        description: command.description,
        avatarUrl: command.avatarUrl,
        personalitySettings: command.personalitySettings,
        knowledgeBase: command.knowledgeBase,
        operatingHours: command.operatingHours,
        leadQualificationQuestions: command.leadQualificationQuestions,
        isActive: command.isActive
      });

      return {
        configId: result.chatbotConfig.id,
        success: true,
        validationResults: result.validationResults
      };
    } catch (error) {
      // Re-throw with context for upper layers to handle
      throw new Error(`Failed to create chatbot config: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
} 