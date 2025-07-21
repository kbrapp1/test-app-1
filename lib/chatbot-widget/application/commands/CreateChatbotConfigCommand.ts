// Create Chatbot Config Command
//
// AI INSTRUCTIONS:
// - CQRS command for chatbot configuration creation with complete domain data
// - Pure data container following command pattern with no business logic

import { LeadQualificationQuestion } from '../../domain/entities/ChatbotConfig';
import { PersonalitySettings } from '../../domain/value-objects/ai-configuration/PersonalitySettings';
import { KnowledgeBase } from '../../domain/value-objects/ai-configuration/KnowledgeBase';
import { OperatingHours } from '../../domain/value-objects/session-management/OperatingHours';

export interface CreateChatbotConfigCommand {
  organizationId: string;
  name: string;
  description?: string;
  avatarUrl?: string;
  personalitySettings: PersonalitySettings;
  knowledgeBase: KnowledgeBase;
  operatingHours: OperatingHours;
  leadQualificationQuestions: LeadQualificationQuestion[];
  isActive?: boolean;
}

export interface CreateChatbotConfigResult {
  configId: string;
  success: boolean;
  validationResults: {
    knowledgeBaseScore: number;
    configurationCompleteness: number;
    recommendations: string[];
    warnings: string[];
  };
} 