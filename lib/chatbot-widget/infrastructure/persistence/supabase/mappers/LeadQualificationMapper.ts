/**
 * Lead Qualification Infrastructure Mapper
 * 
 * Infrastructure layer mapper for LeadQualificationQuestion objects.
 * Handles JSONB transformation for lead qualification question arrays.
 */

import { LeadQualificationQuestion } from '../../../../domain/entities/ChatbotConfig';

/**
 * Infrastructure mapper for LeadQualificationQuestion JSONB data
 * Handles question arrays with proper validation and defaults
 */
export class LeadQualificationMapper {
  
  /**
   * Map JSONB lead qualification questions data to domain objects
   * Infrastructure operation: JSONB array to domain objects transformation
   */
  static fromJsonb(data: unknown): LeadQualificationQuestion[] {
    if (!Array.isArray(data)) {
      return [];
    }

    return data.map((question: unknown) => this.mapQuestion(question));
  }

  /**
   * Map domain LeadQualificationQuestion array to JSONB data
   * Infrastructure operation: domain objects to JSONB array transformation
   */
  static toJsonb(questions: LeadQualificationQuestion[]): unknown {
    return questions;
  }

  /**
   * Map individual lead qualification question with validation and defaults
   * Infrastructure operation: single question object mapping
   */
  private static mapQuestion(question: unknown): LeadQualificationQuestion {
    const q = question as Record<string, unknown>;
    
    return {
      id: (q?.id as string) || crypto.randomUUID(),
      question: (q?.question as string) || '',
      type: (q?.type as 'text' | 'email' | 'phone' | 'select' | 'multiselect') || 'text',
      options: q?.options as string[] || undefined,
      isRequired: (q?.isRequired as boolean) || false,
      order: (q?.order as number) || 0,
      scoringWeight: (q?.scoringWeight as number) || 1,
    };
  }
}