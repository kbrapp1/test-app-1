/**
 * Test Data Factory for Chatbot Widget Testing
 * 
 * AI INSTRUCTIONS:
 * - Provides consistent test data generation following DDD entity patterns and business rules
 * - Creates valid domain objects with realistic data for comprehensive testing scenarios
 * - Supports test isolation with configurable overrides and deterministic data generation
 * - Implements factory methods for complex conversation flows and lead qualification scenarios
 * - Maintains test data integrity across domain boundaries and value object constraints
 */

import { ChatbotConfig } from '../../domain/entities/ChatbotConfig';
import { ChatSession } from '../../domain/entities/ChatSession';
import { ChatMessage } from '../../domain/entities/ChatMessage';
import { Lead } from '../../domain/entities/Lead';
import { MessageAIMetadata } from '../../domain/value-objects/message-processing/MessageAIMetadata';
import { MessageContextMetadata } from '../../domain/value-objects/message-processing/MessageContextMetadata';
import { MessageProcessingMetrics } from '../../domain/value-objects/message-processing/MessageProcessingMetrics';
import { MessageCostTracking } from '../../domain/value-objects/message-processing/MessageCostTracking';
import { PersonalitySettings } from '../../domain/value-objects/ai-configuration/PersonalitySettings';
import { KnowledgeBase } from '../../domain/value-objects/ai-configuration/KnowledgeBase';
import { OperatingHours } from '../../domain/value-objects/session-management/OperatingHours';
import { ConversationContextWindow } from '../../domain/value-objects/session-management/ConversationContextWindow';

export class ChatbotTestDataFactory {
  static createValidConfig(overrides?: Partial<any>): ChatbotConfig {
    const defaultProps = {
      id: 'config-123',
      organizationId: 'org-test-123',
      name: 'Test Support Chatbot',
      description: 'A test chatbot for customer support',
      personalitySettings: this.createPersonalitySettings(),
      knowledgeBase: this.createKnowledgeBase(),
      operatingHours: this.createOperatingHours(),
      leadQualificationQuestions: [],
      aiConfiguration: ChatbotConfig.getDefaultAIConfiguration(),
      isActive: true,
      createdAt: new Date('2024-01-01T00:00:00Z'),
      updatedAt: new Date('2024-01-01T00:00:00Z'),
      ...overrides
    };

    return ChatbotConfig.fromPersistence(defaultProps);
  }

  static createChatSession(configId?: string, overrides?: Partial<any>): ChatSession {
    const defaultProps = {
      id: 'session-123',
      chatbotConfigId: String(configId || 'config-123'),
      visitorId: 'visitor-123',
      sessionToken: 'token-abc123-' + Math.random().toString(36).substring(2, 15),
      status: 'active' as const,
      contextData: {
        pageViews: [{
          url: '/test-page',
          title: 'Test Page',
          timestamp: new Date(),
          timeOnPage: 30000
        }],
        previousVisits: 0,
        conversationSummary: {
          fullSummary: 'Test conversation summary'
        },
        topics: ['pricing', 'support'],
        interests: ['enterprise'],
        engagementScore: 75,
        accumulatedEntities: {
          decisionMakers: [],
          painPoints: [],
          integrationNeeds: [],
          evaluationCriteria: []
        },
        leadScore: 45
      },
      leadQualificationState: {
        currentStep: 0,
        answeredQuestions: [],
        qualificationStatus: 'not_started' as const,
        isQualified: false
      },
      startedAt: new Date('2024-01-01T10:00:00Z'),
      lastActivityAt: new Date('2024-01-01T10:30:00Z'),
      endedAt: undefined,
      createdAt: new Date('2024-01-01T10:00:00Z'),
      updatedAt: new Date('2024-01-01T10:30:00Z'),
      ...overrides
    };

    // Apply overrides then ensure string types
    const mergedProps = { ...defaultProps, ...overrides };
    
    // Ensure string fields after overrides
    const finalProps = {
      ...mergedProps,
      id: String(mergedProps.id || 'session-123'),
      chatbotConfigId: String(mergedProps.chatbotConfigId || 'config-123'),
      visitorId: String(mergedProps.visitorId || 'visitor-123'),
      sessionToken: String(mergedProps.sessionToken || 'token-abc123')
    };

    return ChatSession.fromPersistence(finalProps);
  }

  static createChatMessage(sessionId?: string, overrides?: Partial<any>): ChatMessage {
    // Use static factory methods from ChatMessage entity
    const messageSessionId = sessionId || 'session-123';
    const content = overrides?.content || 'Hello, I need help with pricing';
    const messageType = overrides?.messageType || 'user';
    
    if (messageType === 'bot') {
      return ChatMessage.createBotMessage(messageSessionId, content, {
        model: 'gpt-4o-mini',
        promptTokens: 150,
        completionTokens: 50,
        confidence: 0.95,
        intentDetected: 'pricing_inquiry',
        processingTime: 1200
      });
    } else if (messageType === 'user') {
      return ChatMessage.createUserMessage(messageSessionId, content, 'text');
    } else {
      // For system or other message types
      return ChatMessage.create({
        id: ChatMessage.generateId(),
        sessionId: messageSessionId,
        messageType: messageType as any,
        content,
        timestamp: overrides?.timestamp || new Date('2024-01-01T10:15:00Z'),
        isVisible: overrides?.isVisible !== undefined ? overrides.isVisible : true,
        processingTime: overrides?.processingTime || 0,
        aiMetadata: MessageAIMetadata.createEmpty(),
        contextMetadata: MessageContextMetadata.createEmpty(),
        processingMetrics: MessageProcessingMetrics.createEmpty(),
        costTracking: MessageCostTracking.createZeroCost(),
        ...overrides
      });
    }
  }

