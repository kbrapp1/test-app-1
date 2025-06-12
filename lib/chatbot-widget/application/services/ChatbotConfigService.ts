/**
 * Chatbot Configuration Application Service
 * 
 * Orchestrates chatbot configuration use cases and coordinates domain services.
 * Following DDD principles: Application services contain no business logic,
 * only workflow coordination and DTO transformations.
 */

import { ChatbotWidgetCompositionRoot } from '../../infrastructure/composition/ChatbotWidgetCompositionRoot';
import { ChatbotConfigMapper } from '../mappers/ChatbotConfigMapper';
import {
  ChatbotConfigDto,
  CreateChatbotConfigDto,
  UpdateChatbotConfigDto,
} from '../dto/ChatbotConfigDto';

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
      console.error('Error creating chatbot config:', error);
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
        updatedConfig = updatedConfig.updatePersonality(updateDto.personalitySettings as any);
      }

      if (updateDto.knowledgeBase) {
        updatedConfig = updatedConfig.updateKnowledgeBase(updateDto.knowledgeBase as any);
      }

      if (updateDto.operatingHours) {
        updatedConfig = updatedConfig.updateOperatingHours(updateDto.operatingHours as any);
      }

      if (updateDto.isActive !== undefined) {
        updatedConfig = updateDto.isActive ? updatedConfig.activate() : updatedConfig.deactivate();
      }

      // Save updated configuration
      const savedConfig = await this.chatbotConfigRepository.update(updatedConfig);
      
      return ChatbotConfigMapper.toDto(savedConfig);
    } catch (error) {
      console.error('Error updating chatbot config:', error);
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
      console.error('Error in getChatbotConfigByOrganization:', error);
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