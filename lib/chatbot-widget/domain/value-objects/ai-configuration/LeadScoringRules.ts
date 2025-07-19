/**
 * Lead Scoring Rules Value Object
 * 
 * Encapsulates lead scoring business logic and authority-based scoring
 * following DDD principles for the chatbot domain.
 */

import { LeadScoringEntities } from '../../types/ChatbotTypes';

export const LEAD_SCORING_RULES = {
  budget: 25,
  timeline: 20, 
  company: 15,
  industry: 10,
  teamSize: 15,
  urgency: 10,
  contactMethod: 5
} as const;

export const ROLE_AUTHORITY_WEIGHTS = {
  // C-Suite & Founders (Decision Makers) - 25 points
  'ceo': 25, 'chief executive officer': 25, 'chief executive': 25,
  'cto': 25, 'chief technology officer': 25, 'chief technical officer': 25,
  'cfo': 25, 'chief financial officer': 25,
  'coo': 25, 'chief operating officer': 25,
  'cmo': 25, 'chief marketing officer': 25,
  'cso': 25, 'chief security officer': 25,
  'cpo': 25, 'chief product officer': 25,
  'president': 25, 'founder': 25, 'co-founder': 25, 'owner': 25,
  'managing director': 25, 'executive director': 25,
  
  // Senior Leadership (Influencers) - 20 points  
  'vp': 20, 'vice president': 20, 'svp': 20, 'senior vice president': 20,
  'evp': 20, 'executive vice president': 20,
  'head of': 20, 'chief': 20, 'general manager': 20,
  
  // Mid-Level Management (Evaluators) - 15 points
  'director': 15, 'senior director': 15,
  'principal': 15, 'lead': 15, 'team lead': 15, 'tech lead': 15,
  'senior principal': 15, 'staff': 15,
  
  // Team Management (Users) - 10 points
  'manager': 10, 'senior manager': 10, 'project manager': 10,
  'product manager': 10, 'program manager': 10,
  'supervisor': 10, 'team leader': 10, 'scrum master': 10,
  
  // Senior Individual Contributors (Influencers) - 8 points
  'senior engineer': 8, 'senior developer': 8, 'senior analyst': 8,
  'senior consultant': 8, 'senior architect': 8, 'principal engineer': 8,
  'staff engineer': 8, 'senior specialist': 8,
  
  // Individual Contributors (End Users) - 5 points
  'engineer': 5, 'developer': 5, 'analyst': 5, 'consultant': 5,
  'specialist': 5, 'coordinator': 5, 'administrator': 5,
  'architect': 5, 'designer': 5, 'researcher': 5,
  
  // Entry Level (Researchers) - 2 points
  'associate': 2, 'junior': 2, 'intern': 2, 'trainee': 2,
  'assistant': 2, 'entry level': 2, 'graduate': 2
} as const;

export type LeadScoringRule = keyof typeof LEAD_SCORING_RULES;
export type RoleAuthorityLevel = keyof typeof ROLE_AUTHORITY_WEIGHTS;

/**
 * Lead Scoring Rules Value Object
 * Provides business logic for lead qualification and scoring
 */
export class LeadScoringRules {
  
  static getLeadScoringRules(): typeof LEAD_SCORING_RULES {
    return LEAD_SCORING_RULES;
  }

  static getLeadScoringWeight(entity: LeadScoringRule): number {
    return LEAD_SCORING_RULES[entity];
  }

  static getRoleAuthorityWeights(): typeof ROLE_AUTHORITY_WEIGHTS {
    return ROLE_AUTHORITY_WEIGHTS;
  }

  static getRoleAuthorityScore(role: string): number {
    if (!role) return 0;
    
    const normalizedRole = role.toLowerCase().trim();
    
    // Check for exact matches first
    if (normalizedRole in ROLE_AUTHORITY_WEIGHTS) {
      return ROLE_AUTHORITY_WEIGHTS[normalizedRole as keyof typeof ROLE_AUTHORITY_WEIGHTS];
    }
    
    // Check for partial matches (e.g., "VP of Sales" should match "vp")
    for (const [roleKey, score] of Object.entries(ROLE_AUTHORITY_WEIGHTS)) {
      if (normalizedRole.includes(roleKey)) {
        return score;
      }
    }
    
    // Default score for unknown roles (treated as individual contributor)
    return 5;
  }

