/**
 * AI Processing and Knowledge Management Domain Errors
 * 
 * AI INSTRUCTIONS:
 * - Single responsibility: AI/LLM processing and knowledge base errors
 * - Follow @golden-rule DDD error handling patterns exactly
 * - Create specific error types for each AI processing business rule
 * - Include relevant context for debugging and optimization
 * - Keep under 250 lines - focused domain responsibility
 * - Import base patterns from DomainErrorBase
 */

import { DomainError, ErrorSeverity } from './base/DomainErrorBase';

// ===== AI & LLM PROCESSING ERRORS =====

export class AIResponseGenerationError extends DomainError {
  readonly code = 'AI_RESPONSE_GENERATION_FAILED';
  readonly severity = ErrorSeverity.HIGH;
  
  constructor(modelName: string, context: Record<string, unknown> = {}) {
    super(`AI response generation failed for model: ${modelName}`, context);
  }
}

export class TokenLimitExceededError extends DomainError {
  readonly code = 'TOKEN_LIMIT_EXCEEDED';
  readonly severity = ErrorSeverity.MEDIUM;
  
  constructor(tokenCount: number, limit: number, context: Record<string, unknown> = {}) {
    super(`Token limit exceeded: ${tokenCount}/${limit}`, { ...context, tokenCount, limit });
  }
}

export class ModelConfigurationError extends DomainError {
  readonly code = 'MODEL_CONFIGURATION_ERROR';
  readonly severity = ErrorSeverity.HIGH;
  
  constructor(configType: string, context: Record<string, unknown> = {}) {
    super(`Model configuration error: ${configType}`, context);
  }
}

export class EmbeddingGenerationError extends DomainError {
  readonly code = 'EMBEDDING_GENERATION_FAILED';
  readonly severity = ErrorSeverity.HIGH;
  
  constructor(contentType: string, context: Record<string, unknown> = {}) {
    super(`Embedding generation failed for: ${contentType}`, context);
  }
}

// ===== KNOWLEDGE BASE ERRORS =====

export class KnowledgeRetrievalError extends DomainError {
  readonly code = 'KNOWLEDGE_RETRIEVAL_FAILED';
  readonly severity = ErrorSeverity.HIGH;
  
  constructor(queryType: string, context: Record<string, unknown> = {}) {
    super(`Knowledge retrieval failed for: ${queryType}`, context);
  }
}

export class VectorSearchError extends DomainError {
  readonly code = 'VECTOR_SEARCH_FAILED';
  readonly severity = ErrorSeverity.HIGH;
  
  constructor(searchType: string, context: Record<string, unknown> = {}) {
    super(`Vector search failed: ${searchType}`, context);
  }
}

export class KnowledgeIndexingError extends DomainError {
  readonly code = 'KNOWLEDGE_INDEXING_FAILED';
  readonly severity = ErrorSeverity.HIGH;
  
  constructor(contentType: string, context: Record<string, unknown> = {}) {
    super(`Knowledge indexing failed for: ${contentType}`, context);
  }
}

export class KnowledgeCacheError extends DomainError {
  readonly code = 'KNOWLEDGE_CACHE_ERROR';
  readonly severity = ErrorSeverity.MEDIUM;
  
  constructor(operation: string, context: Record<string, unknown> = {}) {
    super(`Knowledge cache error during: ${operation}`, context);
  }
}

// ===== WEBSITE CRAWLING & CONTENT PROCESSING ERRORS =====

export class WebsiteCrawlingError extends DomainError {
  readonly code = 'WEBSITE_CRAWLING_FAILED';
  readonly severity = ErrorSeverity.HIGH;
  
  constructor(url: string, reason: string, context: Record<string, unknown> = {}) {
    super(`Website crawling failed for ${url}: ${reason}`, { ...context, url, reason });
  }
}

export class ContentExtractionError extends DomainError {
  readonly code = 'CONTENT_EXTRACTION_FAILED';
  readonly severity = ErrorSeverity.MEDIUM;
  
  constructor(reason: string, context: Record<string, unknown> = {}) {
    super(`Content extraction failed: ${reason}`, context);
  }
}

export class InvalidUrlError extends DomainError {
  readonly code = 'INVALID_URL';
  readonly severity = ErrorSeverity.HIGH;
  
  constructor(url: string, reason: string, context: Record<string, unknown> = {}) {
    super(`Invalid URL: ${url} - ${reason}`, { ...context, url, reason });
  }
}

export class WebsiteAccessibilityError extends DomainError {
  readonly code = 'WEBSITE_INACCESSIBLE';
  readonly severity = ErrorSeverity.HIGH;
  
  constructor(url: string, reason: string, context: Record<string, unknown> = {}) {
    super(`Website accessibility issue for ${url}: ${reason}`, { ...context, url, reason });
  }
}

export class CrawlLimitExceededError extends DomainError {
  readonly code = 'CRAWL_LIMIT_EXCEEDED';
  readonly severity = ErrorSeverity.MEDIUM;
  
  constructor(limit: number, attempted: number, context: Record<string, unknown> = {}) {
    super(`Crawl limit exceeded: attempted ${attempted}, limit ${limit}`, { ...context, limit, attempted });
  }
}

export class RobotsTxtViolationError extends DomainError {
  readonly code = 'ROBOTS_TXT_VIOLATION';
  readonly severity = ErrorSeverity.MEDIUM;
  
  constructor(url: string, rule: string, context: Record<string, unknown> = {}) {
    super(`Robots.txt violation for ${url}: ${rule}`, { ...context, url, rule });
  }
}

export class ContentCategorizationError extends DomainError {
  readonly code = 'CONTENT_CATEGORIZATION_FAILED';
  readonly severity = ErrorSeverity.LOW;
  
  constructor(reason: string, context: Record<string, unknown> = {}) {
    super(`Content categorization failed: ${reason}`, context);
  }
}

export class ContentDeduplicationError extends DomainError {
  readonly code = 'CONTENT_DEDUPLICATION_FAILED';
  readonly severity = ErrorSeverity.LOW;
  
  constructor(algorithm: string, context: Record<string, unknown> = {}) {
    super(`Content deduplication failed using: ${algorithm}`, context);
  }
}

export class UrlNormalizationError extends DomainError {
  readonly code = 'URL_NORMALIZATION_FAILED';
  readonly severity = ErrorSeverity.LOW;
  
  constructor(url: string, context: Record<string, unknown> = {}) {
    super(`URL normalization failed for: ${url}`, { ...context, url });
  }
} 