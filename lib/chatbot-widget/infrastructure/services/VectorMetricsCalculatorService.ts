/**
 * Vector Metrics Calculator Service
 * 
 * AI INSTRUCTIONS:
 * - Single responsibility: Pure calculation logic for vector metrics
 * - No database dependencies, pure computation service
 * - Keep calculations focused and testable
 * - Never exceed 250 lines per @golden-rule
 * - Handle mathematical operations and statistical analysis
 * - Provide clean calculation interface for statistics
 */

/**
 * Pure Calculation Service for Vector Metrics
 * 
 * AI INSTRUCTIONS:
 * - Handle all mathematical calculations for vector analytics
 * - Keep calculations pure and deterministic
 * - Provide comprehensive metrics calculation
 * - Support health scoring and trend analysis
 * - Handle edge cases and empty datasets gracefully
 */
export class VectorMetricsCalculatorService {

  calculateBasicStatistics(data: Array<{
    source_type: string;
    category: string;
    updated_at: string;
  }>): {
    totalItems: number;
    itemsBySourceType: Record<string, number>;
    itemsByCategory: Record<string, number>;
    lastUpdated: Date | null;
  } {
    const stats = {
      totalItems: data.length,
      itemsBySourceType: {} as Record<string, number>,
      itemsByCategory: {} as Record<string, number>,
      lastUpdated: null as Date | null
    };

    // Calculate statistics
    data.forEach(item => {
      // Count by source type
      stats.itemsBySourceType[item.source_type] = 
        (stats.itemsBySourceType[item.source_type] || 0) + 1;

      // Count by category
      stats.itemsByCategory[item.category] = 
        (stats.itemsByCategory[item.category] || 0) + 1;

      // Track latest update
      const updatedAt = new Date(item.updated_at);
      if (!stats.lastUpdated || updatedAt > stats.lastUpdated) {
        stats.lastUpdated = updatedAt;
      }
    });

    return stats;
  }

  /** Calculate knowledge base health metrics */
  calculateHealthMetrics(data: Array<{
    updated_at: string;
    created_at: string;
    category: string;
    source_type: string;
  }>): {
    healthScore: number;
    staleContentCount: number;
    recentUpdatesCount: number;
    contentFreshness: 'excellent' | 'good' | 'fair' | 'poor';
    maintenanceNeeded: boolean;
    recommendations: string[];
  } {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

    let staleCount = 0;
    let recentCount = 0;

    data.forEach(item => {
      const updatedAt = new Date(item.updated_at);
      if (updatedAt < ninetyDaysAgo) {
        staleCount++;
      } else if (updatedAt > thirtyDaysAgo) {
        recentCount++;
      }
    });

    const totalItems = data.length;
    const stalePercentage = totalItems > 0 ? (staleCount / totalItems) * 100 : 0;
    const recentPercentage = totalItems > 0 ? (recentCount / totalItems) * 100 : 0;

    let healthScore = 100;
    healthScore -= stalePercentage * 0.5; // Reduce score for stale content
    healthScore = Math.max(0, Math.min(100, healthScore));

    let contentFreshness: 'excellent' | 'good' | 'fair' | 'poor';
    if (recentPercentage > 50) contentFreshness = 'excellent';
    else if (recentPercentage > 25) contentFreshness = 'good';
    else if (recentPercentage > 10) contentFreshness = 'fair';
    else contentFreshness = 'poor';

    const maintenanceNeeded = stalePercentage > 30 || recentPercentage < 10;

    const recommendations: string[] = [];
    if (staleCount > 0) {
      recommendations.push(`Update ${staleCount} stale content items (older than 90 days)`);
    }
    if (recentPercentage < 20) {
      recommendations.push('Increase content update frequency to improve freshness');
    }
    if (maintenanceNeeded) {
      recommendations.push('Schedule regular content maintenance and review cycles');
    }

    return {
      healthScore,
      staleContentCount: staleCount,
      recentUpdatesCount: recentCount,
      contentFreshness,
      maintenanceNeeded,
      recommendations
    };
  }

  /** Calculate usage analytics from available data */
  calculateUsageAnalytics(data: Array<{
    knowledge_item_id: string;
    title: string;
    category: string;
    updated_at: string;
  }>): {
    mostAccessedCategories: Array<{ category: string; accessCount: number }>;
    leastUsedContent: Array<{ id: string; title: string; lastAccessed: Date | null }>;
    contentUtilization: number;
    popularityTrends: Array<{ period: string; accessCount: number }>;
  } {
    const categoryCount: Record<string, number> = {};
    
    data.forEach(item => {
      categoryCount[item.category] = (categoryCount[item.category] || 0) + 1;
    });

    const mostAccessedCategories = Object.entries(categoryCount)
      .map(([category, count]) => ({ category, accessCount: count }))
      .sort((a, b) => b.accessCount - a.accessCount);

    const leastUsedContent = data
      .map(item => ({
        id: item.knowledge_item_id,
        title: item.title,
        lastAccessed: new Date(item.updated_at) // Approximation
      }))
      .sort((a, b) => (a.lastAccessed?.getTime() || 0) - (b.lastAccessed?.getTime() || 0))
      .slice(0, 10);

    return {
      mostAccessedCategories,
      leastUsedContent,
      contentUtilization: 75, // Placeholder - would need actual usage tracking
      popularityTrends: [
        { period: 'This Week', accessCount: 0 },
        { period: 'Last Week', accessCount: 0 },
        { period: 'This Month', accessCount: 0 }
      ]
    };
  }
}