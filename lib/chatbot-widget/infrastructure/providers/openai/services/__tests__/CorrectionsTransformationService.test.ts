/**
 * Corrections Transformation Service Tests
 * 
 * AI INSTRUCTIONS:
 * - Test all transformation scenarios and edge cases
 * - Verify proper error handling for malformed data
 * - Test null/empty corrections handling
 * - Follow @golden-rule testing patterns exactly
 * - Ensure 100% test coverage for business logic
 */

import { vi } from 'vitest';
import { CorrectionsTransformationService, OpenAICorrectionsResponse, CorrectionsTransformationContext } from '../CorrectionsTransformationService';
import { EntityCorrections } from '../../../../../domain/value-objects/context/EntityCorrections';
import { BusinessRuleViolationError } from '../../../../../domain/errors/BusinessRuleViolationError';

describe('CorrectionsTransformationService', () => {
  const mockContext: CorrectionsTransformationContext = {
    sessionId: 'session-123',
    messageId: 'msg-456',
    extractionMethod: 'ai',
    defaultConfidence: 0.9,
    timestamp: new Date('2024-01-15T10:00:00Z')
  };

  describe('transformCorrections', () => {
    it('should return null for empty corrections', () => {
      const response: OpenAICorrectionsResponse = {};
      
      const result = CorrectionsTransformationService.transformCorrections(response, mockContext);
      
      expect(result).toBeNull();
    });

    it('should return null for corrections object with no meaningful data', () => {
      const response: OpenAICorrectionsResponse = {
        corrections: {
          removedDecisionMakers: [],
          removedPainPoints: [],
          correctedBudget: '',
          correctedRole: undefined
        }
      };
      
      const result = CorrectionsTransformationService.transformCorrections(response, mockContext);
      
      expect(result).toBeNull();
    });

    it('should transform removal corrections properly', () => {
      const response: OpenAICorrectionsResponse = {
        corrections: {
          removedDecisionMakers: ['Jane Doe', 'John Smith'],
          removedPainPoints: ['Complex reporting'],
          removedIntegrationNeeds: ['CRM sync'],
          removedEvaluationCriteria: ['Price sensitivity']
        }
      };
      
      const result = CorrectionsTransformationService.transformCorrections(response, mockContext);
      
      expect(result).toBeInstanceOf(EntityCorrections);
      expect(result!.removedDecisionMakers).toHaveLength(2);
      expect(result!.removedDecisionMakers[0].entityValue).toBe('Jane Doe');
      expect(result!.removedDecisionMakers[1].entityValue).toBe('John Smith');
      expect(result!.removedPainPoints[0].entityValue).toBe('Complex reporting');
      expect(result!.removedIntegrationNeeds[0].entityValue).toBe('CRM sync');
      expect(result!.removedEvaluationCriteria[0].entityValue).toBe('Price sensitivity');
    });

    it('should transform value corrections properly', () => {
      const response: OpenAICorrectionsResponse = {
        corrections: {
          correctedBudget: '$200,000',
          correctedTimeline: '6 months',
          correctedUrgency: 'high',
          correctedContactMethod: 'email',
          correctedRole: 'Director',
          correctedIndustry: 'Healthcare',
          correctedCompany: 'Acme Corp',
          correctedTeamSize: '50-100'
        }
      };
      
      const result = CorrectionsTransformationService.transformCorrections(response, mockContext);
      
      expect(result).toBeInstanceOf(EntityCorrections);
      expect(result!.correctedBudget?.newValue).toBe('$200,000');
      expect(result!.correctedTimeline?.newValue).toBe('6 months');
      expect(result!.correctedUrgency?.newValue).toBe('high');
      expect(result!.correctedContactMethod?.newValue).toBe('email');
      expect(result!.correctedRole?.newValue).toBe('Director');
      expect(result!.correctedIndustry?.newValue).toBe('Healthcare');
      expect(result!.correctedCompany?.newValue).toBe('Acme Corp');
      expect(result!.correctedTeamSize?.newValue).toBe('50-100');
    });

    it('should transform mixed corrections and removals', () => {
      const response: OpenAICorrectionsResponse = {
        corrections: {
          removedDecisionMakers: ['Jane Doe'],
          correctedBudget: '$150,000',
          correctedRole: 'Senior Manager'
        }
      };
      
      const result = CorrectionsTransformationService.transformCorrections(response, mockContext);
      
      expect(result).toBeInstanceOf(EntityCorrections);
      expect(result!.removedDecisionMakers).toHaveLength(1);
      expect(result!.removedDecisionMakers[0].entityValue).toBe('Jane Doe');
      expect(result!.correctedBudget?.newValue).toBe('$150,000');
      expect(result!.correctedRole?.newValue).toBe('Senior Manager');
    });

    it('should filter out empty string values', () => {
      const response: OpenAICorrectionsResponse = {
        corrections: {
          removedDecisionMakers: ['Jane Doe', '', '   ', 'John Smith'],
          correctedBudget: '',
          correctedRole: '   ',
          correctedTimeline: 'Q2 2024'
        }
      };
      
      const result = CorrectionsTransformationService.transformCorrections(response, mockContext);
      
      expect(result!.removedDecisionMakers).toHaveLength(2);
      expect(result!.removedDecisionMakers[0].entityValue).toBe('Jane Doe');
      expect(result!.removedDecisionMakers[1].entityValue).toBe('John Smith');
      expect(result!.correctedBudget).toBeNull();
      expect(result!.correctedRole).toBeNull();
      expect(result!.correctedTimeline?.newValue).toBe('Q2 2024');
    });

    it('should include proper metadata in corrections', () => {
      const response: OpenAICorrectionsResponse = {
        corrections: {
          removedDecisionMakers: ['Jane Doe'],
          correctedBudget: '$100,000'
        }
      };
      
      const result = CorrectionsTransformationService.transformCorrections(response, mockContext);
      
      const removalMetadata = result!.removedDecisionMakers[0].metadata;
      expect(removalMetadata.sourceMessageId).toBe('msg-456');
      expect(removalMetadata.confidence).toBe(0.9);
      expect(removalMetadata.extractionMethod).toBe('ai');
      expect(removalMetadata.correctionReason).toBe('Explicitly stated as not a decision maker');

      const correctionMetadata = result!.correctedBudget!.metadata;
      expect(correctionMetadata.sourceMessageId).toBe('msg-456');
      expect(correctionMetadata.confidence).toBe(0.9);
      expect(correctionMetadata.extractionMethod).toBe('ai');
      expect(correctionMetadata.correctionReason).toBe('Budget explicitly corrected');
    });

    it('should handle transformation errors gracefully', () => {
      const invalidContext = {
        ...mockContext,
        sessionId: '' // Invalid session ID will cause domain error
      };
      
      const response: OpenAICorrectionsResponse = {
        corrections: {
          correctedBudget: '$100,000'
        }
      };
      
      expect(() => {
        CorrectionsTransformationService.transformCorrections(response, invalidContext);
      }).toThrow(BusinessRuleViolationError);
    });

    it('should wrap non-domain errors in BusinessRuleViolationError', () => {
      // Create a scenario that would cause a generic error
      const response = {
        corrections: {
          correctedBudget: '$100,000'
        }
      } as OpenAICorrectionsResponse;
      
      // Mock to throw an unexpected error
      const originalCreate = EntityCorrections.create;
      EntityCorrections.create = vi.fn().mockImplementation(() => {
        throw new Error('Unexpected error');
      });
      
      try {
        expect(() => {
          CorrectionsTransformationService.transformCorrections(response, mockContext);
        }).toThrow(BusinessRuleViolationError);
      } finally {
        EntityCorrections.create = originalCreate;
      }
    });

    it('should handle edge case with null/undefined correction values', () => {
      const response: OpenAICorrectionsResponse = {
        corrections: {
          removedDecisionMakers: ['Valid Name', null as any, undefined as any],
          correctedBudget: null as any,
          correctedRole: undefined as any
        }
      };
      
      const result = CorrectionsTransformationService.transformCorrections(response, mockContext);
      
      expect(result!.removedDecisionMakers).toHaveLength(1);
      expect(result!.removedDecisionMakers[0].entityValue).toBe('Valid Name');
      expect(result!.correctedBudget).toBeNull();
      expect(result!.correctedRole).toBeNull();
    });

    it('should maintain session ID in created EntityCorrections', () => {
      const response: OpenAICorrectionsResponse = {
        corrections: {
          correctedBudget: '$100,000'
        }
      };
      
      const result = CorrectionsTransformationService.transformCorrections(response, mockContext);
      
      expect(result!.correctionSessionId).toBe('session-123');
    });

    it('should process enum corrections with proper type casting', () => {
      const response: OpenAICorrectionsResponse = {
        corrections: {
          correctedUrgency: 'medium',
          correctedContactMethod: 'phone'
        }
      };
      
      const result = CorrectionsTransformationService.transformCorrections(response, mockContext);
      
      expect(result!.correctedUrgency?.newValue).toBe('medium');
      expect(result!.correctedContactMethod?.newValue).toBe('phone');
    });
  });
}); 