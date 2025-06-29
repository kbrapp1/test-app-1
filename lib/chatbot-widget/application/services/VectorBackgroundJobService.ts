/**
 * Vector Background Job Service
 * 
 * AI INSTRUCTIONS:
 * - Handles large-scale vector generation in background
 * - Provides job status tracking and progress monitoring
 * - Prevents blocking user operations during bulk processing
 * - Implements queue-based processing for scalability
 */

import { VectorManagementService } from './VectorManagementService';
import { KnowledgeItem } from '../../domain/services/interfaces/IKnowledgeRetrievalService';

export interface VectorGenerationJob {
  id: string;
  organizationId: string;
  chatbotConfigId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  totalItems: number;
  processedItems: number;
  startedAt?: Date;
  completedAt?: Date;
  error?: string;
  estimatedTimeRemainingMs?: number;
}

export interface VectorGenerationJobRequest {
  organizationId: string;
  chatbotConfigId: string;
  knowledgeItems: KnowledgeItem[];
  priority: 'high' | 'normal' | 'low';
  batchSize?: number;
}

/**
 * Background Job Service for Vector Generation
 * 
 * AI INSTRUCTIONS:
 * - Processes large knowledge bases without blocking user interactions
 * - Provides real-time progress tracking and status updates
 * - Implements intelligent batching for optimal performance
 * - Handles job failures with retry mechanisms
 */
export class VectorBackgroundJobService {
  private jobs = new Map<string, VectorGenerationJob>();
  private jobQueue: string[] = [];
  private isProcessing = false;

  constructor(
    private vectorManagementService: VectorManagementService
  ) {}

  /**
   * Queue vector generation job for background processing
   * 
   * AI INSTRUCTIONS:
   * - Creates job entry with unique ID and metadata
   * - Adds to processing queue based on priority
   * - Returns job ID for status tracking
   * - Starts processing if queue is idle
   */
  async queueVectorGeneration(request: VectorGenerationJobRequest): Promise<string> {
    const jobId = crypto.randomUUID();
    const job: VectorGenerationJob = {
      id: jobId,
      organizationId: request.organizationId,
      chatbotConfigId: request.chatbotConfigId,
      status: 'pending',
      totalItems: request.knowledgeItems.length,
      processedItems: 0
    };

    this.jobs.set(jobId, job);

    // Add to queue based on priority
    if (request.priority === 'high') {
      this.jobQueue.unshift(jobId);
    } else {
      this.jobQueue.push(jobId);
    }

    console.log(`\n📋 VECTOR GENERATION JOB QUEUED`);
    console.log(`   Job ID: ${jobId}`);
    console.log(`   Priority: ${request.priority}`);
    console.log(`   Knowledge Items: ${request.knowledgeItems.length}`);
    console.log(`   Queue Position: ${this.jobQueue.indexOf(jobId) + 1}`);

    // Store knowledge items temporarily (in real implementation, this would be persisted)
    (job as any).knowledgeItems = request.knowledgeItems;
    (job as any).batchSize = request.batchSize || 10;

    // Start processing if not already running
    if (!this.isProcessing) {
      this.processJobQueue();
    }

    return jobId;
  }

  /**
   * Get job status and progress
   * 
   * AI INSTRUCTIONS:
   * - Returns current job status with progress metrics
   * - Calculates estimated time remaining based on processing rate
   * - Provides detailed error information if job failed
   */
  getJobStatus(jobId: string): VectorGenerationJob | null {
    const job = this.jobs.get(jobId);
    if (!job) return null;

    // Calculate estimated time remaining
    if (job.status === 'processing' && job.startedAt) {
      const elapsedMs = Date.now() - job.startedAt.getTime();
      const itemsPerMs = job.processedItems / elapsedMs;
      const remainingItems = job.totalItems - job.processedItems;
      job.estimatedTimeRemainingMs = Math.round(remainingItems / itemsPerMs);
    }

    return { ...job };
  }

  /**
   * Get all jobs for an organization
   */
  getJobsForOrganization(organizationId: string): VectorGenerationJob[] {
    return Array.from(this.jobs.values())
      .filter(job => job.organizationId === organizationId)
      .sort((a, b) => (b.startedAt?.getTime() || 0) - (a.startedAt?.getTime() || 0));
  }

  /**
   * Cancel a pending job
   */
  cancelJob(jobId: string): boolean {
    const job = this.jobs.get(jobId);
    if (!job || job.status !== 'pending') return false;

    // Remove from queue
    const queueIndex = this.jobQueue.indexOf(jobId);
    if (queueIndex > -1) {
      this.jobQueue.splice(queueIndex, 1);
    }

    // Mark as failed
    job.status = 'failed';
    job.error = 'Job cancelled by user';
    job.completedAt = new Date();

    console.log(`❌ VECTOR GENERATION JOB CANCELLED: ${jobId}`);
    return true;
  }

