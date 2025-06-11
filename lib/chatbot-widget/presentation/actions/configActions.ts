/**
 * Chatbot Configuration Server Actions
 * 
 * Server actions for chatbot configuration management.
 * Following DDD principles: Server actions are presentation layer entry points
 * that handle user requests and delegate to application services.
 */

'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { ChatbotConfigService } from '../../application/services/ChatbotConfigService';
import {
  ChatbotConfigDto,
  CreateChatbotConfigDto,
  UpdateChatbotConfigDto,
} from '../../application/dto/ChatbotConfigDto';

/**
 * Create a new chatbot configuration
 */
export async function createChatbotConfig(
  data: CreateChatbotConfigDto
): Promise<{ success: boolean; data?: ChatbotConfigDto; error?: string }> {
  try {
    const service = new ChatbotConfigService();
    const result = await service.createChatbotConfig(data);
    
    // Revalidate chatbot settings pages
    revalidatePath('/ai-playground/chatbot-widget');
    
    return { success: true, data: result };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create chatbot configuration',
    };
  }
}

/**
 * Update an existing chatbot configuration
 */
export async function updateChatbotConfig(
  id: string,
  data: UpdateChatbotConfigDto,
  organizationId: string
): Promise<{ success: boolean; data?: ChatbotConfigDto; error?: string }> {
  try {
    const service = new ChatbotConfigService();
    const result = await service.updateChatbotConfig(id, data, organizationId);
    
    // Revalidate chatbot settings pages
    revalidatePath('/ai-playground/chatbot-widget');
    revalidatePath(`/ai-playground/chatbot-widget/config`);
    
    return { success: true, data: result };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update chatbot configuration',
    };
  }
}

/**
 * Get chatbot configuration by organization ID
 */
export async function getChatbotConfigByOrganization(
  organizationId: string
): Promise<{ success: boolean; data?: ChatbotConfigDto | null; error?: string }> {
  try {
    const service = new ChatbotConfigService();
    const result = await service.getChatbotConfigByOrganization(organizationId);
    
    return { success: true, data: result };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get chatbot configuration',
    };
  }
}

/**
 * Get chatbot configuration by ID
 */
export async function getChatbotConfigById(
  id: string,
  organizationId?: string
): Promise<{ success: boolean; data?: ChatbotConfigDto | null; error?: string }> {
  try {
    const service = new ChatbotConfigService();
    const result = await service.getChatbotConfigById(id, organizationId);
    
    return { success: true, data: result };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get chatbot configuration',
    };
  }
}

/**
 * Get all active chatbot configurations for an organization
 */
export async function getActiveChatbotConfigs(
  organizationId: string
): Promise<{ success: boolean; data?: ChatbotConfigDto[]; error?: string }> {
  try {
    const service = new ChatbotConfigService();
    const result = await service.getActiveChatbotConfigs(organizationId);
    
    return { success: true, data: result };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get active chatbot configurations',
    };
  }
}

/**
 * Delete a chatbot configuration
 */
export async function deleteChatbotConfig(
  id: string,
  organizationId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const service = new ChatbotConfigService();
    await service.deleteChatbotConfig(id, organizationId);
    
    // Revalidate and redirect
    revalidatePath('/ai-playground/chatbot-widget');
    redirect('/ai-playground/chatbot-widget');
    
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete chatbot configuration',
    };
  }
}

/**
 * Check if organization can create a new chatbot
 */
export async function canCreateChatbot(
  organizationId: string
): Promise<{ success: boolean; data?: boolean; error?: string }> {
  try {
    const service = new ChatbotConfigService();
    const result = await service.canCreateChatbot(organizationId);
    
    return { success: true, data: result };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to check chatbot creation eligibility',
    };
  }
}

/**
 * Get chatbot configuration statistics
 */
export async function getChatbotConfigStats(
  organizationId: string
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const service = new ChatbotConfigService();
    const result = await service.getChatbotConfigStats(organizationId);
    
    return { success: true, data: result };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get chatbot statistics',
    };
  }
} 