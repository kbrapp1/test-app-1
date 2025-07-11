/**
 * OpenAI Function Schema Builder Tests
 * 
 * AI INSTRUCTIONS:
 * - Test the simplified lead qualification schema approach
 * - Verify consistent schema structure regardless of parameters
 * - Test that all required lead data fields are present
 * - Follow @golden-rule testing patterns exactly
 */

import { OpenAIFunctionSchemaBuilder } from '../OpenAIFunctionSchemaBuilder';

describe('OpenAIFunctionSchemaBuilder', () => {

  describe('buildUnifiedChatbotSchemaWithContext', () => {

    it('should always build a valid base schema structure', () => {
      const schema = OpenAIFunctionSchemaBuilder.buildUnifiedChatbotSchemaWithContext();
      
      expect(schema.name).toBe('lead_qualification_response');
      expect(schema.description).toContain('lead information');
      expect(schema.parameters).toBeDefined();
      expect(schema.parameters.type).toBe('object');
      
      const properties = schema.parameters.properties;
      expect(properties.intent).toBeDefined();
      expect(properties.lead_data).toBeDefined();
      expect(properties.response).toBeDefined();

      expect(schema.parameters.required).toEqual(
        expect.arrayContaining(['intent', 'lead_data', 'response'])
      );
    });

    it('should include all lead data fields in simplified schema', () => {
      const schema = OpenAIFunctionSchemaBuilder.buildUnifiedChatbotSchemaWithContext();
      const leadData = schema.parameters.properties.lead_data as { properties: Record<string, unknown> };
      const leadDataProperties = leadData.properties;

      // Core lead data fields should always be present
      expect(leadDataProperties.name).toBeDefined();
      expect(leadDataProperties.company).toBeDefined();
      expect(leadDataProperties.role).toBeDefined();
      expect(leadDataProperties.budget).toBeDefined();
      expect(leadDataProperties.timeline).toBeDefined();
      expect(leadDataProperties.urgency).toBeDefined();
      expect(leadDataProperties.goals).toBeDefined();
      expect(leadDataProperties.pain_points).toBeDefined();
    });

    it('should include proper field types and constraints', () => {
      const schema = OpenAIFunctionSchemaBuilder.buildUnifiedChatbotSchemaWithContext();
      const leadData = schema.parameters.properties.lead_data as { properties: Record<string, { type: string; enum?: string[] }> };
      const leadDataProperties = leadData.properties;

      // Verify field types
      expect(leadDataProperties.name.type).toBe('string');
      expect(leadDataProperties.company.type).toBe('string');
      expect(leadDataProperties.role.type).toBe('string');
      expect(leadDataProperties.budget.type).toBe('string');
      expect(leadDataProperties.timeline.type).toBe('string');
      expect(leadDataProperties.urgency.type).toBe('string');
      expect(leadDataProperties.goals.type).toBe('array');
      expect(leadDataProperties.pain_points.type).toBe('array');

      // Verify urgency enum constraint
      expect(leadDataProperties.urgency.enum).toEqual(['low', 'medium', 'high']);
    });

    it('should include intent field with proper enum values', () => {
      const schema = OpenAIFunctionSchemaBuilder.buildUnifiedChatbotSchemaWithContext();
      const intentProperty = schema.parameters.properties.intent as { type: string; enum: string[] };

      expect(intentProperty.type).toBe('string');
      expect(intentProperty.enum).toEqual([
        'inquiry', 'qualification', 'demo', 'pricing', 'objection', 'greeting'
      ]);
    });

    it('should include response object with required fields', () => {
      const schema = OpenAIFunctionSchemaBuilder.buildUnifiedChatbotSchemaWithContext();
      const response = schema.parameters.properties.response as { 
        properties: Record<string, { type: string }>;
        required: string[];
      };
      const responseProperties = response.properties;

      expect(responseProperties.content).toBeDefined();
      expect(responseProperties.content.type).toBe('string');
      
      expect(responseProperties.capture_contact).toBeDefined();
      expect(responseProperties.capture_contact.type).toBe('boolean');
      
      expect(responseProperties.next_question).toBeDefined();
      expect(responseProperties.next_question.type).toBe('string');

      // Verify required fields
      expect(response.required).toEqual(
        expect.arrayContaining(['content', 'capture_contact'])
      );
    });

    it('should return consistent schema regardless of input parameters', () => {
      // Test with various parameter combinations
      const schema1 = OpenAIFunctionSchemaBuilder.buildUnifiedChatbotSchemaWithContext();
      const schema2 = OpenAIFunctionSchemaBuilder.buildUnifiedChatbotSchemaWithContext({}, 'qualification');
      const schema3 = OpenAIFunctionSchemaBuilder.buildUnifiedChatbotSchemaWithContext({ name: 'John' }, 'booking', 'Hello');

      // All schemas should be identical (simplified approach)
      expect(schema1).toEqual(schema2);
      expect(schema2).toEqual(schema3);
    });

    it('should maintain backward compatibility with existing parameters', () => {
      // Verify method accepts parameters but ignores them (backward compatibility)
      const existingEntities = { name: 'John', company: 'Acme' };
      const conversationPhase = 'qualification';
      const userMessage = 'What is your pricing?';

      expect(() => {
        const schema = OpenAIFunctionSchemaBuilder.buildUnifiedChatbotSchemaWithContext(
          existingEntities,
          conversationPhase,
          userMessage
        );
        expect(schema.name).toBe('lead_qualification_response');
      }).not.toThrow();
    });

    it('should include proper descriptions for all fields', () => {
      const schema = OpenAIFunctionSchemaBuilder.buildUnifiedChatbotSchemaWithContext();
      const leadData = schema.parameters.properties.lead_data as { properties: Record<string, { description: string }> };
      const leadDataProperties = leadData.properties;

      // Verify descriptions exist for key fields
      expect(leadDataProperties.name.description).toContain('name');
      expect(leadDataProperties.company.description).toContain('Company');
      expect(leadDataProperties.role.description).toContain('role');
      expect(leadDataProperties.budget.description).toContain('Budget');
      expect(leadDataProperties.timeline.description).toContain('timeline');
      expect(leadDataProperties.urgency.description).toContain('Urgency');
      expect(leadDataProperties.goals.description).toContain('goals');
      expect(leadDataProperties.pain_points.description).toContain('problems');
    });
  });
}); 