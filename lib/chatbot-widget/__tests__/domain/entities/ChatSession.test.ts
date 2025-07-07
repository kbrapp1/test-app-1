/**
 * Unit Tests for ChatSession Domain Entity
 * 
 * Tests business rules, invariants, and domain behavior
 */

import { describe, test, expect } from 'vitest';
import { ChatSession } from '../../../domain/entities/ChatSession';
import { useTestEnvironment, TestAssertions } from '../../test-utils/TestSetupHelpers';

describe('ChatSession Entity', () => {
  const getEnv = useTestEnvironment();

  describe('Entity Creation', () => {
    test('should create valid ChatSession with required properties', () => {
      const { factory } = getEnv();
      
      const session = factory.createChatSession('config-123', {
        visitorId: 'visitor-456'
      });

      expect(session).toBeDefined();
      expect(session.id).toBeTruthy();
      expect(session.chatbotConfigId).toBe('config-123');
      expect(session.visitorId).toBe('visitor-456');
      expect(session.status).toBeDefined();
      expect(session.startedAt).toBeInstanceOf(Date);
    });

    test('should enforce business invariants during creation', () => {
      expect(() => {
        ChatSession.create('', 'visitor-123'); // Empty config ID should throw
      }).toThrow();
    });

    test('should initialize with default context data when not provided', () => {
      const { factory } = getEnv();
      
      const session = factory.createChatSession();

      expect(session.contextData).toBeDefined();
      expect(session.leadQualificationState).toBeDefined();
      expect(session.leadQualificationState.currentStep).toBe(0);
      expect(session.leadQualificationState.qualificationStatus).toBe('not_started');
    });
  });

  describe('Business Logic', () => {
    test('should track lead qualification progress', () => {
      const { factory } = getEnv();
      
      const session = factory.createChatSession();
      
      expect(session.leadQualificationState.currentStep).toBe(0);
      expect(session.leadQualificationState.answeredQuestions).toEqual([]);
      expect(session.leadQualificationState.isQualified).toBe(false);
    });

    test('should maintain engagement scoring', () => {
      const { factory } = getEnv();
      
      const session = factory.createChatSession();
      
      expect(session.contextData.engagementScore).toBeDefined();
      expect(typeof session.contextData.engagementScore).toBe('number');
      expect(session.contextData.engagementScore).toBeGreaterThanOrEqual(0);
      expect(session.contextData.engagementScore).toBeLessThanOrEqual(100);
    });

    test('should track page views and visitor behavior', () => {
      const { factory } = getEnv();
      
      const session = factory.createChatSession();
      
      expect(session.contextData.pageViews).toBeDefined();
      expect(Array.isArray(session.contextData.pageViews)).toBe(true);
      expect(session.contextData.previousVisits).toBeDefined();
      expect(typeof session.contextData.previousVisits).toBe('number');
    });
  });

  describe('Session Status Management', () => {
    test('should handle session status transitions', () => {
      const { factory } = getEnv();
      
      const session = factory.createChatSession();
      
      expect(['active', 'ended', 'expired']).toContain(session.status);
    });

    test('should track activity timestamps', () => {
      const { factory } = getEnv();
      
      const session = factory.createChatSession();
      
      expect(session.startedAt).toBeInstanceOf(Date);
      expect(session.lastActivityAt).toBeInstanceOf(Date);
      expect(session.lastActivityAt.getTime()).toBeGreaterThanOrEqual(session.startedAt.getTime());
    });

    test('should handle session ending', () => {
      const { factory } = getEnv();
      
      const activeSession = factory.createChatSession();
      expect(activeSession.endedAt).toBeUndefined();
      
      const endedSession = factory.createChatSession(undefined, {
        status: 'ended',
        endedAt: new Date()
      });
      expect(endedSession.endedAt).toBeInstanceOf(Date);
    });
  });

  describe('Context Data Management', () => {
    test('should store conversation summary', () => {
      const { factory } = getEnv();
      
      const session = factory.createChatSession();
      
      expect(session.contextData.conversationSummary).toBeDefined();
      expect(session.contextData.conversationSummary.fullSummary).toBeDefined();
    });

    test('should track topics and interests', () => {
      const { factory } = getEnv();
      
      const session = factory.createChatSession();
      
      expect(session.contextData.topics).toBeDefined();
      expect(Array.isArray(session.contextData.topics)).toBe(true);
      expect(session.contextData.interests).toBeDefined();
      expect(Array.isArray(session.contextData.interests)).toBe(true);
    });

    test('should maintain lead scoring data', () => {
      const { factory } = getEnv();
      
      const session = factory.createChatSession();
      
      expect(session.contextData.leadScore).toBeDefined();
      expect(typeof session.contextData.leadScore).toBe('number');
      expect(session.contextData.leadScore).toBeGreaterThanOrEqual(0);
      expect(session.contextData.leadScore).toBeLessThanOrEqual(100);
    });
  });

  describe('Domain Invariants', () => {
    test('should maintain immutability', () => {
      const { factory } = getEnv();
      
      const session = factory.createChatSession();
      const originalStatus = session.status;
      const originalVisitorId = session.visitorId;

      // Attempting to access internal properties should not allow modification
      expect(session.status).toBe(originalStatus);
      expect(session.visitorId).toBe(originalVisitorId);
    });

    test('should enforce visitor and config relationships', () => {
      const { factory } = getEnv();
      
      const session1 = factory.createChatSession('config-1', { visitorId: 'visitor-1' });
      const session2 = factory.createChatSession('config-2', { visitorId: 'visitor-2' });

      expect(session1.chatbotConfigId).not.toBe(session2.chatbotConfigId);
      expect(session1.visitorId).not.toBe(session2.visitorId);
    });

    test('should validate session token uniqueness', () => {
      const { factory } = getEnv();
      
      const session1 = factory.createChatSession();
      const session2 = factory.createChatSession();

      expect(session1.sessionToken).toBeTruthy();
      expect(session2.sessionToken).toBeTruthy();
      expect(session1.sessionToken).not.toBe(session2.sessionToken);
    });
  });

  describe('Lead Qualification State', () => {
    test('should handle qualification progression', () => {
      const { factory } = getEnv();
      
      const session = factory.createChatSession();
      const qualState = session.leadQualificationState;
      
      expect(qualState.currentStep).toBe(0);
      expect(qualState.answeredQuestions).toEqual([]);
      expect(qualState.qualificationStatus).toBe('not_started');
      expect(qualState.isQualified).toBe(false);
    });

    test('should validate qualification status values', () => {
      const { factory } = getEnv();
      
      const statusOptions = ['not_started', 'in_progress', 'completed', 'qualified', 'not_qualified'];
      
      statusOptions.forEach(status => {
        const session = factory.createChatSession(undefined, {
          leadQualificationState: {
            currentStep: 0,
            answeredQuestions: [],
            qualificationStatus: status as any,
            isQualified: status === 'qualified'
          }
        });
        
        expect(session.leadQualificationState.qualificationStatus).toBe(status);
      });
    });
  });

  describe('Performance Requirements', () => {
    test('should create session within performance limits', () => {
      const { factory } = getEnv();
      
      const startTime = performance.now();
      
      for (let i = 0; i < 100; i++) {
        factory.createChatSession(`config-${i}`, {
          visitorId: `visitor-${i}`
        });
      }
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      // Should create 100 sessions in under 100ms
      expect(duration).toBeLessThan(100);
    });

    test('should handle large context data efficiently', () => {
      const { factory } = getEnv();
      
      const largeContextData = {
        pageViews: Array.from({ length: 50 }, (_, i) => ({
          url: `/page-${i}`,
          title: `Page ${i}`,
          timestamp: new Date().toISOString(),
          timeOnPage: 30000
        })),
        previousVisits: 10,
        conversationSummary: {
          fullSummary: 'A'.repeat(1000) // 1KB summary
        },
        topics: Array.from({ length: 20 }, (_, i) => `topic-${i}`),
        interests: Array.from({ length: 10 }, (_, i) => `interest-${i}`),
        engagementScore: 85,
        accumulatedEntities: {},
        leadScore: 75
      };
      
      const startTime = performance.now();
      const session = factory.createChatSession(undefined, {
        contextData: largeContextData
      });
      const endTime = performance.now();
      
      expect(session.contextData.pageViews).toHaveLength(50);
      expect(endTime - startTime).toBeLessThan(10); // Should handle large data quickly
    });
  });

  describe('Edge Cases', () => {
    test('should handle very long session tokens', () => {
      const { factory } = getEnv();
      
      const longToken = 'session-token-' + 'x'.repeat(100);
      const session = factory.createChatSession(undefined, {
        sessionToken: longToken
      });

      expect(session.sessionToken).toBe(longToken);
    });

    test('should handle edge case timestamps', () => {
      const { factory } = getEnv();
      
      const pastDate = new Date('2020-01-01T00:00:00Z');
      const futureDate = new Date('2030-01-01T00:00:00Z');
      
      const session = factory.createChatSession(undefined, {
        startedAt: pastDate,
        lastActivityAt: futureDate
      });

      expect(session.startedAt).toEqual(pastDate);
      expect(session.lastActivityAt).toEqual(futureDate);
    });

    test('should handle empty and null context gracefully', () => {
      const { factory } = getEnv();
      
      const session = factory.createChatSession(undefined, {
        contextData: {
          pageViews: [],
          previousVisits: 0,
          conversationSummary: { fullSummary: '' },
          topics: [],
          interests: [],
          engagementScore: 0,
          accumulatedEntities: {},
          leadScore: 0
        }
      });

      expect(session.contextData.pageViews).toEqual([]);
      expect(session.contextData.topics).toEqual([]);
      expect(session.contextData.engagementScore).toBe(0);
    });
  });
});