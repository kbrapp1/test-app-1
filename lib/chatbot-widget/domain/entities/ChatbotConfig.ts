// Chatbot Configuration Entity
//
// AI INSTRUCTIONS:
// - Core domain entity representing complete chatbot configuration with business logic
// - Coordinates value objects and delegates complex operations to domain services

import { PersonalitySettings } from '../value-objects/ai-configuration/PersonalitySettings';
import { KnowledgeBase } from '../value-objects/ai-configuration/KnowledgeBase';
import { OperatingHours } from '../value-objects/session-management/OperatingHours';
import { AIConfiguration } from '../value-objects/ai-configuration/AIConfiguration';

export interface ChatbotConfigProps {
  id: string;
  organizationId: string;
  name: string;
  avatarUrl?: string;
  description?: string;
  personalitySettings: PersonalitySettings;
  knowledgeBase: KnowledgeBase;
  operatingHours: OperatingHours;
  leadQualificationQuestions: LeadQualificationQuestion[];
  aiConfiguration: AIConfiguration;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface LeadQualificationQuestion {
  id: string;
  question: string;
  type: 'text' | 'email' | 'phone' | 'select' | 'multiselect';
  options?: string[];
  isRequired: boolean;
  order: number;
  scoringWeight: number;
}

export class ChatbotConfig {
  private constructor(private readonly props: ChatbotConfigProps) {
    this.validateProps(props);
  }

  static create(props: Omit<ChatbotConfigProps, 'id' | 'createdAt' | 'updatedAt' | 'aiConfiguration'> & { aiConfiguration?: AIConfiguration }): ChatbotConfig {
    const now = new Date();
    return new ChatbotConfig({
      ...props,
      aiConfiguration: props.aiConfiguration || this.getDefaultAIConfiguration(),
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
    });
  }

  static fromPersistence(props: ChatbotConfigProps): ChatbotConfig {
    // Apply default AI configuration if needed
    const propsWithAI = {
      ...props,
      aiConfiguration: props.aiConfiguration || this.getDefaultAIConfiguration(),
    };
    return new ChatbotConfig(propsWithAI);
  }

  private validateProps(props: ChatbotConfigProps): void {
    if (!props.organizationId?.trim()) {
      throw new Error('Organization ID is required');
    }
    if (!props.name?.trim()) {
      throw new Error('Chatbot name is required');
    }
    if (props.name.length > 100) {
      throw new Error('Chatbot name must be 100 characters or less');
    }
    // Lead qualification questions are optional
    
    // Validate operating hours
    if (!props.operatingHours.timezone) {
      throw new Error('Timezone is required for operating hours');
    }
  }

  // Getters
  get id(): string { return this.props.id; }
  get organizationId(): string { return this.props.organizationId; }
  get name(): string { return this.props.name; }
  get avatarUrl(): string | undefined { return this.props.avatarUrl; }
  get description(): string | undefined { return this.props.description; }
  get personalitySettings(): PersonalitySettings { return this.props.personalitySettings; }
  get knowledgeBase(): KnowledgeBase { return this.props.knowledgeBase; }
  get operatingHours(): OperatingHours { return this.props.operatingHours; }
  get leadQualificationQuestions(): LeadQualificationQuestion[] { return this.props.leadQualificationQuestions; }
  get aiConfiguration(): AIConfiguration { return this.props.aiConfiguration; }
  get isActive(): boolean { return this.props.isActive; }
  get createdAt(): Date { return this.props.createdAt; }
  get updatedAt(): Date { return this.props.updatedAt; }

  // Business methods
  updatePersonality(settings: PersonalitySettings): ChatbotConfig {
    return new ChatbotConfig({
      ...this.props,
      personalitySettings: settings,
      updatedAt: new Date(),
    });
  }

  updateKnowledgeBase(knowledgeBase: KnowledgeBase): ChatbotConfig {
    return new ChatbotConfig({
      ...this.props,
      knowledgeBase,
      updatedAt: new Date(),
    });
  }

  updateOperatingHours(operatingHours: OperatingHours): ChatbotConfig {
    return new ChatbotConfig({
      ...this.props,
      operatingHours,
      updatedAt: new Date(),
    });
  }

  addLeadQualificationQuestion(question: LeadQualificationQuestion): ChatbotConfig {
    const existingQuestions = this.props.leadQualificationQuestions;
    const newQuestions = [...existingQuestions, question];
    
    return new ChatbotConfig({
      ...this.props,
      leadQualificationQuestions: newQuestions,
      updatedAt: new Date(),
    });
  }

  removeLeadQualificationQuestion(questionId: string): ChatbotConfig {
    const filteredQuestions = this.props.leadQualificationQuestions.filter(q => q.id !== questionId);
    
    return new ChatbotConfig({
      ...this.props,
      leadQualificationQuestions: filteredQuestions,
      updatedAt: new Date(),
    });
  }

  updateAIConfiguration(aiConfiguration: AIConfiguration): ChatbotConfig {
    return new ChatbotConfig({
      ...this.props,
      aiConfiguration,
      updatedAt: new Date(),
    });
  }

  // Get default AI configuration
  static getDefaultAIConfiguration(): AIConfiguration {
    return AIConfiguration.createDefault();
  }

  activate(): ChatbotConfig {
    return new ChatbotConfig({
      ...this.props,
      isActive: true,
      updatedAt: new Date(),
    });
  }

  deactivate(): ChatbotConfig {
    return new ChatbotConfig({
      ...this.props,
      isActive: false,
      updatedAt: new Date(),
    });
  }

  isWithinOperatingHours(timestamp: Date = new Date()): boolean {
    return this.props.operatingHours.isWithinOperatingHours(timestamp);
  }

  toPlainObject(): ChatbotConfigProps {
    return { ...this.props };
  }
} 