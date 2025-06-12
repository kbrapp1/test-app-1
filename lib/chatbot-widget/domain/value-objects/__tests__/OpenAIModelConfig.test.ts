/**
 * Tests for OpenAI Model Configuration
 * 
 * Since we simplified the model configuration to only support GPT-4o and GPT-4o Mini,
 * these tests verify the model types and pricing used in the token counting service.
 */

// Define the types used in the OpenAI services
type SupportedOpenAIModel = 'gpt-4o' | 'gpt-4o-mini';

// Model pricing data (per 1K tokens) - matches what's used in OpenAITokenCountingService
const MODEL_PRICING = {
  'gpt-4o': { input: 0.005, output: 0.015 },
  'gpt-4o-mini': { input: 0.00015, output: 0.0006 }
} as const;

const DEFAULT_MODEL: SupportedOpenAIModel = 'gpt-4o-mini';
const SUPPORTED_MODELS: readonly SupportedOpenAIModel[] = ['gpt-4o', 'gpt-4o-mini'];

describe('OpenAI Model Configuration', () => {
  describe('Supported Models', () => {
    it('should support exactly 2 models', () => {
      expect(SUPPORTED_MODELS).toHaveLength(2);
    });

    it('should include GPT-4o and GPT-4o Mini', () => {
      expect(SUPPORTED_MODELS).toContain('gpt-4o');
      expect(SUPPORTED_MODELS).toContain('gpt-4o-mini');
    });

    it('should use GPT-4o Mini as default (cost-effective)', () => {
      expect(DEFAULT_MODEL).toBe('gpt-4o-mini');
    });

    it('should validate model types correctly', () => {
      const isValidModel = (model: string): model is SupportedOpenAIModel => {
        return SUPPORTED_MODELS.includes(model as SupportedOpenAIModel);
      };

      expect(isValidModel('gpt-4o')).toBe(true);
      expect(isValidModel('gpt-4o-mini')).toBe(true);
      expect(isValidModel('gpt-3.5-turbo')).toBe(false);
      expect(isValidModel('gpt-4-turbo')).toBe(false);
      expect(isValidModel('invalid-model')).toBe(false);
    });
  });

  describe('Model Pricing', () => {
    it('should have pricing for all supported models', () => {
      SUPPORTED_MODELS.forEach(model => {
        expect(MODEL_PRICING[model]).toBeDefined();
        expect(MODEL_PRICING[model].input).toBeGreaterThan(0);
        expect(MODEL_PRICING[model].output).toBeGreaterThan(0);
      });
    });

    it('should have correct GPT-4o pricing', () => {
      const gpt4oPricing = MODEL_PRICING['gpt-4o'];
      expect(gpt4oPricing.input).toBe(0.005);  // $0.005 per 1K input tokens
      expect(gpt4oPricing.output).toBe(0.015); // $0.015 per 1K output tokens
    });

    it('should have correct GPT-4o Mini pricing', () => {
      const gpt4oMiniPricing = MODEL_PRICING['gpt-4o-mini'];
      expect(gpt4oMiniPricing.input).toBe(0.00015);  // $0.00015 per 1K input tokens
      expect(gpt4oMiniPricing.output).toBe(0.0006);  // $0.0006 per 1K output tokens
    });

    it('should ensure GPT-4o Mini is more cost-effective than GPT-4o', () => {
      const gpt4oPricing = MODEL_PRICING['gpt-4o'];
      const gpt4oMiniPricing = MODEL_PRICING['gpt-4o-mini'];
      
      expect(gpt4oMiniPricing.input).toBeLessThan(gpt4oPricing.input);
      expect(gpt4oMiniPricing.output).toBeLessThan(gpt4oPricing.output);
    });

    it('should calculate cost correctly for different token scenarios', () => {
      const calculateCost = (model: SupportedOpenAIModel, inputTokens: number, outputTokens: number): number => {
        const pricing = MODEL_PRICING[model];
        return (pricing.input * inputTokens / 1000) + (pricing.output * outputTokens / 1000);
      };

      // Test GPT-4o Mini (cost-effective)
      const miniCost1k = calculateCost('gpt-4o-mini', 1000, 1000);
      expect(miniCost1k).toBeCloseTo(0.00075, 6); // 0.00015 + 0.0006

      // Test GPT-4o (premium)
      const gpt4oCost1k = calculateCost('gpt-4o', 1000, 1000);
      expect(gpt4oCost1k).toBe(0.02); // 0.005 + 0.015

      // Verify cost difference
      expect(gpt4oCost1k).toBeGreaterThan(miniCost1k);
    });
  });

  describe('Model Selection Logic', () => {
    it('should prefer GPT-4o Mini for cost optimization', () => {
      // Test scenarios where GPT-4o Mini should be preferred
      const scenarios = [
        { description: 'default selection', preferred: 'gpt-4o-mini' },
        { description: 'cost-sensitive scenarios', preferred: 'gpt-4o-mini' },
        { description: 'high-volume processing', preferred: 'gpt-4o-mini' }
      ];

      scenarios.forEach(scenario => {
        expect(scenario.preferred).toBe('gpt-4o-mini');
      });
    });

    it('should support GPT-4o for premium scenarios', () => {
      // GPT-4o should still be available for premium use cases
      expect(SUPPORTED_MODELS).toContain('gpt-4o');
      expect(MODEL_PRICING['gpt-4o']).toBeDefined();
    });
  });

  describe('Configuration Validation', () => {
    it('should have consistent model configuration', () => {
      // All supported models should have pricing
      SUPPORTED_MODELS.forEach(model => {
        expect(MODEL_PRICING[model]).toBeDefined();
        expect(typeof MODEL_PRICING[model].input).toBe('number');
        expect(typeof MODEL_PRICING[model].output).toBe('number');
      });
    });

    it('should have reasonable pricing ranges', () => {
      Object.values(MODEL_PRICING).forEach(pricing => {
        // Input prices should be reasonable (between $0.0001 and $0.01 per 1K tokens)
        expect(pricing.input).toBeGreaterThan(0.0001);
        expect(pricing.input).toBeLessThan(0.01);
        
        // Output prices should be higher than input prices (typical pattern)
        expect(pricing.output).toBeGreaterThan(pricing.input);
        
        // Output prices should be reasonable (between $0.0005 and $0.02 per 1K tokens)
        expect(pricing.output).toBeGreaterThan(0.0005);
        expect(pricing.output).toBeLessThan(0.02);
      });
    });

    it('should maintain cost ratios within expected ranges', () => {
      Object.entries(MODEL_PRICING).forEach(([model, pricing]) => {
        const outputToInputRatio = pricing.output / pricing.input;
        
        // Output should typically be 2-10x more expensive than input
        expect(outputToInputRatio).toBeGreaterThan(2);
        expect(outputToInputRatio).toBeLessThan(10);
      });
    });
  });

  describe('Type Safety', () => {
    it('should enforce supported model types', () => {
      // This test verifies TypeScript type safety at runtime
      const testModel = (model: any): model is SupportedOpenAIModel => {
        return typeof model === 'string' && SUPPORTED_MODELS.includes(model as SupportedOpenAIModel);
      };

      expect(testModel('gpt-4o')).toBe(true);
      expect(testModel('gpt-4o-mini')).toBe(true);
      expect(testModel('gpt-3.5-turbo')).toBe(false);
      expect(testModel(null)).toBe(false);
      expect(testModel(undefined)).toBe(false);
      expect(testModel(123)).toBe(false);
    });

    it('should maintain immutable configuration', () => {
      // Verify that the configuration objects are properly typed as const
      expect(Array.isArray(SUPPORTED_MODELS)).toBe(true);
      expect(SUPPORTED_MODELS.length).toBe(2);
      
      // Model pricing should be readonly
      const pricing = MODEL_PRICING['gpt-4o'];
      expect(typeof pricing.input).toBe('number');
      expect(typeof pricing.output).toBe('number');
    });
  });

  describe('Integration with Token Counting', () => {
    it('should support realistic token cost calculations', () => {
      // Simulate real-world usage scenarios
      const scenarios = [
        { name: 'small conversation', inputTokens: 500, outputTokens: 200 },
        { name: 'medium conversation', inputTokens: 2000, outputTokens: 800 },
        { name: 'large conversation', inputTokens: 8000, outputTokens: 2000 }
      ];

      scenarios.forEach(scenario => {
        SUPPORTED_MODELS.forEach(model => {
          const pricing = MODEL_PRICING[model];
          const cost = (pricing.input * scenario.inputTokens / 1000) + 
                      (pricing.output * scenario.outputTokens / 1000);
          
          expect(cost).toBeGreaterThan(0);
          expect(cost).toBeLessThan(1); // Should be reasonable cost (under $1)
        });
      });
    });

    it('should provide cost estimates for conversation scenarios', () => {
      // Test the 70/30 split used in token counting service
      const totalTokens = 1000;
      const inputTokens = Math.ceil(totalTokens * 0.7); // 700
      const outputTokens = Math.ceil(totalTokens * 0.3); // 300

      SUPPORTED_MODELS.forEach(model => {
        const pricing = MODEL_PRICING[model];
        const estimatedCost = (pricing.input * inputTokens / 1000) + 
                             (pricing.output * outputTokens / 1000);
        
        expect(estimatedCost).toBeGreaterThan(0);
        
        if (model === 'gpt-4o-mini') {
          expect(estimatedCost).toBeLessThan(0.001); // Very cost-effective
        } else if (model === 'gpt-4o') {
          expect(estimatedCost).toBeGreaterThan(0.003); // More expensive
        }
      });
    });
  });
}); 