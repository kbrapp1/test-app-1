import { Lead } from '../../../../domain/entities/Lead';

/**
 * EngagementAnalyzer
 * 
 * AI INSTRUCTIONS:
 * - Single responsibility: Analyze lead engagement levels and patterns
 * - Apply business rules for engagement assessment
 * - Keep under 120 lines, focused on engagement analysis only
 * - Use pure functions with no side effects
 * - Follow @golden-rule patterns exactly
 */

export class EngagementAnalyzer {
  /**
   * Check if lead shows sufficient engagement
   */
  static hasEngagement(lead: Lead): boolean {
    return this.hasHighEngagementLevel(lead) ||
           this.hasAnsweredQuestions(lead) ||
           this.hasIdentifiedInterests(lead);
  }

  /**
   * Check if lead has high engagement level
   */
  static hasHighEngagementLevel(lead: Lead): boolean {
    return lead.qualificationData.engagementLevel === 'high';
  }

  /**
   * Check if lead answered qualification questions
   */
  static hasAnsweredQuestions(lead: Lead): boolean {
    return lead.qualificationData.answeredQuestions.length > 0;
  }

  /**
   * Check if lead has identified interests
   */
  static hasIdentifiedInterests(lead: Lead): boolean {
    return lead.qualificationData.interests.length > 0;
  }

  /**
   * Check if lead completed qualification process
   */
  static hasCompletedQualification(lead: Lead): boolean {
    // Consider completed if they answered at least 2 questions
    return lead.qualificationData.answeredQuestions.length >= 2;
  }

  /**
   * Get engagement score (0-100)
   */
  static getEngagementScore(lead: Lead): number {
    let score = 0;

    // Base engagement level scoring
    switch (lead.qualificationData.engagementLevel) {
      case 'high':
        score += 40;
        break;
      case 'medium':
        score += 25;
        break;
      case 'low':
        score += 10;
        break;
      default:
        score += 0;
    }

    // Question answering bonus
    const questionsAnswered = lead.qualificationData.answeredQuestions.length;
    score += Math.min(questionsAnswered * 15, 30); // Max 30 points for questions

    // Interests identification bonus
    const interestsCount = lead.qualificationData.interests.length;
    score += Math.min(interestsCount * 10, 20); // Max 20 points for interests

    // Pain points identification bonus
    const painPointsCount = lead.qualificationData.painPoints.length;
    score += Math.min(painPointsCount * 5, 10); // Max 10 points for pain points

    return Math.min(score, 100);
  }

  /**
   * Get engagement level description
   */
  static getEngagementDescription(lead: Lead): string {
    const score = this.getEngagementScore(lead);
    
    if (score >= 80) {
      return 'Highly engaged - actively participating and providing detailed information';
    } else if (score >= 60) {
      return 'Well engaged - showing interest and answering questions';
    } else if (score >= 40) {
      return 'Moderately engaged - some interaction but limited depth';
    } else if (score >= 20) {
      return 'Low engagement - minimal interaction';
    } else {
      return 'Very low engagement - passive interaction only';
    }
  }

  /**
   * Get engagement strengths
   */
  static getEngagementStrengths(lead: Lead): string[] {
    const strengths: string[] = [];

    if (this.hasHighEngagementLevel(lead)) {
      strengths.push('High overall engagement level');
    }

    if (lead.qualificationData.answeredQuestions.length >= 3) {
      strengths.push('Answered multiple qualification questions');
    }

    if (lead.qualificationData.interests.length >= 2) {
      strengths.push('Identified multiple areas of interest');
    }

    if (lead.qualificationData.painPoints.length > 0) {
      strengths.push('Shared specific pain points');
    }

    return strengths;
  }

  /**
   * Get engagement concerns
   */
  static getEngagementConcerns(lead: Lead): string[] {
    const concerns: string[] = [];

    if (lead.qualificationData.engagementLevel === 'low') {
      concerns.push('Low overall engagement level');
    }

    if (lead.qualificationData.answeredQuestions.length === 0) {
      concerns.push('No qualification questions answered');
    }

    if (lead.qualificationData.interests.length === 0) {
      concerns.push('No interests identified');
    }

    if (lead.qualificationData.painPoints.length === 0) {
      concerns.push('No pain points shared');
    }

    return concerns;
  }
} 