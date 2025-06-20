/**
 * Prompt Performance Service - 2025 Monitoring and Optimization
 * 
 * AI INSTRUCTIONS:
 * - Monitors prompt token usage and effectiveness in real-time
 * - Provides performance analytics for prompt optimization
 * - Implements A/B testing capabilities for prompt variations
 * - Tracks conversation success metrics and correlations
 * - Follows @golden-rule.mdc DDD patterns for domain services
 */
export class PromptPerformanceService {
  private static readonly OPTIMAL_TOKEN_RANGES = {
    total: { min: 1000, max: 2000, optimal: 1500 },
    core: { min: 600, max: 900, optimal: 750 },
    context: { min: 200, max: 500, optimal: 350 },
    realtime: { min: 100, max: 300, optimal: 200 }
  };

  private static readonly PERFORMANCE_THRESHOLDS = {
    tokenEfficiency: 0.8, // 80% efficient token usage
    responseRelevance: 0.85, // 85% response relevance
    conversionRate: 0.15, // 15% lead conversion
    engagementScore: 7.0 // Average engagement score
  };

  /**
   * Analyze prompt performance and provide optimization recommendations
   */
  static analyzePromptPerformance(metrics: PromptMetrics): PromptPerformanceAnalysis {
    const tokenAnalysis = this.analyzeTokenUsage(metrics);
    const effectivenessAnalysis = this.analyzeEffectiveness(metrics);
    const optimizationRecommendations = this.generateOptimizationRecommendations(tokenAnalysis, effectivenessAnalysis);

    return {
      tokenAnalysis,
      effectivenessAnalysis,
      optimizationRecommendations,
      overallScore: this.calculateOverallScore(tokenAnalysis, effectivenessAnalysis),
      timestamp: new Date()
    };
  }

  /**
   * Analyze token usage efficiency
   */
  private static analyzeTokenUsage(metrics: PromptMetrics): TokenAnalysis {
    const totalTokens = metrics.promptTokens + metrics.completionTokens;
    const promptRatio = metrics.promptTokens / totalTokens;
    
    return {
      totalTokens,
      promptTokens: metrics.promptTokens,
      completionTokens: metrics.completionTokens,
      promptRatio,
      efficiency: this.calculateTokenEfficiency(metrics.promptTokens),
      breakdown: this.analyzeTokenBreakdown(metrics.moduleTokens),
      recommendations: this.getTokenOptimizationRecommendations(metrics.promptTokens, metrics.moduleTokens)
    };
  }

  /**
   * Analyze conversation effectiveness
   */
  private static analyzeEffectiveness(metrics: PromptMetrics): EffectivenessAnalysis {
    return {
      responseRelevance: metrics.responseRelevance || 0,
      entityExtractionAccuracy: metrics.entityExtractionAccuracy || 0,
      leadQualificationAccuracy: metrics.leadQualificationAccuracy || 0,
      conversationProgression: metrics.conversationProgression || 0,
      userEngagement: metrics.userEngagement || 0,
      conversionRate: metrics.conversionRate || 0,
      averageSessionLength: metrics.averageSessionLength || 0,
      escalationRate: metrics.escalationRate || 0
    };
  }

  /**
   * Calculate token efficiency score
   */
  private static calculateTokenEfficiency(promptTokens: number): number {
    const optimal = this.OPTIMAL_TOKEN_RANGES.total.optimal;
    const max = this.OPTIMAL_TOKEN_RANGES.total.max;
    
    if (promptTokens <= optimal) {
      return 1.0; // Perfect efficiency
    } else if (promptTokens <= max) {
      // Linear decrease from 1.0 to 0.7
      return 1.0 - (0.3 * (promptTokens - optimal) / (max - optimal));
    } else {
      // Exponential decrease for oversized prompts
      const overage = promptTokens - max;
      return Math.max(0.3 * Math.exp(-overage / 500), 0.1);
    }
  }