  /**
   * Process job queue in background
   * 
   * AI INSTRUCTIONS:
   * - Processes jobs sequentially to avoid overwhelming OpenAI API
   * - Implements intelligent batching for optimal performance
   * - Provides real-time progress updates
   * - Handles failures gracefully with detailed error logging
   */
  private async processJobQueue(): Promise<void> {
    if (this.isProcessing) return;
    this.isProcessing = true;

    console.log(`\n🔄 BACKGROUND JOB PROCESSOR STARTED`);
    console.log(`   Queue Length: ${this.jobQueue.length}`);

    while (this.jobQueue.length > 0) {
      const jobId = this.jobQueue.shift()!;
      const job = this.jobs.get(jobId);

      if (!job) continue;

      try {
        await this.processJob(job);
      } catch (error) {
        console.error(`❌ Job ${jobId} failed:`, error);
        job.status = 'failed';
        job.error = error instanceof Error ? error.message : 'Unknown error';
        job.completedAt = new Date();
      }
    }

    console.log(`✅ BACKGROUND JOB PROCESSOR COMPLETED`);
    this.isProcessing = false;
  }

  /**
   * Process individual job with batching
   * 
   * AI INSTRUCTIONS:
   * - Processes knowledge items in batches to avoid memory issues
   * - Updates progress after each batch for real-time monitoring
   * - Implements smart caching to skip unchanged content
   * - Provides comprehensive performance logging
   */
  private async processJob(job: VectorGenerationJob): Promise<void> {
    console.log(`\n🚀 PROCESSING VECTOR GENERATION JOB: ${job.id}`);
    
    job.status = 'processing';
    job.startedAt = new Date();
    
    const knowledgeItems = (job as any).knowledgeItems as KnowledgeItem[];
    const batchSize = (job as any).batchSize as number;
    
    for (let i = 0; i < knowledgeItems.length; i += batchSize) {
      const batch = knowledgeItems.slice(i, i + batchSize);
      const batchNumber = Math.floor(i / batchSize) + 1;
      const totalBatches = Math.ceil(knowledgeItems.length / batchSize);
      
      console.log(`   Processing batch ${batchNumber}/${totalBatches} (${batch.length} items)`);
      
      try {
        await this.vectorManagementService.ensureVectorsUpToDate(
          job.organizationId,
          job.chatbotConfigId,
          batch
        );
        
        job.processedItems = Math.min(i + batchSize, knowledgeItems.length);
        
        console.log(`   Progress: ${job.processedItems}/${job.totalItems} (${((job.processedItems / job.totalItems) * 100).toFixed(1)}%)`);
        
        // Small delay to avoid overwhelming the API
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        console.error(`   Batch ${batchNumber} failed:`, error);
        throw error;
      }
    }
    
    job.status = 'completed';
    job.completedAt = new Date();
    job.processedItems = job.totalItems;
    
    const processingTimeMs = job.completedAt.getTime() - job.startedAt!.getTime();
    
    console.log(`✅ JOB COMPLETED: ${job.id}`);
    console.log(`   Processing Time: ${processingTimeMs}ms`);
    console.log(`   Items Processed: ${job.totalItems}`);
    console.log(`   Average Time per Item: ${(processingTimeMs / job.totalItems).toFixed(2)}ms`);
    
    // Clean up temporary data
    delete (job as any).knowledgeItems;
    delete (job as any).batchSize;
  }

  /**
   * Get queue statistics
   */
  getQueueStats(): {
    queueLength: number;
    isProcessing: boolean;
    totalJobs: number;
    completedJobs: number;
    failedJobs: number;
  } {
    const jobs = Array.from(this.jobs.values());
    
    return {
      queueLength: this.jobQueue.length,
      isProcessing: this.isProcessing,
      totalJobs: jobs.length,
      completedJobs: jobs.filter(j => j.status === 'completed').length,
      failedJobs: jobs.filter(j => j.status === 'failed').length
    };
  }

  /**
   * Clean up completed jobs older than specified age
   */
  cleanupOldJobs(maxAgeMs: number = 24 * 60 * 60 * 1000): number { // Default: 24 hours
    const cutoffTime = Date.now() - maxAgeMs;
    let cleanedCount = 0;

    for (const [jobId, job] of this.jobs.entries()) {
      if (job.status === 'completed' || job.status === 'failed') {
        const jobTime = job.completedAt?.getTime() || job.startedAt?.getTime() || 0;
        if (jobTime < cutoffTime) {
          this.jobs.delete(jobId);
          cleanedCount++;
        }
      }
    }

    if (cleanedCount > 0) {
      console.log(`🧹 Cleaned up ${cleanedCount} old vector generation jobs`);
    }

    return cleanedCount;
  }
} 