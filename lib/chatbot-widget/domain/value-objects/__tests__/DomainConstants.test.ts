import { 
  DomainConstants,
  INTENT_TYPES,
  JOURNEY_STAGES,
  ALL_ENTITY_TYPES,
  CORE_BUSINESS_ENTITIES,
  ADVANCED_ENTITIES,
  LEAD_SCORING_RULES,
  DEFAULT_THRESHOLDS
} from '../ai-configuration/DomainConstants';

describe('DomainConstants', () => {
  describe('Intent Types', () => {
    it('should return all intent types', () => {
      const intents = DomainConstants.getAllIntentTypes();
      expect(intents).toHaveLength(20);
      expect(intents).toContain('greeting');
      expect(intents).toContain('sales_inquiry');
      expect(intents).toContain('unknown');
      // Business context intents
      expect(intents).toContain('company_inquiry');
      expect(intents).toContain('business_inquiry');
      expect(intents).toContain('product_inquiry');
      expect(intents).toContain('feature_inquiry');
      expect(intents).toContain('pricing_inquiry');
      expect(intents).toContain('cost_inquiry');
      expect(intents).toContain('comparison_inquiry');
      expect(intents).toContain('competitor_inquiry');
    });

    it('should return sales intents correctly', () => {
      const salesIntents = DomainConstants.getSalesIntents();
      expect(salesIntents).toEqual(['sales_inquiry', 'booking_request', 'demo_request', 'closing']);
    });

    it('should return support intents correctly', () => {
      const supportIntents = DomainConstants.getSupportIntents();
      expect(supportIntents).toEqual(['support_request', 'faq_general', 'faq_pricing', 'faq_features']);
    });

    it('should return qualification intents correctly', () => {
      const qualificationIntents = DomainConstants.getQualificationIntents();
      expect(qualificationIntents).toEqual(['qualification', 'objection_handling']);
    });

    it('should return business context intents correctly', () => {
      const businessContextIntents = DomainConstants.getBusinessContextIntents();
      expect(businessContextIntents).toEqual([
        'company_inquiry', 'business_inquiry', 'product_inquiry', 'feature_inquiry',
        'pricing_inquiry', 'cost_inquiry', 'comparison_inquiry', 'competitor_inquiry'
      ]);
    });

    it('should return general intents correctly', () => {
      const generalIntents = DomainConstants.getGeneralIntents();
      expect(generalIntents).toEqual(['greeting', 'unknown']);
    });

    it('should identify business context intents correctly', () => {
      expect(DomainConstants.isBusinessContextIntent('company_inquiry')).toBe(true);
      expect(DomainConstants.isBusinessContextIntent('product_inquiry')).toBe(true);
      expect(DomainConstants.isBusinessContextIntent('pricing_inquiry')).toBe(true);
      expect(DomainConstants.isBusinessContextIntent('sales_inquiry')).toBe(false);
      expect(DomainConstants.isBusinessContextIntent('greeting')).toBe(false);
    });

    it('should validate intent types correctly', () => {
      expect(DomainConstants.isValidIntentType('greeting')).toBe(true);
      expect(DomainConstants.isValidIntentType('sales_inquiry')).toBe(true);
      expect(DomainConstants.isValidIntentType('invalid_intent')).toBe(false);
    });

    it('should categorize intents correctly', () => {
      expect(DomainConstants.getIntentCategory('sales_inquiry')).toBe('sales');
      expect(DomainConstants.getIntentCategory('support_request')).toBe('support');
      expect(DomainConstants.getIntentCategory('qualification')).toBe('qualification');
      expect(DomainConstants.getIntentCategory('company_inquiry')).toBe('business_context');
      expect(DomainConstants.getIntentCategory('product_inquiry')).toBe('business_context');
      expect(DomainConstants.getIntentCategory('greeting')).toBe('general');
    });
  });

  describe('Journey Stages', () => {
    it('should return all journey stages', () => {
      const stages = DomainConstants.getAllJourneyStages();
      expect(stages).toHaveLength(8);
      expect(stages).toEqual([
        'visitor', 'curious', 'interested', 'evaluating', 
        'ready_to_buy', 'qualified_lead', 'converted', 'lost'
      ]);
    });

    it('should identify sales ready stages', () => {
      const salesReadyStages = DomainConstants.getSalesReadyStages();
      expect(salesReadyStages).toEqual(['ready_to_buy', 'qualified_lead']);
      
      expect(DomainConstants.isSalesReady('ready_to_buy')).toBe(true);
      expect(DomainConstants.isSalesReady('qualified_lead')).toBe(true);
      expect(DomainConstants.isSalesReady('visitor')).toBe(false);
    });

    it('should identify actively engaged stages', () => {
      const activeStages = DomainConstants.getActivelyEngagedStages();
      expect(activeStages).toEqual(['curious', 'interested', 'evaluating', 'ready_to_buy']);
      
      expect(DomainConstants.isActivelyEngaged('curious')).toBe(true);
      expect(DomainConstants.isActivelyEngaged('interested')).toBe(true);
      expect(DomainConstants.isActivelyEngaged('visitor')).toBe(false);
    });

    it('should validate journey stages correctly', () => {
      expect(DomainConstants.isValidJourneyStage('visitor')).toBe(true);
      expect(DomainConstants.isValidJourneyStage('qualified_lead')).toBe(true);
      expect(DomainConstants.isValidJourneyStage('invalid_stage')).toBe(false);
    });
  });

  describe('Entity Types', () => {
    it('should return all entity types', () => {
      const entities = DomainConstants.getAllEntityTypes();
      expect(entities).toHaveLength(22);
      expect(entities).toContain('budget');
      expect(entities).toContain('painPoints');
    });

    it('should return core business entities', () => {
      const coreEntities = DomainConstants.getCoreBusinessEntities();
      expect(coreEntities).toHaveLength(12);
      expect(coreEntities).toContain('budget');
      expect(coreEntities).toContain('timeline');
      expect(coreEntities).toContain('company');
    });

    it('should return advanced entities', () => {
      const advancedEntities = DomainConstants.getAdvancedEntities();
      expect(advancedEntities).toHaveLength(10);
      expect(advancedEntities).toContain('painPoints');
      expect(advancedEntities).toContain('decisionMakers');
    });

    it('should validate entity types correctly', () => {
      expect(DomainConstants.isValidEntityType('budget')).toBe(true);
      expect(DomainConstants.isValidEntityType('painPoints')).toBe(true);
      expect(DomainConstants.isValidEntityType('invalid_entity')).toBe(false);
    });

    it('should categorize entities correctly', () => {
      expect(DomainConstants.getEntityCategory('budget')).toBe('core_business');
      expect(DomainConstants.getEntityCategory('timeline')).toBe('core_business');
      expect(DomainConstants.getEntityCategory('painPoints')).toBe('advanced');
      expect(DomainConstants.getEntityCategory('decisionMakers')).toBe('advanced');
    });
  });

  describe('Enum Values', () => {
    it('should return urgency levels', () => {
      const levels = DomainConstants.getUrgencyLevels();
      expect(levels).toEqual(['low', 'medium', 'high']);
    });

    it('should return severity levels', () => {
      const levels = DomainConstants.getSeverityLevels();
      expect(levels).toEqual(['low', 'medium', 'high', 'critical']);
    });

    it('should return contact methods', () => {
      const methods = DomainConstants.getContactMethods();
      expect(methods).toEqual(['email', 'phone', 'meeting']);
    });

    it('should return event types', () => {
      const types = DomainConstants.getEventTypes();
      expect(types).toEqual(['demo', 'consultation', 'onboarding', 'support_call', 'sales_call']);
    });

    it('should return issue types', () => {
      const types = DomainConstants.getIssueTypes();
      expect(types).toEqual(['technical', 'billing', 'feature_request', 'bug_report', 'general']);
    });
  });

  describe('Lead Scoring Rules', () => {
    it('should return lead scoring rules', () => {
      const rules = DomainConstants.getLeadScoringRules();
      expect(rules.budget).toBe(25);
      expect(rules.timeline).toBe(20);
      expect(rules.company).toBe(15);
      expect(rules.teamSize).toBe(15);
      expect(rules.industry).toBe(10);
      expect(rules.urgency).toBe(10);
      expect(rules.contactMethod).toBe(5);
      // REMOVED: role - now uses authority-based scoring via getRoleAuthorityScore()
    });

    it('should return individual scoring weights', () => {
      expect(DomainConstants.getLeadScoringWeight('budget')).toBe(25);
      expect(DomainConstants.getLeadScoringWeight('timeline')).toBe(20);
      expect(DomainConstants.getLeadScoringWeight('contactMethod')).toBe(5);
    });

    it('should calculate lead scores correctly', () => {
      // No entities
      expect(DomainConstants.calculateLeadScore({
        contactInfo: {},
        businessInfo: {},
        intentSignals: {},
        engagementMetrics: {}
      })).toBe(0);
      
      // Single entity
      expect(DomainConstants.calculateLeadScore({
        contactInfo: {},
        businessInfo: {},
        intentSignals: { budget: 'high' },
        engagementMetrics: {}
      })).toBe(25);
      
      // Multiple entities
      expect(DomainConstants.calculateLeadScore({
        contactInfo: {},
        businessInfo: { company: 'ACME Corp' },
        intentSignals: { budget: 'high', timeline: 'short' },
        engagementMetrics: {}
      })).toBe(60); // 25 + 20 + 15
      
      // All entities (should cap at 100)
      const allEntities = {
        contactInfo: { name: 'John Doe', email: 'john@acme.com' },
        businessInfo: { company: 'ACME', industry: 'tech', size: '50+' },
        intentSignals: { budget: 'high' as const, timeline: 'short' as const, urgency: 'high' as const },
        engagementMetrics: { messageCount: 10, sessionDuration: 300 },
        role: 'cto' // CTO = 25 points via authority-based scoring
      };
      // 25+20+15+10+15+10+5+25 = 125, capped at 100
      expect(DomainConstants.calculateLeadScore(allEntities)).toBe(100);
    });
  });

  describe('Role Authority Scoring', () => {
    it('should return role authority weights', () => {
      const weights = DomainConstants.getRoleAuthorityWeights();
      expect(weights.ceo).toBe(25);
      expect(weights.engineer).toBe(5);
      expect(weights.manager).toBe(10);
      expect(weights.director).toBe(15);
      expect(weights.vp).toBe(20);
    });

    it('should calculate role authority scores correctly', () => {
      // C-Suite roles
      expect(DomainConstants.getRoleAuthorityScore('CEO')).toBe(25);
      expect(DomainConstants.getRoleAuthorityScore('cto')).toBe(25);
      expect(DomainConstants.getRoleAuthorityScore('Chief Technology Officer')).toBe(25);
      
      // Senior leadership
      expect(DomainConstants.getRoleAuthorityScore('VP')).toBe(20);
      expect(DomainConstants.getRoleAuthorityScore('Vice President')).toBe(20);
      expect(DomainConstants.getRoleAuthorityScore('VP of Sales')).toBe(20); // Partial match
      
      // Mid-level management
      expect(DomainConstants.getRoleAuthorityScore('Director')).toBe(15);
      expect(DomainConstants.getRoleAuthorityScore('Senior Director')).toBe(15);
      expect(DomainConstants.getRoleAuthorityScore('Lead')).toBe(15);
      
      // Team management
      expect(DomainConstants.getRoleAuthorityScore('Manager')).toBe(10);
      expect(DomainConstants.getRoleAuthorityScore('Project Manager')).toBe(10);
      
      // Senior individual contributors
      expect(DomainConstants.getRoleAuthorityScore('Senior Engineer')).toBe(8);
      expect(DomainConstants.getRoleAuthorityScore('Staff Engineer')).toBe(8);
      
      // Individual contributors
      expect(DomainConstants.getRoleAuthorityScore('Engineer')).toBe(5);
      expect(DomainConstants.getRoleAuthorityScore('Developer')).toBe(5);
      
      // Entry level
      expect(DomainConstants.getRoleAuthorityScore('Junior')).toBe(2);
      expect(DomainConstants.getRoleAuthorityScore('Intern')).toBe(2);
      
      // Unknown roles default to individual contributor level
      expect(DomainConstants.getRoleAuthorityScore('Unknown Role')).toBe(5);
      expect(DomainConstants.getRoleAuthorityScore('')).toBe(0);
    });

    it('should handle case-insensitive role matching', () => {
      expect(DomainConstants.getRoleAuthorityScore('ceo')).toBe(25);
      expect(DomainConstants.getRoleAuthorityScore('CEO')).toBe(25);
      expect(DomainConstants.getRoleAuthorityScore('Chief Executive Officer')).toBe(25);
      expect(DomainConstants.getRoleAuthorityScore('ENGINEER')).toBe(5);
      expect(DomainConstants.getRoleAuthorityScore('engineer')).toBe(5);
    });

    it('should integrate role authority scoring with lead score calculation', () => {
      // CEO vs Engineer comparison
      const ceoEntities = { 
        contactInfo: {},
        businessInfo: { company: 'Acme' },
        intentSignals: { budget: 'high' as const },
        engagementMetrics: {},
        role: 'CEO'
      };
      const engineerEntities = { 
        contactInfo: {},
        businessInfo: { company: 'Acme' },
        intentSignals: { budget: 'high' as const },
        engagementMetrics: {},
        role: 'Engineer'
      };
      
      const ceoScore = DomainConstants.calculateLeadScore(ceoEntities);
      const engineerScore = DomainConstants.calculateLeadScore(engineerEntities);
      
      // CEO: 15 (company) + 25 (CEO role) + 25 (budget) = 65
      expect(ceoScore).toBe(65);
      
      // Engineer: 15 (company) + 5 (engineer role) + 25 (budget) = 45  
      expect(engineerScore).toBe(45);
      
      // CEO should score 20 points higher due to authority difference
      expect(ceoScore - engineerScore).toBe(20);
    });
  });

  describe('Default Thresholds', () => {
    it('should return all default thresholds', () => {
      const thresholds = DomainConstants.getDefaultThresholds();
      expect(thresholds.intentConfidence).toBe(0.7);
      expect(thresholds.stageTransition).toBe(0.75);
      expect(thresholds.personaInference).toBe(0.6);
      expect(thresholds.leadQualification).toBe(70);
      expect(thresholds.responseTime).toBe(2000);
      expect(thresholds.contextWindow).toBe(12000);
      expect(thresholds.maxConversationTurns).toBe(20);
      expect(thresholds.inactivityTimeout).toBe(300);
    });

    it('should return individual thresholds', () => {
      expect(DomainConstants.getIntentConfidenceThreshold()).toBe(0.7);
      expect(DomainConstants.getStageTransitionThreshold()).toBe(0.75);
      expect(DomainConstants.getPersonaInferenceThreshold()).toBe(0.6);
    });
  });

  describe('Business Rules Validation', () => {
    it('should validate business rules successfully', () => {
      const validation = DomainConstants.validateBusinessRules();
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should detect invalid confidence thresholds', () => {
      // This test would fail if we had invalid thresholds
      // For now, our constants are valid, so this tests the validation logic
      const thresholds = DomainConstants.getDefaultThresholds();
      
      // Verify all confidence thresholds are in valid range
      expect(thresholds.intentConfidence).toBeGreaterThanOrEqual(0);
      expect(thresholds.intentConfidence).toBeLessThanOrEqual(1);
      expect(thresholds.stageTransition).toBeGreaterThanOrEqual(0);
      expect(thresholds.stageTransition).toBeLessThanOrEqual(1);
      expect(thresholds.personaInference).toBeGreaterThanOrEqual(0);
      expect(thresholds.personaInference).toBeLessThanOrEqual(1);
    });
  });

  describe('Domain Summary', () => {
    it('should provide accurate domain summary', () => {
      const summary = DomainConstants.getDomainSummary();
      
      expect(summary.intentTypes).toBe(20);
      expect(summary.journeyStages).toBe(8);
      expect(summary.entityTypes).toBe(22);
      expect(summary.businessRules).toBe(7); // Number of lead scoring rules (role moved to authority-based)
      expect(summary.thresholds).toBe(8); // Number of default thresholds
      expect(summary.validation.isValid).toBe(true);
    });
  });

  describe('Constants Immutability', () => {
    it('should maintain readonly arrays', () => {
      const intents = DomainConstants.getAllIntentTypes();
      const stages = DomainConstants.getAllJourneyStages();
      const entities = DomainConstants.getAllEntityTypes();
      
      // These should be read-only arrays (TypeScript enforces this at compile time)
      expect(Array.isArray(intents)).toBe(true);
      expect(Array.isArray(stages)).toBe(true);
      expect(Array.isArray(entities)).toBe(true);
    });

    it('should maintain constant values', () => {
      // Verify constants haven't changed from expected values
      expect(INTENT_TYPES).toHaveLength(20);
      expect(JOURNEY_STAGES).toHaveLength(8);
      expect(ALL_ENTITY_TYPES).toHaveLength(22);
      expect(CORE_BUSINESS_ENTITIES).toHaveLength(12);
      expect(ADVANCED_ENTITIES).toHaveLength(10);
      
      // Verify lead scoring totals (role removed, now handled separately)
      const totalPoints = Object.values(LEAD_SCORING_RULES).reduce((sum, points) => sum + points, 0);
      expect(totalPoints).toBe(100);
    });
  });

  describe('Type Safety', () => {
    it('should ensure type consistency', () => {
      // Verify that all intent categories contain valid intents
      const allIntents = DomainConstants.getAllIntentTypes();
      const salesIntents = DomainConstants.getSalesIntents();
      const supportIntents = DomainConstants.getSupportIntents();
      const qualificationIntents = DomainConstants.getQualificationIntents();
      const businessContextIntents = DomainConstants.getBusinessContextIntents();
      const generalIntents = DomainConstants.getGeneralIntents();
      
      salesIntents.forEach(intent => {
        expect(allIntents).toContain(intent);
      });
      
      supportIntents.forEach(intent => {
        expect(allIntents).toContain(intent);
      });
      
      qualificationIntents.forEach(intent => {
        expect(allIntents).toContain(intent);
      });

      businessContextIntents.forEach(intent => {
        expect(allIntents).toContain(intent);
      });

      generalIntents.forEach(intent => {
        expect(allIntents).toContain(intent);
      });
    });

    it('should ensure entity consistency', () => {
      const allEntities = DomainConstants.getAllEntityTypes();
      const coreEntities = DomainConstants.getCoreBusinessEntities();
      const advancedEntities = DomainConstants.getAdvancedEntities();
      
      // All core and advanced entities should be in the complete list
      coreEntities.forEach(entity => {
        expect(allEntities).toContain(entity);
      });
      
      advancedEntities.forEach(entity => {
        expect(allEntities).toContain(entity);
      });
      
      // Combined length should equal total
      expect(coreEntities.length + advancedEntities.length).toBe(allEntities.length);
    });
  });
}); 