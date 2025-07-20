import { describe, it, expect, beforeEach } from 'vitest';
import { SimplePromptService } from '../SimplePromptService';
import { PersonaGenerationService } from '../PersonaGenerationService';
import { KnowledgeBaseService } from '../KnowledgeBaseService';
import { BusinessGuidanceService } from '../BusinessGuidanceService';
import { AdaptiveContextService } from '../AdaptiveContextService';
import { PromptGenerationInput, PromptGenerationOptions } from '../types/SimplePromptTypes';
import { KnowledgeBase } from '../../../value-objects/ai-configuration/KnowledgeBase';

/**
 * Integration Test for SimplePromptService Performance
 *
 * AI INSTRUCTIONS:
 * - Test complete integration with real domain services
 * - Verify performance characteristics
 * - Ensure all functionality works end-to-end
 */

describe('SimplePromptService Integration Tests', () => {
  let simplePromptService: SimplePromptService;

  // Helper function to create a proper KnowledgeBase instance
  const createTestKnowledgeBase = (companyInfo: string): KnowledgeBase => {
    return KnowledgeBase.create({
      companyInfo,
      productCatalog: 'Test products and services',
      supportDocs: 'Test documentation',
      complianceGuidelines: 'Test guidelines',
      faqs: [
        {
          id: 'test-faq-1',
          question: 'What do you do?',
          answer: 'We provide test services',
          category: 'general',
          isActive: true
        }
      ],
      websiteSources: []
    });
  };

  beforeEach(() => {
    // Create real domain services for integration testing
    const personaService = new PersonaGenerationService();
    const knowledgeService = new KnowledgeBaseService();
    const businessGuidanceService = new BusinessGuidanceService();
    const adaptiveContextService = new AdaptiveContextService();

    simplePromptService = new SimplePromptService(
      personaService,
      knowledgeService,
      businessGuidanceService,
      adaptiveContextService
    );
  });

  describe('Performance Verification', () => {
    it('should generate prompts consistently under 50ms', () => {
             // Mock input data
       const mockInput: PromptGenerationInput = {
         chatbotConfig: {
           id: 'test-config',
           businessContext: 'Software development company',
           knowledgeBase: createTestKnowledgeBase('We provide custom software solutions'),
           personalitySettings: {
             tone: 'Professional',
             approach: 'Consultative',
             style: 'Helpful'
           }
         } as any,
        session: {
          id: 'test-session',
          contextData: { topics: ['software'] }
        } as any,
        messageHistory: [
          { content: 'Hello', role: 'user' },
          { content: 'Hi there!', role: 'assistant' }
        ] as any[]
      };

      const durations: number[] = [];
      const iterations = 10;

      // Run multiple iterations to test consistency
      for (let i = 0; i < iterations; i++) {
        const startTime = performance.now();

        const result = simplePromptService.generateSystemPromptSync(
          mockInput,
          PromptGenerationOptions.default()
        );

        const endTime = performance.now();
        const duration = endTime - startTime;

        durations.push(duration);

        // Verify result structure
        expect(result).toBeDefined();
        expect(result.content).toBeDefined();
        expect(result.content.length).toBeGreaterThan(100);
        expect(result.metadata.processingTimeMs).toBeLessThan(50);
      }

      // Verify performance characteristics
      const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
      const maxDuration = Math.max(...durations);

      expect(avgDuration).toBeLessThan(50);
      expect(maxDuration).toBeLessThan(100);
    });

    it('should maintain consistent memory usage', () => {
             const mockInput: PromptGenerationInput = {
         chatbotConfig: {
           id: 'test-config',
           businessContext: 'Software development company',
           knowledgeBase: createTestKnowledgeBase('We provide custom software solutions'),
           personalitySettings: {
             tone: 'Professional',
             approach: 'Consultative',
             style: 'Helpful'
           }
         } as any,
        session: {
          id: 'test-session',
          contextData: { topics: ['software'] }
        } as any,
        messageHistory: [
          { content: 'Hello', role: 'user' }
        ] as any[]
      };

      const initialMemory = process.memoryUsage().heapUsed;

      // Generate many prompts
      for (let i = 0; i < 100; i++) {
        simplePromptService.generateSystemPromptSync(
          mockInput,
          PromptGenerationOptions.minimal()
        );
      }

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;

      // Memory increase should be minimal
      expect(memoryIncrease).toBeLessThan(5 * 1024 * 1024); // Less than 5MB
    });
  });

  describe('Functionality Verification', () => {
    it('should generate complete system prompts with all sections', () => {
             const mockInput: PromptGenerationInput = {
         chatbotConfig: {
           id: 'test-config',
           businessContext: 'E-commerce platform',
           knowledgeBase: createTestKnowledgeBase('We sell premium products online'),
           personalitySettings: {
             tone: 'Professional',
             approach: 'Consultative',
             style: 'Helpful'
           }
         } as any,
        session: {
          id: 'test-session',
          contextData: {
            topics: ['products', 'pricing'],
            entities: ['React', 'JavaScript']
          }
        } as any,
        messageHistory: [
          { content: 'Tell me about your products', role: 'user' },
          { content: 'We offer premium solutions', role: 'assistant' }
        ] as any[]
      };

      const result = simplePromptService.generateSystemPromptSync(
        mockInput,
        PromptGenerationOptions.default()
      );

             // Verify content structure based on actual prompt sections
       expect(result.content).toContain('Role & Persona');
       expect(result.content).toContain('Core Business Context'); // Actual section name in prompt
       expect(result.content).toContain('Conversation Management'); // Actual section name
       expect(result.content).toContain('Conversation Context');

             // Verify business context inclusion
       expect(result.content).toContain('We sell premium products online'); // Our test knowledge base content
       expect(result.content.length).toBeGreaterThan(200);

             // Verify metadata exists
       expect(result.metadata).toBeDefined();
       expect(result.metadata.totalLength).toBeGreaterThanOrEqual(0);
       expect(result.metadata.estimatedTokens).toBeGreaterThanOrEqual(0);
       expect(result.metadata.processingTimeMs).toBeGreaterThanOrEqual(0);
    });

    it('should handle different option configurations', () => {
             const mockInput: PromptGenerationInput = {
         chatbotConfig: {
           id: 'test-config',
           businessContext: 'Consulting firm',
           knowledgeBase: createTestKnowledgeBase('We provide business consulting'),
           personalitySettings: {
             tone: 'Professional',
             approach: 'Consultative',
             style: 'Helpful'
           }
         } as any,
        session: {
          id: 'test-session'
        } as any,
        messageHistory: [] as any[]
      };

      // Test minimal options
      const minimalResult = simplePromptService.generateSystemPromptSync(
        mockInput,
        PromptGenerationOptions.minimal()
      );

      // Test knowledge-only options
      const knowledgeResult = simplePromptService.generateSystemPromptSync(
        mockInput,
        PromptGenerationOptions.knowledgeOnly()
      );

      // Test default options
      const defaultResult = simplePromptService.generateSystemPromptSync(
        mockInput,
        PromptGenerationOptions.default()
      );

      // All should be valid but different lengths
      expect(minimalResult.content.length).toBeGreaterThan(0);
      expect(knowledgeResult.content.length).toBeGreaterThan(0);
      expect(defaultResult.content.length).toBeGreaterThan(0);

      // Default should typically be longest
      expect(defaultResult.content.length).toBeGreaterThanOrEqual(minimalResult.content.length);
    });
  });

  describe('Error Handling Integration', () => {
         it('should handle invalid input gracefully', () => {
       expect(() => {
         simplePromptService.generateSystemPromptSync(
           null as any,
           PromptGenerationOptions.default()
         );
       }).toThrow(); // Just expect any error for null input
     });

    it('should handle missing required fields', () => {
      const invalidInput: PromptGenerationInput = {
        chatbotConfig: null as any,
        session: { id: 'test' } as any,
        messageHistory: []
      };

      expect(() => {
        simplePromptService.generateSystemPromptSync(
          invalidInput,
          PromptGenerationOptions.default()
        );
      }).toThrow('ChatbotConfig is required');
    });
  });
});
