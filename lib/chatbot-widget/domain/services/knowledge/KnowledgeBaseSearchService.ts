import type { FAQ, WebsiteSource } from '../../value-objects/ai-configuration/KnowledgeBase';

/**
 * Knowledge Base Search Service
 * 
 * AI INSTRUCTIONS:
 * - Pure domain service for knowledge base search operations
 * - Contains search business logic and algorithms
 * - No external dependencies - pure business logic
 * - Complements vector-based search with text-based fallback
 * - Follow @golden-rule patterns exactly
 */
export class KnowledgeBaseSearchService {
  /**
   * Search FAQs with enhanced text-based algorithm
   * NOTE: This is a fallback for basic filtering. 
   * For semantic search, use VectorKnowledgeQueryRepository instead
   */
  static searchFAQs(faqs: FAQ[], query: string): FAQ[] {
    if (!query?.trim()) {
      return faqs.filter(faq => faq.isActive);
    }

    const normalizedQuery = this.normalizeSearchQuery(query);
    const searchTerms = this.extractSearchTerms(normalizedQuery);

    return faqs
      .filter(faq => faq.isActive)
      .map(faq => ({
        faq,
        relevanceScore: this.calculateFAQRelevanceScore(faq, searchTerms, normalizedQuery)
      }))
      .filter(result => result.relevanceScore > 0)
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .map(result => result.faq);
  }

  /**
   * Search website sources by URL, name, or description
   */
  static searchWebsiteSources(sources: WebsiteSource[], query: string): WebsiteSource[] {
    if (!query?.trim()) {
      return sources.filter(source => source.isActive);
    }

    const normalizedQuery = this.normalizeSearchQuery(query);
    const searchTerms = this.extractSearchTerms(normalizedQuery);

    return sources
      .filter(source => source.isActive)
      .map(source => ({
        source,
        relevanceScore: this.calculateSourceRelevanceScore(source, searchTerms, normalizedQuery)
      }))
      .filter(result => result.relevanceScore > 0)
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .map(result => result.source);
  }

  /**
   * Get FAQ categories with search capability
   */
  static searchFAQCategories(faqs: FAQ[], query?: string): string[] {
    const activeFAQs = faqs.filter(faq => faq.isActive);
    const categories = new Set(activeFAQs.map(faq => faq.category));
    const categoryArray = Array.from(categories);

    if (!query?.trim()) {
      return categoryArray.sort();
    }

    const normalizedQuery = this.normalizeSearchQuery(query);
    return categoryArray
      .filter(category => 
        this.normalizeSearchQuery(category).includes(normalizedQuery)
      )
      .sort();
  }

  /**
   * Get FAQs by category with optional search within category
   */
  static searchFAQsByCategory(faqs: FAQ[], category: string, query?: string): FAQ[] {
    const categoryFAQs = faqs.filter(faq => 
      faq.category === category && faq.isActive
    );

    if (!query?.trim()) {
      return categoryFAQs;
    }

    return this.searchFAQs(categoryFAQs, query);
  }

  /**
   * Find similar FAQs based on question content
   */
  static findSimilarFAQs(faqs: FAQ[], targetFAQ: FAQ, limit: number = 5): FAQ[] {
    const targetTerms = this.extractSearchTerms(
      this.normalizeSearchQuery(targetFAQ.question)
    );

    return faqs
      .filter(faq => faq.isActive && faq.id !== targetFAQ.id)
      .map(faq => ({
        faq,
        similarityScore: this.calculateFAQSimilarityScore(faq, targetTerms)
      }))
      .filter(result => result.similarityScore > 0.2) // Minimum similarity threshold
      .sort((a, b) => b.similarityScore - a.similarityScore)
      .slice(0, limit)
      .map(result => result.faq);
  }

