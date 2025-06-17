/**
 * Chatbot Configuration Application Service
 * 
 * Orchestrates chatbot configuration use cases and coordinates domain services.
 * Following DDD principles: Application services contain no business logic,
 * only workflow coordination and DTO transformations.
 */

import { ChatbotWidgetCompositionRoot } from '../../../infrastructure/composition/ChatbotWidgetCompositionRoot';
import { ChatbotConfigMapper } from '../../mappers/ChatbotConfigMapper';
import {
  ChatbotConfigDto,
  CreateChatbotConfigDto,
  UpdateChatbotConfigDto,
} from '../../dto/ChatbotConfigDto';

export class ChatbotConfigService {
  private readonly chatbotConfigRepository;

  constructor() {
    this.chatbotConfigRepository = ChatbotWidgetCompositionRoot.getChatbotConfigRepository();
  }

  /**
   * Create a new chatbot configuration
   */
  async createChatbotConfig(createDto: CreateChatbotConfigDto): Promise<ChatbotConfigDto> {
    try {
      // Check if organization already has a chatbot config
      const existingConfig = await this.chatbotConfigRepository.findByOrganizationId(
        createDto.organizationId
      );
      
      if (existingConfig) {
        throw new Error('Organization already has a chatbot configuration');
      }

      // Convert DTO to domain entity
      const chatbotConfig = ChatbotConfigMapper.createDtoToDomain(createDto);
      
      // Save via repository
      const savedConfig = await this.chatbotConfigRepository.save(chatbotConfig);
      
      // Convert back to DTO for response
      return ChatbotConfigMapper.toDto(savedConfig);
    } catch (error) {
      // Error creating chatbot config - handled by error boundary
      throw error;
    }
  }

  /**
   * Update an existing chatbot configuration
   */
  async updateChatbotConfig(
    id: string,
    updateDto: UpdateChatbotConfigDto,
    organizationId: string
  ): Promise<ChatbotConfigDto> {
    try {
      // Find existing configuration
      const existingConfig = await this.chatbotConfigRepository.findById(id);
      
      if (!existingConfig) {
        throw new Error('Chatbot configuration not found');
      }

      // Verify ownership
      if (existingConfig.organizationId !== organizationId) {
        throw new Error('Unauthorized to update this chatbot configuration');
      }

      // Apply updates (domain entity handles validation)
      let updatedConfig = existingConfig;
      
      if (updateDto.name) {
        updatedConfig = ChatbotConfigMapper.toDomain({
          ...ChatbotConfigMapper.toDto(updatedConfig),
          name: updateDto.name,
          updatedAt: new Date().toISOString(),
        });
      }

      if (updateDto.personalitySettings) {
        // Convert DTO to domain value object following @golden-rule patterns
        // Handle partial DTO by merging with current values
        const currentPersonality = ChatbotConfigMapper.personalityToDto(updatedConfig.personalitySettings.toPlainObject());
        const mergedPersonalityDto = {
          tone: updateDto.personalitySettings.tone ?? currentPersonality.tone,
          communicationStyle: updateDto.personalitySettings.communicationStyle ?? currentPersonality.communicationStyle,
          responseLength: updateDto.personalitySettings.responseLength ?? currentPersonality.responseLength,
          escalationTriggers: updateDto.personalitySettings.escalationTriggers ?? currentPersonality.escalationTriggers,
          responseBehavior: updateDto.personalitySettings.responseBehavior ?? currentPersonality.responseBehavior,
          conversationFlow: updateDto.personalitySettings.conversationFlow ?? currentPersonality.conversationFlow,
          customInstructions: updateDto.personalitySettings.customInstructions ?? currentPersonality.customInstructions,
        };
        const personalityDomain = ChatbotConfigMapper.personalityFromDto(mergedPersonalityDto);
        updatedConfig = updatedConfig.updatePersonality(personalityDomain);
      }

      if (updateDto.knowledgeBase) {
        // Convert DTO to domain value object following @golden-rule patterns
        // Handle partial DTO by merging with current values
        const currentKb = ChatbotConfigMapper.knowledgeBaseToDto(updatedConfig.knowledgeBase.toPlainObject());
        const mergedKbDto = {
          companyInfo: updateDto.knowledgeBase.companyInfo ?? currentKb.companyInfo,
          productCatalog: updateDto.knowledgeBase.productCatalog ?? currentKb.productCatalog,
          supportDocs: updateDto.knowledgeBase.supportDocs ?? currentKb.supportDocs,
          complianceGuidelines: updateDto.knowledgeBase.complianceGuidelines ?? currentKb.complianceGuidelines,
          faqs: updateDto.knowledgeBase.faqs ?? currentKb.faqs,
        };
        
        const knowledgeBaseDomain = ChatbotConfigMapper.knowledgeBaseFromDto(mergedKbDto);
        updatedConfig = updatedConfig.updateKnowledgeBase(knowledgeBaseDomain);
      }

      if (updateDto.operatingHours) {
        // Convert DTO to domain value object following @golden-rule patterns
        // Handle partial DTO by merging with current values
        const currentOperatingHours = ChatbotConfigMapper.operatingHoursToDto(updatedConfig.operatingHours.toPlainObject());
        const mergedOperatingHoursDto = {
          timezone: updateDto.operatingHours.timezone ?? currentOperatingHours.timezone,
          businessHours: updateDto.operatingHours.businessHours ?? currentOperatingHours.businessHours,
          holidaySchedule: updateDto.operatingHours.holidaySchedule ?? currentOperatingHours.holidaySchedule,
          outsideHoursMessage: updateDto.operatingHours.outsideHoursMessage ?? currentOperatingHours.outsideHoursMessage,
        };
        const operatingHoursDomain = ChatbotConfigMapper.operatingHoursFromDto(mergedOperatingHoursDto);
        updatedConfig = updatedConfig.updateOperatingHours(operatingHoursDomain);
      }

      if (updateDto.isActive !== undefined) {
        updatedConfig = updateDto.isActive ? updatedConfig.activate() : updatedConfig.deactivate();
      }

      // Save updated configuration
      const savedConfig = await this.chatbotConfigRepository.update(updatedConfig);
      
      return ChatbotConfigMapper.toDto(savedConfig);
    } catch (error) {
      // Error updating chatbot config - handled by error boundary
      throw error;
    }
  }