  static createBotMessage(sessionId?: string, content?: string): ChatMessage {
    return ChatMessage.createBotMessage(
      sessionId || 'session-123',
      content || 'Thank you for your inquiry about pricing. I\'d be happy to help!',
      {
        model: 'gpt-4o-mini',
        promptTokens: 150,
        completionTokens: 50,
        confidence: 0.95,
        intentDetected: 'pricing_inquiry',
        processingTime: 1200
      }
    );
  }

  static createLead(overrides?: Partial<any>): Lead {
    const defaults = {
      sessionId: 'session-123',
      organizationId: 'org-test-123',
      chatbotConfigId: 'config-123',
      contactInfo: {
        email: 'test@example.com',
        name: 'John Doe',
        phone: '+1-555-123-4567',
        company: 'Test Corp'
      },
      qualificationData: {
        budget: '$50,000',
        timeline: '3 months',
        decisionMaker: true,
        painPoints: ['slow performance', 'lack of integration'],
        interests: ['enterprise features', 'api integration'],
        answeredQuestions: [],
        engagementLevel: 'high' as const
      },
      leadScore: 85,
      qualificationStatus: 'qualified' as const,
      source: {
        channel: 'chatbot_widget' as const,
        pageUrl: 'https://example.com/pricing',
        pageTitle: 'Pricing Page'
      },
      conversationSummary: 'User interested in enterprise features',
      ...overrides
    };

    return Lead.create(
      defaults.sessionId,
      defaults.organizationId,
      defaults.chatbotConfigId,
      defaults.contactInfo,
      defaults.qualificationData,
      defaults.source,
      defaults.conversationSummary,
      defaults.leadScore,
      defaults.qualificationStatus
    );
  }

  static createConversationFlow(): ChatMessage[] {
    const sessionId = 'session-conversation-123';
    
    return [
      this.createChatMessage(sessionId, {
        id: 'msg-1',
        messageType: 'user',
        content: 'Hi, I\'m interested in your services',
        timestamp: new Date('2024-01-01T10:00:00Z')
      }),
      
      this.createBotMessage(sessionId, 'Hello! I\'d be happy to help you learn about our services. What specifically are you looking for?'),
      
      this.createChatMessage(sessionId, {
        id: 'msg-3',
        messageType: 'user',
        content: 'I need an enterprise solution for my team of 50 people. Budget is around $100k',
        timestamp: new Date('2024-01-01T10:02:00Z'),
        metadata: {
          entitiesExtracted: [
            { type: 'teamSize', value: '50', confidence: 0.9 },
            { type: 'budget', value: '$100k', confidence: 0.85 },
            { type: 'planType', value: 'enterprise', confidence: 0.95 }
          ],
          topics: ['enterprise', 'pricing', 'team'],
          inputMethod: 'text'
        }
      }),
      
      this.createBotMessage(sessionId, 'Perfect! Our enterprise plan would be ideal for a team of 50. Could I get your email to send you detailed pricing information?'),
      
      this.createChatMessage(sessionId, {
        id: 'msg-5',
        messageType: 'user',
        content: 'Sure, it\'s john.doe@testcorp.com',
        timestamp: new Date('2024-01-01T10:04:00Z'),
        metadata: {
          entitiesExtracted: [
            { type: 'email', value: 'john.doe@testcorp.com', confidence: 0.99 }
          ],
          topics: ['contact'],
          inputMethod: 'text'
        }
      })
    ];
  }

  static createPersonalitySettings(overrides?: Partial<any>) {
    return PersonalitySettings.create({
      tone: 'professional',
      communicationStyle: 'helpful',
      responseLength: 'adaptive',
      escalationTriggers: ['complex_technical', 'pricing_negotiation', 'complaint'],
      responseBehavior: {
        useEmojis: false,
        askFollowUpQuestions: true,
        proactiveOffering: true,
        personalizeResponses: true,
        acknowledgePreviousInteractions: true,
      },
      conversationFlow: {
        greetingMessage: 'Hello! How can I help you today?',
        fallbackMessage: "I'm not sure I understand. Could you please rephrase that?",
        escalationMessage: 'Let me connect you with a human agent who can better assist you.',
        endConversationMessage: 'Thank you for chatting with us today! Have a great day!',
        leadCapturePrompt: 'Would you like to leave your contact information so we can follow up with you?',
        maxConversationTurns: 20,
        inactivityTimeout: 300,
      },
      customInstructions: 'Always be helpful and focus on understanding customer needs',
      ...overrides
    });
  }

