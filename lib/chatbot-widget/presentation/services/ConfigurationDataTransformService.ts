/**
 * Configuration Data Transform Service
 * 
 * AI INSTRUCTIONS:
 * - Handles data transformation between form data and DTOs
 * - Pure transformation functions for presentation layer
 */

import {
  CreateChatbotConfigDto,
  UpdateChatbotConfigDto
} from '../../application/dto/ChatbotConfigDto';
import { BotConfigurationFormData } from '../types/BotConfigurationTypes';

export class ConfigurationDataTransformService {
  static transformToDto(formData: BotConfigurationFormData) {
    return {
      personalitySettings: {
        tone: formData.personality,
        communicationStyle: 'professional' as const,
        responseLength: 'medium' as const,
        escalationTriggers: [],
        responseBehavior: {
          useEmojis: false,
          askFollowUpQuestions: true,
          proactiveOffering: true,
          personalizeResponses: true,
          acknowledgePreviousInteractions: true,
        },
        conversationFlow: {
          greetingMessage: 'Hello! How can I help you today?',
          fallbackMessage: 'I\'m not sure about that. Could you rephrase your question?',
          escalationMessage: 'Let me connect you with a team member.',
          endConversationMessage: 'Thank you for chatting with us!',
          leadCapturePrompt: 'Can I get your contact information to follow up?',
          maxConversationTurns: 20,
          inactivityTimeout: 300,
        },
        customInstructions: '',
      },
      operatingHours: {
        timezone: formData.operatingHours.timezone,
        businessHours: [],
        holidaySchedule: [],
        outsideHoursMessage: 'We\'re currently offline. Please leave a message!',
      },
    };
  }

  static createCreateDto(
    formData: BotConfigurationFormData,
    organizationId: string
  ): CreateChatbotConfigDto {
    const baseDto = this.transformToDto(formData);
    
    return {
      organizationId,
      name: formData.name,
      description: formData.description,
      knowledgeBase: {
        companyInfo: '',
        productCatalog: '',
        faqs: [],
        supportDocs: '',
        complianceGuidelines: '',
        websiteSources: [],
      },
      leadQualificationQuestions: [],
      ...baseDto,
    };
  }

  static createUpdateDto(formData: BotConfigurationFormData): UpdateChatbotConfigDto {
    const baseDto = this.transformToDto(formData);
    
    return {
      name: formData.name,
      description: formData.description,
      isActive: formData.isActive,
      ...baseDto,
    };
  }
}