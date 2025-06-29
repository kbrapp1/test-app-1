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

    it('should ALWAYS include core identity entities for comprehensive extraction', () => {
      const existingEntities = {
        visitorName: 'Kip',
        company: 'Acme',
        role: 'ceo',
        industry: 'tech'
      };
      const schema = OpenAIFunctionSchemaBuilder.buildUnifiedChatbotSchemaWithContext(existingEntities, 'greeting');
      const entityProperties = schema.parameters.properties.analysis.properties.entities.properties;

      // FIXED: Core identity entities should ALWAYS be present for re-extraction and validation
      expect(entityProperties.visitorName).toBeDefined();
      expect(entityProperties.company).toBeDefined();
      expect(entityProperties.role).toBeDefined();
      expect(entityProperties.industry).toBeDefined();
      
      // Verify enhanced descriptions for better extraction
      expect(entityProperties.visitorName.description).toContain('CRITICAL');
      expect(entityProperties.visitorName.description).toContain('Never miss name introductions');
    });

    it('should request qualification entities during "qualification" phase', () => {
      const schema = OpenAIFunctionSchemaBuilder.buildUnifiedChatbotSchemaWithContext({}, 'qualification');
      const entityProperties = schema.parameters.properties.analysis.properties.entities.properties;

      // Core entities always included
      expect(entityProperties.visitorName).toBeDefined();
      expect(entityProperties.company).toBeDefined();
      expect(entityProperties.role).toBeDefined();
      expect(entityProperties.industry).toBeDefined();
      
      // Qualification-specific entities
      expect(entityProperties.budget).toBeDefined();
      expect(entityProperties.timeline).toBeDefined();
      expect(entityProperties.urgency).toBeDefined();
      expect(entityProperties.decisionMakers).toBeDefined();
    });

    it('should request scheduling entities during "booking" phase', () => {
        const schema = OpenAIFunctionSchemaBuilder.buildUnifiedChatbotSchemaWithContext({}, 'booking');
        const entityProperties = schema.parameters.properties.analysis.properties.entities.properties;

        // Core entities always included
        expect(entityProperties.visitorName).toBeDefined();
        expect(entityProperties.company).toBeDefined();
        expect(entityProperties.role).toBeDefined();
        expect(entityProperties.industry).toBeDefined();
  
        // Booking-specific entities
        expect(entityProperties.preferredTime).toBeDefined();
        expect(entityProperties.contactMethod).toBeDefined();
    });

    it('should always include budget if pricing intent is detected', () => {
        const schema = OpenAIFunctionSchemaBuilder.buildUnifiedChatbotSchemaWithContext({}, 'discovery', 'how much does it cost?');
        const entityProperties = schema.parameters.properties.analysis.properties.entities.properties;

        // Core entities always included
        expect(entityProperties.visitorName).toBeDefined();
        expect(entityProperties.company).toBeDefined();
        expect(entityProperties.role).toBeDefined();
        expect(entityProperties.industry).toBeDefined();
  
        // Pricing-triggered entities
        expect(entityProperties.budget).toBeDefined();
    });

    it('should include comprehensive entities for unknown phases', () => {
        const existingEntities = {
            visitorName: 'Kip',
            company: 'Acme',
            role: 'ceo',
            industry: 'tech'
        };
        // Unknown phase should include business context entities
        const schema = OpenAIFunctionSchemaBuilder.buildUnifiedChatbotSchemaWithContext(existingEntities, 'unknown_phase');
        const entityProperties = schema.parameters.properties.analysis.properties.entities.properties;

        // Core entities always included
        expect(entityProperties.visitorName).toBeDefined();
        expect(entityProperties.company).toBeDefined();
        expect(entityProperties.role).toBeDefined();
        expect(entityProperties.industry).toBeDefined();
        
        // Business context entities for unknown phases
        expect(entityProperties.teamSize).toBeDefined();
        expect(entityProperties.budget).toBeDefined();
        expect(entityProperties.timeline).toBeDefined();
        expect(entityProperties.urgency).toBeDefined();
        expect(entityProperties.contactMethod).toBeDefined();
        expect(entityProperties.painPoints).toBeDefined();
        expect(entityProperties.decisionMakers).toBeDefined();
    });

    it('should include core entities even when no specific entities are applicable', () => {
        const schema = OpenAIFunctionSchemaBuilder.buildUnifiedChatbotSchemaWithContext({}, 'general_conversation');
        const entityProperties = schema.parameters.properties.analysis.properties.entities.properties;

        // Even for general conversation, core identity entities should be available
        expect(entityProperties.visitorName).toBeDefined();
        expect(entityProperties.company).toBeDefined();
        expect(entityProperties.role).toBeDefined();
        expect(entityProperties.industry).toBeDefined();
        
        // And business context entities for qualification
        expect(entityProperties.budget).toBeDefined();
        expect(entityProperties.timeline).toBeDefined();
        expect(entityProperties.urgency).toBeDefined();
    });

    it('should include corrections schema when a correction is detected', () => {
        const schema = OpenAIFunctionSchemaBuilder.buildUnifiedChatbotSchemaWithContext({}, 'discovery', 'actually my budget is different');
        const entityProperties = schema.parameters.properties.analysis.properties.entities.properties;

        expect(entityProperties.corrections).toBeDefined();
        expect(entityProperties.corrections.properties.correctedBudget).toBeDefined();
    });
  });
}); 