/**
 * Entity Corrections Value Object
 * 
 * AI INSTRUCTIONS:
 * - Immutable value object representing entity corrections and removals
 * - Handle both explicit corrections and removal operations
 * - Support metadata tracking for audit trails
 * - Follow @golden-rule patterns exactly
 * - Keep under 200 lines with focused responsibility
 * - Use domain-specific validation and errors
 * - Never expose mutable state
 */

import { BusinessRuleViolationError } from '../../errors/ChatbotWidgetDomainErrors';
import { EntityValue, EntityChange } from '../../types/ChatbotTypes';

export interface CorrectionMetadata {
  timestamp: Date;
  sourceMessageId: string;
  confidence: number;
  correctionReason?: string;
}

export interface RemovalOperation {
  entityValue: string;
  metadata: CorrectionMetadata;
}

export interface CorrectionOperation<T = string> {
  newValue: T;
  previousValue?: T;
  metadata: CorrectionMetadata;
}

export interface EntityCorrectionsProps {
  // Array entity removals
  removedDecisionMakers: RemovalOperation[];
  removedPainPoints: RemovalOperation[];
  removedIntegrationNeeds: RemovalOperation[];
  removedEvaluationCriteria: RemovalOperation[];
  
  // Single entity corrections
  correctedBudget: CorrectionOperation | null;
  correctedTimeline: CorrectionOperation | null;
  correctedUrgency: CorrectionOperation<'low'|'medium'|'high'> | null;
  correctedContactMethod: CorrectionOperation<'email'|'phone'|'meeting'> | null;
  correctedRole: CorrectionOperation | null;
  correctedIndustry: CorrectionOperation | null;
  correctedCompany: CorrectionOperation | null;
  correctedTeamSize: CorrectionOperation | null;
  
  // Metadata
  totalCorrections: number;
  lastCorrectionAt: Date;
  correctionSessionId: string;
}

export class EntityCorrections {
  private constructor(private readonly props: EntityCorrectionsProps) {
    this.validateInvariants();
  }
  
  static create(
    sessionId: string,
    props?: Partial<Omit<EntityCorrectionsProps, 'totalCorrections' | 'lastCorrectionAt' | 'correctionSessionId'>>
  ): EntityCorrections {
    const correctionProps: EntityCorrectionsProps = {
      removedDecisionMakers: [],
      removedPainPoints: [],
      removedIntegrationNeeds: [],
      removedEvaluationCriteria: [],
      correctedBudget: null,
      correctedTimeline: null,
      correctedUrgency: null,
      correctedContactMethod: null,
      correctedRole: null,
      correctedIndustry: null,
      correctedCompany: null,
      correctedTeamSize: null,
      totalCorrections: 0,
      lastCorrectionAt: new Date(),
      correctionSessionId: sessionId,
      ...props
    };
    
    // Calculate total corrections
    correctionProps.totalCorrections = EntityCorrections.calculateTotalCorrections(correctionProps);
    
    return new EntityCorrections(correctionProps);
  }
  
  // Getters for immutable access
  get removedDecisionMakers(): RemovalOperation[] { return [...this.props.removedDecisionMakers]; }
  get removedPainPoints(): RemovalOperation[] { return [...this.props.removedPainPoints]; }
  get removedIntegrationNeeds(): RemovalOperation[] { return [...this.props.removedIntegrationNeeds]; }
  get removedEvaluationCriteria(): RemovalOperation[] { return [...this.props.removedEvaluationCriteria]; }
  get correctedBudget(): CorrectionOperation | null { return this.props.correctedBudget; }
  get correctedTimeline(): CorrectionOperation | null { return this.props.correctedTimeline; }
  get correctedUrgency(): CorrectionOperation<'low'|'medium'|'high'> | null { return this.props.correctedUrgency; }
  get correctedContactMethod(): CorrectionOperation<'email'|'phone'|'meeting'> | null { return this.props.correctedContactMethod; }
  get correctedRole(): CorrectionOperation | null { return this.props.correctedRole; }
  get correctedIndustry(): CorrectionOperation | null { return this.props.correctedIndustry; }
  get correctedCompany(): CorrectionOperation | null { return this.props.correctedCompany; }
  get correctedTeamSize(): CorrectionOperation | null { return this.props.correctedTeamSize; }
  get totalCorrections(): number { return this.props.totalCorrections; }
  get lastCorrectionAt(): Date { return this.props.lastCorrectionAt; }
  get correctionSessionId(): string { return this.props.correctionSessionId; }
  
  // Business methods for adding corrections
  withRemovedEntity(
    entityType: 'decisionMakers'|'painPoints'|'integrationNeeds'|'evaluationCriteria',
    entityValue: string,
    messageId: string,
    confidence: number = 0.9,
    reason?: string
  ): EntityCorrections {
    this.validateRemovalInput(entityValue, messageId, confidence);
    
    const removal: RemovalOperation = {
      entityValue: entityValue.trim(),
      metadata: {
        timestamp: new Date(),
        sourceMessageId: messageId,
        confidence,
        correctionReason: reason
      }
    };
    
    const propertyKey = `removed${this.capitalizeFirst(entityType)}` as keyof EntityCorrectionsProps;
    const existingRemovals = this.props[propertyKey] as RemovalOperation[];
    
    return new EntityCorrections({
      ...this.props,
      [propertyKey]: [...existingRemovals, removal],
      totalCorrections: this.props.totalCorrections + 1,
      lastCorrectionAt: new Date()
    });
  }
  