  /**
   * Analyze token breakdown by module
   */
  private static analyzeTokenBreakdown(moduleTokens: Record<string, number>): ModuleTokenBreakdown {
    const total = Object.values(moduleTokens).reduce((sum, tokens) => sum + tokens, 0);
    
    return {
      total,
      modules: Object.entries(moduleTokens).map(([module, tokens]) => ({
        module,
        tokens,
        percentage: (tokens / total) * 100,
        efficiency: this.getModuleEfficiency(module, tokens),
        status: this.getModuleStatus(module, tokens)
      })),
      distribution: this.analyzeTokenDistribution(moduleTokens),
      wasteIdentification: this.identifyTokenWaste(moduleTokens)
    };
  }

  /**
   * Get module-specific efficiency
   */
  private static getModuleEfficiency(module: string, tokens: number): number {
    const moduleRanges: Record<string, {min: number, max: number, optimal: number}> = {
      'core': this.OPTIMAL_TOKEN_RANGES.core,
      'context': this.OPTIMAL_TOKEN_RANGES.context,
      'realtime': this.OPTIMAL_TOKEN_RANGES.realtime,
      'userProfile': { min: 30, max: 80, optimal: 50 },
      'companyContext': { min: 40, max: 100, optimal: 70 },
      'knowledgeBase': { min: 60, max: 150, optimal: 100 },
      'conversationHistory': { min: 20, max: 80, optimal: 50 }
    };

    const range = moduleRanges[module];
    if (!range) return 0.7; // Default efficiency for unknown modules

    if (tokens <= range.optimal) {
      return 1.0;
    } else if (tokens <= range.max) {
      return 1.0 - (0.3 * (tokens - range.optimal) / (range.max - range.optimal));
    } else {
      return Math.max(0.3, 0.3 * Math.exp(-(tokens - range.max) / 50));
    }
  }

  /**
   * Get module status
   */
  private static getModuleStatus(module: string, tokens: number): 'optimal' | 'acceptable' | 'oversized' | 'critical' {
    const efficiency = this.getModuleEfficiency(module, tokens);
    
    if (efficiency >= 0.9) return 'optimal';
    if (efficiency >= 0.7) return 'acceptable';
    if (efficiency >= 0.5) return 'oversized';
    return 'critical';
  }

  /**
   * Analyze token distribution across modules
   */
  private static analyzeTokenDistribution(moduleTokens: Record<string, number>): TokenDistribution {
    const total = Object.values(moduleTokens).reduce((sum, tokens) => sum + tokens, 0);
    const coreModules = ['core', 'userProfile', 'conversationPhase'];
    const contextModules = ['companyContext', 'knowledgeBase', 'industrySpecific'];
    const enhancementModules = ['conversationHistory', 'businessHours', 'engagementOptimization'];

    const coreTokens = coreModules.reduce((sum, module) => sum + (moduleTokens[module] || 0), 0);
    const contextTokens = contextModules.reduce((sum, module) => sum + (moduleTokens[module] || 0), 0);
    const enhancementTokens = enhancementModules.reduce((sum, module) => sum + (moduleTokens[module] || 0), 0);

    return {
      core: { tokens: coreTokens, percentage: (coreTokens / total) * 100 },
      context: { tokens: contextTokens, percentage: (contextTokens / total) * 100 },
      enhancement: { tokens: enhancementTokens, percentage: (enhancementTokens / total) * 100 },
      balance: this.calculateDistributionBalance(coreTokens, contextTokens, enhancementTokens)
    };
  }

  /**
   * Calculate distribution balance score
   */
  private static calculateDistributionBalance(core: number, context: number, enhancement: number): number {
    const total = core + context + enhancement;
    const coreRatio = core / total;
    const contextRatio = context / total;
    const enhancementRatio = enhancement / total;

    // Ideal distribution: 50% core, 35% context, 15% enhancement
    const idealCore = 0.5;
    const idealContext = 0.35;
    const idealEnhancement = 0.15;

    const coreDeviation = Math.abs(coreRatio - idealCore);
    const contextDeviation = Math.abs(contextRatio - idealContext);
    const enhancementDeviation = Math.abs(enhancementRatio - idealEnhancement);

    const averageDeviation = (coreDeviation + contextDeviation + enhancementDeviation) / 3;
    return Math.max(0, 1 - (averageDeviation * 2)); // Convert to 0-1 score
  }

