/**
 * ConversationObjectives Value Object Unit Tests
 * 
 * AI INSTRUCTIONS:
 * - Test objective management business logic
 * - Focus on achievement and blocking operations
 * - Verify immutability and completion rate calculations
 * - Keep under 250 lines per @golden-rule
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ConversationObjectives } from '../ConversationFlowValueObjects';
import { ConversationFlowViolationError } from '../../../errors/ChatbotWidgetDomainErrors';

describe('ConversationObjectives', () => {
  describe('creation', () => {
    it('should create empty objectives by default', () => {
      const objectives = ConversationObjectives.create();
      
      expect(objectives.primary).toBeUndefined();
      expect(objectives.secondary).toEqual([]);
      expect(objectives.achieved).toEqual([]);
      expect(objectives.blocked).toEqual([]);
    });

    it('should create objectives with partial initialization', () => {
      const objectives = ConversationObjectives.create({
        primary: 'Identify pain points',
        secondary: ['Understand budget', 'Learn timeline']
      });
      
      expect(objectives.primary).toBe('Identify pain points');
      expect(objectives.secondary).toEqual(['Understand budget', 'Learn timeline']);
      expect(objectives.achieved).toEqual([]);
      expect(objectives.blocked).toEqual([]);
    });

    it('should create objectives with all fields specified', () => {
      const objectives = ConversationObjectives.create({
        primary: 'Close deal',
        secondary: ['Get contact info'],
        achieved: ['Build rapport'],
        blocked: ['Price negotiation']
      });
      
      expect(objectives.primary).toBe('Close deal');
      expect(objectives.secondary).toEqual(['Get contact info']);
      expect(objectives.achieved).toEqual(['Build rapport']);
      expect(objectives.blocked).toEqual(['Price negotiation']);
    });
  });

  describe('updates', () => {
    let objectives: ConversationObjectives;

    beforeEach(() => {
      objectives = ConversationObjectives.create({
        primary: 'Qualify lead',
        secondary: ['Understand needs', 'Check budget'],
        achieved: ['Build rapport']
      });
    });

    it('should update primary objective', () => {
      const updated = objectives.update({ primary: 'Schedule demo' });
      
      expect(updated.primary).toBe('Schedule demo');
      expect(updated.secondary).toEqual(objectives.secondary);
      expect(updated.achieved).toEqual(objectives.achieved);
    });

    it('should update secondary objectives', () => {
      const newSecondary = ['Learn decision process', 'Identify stakeholders'];
      const updated = objectives.update({ secondary: newSecondary });
      
      expect(updated.secondary).toEqual(newSecondary);
      expect(updated.primary).toBe(objectives.primary);
    });

    it('should maintain immutability during updates', () => {
      const originalPrimary = objectives.primary;
      const originalSecondary = [...objectives.secondary];
      
      objectives.update({ primary: 'New objective' });
      
      expect(objectives.primary).toBe(originalPrimary);
      expect(objectives.secondary).toEqual(originalSecondary);
    });

    it('should handle partial updates correctly', () => {
      const updated = objectives.update({ 
        achieved: [...objectives.achieved, 'Discovered pain point'] 
      });
      
      expect(updated.primary).toBe(objectives.primary);
      expect(updated.secondary).toEqual(objectives.secondary);
      expect(updated.achieved).toContain('Discovered pain point');
    });
  });

  describe('achieving objectives', () => {
    let objectives: ConversationObjectives;

    beforeEach(() => {
      objectives = ConversationObjectives.create({
        primary: 'Qualify lead',
        secondary: ['Understand needs', 'Check budget', 'Learn timeline'],
        blocked: ['Price discussion']
      });
    });

    it('should move secondary objective to achieved', () => {
      const updated = objectives.achieveObjective('Understand needs');
      
      expect(updated.achieved).toContain('Understand needs');
      expect(updated.secondary).not.toContain('Understand needs');
      expect(updated.secondary).toEqual(['Check budget', 'Learn timeline']);
    });

    it('should unblock objective when achieved', () => {
      const updated = objectives.achieveObjective('Price discussion');
      
      expect(updated.achieved).toContain('Price discussion');
      expect(updated.blocked).not.toContain('Price discussion');
    });

    it('should handle achieving non-existent objective', () => {
      const updated = objectives.achieveObjective('Non-existent objective');
      
      expect(updated.achieved).toContain('Non-existent objective');
      expect(updated.secondary).toEqual(objectives.secondary);
    });

    it('should be idempotent for already achieved objectives', () => {
      const firstUpdate = objectives.achieveObjective('Understand needs');
      const secondUpdate = firstUpdate.achieveObjective('Understand needs');
      
      expect(secondUpdate.achieved.filter(obj => obj === 'Understand needs')).toHaveLength(1);
      expect(secondUpdate).toBe(firstUpdate); // Should return same instance
    });

    it('should maintain immutability during achievement', () => {
      const originalSecondary = [...objectives.secondary];
      const originalAchieved = [...objectives.achieved];
      
      objectives.achieveObjective('Understand needs');
      
      expect(objectives.secondary).toEqual(originalSecondary);
      expect(objectives.achieved).toEqual(originalAchieved);
    });
  });

  describe('blocking objectives', () => {
    let objectives: ConversationObjectives;

    beforeEach(() => {
      objectives = ConversationObjectives.create({
        secondary: ['Understand needs', 'Check budget'],
        achieved: ['Build rapport']
      });
    });

    it('should block objective with reason', () => {
      const updated = objectives.blockObjective('Check budget', 'Client not ready');
      
      expect(updated.blocked).toContain('Check budget');
      expect(updated.secondary).toEqual(objectives.secondary);
      expect(updated.achieved).toEqual(objectives.achieved);
    });

    it('should block objective without reason', () => {
      const updated = objectives.blockObjective('Understand needs');
      
      expect(updated.blocked).toContain('Understand needs');
    });

    it('should be idempotent for already blocked objectives', () => {
      const firstUpdate = objectives.blockObjective('Check budget');
      const secondUpdate = firstUpdate.blockObjective('Check budget');
      
      expect(secondUpdate.blocked.filter(obj => obj === 'Check budget')).toHaveLength(1);
      expect(secondUpdate).toBe(firstUpdate); // Should return same instance
    });

    it('should throw error for empty objective', () => {
      expect(() => objectives.blockObjective('')).toThrow(ConversationFlowViolationError);
      expect(() => objectives.blockObjective('   ')).toThrow(ConversationFlowViolationError);
    });

    it('should include context in validation error', () => {
      try {
        objectives.blockObjective('', 'Test reason');
      } catch (error) {
        expect(error).toBeInstanceOf(ConversationFlowViolationError);
        if (error instanceof ConversationFlowViolationError) {
          expect(error.context).toHaveProperty('objective');
          expect(error.context).toHaveProperty('reason');
        }
      }
    });

    it('should maintain immutability during blocking', () => {
      const originalBlocked = [...objectives.blocked];
      
      objectives.blockObjective('New blocked objective');
      
      expect(objectives.blocked).toEqual(originalBlocked);
    });
  });

  describe('adding secondary objectives', () => {
    let objectives: ConversationObjectives;

    beforeEach(() => {
      objectives = ConversationObjectives.create({
        secondary: ['Understand needs'],
        achieved: ['Build rapport']
      });
    });

    it('should add new secondary objective', () => {
      const updated = objectives.addSecondaryObjective('Check decision timeline');
      
      expect(updated.secondary).toContain('Check decision timeline');
      expect(updated.secondary).toContain('Understand needs');
    });

    it('should be idempotent for existing secondary objectives', () => {
      const updated = objectives.addSecondaryObjective('Understand needs');
      
      expect(updated.secondary.filter(obj => obj === 'Understand needs')).toHaveLength(1);
      expect(updated).toBe(objectives); // Should return same instance
    });

    it('should not add already achieved objectives', () => {
      const updated = objectives.addSecondaryObjective('Build rapport');
      
      expect(updated.secondary).not.toContain('Build rapport');
      expect(updated).toBe(objectives); // Should return same instance
    });

    it('should maintain immutability during addition', () => {
      const originalSecondary = [...objectives.secondary];
      
      objectives.addSecondaryObjective('New objective');
      
      expect(objectives.secondary).toEqual(originalSecondary);
    });
  });

  describe('completion rate calculation', () => {
    it('should return 0 for no objectives', () => {
      const objectives = ConversationObjectives.create();
      
      expect(objectives.getCompletionRate()).toBe(0);
    });

    it('should calculate rate with only primary objective', () => {
      const objectives = ConversationObjectives.create({
        primary: 'Main goal'
      });
      
      expect(objectives.getCompletionRate()).toBe(0); // Not achieved yet
    });

    it('should calculate rate with mixed objectives', () => {
      const objectives = ConversationObjectives.create({
        primary: 'Main goal',
        secondary: ['Goal 1', 'Goal 2'],
        achieved: ['Goal 1']
      });
      
      // 1 achieved out of 4 total (1 achieved + 2 secondary + 1 primary)
      // Implementation counts achieved in both numerator and denominator
      expect(objectives.getCompletionRate()).toBe(1/4);
    });

    it('should calculate 100% completion rate', () => {
      const objectives = ConversationObjectives.create({
        achieved: ['Goal 1', 'Goal 2']
      });
      
      expect(objectives.getCompletionRate()).toBe(1);
    });

    it('should ignore blocked objectives in rate calculation', () => {
      const objectives = ConversationObjectives.create({
        secondary: ['Goal 1'],
        achieved: ['Goal 2'],
        blocked: ['Blocked goal']
      });
      
      // 1 achieved out of 2 total (ignored blocked)
      expect(objectives.getCompletionRate()).toBe(0.5);
    });

    it('should handle edge case with only achieved objectives', () => {
      const objectives = ConversationObjectives.create({
        achieved: ['Already done 1', 'Already done 2']
      });
      
      expect(objectives.getCompletionRate()).toBe(1);
    });
  });
});