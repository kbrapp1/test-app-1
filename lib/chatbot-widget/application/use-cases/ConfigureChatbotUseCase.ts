/**
 * Configure Chatbot Use Case
 * 
 * AI INSTRUCTIONS:
 * - Orchestrates complete chatbot configuration workflow using domain entities and services
 * - Coordinates validation, entity creation, and persistence following DDD use case patterns
 * - Implements business rules for configuration completeness scoring and recommendations
 * - Handles both initial configuration creation and incremental updates with proper validation
 * - Returns structured results with configuration metrics and actionable recommendations
 */

import { ChatbotConfig, LeadQualificationQuestion } from '../../domain/entities/ChatbotConfig';
import { PersonalitySettings } from '../../domain/value-objects/ai-configuration/PersonalitySettings';
import { KnowledgeBase } from '../../domain/value-objects/ai-configuration/KnowledgeBase';
import { OperatingHours } from '../../domain/value-objects/session-management/OperatingHours';
import { IChatbotConfigRepository } from '../../domain/repositories/IChatbotConfigRepository';

export interface ConfigureChatbotRequest {
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

export interface ConfigureChatbotResult {
  chatbotConfig: ChatbotConfig;
  validationResults: {
    knowledgeBaseScore: number; // 0-100
    configurationCompleteness: number; // 0-100
    recommendations: string[];
    warnings: string[];
  };
}

export class ConfigureChatbotUseCase {
  constructor(
    private readonly chatbotConfigRepository: IChatbotConfigRepository
  ) {}

  // Execute the complete chatbot configuration process
  async execute(request: ConfigureChatbotRequest): Promise<ConfigureChatbotResult> {
    // 1. Validate configuration requirements
    this.validateConfigurationRequest(request);

    // 2. Validate knowledge base completeness
    const knowledgeBaseValidation = this.validateKnowledgeBase(request.knowledgeBase);

    // 3. Create chatbot configuration entity
    const chatbotConfig = ChatbotConfig.create({
      organizationId: request.organizationId,
      name: request.name,
      description: request.description || '',
      avatarUrl: request.avatarUrl,
      personalitySettings: request.personalitySettings,
      knowledgeBase: request.knowledgeBase,
      operatingHours: request.operatingHours,
      leadQualificationQuestions: request.leadQualificationQuestions,
      isActive: request.isActive ?? true
    });

    // 4. Save configuration
    const savedConfig = await this.chatbotConfigRepository.save(chatbotConfig);

    // 5. Calculate configuration completeness and recommendations
    const validationResults = this.calculateConfigurationMetrics(
      savedConfig,
      knowledgeBaseValidation
    );

    return {
      chatbotConfig: savedConfig,
      validationResults
    };
  }

  // Update existing chatbot configuration
  async updateConfiguration(
    configId: string,
    updates: Partial<ConfigureChatbotRequest>
  ): Promise<ConfigureChatbotResult> {
    // 1. Load existing configuration
    const existingConfig = await this.chatbotConfigRepository.findById(configId);
    if (!existingConfig) {
      throw new Error(`Chatbot configuration ${configId} not found`);
    }

    // 2. Apply updates using domain methods
    let updatedConfig = existingConfig;

    if (updates.personalitySettings) {
      updatedConfig = updatedConfig.updatePersonality(updates.personalitySettings);
    }

    if (updates.knowledgeBase) {
      updatedConfig = updatedConfig.updateKnowledgeBase(updates.knowledgeBase);
    }

    if (updates.operatingHours) {
      updatedConfig = updatedConfig.updateOperatingHours(updates.operatingHours);
    }

    if (updates.leadQualificationQuestions) {
      // Replace all questions with the new set
      updatedConfig = ChatbotConfig.fromPersistence({
        ...updatedConfig.toPlainObject(),
        leadQualificationQuestions: updates.leadQualificationQuestions,
        updatedAt: new Date()
      });
    }

    if (updates.isActive !== undefined) {
      updatedConfig = updates.isActive 
        ? updatedConfig.activate()
        : updatedConfig.deactivate();
    }

    // 3. Save updated configuration
    const savedConfig = await this.chatbotConfigRepository.update(updatedConfig);

    // 4. Calculate updated metrics
    const knowledgeBaseValidation = updates.knowledgeBase 
      ? this.validateKnowledgeBase(updates.knowledgeBase)
      : this.validateKnowledgeBase(savedConfig.knowledgeBase);

    const validationResults = this.calculateConfigurationMetrics(
      savedConfig,
      knowledgeBaseValidation
    );

    return {
      chatbotConfig: savedConfig,
      validationResults
    };
  }

