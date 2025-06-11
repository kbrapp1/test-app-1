/**
 * Update Knowledge Base Command Handler
 * 
 * CQRS Command Handler that processes knowledge base update commands.
 * Delegates to the Configure Chatbot Use Case for business logic execution.
 * 
 * Single Responsibility: Handle UpdateKnowledgeBaseCommand processing
 */

import { UpdateKnowledgeBaseCommand, UpdateKnowledgeBaseResult } from '../UpdateKnowledgeBaseCommand';
import { ConfigureChatbotUseCase } from '../../use-cases/ConfigureChatbotUseCase';

export class UpdateKnowledgeBaseHandler {
  constructor(
    private readonly configureChatbotUseCase: ConfigureChatbotUseCase
  ) {}

  /**
   * Handle the update knowledge base command
   */
  async handle(command: UpdateKnowledgeBaseCommand): Promise<UpdateKnowledgeBaseResult> {
    try {
      // Delegate to Use Case for business logic
      const result = await this.configureChatbotUseCase.updateConfiguration(
        command.configId,
        {
          knowledgeBase: command.knowledgeBase
        }
      );

      return {
        configId: result.chatbotConfig.id,
        success: true,
        knowledgeBaseScore: result.validationResults.knowledgeBaseScore,
        recommendations: result.validationResults.recommendations,
        warnings: result.validationResults.warnings
      };
    } catch (error) {
      // Re-throw with context for upper layers to handle
      throw new Error(`Failed to update knowledge base: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
} 