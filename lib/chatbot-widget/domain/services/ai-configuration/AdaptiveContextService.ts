import { ChatSession } from '../../entities/ChatSession';
import { ChatbotConfig } from '../../entities/ChatbotConfig';
import { ConversationAnalysis } from './ConversationAnalysisService';

/**
 * Adaptive Context Domain Service
 * 
 * AI INSTRUCTIONS:
 * - Generate adaptive context based on real-time session data
 * - Maintain single responsibility for context adaptation
 * - Keep business logic pure, no external dependencies
 * - Follow @golden-rule patterns exactly
 * - Delegate context building to separate methods
 * - Provide real-time context awareness
 */
export class AdaptiveContextService {

  /**
   * Adaptive context injection (2025 real-time)
   */
  generateAdaptiveContext(
    session: ChatSession, 
    analysis: ConversationAnalysis, 
    chatbotConfig: ChatbotConfig
  ): string {
    const currentTime = new Date();
    const businessHours = chatbotConfig.isWithinOperatingHours(currentTime);
    
    const contextData = {
      phase: analysis.phase,
      businessHours,
      businessContext: analysis.businessContext
    };

    return this.buildAdaptiveContextString(contextData);
  }

  /**
   * Build adaptive context string
   */
  private buildAdaptiveContextString(contextData: ContextData): string {
    const currentContextSection = this.buildCurrentContextSection(contextData);
    const instructionsSection = this.buildInstructionsSection(contextData);

    return `${currentContextSection}${instructionsSection}`;
  }

  /**
   * Build current context section
   */
  private buildCurrentContextSection(contextData: ContextData): string {
    const responsePriority = contextData.businessContext ? 'High - Business inquiry' : 'Standard';
    
    return `
## Current Context
- **Conversation Phase**: ${contextData.phase}
- **Business Hours**: ${contextData.businessHours ? 'Active' : 'After hours'}
- **Response Priority**: ${responsePriority}

`;
  }

  /**
   * Build instructions section
   */
  private buildInstructionsSection(contextData: ContextData): string {
    const availabilityMessage = contextData.businessHours 
      ? 'Offer immediate assistance and next steps' 
      : 'Acknowledge 24/7 availability and provide assistance';

    return `## Instructions
- Maintain professional tone aligned with business context
- ${availabilityMessage}
- Focus on value-driven conversation and strategic insights

`;
  }
}

// Type definitions
interface ContextData {
  phase: string;
  businessHours: boolean;
  businessContext: boolean;
} 