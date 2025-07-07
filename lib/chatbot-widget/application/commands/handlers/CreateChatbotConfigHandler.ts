/**
 * Create Chatbot Config Command Handler
 * 
 * AI INSTRUCTIONS:
 * - CQRS Command Handler processing chatbot configuration creation commands with clean delegation
 * - Coordinates between command layer and use case layer following hexagonal architecture patterns
 * - Handles command validation, use case orchestration, and structured result transformation
 * - Implements proper error handling with contextual information for debugging and monitoring
 * - Maintains separation of concerns between command processing and business logic execution
 */

import { CreateChatbotConfigCommand, CreateChatbotConfigResult } from '../CreateChatbotConfigCommand';
import { ConfigureChatbotUseCase } from '../../use-cases/ConfigureChatbotUseCase';

export class CreateChatbotConfigHandler {
  constructor(
    private readonly configureChatbotUseCase: ConfigureChatbotUseCase
  ) {}

  // Handle the create chatbot config command
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
      // Re-throw with context
      throw new Error(`Failed to create chatbot config: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
} 