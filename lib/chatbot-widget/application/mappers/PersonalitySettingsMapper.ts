/**
 * Personality Settings Mapper
 * 
 * AI INSTRUCTIONS:
 * - Handles bidirectional mapping between PersonalitySettings domain value objects and DTOs
 * - Maintains conversation flow, response behavior, and tone configuration integrity
 * - Supports DDD principle: Clean transformation boundaries with no business logic
 * - Ensures type safety during personality configuration transformations
 */

import { PersonalitySettings } from '../../domain/value-objects/ai-configuration/PersonalitySettings';
import { PersonalitySettingsDto } from '../dto/ChatbotConfigDto';

export class PersonalitySettingsMapper {
  static toDto(personality: PersonalitySettings): PersonalitySettingsDto {
    return {
      tone: personality.tone,
      communicationStyle: personality.communicationStyle,
      responseLength: personality.responseLength,
      escalationTriggers: personality.escalationTriggers,
      responseBehavior: {
        useEmojis: personality.responseBehavior.useEmojis,
        askFollowUpQuestions: personality.responseBehavior.askFollowUpQuestions,
        proactiveOffering: personality.responseBehavior.proactiveOffering,
        personalizeResponses: personality.responseBehavior.personalizeResponses,
        acknowledgePreviousInteractions: personality.responseBehavior.acknowledgePreviousInteractions,
      },
      conversationFlow: {
        greetingMessage: personality.conversationFlow.greetingMessage,
        fallbackMessage: personality.conversationFlow.fallbackMessage,
        escalationMessage: personality.conversationFlow.escalationMessage,
        endConversationMessage: personality.conversationFlow.endConversationMessage,
        leadCapturePrompt: personality.conversationFlow.leadCapturePrompt,
        maxConversationTurns: personality.conversationFlow.maxConversationTurns,
        inactivityTimeout: personality.conversationFlow.inactivityTimeout,
      },
      customInstructions: personality.customInstructions,
    };
  }

  static fromDto(dto: PersonalitySettingsDto): PersonalitySettings {
    return PersonalitySettings.create({
      tone: dto.tone as 'professional' | 'friendly' | 'casual' | 'formal',
      communicationStyle: dto.communicationStyle as 'direct' | 'conversational' | 'helpful' | 'sales-focused',
      responseLength: dto.responseLength as 'brief' | 'detailed' | 'adaptive',
      escalationTriggers: dto.escalationTriggers,
      responseBehavior: dto.responseBehavior,
      conversationFlow: dto.conversationFlow,
      customInstructions: dto.customInstructions,
    });
  }
}