  static calculateLeadScore(entities: LeadScoringEntities): number {
    let score = 0;
    
    // Handle role with authority-based scoring
    if (entities.role) {
      score += this.getRoleAuthorityScore(entities.role);
    }
    
    // Handle business info entities
    if (entities.businessInfo.company) {
      score += LEAD_SCORING_RULES.company || 0;
    }
    if (entities.businessInfo.industry) {
      score += LEAD_SCORING_RULES.industry || 0;
    }
    if (entities.businessInfo.size) {
      score += LEAD_SCORING_RULES.teamSize || 0;
    }
    
    // Handle intent signals
    if (entities.intentSignals.budget) {
      score += LEAD_SCORING_RULES.budget || 0;
    }
    if (entities.intentSignals.timeline) {
      score += LEAD_SCORING_RULES.timeline || 0;
    }
    if (entities.intentSignals.urgency) {
      score += LEAD_SCORING_RULES.urgency || 0;
    }
    
    // Handle contact info entities
    if (entities.contactInfo.email) {
      score += LEAD_SCORING_RULES.contactMethod || 0;
    }
    if (entities.contactInfo.phone) {
      score += LEAD_SCORING_RULES.contactMethod || 0;
    }
    
    return Math.min(score, 100);
  }

  static validateScoringRules(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validate scoring rules sum to reasonable total
    const totalPoints = Object.values(LEAD_SCORING_RULES).reduce((sum, points) => sum + points, 0);
    if (totalPoints > 150) {
      errors.push(`Lead scoring rules total ${totalPoints} points, which may be too high`);
    }

    // Validate authority weights are within reasonable ranges
    const authorityScores = Object.values(ROLE_AUTHORITY_WEIGHTS);
    const maxAuthorityScore = Math.max(...authorityScores);
    const minAuthorityScore = Math.min(...authorityScores);
    
    if (maxAuthorityScore > 30) {
      errors.push(`Maximum authority score ${maxAuthorityScore} is too high`);
    }
    
    if (minAuthorityScore < 0) {
      errors.push(`Minimum authority score ${minAuthorityScore} is negative`);
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  static getMaxPossibleScore(): number {
    const maxScoringRulePoints = Math.max(...Object.values(LEAD_SCORING_RULES));
    const maxAuthorityPoints = Math.max(...Object.values(ROLE_AUTHORITY_WEIGHTS));
    const maxContactMethodPoints = LEAD_SCORING_RULES.contactMethod * 2; // email + phone
    
    return Math.min(
      maxScoringRulePoints * Object.keys(LEAD_SCORING_RULES).length + 
      maxAuthorityPoints + 
      maxContactMethodPoints, 
      100
    );
  }

  static getScoreBreakdown(entities: LeadScoringEntities): Record<string, number> {
    const breakdown: Record<string, number> = {};
    
    if (entities.role) {
      breakdown.role = this.getRoleAuthorityScore(entities.role);
    }
    
    if (entities.businessInfo.company) {
      breakdown.company = LEAD_SCORING_RULES.company;
    }
    if (entities.businessInfo.industry) {
      breakdown.industry = LEAD_SCORING_RULES.industry;
    }
    if (entities.businessInfo.size) {
      breakdown.teamSize = LEAD_SCORING_RULES.teamSize;
    }
    
    if (entities.intentSignals.budget) {
      breakdown.budget = LEAD_SCORING_RULES.budget;
    }
    if (entities.intentSignals.timeline) {
      breakdown.timeline = LEAD_SCORING_RULES.timeline;
    }
    if (entities.intentSignals.urgency) {
      breakdown.urgency = LEAD_SCORING_RULES.urgency;
    }
    
    let contactMethodScore = 0;
    if (entities.contactInfo.email) {
      contactMethodScore += LEAD_SCORING_RULES.contactMethod;
    }
    if (entities.contactInfo.phone) {
      contactMethodScore += LEAD_SCORING_RULES.contactMethod;
    }
    if (contactMethodScore > 0) {
      breakdown.contactMethod = contactMethodScore;
    }
    
    return breakdown;
  }
}