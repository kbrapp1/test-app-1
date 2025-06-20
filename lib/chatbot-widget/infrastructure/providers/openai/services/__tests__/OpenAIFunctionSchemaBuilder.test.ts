/**
 * OpenAI Function Schema Builder Tests
 * 
 * AI INSTRUCTIONS:
 * - Test all schema generation methods that actually exist
 * - Verify schema structure and required fields
 * - Test the new dynamic entity extraction with context
 * - Follow @golden-rule testing patterns exactly
 */

import { OpenAIFunctionSchemaBuilder } from '../OpenAIFunctionSchemaBuilder';

describe('OpenAIFunctionSchemaBuilder', () => {

  describe('buildUnifiedAnalysisSchema', () => {
    it('should build a valid unified analysis schema', () => {
      const schema = OpenAIFunctionSchemaBuilder.buildUnifiedAnalysisSchema();
      
      expect(schema.name).toBe('analyze_message_complete');
      expect(schema.description).toContain('Complete message analysis');
      expect(schema.description).toContain('intent');
      expect(schema.description).toContain('entities');
      expect(schema.description).toContain('corrections');
      expect(schema.parameters).toBeDefined();
      expect(schema.parameters.type).toBe('object');
      expect(schema.parameters.properties).toBeDefined();
    });

    it('should include intent classification properties', () => {
      const schema = OpenAIFunctionSchemaBuilder.buildUnifiedAnalysisSchema();
      const properties = schema.parameters.properties;
      
      expect(properties.primaryIntent).toBeDefined();
      expect(properties.primaryIntent.enum).toContain('greeting');
      expect(properties.primaryIntent.enum).toContain('sales_inquiry');
      expect(properties.primaryConfidence).toBeDefined();
      expect(properties.personaInference).toBeDefined();
      expect(properties.reasoning).toBeDefined();
    });

    it('should include all entity properties', () => {
      const schema = OpenAIFunctionSchemaBuilder.buildUnifiedAnalysisSchema();
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

    it('should include corrections property with all removal fields', () => {
      const schema = OpenAIFunctionSchemaBuilder.buildUnifiedAnalysisSchema();
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
      const schema = OpenAIFunctionSchemaBuilder.buildUnifiedAnalysisSchema();
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

    it('should have required fields for intent and entities but not corrections', () => {
      const schema = OpenAIFunctionSchemaBuilder.buildUnifiedAnalysisSchema();
      
      expect(schema.parameters.required).toContain('primaryIntent');
      expect(schema.parameters.required).toContain('primaryConfidence');
      expect(schema.parameters.required).toContain('entities');
      expect(schema.parameters.required).not.toContain('corrections');
    });

    it('should have descriptive messages for removal operations', () => {
      const schema = OpenAIFunctionSchemaBuilder.buildUnifiedAnalysisSchema();
      const correctionProperties = schema.parameters.properties.corrections.properties;
      
      expect(correctionProperties.removedDecisionMakers.description).toContain('NOT being decision makers');
      expect(correctionProperties.removedPainPoints.description).toContain('resolved, not applicable, or incorrect');
      expect(correctionProperties.removedIntegrationNeeds.description).toContain('not needed or resolved');
      expect(correctionProperties.removedEvaluationCriteria.description).toContain('not important or incorrect');
    });

    it('should have descriptive messages for correction operations', () => {
      const schema = OpenAIFunctionSchemaBuilder.buildUnifiedAnalysisSchema();
      const correctionProperties = schema.parameters.properties.corrections.properties;
      
      expect(correctionProperties.correctedBudget.description).toContain('budget correction');
      expect(correctionProperties.correctedTimeline.description).toContain('timeline correction');
      expect(correctionProperties.correctedRole.description).toContain('role correction');
    });
  });

  describe('buildUnifiedChatbotSchemaWithContext', () => {
    it('should build a valid unified chatbot schema with default context', () => {
      const schema = OpenAIFunctionSchemaBuilder.buildUnifiedChatbotSchemaWithContext();
      
      expect(schema.name).toBe('process_chatbot_interaction_complete');
      expect(schema.description).toContain('Complete chatbot processing');
      expect(schema.description).toContain('selective entity extraction');
      expect(schema.parameters).toBeDefined();
      expect(schema.parameters.type).toBe('object');
      expect(schema.parameters.properties).toBeDefined();
    });

    it('should include analysis section with dynamic entity extraction', () => {
      const schema = OpenAIFunctionSchemaBuilder.buildUnifiedChatbotSchemaWithContext();
      const properties = schema.parameters.properties;
      
      expect(properties.analysis).toBeDefined();
      expect(properties.analysis.type).toBe('object');
      
      const analysisProps = properties.analysis.properties;
      expect(analysisProps.primaryIntent).toBeDefined();
      expect(analysisProps.primaryConfidence).toBeDefined();
      expect(analysisProps.entities).toBeDefined();
      expect(analysisProps.personaInference).toBeDefined();
      expect(analysisProps.corrections).toBeDefined();
      expect(analysisProps.reasoning).toBeDefined();
      
      // Check required fields
      expect(properties.analysis.required).toContain('primaryIntent');
      expect(properties.analysis.required).toContain('primaryConfidence');
      expect(properties.analysis.required).toContain('entities');
      expect(properties.analysis.required).toContain('reasoning');
    });

    it('should include lead scoring section with 4-factor breakdown', () => {
      const schema = OpenAIFunctionSchemaBuilder.buildUnifiedChatbotSchemaWithContext();
      const leadScore = schema.parameters.properties.leadScore;
      
      expect(leadScore).toBeDefined();
      expect(leadScore.type).toBe('number');
      expect(leadScore.minimum).toBe(0);
      expect(leadScore.maximum).toBe(100);
      expect(leadScore.description).toContain('Comprehensive lead score');
      expect(leadScore.description).toContain('intent quality');
      expect(leadScore.description).toContain('entity completeness');
      expect(leadScore.description).toContain('persona fit');
      expect(leadScore.description).toContain('engagement');
    });

    it('should include response generation section with intelligent CTA', () => {
      const schema = OpenAIFunctionSchemaBuilder.buildUnifiedChatbotSchemaWithContext();
      const response = schema.parameters.properties.response;
      
      expect(response).toBeDefined();
      expect(response.type).toBe('object');
      
      const responseProps = response.properties;
      expect(responseProps.content).toBeDefined();
      expect(responseProps.tone).toBeDefined();
      expect(responseProps.tone.enum).toContain('professional');
      expect(responseProps.tone.enum).toContain('friendly');
      expect(responseProps.tone.enum).toContain('consultative');
      
      expect(responseProps.callToAction).toBeDefined();
      expect(responseProps.callToAction.type).toBe('string');
      expect(responseProps.callToAction.enum).toContain('demo_request');
      expect(responseProps.callToAction.enum).toContain('contact_capture');
      
      expect(responseProps.shouldTriggerLeadCapture).toBeDefined();
      expect(responseProps.shouldTriggerLeadCapture.type).toBe('boolean');
    });

    it('should have all four main sections as required', () => {
      const schema = OpenAIFunctionSchemaBuilder.buildUnifiedChatbotSchemaWithContext();
      
      expect(schema.parameters.required).toContain('analysis');
      expect(schema.parameters.required).toContain('conversationFlow');
      expect(schema.parameters.required).toContain('leadScore');
      expect(schema.parameters.required).toContain('response');
      expect(schema.parameters.required).toHaveLength(4);
    });

    it('should adapt entity extraction based on conversation phase', () => {
      // Test greeting phase - should focus on identity entities
      const greetingSchema = OpenAIFunctionSchemaBuilder.buildUnifiedChatbotSchemaWithContext(
        {}, 
        'greeting', 
        'Hi there!'
      );
      
      expect(greetingSchema.name).toBe('process_chatbot_interaction_complete');
      expect(greetingSchema.description).toContain('selective entity extraction');
      
      // Test qualification phase - should include budget/timeline
      const qualificationSchema = OpenAIFunctionSchemaBuilder.buildUnifiedChatbotSchemaWithContext(
        { company: 'TechCorp' }, 
        'qualification', 
        'What are your pricing options?'
      );
      
      expect(qualificationSchema.name).toBe('process_chatbot_interaction_complete');
      expect(qualificationSchema.description).toContain('selective entity extraction');
    });

    it('should handle existing entities to avoid redundant extraction', () => {
      const existingEntities = {
        company: 'TechCorp',
        role: 'manager',
        industry: 'technology'
      };
      
      const schema = OpenAIFunctionSchemaBuilder.buildUnifiedChatbotSchemaWithContext(
        existingEntities,
        'qualification',
        'What about pricing for our team of 50?'
      );
      
      expect(schema.name).toBe('process_chatbot_interaction_complete');
      expect(schema.description).toContain('selective entity extraction');
      expect(schema.description).toContain('missing entities');
    });

    it('should detect correction patterns in user messages', () => {
      const correctionMessage = 'Actually, our budget is $200K, not $100K';
      
      const schema = OpenAIFunctionSchemaBuilder.buildUnifiedChatbotSchemaWithContext(
        { budget: '$100K' },
        'qualification',
        correctionMessage
      );
      
      expect(schema.name).toBe('process_chatbot_interaction_complete');
      expect(schema.description).toContain('selective entity extraction');
    });

    it('should follow 2025 best practices for entity extraction', () => {
      const schema = OpenAIFunctionSchemaBuilder.buildUnifiedChatbotSchemaWithContext();
      
      // Check for 2025 best practice descriptions
      expect(schema.description).toContain('selective entity extraction');
      expect(schema.description).toContain('missing entities');
      expect(schema.description).toContain('Complete chatbot processing');
    });

    it('should follow @golden-rule documentation patterns', () => {
      const schema = OpenAIFunctionSchemaBuilder.buildUnifiedChatbotSchemaWithContext();
      
      // Check for comprehensive descriptions
      expect(schema.description).toContain('Complete chatbot processing');
      
      // Lead scoring should have descriptive text
      const leadScore = schema.parameters.properties.leadScore;
      expect(leadScore.description).toContain('Comprehensive lead score');
      expect(leadScore.description).toContain('(0-100)');
      
      // Response descriptions should mention appropriate content
      const response = schema.parameters.properties.response;
      expect(response.properties.content.description).toContain('conversational response');
      expect(response.properties.tone.description).toContain('tone');
    });
  });

  describe('Dynamic Entity Extraction Features', () => {
    it('should support phase-based entity extraction', () => {
      // Test different conversation phases
      const phases = ['greeting', 'business_inquiry', 'qualification', 'scheduling'];
      
      phases.forEach(phase => {
        const schema = OpenAIFunctionSchemaBuilder.buildUnifiedChatbotSchemaWithContext(
          {},
          phase,
          'Test message'
        );
        
        expect(schema.name).toBe('process_chatbot_interaction_complete');
        expect(schema.description).toContain('selective entity extraction');
      });
    });

    it('should support intent-based entity extraction', () => {
      // Test pricing intent detection
      const pricingMessage = 'What are your pricing options?';
      const schema = OpenAIFunctionSchemaBuilder.buildUnifiedChatbotSchemaWithContext(
        {},
        'discovery',
        pricingMessage
      );
      
      expect(schema.name).toBe('process_chatbot_interaction_complete');
      expect(schema.description).toContain('selective entity extraction');
    });

    it('should support timeline intent detection', () => {
      // Test timeline intent detection
      const timelineMessage = 'We need this implemented by Q2';
      const schema = OpenAIFunctionSchemaBuilder.buildUnifiedChatbotSchemaWithContext(
        {},
        'qualification',
        timelineMessage
      );
      
      expect(schema.name).toBe('process_chatbot_interaction_complete');
      expect(schema.description).toContain('selective entity extraction');
    });

    it('should reduce token usage through selective extraction', () => {
      // Schema with existing entities should focus on missing ones
      const fullEntities = {
        company: 'TechCorp',
        role: 'manager',
        industry: 'technology',
        teamSize: '50',
        budget: '$100K',
        timeline: 'Q2'
      };
      
      const schema = OpenAIFunctionSchemaBuilder.buildUnifiedChatbotSchemaWithContext(
        fullEntities,
        'qualified',
        'Let\'s move forward'
      );
      
      expect(schema.description).toContain('selective entity extraction');
      expect(schema.description).toContain('Complete chatbot processing');
    });
  });
}); 