  // Validate configuration request
  private validateConfigurationRequest(request: ConfigureChatbotRequest): void {
    if (!request.organizationId?.trim()) {
      throw new Error('Organization ID is required');
    }

    if (!request.name?.trim()) {
      throw new Error('Chatbot name is required');
    }

    if (request.name.length > 100) {
      throw new Error('Chatbot name must be 100 characters or less');
    }

    if (!request.personalitySettings) {
      throw new Error('Personality settings are required');
    }

    if (!request.knowledgeBase) {
      throw new Error('Knowledge base is required');
    }

    if (!request.operatingHours) {
      throw new Error('Operating hours configuration is required');
    }

    if (!request.leadQualificationQuestions || request.leadQualificationQuestions.length === 0) {
      throw new Error('At least one lead qualification question is required');
    }
  }

  // Validate knowledge base completeness
  private validateKnowledgeBase(knowledgeBase: KnowledgeBase): {
    score: number;
    recommendations: string[];
    warnings: string[];
  } {
    const recommendations: string[] = [];
    const warnings: string[] = [];
    let score = 0;
    const maxScore = 100;

    // Company info (25 points)
    if (knowledgeBase.companyInfo?.trim()) {
      score += 25;
    } else {
      warnings.push('Company information is missing');
    }

    // Product catalog (20 points)
    if (knowledgeBase.productCatalog?.trim()) {
      score += 20;
    } else {
      recommendations.push('Add product catalog information to improve responses');
    }

    // FAQs (25 points)
    if (knowledgeBase.faqs?.length >= 5) {
      score += 25;
    } else if (knowledgeBase.faqs?.length > 0) {
      score += 15;
      recommendations.push(`Add more FAQs (${knowledgeBase.faqs.length}/5+ recommended)`);
    } else {
      warnings.push('No FAQs provided - this will limit chatbot effectiveness');
    }

    // Support docs (15 points)
    if (knowledgeBase.supportDocs?.trim()) {
      score += 15;
    } else {
      recommendations.push('Add support documentation for better customer service');
    }

    // Compliance guidelines (15 points)
    if (knowledgeBase.complianceGuidelines?.trim()) {
      score += 15;
    } else {
      recommendations.push('Add compliance guidelines to ensure proper handling of sensitive information');
    }

    return { score, recommendations, warnings };
  }

  // Calculate configuration completeness metrics
  private calculateConfigurationMetrics(
    config: ChatbotConfig,
    knowledgeBaseValidation: { score: number; recommendations: string[]; warnings: string[] }
  ): ConfigureChatbotResult['validationResults'] {
    let completeness = 0;
    const recommendations: string[] = [...knowledgeBaseValidation.recommendations];
    const warnings: string[] = [...knowledgeBaseValidation.warnings];

    // Basic configuration (30%)
    if (config.name && config.description) completeness += 30;
    else if (config.name) completeness += 20;

    // Personality (20%)
    if (config.personalitySettings) completeness += 20;

    // Knowledge base (40%)
    completeness += (knowledgeBaseValidation.score / 100) * 40;

    // Operating hours (10%)
    if (config.operatingHours) completeness += 10;

    // Add recommendations based on completeness
    if (completeness < 80) {
      recommendations.push('Complete configuration to improve chatbot effectiveness');
    }

    if (!config.avatarUrl) {
      recommendations.push('Add an avatar to make the chatbot more engaging');
    }

    if (config.leadQualificationQuestions.length < 3) {
      recommendations.push('Add more qualification questions to improve lead quality');
    }

    return {
      knowledgeBaseScore: knowledgeBaseValidation.score,
      configurationCompleteness: Math.round(completeness),
      recommendations,
      warnings
    };
  }
} 