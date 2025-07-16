/**
 * EmbeddingBatchApplicationService
 * 
 * AI INSTRUCTIONS:
 * - Orchestrates the batching of embedding requests for efficiency.
 * - Delegates all OpenAI API calls and their rate limiting to the central OpenAIApplicationService.
 * - Contains no rate-limiting logic itself; focuses purely on batch workflow.
 * - Follow @golden-rule patterns exactly.
 */

import { OpenAICompositionRoot } from '../../../openai/infrastructure/composition/OpenAICompositionRoot';
import { OpenAIApplicationService } from '../../../openai/application/services/OpenAIApplicationService';
import { logger } from '../../../logging';
import { BusinessRuleViolationError } from '../../domain/errors/ChatbotWidgetDomainErrors';

const SERVICE_NAME = 'EmbeddingBatchApplicationService';

export interface EmbeddingRequest {
  id: string;
  content: string;
  metadata: Record<string, unknown>;
}

export interface EmbeddingResult {
  id: string;
  content: string;
  embedding: number[];
  metadata: Record<string, unknown>;
}

export interface BatchProcessingResult {
  successfulItems: EmbeddingResult[];
  failedItems: Array<{
    item: EmbeddingRequest;
    error: string;
  }>;
  totalProcessed: number;
  totalTokensUsed: number;
}

export interface EmbeddingProvider {
  createEmbeddings(texts: string[]): Promise<number[][]>;
  estimateTokenCount(text: string): number;
}

export class EmbeddingBatchApplicationService {
  private readonly openaiService: OpenAIApplicationService;

  constructor(private readonly embeddingProvider: EmbeddingProvider) {
    this.openaiService = OpenAICompositionRoot.getInstance();
  }

  /**
   * Processes a list of embedding requests in batches.
   *
   * @param requests - The full list of items to embed.
   * @param maxBatchSize - The maximum number of items to include in a single API call.
   * @returns The results of the batch processing.
   */
  public async process(
    requests: EmbeddingRequest[],
    maxBatchSize = 100, // A conservative default
  ): Promise<BatchProcessingResult> {
    if (!requests) {
      throw new BusinessRuleViolationError('Embedding requests are required.');
    }

    const result: BatchProcessingResult = {
      successfulItems: [],
      failedItems: [],
      totalProcessed: 0,
      totalTokensUsed: 0,
    };

    if (requests.length === 0) {
      return result;
    }

    const batches = this.createBatches(requests, maxBatchSize);
    logger.info({
      message: `📦 Created ${batches.length} batches for processing ${requests.length} items.`,
      service: SERVICE_NAME,
      batchCount: batches.length,
      requestCount: requests.length,
    });

    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      const batchResult = await this.processSingleBatch(
        batch,
        i + 1,
        batches.length,
      );

      result.successfulItems.push(...batchResult.successfulItems);
      result.failedItems.push(...batchResult.failedItems);
      result.totalProcessed += batchResult.totalProcessed;
      result.totalTokensUsed += batchResult.totalTokensUsed;
    }

    logger.info({
      message: `🎉 Batch processing completed: ${result.successfulItems.length}/${requests.length} successful.`,
      service: SERVICE_NAME,
      successfulCount: result.successfulItems.length,
      failedCount: result.failedItems.length,
      totalTokens: result.totalTokensUsed,
    });

    return result;
  }

  private createBatches(
    requests: EmbeddingRequest[],
    maxBatchSize: number,
  ): EmbeddingRequest[][] {
    const batches: EmbeddingRequest[][] = [];
    for (let i = 0; i < requests.length; i += maxBatchSize) {
      batches.push(requests.slice(i, i + maxBatchSize));
    }
    return batches;
  }

  private async processSingleBatch(
    batch: EmbeddingRequest[],
    batchNumber: number,
    totalBatches: number,
  ): Promise<BatchProcessingResult> {
    const batchTexts = batch.map(item => item.content);
    const estimatedTokens = batchTexts
      .map(text => this.embeddingProvider.estimateTokenCount(text))
      .reduce((a, b) => a + b, 0);

    logger.info({
      message: `🚀 Processing batch ${batchNumber}/${totalBatches} (${batch.length} items, ~${estimatedTokens} tokens)`,
      service: SERVICE_NAME,
      batchNumber,
      totalBatches,
      itemCount: batch.length,
      estimatedTokens,
    });

    try {
      const embeddings = await this.openaiService.execute(
        () => this.embeddingProvider.createEmbeddings(batchTexts),
        estimatedTokens,
      );

      const successfulItems: EmbeddingResult[] = batch.map((item, index) => ({
        id: item.id,
        content: item.content,
        embedding: embeddings[index],
        metadata: item.metadata,
      }));

      logger.info({
        message: `✅ Batch ${batchNumber} completed successfully.`,
        service: SERVICE_NAME,
        batchNumber,
      });

      return {
        successfulItems,
        failedItems: [],
        totalProcessed: batch.length,
        totalTokensUsed: estimatedTokens,
      };
    } catch (error: unknown) {
      logger.error({
        message: `❌ Batch ${batchNumber} failed permanently.`,
        service: SERVICE_NAME,
        batchNumber,
        errorMessage: error instanceof Error ? error.message : String(error),
      });

      // If the whole batch fails, mark all items as failed.
      return {
        successfulItems: [],
        failedItems: batch.map(item => ({
          item,
          error: `Batch failed: ${error instanceof Error ? error.message : String(error)}`,
        })),
        totalProcessed: batch.length,
        totalTokensUsed: 0,
      };
    }
  }
} 