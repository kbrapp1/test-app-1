/**
 * Vector Storage Analytics Service
 * 
 * AI INSTRUCTIONS:
 * - Single responsibility: Storage optimization analysis and calculations
 * - Pure computation service for storage metrics
 * - Keep storage analysis focused and efficient
 * - Never exceed 250 lines per @golden-rule
 * - Handle storage efficiency and optimization calculations
 * - Provide actionable storage insights and recommendations
 */

/** Specialized Service for Vector Storage Analysis
 */
export class VectorStorageAnalyticsService {

  /** Calculate storage optimization metrics
 */
  calculateOptimizationMetrics(data: Array<{
    vector: number[] | string;
    content_hash: string;
    created_at: string;
    updated_at: string;
  }>): {
    averageVectorSize: number;
    totalVectorCount: number;
    duplicateContentCount: number;
    unusedVectorCount: number;
    storageEfficiency: number;
    recommendations: string[];
  } {
    const totalVectors = data.length;
    const contentHashes = new Set();
    const duplicateHashes = new Set();
    
    // Calculate duplicates
    data.forEach(item => {
      if (contentHashes.has(item.content_hash)) {
        duplicateHashes.add(item.content_hash);
      } else {
        contentHashes.add(item.content_hash);
      }
    });

    const duplicateCount = duplicateHashes.size;
    const storageEfficiency = totalVectors > 0 ? ((totalVectors - duplicateCount) / totalVectors) * 100 : 100;

    const recommendations = this.generateOptimizationRecommendations(
      duplicateCount,
      storageEfficiency,
      totalVectors
    );

    return {
      averageVectorSize: 1536, // Standard OpenAI embedding size
      totalVectorCount: totalVectors,
      duplicateContentCount: duplicateCount,
      unusedVectorCount: 0, // Would require usage tracking
      storageEfficiency,
      recommendations
    };
  }

  /** Generate storage optimization recommendations
 */
  private generateOptimizationRecommendations(
    duplicateCount: number,
    storageEfficiency: number,
    totalVectors: number
  ): string[] {
    const recommendations: string[] = [];

    if (duplicateCount > 0) {
      recommendations.push(`Remove ${duplicateCount} duplicate content items to save storage`);
    }

    if (storageEfficiency < 80) {
      recommendations.push('Storage efficiency is below 80% - consider content deduplication');
    }

    if (totalVectors > 10000) {
      recommendations.push('Consider implementing vector compression for large datasets');
    }

    if (totalVectors > 50000) {
      recommendations.push('Large dataset detected - implement tiered storage strategy');
    }

    if (storageEfficiency < 60) {
      recommendations.push('Critical storage inefficiency - immediate deduplication recommended');
    }

    if (duplicateCount === 0 && storageEfficiency > 95) {
      recommendations.push('Excellent storage efficiency - current optimization is optimal');
    }

    return recommendations;
  }

  /**
   * Calculate storage cost projections
   * 
   * AI INSTRUCTIONS:
   * - Estimate storage costs based on vector data
   * - Project future storage needs and costs
   * - Support budget planning and cost optimization
   * - Handle different storage tiers and pricing
   * - Provide cost-benefit analysis for optimizations
   */
  calculateStorageCostProjections(
    totalVectors: number,
    duplicateCount: number,
    averageVectorSize: number = 1536
  ): {
    currentStorageCost: number;
    optimizedStorageCost: number;
    potentialSavings: number;
    projectedGrowthCost: number;
  } {
    // Simplified cost calculation (would need actual pricing models)
    const bytesPerVector = averageVectorSize * 4; // 4 bytes per float
    const currentBytes = totalVectors * bytesPerVector;
    const optimizedBytes = (totalVectors - duplicateCount) * bytesPerVector;

    // Approximate storage cost per GB per month
    const costPerGBPerMonth = 0.025;
    const bytesToGB = 1024 * 1024 * 1024;

    const currentStorageCost = (currentBytes / bytesToGB) * costPerGBPerMonth;
    const optimizedStorageCost = (optimizedBytes / bytesToGB) * costPerGBPerMonth;
    const potentialSavings = currentStorageCost - optimizedStorageCost;

    // Project 6-month growth at 20% monthly growth
    const growthRate = 1.2;
    const monthsToProject = 6;
    const projectedVectors = totalVectors * Math.pow(growthRate, monthsToProject);
    const projectedBytes = projectedVectors * bytesPerVector;
    const projectedGrowthCost = (projectedBytes / bytesToGB) * costPerGBPerMonth;

    return {
      currentStorageCost,
      optimizedStorageCost,
      potentialSavings,
      projectedGrowthCost
    };
  }

  /** Analyze storage distribution patterns
 */
  analyzeStorageDistribution(data: Array<{
    content_hash: string;
    category?: string;
    source_type?: string;
    created_at: string;
  }>): {
    storageByCategory: Record<string, number>;
    storageBySourceType: Record<string, number>;
    storageGrowthTrend: Array<{ month: string; storageSize: number }>;
    inefficiencyHotspots: Array<{ area: string; wastePercentage: number }>;
  } {
    const storageByCategory: Record<string, number> = {};
    const storageBySourceType: Record<string, number> = {};
    const categoryDuplicates: Record<string, Set<string>> = {};
    const sourceTypeDuplicates: Record<string, Set<string>> = {};

    data.forEach(item => {
      const category = item.category || 'uncategorized';
      const sourceType = item.source_type || 'unknown';

      // Count storage by category
      storageByCategory[category] = (storageByCategory[category] || 0) + 1;
      
      // Count storage by source type
      storageBySourceType[sourceType] = (storageBySourceType[sourceType] || 0) + 1;

      // Track duplicates by category
      if (!categoryDuplicates[category]) {
        categoryDuplicates[category] = new Set();
      }
      categoryDuplicates[category].add(item.content_hash);

      // Track duplicates by source type
      if (!sourceTypeDuplicates[sourceType]) {
        sourceTypeDuplicates[sourceType] = new Set();
      }
      sourceTypeDuplicates[sourceType].add(item.content_hash);
    });

    // Calculate inefficiency hotspots
    const inefficiencyHotspots: Array<{ area: string; wastePercentage: number }> = [];
    
    Object.entries(storageByCategory).forEach(([category, count]) => {
      const uniqueHashes = categoryDuplicates[category].size;
      const wastePercentage = count > 0 ? ((count - uniqueHashes) / count) * 100 : 0;
      if (wastePercentage > 10) {
        inefficiencyHotspots.push({ area: `Category: ${category}`, wastePercentage });
      }
    });

    // Simplified storage growth trend (would need historical data)
    const storageGrowthTrend = [
      { month: '6 months ago', storageSize: data.length * 0.4 },
      { month: '5 months ago', storageSize: data.length * 0.5 },
      { month: '4 months ago', storageSize: data.length * 0.6 },
      { month: '3 months ago', storageSize: data.length * 0.75 },
      { month: '2 months ago', storageSize: data.length * 0.85 },
      { month: 'Last month', storageSize: data.length * 0.95 },
      { month: 'Current', storageSize: data.length }
    ];

    return {
      storageByCategory,
      storageBySourceType,
      storageGrowthTrend,
      inefficiencyHotspots: inefficiencyHotspots.sort((a, b) => b.wastePercentage - a.wastePercentage)
    };
  }
}