import { describe, it, expect, beforeEach, vi, Mock } from 'vitest';
import { SimplePromptService } from '../SimplePromptService';
import { PersonaGenerationService } from '../PersonaGenerationService';
import { KnowledgeBaseService } from '../KnowledgeBaseService';
import { BusinessGuidanceService } from '../BusinessGuidanceService';
import { AdaptiveContextService } from '../AdaptiveContextService';
import { 
  PromptGenerationInput, 
  PromptGenerationOptions,
  KnowledgeItem,
  JourneyState 
} from '../types/SimplePromptTypes';
import { ChatbotConfig } from '../../../entities/ChatbotConfig';
import { ChatSession } from '../../../entities/ChatSession';
import { ChatMessage } from '../../../entities/ChatMessage';
import { BusinessRuleViolationError } from '../../../errors/ChatbotWidgetDomainErrors';

/**
 * SimplePromptService Unit Tests
 * 
 * AI INSTRUCTIONS:
 * - Test all business logic paths and edge cases
 * - Mock dependencies properly following @golden-rule patterns
 * - Test performance characteristics (sync vs async)
 * - Verify entity and vector injection functionality
 * - Test error handling with domain-specific errors
 * - Follow AAA pattern (Arrange, Act, Assert)
 */
describe('SimplePromptService', () => {
  let service: SimplePromptService;
  let mockPersonaService: PersonaGenerationService;
  let mockKnowledgeBaseService: KnowledgeBaseService;
  let mockBusinessGuidanceService: BusinessGuidanceService;
  let mockAdaptiveContextService: AdaptiveContextService;
  let mockLogger: any;

  // AI: Test fixtures following DDD patterns
  const mockChatbotConfig = {
    id: 'test-config',
    knowledgeBase: 'Test knowledge base content',
    businessContext: 'Test business context'
  } as unknown as ChatbotConfig;

  const mockSession = {
    id: 'test-session',
    contextData: { topics: ['general'] }
  } as unknown as ChatSession;

  const mockMessages = [
    { id: '1', content: 'Hello', messageType: 'user' },
    { id: '2', content: 'Hi there!', messageType: 'assistant' }
  ] as unknown as ChatMessage[];

  beforeEach(() => {
    // AI: Mock all dependencies with proper interfaces
    mockPersonaService = {
      generateContextAwarePersona: vi.fn()
    } as any;

    mockKnowledgeBaseService = {
      buildMinimalKnowledgeBase: vi.fn()
    } as any;

    mockBusinessGuidanceService = {
      generateBusinessGuidance: vi.fn()
    } as any;

    mockAdaptiveContextService = {
      // Add any required methods
    } as any;

    mockLogger = {
      logMessage: vi.fn()
    };

    // AI: Create service instance with mocked dependencies
    service = new SimplePromptService(
      mockPersonaService,
      mockKnowledgeBaseService,
      mockBusinessGuidanceService,
      mockAdaptiveContextService
    );
  });

  describe('generateSystemPrompt (async)', () => {
    it('should generate system prompt with default options', async () => {
      // Arrange
      const input: PromptGenerationInput = {
        chatbotConfig: mockChatbotConfig,
        session: mockSession,
        messageHistory: mockMessages,
        logger: mockLogger
      };

      (mockPersonaService.generateContextAwarePersona as Mock).mockReturnValue([
        { name: 'roleTitle', value: 'Sales Assistant' },
        { name: 'roleDescription', value: 'Helpful sales assistant' },
        { name: 'tone', value: 'Professional' },
        { name: 'approach', value: 'Consultative' }
      ]);

      (mockKnowledgeBaseService.buildMinimalKnowledgeBase as Mock).mockReturnValue(
        'Test knowledge base content'
      );

      (mockBusinessGuidanceService.generateBusinessGuidance as Mock).mockReturnValue(
        'Test business guidance'
      );

      // Act
      const result = await service.generateSystemPrompt(input);

      // Assert
      expect(result).toBeDefined();
      expect(result.content).toContain('Sales Assistant');
      expect(result.content).toContain('Test knowledge base content');
      expect(result.content).toContain('Test business guidance');
      expect(result.components.persona).toContain('Sales Assistant');
      expect(result.metadata.totalLength).toBeGreaterThan(0);
      expect(result.metadata.processingTimeMs).toBeGreaterThanOrEqual(0);
    });

    it('should handle entity context injection when enabled', async () => {
      // Arrange
      const input: PromptGenerationInput = {
        chatbotConfig: mockChatbotConfig,
        session: mockSession,
        messageHistory: mockMessages,
        enhancedContext: {
          entityContextPrompt: 'Customer: ACME Corp, Industry: Technology'
        }
      };

      (mockPersonaService.generateContextAwarePersona as Mock).mockReturnValue([]);
      (mockKnowledgeBaseService.buildMinimalKnowledgeBase as Mock).mockReturnValue('');
      (mockBusinessGuidanceService.generateBusinessGuidance as Mock).mockReturnValue('');

      const options = PromptGenerationOptions.default();

      // Act
      const result = await service.generateSystemPrompt(input, options);

      // Assert
      expect(result.content).toContain('Entity Context');
      expect(result.content).toContain('ACME Corp');
      expect(result.components.entityContext).toBe('Customer: ACME Corp, Industry: Technology');
      expect(result.metadata.hasEntityContext).toBe(true);
    });

    it('should handle vector search results injection when enabled', async () => {
      // Arrange
      const knowledgeItems: KnowledgeItem[] = [
        {
          id: '1',
          title: 'Product Features',
          content: 'Our product offers advanced analytics',
          relevanceScore: 0.8,
          category: 'product'
        },
        {
          id: '2',
          title: 'Pricing Info',
          content: 'Starting at $99/month',
          relevanceScore: 0.6,
          category: 'pricing'
        }
      ];

      const input: PromptGenerationInput = {
        chatbotConfig: mockChatbotConfig,
        session: mockSession,
        messageHistory: mockMessages,
        enhancedContext: {
          relevantKnowledge: knowledgeItems
        }
      };

      (mockPersonaService.generateContextAwarePersona as Mock).mockReturnValue([]);
      (mockKnowledgeBaseService.buildMinimalKnowledgeBase as Mock).mockReturnValue('');
      (mockBusinessGuidanceService.generateBusinessGuidance as Mock).mockReturnValue('');

      const options = PromptGenerationOptions.default();

      // Act
      const result = await service.generateSystemPrompt(input, options);

      // Assert
      expect(result.content).toContain('Relevant Knowledge');
      expect(result.content).toContain('Product Features');
      expect(result.content).toContain('advanced analytics');
      expect(result.components.relevantKnowledge).toContain('Product Features');
      expect(result.metadata.knowledgeItemsCount).toBe(2);
    });

    it('should filter knowledge items by relevance score', async () => {
      // Arrange
      const knowledgeItems: KnowledgeItem[] = [
        {
          id: '1',
          title: 'High Relevance',
          content: 'Very relevant content',
          relevanceScore: 0.9,
          category: 'product'
        },
        {
          id: '2',
          title: 'Low Relevance',
          content: 'Less relevant content',
          relevanceScore: 0.1,
          category: 'general'
        }
      ];

      const input: PromptGenerationInput = {
        chatbotConfig: mockChatbotConfig,
        session: mockSession,
        messageHistory: mockMessages,
        enhancedContext: {
          relevantKnowledge: knowledgeItems
        }
      };

      (mockPersonaService.generateContextAwarePersona as Mock).mockReturnValue([]);
      (mockKnowledgeBaseService.buildMinimalKnowledgeBase as Mock).mockReturnValue('');
      (mockBusinessGuidanceService.generateBusinessGuidance as Mock).mockReturnValue('');

      const options = new PromptGenerationOptions(true, true, true, 5, 0.5);

      // Act
      const result = await service.generateSystemPrompt(input, options);

      // Assert
      expect(result.content).toContain('High Relevance');
      expect(result.content).not.toContain('Low Relevance');
      expect(result.metadata.knowledgeItemsCount).toBe(1);
    });

    it('should handle journey state injection when enabled', async () => {
      // Arrange
      const mockJourneyState: JourneyState = {
        stage: 'qualification',
        confidence: 0.85,
        isSalesReady: () => true,
        getRecommendedActions: () => ['Schedule demo', 'Provide pricing']
      };

      const input: PromptGenerationInput = {
        chatbotConfig: mockChatbotConfig,
        session: mockSession,
        messageHistory: mockMessages,
        enhancedContext: {
          journeyState: mockJourneyState
        }
      };

      (mockPersonaService.generateContextAwarePersona as Mock).mockReturnValue([]);
      (mockKnowledgeBaseService.buildMinimalKnowledgeBase as Mock).mockReturnValue('');
      (mockBusinessGuidanceService.generateBusinessGuidance as Mock).mockReturnValue('');

      const options = PromptGenerationOptions.default();

      // Act
      const result = await service.generateSystemPrompt(input, options);

      // Assert
      expect(result.content).toContain('User Journey Context');
      expect(result.content).toContain('qualification');
      expect(result.content).toContain('0.85');
      expect(result.content).toContain('**Sales Ready**: Yes');
      expect(result.components.journeyContext).toContain('qualification');
      expect(result.metadata.hasJourneyContext).toBe(true);
    });

    it('should use minimal options correctly', async () => {
      // Arrange
      const input: PromptGenerationInput = {
        chatbotConfig: mockChatbotConfig,
        session: mockSession,
        messageHistory: mockMessages,
        enhancedContext: {
          entityContextPrompt: 'Should be ignored',
          relevantKnowledge: [{ id: '1', title: 'Test', content: 'Test', relevanceScore: 0.9 }]
        }
      };

      (mockPersonaService.generateContextAwarePersona as Mock).mockReturnValue([]);
      (mockKnowledgeBaseService.buildMinimalKnowledgeBase as Mock).mockReturnValue('');
      (mockBusinessGuidanceService.generateBusinessGuidance as Mock).mockReturnValue('');

      const options = PromptGenerationOptions.minimal();

      // Act
      const result = await service.generateSystemPrompt(input, options);

      // Assert
      expect(result.content).not.toContain('Entity Context');
      expect(result.content).not.toContain('Relevant Knowledge');
      expect(result.content).not.toContain('User Journey Context');
      expect(result.metadata.hasEntityContext).toBe(false);
      expect(result.metadata.hasJourneyContext).toBe(false);
      expect(result.metadata.knowledgeItemsCount).toBe(0);
    });

    it('should log generation process when logger provided', async () => {
      // Arrange
      const input: PromptGenerationInput = {
        chatbotConfig: mockChatbotConfig,
        session: mockSession,
        messageHistory: mockMessages,
        logger: mockLogger
      };

      (mockPersonaService.generateContextAwarePersona as Mock).mockReturnValue([]);
      (mockKnowledgeBaseService.buildMinimalKnowledgeBase as Mock).mockReturnValue('');
      (mockBusinessGuidanceService.generateBusinessGuidance as Mock).mockReturnValue('');

      // Act
      await service.generateSystemPrompt(input);

      // Assert
      expect(mockLogger.logMessage).toHaveBeenCalledWith(
        expect.stringContaining('Starting simple prompt generation')
      );
      expect(mockLogger.logMessage).toHaveBeenCalledWith(
        expect.stringContaining('Simple prompt generated in')
      );
    });
  });

  describe('generateSystemPromptSync', () => {
    it('should generate system prompt synchronously', () => {
      // Arrange
      const input: PromptGenerationInput = {
        chatbotConfig: mockChatbotConfig,
        session: mockSession,
        messageHistory: mockMessages
      };

      (mockPersonaService.generateContextAwarePersona as Mock).mockReturnValue([]);
      (mockKnowledgeBaseService.buildMinimalKnowledgeBase as Mock).mockReturnValue('Test KB');
      (mockBusinessGuidanceService.generateBusinessGuidance as Mock).mockReturnValue('Test BG');

      // Act
      const result = service.generateSystemPromptSync(input);

      // Assert
      expect(result).toBeDefined();
      expect(result.content).toContain('Test KB');
      expect(result.content).toContain('Test BG');
      expect(result.metadata.processingTimeMs).toBeGreaterThanOrEqual(0);
    });

    it('should handle empty message history', () => {
      // Arrange
      const input: PromptGenerationInput = {
        chatbotConfig: mockChatbotConfig,
        session: mockSession,
        messageHistory: []
      };

      (mockPersonaService.generateContextAwarePersona as Mock).mockReturnValue([]);
      (mockKnowledgeBaseService.buildMinimalKnowledgeBase as Mock).mockReturnValue('');
      (mockBusinessGuidanceService.generateBusinessGuidance as Mock).mockReturnValue('');

      // Act
      const result = service.generateSystemPromptSync(input);

      // Assert
      expect(result.content).toContain('start of a new conversation');
      expect(result.components.conversationContext).toContain('start of a new conversation');
    });
  });

  describe('Input Validation', () => {
    it('should throw BusinessRuleViolationError for missing chatbotConfig', async () => {
      // Arrange
      const input: PromptGenerationInput = {
        chatbotConfig: null as any,
        session: mockSession,
        messageHistory: mockMessages
      };

      // Act & Assert
      await expect(service.generateSystemPrompt(input)).rejects.toThrow(BusinessRuleViolationError);
      await expect(service.generateSystemPrompt(input)).rejects.toThrow(
        'ChatbotConfig is required for prompt generation'
      );
    });

    it('should throw BusinessRuleViolationError for missing session', async () => {
      // Arrange
      const input: PromptGenerationInput = {
        chatbotConfig: mockChatbotConfig,
        session: null as any,
        messageHistory: mockMessages
      };

      // Act & Assert
      await expect(service.generateSystemPrompt(input)).rejects.toThrow(BusinessRuleViolationError);
      await expect(service.generateSystemPrompt(input)).rejects.toThrow(
        'ChatSession is required for prompt generation'
      );
    });

    it('should throw BusinessRuleViolationError for missing messageHistory', async () => {
      // Arrange
      const input: PromptGenerationInput = {
        chatbotConfig: mockChatbotConfig,
        session: mockSession,
        messageHistory: null as any
      };

      // Act & Assert
      await expect(service.generateSystemPrompt(input)).rejects.toThrow(BusinessRuleViolationError);
      await expect(service.generateSystemPrompt(input)).rejects.toThrow(
        'Message history is required for prompt generation'
      );
    });
  });

  describe('PromptGenerationOptions', () => {
    it('should create default options correctly', () => {
      // Act
      const options = PromptGenerationOptions.default();

      // Assert
      expect(options.includeEntityContext).toBe(true);
      expect(options.includeVectorSearch).toBe(true);
      expect(options.includeJourneyState).toBe(true);
      expect(options.maxKnowledgeItems).toBe(5);
      expect(options.minRelevanceScore).toBe(0.15);
    });

    it('should create minimal options correctly', () => {
      // Act
      const options = PromptGenerationOptions.minimal();

      // Assert
      expect(options.includeEntityContext).toBe(false);
      expect(options.includeVectorSearch).toBe(false);
      expect(options.includeJourneyState).toBe(false);
      expect(options.maxKnowledgeItems).toBe(0);
      expect(options.minRelevanceScore).toBe(0.5);
    });

    it('should create knowledgeOnly options correctly', () => {
      // Act
      const options = PromptGenerationOptions.knowledgeOnly();

      // Assert
      expect(options.includeEntityContext).toBe(false);
      expect(options.includeVectorSearch).toBe(true);
      expect(options.includeJourneyState).toBe(false);
      expect(options.maxKnowledgeItems).toBe(3);
      expect(options.minRelevanceScore).toBe(0.2);
    });

    it('should validate maxKnowledgeItems range', () => {
      // Act & Assert
      expect(() => new PromptGenerationOptions(true, true, true, -1, 0.5)).toThrow(
        'maxKnowledgeItems must be between 0 and 20'
      );
      expect(() => new PromptGenerationOptions(true, true, true, 21, 0.5)).toThrow(
        'maxKnowledgeItems must be between 0 and 20'
      );
    });

    it('should validate minRelevanceScore range', () => {
      // Act & Assert
      expect(() => new PromptGenerationOptions(true, true, true, 5, -0.1)).toThrow(
        'minRelevanceScore must be between 0 and 1'
      );
      expect(() => new PromptGenerationOptions(true, true, true, 5, 1.1)).toThrow(
        'minRelevanceScore must be between 0 and 1'
      );
    });
  });

  describe('Performance Characteristics', () => {
    it('should complete generation in under 50ms for typical input', async () => {
      // Arrange
      const input: PromptGenerationInput = {
        chatbotConfig: mockChatbotConfig,
        session: mockSession,
        messageHistory: mockMessages
      };

      (mockPersonaService.generateContextAwarePersona as Mock).mockReturnValue([]);
      (mockKnowledgeBaseService.buildMinimalKnowledgeBase as Mock).mockReturnValue('Test content');
      (mockBusinessGuidanceService.generateBusinessGuidance as Mock).mockReturnValue('Test guidance');

      // Act
      const startTime = Date.now();
      const result = await service.generateSystemPrompt(input);
      const endTime = Date.now();

      // Assert
      expect(endTime - startTime).toBeLessThan(50);
      expect(result.metadata.processingTimeMs).toBeLessThan(50);
    });

    it('should have consistent performance between sync and async versions', async () => {
      // Arrange
      const input: PromptGenerationInput = {
        chatbotConfig: mockChatbotConfig,
        session: mockSession,
        messageHistory: mockMessages
      };

      (mockPersonaService.generateContextAwarePersona as Mock).mockReturnValue([]);
      (mockKnowledgeBaseService.buildMinimalKnowledgeBase as Mock).mockReturnValue('Test');
      (mockBusinessGuidanceService.generateBusinessGuidance as Mock).mockReturnValue('Test');

      // Act
      const asyncResult = await service.generateSystemPrompt(input);
      const syncResult = service.generateSystemPromptSync(input);

      // Assert
      expect(asyncResult.content).toBe(syncResult.content);
      expect(Math.abs(asyncResult.metadata.processingTimeMs - syncResult.metadata.processingTimeMs))
        .toBeLessThan(10);
    });
  });
}); 