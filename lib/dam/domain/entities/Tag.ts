// Domain exceptions for Tag
export class TagValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TagValidationError';
  }
}

export class Tag {
  public readonly id: string;
  private _name: string;
  public readonly userId: string;
  public readonly organizationId: string;
  public readonly createdAt: Date;
  public readonly updatedAt?: Date;

  constructor(data: {
    id: string;
    name: string;
    userId: string;
    organizationId: string;
    createdAt: Date;
    updatedAt?: Date;
  }) {
    // Validate required fields
    this.validateRequiredFields(data);
    
    // Validate business rules
    this.validateName(data.name);
    
    // Assign values
    this.id = data.id;
    this._name = data.name.trim();
    this.userId = data.userId;
    this.organizationId = data.organizationId;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
  }

  // Getters
  get name(): string {
    return this._name;
  }

  // Business Methods
  
  /**
   * Validates if the tag can be renamed to the given name
   */
  canBeRenamedTo(newName: string): boolean {
    try {
      this.validateName(newName);
      return newName.trim() !== this._name;
    } catch {
      return false;
    }
  }

  /**
   * Checks if the tag can be deleted
   * Note: In practice, this might need to check if the tag is used by any assets
   */
  canBeDeleted(): boolean {
    // For now, all tags can be deleted
    // Future: Add business rules like checking if tag is used by assets
    return true;
  }

  /**
   * Checks if this tag name matches the given search term (case-insensitive)
   */
  matchesSearch(searchTerm: string): boolean {
    if (!searchTerm || searchTerm.trim() === '') {
      return true;
    }
    
    return this._name.toLowerCase().includes(searchTerm.toLowerCase().trim());
  }

  /**
   * Gets a normalized version of the tag name for comparison/sorting
   */
  getNormalizedName(): string {
    return this._name.toLowerCase().trim();
  }

  /**
   * Checks if the tag name would conflict with reserved tag names
   */
  hasReservedName(): boolean {
    const reservedNames = [
      'system', 'admin', 'root', 'default', 'null', 'undefined'
    ];
    
    return reservedNames.includes(this._name.toLowerCase());
  }

  /**
   * Gets the display name with proper capitalization
   */
  getDisplayName(): string {
    // Convert to title case for display
    return this._name
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }

  /**
   * Checks if the tag name is similar to another tag name (for duplicate detection)
   */
  isSimilarTo(otherTagName: string, threshold: number = 0.8): boolean {
    const similarity = this.calculateSimilarity(this._name.toLowerCase(), otherTagName.toLowerCase());
    return similarity >= threshold;
  }

  /**
   * Validates tag integrity and returns any issues
   */
  validateIntegrity(): string[] {
    const errors: string[] = [];
    
    // Check for reserved names
    if (this.hasReservedName()) {
      errors.push('Tag name conflicts with system reserved names');
    }
    
    // Check for leading/trailing whitespace (should not happen due to trimming in constructor)
    if (this._name !== this._name.trim()) {
      errors.push('Tag name has leading or trailing whitespace');
    }
    
    return errors;
  }

  // Validation Methods (Private)
  
  private validateRequiredFields(data: any): void {
    const requiredFields = ['id', 'name', 'userId', 'organizationId', 'createdAt'];
    
    for (const field of requiredFields) {
      if (!data[field]) {
        throw new TagValidationError(`${field} is required`);
      }
    }
  }

  private validateName(name: string): void {
    if (!name || typeof name !== 'string') {
      throw new TagValidationError('Tag name is required');
    }
    
    const trimmedName = name.trim();
    if (trimmedName.length === 0) {
      throw new TagValidationError('Tag name cannot be empty');
    }
    
    if (trimmedName.length > 50) {
      throw new TagValidationError('Tag name cannot exceed 50 characters');
    }

    if (trimmedName.length < 2) {
      throw new TagValidationError('Tag name must be at least 2 characters long');
    }

    // Check for invalid characters - tags should be more restrictive than files/folders
    const invalidChars = /[<>:"/\\|?*\x00-\x1f@#$%^&()=+[\]{};'.,!~`]/;
    if (invalidChars.test(trimmedName)) {
      throw new TagValidationError('Tag name contains invalid characters. Only letters, numbers, spaces, hyphens, and underscores are allowed');
    }

    // Check for consecutive spaces
    if (trimmedName.includes('  ')) {
      throw new TagValidationError('Tag name cannot contain consecutive spaces');
    }

    // Check that tag starts and ends with alphanumeric characters
    if (!/^[a-zA-Z0-9].*[a-zA-Z0-9]$/.test(trimmedName) && trimmedName.length > 1) {
      throw new TagValidationError('Tag name must start and end with letters or numbers');
    }
  }

  private calculateSimilarity(str1: string, str2: string): number {
    // Simple similarity calculation using Levenshtein distance
    const matrix: number[][] = [];
    const len1 = str1.length;
    const len2 = str2.length;

    if (len1 === 0) return len2 === 0 ? 1 : 0;
    if (len2 === 0) return 0;

    // Initialize matrix
    for (let i = 0; i <= len1; i++) {
      matrix[i] = [i];
    }
    for (let j = 0; j <= len2; j++) {
      matrix[0][j] = j;
    }

    // Fill matrix
    for (let i = 1; i <= len1; i++) {
      for (let j = 1; j <= len2; j++) {
        const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,     // deletion
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j - 1] + cost // substitution
        );
      }
    }

    const maxLen = Math.max(len1, len2);
    return (maxLen - matrix[len1][len2]) / maxLen;
  }

  // Factory Methods
  
  /**
   * Creates a Tag instance from database data
   */
  static fromDatabaseRow(row: any): Tag {
    return new Tag({
      id: row.id,
      name: row.name,
      userId: row.user_id || row.userId,
      organizationId: row.organization_id || row.organizationId,
      createdAt: new Date(row.created_at || row.createdAt),
      updatedAt: row.updated_at || row.updatedAt ? new Date(row.updated_at || row.updatedAt) : undefined
    });
  }

  /**
   * Creates a new Tag with validated input
   */
  static create(data: {
    id: string;
    name: string;
    userId: string;
    organizationId: string;
    createdAt?: Date;
  }): Tag {
    return new Tag({
      id: data.id,
      name: data.name,
      userId: data.userId,
      organizationId: data.organizationId,
      createdAt: data.createdAt || new Date()
    });
  }

  /**
   * Converts the Tag to a plain object (for serialization)
   */
  toPlainObject(): {
    id: string;
    name: string;
    userId: string;
    organizationId: string;
    createdAt: Date;
    updatedAt?: Date;
  } {
    return {
      id: this.id,
      name: this._name,
      userId: this.userId,
      organizationId: this.organizationId,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
} 