  /**
   * Search across all knowledge base content
   */
  static searchAllContent(
    faqs: FAQ[], 
    sources: WebsiteSource[], 
    companyInfo: string,
    productCatalog: string,
    supportDocs: string,
    query: string
  ): {
    faqs: FAQ[];
    sources: WebsiteSource[];
    hasCompanyInfoMatch: boolean;
    hasProductCatalogMatch: boolean;
    hasSupportDocsMatch: boolean;
  } {
    const normalizedQuery = this.normalizeSearchQuery(query);
    
    return {
      faqs: this.searchFAQs(faqs, query),
      sources: this.searchWebsiteSources(sources, query),
      hasCompanyInfoMatch: this.normalizeSearchQuery(companyInfo).includes(normalizedQuery),
      hasProductCatalogMatch: this.normalizeSearchQuery(productCatalog).includes(normalizedQuery),
      hasSupportDocsMatch: this.normalizeSearchQuery(supportDocs).includes(normalizedQuery)
    };
  }

  // Private helper methods
  private static normalizeSearchQuery(text: string): string {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s]/g, ' ') // Replace punctuation with spaces
      .replace(/\s+/g, ' '); // Normalize whitespace
  }

  private static extractSearchTerms(normalizedQuery: string): string[] {
    return normalizedQuery
      .split(' ')
      .filter(term => term.length > 2) // Filter out very short terms
      .filter((term, index, array) => array.indexOf(term) === index); // Remove duplicates
  }

  private static calculateFAQRelevanceScore(
    faq: FAQ, 
    searchTerms: string[], 
    normalizedQuery: string
  ): number {
    let score = 0;
    
    const normalizedQuestion = this.normalizeSearchQuery(faq.question);
    const normalizedAnswer = this.normalizeSearchQuery(faq.answer);
    const normalizedCategory = this.normalizeSearchQuery(faq.category);

    // Exact phrase match in question (highest priority)
    if (normalizedQuestion.includes(normalizedQuery)) {
      score += 10;
    }

    // Exact phrase match in answer
    if (normalizedAnswer.includes(normalizedQuery)) {
      score += 5;
    }

    // Exact phrase match in category
    if (normalizedCategory.includes(normalizedQuery)) {
      score += 3;
    }

    // Individual term matches
    searchTerms.forEach(term => {
      if (normalizedQuestion.includes(term)) {
        score += 3;
      }
      if (normalizedAnswer.includes(term)) {
        score += 1;
      }
      if (normalizedCategory.includes(term)) {
        score += 2;
      }
    });

    // Boost score for multiple term matches
    const questionTermMatches = searchTerms.filter(term => 
      normalizedQuestion.includes(term)
    ).length;
    
    if (questionTermMatches > 1) {
      score += questionTermMatches * 2;
    }

    return score;
  }

  private static calculateSourceRelevanceScore(
    source: WebsiteSource, 
    searchTerms: string[], 
    normalizedQuery: string
  ): number {
    let score = 0;
    
    const normalizedName = this.normalizeSearchQuery(source.name);
    const normalizedUrl = this.normalizeSearchQuery(source.url);
    const normalizedDescription = this.normalizeSearchQuery(source.description || '');

    // Exact phrase matches
    if (normalizedName.includes(normalizedQuery)) {
      score += 10;
    }
    if (normalizedUrl.includes(normalizedQuery)) {
      score += 8;
    }
    if (normalizedDescription.includes(normalizedQuery)) {
      score += 5;
    }

    // Individual term matches
    searchTerms.forEach(term => {
      if (normalizedName.includes(term)) {
        score += 4;
      }
      if (normalizedUrl.includes(term)) {
        score += 2;
      }
      if (normalizedDescription.includes(term)) {
        score += 1;
      }
    });

    return score;
  }

  private static calculateFAQSimilarityScore(faq: FAQ, targetTerms: string[]): number {
    const faqTerms = this.extractSearchTerms(
      this.normalizeSearchQuery(faq.question)
    );

    if (faqTerms.length === 0 || targetTerms.length === 0) {
      return 0;
    }

    // Calculate Jaccard similarity (intersection over union)
    const intersection = faqTerms.filter(term => targetTerms.includes(term));
    const unionSet = new Set([...faqTerms, ...targetTerms]);
    const union = Array.from(unionSet);

    const jaccardSimilarity = intersection.length / union.length;

    // Weight by question length similarity
    const lengthSimilarity = 1 - Math.abs(faq.question.length - targetTerms.join(' ').length) / 
                            Math.max(faq.question.length, targetTerms.join(' ').length);

    return (jaccardSimilarity * 0.7) + (lengthSimilarity * 0.3);
  }
}