  /**
   * Identify token waste opportunities
   */
  private static identifyTokenWaste(moduleTokens: Record<string, number>): TokenWasteAnalysis[] {
    const wasteAnalysis: TokenWasteAnalysis[] = [];

    Object.entries(moduleTokens).forEach(([module, tokens]) => {
      const efficiency = this.getModuleEfficiency(module, tokens);
      
      if (efficiency < 0.7) {
        const potentialSavings = tokens - this.getOptimalTokensForModule(module);
        
        wasteAnalysis.push({
          module,
          currentTokens: tokens,
          optimalTokens: this.getOptimalTokensForModule(module),
          wastedTokens: potentialSavings,
          wastePercentage: (potentialSavings / tokens) * 100,
          recommendations: this.getModuleOptimizationRecommendations(module, tokens)
        });
      }
    });

    return wasteAnalysis.sort((a, b) => b.wastedTokens - a.wastedTokens);
  }

  /**
   * Get optimal token count for module
   */
  private static getOptimalTokensForModule(module: string): number {
    const optimalCounts: Record<string, number> = {
      'core': 750,
      'userProfile': 50,
      'companyContext': 70,
      'conversationPhase': 60,
      'knowledgeBase': 100,
      'industrySpecific': 45,
      'conversationHistory': 50,
      'businessHours': 25,
      'engagementOptimization': 35
    };

    return optimalCounts[module] || 50;
  }

