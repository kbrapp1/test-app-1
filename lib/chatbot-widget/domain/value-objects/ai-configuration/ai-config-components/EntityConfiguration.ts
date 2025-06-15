/**
 * Entity Configuration Value Object
 * 
 * AI INSTRUCTIONS:
 * - Single responsibility: Manage entity extraction configuration
 * - Handle entity types and extraction modes
 * - Keep under 200-250 lines
 * - Focus on entity configuration only
 * - Follow @golden-rule patterns exactly
 */

export interface EntityConfigurationProps {
  enableAdvancedEntities: boolean;
  extractionMode: 'basic' | 'comprehensive' | 'custom';
  customEntityTypes: string[];
}

export class EntityConfiguration {
  private constructor(private readonly props: EntityConfigurationProps) {
    this.validateProps(props);
  }

  static create(props: EntityConfigurationProps): EntityConfiguration {
    return new EntityConfiguration(props);
  }

  static createDefault(): EntityConfiguration {
    return new EntityConfiguration({
      enableAdvancedEntities: true,
      extractionMode: 'comprehensive',
      customEntityTypes: []
    });
  }

  private validateProps(props: EntityConfigurationProps): void {
    if (props.extractionMode === 'custom' && props.customEntityTypes.length === 0) {
      throw new Error('Custom extraction mode requires at least one custom entity type');
    }
    
    // Validate custom entity types
    props.customEntityTypes.forEach(entityType => {
      if (!entityType.trim()) {
        throw new Error('Entity type cannot be empty');
      }
      if (entityType.length > 50) {
        throw new Error('Entity type cannot exceed 50 characters');
      }
    });
  }

  // Getters
  get enableAdvancedEntities(): boolean { return this.props.enableAdvancedEntities; }
  get extractionMode(): string { return this.props.extractionMode; }
  get customEntityTypes(): string[] { return [...this.props.customEntityTypes]; }

  // Business methods
  update(updates: Partial<EntityConfigurationProps>): EntityConfiguration {
    return new EntityConfiguration({
      ...this.props,
      ...updates
    });
  }

  enableAdvanced(): EntityConfiguration {
    return this.update({ enableAdvancedEntities: true });
  }

  disableAdvanced(): EntityConfiguration {
    return this.update({ enableAdvancedEntities: false });
  }

  setExtractionMode(mode: EntityConfigurationProps['extractionMode']): EntityConfiguration {
    return this.update({ extractionMode: mode });
  }

  addCustomEntityType(entityType: string): EntityConfiguration {
    if (this.props.customEntityTypes.includes(entityType)) {
      return this;
    }

    return this.update({
      customEntityTypes: [...this.props.customEntityTypes, entityType]
    });
  }

  removeCustomEntityType(entityType: string): EntityConfiguration {
    return this.update({
      customEntityTypes: this.props.customEntityTypes.filter(type => type !== entityType)
    });
  }

  clearCustomEntityTypes(): EntityConfiguration {
    return this.update({ customEntityTypes: [] });
  }

  hasCustomEntityType(entityType: string): boolean {
    return this.props.customEntityTypes.includes(entityType);
  }

  getCustomEntityCount(): number {
    return this.props.customEntityTypes.length;
  }

  isBasicMode(): boolean {
    return this.props.extractionMode === 'basic';
  }

  isComprehensiveMode(): boolean {
    return this.props.extractionMode === 'comprehensive';
  }

  isCustomMode(): boolean {
    return this.props.extractionMode === 'custom';
  }

  getComplexityLevel(): 'low' | 'medium' | 'high' {
    if (this.isBasicMode()) return 'low';
    if (this.isComprehensiveMode() && !this.props.enableAdvancedEntities) return 'medium';
    return 'high';
  }

  toPlainObject(): EntityConfigurationProps {
    return {
      ...this.props,
      customEntityTypes: [...this.props.customEntityTypes]
    };
  }
} 