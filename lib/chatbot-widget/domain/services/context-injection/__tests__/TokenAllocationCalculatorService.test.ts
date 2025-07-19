/**
 * TokenAllocationCalculatorService Tests
 * 
 * Critical domain logic tests for token allocation calculations
 * Tests complex allocation algorithms and efficiency metrics
 */

import { describe, it, expect } from 'vitest';
import { TokenAllocationCalculatorService } from '../TokenAllocationCalculatorService';
import { ChatMessage } from '../../../entities/ChatMessage';
import { MessageAIMetadata } from '../../../value-objects/message-processing/MessageAIMetadata';
import { MessageContextMetadata } from '../../../value-objects/message-processing/MessageContextMetadata';
import { MessageProcessingMetrics } from '../../../value-objects/message-processing/MessageProcessingMetrics';
import { MessageCostTracking } from '../../../value-objects/message-processing/MessageCostTracking';
import {
  ContextModule,
  ContextModuleType,
  ModulePriority,
  TokenBudgetAllocation
} from '../../interfaces/ContextInjectionTypes';

describe('TokenAllocationCalculatorService', () => {
  
  const createTestModule = (
    type: ContextModuleType, 
    estimatedTokens: number = 100,
    priority: number = 0.8
  ): ContextModule => ({
    type,
    priority,
    estimatedTokens,
    relevanceScore: 0.9,
    content: () => `Mock content for ${type}`
  });

  const createTestMessage = (content: string = 'Test message'): ChatMessage => {
    return ChatMessage.create({
      id: ChatMessage.generateId(),
      sessionId: 'test-session',
      messageType: 'user',
      content,
      timestamp: new Date(),
      isVisible: true,
      aiMetadata: MessageAIMetadata.createEmpty(),
      contextMetadata: MessageContextMetadata.createForUser('text'),
      processingMetrics: MessageProcessingMetrics.createEmpty(),
      costTracking: MessageCostTracking.createZeroCost()
    });
  };

  describe('calculateTokenAllocation', () => {
    it('should calculate basic token allocation correctly', () => {
      const modules = [
        createTestModule('userProfile', 200),
        createTestModule('companyContext', 150),
        createTestModule('conversationHistory', 100)
      ];

      const result = TokenAllocationCalculatorService.calculateTokenAllocation(modules, 1000);

      expect(result).toEqual({
        corePersona: 200,           // userProfile
        highPriorityContext: 150,   // companyContext
        progressionModules: 0,      // none
        realTimeContext: 100,       // conversationHistory
        totalUsed: 450,
        totalAvailable: 1000
      });
    });

    it('should categorize all module types correctly', () => {
      const modules = [
        createTestModule('userProfile', 100),      // corePersona
        createTestModule('conversationPhase', 80), // corePersona
        createTestModule('companyContext', 120),   // highPriorityContext
        createTestModule('knowledgeBase', 200),    // highPriorityContext
        createTestModule('leadScoring', 60),       // progressionModules
        createTestModule('industrySpecific', 90),  // progressionModules
        createTestModule('conversationHistory', 50), // realTimeContext
        createTestModule('businessHours', 30),     // realTimeContext
        createTestModule('engagementOptimization', 40) // realTimeContext
      ];

      const result = TokenAllocationCalculatorService.calculateTokenAllocation(modules, 1000);

      expect(result).toEqual({
        corePersona: 180,           // userProfile (100) + conversationPhase (80)
        highPriorityContext: 320,   // companyContext (120) + knowledgeBase (200)
        progressionModules: 150,    // leadScoring (60) + industrySpecific (90)
        realTimeContext: 120,       // conversationHistory (50) + businessHours (30) + engagementOptimization (40)
        totalUsed: 770,
        totalAvailable: 1000
      });
    });

    it('should handle empty module list', () => {
      const result = TokenAllocationCalculatorService.calculateTokenAllocation([], 1000);

      expect(result).toEqual({
        corePersona: 0,
        highPriorityContext: 0,
        progressionModules: 0,
        realTimeContext: 0,
        totalUsed: 0,
        totalAvailable: 1000
      });
    });

    it('should handle modules that exceed budget', () => {
      const modules = [
        createTestModule('userProfile', 800),
        createTestModule('companyContext', 600)
      ];

      const result = TokenAllocationCalculatorService.calculateTokenAllocation(modules, 1000);

      expect(result).toEqual({
        corePersona: 800,
        highPriorityContext: 600,
        progressionModules: 0,
        realTimeContext: 0,
        totalUsed: 1400, // Exceeds budget
        totalAvailable: 1000
      });
    });

    it('should handle zero token budget', () => {
      const modules = [createTestModule('userProfile', 100)];

      const result = TokenAllocationCalculatorService.calculateTokenAllocation(modules, 0);

      expect(result).toEqual({
        corePersona: 100,
        highPriorityContext: 0,
        progressionModules: 0,
        realTimeContext: 0,
        totalUsed: 100,
        totalAvailable: 0
      });
    });
  });

  describe('selectModulesForBudget', () => {
    const defaultPriorities: ModulePriority = {
      corePersona: 0.9,
      highPriorityContext: 0.8,
      progressionModules: 0.7,
      realTimeContext: 0.6
    };

    it('should use minimal modules for early conversation (<=2 messages)', () => {
      const conversationHistory = [
        createTestMessage('Hello'),
        createTestMessage('Hi there!')
      ];

      const result = TokenAllocationCalculatorService.selectModulesForBudget(
        defaultPriorities,
        2000,
        conversationHistory
      );

      expect(result).toEqual({
        corePersona: true,
        highPriorityContext: false,
        progressionModules: false,
        realTimeContext: true,
        estimatedTokens: 900
      });
    });

    it('should select all modules for high priority and sufficient budget', () => {
      const conversationHistory = [
        createTestMessage('Hello'),
        createTestMessage('Hi there!'),
        createTestMessage('Tell me about your services')
      ];

      const highPriorities: ModulePriority = {
        corePersona: 0.9,
        highPriorityContext: 0.8,
        progressionModules: 0.7,
        realTimeContext: 0.6
      };

      const result = TokenAllocationCalculatorService.selectModulesForBudget(
        highPriorities,
        2000,
        conversationHistory
      );

      expect(result).toEqual({
        corePersona: true,
        highPriorityContext: true,
        progressionModules: true,
        realTimeContext: true,
        estimatedTokens: 1900 // 800 + 400 + 400 + 300
      });
    });

    it('should respect budget constraints', () => {
      const conversationHistory = [
        createTestMessage('Hello'),
        createTestMessage('Hi there!'),
        createTestMessage('Tell me about your services')
      ];

      const result = TokenAllocationCalculatorService.selectModulesForBudget(
        defaultPriorities,
        1000, // Limited budget
        conversationHistory
      );

      expect(result).toEqual({
        corePersona: true,
        highPriorityContext: false, // Would exceed budget
        progressionModules: false,  // Would exceed budget
        realTimeContext: false,     // Would exceed budget
        estimatedTokens: 800
      });
    });

    it('should respect priority thresholds', () => {
      const conversationHistory = [
        createTestMessage('Hello'),
        createTestMessage('Hi there!'),
        createTestMessage('Tell me about your services')
      ];

      const lowPriorities: ModulePriority = {
        corePersona: 0.9, // Always included
        highPriorityContext: 0.5, // Below threshold (0.6)
        progressionModules: 0.5,  // Below threshold (0.6)
        realTimeContext: 0.4      // Below threshold (0.5)
      };

      const result = TokenAllocationCalculatorService.selectModulesForBudget(
        lowPriorities,
        2000,
        conversationHistory
      );

      expect(result).toEqual({
        corePersona: true,
        highPriorityContext: false, // Priority too low
        progressionModules: false,  // Priority too low
        realTimeContext: false,     // Priority too low
        estimatedTokens: 800
      });
    });

    it('should handle partial module selection based on budget and priority', () => {
      const conversationHistory = [
        createTestMessage('Hello'),
        createTestMessage('Hi there!'),
        createTestMessage('Tell me about your services')
      ];

      const mixedPriorities: ModulePriority = {
        corePersona: 0.9,
        highPriorityContext: 0.8, // High enough
        progressionModules: 0.5,  // Too low
        realTimeContext: 0.6      // High enough
      };

      const result = TokenAllocationCalculatorService.selectModulesForBudget(
        mixedPriorities,
        1500, // Enough for some modules
        conversationHistory
      );

      expect(result).toEqual({
        corePersona: true,
        highPriorityContext: true,
        progressionModules: false, // Priority too low
        realTimeContext: true,
        estimatedTokens: 1500 // 800 + 400 + 300
      });
    });

    it('should handle edge case with exactly 2 messages', () => {
      const conversationHistory = [
        createTestMessage('Hello'),
        createTestMessage('How can I help you?')
      ];

      const result = TokenAllocationCalculatorService.selectModulesForBudget(
        defaultPriorities,
        2000,
        conversationHistory
      );

      expect(result.estimatedTokens).toBe(900);
      expect(result.corePersona).toBe(true);
      expect(result.highPriorityContext).toBe(false);
    });

    it('should handle empty conversation history', () => {
      const result = TokenAllocationCalculatorService.selectModulesForBudget(
        defaultPriorities,
        2000,
        []
      );

      expect(result.estimatedTokens).toBe(900);
      expect(result.corePersona).toBe(true);
      expect(result.highPriorityContext).toBe(false);
    });
  });

  describe('calculateAllocationEfficiency', () => {
    it('should calculate efficiency metrics correctly', () => {
      const allocation: TokenBudgetAllocation = {
        corePersona: 200,
        highPriorityContext: 300,
        progressionModules: 150,
        realTimeContext: 100,
        totalUsed: 750,
        totalAvailable: 1000
      };

      const result = TokenAllocationCalculatorService.calculateAllocationEfficiency(allocation);

      expect(result).toEqual({
        utilizationRate: 0.75,                        // 750/1000
        corePersonaRatio: 200/750,                    // ~0.267
        highPriorityRatio: 300/750,                   // 0.4
        progressionRatio: 150/750,                    // 0.2
        realTimeRatio: 100/750,                       // ~0.133
        wastedTokens: 250                             // 1000-750
      });
    });

    it('should handle perfect utilization', () => {
      const allocation: TokenBudgetAllocation = {
        corePersona: 400,
        highPriorityContext: 300,
        progressionModules: 200,
        realTimeContext: 100,
        totalUsed: 1000,
        totalAvailable: 1000
      };

      const result = TokenAllocationCalculatorService.calculateAllocationEfficiency(allocation);

      expect(result.utilizationRate).toBe(1.0);
      expect(result.wastedTokens).toBe(0);
      expect(result.corePersonaRatio).toBe(0.4);
    });

    it('should handle zero usage', () => {
      const allocation: TokenBudgetAllocation = {
        corePersona: 0,
        highPriorityContext: 0,
        progressionModules: 0,
        realTimeContext: 0,
        totalUsed: 0,
        totalAvailable: 1000
      };

      const result = TokenAllocationCalculatorService.calculateAllocationEfficiency(allocation);

      expect(result.utilizationRate).toBe(0);
      expect(result.wastedTokens).toBe(1000);
      expect(result.corePersonaRatio).toBe(0);
      expect(result.highPriorityRatio).toBe(0);
      expect(result.progressionRatio).toBe(0);
      expect(result.realTimeRatio).toBe(0);
    });

    it('should handle over-allocation (exceeding budget)', () => {
      const allocation: TokenBudgetAllocation = {
        corePersona: 600,
        highPriorityContext: 400,
        progressionModules: 300,
        realTimeContext: 200,
        totalUsed: 1500,
        totalAvailable: 1000
      };

      const result = TokenAllocationCalculatorService.calculateAllocationEfficiency(allocation);

      expect(result.utilizationRate).toBe(1.5);
      expect(result.wastedTokens).toBe(-500); // Negative indicates over-allocation
      expect(result.corePersonaRatio).toBe(0.4);
    });
  });

  describe('getAllocationSummary', () => {
    it('should generate comprehensive allocation summary', () => {
      const allocation: TokenBudgetAllocation = {
        corePersona: 600, // Above 500 threshold to avoid recommendation
        highPriorityContext: 200,
        progressionModules: 150,
        realTimeContext: 100,
        totalUsed: 1050,
        totalAvailable: 1200
      };

      const result = TokenAllocationCalculatorService.getAllocationSummary(allocation);

      expect(result.summary).toBe('Used 1050/1200 tokens (88% utilization)');
      expect(result.breakdown).toEqual([
        { category: 'Core Persona', tokens: 600, percentage: 57 },
        { category: 'High Priority Context', tokens: 200, percentage: 19 },
        { category: 'Progression Modules', tokens: 150, percentage: 14 },
        { category: 'Real-time Context', tokens: 100, percentage: 10 }
      ]);
      expect(result.recommendations).toEqual([]);
    });

    it('should generate recommendations for low utilization', () => {
      const allocation: TokenBudgetAllocation = {
        corePersona: 300,
        highPriorityContext: 100,
        progressionModules: 0,
        realTimeContext: 0,
        totalUsed: 400,
        totalAvailable: 1000
      };

      const result = TokenAllocationCalculatorService.getAllocationSummary(allocation);

      expect(result.summary).toBe('Used 400/1000 tokens (40% utilization)');
      expect(result.recommendations).toContain('Consider adding more context modules to improve response quality');
      expect(result.recommendations).toContain('Consider including real-time context for more dynamic responses');
    });

    it('should generate recommendation for low core persona allocation', () => {
      const allocation: TokenBudgetAllocation = {
        corePersona: 200, // Below 500 threshold
        highPriorityContext: 500,
        progressionModules: 200,
        realTimeContext: 100,
        totalUsed: 1000,
        totalAvailable: 1000
      };

      const result = TokenAllocationCalculatorService.getAllocationSummary(allocation);

      expect(result.recommendations).toContain('Core persona allocation seems low - ensure essential context is included');
    });

    it('should handle zero allocation', () => {
      const allocation: TokenBudgetAllocation = {
        corePersona: 0,
        highPriorityContext: 0,
        progressionModules: 0,
        realTimeContext: 0,
        totalUsed: 0,
        totalAvailable: 1000
      };

      const result = TokenAllocationCalculatorService.getAllocationSummary(allocation);

      expect(result.summary).toBe('Used 0/1000 tokens (0% utilization)');
      expect(result.breakdown).toEqual([
        { category: 'Core Persona', tokens: 0, percentage: 0 },
        { category: 'High Priority Context', tokens: 0, percentage: 0 },
        { category: 'Progression Modules', tokens: 0, percentage: 0 },
        { category: 'Real-time Context', tokens: 0, percentage: 0 }
      ]);
      expect(result.recommendations).toContain('Consider adding more context modules to improve response quality');
      expect(result.recommendations).toContain('Core persona allocation seems low - ensure essential context is included');
      expect(result.recommendations).toContain('Consider including real-time context for more dynamic responses');
    });

    it('should handle perfect allocation without recommendations', () => {
      const allocation: TokenBudgetAllocation = {
        corePersona: 600, // Above 500 threshold
        highPriorityContext: 200,
        progressionModules: 100,
        realTimeContext: 100, // Non-zero
        totalUsed: 1000,
        totalAvailable: 1000
      };

      const result = TokenAllocationCalculatorService.getAllocationSummary(allocation);

      expect(result.summary).toBe('Used 1000/1000 tokens (100% utilization)');
      expect(result.recommendations).toEqual([]);
    });

    it('should round percentages correctly', () => {
      const allocation: TokenBudgetAllocation = {
        corePersona: 333, // Should round to 33%
        highPriorityContext: 333,
        progressionModules: 334,
        realTimeContext: 0,
        totalUsed: 1000,
        totalAvailable: 1000
      };

      const result = TokenAllocationCalculatorService.getAllocationSummary(allocation);

      expect(result.breakdown[0].percentage).toBe(33);
      expect(result.breakdown[1].percentage).toBe(33);
      expect(result.breakdown[2].percentage).toBe(33);
      expect(result.breakdown[3].percentage).toBe(0);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle negative token values gracefully', () => {
      const modules = [
        createTestModule('userProfile', -100) // Negative tokens
      ];

      const result = TokenAllocationCalculatorService.calculateTokenAllocation(modules, 1000);

      expect(result.totalUsed).toBe(-100);
      expect(result.corePersona).toBe(-100);
    });

    it('should handle extremely large token budgets', () => {
      const modules = [
        createTestModule('userProfile', 1000000)
      ];

      const result = TokenAllocationCalculatorService.calculateTokenAllocation(modules, Number.MAX_SAFE_INTEGER);

      expect(result.totalUsed).toBe(1000000);
      expect(result.totalAvailable).toBe(Number.MAX_SAFE_INTEGER);
    });

    it('should handle very long conversation history for early conversation check', () => {
      const longHistory = Array.from({ length: 100 }, (_, i) => 
        createTestMessage(`Message ${i + 1}`)
      );

      const result = TokenAllocationCalculatorService.selectModulesForBudget(
        {
          corePersona: 0.9,
          highPriorityContext: 0.8,
          progressionModules: 0.7,
          realTimeContext: 0.6
        },
        2000,
        longHistory
      );

      // Should use full logic, not early conversation logic
      expect(result.estimatedTokens).toBeGreaterThan(900);
    });

    it('should handle floating point precision in calculations', () => {
      const allocation: TokenBudgetAllocation = {
        corePersona: 333.33,
        highPriorityContext: 333.33,
        progressionModules: 333.34,
        realTimeContext: 0,
        totalUsed: 1000,
        totalAvailable: 1000
      };

      const efficiency = TokenAllocationCalculatorService.calculateAllocationEfficiency(allocation);

      expect(efficiency.utilizationRate).toBe(1.0);
      expect(efficiency.corePersonaRatio).toBeCloseTo(0.33333, 5);
    });
  });

  describe('Integration Tests', () => {
    it('should work with realistic scenario - discovery phase conversation', () => {
      const discoveryConversation = [
        createTestMessage('Hello'),
        createTestMessage('Hi! How can I help you today?'),
        createTestMessage('I\'m looking for a CRM solution for my company'),
        createTestMessage('That\'s great! What size is your team?'),
        createTestMessage('We have about 50 employees')
      ];

      const priorities: ModulePriority = {
        corePersona: 0.9,
        highPriorityContext: 0.8,
        progressionModules: 0.6,
        realTimeContext: 0.7
      };

      const selected = TokenAllocationCalculatorService.selectModulesForBudget(
        priorities,
        1800,
        discoveryConversation
      );

      // Should select modules strategically for this budget
      expect(selected.corePersona).toBe(true);
      expect(selected.estimatedTokens).toBeLessThanOrEqual(1800);

      // Calculate allocation for selected modules
      const modules = [];
      if (selected.corePersona) {
        modules.push(createTestModule('userProfile', 200));
        modules.push(createTestModule('conversationPhase', 150));
      }
      if (selected.highPriorityContext) {
        modules.push(createTestModule('companyContext', 180));
        modules.push(createTestModule('knowledgeBase', 220));
      }

      const allocation = TokenAllocationCalculatorService.calculateTokenAllocation(modules, 1800);
      const efficiency = TokenAllocationCalculatorService.calculateAllocationEfficiency(allocation);
      const summary = TokenAllocationCalculatorService.getAllocationSummary(allocation);

      expect(efficiency.utilizationRate).toBeGreaterThan(0);
      expect(summary.breakdown.length).toBe(4);
      expect(summary.recommendations).toBeDefined();
    });

    it('should handle edge case with exactly budget limit', () => {
      const modules = [
        createTestModule('userProfile', 500),
        createTestModule('companyContext', 500)
      ];

      const allocation = TokenAllocationCalculatorService.calculateTokenAllocation(modules, 1000);
      const efficiency = TokenAllocationCalculatorService.calculateAllocationEfficiency(allocation);

      expect(allocation.totalUsed).toBe(1000);
      expect(allocation.totalAvailable).toBe(1000);
      expect(efficiency.utilizationRate).toBe(1.0);
      expect(efficiency.wastedTokens).toBe(0);
    });
  });
});