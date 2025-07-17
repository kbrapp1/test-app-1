import { IntentResult } from '../../value-objects/message-processing/IntentResult';

export interface KnowledgeItem {
  id: string;
  title: string;
  content: string;
  category: 'faq' | 'product_info' | 'pricing' | 'support' | 'general';
  tags: string[];
  relevanceScore: number;
  source: string;
  lastUpdated: Date;
}

export interface KnowledgeSearchResult {
  items: KnowledgeItem[];
  totalFound: number;
  searchQuery: string;
  searchTimeMs: number;
}

export interface KnowledgeRetrievalContext {
  userQuery: string;
  intentResult?: IntentResult;
  conversationHistory?: string[];
  userPreferences?: Record<string, any>;
  maxResults?: number;
  minRelevanceScore?: number;
  sharedLogFile?: string;
}

export interface IKnowledgeRetrievalService {
  /** Search for relevant knowledge based on user query and intent */
  searchKnowledge(context: KnowledgeRetrievalContext): Promise<KnowledgeSearchResult>;

  /** Get knowledge items by category */
  getKnowledgeByCategory(
    category: KnowledgeItem['category'],
    limit?: number
  ): Promise<KnowledgeItem[]>;

  /** Get frequently asked questions */
  getFrequentlyAskedQuestions(limit?: number): Promise<KnowledgeItem[]>;

  /** Search for similar questions/content */
  findSimilarContent(
    query: string,
    excludeIds?: string[],
    limit?: number
  ): Promise<KnowledgeItem[]>;

  /** Get knowledge items by tags */
  getKnowledgeByTags(
    tags: string[],
    limit?: number
  ): Promise<KnowledgeItem[]>;

  /** Add or update knowledge item (for dynamic learning) */
  upsertKnowledgeItem(item: Omit<KnowledgeItem, 'id' | 'lastUpdated'>): Promise<KnowledgeItem>;

  /** Check if the service is available and healthy */
  healthCheck(): Promise<boolean>;

  /** Initialize vector cache for session startup
   * 
   * AI INSTRUCTIONS:
   * - Direct vector cache initialization for optimal performance
   * - Should be called during session startup to avoid delays
   * - No-op if cache already initialized
   */
  initializeVectorCacheForSession(sharedLogFile: string): Promise<void>;

  /** Check if vector cache is ready for use */
  isVectorCacheReady(): boolean;
} 