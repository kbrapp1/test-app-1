/**
 * OpenAI Embedding Provider Service
 * 
 * AI INSTRUCTIONS:
 * - Infrastructure service for OpenAI API calls and response handling
 * - Handle API communication, logging, and error management
 * - Keep under 250 lines by focusing on API operations
 * - Follow @golden-rule patterns exactly
 * - Single responsibility: OpenAI API integration
 */

import OpenAI from 'openai';
import {
  EmbeddingResult,
  EmbeddingLogContext,
  OpenAIEmbeddingRequest,
  OpenAIEmbeddingResponse,
  EMBEDDING_CONSTANTS
} from '../../../../domain/services/interfaces/EmbeddingTypes';

export class OpenAIEmbeddingProviderService {
  private client: OpenAI;
  private logContext?: EmbeddingLogContext;

  constructor(apiKey: string, logContext?: EmbeddingLogContext) {
    this.client = new OpenAI({
      apiKey,
      timeout: EMBEDDING_CONSTANTS.API_TIMEOUT
    });
    this.logContext = logContext;
  }

  /**
   * Set logging context for API call logging
   * 
   * AI INSTRUCTIONS:
   * - Allow dynamic logging context updates
   * - Enable/disable logging based on context availability
   * - Support testing and production scenarios
   */
  setLogContext(logContext: EmbeddingLogContext): void {
    this.logContext = logContext;
  }

  /**
   * Generate single embedding via OpenAI API
   * 
   * AI INSTRUCTIONS:
   * - Handle single text embedding requests
   * - Comprehensive API logging for debugging
   * - Error handling with detailed context
   */
  async generateSingleEmbedding(text: string): Promise<EmbeddingResult> {
    this.log('🔄 Single embedding API call initiated');
    this.logApiCallStart('SINGLE');

    try {
      const apiRequest: OpenAIEmbeddingRequest = {
        model: EMBEDDING_CONSTANTS.DEFAULT_MODEL,
        input: text.trim(),
        encoding_format: 'float'
      };

      this.logApiRequest(apiRequest, text);

      const startTime = Date.now();
      const response = await this.client.embeddings.create(apiRequest);
      const duration = Date.now() - startTime;

      this.logApiResponse(response, duration);

      const result: EmbeddingResult = {
        embedding: response.data[0].embedding,
        text: text.trim(),
        tokenCount: response.usage.total_tokens
      };

      this.logEmbeddingResult(result);
      this.logApiCallEnd();

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.log(`❌ Single embedding API call failed: ${errorMessage}`);
      this.logApiCallEnd();
      throw new Error(`Failed to generate embedding: ${errorMessage}`);
    }
  }

  /**
   * Generate batch embeddings via OpenAI API
   * 
   * AI INSTRUCTIONS:
   * - Handle multiple text embedding requests efficiently
   * - Batch processing for cost optimization
   * - Detailed logging for batch operations
   */
  async generateBatchEmbeddings(texts: string[]): Promise<EmbeddingResult[]> {
    const filteredTexts = texts.filter(t => t.trim().length > 0);
    
    if (filteredTexts.length === 0) {
      return [];
    }

    this.log(`🔄 Batch embedding API call initiated for ${filteredTexts.length} texts`);
    this.logApiCallStart('BATCH');

    try {
      const apiRequest: OpenAIEmbeddingRequest = {
        model: EMBEDDING_CONSTANTS.DEFAULT_MODEL,
        input: filteredTexts,
        encoding_format: 'float'
      };

      this.logBatchApiRequest(apiRequest, filteredTexts);

      const startTime = Date.now();
      const response = await this.client.embeddings.create(apiRequest);
      const duration = Date.now() - startTime;

      this.logApiResponse(response, duration);

      const results = response.data.map((item, index) => ({
        embedding: item.embedding,
        text: filteredTexts[index].trim(),
        tokenCount: Math.round(response.usage.total_tokens / filteredTexts.length) // Approximate
      }));

      this.logBatchEmbeddingResults(results, response.usage.total_tokens);
      this.logApiCallEnd();

      return results;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.log(`❌ Batch embedding API call failed: ${errorMessage}`);
      this.logApiCallEnd();
      throw new Error(`Failed to generate batch embeddings: ${errorMessage}`);
    }
  }

  /**
   * Log API call start
   * 
   * AI INSTRUCTIONS:
   * - Consistent logging format for API calls
   * - Include call type and timestamp
   * - Visual separation for log clarity
   */
  private logApiCallStart(callType: 'SINGLE' | 'BATCH'): void {
    this.log('🔗 =====================================');
    this.log(`🔗 OPENAI EMBEDDINGS API CALL - ${callType}`);
    this.log('🔗 =====================================');
  }

