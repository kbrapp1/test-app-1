/**
 * Chatbot Configuration Repository Interface
 * 
 * AI INSTRUCTIONS:
 * - Domain repository interface for chatbot configuration persistence abstraction
 * - Defines contract for configuration CRUD operations and organization-scoped queries
 * - Provides configuration statistics, search capabilities, and existence checks
 * - Pure domain interface following repository pattern with async operations
 * - Infrastructure layer implements this interface with Supabase or other persistence
 */

import { ChatbotConfig } from '../entities/ChatbotConfig';

export interface IChatbotConfigRepository {
  /** Find chatbot configuration by ID */
  findById(id: string): Promise<ChatbotConfig | null>;

  /** Find chatbot configuration by organization ID */
  findByOrganizationId(organizationId: string): Promise<ChatbotConfig | null>;

  /** Find all active chatbot configurations for an organization */
  findActiveByOrganizationId(organizationId: string): Promise<ChatbotConfig[]>;

  /** Save a new chatbot configuration */
  save(config: ChatbotConfig): Promise<ChatbotConfig>;

  /** Update an existing chatbot configuration */
  update(config: ChatbotConfig): Promise<ChatbotConfig>;

  /** Delete a chatbot configuration */
  delete(id: string): Promise<void>;

  /** Check if a configuration exists for an organization */
  existsByOrganizationId(organizationId: string): Promise<boolean>;

  /** Find configurations by name pattern (for admin search) */
  findByNamePattern(pattern: string, organizationId?: string): Promise<ChatbotConfig[]>;

  /** Get configuration statistics for an organization */
  getStatistics(organizationId: string): Promise<{
    totalConfigs: number;
    activeConfigs: number;
    totalFaqs: number;
    avgLeadQuestions: number;
    lastUpdated: Date | null;
  }>;
} 