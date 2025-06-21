/**
 * Lead Capture Service Tests
 * 
 * AI INSTRUCTIONS:
 * - Test that lead capture uses domain-calculated scores from session
 * - Verify qualification status is determined from domain score
 * - Follow @golden-rule testing patterns exactly
 * - Test the determineQualificationStatus method business logic
 */

import { LeadCaptureService } from '../LeadCaptureService';
import { ContactInfo } from '../../../../domain/value-objects/lead-management/ContactInfo';
import { QualificationData } from '../../../../domain/value-objects/lead-management/QualificationData';
import { LeadSource } from '../../../../domain/value-objects/lead-management/LeadSource';

describe('LeadCaptureService', () => {
  let service: LeadCaptureService;
  let mockLeadRepository: any;
  let mockSessionRepository: any;
  let mockLeadMapper: any;

  beforeEach(() => {
    // Create simple mocks
    mockLeadRepository = {
      save: vi.fn(),
      findById: vi.fn(),
      findBySessionId: vi.fn()
    };
    
    mockSessionRepository = {
      findById: vi.fn()
    };
    
    mockLeadMapper = {
      toDto: vi.fn()
    };

    service = new LeadCaptureService(
      mockLeadRepository,
      mockSessionRepository,
      mockLeadMapper
    );
  });

  describe('determineQualificationStatus', () => {
    it('should return highly_qualified for scores 80 and above', () => {
      // Use reflection to access private method for testing
      const result = (service as any).determineQualificationStatus(85);
      expect(result).toBe('highly_qualified');
      
      const result80 = (service as any).determineQualificationStatus(80);
      expect(result80).toBe('highly_qualified');
    });

    it('should return qualified for scores 60-79', () => {
      const result70 = (service as any).determineQualificationStatus(70);
      expect(result70).toBe('qualified');
      
      const result60 = (service as any).determineQualificationStatus(60);
      expect(result60).toBe('qualified');
      
      const result79 = (service as any).determineQualificationStatus(79);
      expect(result79).toBe('qualified');
    });

    it('should return not_qualified for scores 30-59', () => {
      const result45 = (service as any).determineQualificationStatus(45);
      expect(result45).toBe('not_qualified');
      
      const result30 = (service as any).determineQualificationStatus(30);
      expect(result30).toBe('not_qualified');
      
      const result59 = (service as any).determineQualificationStatus(59);
      expect(result59).toBe('not_qualified');
    });

    it('should return disqualified for scores below 30', () => {
      const result20 = (service as any).determineQualificationStatus(20);
      expect(result20).toBe('disqualified');
      
      const result0 = (service as any).determineQualificationStatus(0);
      expect(result0).toBe('disqualified');
      
      const result29 = (service as any).determineQualificationStatus(29);
      expect(result29).toBe('disqualified');
    });
  });

  describe('captureLead integration', () => {
    it('should use domain-calculated score from session context', async () => {
      // Arrange
      const sessionId = 'test-session-id';
      const domainCalculatedScore = 75;
      
      const mockSession = {
        id: sessionId,
        contextData: {
          leadScore: domainCalculatedScore,
          visitorName: 'John Doe',
          company: 'Acme Corp'
        }
      };

             const contactInfo = ContactInfo.create({
         name: 'John Doe',
         email: 'john@acme.com',
         phone: '+1-555-123-4567', // Valid phone format with 10+ digits
         company: 'Acme Corp'
       });

      const qualificationData = QualificationData.create({
        painPoints: ['integration'],
        interests: ['automation'],
        answeredQuestions: [],
        engagementLevel: 'high'
      });

             const source = LeadSource.create({
         channel: 'chatbot_widget',
         pageUrl: 'https://example.com',
         pageTitle: 'Home',
         campaign: 'test',
         referrer: 'https://google.com' // Must be valid URL
       });

      const request = {
        sessionId,
        organizationId: 'org-123',
        chatbotConfigId: 'config-123',
        contactInfo,
        qualificationData,
        conversationSummary: 'Great conversation about automation needs',
        source
      };

      const mockSavedLead = { 
        id: 'lead-123', 
        props: { 
          leadScore: domainCalculatedScore,
          qualificationStatus: 'qualified'
        }
      };
      const mockLeadDto = { id: 'lead-123', leadScore: domainCalculatedScore };

      // Setup mocks
      mockSessionRepository.findById.mockResolvedValue(mockSession);
      mockLeadRepository.findBySessionId.mockResolvedValue(null);
      mockLeadRepository.save.mockResolvedValue(mockSavedLead);
      mockLeadMapper.toDto.mockReturnValue(mockLeadDto);

      // Act
      const result = await service.captureLead(request);

      // Assert
      expect(mockSessionRepository.findById).toHaveBeenCalledWith(sessionId);
      expect(mockLeadRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          props: expect.objectContaining({
            leadScore: domainCalculatedScore,
            qualificationStatus: 'qualified' // Score 75 should result in 'qualified'
          })
        })
      );
      expect(result).toEqual(mockLeadDto);
    });

         it('should handle missing leadScore gracefully with default values', async () => {
       // Arrange
       const mockSession = {
         id: 'test-session',
         contextData: {} // No leadScore
       };

       const contactInfo = ContactInfo.create({
         name: 'Test User',
         email: 'test@example.com',
         // No phone - email is sufficient
         company: ''
       });

       const qualificationData = QualificationData.create({
         painPoints: [],
         interests: [],
         answeredQuestions: [],
         engagementLevel: 'low'
       });

       const source = LeadSource.create({
         channel: 'chatbot_widget',
         pageUrl: 'https://example.com',
         pageTitle: 'Test',
         campaign: 'test'
         // No referrer - optional field
       });

      const request = {
        sessionId: 'test-session',
        organizationId: 'org-123',
        chatbotConfigId: 'config-123',
        contactInfo,
        qualificationData,
        conversationSummary: 'Test conversation',
        source
      };

      const mockSavedLead = { 
        id: 'lead-123',
        props: {
          leadScore: 0,
          qualificationStatus: 'disqualified'
        }
      };
      const mockLeadDto = { id: 'lead-123', leadScore: 0 };

      // Setup mocks
      mockSessionRepository.findById.mockResolvedValue(mockSession);
      mockLeadRepository.findBySessionId.mockResolvedValue(null);
      mockLeadRepository.save.mockResolvedValue(mockSavedLead);
      mockLeadMapper.toDto.mockReturnValue(mockLeadDto);

      // Act
      await service.captureLead(request);

      // Assert - Should default to score 0 and 'disqualified' status
      expect(mockLeadRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          props: expect.objectContaining({
            leadScore: 0,
            qualificationStatus: 'disqualified'
          })
        })
      );
    });

    it('should correctly map different domain scores to qualification statuses', async () => {
      const testCases = [
        { score: 85, expectedStatus: 'highly_qualified' },
        { score: 70, expectedStatus: 'qualified' },
        { score: 45, expectedStatus: 'not_qualified' },
        { score: 20, expectedStatus: 'disqualified' }
      ];

      for (const testCase of testCases) {
        // Reset mocks for each test case
        vi.clearAllMocks();

        const mockSession = {
          id: 'test-session',
          contextData: { leadScore: testCase.score }
        };

                 const contactInfo = ContactInfo.create({
           name: 'Test User',
           email: 'test@example.com',
           // No phone - email is sufficient
           company: ''
         });

         const qualificationData = QualificationData.create({
           painPoints: [],
           interests: [],
           answeredQuestions: [],
           engagementLevel: 'medium'
         });

         const source = LeadSource.create({
           channel: 'chatbot_widget',
           pageUrl: 'https://example.com',
           pageTitle: 'Test',
           campaign: 'test'
           // No referrer - optional field
         });

        const request = {
          sessionId: 'test-session',
          organizationId: 'org-123',
          chatbotConfigId: 'config-123',
          contactInfo,
          qualificationData,
          conversationSummary: 'Test conversation',
          source
        };

        const mockSavedLead = { 
          id: 'lead-123',
          props: {
            leadScore: testCase.score,
            qualificationStatus: testCase.expectedStatus
          }
        };

        // Setup mocks
        mockSessionRepository.findById.mockResolvedValue(mockSession);
        mockLeadRepository.findBySessionId.mockResolvedValue(null);
        mockLeadRepository.save.mockResolvedValue(mockSavedLead);
        mockLeadMapper.toDto.mockReturnValue({ id: 'lead-123' });

        // Act
        await service.captureLead(request);

        // Assert
        expect(mockLeadRepository.save).toHaveBeenCalledWith(
          expect.objectContaining({
            props: expect.objectContaining({
              leadScore: testCase.score,
              qualificationStatus: testCase.expectedStatus
            })
          })
        );
      }
    });
  });

  describe('business logic validation', () => {
    it('should maintain consistent qualification thresholds', () => {
      // Test boundary conditions to ensure consistent business logic
      expect((service as any).determineQualificationStatus(80)).toBe('highly_qualified');
      expect((service as any).determineQualificationStatus(79)).toBe('qualified');
      expect((service as any).determineQualificationStatus(60)).toBe('qualified');
      expect((service as any).determineQualificationStatus(59)).toBe('not_qualified');
      expect((service as any).determineQualificationStatus(30)).toBe('not_qualified');
      expect((service as any).determineQualificationStatus(29)).toBe('disqualified');
    });

    it('should handle edge cases correctly', () => {
      // Test extreme values
      expect((service as any).determineQualificationStatus(100)).toBe('highly_qualified');
      expect((service as any).determineQualificationStatus(0)).toBe('disqualified');
      expect((service as any).determineQualificationStatus(-1)).toBe('disqualified');
    });
  });
}); 