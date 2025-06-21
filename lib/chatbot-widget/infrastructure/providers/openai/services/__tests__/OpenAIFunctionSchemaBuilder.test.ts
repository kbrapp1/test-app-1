/**
 * OpenAI Function Schema Builder Tests
 * 
 * AI INSTRUCTIONS:
 * - Test the primary public method `buildUnifiedChatbotSchemaWithContext`.
 * - Verify that entity extraction is truly dynamic based on context.
 * - Check for both inclusion and exclusion of entities to prevent redundancy.
 * - Follow @golden-rule testing patterns exactly.
 */

import { OpenAIFunctionSchemaBuilder } from '../OpenAIFunctionSchemaBuilder';

describe('OpenAIFunctionSchemaBuilder', () => {

  describe('buildUnifiedChatbotSchemaWithContext', () => {

    it('should always build a valid base schema structure', () => {
      const schema = OpenAIFunctionSchemaBuilder.buildUnifiedChatbotSchemaWithContext();
      
      expect(schema.name).toBe('process_chatbot_interaction_complete');
      expect(schema.description).toContain('selective entity extraction');
      expect(schema.parameters).toBeDefined();
      expect(schema.parameters.type).toBe('object');
      
      const properties = schema.parameters.properties;
      expect(properties.analysis).toBeDefined();
      expect(properties.conversationFlow).toBeDefined();
      expect(properties.response).toBeDefined();
      // REMOVED: leadScore - Domain calculates this via DomainConstants
      expect(properties.leadScore).toBeUndefined();

      expect(schema.parameters.required).toEqual(
        expect.arrayContaining(['analysis', 'conversationFlow', 'response'])
      );
    });

    it('should request identity entities during "greeting" phase when none exist', () => {
      const schema = OpenAIFunctionSchemaBuilder.buildUnifiedChatbotSchemaWithContext({}, 'greeting');
      const entityProperties = schema.parameters.properties.analysis.properties.entities.properties;

      expect(entityProperties.visitorName).toBeDefined();
      expect(entityProperties.company).toBeDefined();
      expect(entityProperties.role).toBeDefined();
      expect(entityProperties.industry).toBeDefined();
    });

    it('should NOT request identity entities during "greeting" if they already exist', () => {
      const existingEntities = {
        visitorName: 'Kip',
        company: 'Acme',
        role: 'ceo',
        industry: 'tech'
      };
      const schema = OpenAIFunctionSchemaBuilder.buildUnifiedChatbotSchemaWithContext(existingEntities, 'greeting');
      const entityProperties = schema.parameters.properties.analysis.properties.entities.properties;

      // None of the identity entities should be present in the schema
      expect(entityProperties.visitorName).toBeUndefined();
      expect(entityProperties.company).toBeUndefined();
      expect(entityProperties.role).toBeUndefined();
      expect(entityProperties.industry).toBeUndefined();
    });

    it('should request qualification entities during "qualification" phase', () => {
      const schema = OpenAIFunctionSchemaBuilder.buildUnifiedChatbotSchemaWithContext({}, 'qualification');
      const entityProperties = schema.parameters.properties.analysis.properties.entities.properties;

      expect(entityProperties.budget).toBeDefined();
      expect(entityProperties.timeline).toBeDefined();
      expect(entityProperties.urgency).toBeDefined();
      expect(entityProperties.decisionMakers).toBeDefined();
    });

    it('should request scheduling entities during "booking" phase', () => {
        const schema = OpenAIFunctionSchemaBuilder.buildUnifiedChatbotSchemaWithContext({}, 'booking');
        const entityProperties = schema.parameters.properties.analysis.properties.entities.properties;
  
        expect(entityProperties.preferredTime).toBeDefined();
        expect(entityProperties.contactMethod).toBeDefined();
    });

    it('should request budget if pricing intent is detected', () => {
        const schema = OpenAIFunctionSchemaBuilder.buildUnifiedChatbotSchemaWithContext({}, 'discovery', 'how much does it cost?');
        const entityProperties = schema.parameters.properties.analysis.properties.entities.properties;
  
        expect(entityProperties.budget).toBeDefined();
    });

    it('should not request budget if pricing intent is detected but budget already exists', () => {
        const existingEntities = { budget: '$50k' };
        const schema = OpenAIFunctionSchemaBuilder.buildUnifiedChatbotSchemaWithContext(existingEntities, 'discovery', 'how much does it cost?');
        const entityProperties = schema.parameters.properties.analysis.properties.entities.properties;
  
        // The budget property should not be in the schema since it already exists
        expect(entityProperties.budget).toBeUndefined();
    });

    it('should request a generic entity if no other entities are applicable', () => {
        const existingEntities = {
            visitorName: 'Kip',
            company: 'Acme',
            role: 'ceo',
            industry: 'tech'
        };
        // In the greeting phase, with all identity entities present, no other entities should be requested.
        const schema = OpenAIFunctionSchemaBuilder.buildUnifiedChatbotSchemaWithContext(existingEntities, 'greeting');
        const entityProperties = schema.parameters.properties.analysis.properties.entities.properties;

        expect(entityProperties.generic).toBeDefined();
        expect(entityProperties.generic.description).toContain('Any relevant entity');
    });

    it('should include corrections schema when a correction is detected', () => {
        const schema = OpenAIFunctionSchemaBuilder.buildUnifiedChatbotSchemaWithContext({}, 'discovery', 'actually my budget is different');
        const entityProperties = schema.parameters.properties.analysis.properties.entities.properties;

        expect(entityProperties.corrections).toBeDefined();
        expect(entityProperties.corrections.properties.correctedBudget).toBeDefined();
    });
  });
}); 