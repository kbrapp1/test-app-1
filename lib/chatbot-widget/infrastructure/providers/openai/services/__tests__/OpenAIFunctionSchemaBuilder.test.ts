/**
 * OpenAI Function Schema Builder Tests
 * 
 * AI INSTRUCTIONS:
 * - Test all schema generation methods
 * - Verify schema structure and required fields
 * - Test the new entity extraction with corrections schema
 * - Follow @golden-rule testing patterns exactly
 */

import { OpenAIFunctionSchemaBuilder } from '../OpenAIFunctionSchemaBuilder';

describe('OpenAIFunctionSchemaBuilder', () => {
  describe('buildIntentClassificationSchema', () => {
    it('should build a valid intent classification schema', () => {
      const schema = OpenAIFunctionSchemaBuilder.buildIntentClassificationSchema();
      
      expect(schema.name).toBe('classify_intent_and_persona');
      expect(schema.description).toContain('Classify user intent');
      expect(schema.parameters).toBeDefined();
      expect(schema.parameters.type).toBe('object');
      expect(schema.parameters.properties).toBeDefined();
      
      // Verify required properties
      expect(schema.parameters.properties.primaryIntent).toBeDefined();
      expect(schema.parameters.properties.primaryConfidence).toBeDefined();
      expect(schema.parameters.properties.entities).toBeDefined();
      expect(schema.parameters.properties.reasoning).toBeDefined();
      
      // Verify intent enum values
      expect(schema.parameters.properties.primaryIntent.enum).toContain('greeting');
      expect(schema.parameters.properties.primaryIntent.enum).toContain('sales_inquiry');
      expect(schema.parameters.properties.primaryIntent.enum).toContain('demo_request');
    });

    it('should include all required entity properties', () => {
      const schema = OpenAIFunctionSchemaBuilder.buildIntentClassificationSchema();
      const entityProperties = schema.parameters.properties.entities.properties;
      
      // Core business entities
      expect(entityProperties.budget).toBeDefined();
      expect(entityProperties.timeline).toBeDefined();
      expect(entityProperties.company).toBeDefined();
      expect(entityProperties.teamSize).toBeDefined();
      expect(entityProperties.industry).toBeDefined();
      expect(entityProperties.role).toBeDefined();
      expect(entityProperties.location).toBeDefined();
      
      // Enum entities
      expect(entityProperties.urgency).toBeDefined();
      expect(entityProperties.urgency.enum).toEqual(['low', 'medium', 'high']);
      expect(entityProperties.contactMethod).toBeDefined();
      expect(entityProperties.contactMethod.enum).toContain('email');
      
      // Array entities
      expect(entityProperties.integrationNeeds).toBeDefined();
      expect(entityProperties.integrationNeeds.type).toBe('array');
      expect(entityProperties.painPoints).toBeDefined();
      expect(entityProperties.painPoints.type).toBe('array');
      expect(entityProperties.decisionMakers).toBeDefined();
      expect(entityProperties.decisionMakers.type).toBe('array');
    });
  });

  describe('buildEntityExtractionWithCorrectionsSchema', () => {
    it('should build a valid entity extraction with corrections schema', () => {
      const schema = OpenAIFunctionSchemaBuilder.buildEntityExtractionWithCorrectionsSchema();
      
      expect(schema.name).toBe('extract_entities_with_corrections');
      expect(schema.description).toContain('Extract entities');
      expect(schema.description).toContain('corrections and removals');
      expect(schema.parameters).toBeDefined();
      expect(schema.parameters.type).toBe('object');
      expect(schema.parameters.properties).toBeDefined();
    });

    it('should include all standard entity properties from base schema', () => {
      const correctionSchema = OpenAIFunctionSchemaBuilder.buildEntityExtractionWithCorrectionsSchema();
      const standardSchema = OpenAIFunctionSchemaBuilder.buildIntentClassificationSchema();
      
      const correctionProperties = correctionSchema.parameters.properties;
      const standardEntityProperties = standardSchema.parameters.properties.entities.properties;
      
      // Verify all standard entity properties are included
      Object.keys(standardEntityProperties).forEach(key => {
        expect(correctionProperties[key]).toBeDefined();
      });
    });

    it('should include corrections property with all removal fields', () => {
      const schema = OpenAIFunctionSchemaBuilder.buildEntityExtractionWithCorrectionsSchema();
      const corrections = schema.parameters.properties.corrections;
      
      expect(corrections).toBeDefined();
      expect(corrections.type).toBe('object');
      expect(corrections.description).toContain('corrections');
      
      const correctionProperties = corrections.properties;
      
      // Removal properties (arrays)
      expect(correctionProperties.removedDecisionMakers).toBeDefined();
      expect(correctionProperties.removedDecisionMakers.type).toBe('array');
      expect(correctionProperties.removedPainPoints).toBeDefined();
      expect(correctionProperties.removedPainPoints.type).toBe('array');
      expect(correctionProperties.removedIntegrationNeeds).toBeDefined();
      expect(correctionProperties.removedIntegrationNeeds.type).toBe('array');
      expect(correctionProperties.removedEvaluationCriteria).toBeDefined();
      expect(correctionProperties.removedEvaluationCriteria.type).toBe('array');
    });

    it('should include corrections property with all correction fields', () => {
      const schema = OpenAIFunctionSchemaBuilder.buildEntityExtractionWithCorrectionsSchema();
      const correctionProperties = schema.parameters.properties.corrections.properties;
      
      // Correction properties (individual values)
      expect(correctionProperties.correctedBudget).toBeDefined();
      expect(correctionProperties.correctedBudget.type).toBe('string');
      expect(correctionProperties.correctedTimeline).toBeDefined();
      expect(correctionProperties.correctedTimeline.type).toBe('string');
      expect(correctionProperties.correctedRole).toBeDefined();
      expect(correctionProperties.correctedRole.type).toBe('string');
      expect(correctionProperties.correctedIndustry).toBeDefined();
      expect(correctionProperties.correctedIndustry.type).toBe('string');
      expect(correctionProperties.correctedCompany).toBeDefined();
      expect(correctionProperties.correctedCompany.type).toBe('string');
      expect(correctionProperties.correctedTeamSize).toBeDefined();
      expect(correctionProperties.correctedTeamSize.type).toBe('string');
      
      // Enum corrections
      expect(correctionProperties.correctedUrgency).toBeDefined();
      expect(correctionProperties.correctedUrgency.enum).toEqual(['low', 'medium', 'high']);
      expect(correctionProperties.correctedContactMethod).toBeDefined();
      expect(correctionProperties.correctedContactMethod.enum).toContain('email');
      expect(correctionProperties.correctedContactMethod.enum).toContain('phone');
      expect(correctionProperties.correctedContactMethod.enum).toContain('meeting');
    });

    it('should have no required fields since corrections are optional', () => {
      const schema = OpenAIFunctionSchemaBuilder.buildEntityExtractionWithCorrectionsSchema();
      
      expect(schema.parameters.required).toEqual([]);
    });

    it('should have descriptive messages for removal operations', () => {
      const schema = OpenAIFunctionSchemaBuilder.buildEntityExtractionWithCorrectionsSchema();
      const correctionProperties = schema.parameters.properties.corrections.properties;
      
      expect(correctionProperties.removedDecisionMakers.description).toContain('NOT being decision makers');
      expect(correctionProperties.removedPainPoints.description).toContain('resolved, not applicable, or incorrect');
      expect(correctionProperties.removedIntegrationNeeds.description).toContain('not needed or resolved');
      expect(correctionProperties.removedEvaluationCriteria.description).toContain('not important or incorrect');
    });

    it('should have descriptive messages for correction operations', () => {
      const schema = OpenAIFunctionSchemaBuilder.buildEntityExtractionWithCorrectionsSchema();
      const correctionProperties = schema.parameters.properties.corrections.properties;
      
      expect(correctionProperties.correctedBudget.description).toContain('budget correction');
      expect(correctionProperties.correctedTimeline.description).toContain('timeline correction');
      expect(correctionProperties.correctedRole.description).toContain('role correction');
    });
  });
}); 