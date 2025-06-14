export interface SimulationMetadataProps {
  readonly testerId?: string;
  readonly notes?: string;
  readonly tags: string[];
  readonly relatedSimulations: string[];
}

export class SimulationMetadata {
  private constructor(private readonly props: SimulationMetadataProps) {
    this.validateProps(props);
  }

  static create(props: Partial<SimulationMetadataProps> = {}): SimulationMetadata {
    return new SimulationMetadata({
      tags: [],
      relatedSimulations: [],
      ...props,
    });
  }

  static fromPersistence(props: SimulationMetadataProps): SimulationMetadata {
    return new SimulationMetadata(props);
  }

  private validateProps(props: SimulationMetadataProps): void {
    if (props.testerId !== undefined && !props.testerId.trim()) {
      throw new Error('Tester ID cannot be empty string');
    }

    if (props.tags.some(tag => !tag.trim())) {
      throw new Error('Tags cannot be empty strings');
    }

    if (props.relatedSimulations.some(id => !id.trim())) {
      throw new Error('Related simulation IDs cannot be empty strings');
    }

    // Check for duplicate tags
    const uniqueTags = new Set(props.tags);
    if (uniqueTags.size !== props.tags.length) {
      throw new Error('Duplicate tags are not allowed');
    }

    // Check for duplicate related simulations
    const uniqueRelated = new Set(props.relatedSimulations);
    if (uniqueRelated.size !== props.relatedSimulations.length) {
      throw new Error('Duplicate related simulation IDs are not allowed');
    }
  }

  // Getters
  get testerId(): string | undefined { return this.props.testerId; }
  get notes(): string | undefined { return this.props.notes; }
  get tags(): string[] { return this.props.tags; }
  get relatedSimulations(): string[] { return this.props.relatedSimulations; }

  // Business methods
  hasTesterId(): boolean {
    return this.props.testerId !== undefined && this.props.testerId.trim().length > 0;
  }

  hasNotes(): boolean {
    return this.props.notes !== undefined && this.props.notes.trim().length > 0;
  }

  hasTags(): boolean {
    return this.props.tags.length > 0;
  }

  hasRelatedSimulations(): boolean {
    return this.props.relatedSimulations.length > 0;
  }

  hasTag(tag: string): boolean {
    return this.props.tags.includes(tag);
  }

  isRelatedTo(simulationId: string): boolean {
    return this.props.relatedSimulations.includes(simulationId);
  }

  addTag(tag: string): SimulationMetadata {
    if (!tag.trim()) {
      throw new Error('Tag cannot be empty');
    }

    if (this.hasTag(tag)) {
      return this; // Already has tag, no change needed
    }

    return new SimulationMetadata({
      ...this.props,
      tags: [...this.props.tags, tag],
    });
  }

  removeTag(tag: string): SimulationMetadata {
    if (!this.hasTag(tag)) {
      return this; // Tag doesn't exist, no change needed
    }

    return new SimulationMetadata({
      ...this.props,
      tags: this.props.tags.filter(t => t !== tag),
    });
  }

  addRelatedSimulation(simulationId: string): SimulationMetadata {
    if (!simulationId.trim()) {
      throw new Error('Simulation ID cannot be empty');
    }

    if (this.isRelatedTo(simulationId)) {
      return this; // Already related, no change needed
    }

    return new SimulationMetadata({
      ...this.props,
      relatedSimulations: [...this.props.relatedSimulations, simulationId],
    });
  }

  removeRelatedSimulation(simulationId: string): SimulationMetadata {
    if (!this.isRelatedTo(simulationId)) {
      return this; // Not related, no change needed
    }

    return new SimulationMetadata({
      ...this.props,
      relatedSimulations: this.props.relatedSimulations.filter(id => id !== simulationId),
    });
  }

  updateNotes(notes: string): SimulationMetadata {
    return new SimulationMetadata({
      ...this.props,
      notes,
    });
  }

  appendNotes(additionalNotes: string): SimulationMetadata {
    if (!additionalNotes.trim()) {
      return this;
    }

    const currentNotes = this.props.notes || '';
    const separator = currentNotes ? '\n' : '';
    const newNotes = `${currentNotes}${separator}${additionalNotes}`.trim();

    return new SimulationMetadata({
      ...this.props,
      notes: newNotes,
    });
  }

  setTesterId(testerId: string): SimulationMetadata {
    if (!testerId.trim()) {
      throw new Error('Tester ID cannot be empty');
    }

    return new SimulationMetadata({
      ...this.props,
      testerId,
    });
  }

  clearTesterId(): SimulationMetadata {
    return new SimulationMetadata({
      ...this.props,
      testerId: undefined,
    });
  }

  getTagsAsString(): string {
    return this.props.tags.join(', ');
  }

  getRelatedSimulationsCount(): number {
    return this.props.relatedSimulations.length;
  }

  getTagsCount(): number {
    return this.props.tags.length;
  }

  isEmpty(): boolean {
    return !this.hasTesterId() && 
           !this.hasNotes() && 
           !this.hasTags() && 
           !this.hasRelatedSimulations();
  }

  toPlainObject(): SimulationMetadataProps {
    return { ...this.props };
  }
} 