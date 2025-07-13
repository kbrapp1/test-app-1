/**
 * Organization Value Object
 * 
 * AI INSTRUCTIONS:
 * - Simple value object matching current functionality
 * - Immutable structure with validation
 * - No complex business logic - keep it simple
 * - Matches existing Organization interface exactly
 */

export class Organization {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly slug?: string,
    public readonly featureFlags?: Record<string, boolean>
  ) {
    this.validateInvariants();
  }

  private validateInvariants(): void {
    if (!this.id || this.id.trim() === '') {
      throw new Error('Organization ID is required');
    }
    
    if (!this.name || this.name.trim() === '') {
      throw new Error('Organization name is required');
    }
  }

  /**
   * Create Organization from database record
   */
  static fromDatabase(data: {
    id: string;
    name: string;
    slug?: string | null;
    feature_flags?: Record<string, boolean> | null;
  }): Organization {
    return new Organization(
      data.id,
      data.name,
      data.slug || undefined,
      data.feature_flags || undefined
    );
  }

  /**
   * Convert to plain object for API responses
   */
  toPlainObject(): {
    id: string;
    name: string;
    slug?: string;
    feature_flags?: Record<string, boolean>;
  } {
    return {
      id: this.id,
      name: this.name,
      ...(this.slug && { slug: this.slug }),
      ...(this.featureFlags && { feature_flags: this.featureFlags })
    };
  }
} 