/**
 * QualificationData Database Mapper
 * 
 * AI INSTRUCTIONS:
 * - Single responsibility: QualificationData value object mapping only
 * - Handle transformation between domain QualificationData and database JSONB
 * - Use domain-specific errors with proper context
 * - Stay under 120 lines
 */

import { QualificationData } from '../../../../domain/value-objects/lead-management/QualificationData';

// JSONB Database Interface for QualificationData
export interface QualificationDataJsonb {
  answeredQuestions: Array<{
    questionId: string;
    question: string;
    answer: string; // Domain allows string | string[], but JSONB stores as string
    answeredAt: string; // ISO date
    scoringWeight?: number; // Optional in JSONB, required in domain
    scoreContribution?: number; // Optional in JSONB, required in domain
  }>;
  engagementLevel: 'low' | 'medium' | 'high';
  budget?: string | null;
  timeline?: string | null;
  decisionMaker?: boolean | null;
  currentSolution?: string | null;
  painPoints: string[];
  industry?: string | null;
  companySize?: string | null;
}

/**
 * QualificationData Database Mapper
 * Handles transformation between QualificationData domain value object and database JSONB
 */
export class QualificationDataDatabaseMapper {
  /** Map JSONB qualification data to domain props */
  static mapQualificationData(data: QualificationDataJsonb) {
    return {
      budget: data.budget || undefined,
      timeline: data.timeline || undefined,
      decisionMaker: data.decisionMaker || undefined,
      companySize: data.companySize || undefined,
      industry: data.industry || undefined,
      currentSolution: data.currentSolution || undefined,
      painPoints: data.painPoints || [],
      interests: [], // Not in JSONB schema, defaulting to empty
      answeredQuestions: (data.answeredQuestions || []).map(q => ({
        questionId: q.questionId,
        question: q.question,
        answer: q.answer, // Keep as string to match JSONB
        answeredAt: new Date(q.answeredAt),
        scoringWeight: q.scoringWeight || 0, // Provide default for required field
        scoreContribution: q.scoreContribution || 0, // Provide default for required field
      })),
      engagementLevel: data.engagementLevel || 'low',
    };
  }

  /** Transform domain QualificationData to JSONB */
  static domainQualificationDataToJsonb(qualificationData: QualificationData): QualificationDataJsonb {
    const props = qualificationData.toPlainObject();
    return {
      answeredQuestions: (props.answeredQuestions || []).map(q => ({
        questionId: q.questionId,
        question: q.question,
        answer: Array.isArray(q.answer) ? q.answer.join(', ') : q.answer, // Convert array to string
        answeredAt: q.answeredAt.toISOString(),
        scoringWeight: q.scoringWeight,
        scoreContribution: q.scoreContribution,
      })),
      engagementLevel: props.engagementLevel || 'low',
      budget: props.budget || null,
      timeline: props.timeline || null,
      decisionMaker: props.decisionMaker || null,
      currentSolution: props.currentSolution || null,
      painPoints: props.painPoints || [],
      industry: props.industry || null,
      companySize: props.companySize || null,
    };
  }
}