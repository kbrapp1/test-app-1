/**
 * TagColor Value Object
 * 
 * Represents the color of a tag with validation and CSS utilities.
 * Follows DDD principles as an immutable value object.
 */

export type TagColorName = 
  | 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'pink' 
  | 'indigo' | 'gray' | 'orange' | 'teal' | 'emerald' | 'lime';

export class TagColorError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TagColorError';
  }
}

export class TagColor {
  private readonly _colorName: TagColorName;

  constructor(colorName: TagColorName) {
    if (!TagColor.isValidColor(colorName)) {
      throw new TagColorError(`Invalid tag color: ${colorName}`);
    }
    this._colorName = colorName;
  }

  get colorName(): TagColorName {
    return this._colorName;
  }

  /**
   * Validates if a color name is supported
   */
  static isValidColor(colorName: string): colorName is TagColorName {
    const validColors: TagColorName[] = [
      'blue', 'green', 'yellow', 'red', 'purple', 'pink',
      'indigo', 'gray', 'orange', 'teal', 'emerald', 'lime'
    ];
    return validColors.includes(colorName as TagColorName);
  }

  /**
   * Gets all available tag colors
   */
  static getAllColors(): TagColorName[] {
    return [
      'blue', 'green', 'yellow', 'red', 'purple', 'pink',
      'indigo', 'gray', 'orange', 'teal', 'emerald', 'lime'
    ];
  }

  /**
   * Creates a deterministic color for a tag name
   * This ensures the same tag name always gets the same color
   */
  static createForTagName(tagName: string): TagColor {
    const colors = TagColor.getAllColors();
    const hash = TagColor.simpleHash(tagName.toLowerCase().trim());
    const colorIndex = Math.abs(hash) % colors.length;
    return new TagColor(colors[colorIndex]);
  }

  /**
   * Simple hash function for consistent color assignment
   * Uses a basic string hash algorithm for deterministic results
   */
  private static simpleHash(str: string): number {
    let hash = 0;
    if (str.length === 0) return hash;
    
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    return hash;
  }

  /**
   * Creates a random tag color (deprecated - use createForTagName instead)
   * @deprecated Use createForTagName for consistent colors
   */
  static createRandom(): TagColor {
    const colors = TagColor.getAllColors();
    const randomIndex = Math.floor(Math.random() * colors.length);
    return new TagColor(colors[randomIndex]);
  }

  /**
   * Gets Tailwind CSS classes for the tag color
   */
  getTailwindClasses(): {
    background: string;
    text: string;
    border: string;
    hover: string;
  } {
    const colorMap: Record<TagColorName, { background: string; text: string; border: string; hover: string }> = {
      blue: { 
        background: 'bg-blue-100', 
        text: 'text-blue-800', 
        border: 'border-blue-200',
        hover: 'hover:bg-blue-200' 
      },
      green: { 
        background: 'bg-green-100', 
        text: 'text-green-800', 
        border: 'border-green-200',
        hover: 'hover:bg-green-200' 
      },
      yellow: { 
        background: 'bg-yellow-100', 
        text: 'text-yellow-800', 
        border: 'border-yellow-200',
        hover: 'hover:bg-yellow-200' 
      },
      red: { 
        background: 'bg-red-100', 
        text: 'text-red-800', 
        border: 'border-red-200',
        hover: 'hover:bg-red-200' 
      },
      purple: { 
        background: 'bg-purple-100', 
        text: 'text-purple-800', 
        border: 'border-purple-200',
        hover: 'hover:bg-purple-200' 
      },
      pink: { 
        background: 'bg-pink-100', 
        text: 'text-pink-800', 
        border: 'border-pink-200',
        hover: 'hover:bg-pink-200' 
      },
      indigo: { 
        background: 'bg-indigo-100', 
        text: 'text-indigo-800', 
        border: 'border-indigo-200',
        hover: 'hover:bg-indigo-200' 
      },
      gray: { 
        background: 'bg-gray-100', 
        text: 'text-gray-800', 
        border: 'border-gray-200',
        hover: 'hover:bg-gray-200' 
      },
      orange: { 
        background: 'bg-orange-100', 
        text: 'text-orange-800', 
        border: 'border-orange-200',
        hover: 'hover:bg-orange-200' 
      },
      teal: { 
        background: 'bg-teal-100', 
        text: 'text-teal-800', 
        border: 'border-teal-200',
        hover: 'hover:bg-teal-200' 
      },
      emerald: { 
        background: 'bg-emerald-100', 
        text: 'text-emerald-800', 
        border: 'border-emerald-200',
        hover: 'hover:bg-emerald-200' 
      },
      lime: { 
        background: 'bg-lime-100', 
        text: 'text-lime-800', 
        border: 'border-lime-200',
        hover: 'hover:bg-lime-200' 
      }
    };

    return colorMap[this._colorName];
  }

  /**
   * Gets a CSS class string for the tag
   */
  getCssClasses(): string {
    const classes = this.getTailwindClasses();
    return `${classes.background} ${classes.text} ${classes.border} ${classes.hover}`;
  }

  /**
   * Checks if this color equals another color
   */
  equals(other: TagColor): boolean {
    return this._colorName === other._colorName;
  }

  /**
   * Returns the color name as string
   */
  toString(): string {
    return this._colorName;
  }

  /**
   * Creates TagColor from string with validation
   */
  static fromString(colorName: string): TagColor {
    if (!TagColor.isValidColor(colorName)) {
      throw new TagColorError(`Invalid tag color: ${colorName}`);
    }
    return new TagColor(colorName);
  }

  /**
   * Safe creation that returns default color if invalid
   */
  static fromStringSafe(colorName: string, defaultColor: TagColorName = 'blue'): TagColor {
    try {
      return TagColor.fromString(colorName);
    } catch {
      return new TagColor(defaultColor);
    }
  }
} 