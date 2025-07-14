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
import { Permission } from '@/lib/auth/domain/value-objects/Permission';
import { UserRole } from '@/lib/auth/domain/value-objects/UserRole';
import { UserAggregate } from '@/lib/auth/domain/aggregates/UserAggregate';
import { OrganizationId } from '@/lib/auth/domain/value-objects/OrganizationId';
import { NotesOrderingService } from '../services/NotesOrderingService';

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
    
    return new NoteAggregate(
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

  /**
   * Validates permissions for creating a note
   * AI: Domain-level permission validation for note creation
   */
  static validateCreatePermissions(
    user: UserAggregate,
    userRole: UserRole,
    organizationId: OrganizationId
  ): void {
    NotesOrderingService.validateNotePermissions(
      user,
      userRole,
      organizationId,
      [Permission.CREATE_NOTE]
    );
  }

  /**
   * Validates permissions for updating this note
   * AI: Domain-level permission validation for note updates
   */
  validateUpdatePermissions(
    user: UserAggregate,
    userRole: UserRole,
    organizationId: OrganizationId
  ): void {
    NotesOrderingService.validateNotePermissions(
      user,
      userRole,
      organizationId,
      [Permission.UPDATE_NOTE]
    );
  }

  /**
   * Validates permissions for deleting this note
   * AI: Domain-level permission validation for note deletion
   */
  validateDeletePermissions(
    user: UserAggregate,
    userRole: UserRole,
    organizationId: OrganizationId
  ): void {
    NotesOrderingService.validateNotePermissions(
      user,
      userRole,
      organizationId,
      [Permission.DELETE_NOTE]
    );
  }

  /**
   * Validates permissions for viewing this note
   * AI: Domain-level permission validation for note viewing
   */
  validateViewPermissions(
    user: UserAggregate,
    userRole: UserRole,
    organizationId: OrganizationId
  ): void {
    NotesOrderingService.validateNotePermissions(
      user,
      userRole,
      organizationId,
      [Permission.VIEW_NOTE]
    );
  }

  // Business methods
  public updateContent(title: string | null, content: string | null): void {
    this.validateContentUpdate(title, content);
    
    this._title = title?.trim() || null;
    this._content = content || null;
    this._updatedAt = new Date();
    
    this.validateInvariants();
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
    // At least one of title or content should have meaningful content
    const hasTitle = title && title.trim().length > 0;
    const hasContent = content && content.trim().length > 0;
    
    if (!hasTitle && !hasContent) {
      throw new BusinessRuleViolationError(
        'Note must have either title or content',
        { title, content }
      );
    }

    // Title length validation
    if (title && title.trim().length > 255) {
      throw new InvalidNoteDataError(
        'title',
        title,
        { reason: 'Title cannot exceed 255 characters', length: title.length }
      );
    }

    // Content length validation (reasonable limit)
    if (content && content.length > 10000) {
      throw new InvalidNoteDataError(
        'content',
        content,
        { reason: 'Content cannot exceed 10000 characters', length: content.length }
      );
    }
  }

  private validatePosition(position: number): void {
    if (position < 0) {
      throw new InvalidNoteDataError(
        'position',
        position,
        { reason: 'Position cannot be negative' }
      );
    }

    if (!Number.isInteger(position)) {
      throw new InvalidNoteDataError(
        'position',
        position,
        { reason: 'Position must be an integer' }
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