export interface SavedSearchProps {
  id: string;
  name: string;
  description?: string;
  userId: string;
  organizationId: string;
  searchCriteria: {
    searchTerm?: string;
    folderId?: string | null;
    tagIds?: string[];
    filters?: {
      type?: string;
      creationDateOption?: string;
      dateStart?: string;
      dateEnd?: string;
      ownerId?: string;
      sizeOption?: string;
      sizeMin?: string;
      sizeMax?: string;
    };
    sortParams?: {
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
    };
  };
  isGlobal: boolean; // Whether this search applies across all folders
  createdAt: Date;
  updatedAt: Date;
  lastUsedAt?: Date;
  useCount: number;
}

export class SavedSearch {
  public readonly id: string;
  public readonly name: string;
  public readonly description?: string;
  public readonly userId: string;
  public readonly organizationId: string;
  public readonly searchCriteria: SavedSearchProps['searchCriteria'];
  public readonly isGlobal: boolean;
  public readonly createdAt: Date;
  public readonly updatedAt: Date;
  public readonly lastUsedAt?: Date;
  public readonly useCount: number;

  constructor(props: SavedSearchProps) {
    this.id = props.id;
    this.name = props.name;
    this.description = props.description;
    this.userId = props.userId;
    this.organizationId = props.organizationId;
    this.searchCriteria = props.searchCriteria;
    this.isGlobal = props.isGlobal;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
    this.lastUsedAt = props.lastUsedAt;
    this.useCount = props.useCount;
  }

  // Business methods
  canBeEditedBy(userId: string): boolean {
    return this.userId === userId;
  }

  getDisplaySummary(): string {
    const parts: string[] = [];
    
    if (this.searchCriteria.searchTerm) {
      parts.push(`Search: "${this.searchCriteria.searchTerm}"`);
    }
    
    if (this.searchCriteria.filters?.type && this.searchCriteria.filters.type !== 'any') {
      parts.push(`Type: ${this.searchCriteria.filters.type}`);
    }
    
    if (this.searchCriteria.tagIds && this.searchCriteria.tagIds.length > 0) {
      parts.push(`${this.searchCriteria.tagIds.length} tag(s)`);
    }
    
    if (this.searchCriteria.filters?.ownerId) {
      parts.push('Specific owner');
    }
    
    if (this.searchCriteria.filters?.sizeOption && this.searchCriteria.filters.sizeOption !== 'any') {
      parts.push(`Size: ${this.searchCriteria.filters.sizeOption}`);
    }

    return parts.length > 0 ? parts.join(' • ') : 'All assets';
  }

  withUpdatedUsage(lastUsedAt: Date = new Date()): SavedSearch {
    return new SavedSearch({
      ...this,
      lastUsedAt,
      useCount: this.useCount + 1,
      updatedAt: new Date(),
    });
  }
} 