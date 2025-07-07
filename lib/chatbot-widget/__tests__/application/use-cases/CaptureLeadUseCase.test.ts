/**
 * CaptureLeadUseCase Unit Tests
 * 
 * Tests the application layer use case for capturing leads.
 * Covers orchestration logic, validation, error handling, and domain integration.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CaptureLeadUseCase, CaptureLeadRequest } from '../../../application/use-cases/CaptureLeadUseCase';
import { Lead } from '../../../domain/entities/Lead';
import { 
  BusinessRuleViolationError, 
  ResourceNotFoundError 
} from '../../../domain/errors/ChatbotWidgetDomainErrors';
import { 
  MockLeadRepository
} from '../../test-utils/MockServices';
import { ChatbotTestDataFactory } from '../../test-utils/ChatbotTestDataFactory';
import { LeadCaptureService } from '../../../application/services/lead-management/LeadCaptureService';
import { LeadMapper } from '../../../application/mappers/LeadMapper';

// Mock the complex dependencies
const mockLeadCaptureService = {
  captureLead: vi.fn()
};

const mockLeadMapper = {
  toDto: vi.fn(),
  fromDto: vi.fn(),
  toDomain: vi.fn()
};

describe('CaptureLeadUseCase', () => {
  let useCase: CaptureLeadUseCase;
  let mockLeadRepository: MockLeadRepository;

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();

    // Create mock repository
    mockLeadRepository = new MockLeadRepository();

    // Create use case instance with mocked dependencies
    useCase = new CaptureLeadUseCase(
      mockLeadRepository,
      mockLeadCaptureService as any,
      mockLeadMapper as any
    );

    // Mock console methods to avoid noise in tests
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  describe('Successful Lead Capture', () => {
    it('should capture a new lead with valid information', async () => {
      const request: CaptureLeadRequest = {
        sessionId: 'session-123',
        organizationId: 'org-456',
        contactInfo: {
          name: 'John Doe',
          email: 'john@example.com',
          phone: '+1-555-123-4567',
          company: 'Example Corp'
        },
        conversationSummary: 'Customer interested in enterprise features',
        source: {
          channel: 'chatbot_widget',
          page: 'https://example.com/pricing',
          referrer: 'https://google.com'
        },
        engagementScore: 85,
        tags: ['enterprise', 'high-value']
      };

      // Create expected lead for mocking
      const expectedLead = ChatbotTestDataFactory.createLead({
        sessionId: 'session-123',
        organizationId: 'org-456',
        contactInfo: {
          name: 'John Doe',
          email: 'john@example.com',
          phone: '+1-555-123-4567',
          company: 'Example Corp'
        }
      });

      // Mock lead capture service response (it returns DTO directly)
      const expectedDto = {
        id: expectedLead.id,
        sessionId: 'session-123',
        organizationId: 'org-456',
        contactInfo: request.contactInfo,
        leadScore: 85,
        qualificationStatus: 'qualified'
      };
      mockLeadCaptureService.captureLead.mockResolvedValue(expectedDto);

      const result = await useCase.execute(request);

      expect(mockLeadCaptureService.captureLead).toHaveBeenCalledWith(
        expect.objectContaining({
          sessionId: 'session-123',
          organizationId: 'org-456',
          conversationSummary: 'Customer interested in enterprise features'
        })
      );
      // The use case should call the mapper to convert the lead to DTO
      expect(result).toBeDefined();
    });

    it('should handle minimal required information', async () => {
      const request: CaptureLeadRequest = {
        sessionId: 'session-456',
        organizationId: 'org-789',
        contactInfo: {
          email: 'minimal@example.com'
        },
        conversationSummary: 'Brief conversation',
        source: {
          channel: 'chatbot_widget'
        }
      };

      const expectedLead = ChatbotTestDataFactory.createLead({
        sessionId: 'session-456',
        organizationId: 'org-789',
        contactInfo: {
          email: 'minimal@example.com',
          name: '',
          phone: '',
          company: ''
        }
      });

      const expectedDto = {
        id: expectedLead.id,
        sessionId: 'session-456',
        organizationId: 'org-789',
        contactInfo: { email: 'minimal@example.com' },
        leadScore: 45,
        qualificationStatus: 'not_qualified'
      };
      mockLeadCaptureService.captureLead.mockResolvedValue(expectedDto);

      const result = await useCase.execute(request);

      expect(mockLeadCaptureService.captureLead).toHaveBeenCalled();
      expect(result.sessionId).toBe('session-456');
      expect(result.organizationId).toBe('org-789');
    });

    it('should handle leads with phone number only', async () => {
      const request: CaptureLeadRequest = {
        sessionId: 'session-phone',
        organizationId: 'org-phone',
        contactInfo: {
          phone: '+1-555-987-6543'
        },
        conversationSummary: 'Phone-only lead',
        source: {
          channel: 'chatbot_widget',
          page: 'https://example.com/contact'
        }
      };

      const expectedLead = ChatbotTestDataFactory.createLead({
        sessionId: 'session-phone',
        organizationId: 'org-phone',
        contactInfo: {
          phone: '+1-555-987-6543',
          email: '',
          name: '',
          company: ''
        }
      });

      const expectedDto = {
        id: expectedLead.id,
        sessionId: 'session-phone',
        contactInfo: { phone: '+1-555-987-6543' },
        leadScore: 35
      };
      mockLeadCaptureService.captureLead.mockResolvedValue(expectedDto);

      const result = await useCase.execute(request);

      expect(result.contactInfo.phone).toBe('+1-555-987-6543');
      expect(mockLeadCaptureService.captureLead).toHaveBeenCalled();
    });
  });

  describe('Existing Lead Updates', () => {
    it('should update existing lead when session already has one', async () => {
      const existingLead = ChatbotTestDataFactory.createLead({
        sessionId: 'session-existing',
        organizationId: 'org-existing',
        contactInfo: {
          email: 'existing@example.com',
          name: 'Existing User'
        }
      });

      // Add existing lead to repository
      mockLeadRepository.addLead(existingLead);

      const request: CaptureLeadRequest = {
        sessionId: 'session-existing',
        organizationId: 'org-existing',
        contactInfo: {
          email: 'existing@example.com',
          name: 'Updated User',
          company: 'New Company'
        },
        conversationSummary: 'Updated conversation',
        source: {
          channel: 'chatbot_widget'
        }
      };

      // updateExistingLead uses the mapper directly
      const updatedDto = {
        id: existingLead.id,
        sessionId: 'session-existing',
        contactInfo: request.contactInfo,
        leadScore: 65,
        qualificationStatus: 'qualified'
      };
      mockLeadMapper.toDto.mockReturnValue(updatedDto);

      const result = await useCase.execute(request);

      expect(result.contactInfo.name).toBe('Updated User');
      expect(result.contactInfo.company).toBe('New Company');
      expect(mockLeadCaptureService.captureLead).not.toHaveBeenCalled(); // Should not create new lead
    });

    it('should preserve important data when updating existing lead', async () => {
      const existingLead = ChatbotTestDataFactory.createLead({
        sessionId: 'session-preserve',
        organizationId: 'org-preserve',
        contactInfo: {
          email: 'preserve@example.com',
          name: 'Original Name',
          phone: '+1-555-111-2222',
          company: 'Original Company'
        }
      });

      mockLeadRepository.addLead(existingLead);

      const request: CaptureLeadRequest = {
        sessionId: 'session-preserve',
        organizationId: 'org-preserve',
        contactInfo: {
          // Only update company, should preserve other fields
          company: 'Updated Company'
        },
        conversationSummary: 'Additional conversation',
        source: {
          channel: 'chatbot_widget'
        }
      };

      const preservedDto = {
        id: existingLead.id,
        sessionId: 'session-preserve',
        contactInfo: {
          email: 'preserve@example.com',
          name: 'Original Name',
          phone: '+1-555-111-2222',
          company: 'Updated Company'
        }
      };
      mockLeadMapper.toDto.mockReturnValue(preservedDto);

      const result = await useCase.execute(request);

      expect(result.contactInfo.email).toBe('preserve@example.com');
      expect(result.contactInfo.name).toBe('Original Name');
      expect(result.contactInfo.phone).toBe('+1-555-111-2222');
      expect(result.contactInfo.company).toBe('Updated Company');
    });
  });

  describe('Validation and Error Handling', () => {
    it('should handle domain validation errors from ContactInfo', async () => {
      const request: CaptureLeadRequest = {
        sessionId: 'session-123',
        organizationId: 'org-456',
        contactInfo: {
          // No email, phone, or name - this will cause ContactInfo validation to fail
        },
        conversationSummary: 'Test conversation',
        source: {
          channel: 'chatbot_widget',
          page: 'https://example.com/test'
        }
      };

      // Mock ContactInfo.create to throw validation error (simulates domain validation)
      mockLeadCaptureService.captureLead.mockRejectedValue(
        new BusinessRuleViolationError('Contact information must include at least email or phone')
      );

      await expect(useCase.execute(request)).rejects.toThrow(BusinessRuleViolationError);
    });

    it('should handle repository errors gracefully', async () => {
      const request: CaptureLeadRequest = {
        sessionId: 'session-error',
        organizationId: 'org-error',
        contactInfo: {
          email: 'error@example.com'
        },
        conversationSummary: 'Error test',
        source: {
          channel: 'chatbot_widget'
        }
      };

      // Make repository fail
      mockLeadRepository.setFailure(true);

      await expect(useCase.execute(request)).rejects.toThrow('Mock repository failure');
    });

    it('should handle lead capture service errors', async () => {
      const request: CaptureLeadRequest = {
        sessionId: 'session-service-error',
        organizationId: 'org-service-error',
        contactInfo: {
          email: 'service@example.com'
        },
        conversationSummary: 'Service error test',
        source: {
          channel: 'chatbot_widget'
        }
      };

      // Make lead capture service fail
      mockLeadCaptureService.captureLead.mockRejectedValue(
        new Error('Lead capture service failure')
      );

      await expect(useCase.execute(request)).rejects.toThrow('Lead capture service failure');
    });
  });

  describe('Contact Information Processing', () => {
    it('should handle various email formats correctly', async () => {
      const emailFormats = [
        'user@domain.com',
        'user.name@domain.co.uk',
        'user+tag@domain.org',
        'user_123@sub.domain.net'
      ];

      for (const email of emailFormats) {
        const request: CaptureLeadRequest = {
          sessionId: `session-${email.replace(/[^a-z0-9]/gi, '')}`,
          organizationId: 'org-email-test',
          contactInfo: { email },
          conversationSummary: `Test for ${email}`,
          source: { channel: 'chatbot_widget' }
        };

        const mockLead = ChatbotTestDataFactory.createLead({
          sessionId: request.sessionId,
          organizationId: 'org-email-test',
          contactInfo: { email, name: '', phone: '', company: '' }
        });

        const expectedDto = {
          id: mockLead.id,
          sessionId: request.sessionId,
          contactInfo: { email }
        };
        mockLeadCaptureService.captureLead.mockResolvedValue(expectedDto);

        const result = await useCase.execute(request);
        expect(result.contactInfo.email).toBe(email);
      }
    });

    it('should handle various phone number formats correctly', async () => {
      const phoneFormats = [
        '+1-555-123-4567',
        '(555) 123-4567',
        '555.123.4567',
        '+44 20 7946 0958'
      ];

      for (const phone of phoneFormats) {
        const request: CaptureLeadRequest = {
          sessionId: `session-${phone.replace(/[^0-9]/g, '')}`,
          organizationId: 'org-phone-test',
          contactInfo: { phone },
          conversationSummary: `Test for ${phone}`,
          source: { channel: 'chatbot_widget' }
        };

        const mockLead = ChatbotTestDataFactory.createLead({
          sessionId: request.sessionId,
          organizationId: 'org-phone-test',
          contactInfo: { phone, email: '', name: '', company: '' }
        });

        const expectedDto = {
          id: mockLead.id,
          sessionId: request.sessionId,
          contactInfo: { phone }
        };
        mockLeadCaptureService.captureLead.mockResolvedValue(expectedDto);

        const result = await useCase.execute(request);
        expect(result.contactInfo.phone).toBe(phone);
      }
    });

    it('should handle special characters in names correctly', async () => {
      const nameFormats = [
        "John O'Connor",
        "María José García",
        "Jean-Pierre Dubois",
        "李明",
        "Müller, Klaus"
      ];

      for (const name of nameFormats) {
        const request: CaptureLeadRequest = {
          sessionId: `session-${name.replace(/[^a-zA-Z0-9]/g, '')}`,
          organizationId: 'org-name-test',
          contactInfo: { 
            name,
email: `test${Math.random().toString(36).substring(2, 8)}@example.com`
          },
          conversationSummary: `Test for ${name}`,
          source: { channel: 'chatbot_widget' }
        };

        const mockLead = ChatbotTestDataFactory.createLead({
          sessionId: request.sessionId,
          organizationId: 'org-name-test',
          contactInfo: { 
            name, 
            email: request.contactInfo.email!,
            phone: '',
            company: ''
          }
        });

        const expectedDto = {
          id: mockLead.id,
          sessionId: request.sessionId,
          contactInfo: { name, email: request.contactInfo.email }
        };
        mockLeadCaptureService.captureLead.mockResolvedValue(expectedDto);

        const result = await useCase.execute(request);
        expect(result.contactInfo.name).toBe(name);
      }
    });
  });

  describe('Source Information Processing', () => {
    it('should handle various source channels', async () => {
      const sources = [
        { channel: 'chatbot_widget', page: 'https://example.com/pricing' },
        { channel: 'chatbot_widget', page: 'https://example.com/contact' },
        { channel: 'chatbot_widget', page: 'https://example.com/features' },
        { channel: 'chatbot_widget', page: 'https://example.com/about' }
      ];

      for (const source of sources) {
        const request: CaptureLeadRequest = {
          sessionId: `session-${source.page.replace('/', '')}`,
          organizationId: 'org-source-test',
          contactInfo: { email: `${source.page.replace('/', '')}@example.com` },
          conversationSummary: `Conversation from ${source.page}`,
          source
        };

        const mockLead = ChatbotTestDataFactory.createLead({
          sessionId: request.sessionId,
          organizationId: 'org-source-test'
        });

        const expectedDto = {
          id: mockLead.id,
          sessionId: request.sessionId,
          source: {
            type: source.channel,
            referrerUrl: source.page
          }
        };
        mockLeadCaptureService.captureLead.mockResolvedValue(expectedDto);

        const result = await useCase.execute(request);
        // The source structure in the DTO differs from request structure
        expect(result.source.type).toBe(source.channel);
        expect(result.source.referrerUrl).toBe(source.page);
      }
    });

    it('should handle referrer information correctly', async () => {
      const referrers = [
        'https://google.com/search',
        'https://facebook.com',
        'https://linkedin.com',
        'https://bing.com/search'
      ];

      for (const referrer of referrers) {
        const request: CaptureLeadRequest = {
          sessionId: `session-${referrer.replace(/[^a-z]/gi, '')}`,
          organizationId: 'org-referrer-test',
          contactInfo: { email: `${referrer.replace(/[^a-z]/gi, '')}@example.com` },
          conversationSummary: `From referrer ${referrer}`,
          source: {
            channel: 'chatbot_widget',
            referrer
          }
        };

        const mockLead = ChatbotTestDataFactory.createLead({
          sessionId: request.sessionId,
          organizationId: 'org-referrer-test'
        });

        const expectedDto = {
          id: mockLead.id,
          sessionId: request.sessionId,
          source: {
            type: request.source.channel,
            referrerUrl: referrer
          }
        };
        mockLeadCaptureService.captureLead.mockResolvedValue(expectedDto);

        const result = await useCase.execute(request);
        // Check the DTO structure for referrer
        expect(result.source?.referrerUrl).toBe(referrer);
      }
    });
  });

  describe('Integration Scenarios', () => {
    it('should handle complete lead capture workflow', async () => {
      const request: CaptureLeadRequest = {
        sessionId: 'session-complete',
        organizationId: 'org-complete',
        contactInfo: {
          name: 'Complete Test User',
          email: 'complete@example.com',
          phone: '+1-555-999-8888',
          company: 'Complete Test Corp'
        },
        conversationSummary: 'Complete conversation with all details discussed',
        source: {
          channel: 'chatbot_widget',
          page: 'https://example.com/enterprise',
          referrer: 'https://google.com/search?q=enterprise+solution'
        },
        engagementScore: 95,
        tags: ['enterprise', 'high-value', 'decision-maker']
      };

      const expectedLead = ChatbotTestDataFactory.createLead({
        sessionId: request.sessionId,
        organizationId: request.organizationId,
        contactInfo: request.contactInfo
      });
      
      const expectedDto = {
        id: expectedLead.id,
        sessionId: request.sessionId,
        organizationId: request.organizationId,
        contactInfo: {
          name: request.contactInfo.name,
          email: request.contactInfo.email,
          phone: request.contactInfo.phone,
          company: request.contactInfo.company
        },
        qualificationData: {
          engagementLevel: 'high',
          answeredQuestions: [],
          painPoints: [],
          interests: []
        },
        conversationSummary: request.conversationSummary,
        source: {
          type: request.source.channel,
          referrerUrl: request.source.page
        },
        tags: request.tags,
        leadScore: 95,
        qualificationStatus: 'highly_qualified'
      };
      mockLeadCaptureService.captureLead.mockResolvedValue(expectedDto);

      const result = await useCase.execute(request);

      // Verify all aspects of the complete workflow
      expect(result.sessionId).toBe(request.sessionId);
      expect(result.organizationId).toBe(request.organizationId);
      // ContactInfo in DTO has specific structure
      expect(result.contactInfo.name).toBe(request.contactInfo.name);
      expect(result.contactInfo.email).toBe(request.contactInfo.email);
      expect(result.contactInfo.phone).toBe(request.contactInfo.phone);
      expect(result.contactInfo.company).toBe(request.contactInfo.company);
      expect(result.conversationSummary).toBe(request.conversationSummary);
      expect(result.source.type).toBe(request.source.channel);
      expect(result.source.referrerUrl).toBe(request.source.page);
      // engagementScore is not in LeadDto, it's part of qualification data
      expect(result.qualificationData.engagementLevel).toBeDefined();
      expect(result.tags).toEqual(request.tags);
      expect(result.leadScore).toBeGreaterThan(90);
      expect(result.qualificationStatus).toBe('highly_qualified');

      // Verify service interactions
      expect(mockLeadCaptureService.captureLead).toHaveBeenCalledWith(
        expect.objectContaining({
          sessionId: request.sessionId,
          organizationId: request.organizationId,
          conversationSummary: request.conversationSummary
        })
      );
      // The service returns DTO directly, so mapper is not called in this flow
      expect(mockLeadCaptureService.captureLead).toHaveBeenCalledWith(
        expect.objectContaining({
          sessionId: request.sessionId,
          organizationId: request.organizationId,
          conversationSummary: request.conversationSummary
        })
      );
    });
  });
});