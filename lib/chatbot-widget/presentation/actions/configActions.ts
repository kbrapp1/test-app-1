/**
 * AI INSTRUCTIONS:
 * - Next.js server actions for chatbot configuration management
 * - Handle CRUD operations for chatbot configurations
 * - Delegate to application services with proper error handling
 * - Follow DDD presentation layer patterns with cache revalidation
 */

'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { ChatbotConfigService } from '../../application/services/configuration-management/ChatbotConfigService';
import { ChatbotWidgetCompositionRoot } from '../../infrastructure/composition/ChatbotWidgetCompositionRoot';
import {
  ChatbotConfigDto,
  CreateChatbotConfigDto,
  UpdateChatbotConfigDto,
} from '../../application/dto/ChatbotConfigDto';
import {
  KnowledgeBaseUpdateRequestDto,
  KnowledgeBaseUpdateResponseDto,
} from '../../application/dto/KnowledgeBaseFormDto';

// Create new chatbot configuration
export async function createChatbotConfig(
  data: CreateChatbotConfigDto
): Promise<{ success: boolean; data?: ChatbotConfigDto; error?: string }> {
  try {
    const service = new ChatbotConfigService();
    const result = await service.createChatbotConfig(data);
    
    revalidatePath('/ai-playground/chatbot-widget');
    
    return { success: true, data: result };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create chatbot configuration',
    };
  }
}

// Update existing chatbot configuration
export async function updateChatbotConfig(
  id: string,
  data: UpdateChatbotConfigDto,
  organizationId: string
): Promise<{ success: boolean; data?: ChatbotConfigDto; error?: string }> {
  try {
    const service = new ChatbotConfigService();
    const result = await service.updateChatbotConfig(id, data, organizationId);
    
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

// Get chatbot configuration by organization
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

// Get chatbot configuration by ID
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

// Get all active chatbot configurations
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

// Delete chatbot configuration
export async function deleteChatbotConfig(
  id: string,
  organizationId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const service = new ChatbotConfigService();
    await service.deleteChatbotConfig(id, organizationId);
    
    revalidatePath('/ai-playground/chatbot-widget');
    redirect('/ai-playground/chatbot-widget');
    
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete chatbot configuration',
    };
  }
}

// Check if organization can create new chatbot
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

// Get chatbot configuration statistics
export async function getChatbotConfigStats(
  organizationId: string
): Promise<{ success: boolean; data?: Record<string, unknown>; error?: string }> {
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

// Update knowledge base configuration
export async function updateKnowledgeBase(
  request: KnowledgeBaseUpdateRequestDto
): Promise<{ success: boolean; data?: KnowledgeBaseUpdateResponseDto; error?: string }> {
  try {
    const knowledgeFormService = ChatbotWidgetCompositionRoot.getKnowledgeBaseFormApplicationService();
    const result = await knowledgeFormService.updateKnowledgeBase(request);
    
    revalidatePath('/ai-playground/chatbot-widget');
    revalidatePath(`/ai-playground/chatbot-widget/config`);
    
    return { success: true, data: result };
  } catch (error) {
    console.error('Knowledge base update error:', error instanceof Error ? error.message : error);
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update knowledge base',
    };
  }
} 