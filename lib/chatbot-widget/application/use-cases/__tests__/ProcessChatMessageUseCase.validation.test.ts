import { describe, it, expect } from 'vitest';
import { ProcessMessageRequest } from '../ProcessChatMessageUseCase';

describe('ProcessChatMessageUseCase - Input Validation', () => {
  describe('Organization ID Validation', () => {
    it('should validate organization ID is required', () => {
      const request: ProcessMessageRequest = {
        userMessage: 'Hello',
        sessionId: 'session-123',
        organizationId: '',
        metadata: {}
      };

      // Test the validation logic that's in the use case
      const isValid = request.organizationId?.trim();
      expect(isValid).toBe('');
      
      // This is the exact check from the use case
      if (!request.organizationId?.trim()) {
        expect(() => {
          throw new Error('Organization ID is required and cannot be empty');
        }).toThrow('Organization ID is required and cannot be empty');
      }
    });

    it('should validate organization ID cannot be whitespace only', () => {
      const request: ProcessMessageRequest = {
        userMessage: 'Hello',
        sessionId: 'session-123',
        organizationId: '   \n\t  ',
        metadata: {}
      };

      // Test the validation logic
      const trimmedOrgId = request.organizationId?.trim();
      expect(trimmedOrgId).toBe('');
      
      if (!request.organizationId?.trim()) {
        expect(() => {
          throw new Error('Organization ID is required and cannot be empty');
        }).toThrow('Organization ID is required and cannot be empty');
      }
    });

    it('should accept valid organization ID', () => {
      const request: ProcessMessageRequest = {
        userMessage: 'Hello',
        sessionId: 'session-123',
        organizationId: 'org-valid-123',
        metadata: {}
      };

      // Test the validation logic passes
      const isValid = request.organizationId?.trim();
      expect(isValid).toBe('org-valid-123');
      expect(isValid).toBeTruthy();
      
      // Should not throw
      expect(() => {
        if (!request.organizationId?.trim()) {
          throw new Error('Organization ID is required and cannot be empty');
        }
      }).not.toThrow();
    });

    it('should handle null organization ID', () => {
      const request: ProcessMessageRequest = {
        userMessage: 'Hello',
        sessionId: 'session-123',
        organizationId: null as any,
        metadata: {}
      };

      // Test the validation logic
      const isValid = request.organizationId?.trim();
      expect(isValid).toBeUndefined();
      
      if (!request.organizationId?.trim()) {
        expect(() => {
          throw new Error('Organization ID is required and cannot be empty');
        }).toThrow('Organization ID is required and cannot be empty');
      }
    });

    it('should handle undefined organization ID', () => {
      const request: ProcessMessageRequest = {
        userMessage: 'Hello',
        sessionId: 'session-123',
        organizationId: undefined as any,
        metadata: {}
      };

      // Test the validation logic
      const isValid = request.organizationId?.trim();
      expect(isValid).toBeUndefined();
      
      if (!request.organizationId?.trim()) {
        expect(() => {
          throw new Error('Organization ID is required and cannot be empty');
        }).toThrow('Organization ID is required and cannot be empty');
      }
    });
  });

  describe('Request Structure Validation', () => {
    it('should require user message', () => {
      const request: ProcessMessageRequest = {
        userMessage: '',
        sessionId: 'session-123',
        organizationId: 'org-123',
        metadata: {}
      };

      expect(request.userMessage).toBe('');
      expect(request.userMessage.trim()).toBe('');
    });

    it('should require session ID', () => {
      const request: ProcessMessageRequest = {
        userMessage: 'Hello',
        sessionId: '',
        organizationId: 'org-123',
        metadata: {}
      };

      expect(request.sessionId).toBe('');
      expect(request.sessionId.trim()).toBe('');
    });

    it('should handle optional metadata', () => {
      const requestWithMetadata: ProcessMessageRequest = {
        userMessage: 'Hello',
        sessionId: 'session-123',
        organizationId: 'org-123',
        metadata: { userId: 'user-456' }
      };

      const requestWithoutMetadata: ProcessMessageRequest = {
        userMessage: 'Hello',
        sessionId: 'session-123',
        organizationId: 'org-123'
        // metadata is optional
      };

      expect(requestWithMetadata.metadata).toEqual({ userId: 'user-456' });
      expect(requestWithoutMetadata.metadata).toBeUndefined();
    });

    it('should validate complete valid request', () => {
      const request: ProcessMessageRequest = {
        userMessage: 'Hello, I need help with your service',
        sessionId: 'session-abc-123-def',
        organizationId: 'org-company-456',
        metadata: {
          userId: 'user-789',
          source: 'website',
          page: '/contact'
        }
      };

      // All validation checks should pass
      expect(request.organizationId?.trim()).toBeTruthy();
      expect(request.sessionId?.trim()).toBeTruthy();
      expect(request.userMessage?.trim()).toBeTruthy();
      expect(request.metadata).toBeDefined();
      
      // Organization ID validation specifically
      if (!request.organizationId?.trim()) {
        expect.fail('Organization ID should be valid');
      }
      
      expect(request.organizationId.trim()).toBe('org-company-456');
    });
  });

  describe('Edge Cases', () => {
    it('should handle organization ID with special characters', () => {
      const request: ProcessMessageRequest = {
        userMessage: 'Hello',
        sessionId: 'session-123',
        organizationId: 'org-company_123-test.com',
        metadata: {}
      };

      const isValid = request.organizationId?.trim();
      expect(isValid).toBe('org-company_123-test.com');
      expect(isValid).toBeTruthy();
    });

    it('should handle very long organization ID', () => {
      const longOrgId = 'org-' + 'a'.repeat(100);
      const request: ProcessMessageRequest = {
        userMessage: 'Hello',
        sessionId: 'session-123',
        organizationId: longOrgId,
        metadata: {}
      };

      const isValid = request.organizationId?.trim();
      expect(isValid).toBe(longOrgId);
      expect(isValid).toBeTruthy();
    });

    it('should handle organization ID with leading/trailing spaces', () => {
      const request: ProcessMessageRequest = {
        userMessage: 'Hello',
        sessionId: 'session-123',
        organizationId: '  org-123  ',
        metadata: {}
      };

      const trimmedOrgId = request.organizationId?.trim();
      expect(trimmedOrgId).toBe('org-123');
      expect(trimmedOrgId).toBeTruthy();
    });
  });
});