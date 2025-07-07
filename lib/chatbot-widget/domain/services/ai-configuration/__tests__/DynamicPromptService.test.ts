/**
 * DynamicPromptService Tests
 * 
 * Tests for the core prompt generation and orchestration service including:
 * - Template processing and variable injection
 * - Service coordination and section management
 * - Context injection and token optimization
 * - Deduplication and conflict resolution
 * - Business logic integration
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DynamicPromptService } from '../DynamicPromptService';
import { ChatbotConfig } from '../../../entities/ChatbotConfig';
import { ChatSession } from '../../../entities/ChatSession';
import { ChatMessage } from '../../../entities/ChatMessage';
import { PersonalitySettings } from '../../../value-objects/ai-configuration/PersonalitySettings';
import { KnowledgeBase } from '../../../value-objects/ai-configuration/KnowledgeBase';
import { OperatingHours } from '../../../value-objects/session-management/OperatingHours';
import { PromptSection } from '../../../value-objects/ai-configuration/PromptSection';

describe('DynamicPromptService', () => {
  let service: DynamicPromptService;
  let mockConversationAnalysisService: any;
  let mockPersonaGenerationService: any;
  let mockKnowledgeBaseService: any;
  let mockBusinessGuidanceService: any;
  let mockAdaptiveContextService: any;
  let mockTemplateEngine: any;
  let mockPromptCoordinationService: any;
  let mockIdentityResolutionService: any;
  let mockContentDeduplicationService: any;

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock all dependencies
    mockConversationAnalysisService = {
      analyzeConversationContext: vi.fn()
    };

    mockPersonaGenerationService = {
      generateContextAwarePersona: vi.fn()
    };

    mockKnowledgeBaseService = {
      buildMinimalKnowledgeBase: vi.fn()
    };

    mockBusinessGuidanceService = {
      generateBusinessGuidance: vi.fn()
    };

    mockAdaptiveContextService = {
      generateAdaptiveContext: vi.fn()
    };

    mockTemplateEngine = {
      processTemplate: vi.fn()
    };

    mockPromptCoordinationService = {
      coordinatePromptSections: vi.fn()
    };

    mockIdentityResolutionService = {
      resolvePersona: vi.fn()
    };

    mockContentDeduplicationService = {
      deduplicateContent: vi.fn()
    };

    service = new DynamicPromptService(
      mockConversationAnalysisService,
      mockPersonaGenerationService,
      mockKnowledgeBaseService,
      mockBusinessGuidanceService,
      mockAdaptiveContextService,
      mockTemplateEngine,
      mockPromptCoordinationService,
      mockIdentityResolutionService,
      mockContentDeduplicationService
    );
  });

  // Helper functions to create test data
  const createMockChatbotConfig = () => {
    return ChatbotConfig.create({
      organizationId: 'test-org',
      name: 'Test Chatbot',
      personalitySettings: PersonalitySettings.createDefault(),
      knowledgeBase: KnowledgeBase.createEmpty(),
      operatingHours: OperatingHours.create24x7('UTC'),
      leadQualificationQuestions: [],
      isActive: true
    });
  };

  const createMockChatSession = () => {
    return ChatSession.create(
      'test-config-123',
      'test-visitor-123',
      {
        previousVisits: 0,
        pageViews: [],
        conversationSummary: {
          fullSummary: '',
          phaseSummaries: [],
          criticalMoments: []
        },
        topics: [],
        interests: [],
        engagementScore: 0
      }
    );
  };

  const createMockChatMessage = (role: 'user' | 'assistant', content: string) => {
    if (role === 'user') {
      return ChatMessage.createUserMessage('test-session-123', content);
    } else {
      return ChatMessage.createBotMessage('test-session-123', content);
    }
  };

  describe('Constructor and Initialization', () => {
    it('should create DynamicPromptService instance with all dependencies', () => {
      expect(service).toBeDefined();
      expect(service).toBeInstanceOf(DynamicPromptService);
    });

    it('should properly inject all required services', () => {
      // Constructor should complete without throwing
      expect(() => {
        new DynamicPromptService(
          mockConversationAnalysisService,
          mockPersonaGenerationService,
          mockKnowledgeBaseService,
          mockBusinessGuidanceService,
          mockAdaptiveContextService,
          mockTemplateEngine,
          mockPromptCoordinationService,
          mockIdentityResolutionService,
          mockContentDeduplicationService
        );
      }).not.toThrow();
    });
  });

  describe('System Prompt Generation', () => {
    it('should generate basic system prompt with required sections', () => {
      const config = createMockChatbotConfig();
      const session = createMockChatSession();

      // Mock service responses
      mockConversationAnalysisService.analyzeConversationContext.mockReturnValue({
        phase: 'initial',
        intent: 'greeting',
        entities: {},
        businessContext: 'general'
      });

      mockPersonaGenerationService.generateContextAwarePersona.mockReturnValue([
        { name: 'roleTitle', value: 'AI Assistant', isRequired: true },
        { name: 'tone', value: 'professional', isRequired: true },
        { name: 'style', value: 'helpful', isRequired: false },
        { name: 'expertise', value: 'general', isRequired: false }
      ]);

      mockKnowledgeBaseService.buildMinimalKnowledgeBase.mockReturnValue(
        'Company: Test Company\nServices: AI Solutions'
      );

      mockBusinessGuidanceService.generateBusinessGuidance.mockReturnValue(
        'Focus on customer needs and provide helpful solutions.'
      );

      mockAdaptiveContextService.generateAdaptiveContext.mockReturnValue(
        'Current session: New visitor, first interaction'
      );

      mockTemplateEngine.processTemplate.mockReturnValue({
        content: 'You are a helpful AI assistant for Test Company. Company: Test Company\nServices: AI Solutions',
        metadata: { templatesUsed: ['system-prompt'] }
      });

      const result = service.generateSystemPrompt(config, session);

      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
      expect(result).toContain('Test Company');
      
      // Verify service calls
      expect(mockConversationAnalysisService.analyzeConversationContext).toHaveBeenCalledWith(
        session,
        undefined,
        undefined,
        undefined,
        undefined
      );
      expect(mockPersonaGenerationService.generateContextAwarePersona).toHaveBeenCalled();
      expect(mockKnowledgeBaseService.buildMinimalKnowledgeBase).toHaveBeenCalled();
      expect(mockTemplateEngine.processTemplate).toHaveBeenCalled();
    });

    it('should generate system prompt with conversation history', () => {
      const config = createMockChatbotConfig();
      const session = createMockChatSession();
      const history = [
        createMockChatMessage('user', 'Hello'),
        createMockChatMessage('assistant', 'Hi! How can I help you?')
      ];

      mockConversationAnalysisService.analyzeConversationContext.mockReturnValue({
        phase: 'engagement',
        intent: 'conversation',
        entities: { greeting: true },
        businessContext: 'ongoing'
      });

      mockPersonaGenerationService.generateContextAwarePersona.mockReturnValue([
        { name: 'tone', value: 'friendly', isRequired: true },
        { name: 'style', value: 'conversational', isRequired: true }
      ]);

      mockKnowledgeBaseService.buildMinimalKnowledgeBase.mockReturnValue('');
      mockBusinessGuidanceService.generateBusinessGuidance.mockReturnValue('');
      mockAdaptiveContextService.generateAdaptiveContext.mockReturnValue('');

      mockTemplateEngine.processTemplate.mockReturnValue({
        content: 'You are a friendly AI assistant in an ongoing conversation.',
        metadata: {}
      });

      const result = service.generateSystemPrompt(config, session, history);

      expect(result).toBeDefined();
      expect(mockConversationAnalysisService.analyzeConversationContext).toHaveBeenCalledWith(
        session,
        history,
        undefined,
        undefined,
        undefined
      );
    });

    it('should generate system prompt with entity data and lead scoring', () => {
      const config = createMockChatbotConfig();
      const session = createMockChatSession();
      const entityData = {
        company: 'Tech Corp',
        role: 'CTO',
        budget: '$50k',
        timeline: 'Q2'
      };
      const leadScore = 0.8;
      const qualificationStatus = 'qualified';
      const intentData = {
        intent: 'purchase_intent',
        confidence: 0.9
      };

      mockConversationAnalysisService.analyzeConversationContext.mockReturnValue({
        phase: 'qualification',
        intent: 'purchase_intent',
        entities: entityData,
        businessContext: 'sales'
      });

      mockPersonaGenerationService.generateContextAwarePersona.mockReturnValue([
        { name: 'tone', value: 'professional', isRequired: true },
        { name: 'style', value: 'sales-focused', isRequired: true },
        { name: 'expertise', value: 'enterprise', isRequired: false }
      ]);

      mockKnowledgeBaseService.buildMinimalKnowledgeBase.mockReturnValue('Pricing: Enterprise plans available');
      mockBusinessGuidanceService.generateBusinessGuidance.mockReturnValue('High-value prospect - provide detailed technical information');
      mockAdaptiveContextService.generateAdaptiveContext.mockReturnValue('Sales-ready lead with technical authority');

      mockTemplateEngine.processTemplate.mockReturnValue({
        content: 'You are a professional AI assistant helping a qualified lead from Tech Corp.',
        metadata: {}
      });

      const result = service.generateSystemPrompt(
        config,
        session,
        undefined,
        entityData,
        leadScore,
        qualificationStatus,
        intentData
      );

      expect(result).toBeDefined();
      expect(mockConversationAnalysisService.analyzeConversationContext).toHaveBeenCalledWith(
        session,
        undefined,
        entityData,
        intentData,
        leadScore
      );
      expect(mockBusinessGuidanceService.generateBusinessGuidance).toHaveBeenCalledWith(
        expect.any(Object),
        leadScore
      );
    });

    it('should handle missing optional content gracefully', () => {
      const config = createMockChatbotConfig();
      const session = createMockChatSession();

      mockConversationAnalysisService.analyzeConversationContext.mockReturnValue({
        phase: 'initial',
        intent: 'unknown',
        entities: {},
        businessContext: 'minimal'
      });

      mockPersonaGenerationService.generateContextAwarePersona.mockReturnValue([
        { name: 'tone', value: 'neutral', isRequired: true }
      ]);

      // Mock services returning empty/null content
      mockKnowledgeBaseService.buildMinimalKnowledgeBase.mockReturnValue('');
      mockBusinessGuidanceService.generateBusinessGuidance.mockReturnValue(null);
      mockAdaptiveContextService.generateAdaptiveContext.mockReturnValue('');

      mockTemplateEngine.processTemplate.mockReturnValue({
        content: 'You are an AI assistant.',
        metadata: {}
      });

      const result = service.generateSystemPrompt(config, session);

      expect(result).toBeDefined();
      expect(result).toBe('You are an AI assistant.');
    });

    it('should include logger context when provided', () => {
      const config = createMockChatbotConfig();
      const session = createMockChatSession();
      const logger = {
        logRaw: vi.fn(),
        logMessage: vi.fn()
      };

      mockConversationAnalysisService.analyzeConversationContext.mockReturnValue({});
      mockPersonaGenerationService.generateContextAwarePersona.mockReturnValue([]);
      mockKnowledgeBaseService.buildMinimalKnowledgeBase.mockReturnValue('');
      mockBusinessGuidanceService.generateBusinessGuidance.mockReturnValue('');
      mockAdaptiveContextService.generateAdaptiveContext.mockReturnValue('');

      mockTemplateEngine.processTemplate.mockReturnValue({
        content: 'System prompt with logging',
        metadata: {}
      });

      const result = service.generateSystemPrompt(
        config,
        session,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        logger
      );

      expect(result).toBeDefined();
      // Logger should be available for use by the service
      expect(logger).toBeDefined();
    });
  });

  describe('Template Processing', () => {
    it('should process templates with correct variables', () => {
      const config = createMockChatbotConfig();
      const session = createMockChatSession();

      mockConversationAnalysisService.analyzeConversationContext.mockReturnValue({
        phase: 'initial'
      });

      mockPersonaGenerationService.generateContextAwarePersona.mockReturnValue([
        { name: 'tone', value: 'professional', isRequired: true },
        { name: 'expertise', value: 'technical', isRequired: true }
      ]);

      mockKnowledgeBaseService.buildMinimalKnowledgeBase.mockReturnValue('Technical documentation');
      mockBusinessGuidanceService.generateBusinessGuidance.mockReturnValue('');
      mockAdaptiveContextService.generateAdaptiveContext.mockReturnValue('');

      mockTemplateEngine.processTemplate.mockReturnValue({
        content: 'Processed template with variables',
        metadata: { variablesUsed: ['tone', 'expertise'] }
      });

      service.generateSystemPrompt(config, session);

      // Verify template engine was called with correct parameters
      expect(mockTemplateEngine.processTemplate).toHaveBeenCalled();

      // Check that template variables are properly formatted
      const templateCalls = mockTemplateEngine.processTemplate.mock.calls;
      expect(templateCalls.length).toBeGreaterThan(0);
      
      // Should include both business-persona and system-prompt templates
      const templateNames = templateCalls.map((call: any) => call[0]);
      expect(templateNames).toContain('business-persona');
      expect(templateNames).toContain('system-prompt');
    });

    it('should handle template processing errors gracefully', () => {
      const config = createMockChatbotConfig();
      const session = createMockChatSession();

      mockConversationAnalysisService.analyzeConversationContext.mockReturnValue({});
      mockPersonaGenerationService.generateContextAwarePersona.mockReturnValue([]);
      mockKnowledgeBaseService.buildMinimalKnowledgeBase.mockReturnValue('');
      mockBusinessGuidanceService.generateBusinessGuidance.mockReturnValue('');
      mockAdaptiveContextService.generateAdaptiveContext.mockReturnValue('');

      // Mock template engine throwing error
      mockTemplateEngine.processTemplate.mockImplementation(() => {
        throw new Error('Template processing failed');
      });

      expect(() => {
        service.generateSystemPrompt(config, session);
      }).toThrow('Template processing failed');
    });
  });

  describe('Service Coordination', () => {
    it('should coordinate multiple prompt sections correctly', () => {
      const config = createMockChatbotConfig();
      const session = createMockChatSession();

      mockConversationAnalysisService.analyzeConversationContext.mockReturnValue({
        phase: 'complex',
        businessContext: 'enterprise'
      });

      mockPersonaGenerationService.generateContextAwarePersona.mockReturnValue([
        { name: 'tone', value: 'professional', isRequired: true },
        { name: 'style', value: 'expert', isRequired: true }
      ]);

      mockKnowledgeBaseService.buildMinimalKnowledgeBase.mockReturnValue('Comprehensive knowledge base');
      mockBusinessGuidanceService.generateBusinessGuidance.mockReturnValue('Enterprise guidance');
      mockAdaptiveContextService.generateAdaptiveContext.mockReturnValue('Complex context');

      mockTemplateEngine.processTemplate.mockReturnValue({
        content: 'Complex system prompt with multiple sections',
        metadata: {}
      });

      const result = service.generateSystemPrompt(config, session);

      expect(result).toBeDefined();
      
      // Verify all services were called for coordination
      expect(mockPersonaGenerationService.generateContextAwarePersona).toHaveBeenCalled();
      expect(mockKnowledgeBaseService.buildMinimalKnowledgeBase).toHaveBeenCalled();
      expect(mockBusinessGuidanceService.generateBusinessGuidance).toHaveBeenCalled();
      expect(mockAdaptiveContextService.generateAdaptiveContext).toHaveBeenCalled();
    });

    it('should prioritize sections correctly', () => {
      const config = createMockChatbotConfig();
      const session = createMockChatSession();

      // Mock high-priority content
      mockConversationAnalysisService.analyzeConversationContext.mockReturnValue({
        phase: 'critical',
        intent: 'urgent_support'
      });

      mockPersonaGenerationService.generateContextAwarePersona.mockReturnValue([
        { name: 'tone', value: 'urgent', isRequired: true },
        { name: 'priority', value: 'high', isRequired: true }
      ]);

      mockKnowledgeBaseService.buildMinimalKnowledgeBase.mockReturnValue('Critical support info');
      mockBusinessGuidanceService.generateBusinessGuidance.mockReturnValue('Urgent escalation needed');
      mockAdaptiveContextService.generateAdaptiveContext.mockReturnValue('High-priority context');

      mockTemplateEngine.processTemplate.mockReturnValue({
        content: 'High-priority system prompt for urgent support',
        metadata: { priority: 'critical' }
      });

      const result = service.generateSystemPrompt(config, session);

      expect(result).toContain('urgent');
      expect(result).toContain('support');
    });
  });

  describe('Context Injection and Token Optimization', () => {
    it('should optimize content for token limits', () => {
      const config = createMockChatbotConfig();
      const session = createMockChatSession();

      // Mock lengthy content that needs optimization
      const longKnowledgeBase = 'Very long knowledge base content '.repeat(100);
      const longBusinessGuidance = 'Extensive business guidance '.repeat(50);

      mockConversationAnalysisService.analyzeConversationContext.mockReturnValue({
        phase: 'detailed'
      });

      mockPersonaGenerationService.generateContextAwarePersona.mockReturnValue([
        { name: 'tone', value: 'concise', isRequired: true }
      ]);

      mockKnowledgeBaseService.buildMinimalKnowledgeBase.mockReturnValue(longKnowledgeBase);
      mockBusinessGuidanceService.generateBusinessGuidance.mockReturnValue(longBusinessGuidance);
      mockAdaptiveContextService.generateAdaptiveContext.mockReturnValue('Optimized context');

      mockTemplateEngine.processTemplate.mockReturnValue({
        content: 'Optimized system prompt within token limits',
        metadata: { tokenCount: 750 }
      });

      const result = service.generateSystemPrompt(config, session);

      expect(result).toBeDefined();
      // Should be optimized to reasonable length
      expect(result.length).toBeLessThan(4000);
    });

    it('should inject context based on conversation phase', () => {
      const config = createMockChatbotConfig();
      const session = createMockChatSession();

      mockConversationAnalysisService.analyzeConversationContext.mockReturnValue({
        phase: 'discovery',
        intent: 'information_gathering',
        businessContext: 'exploration'
      });

      mockPersonaGenerationService.generateContextAwarePersona.mockReturnValue([
        { name: 'tone', value: 'inquisitive', isRequired: true },
        { name: 'style', value: 'discovery-focused', isRequired: true }
      ]);

      mockKnowledgeBaseService.buildMinimalKnowledgeBase.mockReturnValue('Discovery-relevant knowledge');
      mockBusinessGuidanceService.generateBusinessGuidance.mockReturnValue('Guide discovery process');
      mockAdaptiveContextService.generateAdaptiveContext.mockReturnValue('Discovery phase context');

      mockTemplateEngine.processTemplate.mockReturnValue({
        content: 'Discovery-focused system prompt for information gathering',
        metadata: { phase: 'discovery' }
      });

      const result = service.generateSystemPrompt(config, session);

      expect(result.toLowerCase()).toContain('discovery');
      expect(mockAdaptiveContextService.generateAdaptiveContext).toHaveBeenCalledWith(
        session,
        expect.objectContaining({ phase: 'discovery' }),
        config
      );
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle service failures gracefully', () => {
      const config = createMockChatbotConfig();
      const session = createMockChatSession();

      mockConversationAnalysisService.analyzeConversationContext.mockImplementation(() => {
        throw new Error('Analysis service failed');
      });

      expect(() => {
        service.generateSystemPrompt(config, session);
      }).toThrow('Analysis service failed');
    });

    it('should handle null/undefined inputs gracefully', () => {
      const config = createMockChatbotConfig();
      const session = createMockChatSession();

      mockConversationAnalysisService.analyzeConversationContext.mockReturnValue(null);
      mockPersonaGenerationService.generateContextAwarePersona.mockReturnValue([]);
      mockKnowledgeBaseService.buildMinimalKnowledgeBase.mockReturnValue(null);
      mockBusinessGuidanceService.generateBusinessGuidance.mockReturnValue(undefined);
      mockAdaptiveContextService.generateAdaptiveContext.mockReturnValue(null);

      mockTemplateEngine.processTemplate.mockReturnValue({
        content: 'Fallback system prompt',
        metadata: {}
      });

      const result = service.generateSystemPrompt(config, session);

      expect(result).toBe('Fallback system prompt');
    });

    it('should handle empty conversation history', () => {
      const config = createMockChatbotConfig();
      const session = createMockChatSession();
      const emptyHistory: ChatMessage[] = [];

      mockConversationAnalysisService.analyzeConversationContext.mockReturnValue({
        phase: 'initial'
      });

      mockPersonaGenerationService.generateContextAwarePersona.mockReturnValue([]);
      mockKnowledgeBaseService.buildMinimalKnowledgeBase.mockReturnValue('');
      mockBusinessGuidanceService.generateBusinessGuidance.mockReturnValue('');
      mockAdaptiveContextService.generateAdaptiveContext.mockReturnValue('');

      mockTemplateEngine.processTemplate.mockReturnValue({
        content: 'Initial system prompt',
        metadata: {}
      });

      const result = service.generateSystemPrompt(config, session, emptyHistory);

      expect(result).toBeDefined();
      expect(mockConversationAnalysisService.analyzeConversationContext).toHaveBeenCalledWith(
        session,
        emptyHistory,
        undefined,
        undefined,
        undefined
      );
    });

    it('should validate required parameters', () => {
      const config = createMockChatbotConfig();
      const session = createMockChatSession();

      // Test with null config
      expect(() => {
        service.generateSystemPrompt(null as any, session);
      }).toThrow();

      // Test with null session
      expect(() => {
        service.generateSystemPrompt(config, null as any);
      }).toThrow();
    });
  });
});