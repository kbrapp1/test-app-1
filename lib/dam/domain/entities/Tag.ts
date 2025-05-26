import { TagValidation } from './TagValidation';
import { TagUtilities } from './TagUtilities';
import { TagColor, TagColorName } from '../value-objects/TagColor';

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
  private _color: TagColor;
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
    color?: TagColorName;
  }) {
    // Validate using domain service
    TagValidation.validateRequiredFields(data);
    TagValidation.validateName(data.name);
    
    // Assign values
    this.id = data.id;
    this._name = data.name.trim();
    this._color = data.color ? TagColor.fromStringSafe(data.color) : TagColor.createForTagName(data.name);
    this.userId = data.userId;
    this.organizationId = data.organizationId;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
  }

  // Getters
  get name(): string {
    return this._name;
  }

  get color(): TagColor {
    return this._color;
  }

  get colorName(): TagColorName {
    return this._color.colorName;
  }

  // Business Methods
  
  /**
   * Validates if the tag can be renamed to the given name
   */
  canBeRenamedTo(newName: string): boolean {
    try {
      TagValidation.validateName(newName);
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
    return TagUtilities.matchesSearch(this._name, searchTerm);
  }

  /**
   * Gets a normalized version of the tag name for comparison/sorting
   */
  getNormalizedName(): string {
    return TagUtilities.getNormalizedName(this._name);
  }

  /**
   * Checks if the tag name would conflict with reserved tag names
   */
  hasReservedName(): boolean {
    return TagValidation.hasReservedName(this._name);
  }

  /**
   * Gets the display name with proper capitalization
   */
  getDisplayName(): string {
    return TagUtilities.getDisplayName(this._name);
  }

  /**
   * Checks if the tag name is similar to another tag name (for duplicate detection)
   */
  isSimilarTo(otherTagName: string, threshold: number = 0.8): boolean {
    return TagUtilities.isSimilarTo(this._name, otherTagName, threshold);
  }

  /**
   * Validates tag integrity and returns any issues
   */
  validateIntegrity(): string[] {
    return TagValidation.validateIntegrity(this._name);
  }

  /**
   * Changes the tag color
   */
  changeColor(newColor: TagColorName): Tag {
    const newTagColor = TagColor.fromString(newColor);
    return new Tag({
      id: this.id,
      name: this._name,
      userId: this.userId,
      organizationId: this.organizationId,
      createdAt: this.createdAt,
      updatedAt: new Date(),
      color: newColor
    });
  }

  /**
   * Gets CSS classes for displaying this tag
   */
  getCssClasses(): string {
    return this._color.getCssClasses();
  }

  /**
   * Gets Tailwind classes for this tag
   */
  getTailwindClasses(): {
    background: string;
    text: string;
    border: string;
    hover: string;
  } {
    return this._color.getTailwindClasses();
  }



  /**
   * Converts the Tag to a plain object (for serialization)
   */
  toPlainObject(): {
    id: string;
    name: string;
    color: TagColorName;
    userId: string;
    organizationId: string;
    createdAt: Date;
    updatedAt?: Date;
  } {
    return {
      id: this.id,
      name: this._name,
      color: this._color.colorName,
      userId: this.userId,
      organizationId: this.organizationId,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
} 
