/**
 * ConversationFlow Value Object Unit Tests
 * 
 * AI INSTRUCTIONS:
 * - Test business logic and state transitions
 * - Focus on validation and error conditions
 * - Verify immutability and phase transition rules
 * - Keep under 250 lines per @golden-rule
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ConversationFlow, ConversationPhase } from '../ConversationFlowValueObjects';
import { InvalidConversationPhaseError } from '../../../errors/ChatbotWidgetDomainErrors';

describe('ConversationFlow', () => {
  describe('creation', () => {
    it('should create flow with default discovery phase', () => {
      const flow = ConversationFlow.create();
      
      expect(flow.currentPhase).toBe('discovery');
      expect(flow.phaseStartedAt).toBeInstanceOf(Date);
      expect(flow.phaseHistory).toHaveLength(1);
      expect(flow.phaseHistory[0].phase).toBe('discovery');
      expect(flow.phaseHistory[0].completionStatus).toBe('ongoing');
    });

    it('should create flow with specified phase', () => {
      const flow = ConversationFlow.create('qualification');
      
      expect(flow.currentPhase).toBe('qualification');
      expect(flow.phaseHistory[0].phase).toBe('qualification');
    });

    it('should initialize with current timestamp', () => {
      const beforeCreate = new Date();
      const flow = ConversationFlow.create();
      const afterCreate = new Date();
      
      expect(flow.phaseStartedAt.getTime()).toBeGreaterThanOrEqual(beforeCreate.getTime());
      expect(flow.phaseStartedAt.getTime()).toBeLessThanOrEqual(afterCreate.getTime());
    });
  });

  describe('phase transitions', () => {
    let flow: ConversationFlow;

    beforeEach(() => {
      flow = ConversationFlow.create('discovery');
    });

    it('should allow valid transition from discovery to qualification', () => {
      const newFlow = flow.transitionToPhase('qualification');
      
      expect(newFlow.currentPhase).toBe('qualification');
      expect(newFlow.phaseHistory).toHaveLength(2);
      expect(newFlow.phaseHistory[0].completionStatus).toBe('completed');
      expect(newFlow.phaseHistory[1].completionStatus).toBe('ongoing');
    });

    it('should allow valid transition from discovery to demo', () => {
      const newFlow = flow.transitionToPhase('demo');
      
      expect(newFlow.currentPhase).toBe('demo');
    });

    it('should reject invalid transition from discovery to closing', () => {
      expect(() => flow.transitionToPhase('closing')).toThrow(InvalidConversationPhaseError);
    });

    it('should maintain immutability during transitions', () => {
      const originalPhase = flow.currentPhase;
      const originalHistoryLength = flow.phaseHistory.length;
      
      flow.transitionToPhase('qualification');
      
      expect(flow.currentPhase).toBe(originalPhase);
      expect(flow.phaseHistory).toHaveLength(originalHistoryLength);
    });

    it('should update phase started time on transition', () => {
      const originalTime = flow.phaseStartedAt;
      
      // Small delay to ensure different timestamp
      setTimeout(() => {
        const newFlow = flow.transitionToPhase('qualification');
        expect(newFlow.phaseStartedAt.getTime()).toBeGreaterThan(originalTime.getTime());
      }, 1);
    });

    it('should preserve original flow history in transition', () => {
      const newFlow = flow.transitionToPhase('qualification');
      const finalFlow = newFlow.transitionToPhase('demo');
      
      expect(finalFlow.phaseHistory).toHaveLength(3);
      expect(finalFlow.phaseHistory[0].phase).toBe('discovery');
      expect(finalFlow.phaseHistory[1].phase).toBe('qualification');
      expect(finalFlow.phaseHistory[2].phase).toBe('demo');
    });
  });

  describe('valid transitions matrix', () => {
    const testTransitions = [
      { from: 'discovery', to: 'qualification', valid: true },
      { from: 'discovery', to: 'demo', valid: true },
      { from: 'discovery', to: 'objection_handling', valid: true },
      { from: 'discovery', to: 'closing', valid: false },
      { from: 'qualification', to: 'demo', valid: true },
      { from: 'qualification', to: 'closing', valid: true },
      { from: 'qualification', to: 'discovery', valid: false },
      { from: 'demo', to: 'qualification', valid: true },
      { from: 'demo', to: 'closing', valid: true },
      { from: 'objection_handling', to: 'closing', valid: true },
      { from: 'objection_handling', to: 'discovery', valid: true },
      { from: 'closing', to: 'objection_handling', valid: true },
      { from: 'closing', to: 'demo', valid: true },
      { from: 'closing', to: 'qualification', valid: false }
    ];

    testTransitions.forEach(({ from, to, valid }) => {
      it(`should ${valid ? 'allow' : 'reject'} transition from ${from} to ${to}`, () => {
        const flow = ConversationFlow.create(from as ConversationPhase);
        
        if (valid) {
          expect(() => flow.transitionToPhase(to as ConversationPhase)).not.toThrow();
        } else {
          expect(() => flow.transitionToPhase(to as ConversationPhase))
            .toThrow(InvalidConversationPhaseError);
        }
      });
    });
  });

  describe('duration calculation', () => {
    it('should calculate duration in current phase', () => {
      const flow = ConversationFlow.create();
      const duration = flow.getDurationInCurrentPhase();
      
      expect(duration).toBeGreaterThanOrEqual(0);
      expect(typeof duration).toBe('number');
    });

    it('should return increasing duration over time', async () => {
      const flow = ConversationFlow.create();
      const initialDuration = flow.getDurationInCurrentPhase();
      
      // Wait a small amount of time
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const laterDuration = flow.getDurationInCurrentPhase();
      expect(laterDuration).toBeGreaterThan(initialDuration);
    });
  });

  describe('error handling', () => {
    it('should throw InvalidConversationPhaseError with context', () => {
      const flow = ConversationFlow.create('discovery');
      
      try {
        flow.transitionToPhase('closing');
      } catch (error) {
        expect(error).toBeInstanceOf(InvalidConversationPhaseError);
        if (error instanceof InvalidConversationPhaseError) {
          expect(error.context).toHaveProperty('validTransitions');
        }
      }
    });
  });
});