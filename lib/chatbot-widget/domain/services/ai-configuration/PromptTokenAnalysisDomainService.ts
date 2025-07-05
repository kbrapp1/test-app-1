/**
 * Prompt Token Analysis Domain Service
 * 
 * AI INSTRUCTIONS:
 * - Pure domain logic for token analysis and efficiency calculations
 * - No external dependencies, only domain logic
 * - Keep under 250 lines by focusing on core token analysis
 * - Follow @golden-rule patterns exactly
 * - Single responsibility: token usage analysis and optimization
 */

import {
  PromptMetrics,
  TokenAnalysis,
  ModuleTokenBreakdown,
  ModuleTokenInfo,
  TokenDistribution,
  TokenWasteAnalysis,
  OPTIMAL_TOKEN_RANGES,
  MODULE_OPTIMAL_TOKENS
} from './types/PromptPerformanceTypes';

export class PromptTokenAnalysisDomainService {
  
  /**
   * Analyze token usage efficiency for a prompt
   * 
   * AI INSTRUCTIONS:
   * - Core domain method for token analysis
   * - Calculate efficiency based on optimal ranges
   * - Generate breakdown and recommendations
   */
  static analyzeTokenUsage(metrics: PromptMetrics): TokenAnalysis {
    const totalTokens = metrics.promptTokens + metrics.completionTokens;
    const promptRatio = metrics.promptTokens / totalTokens;
    
    return {
      totalTokens,
      promptTokens: metrics.promptTokens,
      completionTokens: metrics.completionTokens,
      promptRatio,
      efficiency: this.calculateTokenEfficiency(metrics.promptTokens),
      breakdown: this.analyzeTokenBreakdown(metrics.moduleTokens),
      recommendations: this.generateTokenRecommendations(metrics.promptTokens, metrics.moduleTokens)
    };
  }

  /**
   * Calculate token efficiency score based on optimal ranges
   */
  private static calculateTokenEfficiency(promptTokens: number): number {
    const optimal = OPTIMAL_TOKEN_RANGES.total.optimal;
    const max = OPTIMAL_TOKEN_RANGES.total.max;
    
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
      modules: this.analyzeModules(moduleTokens, total),
      distribution: this.analyzeTokenDistribution(moduleTokens),
      wasteIdentification: this.identifyTokenWaste(moduleTokens)
    };
  }

  /**
   * Analyze individual modules
   */
  private static analyzeModules(moduleTokens: Record<string, number>, total: number): ModuleTokenInfo[] {
    return Object.entries(moduleTokens).map(([module, tokens]) => ({
      module,
      tokens,
      percentage: (tokens / total) * 100,
      efficiency: this.calculateModuleEfficiency(module, tokens),
      status: this.getModuleStatus(module, tokens)
    }));
  }

  /**
   * Calculate module-specific efficiency
   */
  private static calculateModuleEfficiency(module: string, tokens: number): number {
    const moduleRanges: Record<string, {min: number, max: number, optimal: number}> = {
      'core': OPTIMAL_TOKEN_RANGES.core,
      'context': OPTIMAL_TOKEN_RANGES.context,
      'realtime': OPTIMAL_TOKEN_RANGES.realtime,
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
   * Get module status based on efficiency
   */
  private static getModuleStatus(module: string, tokens: number): 'optimal' | 'acceptable' | 'oversized' | 'critical' {
    const efficiency = this.calculateModuleEfficiency(module, tokens);
    
    if (efficiency >= 0.9) return 'optimal';
    if (efficiency >= 0.7) return 'acceptable';
    if (efficiency >= 0.5) return 'oversized';
    return 'critical';
  }

  /**
   * Analyze token distribution across module categories
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
      const efficiency = this.calculateModuleEfficiency(module, tokens);
      
      if (efficiency < 0.7) {
        const optimalTokens = MODULE_OPTIMAL_TOKENS[module as keyof typeof MODULE_OPTIMAL_TOKENS] || 50;
        const potentialSavings = Math.max(0, tokens - optimalTokens);
        
        wasteAnalysis.push({
          module,
          currentTokens: tokens,
          optimalTokens,
          wastedTokens: potentialSavings,
          wastePercentage: (potentialSavings / tokens) * 100,
          recommendations: this.getModuleOptimizationRecommendations(module)
        });
      }
    });

    return wasteAnalysis.sort((a, b) => b.wastedTokens - a.wastedTokens);
  }

  /**
   * Generate token optimization recommendations
   */
  private static generateTokenRecommendations(promptTokens: number, moduleTokens: Record<string, number>): string[] {
    const recommendations: string[] = [];
    
    if (promptTokens > OPTIMAL_TOKEN_RANGES.total.max) {
      recommendations.push('Implement dynamic module selection based on conversation context');
      recommendations.push('Use conditional injection for non-essential modules');
      recommendations.push('Compress verbose instruction sections');
    }

    const oversizedModules = Object.entries(moduleTokens)
      .filter(([module, tokens]) => this.calculateModuleEfficiency(module, tokens) < 0.7)
      .map(([module]) => module);

    if (oversizedModules.length > 0) {
      recommendations.push(`Optimize oversized modules: ${oversizedModules.join(', ')}`);
    }

    return recommendations;
  }

  /**
   * Get module-specific optimization recommendations
   */
  private static getModuleOptimizationRecommendations(module: string): string[] {
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
} 