  withCorrectedEntity<T extends string | 'low'|'medium'|'high' | 'email'|'phone'|'meeting'>(
    entityType: 'budget'|'timeline'|'urgency'|'contactMethod'|'role'|'industry'|'company'|'teamSize',
    newValue: T,
    messageId: string,
    previousValue?: T,
    confidence: number = 0.9,
    reason?: string
  ): EntityCorrections {
    this.validateCorrectionInput(newValue as unknown, messageId, confidence);
    
    const correction: CorrectionOperation<T> = {
      newValue,
      previousValue,
      metadata: {
        timestamp: new Date(),
        sourceMessageId: messageId,
        confidence,
        correctionReason: reason
      }
    };
    
    const propertyKey = `corrected${this.capitalizeFirst(entityType)}` as keyof EntityCorrectionsProps;
    
    return new EntityCorrections({
      ...this.props,
      [propertyKey]: correction as any,
      totalCorrections: this.props.totalCorrections + 1,
      lastCorrectionAt: new Date()
    });
  }
  
  // Query methods
  hasRemovals(): boolean {
    return this.props.removedDecisionMakers.length > 0 ||
           this.props.removedPainPoints.length > 0 ||
           this.props.removedIntegrationNeeds.length > 0 ||
           this.props.removedEvaluationCriteria.length > 0;
  }
  
  hasCorrections(): boolean {
    return !!(this.props.correctedBudget ||
              this.props.correctedTimeline ||
              this.props.correctedUrgency ||
              this.props.correctedContactMethod ||
              this.props.correctedRole ||
              this.props.correctedIndustry ||
              this.props.correctedCompany ||
              this.props.correctedTeamSize);
  }
  
  isEmpty(): boolean {
    return !this.hasRemovals() && !this.hasCorrections();
  }
  
  getCorrectionSummary(): string[] {
    const summary: string[] = [];
    
    if (this.props.removedDecisionMakers.length > 0) {
      summary.push(`${this.props.removedDecisionMakers.length} decision maker(s) removed`);
    }
    if (this.props.removedPainPoints.length > 0) {
      summary.push(`${this.props.removedPainPoints.length} pain point(s) removed`);
    }
    if (this.props.correctedBudget) {
      summary.push(`Budget corrected to ${this.props.correctedBudget.newValue}`);
    }
    if (this.props.correctedRole) {
      summary.push(`Role corrected to ${this.props.correctedRole.newValue}`);
    }
    
    return summary;
  }
  
  // Serialization
  toPlainObject(): EntityCorrectionsProps {
    return { ...this.props };
  }
  
  static fromPlainObject(props: EntityCorrectionsProps): EntityCorrections {
    return new EntityCorrections(props);
  }
  
  // Private validation methods
  private validateInvariants(): void {
    if (!this.props.correctionSessionId || this.props.correctionSessionId.trim().length === 0) {
      throw new BusinessRuleViolationError(
        'Entity corrections must have a valid session ID',
        { sessionId: this.props.correctionSessionId }
      );
    }
    
    if (this.props.totalCorrections < 0) {
      throw new BusinessRuleViolationError(
        'Total corrections cannot be negative',
        { totalCorrections: this.props.totalCorrections }
      );
    }
  }
  
  private validateRemovalInput(entityValue: string, messageId: string, confidence: number): void {
    if (!entityValue || entityValue.trim().length === 0) {
      throw new BusinessRuleViolationError(
        'Entity value for removal cannot be empty',
        { entityValue, messageId }
      );
    }
    
    if (!messageId || messageId.trim().length === 0) {
      throw new BusinessRuleViolationError(
        'Message ID is required for entity corrections',
        { entityValue, messageId }
      );
    }
    
    if (confidence < 0 || confidence > 1) {
      throw new BusinessRuleViolationError(
        'Confidence must be between 0 and 1',
        { confidence, entityValue, messageId }
      );
    }
  }
  
  private validateCorrectionInput(newValue: unknown, messageId: string, confidence: number): void {
    if (!newValue || (typeof newValue === 'string' && newValue.trim().length === 0)) {
      throw new BusinessRuleViolationError(
        'New value for correction cannot be empty',
        { newValue, messageId }
      );
    }
    
    if (!messageId || messageId.trim().length === 0) {
      throw new BusinessRuleViolationError(
        'Message ID is required for entity corrections',
        { newValue, messageId }
      );
    }
    
    if (confidence < 0 || confidence > 1) {
      throw new BusinessRuleViolationError(
        'Confidence must be between 0 and 1',
        { confidence, newValue, messageId }
      );
    }
  }
  
  private capitalizeFirst(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
  
  private static calculateTotalCorrections(props: EntityCorrectionsProps): number {
    let total = 0;
    total += props.removedDecisionMakers.length;
    total += props.removedPainPoints.length;
    total += props.removedIntegrationNeeds.length;
    total += props.removedEvaluationCriteria.length;
    total += props.correctedBudget ? 1 : 0;
    total += props.correctedTimeline ? 1 : 0;
    total += props.correctedUrgency ? 1 : 0;
    total += props.correctedContactMethod ? 1 : 0;
    total += props.correctedRole ? 1 : 0;
    total += props.correctedIndustry ? 1 : 0;
    total += props.correctedCompany ? 1 : 0;
    total += props.correctedTeamSize ? 1 : 0;
    return total;
  }
} 