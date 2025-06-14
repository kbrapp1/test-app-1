/**
 * Create Chatbot Config Command
 * 
 * CQRS Command for creating new chatbot configurations.
 * Represents a write operation request with all necessary data.
 * 
 * Single Responsibility: Encapsulate chatbot creation request data
 */

import { LeadQualificationQuestion } from '../../domain/entities/ChatbotConfig';
import { PersonalitySettings } from '../../domain/value-objects/PersonalitySettings';
import { KnowledgeBase } from '../../domain/value-objects/KnowledgeBase';
import { OperatingHours } from '../../domain/value-objects/OperatingHours';

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