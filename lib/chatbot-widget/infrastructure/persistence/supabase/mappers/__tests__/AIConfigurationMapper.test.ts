/**
 * AIConfigurationMapper Tests
 * 
 * Critical infrastructure tests for AI configuration JSONB mapping
 * Tests data transformation, validation, and error handling
 */

import { describe, it, expect } from 'vitest';
import { AIConfigurationMapper } from '../AIConfigurationMapper';
import { AIConfiguration } from '../../../../../domain/value-objects/ai-configuration/AIConfiguration';

describe('AIConfigurationMapper', () => {
  describe('fromJsonb', () => {
    it('should map complete JSONB data to AIConfiguration correctly', () => {
      const jsonbData = {
        openaiModel: 'gpt-4o',
        openaiTemperature: 0.5,
        openaiMaxTokens: 2000,
        contextMaxTokens: 16000,
        contextSystemPromptTokens: 800,
        contextResponseReservedTokens: 4000,
        contextSummaryTokens: 300,
        intentConfidenceThreshold: 0.8,
        intentAmbiguityThreshold: 0.15,
        enableMultiIntentDetection: true,
        enablePersonaInference: true,
        enableAdvancedEntities: true,
        entityExtractionMode: 'comprehensive',
        customEntityTypes: ['product_name', 'technical_specification'],
        maxConversationTurns: 25,
        inactivityTimeoutSeconds: 600,
        enableJourneyRegression: true,
        enableContextSwitchDetection: true,
        enableAdvancedScoring: true,
        entityCompletenessWeight: 0.4,
        personaConfidenceWeight: 0.3,
        journeyProgressionWeight: 0.3,
        enablePerformanceLogging: true,
        enableIntentAnalytics: true,
        enablePersonaAnalytics: true,
        responseTimeThresholdMs: 1500
      };

      const config = AIConfigurationMapper.fromJsonb(jsonbData);

      expect(config.openaiTemperature).toBe(0.5);
      expect(config.openaiMaxTokens).toBe(2000);
      expect(config.contextMaxTokens).toBe(16000);
      expect(config.intentConfidenceThreshold).toBe(0.8);
      expect(config.enableAdvancedScoring).toBe(true);
    });

    it('should use defaults for missing properties', () => {
      const partialJsonbData = {
        openaiModel: 'gpt-4o',
        openaiTemperature: 0.7
        // Missing most properties
      };

      const config = AIConfigurationMapper.fromJsonb(partialJsonbData);

      // Should use defaults for missing properties
      expect(config.openaiMaxTokens).toBe(1000); // Default
      expect(config.contextMaxTokens).toBe(12000); // Default
      expect(config.intentConfidenceThreshold).toBe(0.7); // Default
      expect(config.enableAdvancedScoring).toBe(true); // Default
    });

    it('should handle null/undefined JSONB data', () => {
      const nullConfig = AIConfigurationMapper.fromJsonb(null);
      const undefinedConfig = AIConfigurationMapper.fromJsonb(undefined);

      // Both should return default configurations
      expect(nullConfig.openaiTemperature).toBe(0.3); // Default
      expect(undefinedConfig.openaiTemperature).toBe(0.3); // Default
      
      expect(nullConfig.contextMaxTokens).toBe(12000); // Default
      expect(undefinedConfig.contextMaxTokens).toBe(12000); // Default
    });

    it('should handle empty object JSONB data', () => {
      const config = AIConfigurationMapper.fromJsonb({});

      // Should use all defaults
      expect(config.openaiTemperature).toBe(0.3);
      expect(config.openaiMaxTokens).toBe(1000);
      expect(config.contextMaxTokens).toBe(12000);
      expect(config.intentConfidenceThreshold).toBe(0.7);
      expect(config.enableAdvancedScoring).toBe(true);
    });

    it('should handle OpenAI model variants correctly', () => {
      const modelVariants = ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo'] as const;

      modelVariants.forEach(model => {
        const jsonbData = { openaiModel: model };
        const config = AIConfigurationMapper.fromJsonb(jsonbData);
        
        // Should preserve the model type through the configuration system
        expect(config.toPlainObject().openaiModel).toBe(model);
      });
    });

    it('should handle invalid OpenAI model with fallback', () => {
      const jsonbData = { openaiModel: 'invalid-model' };
      const config = AIConfigurationMapper.fromJsonb(jsonbData);

      // Should fallback to default
      expect(config.toPlainObject().openaiModel).toBe('gpt-4o-mini');
    });

    it('should handle entity extraction mode variants', () => {
      const extractionModes = ['basic', 'comprehensive', 'custom'] as const;

      extractionModes.forEach(mode => {
        const jsonbData = { entityExtractionMode: mode };
        const config = AIConfigurationMapper.fromJsonb(jsonbData);
        
        expect(config.toPlainObject().entityExtractionMode).toBe(mode);
      });
    });

    it('should handle invalid entity extraction mode with fallback', () => {
      const jsonbData = { entityExtractionMode: 'invalid-mode' };
      const config = AIConfigurationMapper.fromJsonb(jsonbData);

      // Should fallback to default
      expect(config.toPlainObject().entityExtractionMode).toBe('comprehensive');
    });

    it('should handle boolean values correctly', () => {
      const booleanTestCases = [
        { enableMultiIntentDetection: false, expected: false },
        { enablePersonaInference: false, expected: false },
        { enableAdvancedEntities: false, expected: false },
        { enableJourneyRegression: false, expected: false },
        { enableContextSwitchDetection: false, expected: false },
        { enableAdvancedScoring: false, expected: false },
        { enablePerformanceLogging: false, expected: false },
        { enableIntentAnalytics: false, expected: false },
        { enablePersonaAnalytics: false, expected: false }
      ];

      booleanTestCases.forEach(testCase => {
        const config = AIConfigurationMapper.fromJsonb(testCase);
        const plainObject = config.toPlainObject();
        const [key, expectedValue] = Object.entries(testCase)[0];
        
        expect(plainObject[key as keyof typeof plainObject]).toBe(expectedValue);
      });
    });

    it('should handle custom entity types array correctly', () => {
      const customEntityTypes = ['product_id', 'customer_segment', 'pricing_tier', 'feature_request'];
      const jsonbData = { customEntityTypes };
      
      const config = AIConfigurationMapper.fromJsonb(jsonbData);

      expect(config.toPlainObject().customEntityTypes).toEqual(customEntityTypes);
    });

    it('should handle empty custom entity types array', () => {
      const jsonbData = { customEntityTypes: [] };
      const config = AIConfigurationMapper.fromJsonb(jsonbData);

      expect(config.toPlainObject().customEntityTypes).toEqual([]);
    });

    it('should handle invalid custom entity types with fallback', () => {
      const jsonbData = { customEntityTypes: 'not-an-array' };
      const config = AIConfigurationMapper.fromJsonb(jsonbData);

      // Should fallback to default empty array
      expect(config.toPlainObject().customEntityTypes).toEqual([]);
    });

    it('should handle valid numeric values correctly', () => {
      const validTestCases = [
        { openaiTemperature: 0.0, expected: 0.0 },
        { openaiTemperature: 1.0, expected: 1.0 },
        { openaiMaxTokens: 1, expected: 1 },
        { openaiMaxTokens: 1500, expected: 1500 },
        { contextMaxTokens: 50000, expected: 50000 },
        { maxConversationTurns: 1, expected: 1 },
        { maxConversationTurns: 50, expected: 50 },
        { responseTimeThresholdMs: 1000, expected: 1000 }
      ];

      validTestCases.forEach(testCase => {
        const config = AIConfigurationMapper.fromJsonb(testCase);
        const plainObject = config.toPlainObject();
        const [key, expectedValue] = Object.entries(testCase)[0];
        
        expect(plainObject[key as keyof typeof plainObject]).toBe(expectedValue);
      });
    });

    it('should handle intent threshold values with domain constraints', () => {
      // Test valid combinations that respect domain constraint: confidence > ambiguity
      const intentTestCases = [
        {
          data: { intentConfidenceThreshold: 0.8, intentAmbiguityThreshold: 0.3 },
          expectedConfidence: 0.8,
          expectedAmbiguity: 0.3
        },
        {
          data: { intentConfidenceThreshold: 0.5, intentAmbiguityThreshold: 0.1 },
          expectedConfidence: 0.5,
          expectedAmbiguity: 0.1
        },
        {
          data: { intentConfidenceThreshold: 0.9, intentAmbiguityThreshold: 0.4 },
          expectedConfidence: 0.9,
          expectedAmbiguity: 0.4
        }
      ];

      intentTestCases.forEach(testCase => {
        const config = AIConfigurationMapper.fromJsonb(testCase.data);
        const plainObject = config.toPlainObject();
        
        expect(plainObject.intentConfidenceThreshold).toBe(testCase.expectedConfidence);
        expect(plainObject.intentAmbiguityThreshold).toBe(testCase.expectedAmbiguity);
      });
    });

    it('should handle single intent threshold values by adjusting the other', () => {
      // When testing single values, mapper should adjust the other to maintain domain constraint
      const singleValueTests = [
        {
          input: { intentConfidenceThreshold: 0.8 },
          expectedConfidence: 0.8,
          // Mapper should set ambiguity to satisfy constraint (confidence > ambiguity)
          expectedAmbiguityRange: { min: 0, max: 0.7 }
        },
        {
          input: { intentAmbiguityThreshold: 0.3 },
          // Mapper should set confidence to satisfy constraint (confidence > ambiguity)
          expectedConfidenceRange: { min: 0.4, max: 1.0 },
          expectedAmbiguity: 0.3
        }
      ];

      singleValueTests.forEach(testCase => {
        const config = AIConfigurationMapper.fromJsonb(testCase.input);
        const plainObject = config.toPlainObject();
        
        if ('expectedConfidence' in testCase) {
          expect(plainObject.intentConfidenceThreshold).toBe(testCase.expectedConfidence);
          expect(plainObject.intentAmbiguityThreshold).toBeGreaterThanOrEqual(testCase.expectedAmbiguityRange!.min);
          expect(plainObject.intentAmbiguityThreshold).toBeLessThanOrEqual(testCase.expectedAmbiguityRange!.max);
        }
        
        if ('expectedAmbiguity' in testCase) {
          expect(plainObject.intentAmbiguityThreshold).toBe(testCase.expectedAmbiguity);
          expect(plainObject.intentConfidenceThreshold).toBeGreaterThanOrEqual(testCase.expectedConfidenceRange!.min);
          expect(plainObject.intentConfidenceThreshold).toBeLessThanOrEqual(testCase.expectedConfidenceRange!.max);
        }
        
        // Always verify domain constraint is satisfied
        expect(plainObject.intentConfidenceThreshold).toBeGreaterThan(plainObject.intentAmbiguityThreshold);
      });
    });

    it('should handle invalid numeric values with fallbacks', () => {
      const invalidNumericData = {
        openaiTemperature: 'invalid',
        openaiMaxTokens: null,
        contextMaxTokens: undefined,
        intentConfidenceThreshold: NaN,
        maxConversationTurns: 'string'
      };

      const config = AIConfigurationMapper.fromJsonb(invalidNumericData);

      // Should use defaults for invalid numeric values
      expect(config.openaiTemperature).toBe(0.3);
      expect(config.openaiMaxTokens).toBe(1000);
      expect(config.contextMaxTokens).toBe(12000);
      expect(config.intentConfidenceThreshold).toBe(0.7);
      expect(config.toPlainObject().maxConversationTurns).toBe(20);
    });

    it('should handle weight configuration values correctly', () => {
      const weightData = {
        entityCompletenessWeight: 0.5,
        personaConfidenceWeight: 0.3,
        journeyProgressionWeight: 0.2
      };

      const config = AIConfigurationMapper.fromJsonb(weightData);

      expect(config.toPlainObject().entityCompletenessWeight).toBe(0.5);
      expect(config.toPlainObject().personaConfidenceWeight).toBe(0.3);
      expect(config.toPlainObject().journeyProgressionWeight).toBe(0.2);
    });

    it('should preserve complex JSONB structure integrity', () => {
      const complexData = {
        openaiModel: 'gpt-4o',
        openaiTemperature: 0.4,
        enableMultiIntentDetection: true,
        entityExtractionMode: 'custom',
        customEntityTypes: ['lead_intent', 'budget_range'],
        enableAdvancedScoring: true,
        entityCompletenessWeight: 0.35,
        enablePerformanceLogging: false
      };

      const config = AIConfigurationMapper.fromJsonb(complexData);
      const reconstructed = config.toPlainObject();

      // Verify all explicitly set values are preserved
      expect(reconstructed.openaiModel).toBe('gpt-4o');
      expect(reconstructed.openaiTemperature).toBe(0.4);
      expect(reconstructed.enableMultiIntentDetection).toBe(true);
      expect(reconstructed.entityExtractionMode).toBe('custom');
      expect(reconstructed.customEntityTypes).toEqual(['lead_intent', 'budget_range']);
      expect(reconstructed.enableAdvancedScoring).toBe(true);
      expect(reconstructed.entityCompletenessWeight).toBe(0.35);
      expect(reconstructed.enablePerformanceLogging).toBe(false);
    });
  });

  describe('toJsonb', () => {
    it('should convert AIConfiguration to JSONB format correctly', () => {
      const aiConfig = AIConfiguration.create({
        openaiModel: 'gpt-4o',
        openaiTemperature: 0.6,
        openaiMaxTokens: 1500,
        contextMaxTokens: 14000,
        contextSystemPromptTokens: 600,
        contextResponseReservedTokens: 3500,
        contextSummaryTokens: 250,
        intentConfidenceThreshold: 0.75,
        intentAmbiguityThreshold: 0.25,
        enableMultiIntentDetection: true,
        enablePersonaInference: false,
        enableAdvancedEntities: true,
        entityExtractionMode: 'custom',
        customEntityTypes: ['product_category', 'price_sensitivity'],
        maxConversationTurns: 30,
        inactivityTimeoutSeconds: 450,
        enableJourneyRegression: false,
        enableContextSwitchDetection: true,
        enableAdvancedScoring: true,
        entityCompletenessWeight: 0.4,
        personaConfidenceWeight: 0.25,
        journeyProgressionWeight: 0.35,
        enablePerformanceLogging: true,
        enableIntentAnalytics: false,
        enablePersonaAnalytics: true,
        responseTimeThresholdMs: 1800
      });

      const jsonbData = AIConfigurationMapper.toJsonb(aiConfig);

      expect(jsonbData).toEqual({
        openaiModel: 'gpt-4o',
        openaiTemperature: 0.6,
        openaiMaxTokens: 1500,
        contextMaxTokens: 14000,
        contextSystemPromptTokens: 600,
        contextResponseReservedTokens: 3500,
        contextSummaryTokens: 250,
        intentConfidenceThreshold: 0.75,
        intentAmbiguityThreshold: 0.25,
        enableMultiIntentDetection: true,
        enablePersonaInference: false,
        enableAdvancedEntities: true,
        entityExtractionMode: 'custom',
        customEntityTypes: ['product_category', 'price_sensitivity'],
        maxConversationTurns: 30,
        inactivityTimeoutSeconds: 450,
        enableJourneyRegression: false,
        enableContextSwitchDetection: true,
        enableAdvancedScoring: true,
        entityCompletenessWeight: 0.4,
        personaConfidenceWeight: 0.25,
        journeyProgressionWeight: 0.35,
        enablePerformanceLogging: true,
        enableIntentAnalytics: false,
        enablePersonaAnalytics: true,
        responseTimeThresholdMs: 1800
      });
    });

    it('should convert default AIConfiguration to JSONB correctly', () => {
      const defaultConfig = AIConfiguration.createDefault();
      const jsonbData = AIConfigurationMapper.toJsonb(defaultConfig);

      expect(jsonbData).toEqual({
        openaiModel: 'gpt-4o-mini',
        openaiTemperature: 0.3,
        openaiMaxTokens: 1000,
        contextMaxTokens: 12000,
        contextSystemPromptTokens: 500,
        contextResponseReservedTokens: 3000,
        contextSummaryTokens: 200,
        intentConfidenceThreshold: 0.7,
        intentAmbiguityThreshold: 0.2,
        enableMultiIntentDetection: true,
        enablePersonaInference: true,
        enableAdvancedEntities: true,
        entityExtractionMode: 'comprehensive',
        customEntityTypes: [],
        maxConversationTurns: 20,
        inactivityTimeoutSeconds: 300,
        enableJourneyRegression: true,
        enableContextSwitchDetection: true,
        enableAdvancedScoring: true,
        entityCompletenessWeight: 0.3,
        personaConfidenceWeight: 0.2,
        journeyProgressionWeight: 0.25,
        enablePerformanceLogging: true,
        enableIntentAnalytics: true,
        enablePersonaAnalytics: true,
        responseTimeThresholdMs: 2000
      });
    });

    it('should maintain data type consistency', () => {
      const aiConfig = AIConfiguration.createDefault();
      const jsonbData = AIConfigurationMapper.toJsonb(aiConfig) as Record<string, unknown>;

      // Verify data types are preserved
      expect(typeof jsonbData.openaiModel).toBe('string');
      expect(typeof jsonbData.openaiTemperature).toBe('number');
      expect(typeof jsonbData.openaiMaxTokens).toBe('number');
      expect(typeof jsonbData.enableMultiIntentDetection).toBe('boolean');
      expect(Array.isArray(jsonbData.customEntityTypes)).toBe(true);
    });
  });

  describe('Round-trip conversion', () => {
    it('should maintain data integrity through fromJsonb -> toJsonb conversion', () => {
      const originalData = {
        openaiModel: 'gpt-4o',
        openaiTemperature: 0.45,
        openaiMaxTokens: 1200,
        contextMaxTokens: 15000,
        enableMultiIntentDetection: false,
        entityExtractionMode: 'basic',
        customEntityTypes: ['industry_type', 'company_size'],
        enableAdvancedScoring: false,
        responseTimeThresholdMs: 2500
      };

      const config = AIConfigurationMapper.fromJsonb(originalData);
      const reconvertedData = AIConfigurationMapper.toJsonb(config);

      // Verify explicitly set values are preserved
      expect((reconvertedData as any).openaiModel).toBe('gpt-4o');
      expect((reconvertedData as any).openaiTemperature).toBe(0.45);
      expect((reconvertedData as any).openaiMaxTokens).toBe(1200);
      expect((reconvertedData as any).contextMaxTokens).toBe(15000);
      expect((reconvertedData as any).enableMultiIntentDetection).toBe(false);
      expect((reconvertedData as any).entityExtractionMode).toBe('basic');
      expect((reconvertedData as any).customEntityTypes).toEqual(['industry_type', 'company_size']);
      expect((reconvertedData as any).enableAdvancedScoring).toBe(false);
      expect((reconvertedData as any).responseTimeThresholdMs).toBe(2500);
    });

    it('should maintain data integrity for default configuration', () => {
      const defaultConfig = AIConfiguration.createDefault();
      const jsonbData = AIConfigurationMapper.toJsonb(defaultConfig);
      const reconstructedConfig = AIConfigurationMapper.fromJsonb(jsonbData);
      const finalJsonbData = AIConfigurationMapper.toJsonb(reconstructedConfig);

      expect(jsonbData).toEqual(finalJsonbData);
    });

    it('should handle complex round-trip scenarios', () => {
      const complexScenarios = [
        {
          openaiModel: 'gpt-3.5-turbo',
          entityExtractionMode: 'comprehensive',
          customEntityTypes: [],
          enableAdvancedScoring: true
        },
        {
          openaiModel: 'gpt-4-turbo',
          entityExtractionMode: 'custom',
          customEntityTypes: ['lead_priority', 'urgency_level', 'budget_tier'],
          enableAdvancedScoring: false
        }
      ];

      complexScenarios.forEach(scenario => {
        const config = AIConfigurationMapper.fromJsonb(scenario);
        const reconverted = AIConfigurationMapper.toJsonb(config);
        const verificationConfig = AIConfigurationMapper.fromJsonb(reconverted);
        const finalData = AIConfigurationMapper.toJsonb(verificationConfig);

        expect(reconverted).toEqual(finalData);
      });
    });
  });

  describe('Error handling and edge cases', () => {
    it('should handle malformed JSONB data gracefully', () => {
      const malformedData = {
        openaiModel: 123, // Should be string
        openaiTemperature: 'hot', // Should be number
        enableMultiIntentDetection: 'yes', // Should be boolean
        customEntityTypes: 'not_an_array', // Should be array
        nonExistentProperty: 'should_be_ignored'
      };

      expect(() => {
        AIConfigurationMapper.fromJsonb(malformedData);
      }).not.toThrow();

      const config = AIConfigurationMapper.fromJsonb(malformedData);
      
      // Should use defaults for invalid values
      expect(config.toPlainObject().openaiModel).toBe('gpt-4o-mini');
      expect(config.openaiTemperature).toBe(0.3);
      expect(config.toPlainObject().enableMultiIntentDetection).toBe(true);
      expect(config.toPlainObject().customEntityTypes).toEqual([]);
    });

    it('should handle circular reference objects safely', () => {
      const circularObj: any = { openaiModel: 'gpt-4o' };
      circularObj.self = circularObj;

      expect(() => {
        AIConfigurationMapper.fromJsonb(circularObj);
      }).not.toThrow();
    });

    it('should handle realistic large values within domain constraints', () => {
      const realisticLargeData = {
        // Test realistic production values that should be valid
        openaiMaxTokens: 3000, // Large but realistic value for production use
        contextMaxTokens: 50000, // Large context window for complex documents
        responseTimeThresholdMs: 30000, // 30 second timeout for complex queries
        contextSystemPromptTokens: 1000, // Large system prompt
        contextResponseReservedTokens: 5000, // Large response buffer
        maxConversationTurns: 100 // Extended conversation
      };

      const config = AIConfigurationMapper.fromJsonb(realisticLargeData);
      const jsonbData = AIConfigurationMapper.toJsonb(config);

      expect((jsonbData as any).openaiMaxTokens).toBe(3000);
      expect((jsonbData as any).contextMaxTokens).toBe(50000);
      expect((jsonbData as any).responseTimeThresholdMs).toBe(30000);
      expect((jsonbData as any).contextSystemPromptTokens).toBe(1000);
      expect((jsonbData as any).contextResponseReservedTokens).toBe(5000);
      expect((jsonbData as any).maxConversationTurns).toBe(100);
    });

    it('should handle domain constraint violations gracefully', () => {
      // Test scenarios where domain constraints would be violated
      const constraintViolationCases = [
        {
          description: 'confidence threshold equal to ambiguity threshold',
          input: { intentConfidenceThreshold: 0.5, intentAmbiguityThreshold: 0.5 },
          expectation: 'should adjust ambiguity threshold to be less than confidence'
        },
        {
          description: 'confidence threshold less than ambiguity threshold',
          input: { intentConfidenceThreshold: 0.3, intentAmbiguityThreshold: 0.7 },
          expectation: 'should adjust ambiguity threshold to be less than confidence'
        },
        {
          description: 'custom extraction mode with empty entity types',
          input: { entityExtractionMode: 'custom', customEntityTypes: [] },
          expectation: 'should add default custom entity type'
        }
      ];

      constraintViolationCases.forEach(testCase => {
        const config = AIConfigurationMapper.fromJsonb(testCase.input);
        const plainObject = config.toPlainObject();

        if (testCase.input.intentConfidenceThreshold !== undefined) {
          // Domain constraint: confidence > ambiguity should always be satisfied
          expect(plainObject.intentConfidenceThreshold).toBeGreaterThan(plainObject.intentAmbiguityThreshold);
        }

        if (testCase.input.entityExtractionMode === 'custom') {
          // Domain constraint: custom mode requires at least one entity type
          expect(plainObject.customEntityTypes.length).toBeGreaterThan(0);
        }
      });
    });
  });
});