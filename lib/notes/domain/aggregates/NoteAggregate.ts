/**
 * Note Aggregate Root - Domain Layer
 * 
 * AI INSTRUCTIONS:
 * - Aggregate root for Note entity with business invariants
 * - Enforce business rules and validation
 * - Publish domain events for significant state changes
 * - Keep business logic pure, no external dependencies
 * - Follow @golden-rule aggregate patterns exactly
 */

import { NoteId } from '../value-objects/NoteId';
import { BusinessRuleViolationError, InvalidNoteDataError } from '../errors/NotesDomainError';
import { DomainEvent, NoteCreatedEvent, NoteUpdatedEvent } from '../events/NoteEvents';
import { CompleteNoteValidSpec, NotePositionValidSpec } from '../specifications/NoteSpecifications';

export interface NoteData {
  title: string | null;
  content: string | null;
  colorClass: string;
  position: number;
  userId: string;
  organizationId: string;
  createdAt: Date;
  updatedAt: Date | null;
}

export class NoteAggregate {
  private _domainEvents: DomainEvent[] = [];
  private static readonly contentValidator = new CompleteNoteValidSpec();
  private static readonly positionValidator = new NotePositionValidSpec();

  private constructor(
    private readonly _id: NoteId,
    private _title: string | null,
    private _content: string | null,
    private _colorClass: string,
    private _position: number,
    private readonly _userId: string,
    private readonly _organizationId: string,
    private readonly _createdAt: Date,
    private _updatedAt: Date | null
  ) {
    this.validateInvariants();
  }

  // Factory methods
  public static create(
    title: string | null,
    content: string | null,
    userId: string,
    organizationId: string,
    position: number = 0,
    colorClass: string = 'bg-yellow-100'
  ): NoteAggregate {
    const id = NoteId.generate();
    const now = new Date();
    
    const note = new NoteAggregate(
      id,
      title,
      content,
      colorClass,
      position,
      userId,
      organizationId,
      now,
      null
    );
    
    // Publish domain event for creation
    note.addDomainEvent(new NoteCreatedEvent(
      id.value,
      title,
      content,
      userId,
      organizationId
    ));
    
    return note;
  }

  public static fromExisting(
    id: string,
    title: string | null,
    content: string | null,
    colorClass: string,
    position: number,
    userId: string,
    organizationId: string,
    createdAt: Date,
    updatedAt: Date | null
  ): NoteAggregate {
    return new NoteAggregate(
      NoteId.create(id),
      title,
      content,
      colorClass,
      position,
      userId,
      organizationId,
      createdAt,
      updatedAt
    );
  }

  // Getters
  public get id(): NoteId {
    return this._id;
  }

  public get title(): string | null {
    return this._title;
  }

  public get content(): string | null {
    return this._content;
  }

  public get colorClass(): string {
    return this._colorClass;
  }

  public get position(): number {
    return this._position;
  }

  public get userId(): string {
    return this._userId;
  }

  public get organizationId(): string {
    return this._organizationId;
  }

  public get createdAt(): Date {
    return this._createdAt;
  }

  public get updatedAt(): Date | null {
    return this._updatedAt;
  }

  // Domain Events
  public getDomainEvents(): DomainEvent[] {
    return [...this._domainEvents];
  }

  public clearDomainEvents(): void {
    this._domainEvents = [];
  }

  private addDomainEvent(event: DomainEvent): void {
    this._domainEvents.push(event);
  }


  // Business methods
  public updateContent(title: string | null, content: string | null): void {
    this.validateContentUpdate(title, content);
    
    const oldTitle = this._title;
    const oldContent = this._content;
    
    this._title = title?.trim() || null;
    this._content = content || null;
    this._updatedAt = new Date();
    
    this.validateInvariants();
    
    // Publish domain event for content changes
    const changes: Record<string, { from: string | null; to: string | null }> = {};
    if (oldTitle !== this._title) changes.title = { from: oldTitle, to: this._title };
    if (oldContent !== this._content) changes.content = { from: oldContent, to: this._content };
    
    if (Object.keys(changes).length > 0) {
      this.addDomainEvent(new NoteUpdatedEvent(this._id.value, changes));
    }
  }

  public updatePosition(newPosition: number): void {
    this.validatePosition(newPosition);
    
    this._position = newPosition;
    this._updatedAt = new Date();
  }

  public updateColorClass(colorClass: string): void {
    this.validateColorClass(colorClass);
    
    this._colorClass = colorClass;
    this._updatedAt = new Date();
  }

  public isEmpty(): boolean {
    return (!this._title || this._title.trim() === '') && 
           (!this._content || this._content.trim() === '');
  }

  public hasContent(): boolean {
    return !this.isEmpty();
  }

  // Convert to plain object for persistence
  public toData(): NoteData {
    return {
      title: this._title,
      content: this._content,
      colorClass: this._colorClass,
      position: this._position,
      userId: this._userId,
      organizationId: this._organizationId,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt
    };
  }

  // Convert to database format (matches existing schema)
  public toDatabaseFormat(): {
    id: string;
    title: string | null;
    content: string | null;
    color_class: string;
    position: number;
    user_id: string;
    organization_id: string;
    created_at: string;
    updated_at: string | null;
  } {
    return {
      id: this._id.value,
      title: this._title,
      content: this._content,
      color_class: this._colorClass,
      position: this._position,
      user_id: this._userId,
      organization_id: this._organizationId,
      created_at: this._createdAt.toISOString(),
      updated_at: this._updatedAt?.toISOString() || null
    };
  }

  // Validation methods
  private validateInvariants(): void {
    this.validatePosition(this._position);
    this.validateColorClass(this._colorClass);
    this.validateUserAndOrganization();
  }

  private validateContentUpdate(title: string | null, content: string | null): void {
    const candidate = { title, content };
    
    if (!NoteAggregate.contentValidator.isSatisfiedBy(candidate)) {
      const reason = NoteAggregate.contentValidator.getFailureReason!(candidate);
      
      // Throw appropriate error type based on validation failure
      if (reason.includes('Title cannot exceed') && title) {
        throw new InvalidNoteDataError('title', title, { reason });
      } else if (reason.includes('Content cannot exceed') && content) {
        throw new InvalidNoteDataError('content', content, { reason });
      } else {
        throw new BusinessRuleViolationError(reason, { title, content });
      }
    }
  }

  private validatePosition(position: number): void {
    if (!NoteAggregate.positionValidator.isSatisfiedBy(position)) {
      throw new InvalidNoteDataError(
        'position',
        position,
        { reason: NoteAggregate.positionValidator.getFailureReason!() }
      );
    }
  }

  private validateColorClass(colorClass: string): void {
    if (!colorClass || typeof colorClass !== 'string') {
      throw new InvalidNoteDataError(
        'colorClass',
        colorClass,
        { reason: 'Color class must be a non-empty string' }
      );
    }

    if (colorClass.trim().length === 0) {
      throw new InvalidNoteDataError(
        'colorClass',
        colorClass,
        { reason: 'Color class cannot be empty' }
      );
    }
  }

  private validateUserAndOrganization(): void {
    if (!this._userId || typeof this._userId !== 'string') {
      throw new InvalidNoteDataError(
        'userId',
        this._userId,
        { reason: 'User ID must be a non-empty string' }
      );
    }

    if (!this._organizationId || typeof this._organizationId !== 'string') {
      throw new InvalidNoteDataError(
        'organizationId',
        this._organizationId,
        { reason: 'Organization ID must be a non-empty string' }
      );
    }
  }
} 