  /**
   * Get chatbot configuration by organization ID
   */
  async getChatbotConfigByOrganization(organizationId: string): Promise<ChatbotConfigDto | null> {
    try {
      const config = await this.chatbotConfigRepository.findByOrganizationId(organizationId);
      
      if (!config) {
        return null;
      }
      
      return ChatbotConfigMapper.toDto(config);
    } catch (error) {
      // Error in getChatbotConfigByOrganization - handled by error boundary
      throw error;
    }
  }

  /**
   * Get chatbot configuration by ID
   */
  async getChatbotConfigById(id: string, organizationId?: string): Promise<ChatbotConfigDto | null> {
    const config = await this.chatbotConfigRepository.findById(id);
    
    if (!config) {
      return null;
    }

    // If organizationId provided, verify ownership
    if (organizationId && config.organizationId !== organizationId) {
      throw new Error('Unauthorized to access this chatbot configuration');
    }
    
    return ChatbotConfigMapper.toDto(config);
  }

  /**
   * Get all active chatbot configurations for an organization
   */
  async getActiveChatbotConfigs(organizationId: string): Promise<ChatbotConfigDto[]> {
    const configs = await this.chatbotConfigRepository.findActiveByOrganizationId(organizationId);
    
    return configs.map(config => ChatbotConfigMapper.toDto(config));
  }

  /**
   * Delete a chatbot configuration
   */
  async deleteChatbotConfig(id: string, organizationId: string): Promise<void> {
    const config = await this.chatbotConfigRepository.findById(id);
    
    if (!config) {
      throw new Error('Chatbot configuration not found');
    }

    if (config.organizationId !== organizationId) {
      throw new Error('Unauthorized to delete this chatbot configuration');
    }

    await this.chatbotConfigRepository.delete(id);
  }

  /**
   * Check if organization can create a new chatbot
   */
  async canCreateChatbot(organizationId: string): Promise<boolean> {
    const hasExisting = await this.chatbotConfigRepository.existsByOrganizationId(organizationId);
    return !hasExisting; // For MVP, limit to one chatbot per org
  }

  /**
   * Get chatbot configuration statistics
   */
  async getChatbotConfigStats(organizationId: string) {
    return await this.chatbotConfigRepository.getStatistics(organizationId);
  }
} 