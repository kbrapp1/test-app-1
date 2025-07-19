/**
 * Entity Corrections Value Object
 * 
 * AI INSTRUCTIONS:
 * - Immutable value object representing entity corrections and removals
 * - Orchestrates correction and removal operations using dedicated value objects
 * - Support audit trails and business rule enforcement
 * - Follow @golden-rule patterns exactly
 * - Keep under 150 lines with focused responsibility
 * - Use domain-specific validation and errors
 * - Never expose mutable state
 */

import { RemovalOperation, RemovalOperationProps } from './RemovalOperation';
import { CorrectionOperation, CorrectionOperationProps, UrgencyLevel, ContactMethod } from './CorrectionOperation';
import { EntityCorrectionsValidationService } from '../../services/context/EntityCorrectionsValidationService';

export interface EntityCorrectionsProps {
  // Array entity removals
  removedDecisionMakers: RemovalOperationProps[];
  removedPainPoints: RemovalOperationProps[];
  removedIntegrationNeeds: RemovalOperationProps[];
  removedEvaluationCriteria: RemovalOperationProps[];
  
  // Single entity corrections
  correctedBudget: CorrectionOperationProps | null;
  correctedTimeline: CorrectionOperationProps | null;
  correctedUrgency: CorrectionOperationProps<UrgencyLevel> | null;
  correctedContactMethod: CorrectionOperationProps<ContactMethod> | null;
  correctedRole: CorrectionOperationProps | null;
  correctedIndustry: CorrectionOperationProps | null;
  correctedCompany: CorrectionOperationProps | null;
  correctedTeamSize: CorrectionOperationProps | null;
  
  // Metadata
  totalCorrections: number;
  lastCorrectionAt: Date;
  correctionSessionId: string;
}

const ALLOWED_REMOVAL_TYPES = ['decisionMakers', 'painPoints', 'integrationNeeds', 'evaluationCriteria'] as const;
const ALLOWED_CORRECTION_TYPES = ['budget', 'timeline', 'urgency', 'contactMethod', 'role', 'industry', 'company', 'teamSize'] as const;

type RemovalEntityType = typeof ALLOWED_REMOVAL_TYPES[number];
type CorrectionEntityType = typeof ALLOWED_CORRECTION_TYPES[number];

export class EntityCorrections {
  private constructor(private readonly props: EntityCorrectionsProps) {
    this.validateInvariants();
  }
  
  static create(
    sessionId: string,
    props?: Partial<Omit<EntityCorrectionsProps, 'totalCorrections' | 'lastCorrectionAt' | 'correctionSessionId'>>
  ): EntityCorrections {
    EntityCorrectionsValidationService.validateSessionId(sessionId);
    
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
  
  // Getters for immutable access (return value objects)
  get removedDecisionMakers(): RemovalOperation[] { 
    return this.props.removedDecisionMakers.map(props => RemovalOperation.fromProps(props)); 
  }
  get removedPainPoints(): RemovalOperation[] { 
    return this.props.removedPainPoints.map(props => RemovalOperation.fromProps(props)); 
  }
  get removedIntegrationNeeds(): RemovalOperation[] { 
    return this.props.removedIntegrationNeeds.map(props => RemovalOperation.fromProps(props)); 
  }
  get removedEvaluationCriteria(): RemovalOperation[] { 
    return this.props.removedEvaluationCriteria.map(props => RemovalOperation.fromProps(props)); 
  }
  get correctedBudget(): CorrectionOperation | null { 
    return this.props.correctedBudget ? CorrectionOperation.fromProps(this.props.correctedBudget) : null; 
  }
  get correctedTimeline(): CorrectionOperation | null { 
    return this.props.correctedTimeline ? CorrectionOperation.fromProps(this.props.correctedTimeline) : null; 
  }
  get correctedUrgency(): CorrectionOperation<UrgencyLevel> | null { 
    return this.props.correctedUrgency ? CorrectionOperation.fromProps(this.props.correctedUrgency) : null; 
  }
  get correctedContactMethod(): CorrectionOperation<ContactMethod> | null { 
    return this.props.correctedContactMethod ? CorrectionOperation.fromProps(this.props.correctedContactMethod) : null; 
  }
  get correctedRole(): CorrectionOperation | null { 
    return this.props.correctedRole ? CorrectionOperation.fromProps(this.props.correctedRole) : null; 
  }
  get correctedIndustry(): CorrectionOperation | null { 
    return this.props.correctedIndustry ? CorrectionOperation.fromProps(this.props.correctedIndustry) : null; 
  }
  get correctedCompany(): CorrectionOperation | null { 
    return this.props.correctedCompany ? CorrectionOperation.fromProps(this.props.correctedCompany) : null; 
  }
  get correctedTeamSize(): CorrectionOperation | null { 
    return this.props.correctedTeamSize ? CorrectionOperation.fromProps(this.props.correctedTeamSize) : null; 
  }
  get totalCorrections(): number { return this.props.totalCorrections; }
  get lastCorrectionAt(): Date { return this.props.lastCorrectionAt; }
  get correctionSessionId(): string { return this.props.correctionSessionId; }
  
  // Business methods for adding corrections
  withRemovedEntity(
    entityType: RemovalEntityType,
    entityValue: string,
    messageId: string,
    confidence: number = 0.9,
    reason?: string
  ): EntityCorrections {
    EntityCorrectionsValidationService.validateEntityType(entityType, ALLOWED_REMOVAL_TYPES);
    
    const removal = RemovalOperation.create(entityValue, messageId, confidence, reason);
    
    const propertyKey = `removed${this.capitalizeFirst(entityType)}` as keyof EntityCorrectionsProps;
    const existingRemovals = this.props[propertyKey] as RemovalOperationProps[];
    
    return new EntityCorrections({
      ...this.props,
      [propertyKey]: [...existingRemovals, removal.toPlainObject()],
      totalCorrections: this.props.totalCorrections + 1,
      lastCorrectionAt: new Date()
    });
  }
  
  withCorrectedEntity<T extends string | UrgencyLevel | ContactMethod>(
    entityType: CorrectionEntityType,
    newValue: T,
    messageId: string,
    previousValue?: T,
    confidence: number = 0.9,
    reason?: string
  ): EntityCorrections {
    EntityCorrectionsValidationService.validateEntityType(entityType, ALLOWED_CORRECTION_TYPES);
    
    const correction = CorrectionOperation.create(newValue, messageId, previousValue, confidence, reason);
    
    const propertyKey = `corrected${this.capitalizeFirst(entityType)}` as keyof EntityCorrectionsProps;
    
    return new EntityCorrections({
      ...this.props,
      [propertyKey]: correction.toPlainObject(),
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
  
  // Private helper methods
  private validateInvariants(): void {
    EntityCorrectionsValidationService.validateSessionId(this.props.correctionSessionId);
    EntityCorrectionsValidationService.validateTotalCorrections(this.props.totalCorrections);
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