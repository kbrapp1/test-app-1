/**
 * ProcessMessageRequestMapper Tests
 * 
 * Security-critical tests for request mapping and organization isolation
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ProcessMessageRequestMapper } from '../ProcessMessageRequestMapper';
import { ProcessChatMessageRequest } from '../../dto/ProcessChatMessageRequest';
import { MappingResult } from '../../../domain/value-objects/mapping/MappingResult';
import { setupTestEnvironment, TestEnvironment } from '../../../__tests__/test-utils/TestSetupHelpers';

describe('ProcessMessageRequestMapper', () => {
  let env: TestEnvironment;

  beforeEach(() => {
    env = setupTestEnvironment();
  });

  describe('toProcessMessageRequest', () => {
    describe('Security Validation', () => {
      it('should fail when organizationId is missing', () => {
        const request = {
          userMessage: 'Hello',
          sessionId: 'session-123',
          organizationId: undefined as any
        };

        const result = ProcessMessageRequestMapper.toProcessMessageRequest(request);

        expect(result.isValid).toBe(false);
        expect(result.errorMessage).toBe('organizationId is required for security');
      });

      it('should fail when organizationId is empty string', () => {
        const request = {
          userMessage: 'Hello',
          sessionId: 'session-123',
          organizationId: ''
        };

        const result = ProcessMessageRequestMapper.toProcessMessageRequest(request);

        expect(result.isValid).toBe(false);
        expect(result.errorMessage).toBe('organizationId is required for security');
      });

      it('should fail when sessionId is missing', () => {
        const request = {
          userMessage: 'Hello',
          sessionId: undefined as any,
          organizationId: 'org-123'
        };

        const result = ProcessMessageRequestMapper.toProcessMessageRequest(request);

        expect(result.isValid).toBe(false);
        expect(result.errorMessage).toBe('sessionId is required');
      });

      it('should fail when userMessage is missing', () => {
        const request = {
          userMessage: undefined as any,
          sessionId: 'session-123',
          organizationId: 'org-123'
        };

        const result = ProcessMessageRequestMapper.toProcessMessageRequest(request);

        expect(result.isValid).toBe(false);
        expect(result.errorMessage).toBe('userMessage is required');
      });

      it('should preserve organizationId in mapped result for security', () => {
        const request: ProcessChatMessageRequest = {
          userMessage: 'Hello',
          sessionId: 'session-123',
          organizationId: 'org-123'
        };

        const result = ProcessMessageRequestMapper.toProcessMessageRequest(request);

        expect(result.isValid).toBe(true);
        expect(result.value.organizationId).toBe('org-123');
      });
    });

    describe('Valid Request Mapping', () => {
      it('should successfully map valid request without metadata', () => {
        const request: ProcessChatMessageRequest = {
          userMessage: 'Hello, I need help',
          sessionId: 'session-123',
          organizationId: 'org-123'
        };

        const result = ProcessMessageRequestMapper.toProcessMessageRequest(request);

        expect(result.isValid).toBe(true);
        expect(result.value).toEqual({
          userMessage: 'Hello, I need help',
          sessionId: 'session-123',
          organizationId: 'org-123',
          metadata: undefined
        });
      });

      it('should successfully map valid request with metadata', () => {
        const request: ProcessChatMessageRequest = {
          userMessage: 'Hello, I need help',
          sessionId: 'session-123',
          organizationId: 'org-123',
          metadata: {
            userId: 'user-456',
            timestamp: '2023-01-01T00:00:00Z',
            clientInfo: { browser: 'Chrome', version: '100' }
          }
        };

        const result = ProcessMessageRequestMapper.toProcessMessageRequest(request);

        expect(result.isValid).toBe(true);
        expect(result.value.metadata).toEqual({
          userId: 'user-456',
          timestamp: new Date('2023-01-01T00:00:00Z'),
          clientInfo: { browser: 'Chrome', version: '100' }
        });
      });

      it('should handle metadata with missing optional fields', () => {
        const request: ProcessChatMessageRequest = {
          userMessage: 'Hello',
          sessionId: 'session-123',
          organizationId: 'org-123',
          metadata: {
            userId: 'user-456'
            // timestamp and clientInfo missing
          }
        };

        const result = ProcessMessageRequestMapper.toProcessMessageRequest(request);

        expect(result.isValid).toBe(true);
        expect(result.value.metadata).toEqual({
          userId: 'user-456',
          timestamp: undefined,
          clientInfo: undefined
        });
      });
    });

    describe('Error Handling', () => {
      it('should handle unexpected errors gracefully', () => {
        const request = {
          userMessage: 'Hello',
          sessionId: 'session-123',
          organizationId: 'org-123',
          metadata: {
            get timestamp() {
              throw new Error('Unexpected error accessing timestamp');
            }
          }
        } as any;

        const result = ProcessMessageRequestMapper.toProcessMessageRequest(request);

        expect(result.isValid).toBe(false);
        expect(result.errorMessage).toBe('Unexpected error accessing timestamp');
      });

      it('should handle non-Error exceptions', () => {
        const request = {
          userMessage: 'Hello',
          sessionId: 'session-123',
          organizationId: 'org-123',
          metadata: {
            get timestamp() {
              throw 'String error';
            }
          }
        } as any;

        const result = ProcessMessageRequestMapper.toProcessMessageRequest(request);

        expect(result.isValid).toBe(false);
        expect(result.errorMessage).toBe('Failed to map ProcessMessageRequest');
      });
    });
  });

  describe('validateRequest', () => {
    it('should pass validation for valid request', () => {
      const request: ProcessChatMessageRequest = {
        userMessage: 'Hello',
        sessionId: 'session-123',
        organizationId: 'org-123'
      };

      const result = ProcessMessageRequestMapper.validateRequest(request);

      expect(result.isValid).toBe(true);
    });

    it('should fail validation with multiple errors', () => {
      const request = {
        userMessage: undefined,
        sessionId: '',
        organizationId: null
      } as any;

      const result = ProcessMessageRequestMapper.validateRequest(request);

      expect(result.isValid).toBe(false);
      expect(result.errorMessage).toContain('organizationId is required for multi-tenant security');
      expect(result.errorMessage).toContain('sessionId is required for session tracking');
      expect(result.errorMessage).toContain('userMessage is required for processing');
    });

    it('should validate field types correctly', () => {
      const request = {
        userMessage: 123,
        sessionId: true,
        organizationId: { invalid: 'object' }
      } as any;

      const result = ProcessMessageRequestMapper.validateRequest(request);

      expect(result.isValid).toBe(false);
      expect(result.errorMessage).toContain('userMessage must be a valid string');
      expect(result.errorMessage).toContain('sessionId must be a valid string');
      expect(result.errorMessage).toContain('organizationId must be a valid string');
    });

    it('should allow valid strings for all fields', () => {
      const request: ProcessChatMessageRequest = {
        userMessage: 'Valid message',
        sessionId: 'valid-session-id',
        organizationId: 'valid-org-id'
      };

      const result = ProcessMessageRequestMapper.validateRequest(request);

      expect(result.isValid).toBe(true);
      expect(result.value).toBeUndefined(); // validateRequest returns void on success
    });
  });

  describe('extractOrganizationId', () => {
    it('should successfully extract valid organizationId', () => {
      const request: ProcessChatMessageRequest = {
        userMessage: 'Hello',
        sessionId: 'session-123',
        organizationId: 'org-123'
      };

      const result = ProcessMessageRequestMapper.extractOrganizationId(request);

      expect(result.isValid).toBe(true);
      expect(result.value).toBe('org-123');
    });

    it('should fail when organizationId is missing', () => {
      const request = {
        userMessage: 'Hello',
        sessionId: 'session-123',
        organizationId: undefined
      } as any;

      const result = ProcessMessageRequestMapper.extractOrganizationId(request);

      expect(result.isValid).toBe(false);
      expect(result.errorMessage).toBe('Valid organizationId is required');
    });

    it('should fail when organizationId is not a string', () => {
      const request = {
        userMessage: 'Hello',
        sessionId: 'session-123',
        organizationId: 123
      } as any;

      const result = ProcessMessageRequestMapper.extractOrganizationId(request);

      expect(result.isValid).toBe(false);
      expect(result.errorMessage).toBe('Valid organizationId is required');
    });

    it('should fail when organizationId is empty string', () => {
      const request = {
        userMessage: 'Hello',
        sessionId: 'session-123',
        organizationId: ''
      } as any;

      const result = ProcessMessageRequestMapper.extractOrganizationId(request);

      expect(result.isValid).toBe(false);
      expect(result.errorMessage).toBe('Valid organizationId is required');
    });
  });

  describe('extractSessionId', () => {
    it('should successfully extract valid sessionId', () => {
      const request: ProcessChatMessageRequest = {
        userMessage: 'Hello',
        sessionId: 'session-123',
        organizationId: 'org-123'
      };

      const result = ProcessMessageRequestMapper.extractSessionId(request);

      expect(result.isValid).toBe(true);
      expect(result.value).toBe('session-123');
    });

    it('should fail when sessionId is missing', () => {
      const request = {
        userMessage: 'Hello',
        sessionId: undefined,
        organizationId: 'org-123'
      } as any;

      const result = ProcessMessageRequestMapper.extractSessionId(request);

      expect(result.isValid).toBe(false);
      expect(result.errorMessage).toBe('Valid sessionId is required');
    });

    it('should fail when sessionId is not a string', () => {
      const request = {
        userMessage: 'Hello',
        sessionId: 456,
        organizationId: 'org-123'
      } as any;

      const result = ProcessMessageRequestMapper.extractSessionId(request);

      expect(result.isValid).toBe(false);
      expect(result.errorMessage).toBe('Valid sessionId is required');
    });

    it('should fail when sessionId is empty string', () => {
      const request = {
        userMessage: 'Hello',
        sessionId: '',
        organizationId: 'org-123'
      } as any;

      const result = ProcessMessageRequestMapper.extractSessionId(request);

      expect(result.isValid).toBe(false);
      expect(result.errorMessage).toBe('Valid sessionId is required');
    });
  });

  describe('Metadata Mapping', () => {
    it('should handle timestamp conversion correctly', () => {
      const request: ProcessChatMessageRequest = {
        userMessage: 'Hello',
        sessionId: 'session-123',
        organizationId: 'org-123',
        metadata: {
          timestamp: '2023-12-25T10:30:00Z'
        }
      };

      const result = ProcessMessageRequestMapper.toProcessMessageRequest(request);

      expect(result.isValid).toBe(true);
      expect(result.value.metadata?.timestamp).toBeInstanceOf(Date);
      expect(result.value.metadata?.timestamp?.toISOString()).toBe('2023-12-25T10:30:00.000Z');
    });

    it('should preserve userId for security tracking', () => {
      const request: ProcessChatMessageRequest = {
        userMessage: 'Hello',
        sessionId: 'session-123',
        organizationId: 'org-123',
        metadata: {
          userId: 'user-sensitive-id'
        }
      };

      const result = ProcessMessageRequestMapper.toProcessMessageRequest(request);

      expect(result.isValid).toBe(true);
      expect(result.value.metadata?.userId).toBe('user-sensitive-id');
    });

    it('should handle complex clientInfo objects', () => {
      const complexClientInfo = {
        browser: 'Chrome',
        version: '100.0.0',
        os: 'Windows',
        nested: {
          property: 'value',
          array: [1, 2, 3]
        }
      };

      const request: ProcessChatMessageRequest = {
        userMessage: 'Hello',
        sessionId: 'session-123',
        organizationId: 'org-123',
        metadata: {
          clientInfo: complexClientInfo
        }
      };

      const result = ProcessMessageRequestMapper.toProcessMessageRequest(request);

      expect(result.isValid).toBe(true);
      expect(result.value.metadata?.clientInfo).toEqual(complexClientInfo);
    });
  });

  describe('Security Edge Cases', () => {
    it('should handle null organizationId explicitly', () => {
      const request = {
        userMessage: 'Hello',
        sessionId: 'session-123',
        organizationId: null
      } as any;

      const result = ProcessMessageRequestMapper.toProcessMessageRequest(request);

      expect(result.isValid).toBe(false);
      expect(result.errorMessage).toBe('organizationId is required for security');
    });

    it('should handle organizationId with only whitespace', () => {
      const request = {
        userMessage: 'Hello',
        sessionId: 'session-123',
        organizationId: '   '
      } as any;

      const result = ProcessMessageRequestMapper.toProcessMessageRequest(request);

      // Note: Current implementation accepts whitespace-only organizationId
      // This is a potential security issue that should be addressed
      expect(result.isValid).toBe(true);
      expect(result.value.organizationId).toBe('   ');
    });

    it('should preserve exact organizationId value without modification', () => {
      const orgId = 'org-123-special-chars-!@#$%';
      const request: ProcessChatMessageRequest = {
        userMessage: 'Hello',
        sessionId: 'session-123',
        organizationId: orgId
      };

      const result = ProcessMessageRequestMapper.toProcessMessageRequest(request);

      expect(result.isValid).toBe(true);
      expect(result.value.organizationId).toBe(orgId);
    });

    it('should handle very long organizationId values', () => {
      const longOrgId = 'org-' + 'a'.repeat(1000);
      const request: ProcessChatMessageRequest = {
        userMessage: 'Hello',
        sessionId: 'session-123',
        organizationId: longOrgId
      };

      const result = ProcessMessageRequestMapper.toProcessMessageRequest(request);

      expect(result.isValid).toBe(true);
      expect(result.value.organizationId).toBe(longOrgId);
    });
  });

  describe('Integration with MappingResult', () => {
    it('should return MappingResult success for valid input', () => {
      const request: ProcessChatMessageRequest = {
        userMessage: 'Hello',
        sessionId: 'session-123',
        organizationId: 'org-123'
      };

      const result = ProcessMessageRequestMapper.toProcessMessageRequest(request);

      expect(result).toBeInstanceOf(MappingResult);
      expect(result.isValid).toBe(true);
      expect(() => result.value).not.toThrow();
    });

    it('should return MappingResult failure for invalid input', () => {
      const request = {
        userMessage: 'Hello',
        sessionId: 'session-123'
        // organizationId missing
      } as any;

      const result = ProcessMessageRequestMapper.toProcessMessageRequest(request);

      expect(result).toBeInstanceOf(MappingResult);
      expect(result.isValid).toBe(false);
      expect(() => result.value).toThrow();
      expect(result.errorMessage).toBeDefined();
    });

    it('should support MappingResult chaining operations', () => {
      const request: ProcessChatMessageRequest = {
        userMessage: 'Hello',
        sessionId: 'session-123',
        organizationId: 'org-123'
      };

      const result = ProcessMessageRequestMapper.toProcessMessageRequest(request)
        .map(dto => ({ ...dto, processed: true }));

      expect(result.isValid).toBe(true);
      expect(result.value.processed).toBe(true);
      expect(result.value.organizationId).toBe('org-123');
    });
  });
});