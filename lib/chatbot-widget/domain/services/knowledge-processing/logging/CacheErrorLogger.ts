/**
 * Cache Error Logger
 * 
 * Domain service specialized for logging cache initialization and memory management errors.
 * Focuses on vector cache lifecycle, memory optimization, and storage concerns.
 */

import { ISessionLogger } from '../../interfaces/IChatbotLoggingService';
import { CacheInitializationError, MemoryManagementError } from '../../../errors/KnowledgeProcessingError';

export interface CacheErrorContext {
  vectorCount: number;
  maxMemoryKB: number;
  organizationId: string;
  cacheType?: 'in-memory' | 'persistent' | 'hybrid';
  storageBackend?: string;
}

export interface MemoryErrorContext {
  operation: 'eviction' | 'allocation' | 'cleanup';
  currentMemoryKB: number;
  targetMemoryKB?: number;
  vectorsAffected?: number;
  memoryPressure?: 'low' | 'medium' | 'high' | 'critical';
}

export class CacheErrorLogger {
  
  /**
   * Log cache initialization errors
   */
  static logCacheInitializationError(
    logger: ISessionLogger,
    error: Error | CacheInitializationError,
    context: CacheErrorContext & {
      initializationStage: string;
      loadedVectors?: number;
      failurePoint?: string;
    }
  ): void {
    logger.logMessage('❌ Cache Initialization Error:');
    logger.logMessage(`  Error: ${error.message}`);
    logger.logMessage(`  Stage: ${context.initializationStage}`);
    logger.logMessage(`  Target Vector Count: ${context.vectorCount}`);
    logger.logMessage(`  Max Memory Budget: ${context.maxMemoryKB} KB`);
    logger.logMessage(`  Organization: ${context.organizationId}`);
    
    if (context.cacheType) {
      logger.logMessage(`  Cache Type: ${context.cacheType}`);
    }

    if (context.storageBackend) {
      logger.logMessage(`  Storage Backend: ${context.storageBackend}`);
    }

    if (context.loadedVectors !== undefined) {
      const loadProgress = context.vectorCount > 0 ? 
        ((context.loadedVectors / context.vectorCount) * 100).toFixed(1) : '0';
      logger.logMessage(`  Loaded Vectors: ${context.loadedVectors} (${loadProgress}%)`);
    }

    if (context.failurePoint) {
      logger.logMessage(`  Failure Point: ${context.failurePoint}`);
    }
    
    logger.logError(error);

    // Log initialization metrics
    logger.logMetrics('cache-initialization-error', {
      duration: 0,
      customMetrics: {
        targetVectorCount: context.vectorCount,
        maxMemoryKB: context.maxMemoryKB,
        loadedVectors: context.loadedVectors || 0,
        isLargeCache: context.vectorCount > 50000 ? 1 : 0,
        isHighMemory: context.maxMemoryKB > 1000000 ? 1 : 0
      }
    });
  }

  /**
   * Log memory management errors
   */
  static logMemoryError(
    logger: ISessionLogger,
    error: Error | MemoryManagementError,
    context: MemoryErrorContext & {
      organizationId?: string;
      cacheUtilization?: number;
    }
  ): void {
    logger.logMessage('❌ Memory Management Error:');
    logger.logMessage(`  Error: ${error.message}`);
    logger.logMessage(`  Operation: ${context.operation}`);
    logger.logMessage(`  Current Memory: ${context.currentMemoryKB} KB`);
    
    if (context.targetMemoryKB) {
      logger.logMessage(`  Target Memory: ${context.targetMemoryKB} KB`);
      const memoryDelta = context.currentMemoryKB - context.targetMemoryKB;
      logger.logMessage(`  Memory Delta: ${memoryDelta > 0 ? '+' : ''}${memoryDelta} KB`);
    }
    
    if (context.vectorsAffected) {
      logger.logMessage(`  Vectors Affected: ${context.vectorsAffected}`);
    }

    if (context.memoryPressure) {
      logger.logMessage(`  Memory Pressure: ${context.memoryPressure}`);
    }

    if (context.cacheUtilization !== undefined) {
      logger.logMessage(`  Cache Utilization: ${(context.cacheUtilization * 100).toFixed(1)}%`);
    }

    if (context.organizationId) {
      logger.logMessage(`  Organization: ${context.organizationId}`);
    }
    
    logger.logError(error);
  }

  /**
   * Log cache eviction strategy failures
   */
  static logEvictionStrategyError(
    logger: ISessionLogger,
    error: Error,
    context: MemoryErrorContext & {
      evictionStrategy: 'lru' | 'lfu' | 'random' | 'priority';
      candidatesFound: number;
      evictionTarget: number;
      organizationId: string;
    }
  ): void {
    logger.logMessage('❌ Cache Eviction Strategy Error:');
    logger.logMessage(`  Error: ${error.message}`);
    logger.logMessage(`  Strategy: ${context.evictionStrategy}`);
    logger.logMessage(`  Current Memory: ${context.currentMemoryKB} KB`);
    logger.logMessage(`  Target Memory: ${context.targetMemoryKB || 0} KB`);
    logger.logMessage(`  Eviction Candidates: ${context.candidatesFound}`);
    logger.logMessage(`  Eviction Target: ${context.evictionTarget}`);
    logger.logMessage(`  Organization: ${context.organizationId}`);
    
    const evictionEfficiency = context.evictionTarget > 0 ? 
      (context.candidatesFound / context.evictionTarget * 100).toFixed(1) : '0';
    logger.logMessage(`  Eviction Efficiency: ${evictionEfficiency}%`);
    
    logger.logError(error);
  }

  /**
   * Log cache corruption or integrity errors
   */
  static logCacheIntegrityError(
    logger: ISessionLogger,
    error: Error,
    context: CacheErrorContext & {
      corruptionType: 'vector_mismatch' | 'metadata_loss' | 'index_corruption' | 'memory_leak';
      affectedEntries: number;
      recoverableEntries?: number;
      checksumMismatch?: boolean;
    }
  ): void {
    logger.logMessage('🚨 Cache Integrity Error:');
    logger.logMessage(`  Error: ${error.message}`);
    logger.logMessage(`  Corruption Type: ${context.corruptionType}`);
    logger.logMessage(`  Total Vectors: ${context.vectorCount}`);
    logger.logMessage(`  Affected Entries: ${context.affectedEntries}`);
    logger.logMessage(`  Organization: ${context.organizationId}`);
    
    if (context.recoverableEntries !== undefined) {
      logger.logMessage(`  Recoverable Entries: ${context.recoverableEntries}`);
      const dataLoss = context.affectedEntries - context.recoverableEntries;
      logger.logMessage(`  Data Loss: ${dataLoss} entries`);
    }

    if (context.checksumMismatch) {
      logger.logMessage(`  Checksum Mismatch: Yes`);
    }

    const corruptionRate = context.vectorCount > 0 ? 
      (context.affectedEntries / context.vectorCount * 100).toFixed(2) : '0';
    logger.logMessage(`  Corruption Rate: ${corruptionRate}%`);
    
    logger.logError(error);
    
    // Log critical integrity metrics
    logger.logMetrics('cache-integrity-error', {
      duration: 0,
      customMetrics: {
        totalVectors: context.vectorCount,
        affectedEntries: context.affectedEntries,
        corruptionRate: parseFloat(corruptionRate),
        recoverableEntries: context.recoverableEntries || 0,
        isCriticalCorruption: parseFloat(corruptionRate) > 10 ? 1 : 0
      }
    });
  }
}