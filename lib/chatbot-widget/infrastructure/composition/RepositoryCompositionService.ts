import { SupabaseClient } from '@supabase/supabase-js';
import { createClient } from '../../../supabase/server';

// Repository implementations
import { ChatbotConfigSupabaseRepository } from '../persistence/supabase/ChatbotConfigSupabaseRepository';
import { ChatSessionSupabaseRepository } from '../persistence/supabase/ChatSessionSupabaseRepository';
import { ChatMessageSupabaseRepository } from '../persistence/supabase/ChatMessageSupabaseRepository';
import { LeadSupabaseRepository } from '../persistence/supabase/LeadSupabaseRepository';

// Repository interfaces
import { IChatbotConfigRepository } from '../../domain/repositories/IChatbotConfigRepository';
import { IChatSessionRepository } from '../../domain/repositories/IChatSessionRepository';
import { IChatMessageRepository } from '../../domain/repositories/IChatMessageRepository';
import { ILeadRepository } from '../../domain/repositories/ILeadRepository';

/**
 * Repository Composition Service
 * Domain Service: Manages repository creation and lifecycle
 * Following DDD principles: Single responsibility for repository management
 */
export class RepositoryCompositionService {
  private static supabaseClient: SupabaseClient | null = null;
  
  // Repository singletons
  private static chatbotConfigRepository: IChatbotConfigRepository | null = null;
  private static chatSessionRepository: IChatSessionRepository | null = null;
  private static chatMessageRepository: IChatMessageRepository | null = null;
  private static leadRepository: ILeadRepository | null = null;

  /**
   * Get or create Supabase client
   * Uses server client for authentication (called from server actions)
   */
  private static getSupabaseClient(): SupabaseClient {
    if (!this.supabaseClient) {
      this.supabaseClient = createClient();
    }
    return this.supabaseClient;
  }

  /** Get ChatbotConfig Repository
 */
  static getChatbotConfigRepository(): IChatbotConfigRepository {
    if (!this.chatbotConfigRepository) {
      this.chatbotConfigRepository = new ChatbotConfigSupabaseRepository(
        this.getSupabaseClient()
      );
    }
    return this.chatbotConfigRepository;
  }

  /** Get ChatSession Repository
 */
  static getChatSessionRepository(): IChatSessionRepository {
    if (!this.chatSessionRepository) {
      this.chatSessionRepository = new ChatSessionSupabaseRepository(
        this.getSupabaseClient()
      );
    }
    return this.chatSessionRepository;
  }

  /** Get ChatMessage Repository
 */
  static getChatMessageRepository(): IChatMessageRepository {
    if (!this.chatMessageRepository) {
      this.chatMessageRepository = new ChatMessageSupabaseRepository(
        this.getSupabaseClient()
      );
    }
    return this.chatMessageRepository;
  }

  /** Get Lead Repository
 */
  static getLeadRepository(): ILeadRepository {
    if (!this.leadRepository) {
      this.leadRepository = new LeadSupabaseRepository(
        this.getSupabaseClient()
      );
    }
    return this.leadRepository;
  }

  /** Configure with custom Supabase client (useful for testing)
 */
  static configureWithSupabaseClient(client: SupabaseClient): void {
    this.supabaseClient = client;
    // Reset repositories to force recreation with new client
    this.resetRepositories();
  }

  /** Reset repository singletons
 */
  static resetRepositories(): void {
    this.chatbotConfigRepository = null;
    this.chatSessionRepository = null;
    this.chatMessageRepository = null;
    this.leadRepository = null;
  }

  /** Reset all including Supabase client
 */
  static reset(): void {
    this.supabaseClient = null;
    this.resetRepositories();
  }
} 