  static createKnowledgeBase(overrides?: Partial<any>) {
    return KnowledgeBase.create({
      companyInfo: 'Test Company - A leading provider of innovative solutions',
      productCatalog: 'Our products include Starter, Professional, and Enterprise plans',
      faqs: [
        {
          id: 'faq-1',
          question: 'What are your pricing plans?',
          answer: 'We offer Starter ($29/mo), Professional ($99/mo), and Enterprise (custom) plans.',
          category: 'pricing',
          isActive: true
        },
        {
          id: 'faq-2',
          question: 'Do you offer technical support?',
          answer: 'Yes, we provide 24/7 technical support for all paid plans.',
          category: 'support',
          isActive: true
        }
      ],
      supportDocs: 'Comprehensive support documentation available 24/7',
      complianceGuidelines: 'We follow industry-standard compliance requirements',
      websiteSources: [
        {
          id: 'source-1',
          url: 'https://example.com/pricing',
          name: 'Pricing Page',
          description: 'Main pricing information',
          status: 'completed',
          lastCrawled: new Date('2024-01-01T00:00:00Z'),
          pageCount: 15,
          isActive: true,
          crawlSettings: KnowledgeBase.createDefaultWebsiteCrawlSettings()
        }
      ],
      ...overrides
    });
  }

  static createOperatingHours(overrides?: Partial<any>) {
    // Default to 24x7 for chatbot availability
    return OperatingHours.create24x7('UTC');
  }

  static createLeadQualificationQuestions() {
    return [
      {
        id: 'q1',
        question: 'What\'s your email address?',
        type: 'email',
        isRequired: true,
        order: 1,
        scoringWeight: 20
      },
      {
        id: 'q2',
        question: 'What\'s your company name?',
        type: 'text',
        isRequired: true,
        order: 2,
        scoringWeight: 15
      },
      {
        id: 'q3',
        question: 'What\'s your approximate budget?',
        type: 'select',
        options: ['Under $10k', '$10k-$50k', '$50k-$100k', 'Over $100k'],
        isRequired: false,
        order: 3,
        scoringWeight: 25
      }
    ];
  }

  static createContextWindow(overrides?: Partial<any>) {
    return ConversationContextWindow.create({
      maxTokens: 16000,
      systemPromptTokens: 800,
      responseReservedTokens: 3500,
      summaryTokens: 300,
      ...overrides
    });
  }

  // Helper methods for specific test scenarios
  static createHighValueLead(): Lead {
    return Lead.create(
      'session-high-value',
      'org-enterprise',
      'config-enterprise',
      {
        email: 'ceo@enterprise-corp.com',
        name: 'Sarah Johnson',
        phone: '+1-555-199-8765',
        company: 'Enterprise Corp'
      },
      {
        budget: '$500,000',
        timeline: '1 month',
        decisionMaker: true,
        painPoints: ['scalability issues', 'security concerns'],
        interests: ['enterprise features', 'custom integration', 'dedicated support'],
        answeredQuestions: [],
        engagementLevel: 'high' as const
      },
      {
        channel: 'chatbot_widget' as const,
        pageUrl: 'https://example.com/enterprise',
        pageTitle: 'Enterprise Solutions'
      },
      'High value enterprise prospect with large budget and immediate timeline',
      95,
      'highly_qualified'
    );
  }

  static createUnqualifiedLead(): Lead {
    return Lead.create(
      'session-unqualified',
      'org-test',
      'config-test',
      {
        email: 'curious@student.edu',
        name: 'Alex Student'
      },
      {
        budget: 'Not specified',
        timeline: 'Just browsing',
        decisionMaker: false,
        painPoints: [],
        interests: [],
        answeredQuestions: [],
        engagementLevel: 'low' as const
      },
      {
        channel: 'chatbot_widget' as const,
        pageUrl: 'https://example.com/features',
        pageTitle: 'Features Page'
      },
      'Student browsing without specific needs or budget',
      25,
      'not_qualified'
    );
  }

  static createComplexConversationContext() {
    return {
      messages: this.createConversationFlow(),
      contextWindow: this.createContextWindow(),
      knowledgeContext: [
        {
          title: 'Enterprise Pricing',
          content: 'Our enterprise plan includes advanced features...',
          relevanceScore: 0.95,
          source: 'knowledge_base'
        }
      ],
      entityContext: {
        budget: '$100k',
        teamSize: '50',
        planType: 'enterprise',
        email: 'john.doe@testcorp.com'
      },
      intentHistory: ['greeting', 'pricing_inquiry', 'enterprise_interest', 'contact_provided']
    };
  }

  // Helper methods for value objects
  static createAIMetadata(overrides?: Partial<any>) {
    return MessageAIMetadata.createEmpty();
  }

  static createContextMetadata(overrides?: Partial<any>) {
    return MessageContextMetadata.createEmpty();
  }

  static createProcessingMetrics(overrides?: Partial<any>) {
    return MessageProcessingMetrics.createEmpty();
  }

  static createCostTracking(overrides?: Partial<any>) {
    return MessageCostTracking.createZeroCost();
  }
}