  /**
   * Log API call end
   * 
   * AI INSTRUCTIONS:
   * - Close API call logging section
   * - Visual separation for log clarity
   * - Consistent format across all calls
   */
  private logApiCallEnd(): void {
    this.log('🔗 =====================================');
  }

  /**
   * Log API request details
   * 
   * AI INSTRUCTIONS:
   * - Complete request logging for debugging
   * - Include headers, body, and metadata
   * - Redact sensitive information
   */
  private logApiRequest(request: OpenAIEmbeddingRequest, text: string): void {
    this.log('📤 COMPLETE API REQUEST:');
    this.log('🔗 Endpoint: https://api.openai.com/v1/embeddings');
    this.log('📋 Request Headers:');
    this.log(JSON.stringify({
      'Content-Type': 'application/json',
      'Authorization': 'Bearer [REDACTED]',
      'User-Agent': 'Chatbot-Widget-Embeddings/1.0'
    }, null, 2));
    this.log('📋 Request Body:');
    this.log(JSON.stringify(request, null, 2));
    this.log(`📋 Input Text Length: ${text.length} characters`);
    this.log(`📋 Input Text Preview: "${text.substring(0, 100)}${text.length > 100 ? '...' : ''}"`);
  }

  /**
   * Log batch API request details
   * 
   * AI INSTRUCTIONS:
   * - Specialized logging for batch requests
   * - Include batch size and text previews
   * - Detailed breakdown for each text
   */
  private logBatchApiRequest(request: OpenAIEmbeddingRequest, texts: string[]): void {
    this.log('📤 COMPLETE API REQUEST:');
    this.log('🔗 Endpoint: https://api.openai.com/v1/embeddings');
    this.log('📋 Request Headers:');
    this.log(JSON.stringify({
      'Content-Type': 'application/json',
      'Authorization': 'Bearer [REDACTED]',
      'User-Agent': 'Chatbot-Widget-Embeddings/1.0'
    }, null, 2));
    this.log('📋 Complete Request Body:');
    this.log(JSON.stringify(request, null, 2));
    this.log('📋 Batch Items Being Vectorized:');
    texts.forEach((text, index) => {
      this.log(`📄 Item ${index + 1}:`);
      this.log(`   Text: "${text}"`);
      this.log(`   Length: ${text.length} characters`);
      this.log('');
    });
  }

  /**
   * Log API response details
   * 
   * AI INSTRUCTIONS:
   * - Complete response logging for debugging
   * - Include timing, usage, and metadata
   * - Structured format for analysis
   */
  private logApiResponse(response: OpenAIEmbeddingResponse, duration: number): void {
    this.log(`✅ API Call Completed: ${new Date().toISOString()}`);
    this.log(`⏱️  Duration: ${duration}ms`);
    this.log('📥 COMPLETE API RESPONSE:');
    this.log('📋 Response Headers:');
    this.log(JSON.stringify({
      'content-type': 'application/json',
      'openai-model': response.model || 'N/A',
      'openai-version': 'N/A'
    }, null, 2));
    this.log('📋 Response Summary:');
    this.log(JSON.stringify({
      model: response.model,
      usage: response.usage,
      data_count: response.data.length,
      embedding_dimensions: response.data[0]?.embedding?.length || 0
    }, null, 2));
  }

  /**
   * Log single embedding result
   * 
   * AI INSTRUCTIONS:
   * - Detailed logging for single embedding results
   * - Include vector dimensions and token usage
   * - Useful for debugging and optimization
   */
  private logEmbeddingResult(result: EmbeddingResult): void {
    this.log('🔧 EMBEDDING RESULT:');
    this.log(`📊 Vector Dimensions: ${result.embedding.length}`);
    this.log(`📊 Token Count: ${result.tokenCount}`);
    this.log(`📊 Text Length: ${result.text.length} characters`);
  }

  /**
   * Log batch embedding results
   * 
   * AI INSTRUCTIONS:
   * - Specialized logging for batch results
   * - Include aggregate statistics
   * - Performance metrics for optimization
   */
  private logBatchEmbeddingResults(results: EmbeddingResult[], totalTokens: number): void {
    this.log('🔧 BATCH EMBEDDING RESULTS:');
    this.log(`📊 Embeddings Generated: ${results.length}`);
    if (results.length > 0) {
      this.log(`📊 Average Vector Dimensions: ${results[0].embedding.length}`);
    }
    this.log(`📊 Total Tokens Used: ${totalTokens}`);
    this.log(`📊 Average Tokens per Text: ${Math.round(totalTokens / results.length)}`);
  }

  /**
   * Log entry with fallback to no-op if no context
   * 
   * AI INSTRUCTIONS:
   * - Safe logging that handles missing context
   * - No-op when logging context unavailable
   * - Consistent interface for all logging
   */
  private log(message: string): void {
    if (this.logContext) {
      this.logContext.logEntry(message);
    }
  }
} 