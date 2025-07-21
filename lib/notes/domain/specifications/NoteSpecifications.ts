/**
 * Note Specifications - Domain Layer
 * 
 * AI INSTRUCTIONS:
 * - Lightweight specification pattern for complex business rules
 * - Keep focused - only for rules that are reused or complex
 * - Avoid over-engineering - simple boolean functions
 * - Follow @golden-rule specification patterns exactly
 */

import { NoteAggregate } from '../aggregates/NoteAggregate';

export interface ISpecification<T> {
  isSatisfiedBy(candidate: T): boolean;
  getFailureReason?(candidate: T): string;
}

export class NoteContentValidSpec implements ISpecification<{ title: string | null; content: string | null }> {
  isSatisfiedBy(candidate: { title: string | null; content: string | null }): boolean {
    const hasTitle = Boolean(candidate.title && candidate.title.trim().length > 0);
    const hasContent = Boolean(candidate.content && candidate.content.trim().length > 0);
    return hasTitle || hasContent;
  }

  getFailureReason(): string {
    return 'Note must have either title or content';
  }
}

export class NotePositionValidSpec implements ISpecification<number> {
  isSatisfiedBy(position: number): boolean {
    return Number.isInteger(position) && position >= 0;
  }

  getFailureReason(): string {
    return 'Position must be a non-negative integer';
  }
}

export class NoteLengthValidSpec implements ISpecification<{ title: string | null; content: string | null }> {
  constructor(
    private readonly maxTitleLength: number = 255,
    private readonly maxContentLength: number = 10000
  ) {}

  isSatisfiedBy(candidate: { title: string | null; content: string | null }): boolean {
    const titleValid = !candidate.title || candidate.title.trim().length <= this.maxTitleLength;
    const contentValid = !candidate.content || candidate.content.length <= this.maxContentLength;
    return titleValid && contentValid;
  }

  getFailureReason(candidate: { title: string | null; content: string | null }): string {
    if (candidate.title && candidate.title.trim().length > this.maxTitleLength) {
      return `Title cannot exceed ${this.maxTitleLength} characters`;
    }
    if (candidate.content && candidate.content.length > this.maxContentLength) {
      return `Content cannot exceed ${this.maxContentLength} characters`;
    }
    return 'Length validation failed';
  }
}

export class NoteUpdatePermittedSpec implements ISpecification<NoteAggregate> {
  isSatisfiedBy(note: NoteAggregate): boolean {
    // Business rule: Empty notes cannot be updated (should be deleted instead)
    return note.hasContent();
  }

  getFailureReason(): string {
    return 'Cannot update empty notes - delete instead';
  }
}

// Composite specification for complete note validation
export class CompleteNoteValidSpec implements ISpecification<{ title: string | null; content: string | null }> {
  private contentSpec = new NoteContentValidSpec();
  private lengthSpec = new NoteLengthValidSpec();

  isSatisfiedBy(candidate: { title: string | null; content: string | null }): boolean {
    return this.contentSpec.isSatisfiedBy(candidate) && this.lengthSpec.isSatisfiedBy(candidate);
  }

  getFailureReason(candidate: { title: string | null; content: string | null }): string {
    if (!this.contentSpec.isSatisfiedBy(candidate)) {
      return this.contentSpec.getFailureReason!();
    }
    if (!this.lengthSpec.isSatisfiedBy(candidate)) {
      return this.lengthSpec.getFailureReason!(candidate);
    }
    return 'Note validation failed';
  }
}