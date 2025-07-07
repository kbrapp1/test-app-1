/**
 * Lead Entity Unit Tests
 * 
 * Tests the Lead domain entity following DDD patterns.
 * Covers entity creation, business logic, invariants, and error handling.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Lead, QualificationStatus } from '../../../domain/entities/Lead';
import { ContactInfoProps } from '../../../domain/value-objects/lead-management/ContactInfo';
import { QualificationDataProps } from '../../../domain/value-objects/lead-management/QualificationData';
import { LeadSourceProps } from '../../../domain/value-objects/lead-management/LeadSource';
import { FollowUpStatus } from '../../../domain/entities/LeadLifecycleManager';
import { ChatbotTestDataFactory } from '../../test-utils/ChatbotTestDataFactory';

describe('Lead Entity', () => {
  let validContactInfo: ContactInfoProps;
  let validQualificationData: QualificationDataProps;
  let validSource: LeadSourceProps;

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();

    validContactInfo = {
      name: 'John Doe',
      email: 'john.doe@example.com',
      phone: '+1-555-123-4567',
      company: 'Acme Corp',
      jobTitle: 'CTO',
      linkedin: 'https://linkedin.com/in/johndoe'
    };

    validQualificationData = {
      painPoints: ['scaling issues', 'manual processes'],
      interests: ['automation', 'cost reduction'],
      answeredQuestions: [
        {
          questionId: 'budget-q1',
          question: 'What is your budget range?',
          answer: '$50k',
          answeredAt: new Date(),
          scoringWeight: 1.0,
          scoreContribution: 10
        },
        {
          questionId: 'timeline-q1',
          question: 'What is your timeline?',
          answer: '3 months',
          answeredAt: new Date(),
          scoringWeight: 0.8,
          scoreContribution: 8
        }
      ],
      engagementLevel: 'high',
      decisionMaker: true,
      timeline: '3_months',
      budget: 'enterprise',
      companySize: '100-500',
      currentSolution: 'manual processes'
    };

    validSource = {
      channel: 'chatbot_widget',
      pageUrl: 'https://example.com/pricing',
      pageTitle: 'Pricing - Example.com',
      referrer: 'https://google.com/search',
      utmSource: 'google',
      utmMedium: 'cpc',
      utmCampaign: 'enterprise-leads'
    };
  });

  describe('Entity Creation', () => {
    it('should create valid Lead with required properties', () => {
      const lead = Lead.create(
        'session-123',
        'org-456',
        'config-789',
        validContactInfo,
        validQualificationData,
        validSource,
        'Customer interested in enterprise solution'
      );

      expect(lead.id).toBeDefined();
      expect(lead.sessionId).toBe('session-123');
      expect(lead.organizationId).toBe('org-456');
      expect(lead.chatbotConfigId).toBe('config-789');
      expect(lead.contactInfo.name).toBe('John Doe');
      expect(lead.contactInfo.email).toBe('john.doe@example.com');
      expect(lead.qualificationData.painPoints).toEqual(['scaling issues', 'manual processes']);
      expect(lead.source.channel).toBe('chatbot_widget');
      expect(lead.conversationSummary).toBe('Customer interested in enterprise solution');
      expect(lead.leadScore).toBe(0); // Default
      expect(lead.qualificationStatus).toBe('not_qualified'); // Default
      expect(lead.followUpStatus).toBe('new');
      expect(lead.capturedAt).toBeInstanceOf(Date);
      expect(lead.createdAt).toBeInstanceOf(Date);
      expect(lead.updatedAt).toBeInstanceOf(Date);
    });

    it('should create Lead with custom lead score and qualification status', () => {
      const lead = Lead.create(
        'session-123',
        'org-456',
        'config-789',
        validContactInfo,
        validQualificationData,
        validSource,
        'High-value prospect',
        85,
        'highly_qualified'
      );

      expect(lead.leadScore).toBe(85);
      expect(lead.qualificationStatus).toBe('highly_qualified');
    });

    it('should enforce business invariants during creation', () => {
      // Test empty session ID
      expect(() => {
        Lead.create(
          '',
          'org-456',
          'config-789',
          validContactInfo,
          validQualificationData,
          validSource,
          'Test summary'
        );
      }).toThrow('Session ID is required');

      // Test empty organization ID  
      expect(() => {
        Lead.create(
          'session-123',
          '',
          'config-789',
          validContactInfo,
          validQualificationData,
          validSource,
          'Test summary'
        );
      }).toThrow('Organization ID is required');

      // Test empty chatbot config ID
      expect(() => {
        Lead.create(
          'session-123',
          'org-456',
          '',
          validContactInfo,
          validQualificationData,
          validSource,
          'Test summary'
        );
      }).toThrow('Chatbot config ID is required');
    });

    it('should validate lead score range', () => {
      // Test negative score
      expect(() => {
        Lead.create(
          'session-123',
          'org-456',
          'config-789',
          validContactInfo,
          validQualificationData,
          validSource,
          'Test summary',
          -10
        );
      }).toThrow('Lead score must be between 0 and 100');

      // Test score > 100
      expect(() => {
        Lead.create(
          'session-123',
          'org-456',
          'config-789',
          validContactInfo,
          validQualificationData,
          validSource,
          'Test summary',
          150
        );
      }).toThrow('Lead score must be between 0 and 100');
    });

    it('should create from persistence data', () => {
      const persistenceData = {
        id: 'lead-123',
        sessionId: 'session-456',
        organizationId: 'org-789',
        chatbotConfigId: 'config-012',
        contactInfo: validContactInfo,
        qualificationData: validQualificationData,
        leadScore: 75,
        qualificationStatus: 'qualified' as QualificationStatus,
        source: validSource,
        metadata: {
          conversationSummary: 'Restored lead',
          tags: ['high-priority'],
          notes: []
        },
        capturedAt: new Date('2024-01-01'),
        followUpStatus: 'contacted' as FollowUpStatus,
        assignedTo: 'user-123',
        lastContactedAt: new Date('2024-01-02'),
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-02')
      };

      const lead = Lead.fromPersistence(persistenceData);

      expect(lead.id).toBe('lead-123');
      expect(lead.sessionId).toBe('session-456');
      expect(lead.organizationId).toBe('org-789');
      expect(lead.leadScore).toBe(75);
      expect(lead.qualificationStatus).toBe('qualified');
      expect(lead.followUpStatus).toBe('contacted');
      expect(lead.assignedTo).toBe('user-123');
      expect(lead.tags).toEqual(['high-priority']);
    });
  });

  describe('Business Logic', () => {
    let lead: Lead;

    beforeEach(() => {
      lead = Lead.create(
        'session-123',
        'org-456',
        'config-789',
        validContactInfo,
        validQualificationData,
        validSource,
        'Test lead'
      );
    });

    it('should update contact information', async () => {
      // Add small delay to ensure different timestamp
      await new Promise(resolve => setTimeout(resolve, 1));
      
      const updatedLead = lead.updateContactInfo({
        phone: '+1-555-999-9999',
        company: 'New Company Inc'
      });

      expect(updatedLead.contactInfo.phone).toBe('+1-555-999-9999');
      expect(updatedLead.contactInfo.company).toBe('New Company Inc');
      expect(updatedLead.contactInfo.name).toBe('John Doe'); // Should preserve other fields
      expect(updatedLead.id).toBe(lead.id); // Should maintain identity
      expect(updatedLead.updatedAt.getTime()).toBeGreaterThan(lead.updatedAt.getTime());
    });

    it('should update qualification data', async () => {
      await new Promise(resolve => setTimeout(resolve, 1));
      
      const updatedLead = lead.updateQualificationData({
        budget: 'startup',
        timeline: '6_months',
        painPoints: ['new pain point']
      });

      expect(updatedLead.qualificationData.budget).toBe('startup');
      expect(updatedLead.qualificationData.timeline).toBe('6_months');
      expect(updatedLead.qualificationData.painPoints).toEqual(['new pain point']);
      expect(updatedLead.id).toBe(lead.id);
      expect(updatedLead.updatedAt.getTime()).toBeGreaterThan(lead.updatedAt.getTime());
    });

    it('should handle follow-up status transitions', async () => {
      await new Promise(resolve => setTimeout(resolve, 1));
      
      // Test direct status update
      const contactedLead = lead.updateFollowUpStatus('contacted');
      expect(contactedLead.followUpStatus).toBe('contacted');
      expect(contactedLead.updatedAt.getTime()).toBeGreaterThan(lead.updatedAt.getTime());

      // Test shortcut methods
      await new Promise(resolve => setTimeout(resolve, 1));
      const convertedLead = contactedLead.markAsConverted();
      expect(convertedLead.followUpStatus).toBe('converted');

      await new Promise(resolve => setTimeout(resolve, 1));
      const lostLead = convertedLead.markAsLost();
      expect(lostLead.followUpStatus).toBe('lost');

      await new Promise(resolve => setTimeout(resolve, 1));
      const nurturingLead = lostLead.markAsNurturing();
      expect(nurturingLead.followUpStatus).toBe('nurturing');

      await new Promise(resolve => setTimeout(resolve, 1));
      const inProgressLead = nurturingLead.markAsInProgress();
      expect(inProgressLead.followUpStatus).toBe('in_progress');
    });

    it('should handle lead assignment', async () => {
      await new Promise(resolve => setTimeout(resolve, 2));
      
      const assignedLead = lead.assignTo('user-456');
      expect(assignedLead.assignedTo).toBe('user-456');
      expect(assignedLead.updatedAt.getTime()).toBeGreaterThan(lead.updatedAt.getTime());

      await new Promise(resolve => setTimeout(resolve, 1));
      const unassignedLead = assignedLead.unassign();
      expect(unassignedLead.assignedTo).toBeUndefined();
      expect(unassignedLead.updatedAt.getTime()).toBeGreaterThan(assignedLead.updatedAt.getTime());
    });

    it('should manage tags', async () => {
      await new Promise(resolve => setTimeout(resolve, 5));
      
      // Add tags
      const taggedLead = lead.addTag('high-priority');
      expect(taggedLead.tags).toContain('high-priority');
      expect(taggedLead.updatedAt.getTime()).toBeGreaterThan(lead.updatedAt.getTime());

      await new Promise(resolve => setTimeout(resolve, 1));
      const multiTaggedLead = taggedLead.addTag('enterprise');
      expect(multiTaggedLead.tags).toEqual(expect.arrayContaining(['high-priority', 'enterprise']));

      // Remove tag
      await new Promise(resolve => setTimeout(resolve, 1));
      const removedTagLead = multiTaggedLead.removeTag('high-priority');
      expect(removedTagLead.tags).toContain('enterprise');
      expect(removedTagLead.tags).not.toContain('high-priority');
    });

    it('should manage notes', async () => {
      await new Promise(resolve => setTimeout(resolve, 1));
      
      const leadWithNote = lead.addNote(
        'Customer wants demo next week',
        'user-123',
        'Sales Rep',
        false // public note
      );

      expect(leadWithNote.notes).toHaveLength(1);
      expect(leadWithNote.notes[0].content).toBe('Customer wants demo next week');
      expect(leadWithNote.notes[0].authorId).toBe('user-123');
      expect(leadWithNote.notes[0].authorName).toBe('Sales Rep');
      expect(leadWithNote.notes[0].isInternal).toBe(false);
      expect(leadWithNote.updatedAt.getTime()).toBeGreaterThan(lead.updatedAt.getTime());
    });

    it('should update conversation summary', async () => {
      await new Promise(resolve => setTimeout(resolve, 1));
      
      const updatedLead = lead.updateConversationSummary('Updated summary with more details');
      
      expect(updatedLead.conversationSummary).toBe('Updated summary with more details');
      expect(updatedLead.updatedAt.getTime()).toBeGreaterThan(lead.updatedAt.getTime());
    });
  });

  describe('Domain Invariants', () => {
    let lead: Lead;

    beforeEach(() => {
      lead = Lead.create(
        'session-123',
        'org-456',
        'config-789',
        validContactInfo,
        validQualificationData,
        validSource,
        'Test lead'
      );
    });

    it('should maintain immutability through business methods', () => {
      const originalLead = lead;
      const updatedLead = lead.updateContactInfo({ phone: '+1-555-000-0000' });

      // Original should be unchanged
      expect(originalLead.contactInfo.phone).toBe('+1-555-123-4567');
      expect(originalLead.id).toBe(lead.id);
      
      // Updated should be new instance
      expect(updatedLead.contactInfo.phone).toBe('+1-555-000-0000');
      expect(updatedLead.id).toBe(originalLead.id); // Same identity
      expect(updatedLead).not.toBe(originalLead); // Different instance
    });

    it('should enforce organizational isolation', () => {
      const lead1 = Lead.create(
        'session-1',
        'org-1',
        'config-1',
        validContactInfo,
        validQualificationData,
        validSource,
        'Org 1 lead'
      );

      const lead2 = Lead.create(
        'session-2',
        'org-2',
        'config-2',
        validContactInfo,
        validQualificationData,
        validSource,
        'Org 2 lead'
      );

      expect(lead1.organizationId).toBe('org-1');
      expect(lead2.organizationId).toBe('org-2');
      expect(lead1.organizationId).not.toBe(lead2.organizationId);
    });

    it('should maintain lead score bounds', () => {
      expect(lead.leadScore).toBeGreaterThanOrEqual(0);
      expect(lead.leadScore).toBeLessThanOrEqual(100);
    });
  });

  describe('Query Methods', () => {
    it('should determine qualification status', () => {
      const notQualifiedLead = Lead.create(
        'session-1',
        'org-1',
        'config-1',
        validContactInfo,
        validQualificationData,
        validSource,
        'Test',
        30,
        'not_qualified'
      );

      const qualifiedLead = Lead.create(
        'session-2',
        'org-1',
        'config-1',
        validContactInfo,
        validQualificationData,
        validSource,
        'Test',
        75,
        'qualified'
      );

      const highlyQualifiedLead = Lead.create(
        'session-3',
        'org-1',
        'config-1',
        validContactInfo,
        validQualificationData,
        validSource,
        'Test',
        95,
        'highly_qualified'
      );

      expect(notQualifiedLead.isQualified()).toBe(false);
      expect(qualifiedLead.isQualified()).toBe(true);
      expect(highlyQualifiedLead.isQualified()).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid contact info updates gracefully', () => {
      const lead = Lead.create(
        'session-123',
        'org-456',
        'config-789',
        validContactInfo,
        validQualificationData,
        validSource,
        'Test lead'
      );

      // Should delegate validation to ContactInfo value object
      expect(() => {
        lead.updateContactInfo({ email: 'invalid-email' });
      }).toThrow(); // ContactInfo should validate email format
    });

    it('should handle invalid qualification data gracefully', () => {
      const lead = Lead.create(
        'session-123',
        'org-456',
        'config-789',
        validContactInfo,
        validQualificationData,
        validSource,
        'Test lead'
      );

      // QualificationData may not validate timeline values, so test a more fundamental validation
      expect(() => {
        lead.updateQualificationData({ engagementLevel: 'invalid-level' as any });
      }).toThrow(); // QualificationData should validate engagement level
    });
  });

  describe('Performance Requirements', () => {
    it('should create entity within performance limits', async () => {
      const startTime = Date.now();
      
      Lead.create(
        'session-123',
        'org-456',
        'config-789',
        validContactInfo,
        validQualificationData,
        validSource,
        'Performance test lead'
      );
      
      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(10); // Should create in under 10ms
    });

    it('should handle business operations efficiently', async () => {
      const lead = Lead.create(
        'session-123',
        'org-456',
        'config-789',
        validContactInfo,
        validQualificationData,
        validSource,
        'Test lead'
      );

      const startTime = Date.now();
      
      // Chain multiple operations
      const finalLead = lead
        .updateContactInfo({ phone: '+1-555-000-0000' })
        .addTag('performance-test')
        .markAsContacted()
        .assignTo('user-123');
      
      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(5); // Should complete operations in under 5ms
      expect(finalLead.contactInfo.phone).toBe('+1-555-000-0000');
      expect(finalLead.tags).toContain('performance-test');
      expect(finalLead.followUpStatus).toBe('contacted');
      expect(finalLead.assignedTo).toBe('user-123');
    });
  });
});