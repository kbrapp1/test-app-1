/**
 * Knowledge Relevance Service
 * 
 * AI INSTRUCTIONS:
 * - Single responsibility: Calculate relevance and similarity scores using semantic search
 * - Replace manual keyword matching with OpenAI embeddings for true semantic understanding
 * - Keep under 200 lines following @golden-rule patterns
 * - Use semantic similarity for accurate relevance scoring
 * - Follow @golden-rule patterns exactly
 * - LOGGING: Support API call logging for embedding requests
 */

import { KnowledgeItem } from '../../../domain/services/interfaces/IKnowledgeRetrievalService';
import { OpenAIEmbeddingService, SimilarityMatch, EmbeddingLogContext } from '../openai/services/OpenAIEmbeddingService';

export class KnowledgeRelevanceService {
  private embeddingService: OpenAIEmbeddingService;
  private isInitialized: boolean = false;
  private logContext?: EmbeddingLogContext;

  constructor(logContext?: EmbeddingLogContext) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY is required for semantic search');
    }
    this.embeddingService = new OpenAIEmbeddingService(apiKey, logContext);
    this.logContext = logContext;
  }

  /**
   * Set logging context for API call logging
   */
  setLogContext(logContext: EmbeddingLogContext): void {
    this.logContext = logContext;
    this.embeddingService.setLogContext(logContext);
  }

  /**
   * Find best matches using semantic similarity
   * AI INSTRUCTIONS: Replace manual scoring with semantic embeddings
   */
  async findBestMatches(
    items: KnowledgeItem[],
    query: string,
    intent: string,
    maxResults: number = 5,
    minRelevanceScore: number = 0.3
  ): Promise<KnowledgeItem[]> {
    if (items.length === 0 || !query.trim()) {
      return [];
    }

    try {
      // Prepare search texts (combine title, content, and tags for better matching)
      const searchTexts = items.map(item => this.buildEmbeddingContent(item));
      
      // Find semantically similar items
      const similarityMatches = await this.embeddingService.findSimilarTexts(
        query,
        searchTexts,
        maxResults * 2, // Get more results to apply additional filtering
        0.0 // Get all results to see actual similarity scores
      );

      // Log all similarity scores for debugging
      if (this.logContext?.logEntry) {
        this.logContext.logEntry('\n🔍 RAW SIMILARITY SCORES:');
        similarityMatches.forEach((match, index) => {
          const item = items[match.index];
          this.logContext!.logEntry(`📋 ${index + 1}. "${item.title}" - Raw similarity: ${match.similarity.toFixed(4)}`);
        });
      }

      // Map back to knowledge items with enhanced scoring
      const scoredItems = similarityMatches.map(match => {
        const item = items[match.index];
        const enhancedScore = this.calculateEnhancedRelevanceScore(
          match.similarity,
          item,
          query,
          intent
        );

        // Log enhanced scoring details
        if (this.logContext?.logEntry) {
          this.logContext.logEntry(`📊 "${item.title}": Raw=${match.similarity.toFixed(4)} → Enhanced=${enhancedScore.toFixed(4)}`);
        }

        return {
          ...item,
          relevanceScore: enhancedScore
        };
      })
      .filter(item => {
        const passes = item.relevanceScore >= minRelevanceScore;
        if (this.logContext?.logEntry && !passes) {
          this.logContext.logEntry(`❌ "${item.title}" filtered out: ${item.relevanceScore.toFixed(4)} < ${minRelevanceScore}`);
        }
        return passes;
      })
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, maxResults);

      return scoredItems;
    } catch (error) {
      // Pure semantic search - no fallbacks
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Semantic search failed: ${errorMessage}. OpenAI API required for knowledge retrieval.`);
    }
  }

  /**
   * Calculate enhanced relevance score combining semantic similarity with domain logic
   */
  private calculateEnhancedRelevanceScore(
    semanticSimilarity: number,
    item: KnowledgeItem,
    query: string,
    intent: string
  ): number {
    let score = semanticSimilarity * 0.8; // Base semantic score (80% weight)

    // Intent-category bonus (10% weight)
    const categoryBonus = this.calculateCategoryRelevance(intent, item.category);
    score += categoryBonus * 0.1;

    // Tag matching bonus (10% weight)
    const tagBonus = this.calculateQueryTagRelevance(query, item.tags);
    score += tagBonus * 0.1;

    return Math.min(score, 1.0);
  }

  /**
   * Calculate semantic similarity score using embeddings
   * AI INSTRUCTIONS: Main method for semantic comparison
   */
  async calculateSimilarityScore(query: string, content: string): Promise<number> {
    try {
      const matches = await this.embeddingService.findSimilarTexts(
        query,
        [content],
        1,
        0.0 // No minimum threshold for single comparison
      );

      return matches.length > 0 ? matches[0].similarity : 0;
    } catch (error) {
      // Pure semantic search - no text fallbacks
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Semantic similarity calculation failed: ${errorMessage}. OpenAI API required.`);
    }
  }

  /**
   * Calculate category relevance based on intent
   */
  calculateCategoryRelevance(intent: string, category: string): number {
    const intentCategoryMap: Record<string, string[]> = {
      'sales_inquiry': ['product_info', 'pricing', 'features'],
      'support_request': ['support', 'troubleshooting', 'technical'],
      'faq_general': ['general', 'company_info'],
      'demo_request': ['product_info', 'features', 'demo'],
      'booking_request': ['booking', 'scheduling', 'contact']
    };

    const relevantCategories = intentCategoryMap[intent] || [];
    return relevantCategories.includes(category) ? 1.0 : 0.3;
  }

  /**
   * Calculate tag relevance for query
   */
  calculateQueryTagRelevance(query: string, tags: string[]): number {
    if (!tags || tags.length === 0) return 0;
    
    const queryLower = query.toLowerCase();
    const matchingTags = tags.filter(tag => 
      queryLower.includes(tag.toLowerCase()) || 
      tag.toLowerCase().includes(queryLower)
    );
    
    return matchingTags.length / tags.length;
  }

  /**
   * Precompute embeddings for knowledge base items
   * 
   * AI INSTRUCTIONS:
   * - Include tags in embedding content for better semantic matching
   * - Tags enhance vector search precision by providing semantic anchors
   * - Follows 2025 RAG best practices for tag-enhanced embeddings
   */
  async precomputeEmbeddings(items: KnowledgeItem[]): Promise<void> {
    const knowledgeItems = items.map(item => ({
      id: item.id,
      content: this.buildEmbeddingContent(item)
    }));

    await this.embeddingService.precomputeKnowledgeBaseEmbeddings(knowledgeItems);
    this.isInitialized = true;
  }

  /**
   * Build optimized content for embedding that includes tags
   * 
   * AI INSTRUCTIONS:
   * - Combines title, content, and tags for comprehensive vectorization
   * - Tags provide semantic anchors that improve search precision
   * - Structured format helps embedding model understand content relationships
   */
  private buildEmbeddingContent(item: KnowledgeItem): string {
    let embeddingText = `${item.title}\n\n${item.content}`;
    
    // Add tags as semantic anchors
    if (item.tags && item.tags.length > 0) {
      embeddingText += `\n\nRelevant topics: ${item.tags.join(', ')}`;
    }
    
    // Add category for additional context
    embeddingText += `\n\nCategory: ${item.category}`;
    
    return embeddingText;
  }

  /**
   * Check if embeddings are precomputed
   */
  isReady(): boolean {
    return this.isInitialized;
  }

  /**
   * Clear embedding cache
   */
  clearCache(): void {
    this.embeddingService.clearCache();
    this.isInitialized = false;
  }
} 