/**
 * Entity Context Builder Service
 * 
 * Domain service responsible for building AI prompt contexts from accumulated entities
 * following DDD principles for the chatbot domain.
 */

import { AccumulatedEntities } from '../../value-objects/context/AccumulatedEntities';

export class EntityContextBuilder {
  
  static buildEntityContextPrompt(entities: AccumulatedEntities): string {
    const contextParts: string[] = [];
    
    // Personal Information (most important first)
    this.addPersonalContext(entities, contextParts);
    
    // Business Context
    this.addBusinessContext(entities, contextParts);
    
    // Business Requirements
    this.addRequirementsContext(entities, contextParts);
    
    // Accumulated Business Insights
    this.addInsightsContext(entities, contextParts);
    
    return contextParts.length > 0 
      ? `ACCUMULATED CONVERSATION CONTEXT:\n${contextParts.join('\n')}\n\n`
      : '';
  }

  private static addPersonalContext(entities: AccumulatedEntities, contextParts: string[]): void {
    if (entities.visitorName) {
      contextParts.push(`Visitor Name: ${entities.visitorName.value}`);
    }
    
    if (entities.role) {
      contextParts.push(`Role: ${entities.role.value}`);
    }
    
    if (entities.company) {
      contextParts.push(`Company: ${entities.company.value}`);
    }
  }

  private static addBusinessContext(entities: AccumulatedEntities, contextParts: string[]): void {
    if (entities.industry) {
      contextParts.push(`Industry: ${entities.industry.value}`);
    }
    
    if (entities.teamSize) {
      contextParts.push(`Team size: ${entities.teamSize.value}`);
    }
  }

  private static addRequirementsContext(entities: AccumulatedEntities, contextParts: string[]): void {
    if (entities.budget) {
      const age = this.getEntityAge(entities.budget.extractedAt);
      contextParts.push(`Budget mentioned: ${entities.budget.value} (${age})`);
    }
    
    if (entities.timeline) {
      const age = this.getEntityAge(entities.timeline.extractedAt);
      contextParts.push(`Timeline mentioned: ${entities.timeline.value} (${age})`);
    }
    
    if (entities.urgency) {
      contextParts.push(`Urgency level: ${entities.urgency.value}`);
    }
  }

  private static addInsightsContext(entities: AccumulatedEntities, contextParts: string[]): void {
    if (entities.decisionMakers.length > 0) {
      const makers = entities.decisionMakers.map(dm => dm.value).join(', ');
      contextParts.push(`Decision makers identified: ${makers}`);
    }
    
    if (entities.goals.length > 0) {
      const goals = entities.goals.map(g => g.value).join(', ');
      contextParts.push(`Goals mentioned: ${goals}`);
    }
    
    if (entities.painPoints.length > 0) {
      const points = entities.painPoints.map(pp => pp.value).join(', ');
      contextParts.push(`Pain points mentioned: ${points}`);
    }
  }

  private static getEntityAge(extractedAt: Date | string): string {
    const now = new Date();
    
    try {
      const extractedDate = extractedAt instanceof Date ? extractedAt : new Date(extractedAt);
      
      if (isNaN(extractedDate.getTime())) {
        return 'unknown';
      }
      
      const diffMs = now.getTime() - extractedDate.getTime();
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffMinutes = Math.floor(diffMs / (1000 * 60));

      if (diffHours > 0) {
        return `${diffHours}h ago`;
      } else if (diffMinutes > 0) {
        return `${diffMinutes}m ago`;
      } else {
        return 'just now';
      }
    } catch {
      return 'unknown';
    }
  }

  static buildContextSummary(entities: AccumulatedEntities): {
    personalInfo: string[];
    businessInfo: string[];
    requirements: string[];
    insights: string[];
  } {
    return {
      personalInfo: this.getPersonalInfoSummary(entities),
      businessInfo: this.getBusinessInfoSummary(entities),
      requirements: this.getRequirementsSummary(entities),
      insights: this.getInsightsSummary(entities)
    };
  }

  private static getPersonalInfoSummary(entities: AccumulatedEntities): string[] {
    const summary: string[] = [];
    
    if (entities.visitorName) summary.push(`Name: ${entities.visitorName.value}`);
    if (entities.role) summary.push(`Role: ${entities.role.value}`);
    if (entities.company) summary.push(`Company: ${entities.company.value}`);
    
    return summary;
  }

  private static getBusinessInfoSummary(entities: AccumulatedEntities): string[] {
    const summary: string[] = [];
    
    if (entities.industry) summary.push(`Industry: ${entities.industry.value}`);
    if (entities.teamSize) summary.push(`Team Size: ${entities.teamSize.value}`);
    
    return summary;
  }

  private static getRequirementsSummary(entities: AccumulatedEntities): string[] {
    const summary: string[] = [];
    
    if (entities.budget) summary.push(`Budget: ${entities.budget.value}`);
    if (entities.timeline) summary.push(`Timeline: ${entities.timeline.value}`);
    if (entities.urgency) summary.push(`Urgency: ${entities.urgency.value}`);
    
    return summary;
  }

  private static getInsightsSummary(entities: AccumulatedEntities): string[] {
    const summary: string[] = [];
    
    if (entities.decisionMakers.length > 0) {
      summary.push(`Decision Makers: ${entities.decisionMakers.length} identified`);
    }
    if (entities.goals.length > 0) {
      summary.push(`Goals: ${entities.goals.length} mentioned`);
    }
    if (entities.painPoints.length > 0) {
      summary.push(`Pain Points: ${entities.painPoints.length} identified`);
    }
    
    return summary;
  }
}