import { describe, it, expect } from 'vitest';
import { ContextTokenBudgetDomainService } from '../ContextTokenBudgetDomainService';
import { ChatMessage } from '../../../entities/ChatMessage';
import { ContextModule, ContextSelectionCriteria } from '../../interfaces/ContextInjectionTypes';

describe('ContextTokenBudgetDomainService', () => {
  // Helper function to create chat messages
  const createChatMessage = (content: string): ChatMessage => {
    return ChatMessage.createUserMessage('session-1', content);
  };

  describe('calculatePriorityScores', () => {
    it('should return minimal context for early conversations', () => {
      const history: ChatMessage[] = [
        createChatMessage('Hello')
      ];

      const scores = ContextTokenBudgetDomainService.calculatePriorityScores(history);

      expect(scores.corePersona).toBe(1.0);
      expect(scores.highPriorityContext).toBe(0.2);
      expect(scores.progressionModules).toBe(0.1);
      expect(scores.realTimeContext).toBe(0.5);
    });

    it('should increase priority for complex entities', () => {
      const history: ChatMessage[] = Array.from({ length: 5 }, (_, i) => 
        createChatMessage(`Message ${i + 1}`)
      );

      const entityData = { name: 'John', company: 'ABC Corp', industry: 'Tech', budget: 10000 };
      const scores = ContextTokenBudgetDomainService.calculatePriorityScores(history, entityData);

      expect(scores.corePersona).toBe(1.0);
      expect(scores.highPriorityContext).toBe(0.9);
    });

    it('should increase priority for high-value leads', () => {
      const history: ChatMessage[] = Array.from({ length: 5 }, (_, i) => 
        createChatMessage(`Message ${i + 1}`)
      );

      const scores = ContextTokenBudgetDomainService.calculatePriorityScores(history, undefined, 80);

      expect(scores.corePersona).toBe(1.0);
      expect(scores.progressionModules).toBe(0.8);
    });
  });

  describe('selectModulesForBudget', () => {
    it('should select minimal modules for early conversations', () => {
      const history: ChatMessage[] = [
        createChatMessage('Hello')
      ];

      const priorities = { corePersona: 1.0, highPriorityContext: 0.2, progressionModules: 0.1, realTimeContext: 0.5 };
      const selected = ContextTokenBudgetDomainService.selectModulesForBudget(priorities, 1500, history);

      expect(selected.corePersona).toBe(true);
      expect(selected.highPriorityContext).toBe(false);
      expect(selected.progressionModules).toBe(false);
      expect(selected.realTimeContext).toBe(true);
      expect(selected.estimatedTokens).toBe(900);
    });

    it('should select additional modules for longer conversations with high priorities', () => {
      const history: ChatMessage[] = Array.from({ length: 10 }, (_, i) => 
        createChatMessage(`Message ${i + 1}`)
      );

      const priorities = { corePersona: 1.0, highPriorityContext: 0.8, progressionModules: 0.7, realTimeContext: 0.6 };
      const selected = ContextTokenBudgetDomainService.selectModulesForBudget(priorities, 2000, history);

      expect(selected.corePersona).toBe(true);
      expect(selected.highPriorityContext).toBe(true);
      expect(selected.progressionModules).toBe(true);
      expect(selected.realTimeContext).toBe(true);
      expect(selected.estimatedTokens).toBe(1900);
    });

    it('should respect token budget constraints', () => {
      const history: ChatMessage[] = Array.from({ length: 5 }, (_, i) => 
        createChatMessage(`Message ${i + 1}`)
      );

      const priorities = { corePersona: 1.0, highPriorityContext: 0.8, progressionModules: 0.7, realTimeContext: 0.6 };
      const selected = ContextTokenBudgetDomainService.selectModulesForBudget(priorities, 1000, history);

      expect(selected.estimatedTokens).toBeLessThanOrEqual(1000);
      expect(selected.corePersona).toBe(true);
    });
  });

  describe('validateTokenBudget', () => {
    it('should validate token budget constraints', () => {
      const modules: ContextModule[] = [
        { type: 'userProfile', content: () => 'User profile', estimatedTokens: 300, priority: 0.8, relevanceScore: 0.9 },
        { type: 'conversationPhase', content: () => 'Phase context', estimatedTokens: 200, priority: 0.7, relevanceScore: 0.8 }
      ];

      const result = ContextTokenBudgetDomainService.validateTokenBudget(modules, 1000);

      expect(result.isValid).toBe(true);
      expect(result.violations).toHaveLength(0);
    });

    it('should detect budget violations', () => {
      const modules: ContextModule[] = [
        { type: 'userProfile', content: () => 'User profile', estimatedTokens: 800, priority: 0.8, relevanceScore: 0.9 },
        { type: 'conversationPhase', content: () => 'Phase context', estimatedTokens: 600, priority: 0.7, relevanceScore: 0.8 }
      ];

      const result = ContextTokenBudgetDomainService.validateTokenBudget(modules, 1000);

      expect(result.isValid).toBe(false);
      expect(result.violations).toContain('Token usage (1400) exceeds budget (1000)');
      expect(result.recommendations).toContain('Remove lower-priority modules or increase token budget');
    });

    it('should detect missing essential modules', () => {
      const modules: ContextModule[] = [
        { type: 'knowledgeBase', content: () => 'Knowledge base', estimatedTokens: 300, priority: 0.8, relevanceScore: 0.9 }
      ];

      const result = ContextTokenBudgetDomainService.validateTokenBudget(modules, 1000);

      expect(result.isValid).toBe(false);
      expect(result.violations).toContain('Missing essential context modules');
      expect(result.recommendations).toContain('Include at least user profile or conversation phase context');
    });

    it('should recommend adding more context for low usage', () => {
      const modules: ContextModule[] = [
        { type: 'userProfile', content: () => 'User profile', estimatedTokens: 200, priority: 0.8, relevanceScore: 0.9 }
      ];

      const result = ContextTokenBudgetDomainService.validateTokenBudget(modules, 1000, 500);

      expect(result.isValid).toBe(true);
      expect(result.recommendations).toContain('Consider adding more context modules for better responses');
    });
  });

  describe('getRecommendedTokenBudget', () => {
    it('should recommend minimal budget for early conversations', () => {
      const criteria: ContextSelectionCriteria = {
        availableTokens: 1500,
        messageCount: 1,
        entityData: {},
        leadScore: 30
      };

      const result = ContextTokenBudgetDomainService.getRecommendedTokenBudget(criteria);

      expect(result.recommended).toBe(800);
      expect(result.minimum).toBe(500);  // Math.max(500, 800 * 0.6) = Math.max(500, 480) = 500
      expect(result.maximum).toBe(1200);
      expect(result.reasoning).toContain('Early conversation - minimal context needed');
    });

    it('should recommend higher budget for extended conversations', () => {
      const criteria: ContextSelectionCriteria = {
        availableTokens: 2500,
        messageCount: 15,
        entityData: {},
        leadScore: 30
      };

      const result = ContextTokenBudgetDomainService.getRecommendedTokenBudget(criteria);

      expect(result.recommended).toBe(2000);
      expect(result.reasoning).toContain('Extended conversation - comprehensive context valuable');
    });

    it('should increase budget for high-value leads', () => {
      const criteria: ContextSelectionCriteria = {
        availableTokens: 2000,
        messageCount: 5,
        entityData: {},
        leadScore: 80
      };

      const result = ContextTokenBudgetDomainService.getRecommendedTokenBudget(criteria);

      expect(result.recommended).toBe(1800);
      expect(result.reasoning).toContain('High-value lead - enhanced context justified');
    });

    it('should increase budget for complex entity data', () => {
      const criteria: ContextSelectionCriteria = {
        availableTokens: 2000,
        messageCount: 5,
        entityData: { name: 'John', company: 'ABC', industry: 'Tech', budget: 10000 },
        leadScore: 30
      };

      const result = ContextTokenBudgetDomainService.getRecommendedTokenBudget(criteria);

      expect(result.recommended).toBe(1700);
      expect(result.reasoning).toContain('Complex entity data - additional context valuable');
    });
  });

  describe('selectModulesWithinBudget', () => {
    it('should select modules within budget using priority-based allocation', () => {
      const modules: ContextModule[] = [
        { type: 'userProfile', content: () => 'User profile', estimatedTokens: 300, priority: 0.9, relevanceScore: 0.9 },
        { type: 'conversationPhase', content: () => 'Phase context', estimatedTokens: 200, priority: 0.8, relevanceScore: 0.8 },
        { type: 'knowledgeBase', content: () => 'Knowledge base', estimatedTokens: 400, priority: 0.7, relevanceScore: 0.7 }
      ];

      const criteria: ContextSelectionCriteria = {
        availableTokens: 600,
        messageCount: 5,
        entityData: {},
        leadScore: 50
      };

      const result = ContextTokenBudgetDomainService.selectModulesWithinBudget(modules, 600, criteria);

      expect(result.selectedModules).toHaveLength(2);
      expect(result.selectedModules[0].priority).toBe(0.9);
      expect(result.selectedModules[1].priority).toBe(0.8);
      expect(result.allocation.totalUsed).toBe(500);
    });

    it('should use minimal modules for early conversations', () => {
      const modules: ContextModule[] = [
        { type: 'userProfile', content: () => 'User profile', estimatedTokens: 300, priority: 0.9, relevanceScore: 0.9 },
        { type: 'conversationPhase', content: () => 'Phase context', estimatedTokens: 200, priority: 0.8, relevanceScore: 0.8 },
        { type: 'businessHours', content: () => 'Business hours', estimatedTokens: 150, priority: 0.7, relevanceScore: 0.7 }
      ];

      const criteria: ContextSelectionCriteria = {
        availableTokens: 1000,
        messageCount: 1,
        entityData: {},
        leadScore: 30
      };

      const result = ContextTokenBudgetDomainService.selectModulesWithinBudget(modules, 1000, criteria);

      expect(result.selectedModules.length).toBeLessThanOrEqual(3);
      expect(result.selectedModules.every(m => ['userProfile', 'conversationPhase', 'businessHours'].includes(m.type))).toBe(true);
    });
  });
});