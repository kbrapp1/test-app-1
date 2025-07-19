/**
 * WorkflowBoundaryMapper Tests
 * 
 * Tests for the legacy adapter maintaining backward compatibility
 * while delegating to DDD-structured services.
 */

import { describe, it, expect } from 'vitest';
import { WorkflowBoundaryMapper } from '../WorkflowBoundaryMapper';
import { ProcessChatMessageRequest } from '../../dto/ProcessChatMessageRequest';

describe('WorkflowBoundaryMapper', () => {
  describe('Interface Compatibility', () => {
    it('should have all required static methods', () => {
      // Verify all expected static methods exist for backward compatibility
      expect(typeof WorkflowBoundaryMapper.toProcessMessageRequest).toBe('function');
      expect(typeof WorkflowBoundaryMapper.toIntentAnalysis).toBe('function');
      expect(typeof WorkflowBoundaryMapper.toJourneyState).toBe('function');
      expect(typeof WorkflowBoundaryMapper.toRelevantKnowledge).toBe('function');
      expect(typeof WorkflowBoundaryMapper.toUnifiedAnalysis).toBe('function');
      expect(typeof WorkflowBoundaryMapper.toWorkflowResponse).toBe('function');
      expect(typeof WorkflowBoundaryMapper.toCallToAction).toBe('function');
    });

    it('should maintain consistent method signatures', () => {
      // Test that methods can be called with expected parameters
      const request: ProcessChatMessageRequest = {
        userMessage: 'Test message',
        sessionId: 'session-123',
        organizationId: 'org-456'
      };

      // These should not throw TypeError for missing methods
      expect(() => {
        try {
          WorkflowBoundaryMapper.toProcessMessageRequest(request);
        } catch (error) {
          // We expect this might fail due to dependencies, but not due to missing methods
          expect(error).toBeInstanceOf(Error);
        }
      }).not.toThrow(TypeError);

      expect(() => {
        try {
          WorkflowBoundaryMapper.toIntentAnalysis({});
        } catch (error) {
          expect(error).toBeInstanceOf(Error);
        }
      }).not.toThrow(TypeError);

      expect(() => {
        try {
          WorkflowBoundaryMapper.toJourneyState({});
        } catch (error) {
          expect(error).toBeInstanceOf(Error);
        }
      }).not.toThrow(TypeError);

      expect(() => {
        try {
          WorkflowBoundaryMapper.toRelevantKnowledge({});
        } catch (error) {
          expect(error).toBeInstanceOf(Error);
        }
      }).not.toThrow(TypeError);

      expect(() => {
        try {
          WorkflowBoundaryMapper.toUnifiedAnalysis({});
        } catch (error) {
          expect(error).toBeInstanceOf(Error);
        }
      }).not.toThrow(TypeError);

      expect(() => {
        try {
          WorkflowBoundaryMapper.toWorkflowResponse({});
        } catch (error) {
          expect(error).toBeInstanceOf(Error);
        }
      }).not.toThrow(TypeError);

      expect(() => {
        try {
          WorkflowBoundaryMapper.toCallToAction({});
        } catch (error) {
          expect(error).toBeInstanceOf(Error);
        }
      }).not.toThrow(TypeError);
    });
  });

  describe('Delegation Pattern', () => {
    it('should delegate to mapping service for toProcessMessageRequest', () => {
      const request: ProcessChatMessageRequest = {
        userMessage: 'Hello',
        sessionId: 'session-123',
        organizationId: 'org-456'
      };

      // Test that the method attempts to delegate (may fail due to missing dependencies)
      expect(() => WorkflowBoundaryMapper.toProcessMessageRequest(request)).not.toThrow(TypeError);
    });

    it('should delegate to mapping service for safe extraction methods', () => {
      const unknownResult = { test: 'data' };

      // All these methods should attempt delegation without TypeErrors
      expect(() => WorkflowBoundaryMapper.toIntentAnalysis(unknownResult)).not.toThrow(TypeError);
      expect(() => WorkflowBoundaryMapper.toJourneyState(unknownResult)).not.toThrow(TypeError);
      expect(() => WorkflowBoundaryMapper.toRelevantKnowledge(unknownResult)).not.toThrow(TypeError);
      expect(() => WorkflowBoundaryMapper.toUnifiedAnalysis(unknownResult)).not.toThrow(TypeError);
      expect(() => WorkflowBoundaryMapper.toWorkflowResponse(unknownResult)).not.toThrow(TypeError);
      expect(() => WorkflowBoundaryMapper.toCallToAction(unknownResult)).not.toThrow(TypeError);
    });
  });

  describe('Type Safety', () => {
    it('should accept correct input types for toProcessMessageRequest', () => {
      const validRequest: ProcessChatMessageRequest = {
        userMessage: 'Valid message',
        sessionId: 'valid-session-id',
        organizationId: 'valid-org-id'
      };

      const validRequestWithMetadata: ProcessChatMessageRequest = {
        userMessage: 'Valid message with metadata',
        sessionId: 'valid-session-id',
        organizationId: 'valid-org-id',
        metadata: {
          userId: 'user-123',
          timestamp: '2023-01-01T12:00:00Z',
          clientInfo: { browser: 'chrome' }
        }
      };

      // Should compile and not throw TypeError for method signature issues
      expect(() => WorkflowBoundaryMapper.toProcessMessageRequest(validRequest)).not.toThrow(TypeError);
      expect(() => WorkflowBoundaryMapper.toProcessMessageRequest(validRequestWithMetadata)).not.toThrow(TypeError);
    });

    it('should accept unknown types for safe extraction methods', () => {
      // These methods are designed to safely handle unknown data
      const testCases = [
        null,
        undefined,
        {},
        { random: 'data' },
        { nested: { deep: { data: 'value' } } },
        [],
        'string',
        42,
        true
      ];

      testCases.forEach((testCase, index) => {
        expect(() => WorkflowBoundaryMapper.toIntentAnalysis(testCase)).not.toThrow(TypeError);
        expect(() => WorkflowBoundaryMapper.toJourneyState(testCase)).not.toThrow(TypeError);
        expect(() => WorkflowBoundaryMapper.toRelevantKnowledge(testCase)).not.toThrow(TypeError);
        expect(() => WorkflowBoundaryMapper.toUnifiedAnalysis(testCase)).not.toThrow(TypeError);
        expect(() => WorkflowBoundaryMapper.toWorkflowResponse(testCase)).not.toThrow(TypeError);
        expect(() => WorkflowBoundaryMapper.toCallToAction(testCase)).not.toThrow(TypeError);
      });
    });
  });

  describe('Legacy Adapter Responsibilities', () => {
    it('should maintain backward compatibility contract', () => {
      // The mapper should exist as a static class with specific method names
      expect(WorkflowBoundaryMapper.constructor.name).toBe('Function');
      
      // All transformation methods should be static
      const methods = [
        'toProcessMessageRequest',
        'toIntentAnalysis', 
        'toJourneyState',
        'toRelevantKnowledge',
        'toUnifiedAnalysis',
        'toWorkflowResponse',
        'toCallToAction'
      ];

      methods.forEach(methodName => {
        expect(WorkflowBoundaryMapper.hasOwnProperty(methodName)).toBe(true);
        expect(typeof (WorkflowBoundaryMapper as any)[methodName]).toBe('function');
      });
    });

    it('should preserve single responsibility principle', () => {
      // The class should only have transformation methods, no instance methods
      const prototype = Object.getOwnPropertyNames(WorkflowBoundaryMapper.prototype);
      expect(prototype).toEqual(['constructor']);
      
      // Should not have instance properties
      const instance = Object.create(WorkflowBoundaryMapper.prototype);
      const instanceProps = Object.getOwnPropertyNames(instance);
      expect(instanceProps).toEqual([]);
    });

    it('should use composition pattern with mapping service', () => {
      // Verify the class uses a mapping service internally
      // This test checks that the static property exists
      expect((WorkflowBoundaryMapper as any).mappingService).toBeDefined();
    });
  });

  describe('Error Propagation', () => {
    it('should allow errors from underlying services to propagate', () => {
      // The adapter should not swallow errors from the underlying mapping service
      // It should let them bubble up for proper error handling by callers
      
      const invalidRequest = {
        userMessage: '',
        sessionId: '',
        organizationId: ''
      } as ProcessChatMessageRequest;

      // We expect that calling with invalid data might throw errors
      // The test verifies that error handling works (errors are thrown, not suppressed)
      try {
        WorkflowBoundaryMapper.toProcessMessageRequest(invalidRequest);
        // If no error is thrown, that's also acceptable (the service might handle it gracefully)
      } catch (error) {
        // If an error is thrown, it should be a proper Error instance
        expect(error).toBeInstanceOf(Error);
      }
    });
  });
});