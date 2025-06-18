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

  describe('buildUnifiedChatbotSchema', () => {
    it('should build a valid unified chatbot schema with all sections', () => {
      const schema = OpenAIFunctionSchemaBuilder.buildUnifiedChatbotSchema();
      
      expect(schema.name).toBe('process_chatbot_interaction_complete');
      expect(schema.description).toContain('Complete chatbot processing');
      expect(schema.description).toContain('analyze user intent');
      expect(schema.description).toContain('generate appropriate response');
      expect(schema.description).toContain('calculate lead score');
      expect(schema.parameters).toBeDefined();
      expect(schema.parameters.type).toBe('object');
      expect(schema.parameters.properties).toBeDefined();
    });

    it('should include analysis section with all required properties', () => {
      const schema = OpenAIFunctionSchemaBuilder.buildUnifiedChatbotSchema();
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

    it('should include lead scoring section with breakdown', () => {
      const schema = OpenAIFunctionSchemaBuilder.buildUnifiedChatbotSchema();
      const leadScore = schema.parameters.properties.leadScore;
      
      expect(leadScore).toBeDefined();
      expect(leadScore.type).toBe('object');
      
      const leadProps = leadScore.properties;
      expect(leadProps.totalScore).toBeDefined();
      expect(leadProps.totalScore.minimum).toBe(0);
      expect(leadProps.totalScore.maximum).toBe(100);
      
      expect(leadProps.scoreBreakdown).toBeDefined();
      const breakdown = leadProps.scoreBreakdown.properties;
      expect(breakdown.intentQuality).toBeDefined();
      expect(breakdown.entityCompleteness).toBeDefined();
      expect(breakdown.personaFit).toBeDefined();
      expect(breakdown.engagementLevel).toBeDefined();
      
      // Each breakdown should be 0-25 points
      Object.values(breakdown).forEach((prop: any) => {
        expect(prop.minimum).toBe(0);
        expect(prop.maximum).toBe(25);
      });
      
      expect(leadProps.qualificationStatus).toBeDefined();
      expect(leadProps.qualificationStatus.properties.isQualified).toBeDefined();
      expect(leadProps.qualificationStatus.properties.readyForSales).toBeDefined();
    });

    it('should include response generation section with CTA', () => {
      const schema = OpenAIFunctionSchemaBuilder.buildUnifiedChatbotSchema();
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
      const cta = responseProps.callToAction.properties;
      expect(cta.type).toBeDefined();
      expect(cta.type.enum).toContain('demo_request');
      expect(cta.type.enum).toContain('contact_capture');
      expect(cta.priority).toBeDefined();
      expect(cta.priority.enum).toContain('low');
      expect(cta.priority.enum).toContain('urgent');
      
      expect(responseProps.shouldTriggerLeadCapture).toBeDefined();
      expect(responseProps.shouldTriggerLeadCapture.type).toBe('boolean');
    });

    it('should have all three main sections as required', () => {
      const schema = OpenAIFunctionSchemaBuilder.buildUnifiedChatbotSchema();
      
      expect(schema.parameters.required).toContain('analysis');
      expect(schema.parameters.required).toContain('leadScore');
      expect(schema.parameters.required).toContain('response');
      expect(schema.parameters.required).toHaveLength(3);
    });

    it('should follow @golden-rule documentation patterns', () => {
      const schema = OpenAIFunctionSchemaBuilder.buildUnifiedChatbotSchema();
      
      // Check for comprehensive descriptions
      expect(schema.description).toContain('Complete chatbot processing');
      
      // Lead scoring descriptions should include point ranges
      const leadScore = schema.parameters.properties.leadScore;
      const breakdown = leadScore.properties.scoreBreakdown.properties;
      
      expect(breakdown.intentQuality.description).toContain('0-25 points');
      expect(breakdown.entityCompleteness.description).toContain('0-25 points');
      expect(breakdown.personaFit.description).toContain('0-25 points');
      expect(breakdown.engagementLevel.description).toContain('0-25 points');
      
      // Response descriptions should mention intent/persona awareness
      const response = schema.parameters.properties.response;
      expect(response.properties.content.description).toContain('intent analysis');
      expect(response.properties.content.description).toContain('persona');
    });
  });
}); 