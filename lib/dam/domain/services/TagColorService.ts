/**
 * TagColorService - Domain Service for Tag Color Management
 * 
 * Provides utilities for managing tag colors with deterministic assignment
 * following DDD principles.
 */

import { TagColor, TagColorName } from '../value-objects/TagColor';

export class TagColorService {
  /**
   * Gets the deterministic color for a tag name
   * Same tag name will always return the same color
   */
  static getColorForTagName(tagName: string): TagColorName {
    return TagColor.createForTagName(tagName).colorName;
  }

  /**
   * Validates if a color assignment is consistent with the deterministic system
   */
  static isConsistentColor(tagName: string, color: TagColorName): boolean {
    const expectedColor = TagColor.createForTagName(tagName).colorName;
    return expectedColor === color;
  }

  /**
   * Gets color assignments for multiple tag names
   * Useful for batch operations
   */
  static getColorsForTagNames(tagNames: string[]): Record<string, TagColorName> {
    const assignments: Record<string, TagColorName> = {};
    
    tagNames.forEach(tagName => {
      assignments[tagName] = TagColor.createForTagName(tagName).colorName;
    });
    
    return assignments;
  }

  /**
   * Demonstrates color distribution across common tag names
   * Useful for testing the hash function distribution
   */
  static demonstrateColorDistribution(): { tagName: string; color: TagColorName }[] {
    const commonTags = [
      'important', 'urgent', 'review', 'draft', 'approved', 'marketing',
      'design', 'development', 'testing', 'documentation', 'archive',
      'todo', 'done', 'in-progress', 'blocked', 'low-priority',
      'high-priority', 'bug', 'feature', 'enhancement'
    ];

    return commonTags.map(tagName => ({
      tagName,
      color: TagColor.createForTagName(tagName).colorName
    }));
  }

  /**
   * Gets all available colors with their CSS classes
   */
  static getAllColorOptions(): Array<{
    name: TagColorName;
    cssClasses: string;
    tailwindClasses: ReturnType<TagColor['getTailwindClasses']>;
  }> {
    return TagColor.getAllColors().map(colorName => {
      const tagColor = new TagColor(colorName);
      return {
        name: colorName,
        cssClasses: tagColor.getCssClasses(),
        tailwindClasses: tagColor.getTailwindClasses()
      };
    });
  }

  /**
   * Checks if the tag name would result in good color distribution
   * Returns true if the color assignment seems reasonable
   */
  static hasGoodColorDistribution(tagNames: string[]): boolean {
    const colorAssignments = TagColorService.getColorsForTagNames(tagNames);
    const colorCounts: Record<TagColorName, number> = {} as Record<TagColorName, number>;
    
    // Count color usage
    Object.values(colorAssignments).forEach(color => {
      colorCounts[color] = (colorCounts[color] || 0) + 1;
    });
    
    const totalColors = TagColor.getAllColors().length;
    const totalTags = tagNames.length;
    const expectedPerColor = totalTags / totalColors;
    
    // Check if any color is used more than 2x the expected amount
    const maxUsage = Math.max(...Object.values(colorCounts));
    return maxUsage <= expectedPerColor * 2;
  }
} 