  /**
   * Generate optimization recommendations
   */
  private static generateOptimizationRecommendations(
    tokenAnalysis: TokenAnalysis,
    effectivenessAnalysis: EffectivenessAnalysis
  ): OptimizationRecommendation[] {
    const recommendations: OptimizationRecommendation[] = [];

    // Token optimization recommendations
    if (tokenAnalysis.efficiency < this.PERFORMANCE_THRESHOLDS.tokenEfficiency) {
      recommendations.push({
        type: 'token_optimization',
        priority: 'high',
        title: 'Optimize Token Usage',
        description: 'Prompt is exceeding optimal token range, impacting efficiency',
        impact: 'high',
        effort: 'medium',
        actions: tokenAnalysis.recommendations
      });
    }

    // Effectiveness optimization recommendations
    if (effectivenessAnalysis.responseRelevance < this.PERFORMANCE_THRESHOLDS.responseRelevance) {
      recommendations.push({
        type: 'relevance_optimization',
        priority: 'high',
        title: 'Improve Response Relevance',
        description: 'Response relevance is below target threshold',
        impact: 'high',
        effort: 'high',
        actions: [
          'Refine core persona instructions',
          'Add more specific context injection rules',
          'Improve entity extraction accuracy'
        ]
      });
    }

    // Module-specific recommendations
    tokenAnalysis.breakdown.wasteIdentification.forEach(waste => {
      if (waste.wastePercentage > 20) {
        recommendations.push({
          type: 'module_optimization',
          priority: waste.wastePercentage > 40 ? 'high' : 'medium',
          title: `Optimize ${waste.module} Module`,
          description: `${waste.module} module is using ${waste.wastePercentage.toFixed(1)}% more tokens than optimal`,
          impact: 'medium',
          effort: 'low',
          actions: waste.recommendations
        });
      }
    });

    return recommendations.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  /**
   * Get module-specific optimization recommendations
   */
  private static getModuleOptimizationRecommendations(module: string, currentTokens: number): string[] {
    const moduleRecommendations: Record<string, string[]> = {
      'core': [
        'Condense behavioral guidelines',
        'Merge overlapping instruction sections',
        'Use more concise language'
      ],
      'knowledgeBase': [
        'Implement conditional injection based on conversation context',
        'Summarize FAQ entries more aggressively',
        'Cache frequently used knowledge snippets'
      ],
      'companyContext': [
        'Use industry-specific templates',
        'Implement progressive disclosure',
        'Condense company descriptions'
      ],
      'conversationHistory': [
        'Limit to most recent 3-5 interactions',
        'Summarize older conversation topics',
        'Remove redundant context'
      ]
    };

    return moduleRecommendations[module] || ['Optimize content length', 'Remove redundant information'];
  }

  /**
   * Get token optimization recommendations
   */
  private static getTokenOptimizationRecommendations(promptTokens: number, moduleTokens: Record<string, number>): string[] {
    const recommendations: string[] = [];
    
    if (promptTokens > this.OPTIMAL_TOKEN_RANGES.total.max) {
      recommendations.push('Implement dynamic module selection based on conversation context');
      recommendations.push('Use conditional injection for non-essential modules');
      recommendations.push('Compress verbose instruction sections');
    }

    const oversizedModules = Object.entries(moduleTokens)
      .filter(([module, tokens]) => this.getModuleEfficiency(module, tokens) < 0.7)
      .map(([module]) => module);

    if (oversizedModules.length > 0) {
      recommendations.push(`Optimize oversized modules: ${oversizedModules.join(', ')}`);
    }

    return recommendations;
  }

  /**
   * Calculate overall performance score
   */
  private static calculateOverallScore(tokenAnalysis: TokenAnalysis, effectivenessAnalysis: EffectivenessAnalysis): number {
    const tokenScore = tokenAnalysis.efficiency;
    const effectivenessScore = (
      effectivenessAnalysis.responseRelevance +
      effectivenessAnalysis.entityExtractionAccuracy +
      effectivenessAnalysis.leadQualificationAccuracy +
      effectivenessAnalysis.conversationProgression +
      effectivenessAnalysis.userEngagement
    ) / 5;

    // Weighted average: 30% token efficiency, 70% effectiveness
    return (tokenScore * 0.3) + (effectivenessScore * 0.7);
  }

  /**
   * Generate performance report
   */
  static generatePerformanceReport(analyses: PromptPerformanceAnalysis[]): PromptPerformanceReport {
    const latest = analyses[0];
    const historical = analyses.slice(1);

    return {
      currentPerformance: latest,
      trends: this.calculateTrends(analyses),
      benchmarks: this.getBenchmarkComparisons(latest),
      recommendations: this.consolidateRecommendations(analyses),
      generatedAt: new Date()
    };
  }

  /**
   * Calculate performance trends
   */
  private static calculateTrends(analyses: PromptPerformanceAnalysis[]): PerformanceTrends {
    if (analyses.length < 2) {
      return {
        tokenEfficiency: { trend: 'stable', change: 0 },
        responseRelevance: { trend: 'stable', change: 0 },
        overallScore: { trend: 'stable', change: 0 }
      };
    }

    const current = analyses[0];
    const previous = analyses[1];

    return {
      tokenEfficiency: this.calculateTrend(current.tokenAnalysis.efficiency, previous.tokenAnalysis.efficiency),
      responseRelevance: this.calculateTrend(current.effectivenessAnalysis.responseRelevance, previous.effectivenessAnalysis.responseRelevance),
      overallScore: this.calculateTrend(current.overallScore, previous.overallScore)
    };
  }

  /**
   * Calculate individual trend
   */
  private static calculateTrend(current: number, previous: number): TrendData {
    const change = current - previous;
    const changePercent = (change / previous) * 100;

    let trend: 'improving' | 'stable' | 'declining';
    if (Math.abs(changePercent) < 2) {
      trend = 'stable';
    } else if (change > 0) {
      trend = 'improving';
    } else {
      trend = 'declining';
    }

    return { trend, change: changePercent };
  }

  /**
   * Get benchmark comparisons
   */
  private static getBenchmarkComparisons(analysis: PromptPerformanceAnalysis): BenchmarkComparisons {
    return {
      tokenEfficiency: {
        current: analysis.tokenAnalysis.efficiency,
        benchmark: this.PERFORMANCE_THRESHOLDS.tokenEfficiency,
        status: analysis.tokenAnalysis.efficiency >= this.PERFORMANCE_THRESHOLDS.tokenEfficiency ? 'above' : 'below'
      },
      responseRelevance: {
        current: analysis.effectivenessAnalysis.responseRelevance,
        benchmark: this.PERFORMANCE_THRESHOLDS.responseRelevance,
        status: analysis.effectivenessAnalysis.responseRelevance >= this.PERFORMANCE_THRESHOLDS.responseRelevance ? 'above' : 'below'
      },
      overallScore: {
        current: analysis.overallScore,
        benchmark: 0.8, // 80% overall target
        status: analysis.overallScore >= 0.8 ? 'above' : 'below'
      }
    };
  }

  /**
   * Consolidate recommendations across multiple analyses
   */
  private static consolidateRecommendations(analyses: PromptPerformanceAnalysis[]): ConsolidatedRecommendations {
    const allRecommendations = analyses.flatMap(analysis => analysis.optimizationRecommendations);
    
    // Group by type and prioritize
    const grouped = allRecommendations.reduce((acc, rec) => {
      if (!acc[rec.type]) acc[rec.type] = [];
      acc[rec.type].push(rec);
      return acc;
    }, {} as Record<string, OptimizationRecommendation[]>);

    const prioritized = Object.entries(grouped).map(([type, recommendations]) => ({
      type,
      frequency: recommendations.length,
      latestRecommendation: recommendations[0],
      consistentIssue: recommendations.length >= 3
    }));

    return {
      immediate: prioritized.filter(r => r.latestRecommendation.priority === 'high').slice(0, 3),
      planned: prioritized.filter(r => r.latestRecommendation.priority === 'medium').slice(0, 5),
      future: prioritized.filter(r => r.latestRecommendation.priority === 'low')
    };
  }
}

// Performance monitoring interfaces
export interface PromptMetrics {
  promptTokens: number;
  completionTokens: number;
  moduleTokens: Record<string, number>;
  responseRelevance?: number;
  entityExtractionAccuracy?: number;
  leadQualificationAccuracy?: number;
  conversationProgression?: number;
  userEngagement?: number;
  conversionRate?: number;
  averageSessionLength?: number;
  escalationRate?: number;
}

export interface PromptPerformanceAnalysis {
  tokenAnalysis: TokenAnalysis;
  effectivenessAnalysis: EffectivenessAnalysis;
  optimizationRecommendations: OptimizationRecommendation[];
  overallScore: number;
  timestamp: Date;
}

export interface TokenAnalysis {
  totalTokens: number;
  promptTokens: number;
  completionTokens: number;
  promptRatio: number;
  efficiency: number;
  breakdown: ModuleTokenBreakdown;
  recommendations: string[];
}

export interface EffectivenessAnalysis {
  responseRelevance: number;
  entityExtractionAccuracy: number;
  leadQualificationAccuracy: number;
  conversationProgression: number;
  userEngagement: number;
  conversionRate: number;
  averageSessionLength: number;
  escalationRate: number;
}

export interface ModuleTokenBreakdown {
  total: number;
  modules: ModuleTokenInfo[];
  distribution: TokenDistribution;
  wasteIdentification: TokenWasteAnalysis[];
}

export interface ModuleTokenInfo {
  module: string;
  tokens: number;
  percentage: number;
  efficiency: number;
  status: 'optimal' | 'acceptable' | 'oversized' | 'critical';
}

export interface TokenDistribution {
  core: { tokens: number; percentage: number };
  context: { tokens: number; percentage: number };
  enhancement: { tokens: number; percentage: number };
  balance: number;
}

export interface TokenWasteAnalysis {
  module: string;
  currentTokens: number;
  optimalTokens: number;
  wastedTokens: number;
  wastePercentage: number;
  recommendations: string[];
}

export interface OptimizationRecommendation {
  type: string;
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  effort: 'high' | 'medium' | 'low';
  actions: string[];
}

export interface PromptPerformanceReport {
  currentPerformance: PromptPerformanceAnalysis;
  trends: PerformanceTrends;
  benchmarks: BenchmarkComparisons;
  recommendations: ConsolidatedRecommendations;
  generatedAt: Date;
}

export interface PerformanceTrends {
  tokenEfficiency: TrendData;
  responseRelevance: TrendData;
  overallScore: TrendData;
}

export interface TrendData {
  trend: 'improving' | 'stable' | 'declining';
  change: number;
}

export interface BenchmarkComparisons {
  tokenEfficiency: BenchmarkComparison;
  responseRelevance: BenchmarkComparison;
  overallScore: BenchmarkComparison;
}

export interface BenchmarkComparison {
  current: number;
  benchmark: number;
  status: 'above' | 'below';
}

export interface ConsolidatedRecommendations {
  immediate: RecommendationSummary[];
  planned: RecommendationSummary[];
  future: RecommendationSummary[];
}

export interface RecommendationSummary {
  type: string;
  frequency: number;
  latestRecommendation: OptimizationRecommendation;
  consistentIssue: boolean;
} 