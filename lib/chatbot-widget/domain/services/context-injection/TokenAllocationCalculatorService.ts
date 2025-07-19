/**
 * Token Allocation Calculator Domain Service
 * 
 * AI INSTRUCTIONS:
 * - Pure domain logic for token allocation calculations and module selection
 * - Handles legacy selection methods and allocation tracking
 * - Follow @golden-rule patterns exactly - single responsibility for allocation
 * - Keep business logic isolated from external concerns
 */

import { ChatMessage } from '../../entities/ChatMessage';
import {
  ModulePriority,
  SelectedModules,
  ContextModule,
  TokenBudgetAllocation
} from '../interfaces/ContextInjectionTypes';

export class TokenAllocationCalculatorService {
  
  // Calculate detailed token allocation breakdown for tracking and analysis
  static calculateTokenAllocation(
    selectedModules: ContextModule[],
    totalAvailable: number
  ): TokenBudgetAllocation {
    const allocation: TokenBudgetAllocation = {
      corePersona: 0,
      highPriorityContext: 0,
      progressionModules: 0,
      realTimeContext: 0,
      totalUsed: 0,
      totalAvailable
    };

    selectedModules.forEach(module => {
      allocation.totalUsed += module.estimatedTokens;
      
      // Categorize modules for allocation tracking
      switch (module.type) {
        case 'userProfile':
        case 'conversationPhase':
          allocation.corePersona += module.estimatedTokens;
          break;
        case 'companyContext':
        case 'knowledgeBase':
          allocation.highPriorityContext += module.estimatedTokens;
          break;
        case 'leadScoring':
        case 'industrySpecific':
          allocation.progressionModules += module.estimatedTokens;
          break;
        case 'conversationHistory':
        case 'businessHours':
        case 'engagementOptimization':
          allocation.realTimeContext += module.estimatedTokens;
          break;
      }
    });

    return allocation;
  }

  // Legacy module selection method - maintained for backward compatibility
  static selectModulesForBudget(
    priorities: ModulePriority,
    tokenBudget: number,
    conversationHistory: ChatMessage[]
  ): SelectedModules {
    // For greetings and early conversation, use minimal modules
    if (conversationHistory.length <= 2) {
      return {
        corePersona: true,
        highPriorityContext: false, // Skip for greetings
        progressionModules: false,  // Skip for greetings
        realTimeContext: true,
        estimatedTokens: 900 // Much lower estimate
      };
    }
    
    // For longer conversations, use original logic
    const baseTokens = 800; // Core persona
    let currentTokens = baseTokens;
    
    const selected: SelectedModules = {
      corePersona: true,
      highPriorityContext: false,
      progressionModules: false,
      realTimeContext: false,
      estimatedTokens: baseTokens
    };
    
    // Add modules based on priority and available budget
    if (currentTokens + 400 <= tokenBudget && priorities.highPriorityContext > 0.6) {
      selected.highPriorityContext = true;
      currentTokens += 400;
    }
    
    if (currentTokens + 400 <= tokenBudget && priorities.progressionModules > 0.6) {
      selected.progressionModules = true;
      currentTokens += 400;
    }
    
    if (currentTokens + 300 <= tokenBudget && priorities.realTimeContext > 0.5) {
      selected.realTimeContext = true;
      currentTokens += 300;
    }
    
    selected.estimatedTokens = currentTokens;
    return selected;
  }

  // Calculate allocation efficiency metrics
  static calculateAllocationEfficiency(
    allocation: TokenBudgetAllocation
  ): {
    utilizationRate: number;
    corePersonaRatio: number;
    highPriorityRatio: number;
    progressionRatio: number;
    realTimeRatio: number;
    wastedTokens: number;
  } {
    const utilizationRate = allocation.totalUsed / allocation.totalAvailable;
    const wastedTokens = allocation.totalAvailable - allocation.totalUsed;
    
    // Calculate ratios for each category
    const corePersonaRatio = allocation.totalUsed > 0 ? allocation.corePersona / allocation.totalUsed : 0;
    const highPriorityRatio = allocation.totalUsed > 0 ? allocation.highPriorityContext / allocation.totalUsed : 0;
    const progressionRatio = allocation.totalUsed > 0 ? allocation.progressionModules / allocation.totalUsed : 0;
    const realTimeRatio = allocation.totalUsed > 0 ? allocation.realTimeContext / allocation.totalUsed : 0;
    
    return {
      utilizationRate,
      corePersonaRatio,
      highPriorityRatio,
      progressionRatio,
      realTimeRatio,
      wastedTokens
    };
  }

  // Get allocation summary for reporting and analysis
  static getAllocationSummary(
    allocation: TokenBudgetAllocation
  ): {
    summary: string;
    breakdown: { category: string; tokens: number; percentage: number }[];
    recommendations: string[];
  } {
    const breakdown = [
      { category: 'Core Persona', tokens: allocation.corePersona, percentage: 0 },
      { category: 'High Priority Context', tokens: allocation.highPriorityContext, percentage: 0 },
      { category: 'Progression Modules', tokens: allocation.progressionModules, percentage: 0 },
      { category: 'Real-time Context', tokens: allocation.realTimeContext, percentage: 0 }
    ];

    // Calculate percentages
    breakdown.forEach(item => {
      item.percentage = allocation.totalUsed > 0 ? 
        Math.round((item.tokens / allocation.totalUsed) * 100) : 0;
    });

    const utilizationRate = Math.round((allocation.totalUsed / allocation.totalAvailable) * 100);
    const summary = `Used ${allocation.totalUsed}/${allocation.totalAvailable} tokens (${utilizationRate}% utilization)`;
    
    const recommendations: string[] = [];
    
    // Generate recommendations based on allocation patterns
    if (utilizationRate < 70) {
      recommendations.push('Consider adding more context modules to improve response quality');
    }
    
    if (allocation.corePersona < 500) {
      recommendations.push('Core persona allocation seems low - ensure essential context is included');
    }
    
    if (allocation.realTimeContext === 0) {
      recommendations.push('Consider including real-time context for more dynamic responses');
    }
    
    return { summary, breakdown, recommendations };
  }
}