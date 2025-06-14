/**
 * Lead Metadata Value Object
 * 
 * Value Object: Immutable lead metadata including tags, notes, and conversation data
 * Single Responsibility: Lead metadata management and operations
 * Following DDD value object patterns
 */

export interface LeadNote {
  id: string;
  content: string;
  authorId: string;
  authorName: string;
  createdAt: Date;
  isInternal: boolean;
}

export interface LeadMetadataProps {
  conversationSummary: string;
  tags: string[];
  notes: LeadNote[];
}

export class LeadMetadata {
  private constructor(private readonly props: LeadMetadataProps) {
    this.validateProps(props);
  }

  static create(props: LeadMetadataProps): LeadMetadata {
    return new LeadMetadata({
      conversationSummary: props.conversationSummary?.trim() || '',
      tags: [...(props.tags || [])],
      notes: [...(props.notes || [])],
    });
  }

  static fromPersistence(props: LeadMetadataProps): LeadMetadata {
    return new LeadMetadata({
      conversationSummary: props.conversationSummary || '',
      tags: props.tags || [],
      notes: props.notes || [],
    });
  }

  static empty(): LeadMetadata {
    return new LeadMetadata({
      conversationSummary: '',
      tags: [],
      notes: [],
    });
  }

  private validateProps(props: LeadMetadataProps): void {
    if (props.conversationSummary && props.conversationSummary.length > 5000) {
      throw new Error('Conversation summary cannot exceed 5000 characters');
    }

    if (props.tags && props.tags.length > 50) {
      throw new Error('Cannot have more than 50 tags');
    }

    if (props.tags) {
      props.tags.forEach(tag => {
        if (!tag?.trim()) {
          throw new Error('Tags cannot be empty');
        }
        if (tag.length > 50) {
          throw new Error('Tag cannot exceed 50 characters');
        }
      });
    }

    if (props.notes) {
      props.notes.forEach(note => {
        if (!note.content?.trim()) {
          throw new Error('Note content cannot be empty');
        }
        if (note.content.length > 2000) {
          throw new Error('Note content cannot exceed 2000 characters');
        }
        if (!note.authorId?.trim()) {
          throw new Error('Note author ID is required');
        }
        if (!note.authorName?.trim()) {
          throw new Error('Note author name is required');
        }
      });
    }
  }

  // Getters
  get conversationSummary(): string { return this.props.conversationSummary; }
  get tags(): string[] { return [...this.props.tags]; }
  get notes(): LeadNote[] { return [...this.props.notes]; }

  // Conversation summary operations
  updateConversationSummary(summary: string): LeadMetadata {
    return LeadMetadata.create({
      ...this.props,
      conversationSummary: summary,
    });
  }

  hasConversationSummary(): boolean {
    return !!this.props.conversationSummary?.trim();
  }

  getConversationSummaryLength(): number {
    return this.props.conversationSummary?.length || 0;
  }

  // Tag operations
  addTag(tag: string): LeadMetadata {
    const normalizedTag = tag.trim().toLowerCase();
    
    if (this.hasTag(normalizedTag)) {
      return this;
    }

    return LeadMetadata.create({
      ...this.props,
      tags: [...this.props.tags, normalizedTag],
    });
  }

  removeTag(tag: string): LeadMetadata {
    const normalizedTag = tag.trim().toLowerCase();
    
    return LeadMetadata.create({
      ...this.props,
      tags: this.props.tags.filter(t => t !== normalizedTag),
    });
  }

  hasTag(tag: string): boolean {
    const normalizedTag = tag.trim().toLowerCase();
    return this.props.tags.includes(normalizedTag);
  }

  getTagCount(): number {
    return this.props.tags.length;
  }

  getTagsAsString(): string {
    return this.props.tags.join(', ');
  }

  // Note operations
  addNote(
    content: string,
    authorId: string,
    authorName: string,
    isInternal: boolean = true
  ): LeadMetadata {
    const note: LeadNote = {
      id: crypto.randomUUID(),
      content: content.trim(),
      authorId,
      authorName,
      createdAt: new Date(),
      isInternal,
    };

    return LeadMetadata.create({
      ...this.props,
      notes: [...this.props.notes, note],
    });
  }

  removeNote(noteId: string): LeadMetadata {
    return LeadMetadata.create({
      ...this.props,
      notes: this.props.notes.filter(note => note.id !== noteId),
    });
  }

  updateNote(noteId: string, content: string): LeadMetadata {
    const updatedNotes = this.props.notes.map(note =>
      note.id === noteId
        ? { ...note, content: content.trim() }
        : note
    );

    return LeadMetadata.create({
      ...this.props,
      notes: updatedNotes,
    });
  }

  getNoteById(noteId: string): LeadNote | undefined {
    return this.props.notes.find(note => note.id === noteId);
  }

  getPublicNotes(): LeadNote[] {
    return this.props.notes.filter(note => !note.isInternal);
  }

  getInternalNotes(): LeadNote[] {
    return this.props.notes.filter(note => note.isInternal);
  }

  getNoteCount(): number {
    return this.props.notes.length;
  }

  getPublicNotesAsString(): string {
    return this.getPublicNotes()
      .map(note => note.content)
      .join(' | ');
  }

  getNotesFromAuthor(authorId: string): LeadNote[] {
    return this.props.notes.filter(note => note.authorId === authorId);
  }

  getRecentNotes(daysThreshold: number = 7): LeadNote[] {
    const now = new Date().getTime();
    const thresholdMs = daysThreshold * 24 * 60 * 60 * 1000;
    
    return this.props.notes.filter(note => 
      (now - note.createdAt.getTime()) <= thresholdMs
    );
  }

  // Query methods
  hasNotes(): boolean {
    return this.props.notes.length > 0;
  }

  hasTags(): boolean {
    return this.props.tags.length > 0;
  }

  hasPublicNotes(): boolean {
    return this.getPublicNotes().length > 0;
  }

  hasInternalNotes(): boolean {
    return this.getInternalNotes().length > 0;
  }

  // Export methods
  toPlainObject(): LeadMetadataProps {
    return {
      conversationSummary: this.props.conversationSummary,
      tags: [...this.props.tags],
      notes: [...this.props.notes],
    };
  }

  toSummary(): object {
    return {
      conversationSummary: this.props.conversationSummary,
      tagCount: this.getTagCount(),
      tags: this.props.tags,
      noteCount: this.getNoteCount(),
      hasPublicNotes: this.hasPublicNotes(),
      hasInternalNotes: this.hasInternalNotes(),
    };
  }

  toExportData(): object {
    return {
      conversationSummary: this.props.conversationSummary,
      tags: this.getTagsAsString(),
      publicNotes: this.getPublicNotesAsString(),
      noteCount: this.getNoteCount(),
    };
  }
} 