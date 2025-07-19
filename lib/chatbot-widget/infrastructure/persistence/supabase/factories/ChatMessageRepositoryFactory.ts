import { SupabaseClient } from '@supabase/supabase-js';
import { IChatMessageRepository } from '../../../../domain/repositories/IChatMessageRepository';
import { ChatMessageSupabaseRepositoryCore } from '../ChatMessageSupabaseRepositoryCore';
import { ChatMessageRepositoryLoggingBehavior } from '../behaviors/ChatMessageRepositoryLoggingBehavior';
import { IChatbotLoggingService } from '../../../../domain/services/interfaces/IChatbotLoggingService';
import { ChatbotWidgetCompositionRoot } from '../../../composition/ChatbotWidgetCompositionRoot';

/**
 * DDD Repository Factory Pattern
 * 
 * Centralizes repository creation and decorator composition.
 * Implements clean dependency injection following DDD principles.
 * Maintains all security patterns and organizational context.
 */
export class ChatMessageRepositoryFactory {
  /**
   * Creates a fully configured ChatMessage repository with all behaviors
   */
  static createWithLogging(supabaseClient?: SupabaseClient): IChatMessageRepository {
    // Create core repository
    const coreRepository = new ChatMessageSupabaseRepositoryCore(supabaseClient);
    
    // Get logging service from composition root
    const loggingService = ChatbotWidgetCompositionRoot.getLoggingService();
    
    // Wrap with logging behavior
    return new ChatMessageRepositoryLoggingBehavior(coreRepository, loggingService);
  }

  /**
   * Creates a basic repository without logging (for testing or lightweight operations)
   */
  static createCore(supabaseClient?: SupabaseClient): IChatMessageRepository {
    return new ChatMessageSupabaseRepositoryCore(supabaseClient);
  }

  /**
   * Creates repository with custom logging service (for testing with mocks)
   */
  static createWithCustomLogging(
    loggingService: IChatbotLoggingService,
    supabaseClient?: SupabaseClient
  ): IChatMessageRepository {
    const coreRepository = new ChatMessageSupabaseRepositoryCore(supabaseClient);
    return new ChatMessageRepositoryLoggingBehavior(coreRepository, loggingService);
  }
}