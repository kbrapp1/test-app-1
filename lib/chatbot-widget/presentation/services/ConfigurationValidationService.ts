/**
 * Configuration Validation Service
 * 
 * AI INSTRUCTIONS:
 * - Handles validation logic for chatbot configurations
 * - Pure validation functions without side effects
 * - Focused on presentation layer validation rules
 * - Reusable across different components
 */

import {
  CreateChatbotConfigDto,
  UpdateChatbotConfigDto
} from '../../application/dto/ChatbotConfigDto';
import { BotConfigurationFormData } from '../types/BotConfigurationTypes';

export interface ConfigValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

export class ConfigurationValidationService {
  static validateConfig(config: Partial<CreateChatbotConfigDto | UpdateChatbotConfigDto>): ConfigValidationResult {
    const errors: Record<string, string> = {};

    if ('name' in config) {
      if (!config.name || config.name.trim().length === 0) {
        errors.name = 'Bot name is required';
      } else if (config.name.length > 100) {
        errors.name = 'Bot name must be less than 100 characters';
      }
    }

    if (config.personalitySettings?.conversationFlow?.greetingMessage) {
      const greeting = config.personalitySettings.conversationFlow.greetingMessage;
      if (greeting.length > 500) {
        errors.greetingMessage = 'Greeting message must be less than 500 characters';
      }
    }

    if (config.knowledgeBase?.companyInfo) {
      const companyInfo = config.knowledgeBase.companyInfo;
      if (companyInfo.length > 5000) {
        errors.companyInfo = 'Company info must be less than 5000 characters';
      }
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    };
  }

  static validateFormData(formData: BotConfigurationFormData): ConfigValidationResult {
    const errors: Record<string, string> = {};

    if (!formData.name || formData.name.trim().length === 0) {
      errors.name = 'Bot name is required';
    } else if (formData.name.length > 100) {
      errors.name = 'Bot name must be less than 100 characters';
    }

    if (formData.description && formData.description.length > 500) {
      errors.description = 'Description must be less than 500 characters';
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    };
  }
}