/**
 * PhaseTransition Value Object Unit Tests
 * 
 * AI INSTRUCTIONS:
 * - Test state transitions and completion logic
 * - Focus on business rules for phase completion
 * - Verify immutability and error conditions
 * - Keep under 250 lines per @golden-rule
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { PhaseTransition, ConversationPhase } from '../ConversationFlowValueObjects';
import { ConversationFlowViolationError } from '../../../errors/ChatbotWidgetDomainErrors';

describe('PhaseTransition', () => {
  let startTime: Date;
  let transition: PhaseTransition;

  beforeEach(() => {
    startTime = new Date();
    transition = PhaseTransition.create('discovery', startTime, 'ongoing');
  });

  describe('creation', () => {
    it('should create transition with specified parameters', () => {
      const phase: ConversationPhase = 'qualification';
      const started = new Date();
      const transition = PhaseTransition.create(phase, started, 'ongoing');
      
      expect(transition.phase).toBe(phase);
      expect(transition.startedAt).toBe(started);
      expect(transition.completionStatus).toBe('ongoing');
      expect(transition.duration).toBeUndefined();
    });

    it('should create completed transition with duration', () => {
      const started = new Date();
      const transition = PhaseTransition.create('demo', started, 'completed');
      
      expect(transition.completionStatus).toBe('completed');
    });

    it('should create interrupted transition', () => {
      const transition = PhaseTransition.create('closing', startTime, 'interrupted');
      
      expect(transition.completionStatus).toBe('interrupted');
    });
  });

  describe('completion', () => {
    it('should complete ongoing transition successfully', () => {
      const endTime = new Date(startTime.getTime() + 5000); // 5 seconds later
      const completed = transition.complete(endTime);
      
      expect(completed.completionStatus).toBe('completed');
      expect(completed.duration).toBe(5000);
      expect(completed.phase).toBe(transition.phase);
      expect(completed.startedAt).toBe(transition.startedAt);
    });

    it('should calculate correct duration on completion', () => {
      const duration = 10000; // 10 seconds
      const endTime = new Date(startTime.getTime() + duration);
      const completed = transition.complete(endTime);
      
      expect(completed.duration).toBe(duration);
    });

    it('should maintain immutability during completion', () => {
      const endTime = new Date();
      const originalStatus = transition.completionStatus;
      
      transition.complete(endTime);
      
      expect(transition.completionStatus).toBe(originalStatus);
      expect(transition.duration).toBeUndefined();
    });

    it('should throw error when completing already completed transition', () => {
      const endTime = new Date();
      const completed = transition.complete(endTime);
      
      expect(() => completed.complete(new Date())).toThrow(ConversationFlowViolationError);
    });

    it('should throw error when completing interrupted transition', () => {
      const endTime = new Date();
      const interrupted = transition.interrupt(endTime);
      
      expect(() => interrupted.complete(new Date())).toThrow(ConversationFlowViolationError);
    });

    it('should include context in completion error', () => {
      const endTime = new Date();
      const completed = transition.complete(endTime);
      
      try {
        completed.complete(new Date());
      } catch (error) {
        expect(error).toBeInstanceOf(ConversationFlowViolationError);
        if (error instanceof ConversationFlowViolationError) {
          expect(error.context).toHaveProperty('phase');
          expect(error.context).toHaveProperty('currentStatus');
          expect(error.context.currentStatus).toBe('completed');
        }
      }
    });
  });

  describe('interruption', () => {
    it('should interrupt ongoing transition successfully', () => {
      const endTime = new Date(startTime.getTime() + 3000); // 3 seconds later
      const interrupted = transition.interrupt(endTime);
      
      expect(interrupted.completionStatus).toBe('interrupted');
      expect(interrupted.duration).toBe(3000);
      expect(interrupted.phase).toBe(transition.phase);
      expect(interrupted.startedAt).toBe(transition.startedAt);
    });

    it('should calculate correct duration on interruption', () => {
      const duration = 7500; // 7.5 seconds
      const endTime = new Date(startTime.getTime() + duration);
      const interrupted = transition.interrupt(endTime);
      
      expect(interrupted.duration).toBe(duration);
    });

    it('should maintain immutability during interruption', () => {
      const endTime = new Date();
      const originalStatus = transition.completionStatus;
      
      transition.interrupt(endTime);
      
      expect(transition.completionStatus).toBe(originalStatus);
      expect(transition.duration).toBeUndefined();
    });

    it('should throw error when interrupting already completed transition', () => {
      const endTime = new Date();
      const completed = transition.complete(endTime);
      
      expect(() => completed.interrupt(new Date())).toThrow(ConversationFlowViolationError);
    });

    it('should throw error when interrupting already interrupted transition', () => {
      const endTime = new Date();
      const interrupted = transition.interrupt(endTime);
      
      expect(() => interrupted.interrupt(new Date())).toThrow(ConversationFlowViolationError);
    });

    it('should include context in interruption error', () => {
      const endTime = new Date();
      const interrupted = transition.interrupt(endTime);
      
      try {
        interrupted.interrupt(new Date());
      } catch (error) {
        expect(error).toBeInstanceOf(ConversationFlowViolationError);
        if (error instanceof ConversationFlowViolationError) {
          expect(error.context).toHaveProperty('phase');
          expect(error.context).toHaveProperty('currentStatus');
          expect(error.context.currentStatus).toBe('interrupted');
        }
      }
    });
  });

  describe('edge cases', () => {
    it('should handle zero duration transitions', () => {
      const sameTime = new Date(startTime.getTime());
      const completed = transition.complete(sameTime);
      
      expect(completed.duration).toBe(0);
    });

    it('should handle future start times correctly', () => {
      const futureStart = new Date(Date.now() + 1000);
      const futureTransition = PhaseTransition.create('demo', futureStart, 'ongoing');
      const endTime = new Date(futureStart.getTime() + 2000);
      
      const completed = futureTransition.complete(endTime);
      expect(completed.duration).toBe(2000);
    });

    it('should preserve all properties during state changes', () => {
      const phase: ConversationPhase = 'objection_handling';
      const started = new Date();
      const original = PhaseTransition.create(phase, started, 'ongoing');
      
      const completed = original.complete(new Date(started.getTime() + 1000));
      
      expect(completed.phase).toBe(phase);
      expect(completed.startedAt).toBe(started);
      expect(completed.completionStatus).toBe('completed');
      expect(completed.duration).toBe(1000);
    });
  });

  describe('business rules', () => {
    it('should maintain duration immutability through proper API', () => {
      const endTime = new Date(startTime.getTime() + 5000);
      const completed = transition.complete(endTime);
      
      // Verify duration is set correctly and cannot be changed through the API
      expect(completed.duration).toBe(5000);
      
      // The duration property is readonly and should maintain its value
      // Any attempt to complete again should throw an error, preserving immutability
      expect(() => completed.complete(new Date())).toThrow(ConversationFlowViolationError);
      expect(completed.duration).toBe(5000); // Duration remains unchanged
    });

    it('should maintain phase identity through state changes', () => {
      const originalPhase = transition.phase;
      const completed = transition.complete(new Date());
      
      expect(completed.phase).toBe(originalPhase);
    });

    it('should maintain start time through state changes', () => {
      const originalStartTime = transition.startedAt;
      const interrupted = transition.interrupt(new Date());
      
      expect(interrupted.startedAt).toBe(originalStartTime);
    });
  });
});