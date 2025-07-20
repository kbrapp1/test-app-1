/**
 * Vector Knowledge Analytics Repository Interface
 * 
 * AI INSTRUCTIONS:
 * - Defines contract for analytics operations on vector knowledge
 * - Focus on metrics, statistics, and health monitoring
 * - Support multi-tenant isolation by organization
 * - Maintains clean domain boundaries
 * - Enable operational insights and proactive maintenance
 */
export interface IVectorKnowledgeAnalyticsRepository {
  /**
   * Get knowledge item statistics and analytics
   */
  getKnowledgeItemStats(
    organizationId: string,
    chatbotConfigId: string
  ): Promise<{
    totalItems: number;
    itemsBySourceType: Record<string, number>;
    itemsByCategory: Record<string, number>;
    lastUpdated: Date | null;
    storageSize: number;
  }>;

  /**
   * Get storage optimization metrics
   */
  getStorageOptimizationMetrics(
    organizationId: string,
    chatbotConfigId: string
  ): Promise<{
    averageVectorSize: number;
    totalVectorCount: number;
    duplicateContentCount: number;
    unusedVectorCount: number;
    storageEfficiency: number;
    recommendations: string[];
  }>;

  /**
   * Get knowledge base health metrics
   */
  getKnowledgeBaseHealthMetrics(
    organizationId: string,
    chatbotConfigId: string
  ): Promise<{
    healthScore: number;
    staleContentCount: number;
    recentUpdatesCount: number;
    contentFreshness: 'excellent' | 'good' | 'fair' | 'poor';
    maintenanceNeeded: boolean;
    recommendations: string[];
  }>;
}