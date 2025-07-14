import { PageContext } from '../services/optimization/OptimizationDetectionService';

/**
 * Repository interface for context discovery operations
 * Defines contracts for discovering and accessing application context
 * without coupling to specific infrastructure implementations
 */
export interface ContextDiscoveryRepository {
  /**
   * Discover current page/application context
   */
  discoverContext(): Promise<PageContext>;

  /**
   * Get available contexts for optimization
   */
  getAvailableContexts(): Promise<PageContext[]>;

  /**
   * Store context data for analysis
   */
  storeContextData(context: PageContext, data: Record<string, unknown>): Promise<void>;

  /**
   * Get context-specific optimization opportunities
   */
  getContextOptimizations(context: PageContext): Promise<Array<Record<string, unknown>>>;
} 