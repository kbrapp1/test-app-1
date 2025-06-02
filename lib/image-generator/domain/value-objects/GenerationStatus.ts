export type GenerationStatusValue = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';

export class GenerationStatus {
  private readonly _value: GenerationStatusValue;

  private constructor(value: GenerationStatusValue) {
    this._value = value;
  }

  get value(): GenerationStatusValue {
    return this._value;
  }

  static create(status: string): GenerationStatus {
    if (!this.isValidStatus(status)) {
      throw new Error(`Invalid generation status: ${status}. Must be one of: pending, processing, completed, failed, cancelled`);
    }
    return new GenerationStatus(status as GenerationStatusValue);
  }

  private static isValidStatus(status: string): status is GenerationStatusValue {
    const validStatuses: GenerationStatusValue[] = ['pending', 'processing', 'completed', 'failed', 'cancelled'];
    return validStatuses.includes(status as GenerationStatusValue);
  }

  canTransitionTo(newStatus: GenerationStatus): boolean {
    const transitions: Record<GenerationStatusValue, GenerationStatusValue[]> = {
      pending: ['processing', 'failed', 'cancelled'],
      processing: ['completed', 'failed', 'cancelled'],
      completed: [], // Terminal state
      failed: [], // Terminal state
      cancelled: [] // Terminal state
    };

    return transitions[this._value].includes(newStatus._value);
  }

  transitionTo(newStatusValue: GenerationStatusValue): GenerationStatus {
    const newStatus = GenerationStatus.create(newStatusValue);
    if (!this.canTransitionTo(newStatus)) {
      throw new Error(`Cannot transition from ${this._value} to ${newStatusValue}`);
    }
    return newStatus;
  }

  static fromString(status: string): GenerationStatus {
    return GenerationStatus.create(status);
  }

  isTerminal(): boolean {
    return this._value === 'completed' || this._value === 'failed' || this._value === 'cancelled';
  }

  getDisplayText(): string {
    const displayTexts: Record<GenerationStatusValue, string> = {
      pending: 'Pending',
      processing: 'Processing',
      completed: 'Completed',
      failed: 'Failed',
      cancelled: 'Cancelled'
    };

    return displayTexts[this._value];
  }

  getProgressPercentage(): number {
    const progressMap: Record<GenerationStatusValue, number> = {
      pending: 0,
      processing: 50,
      completed: 100,
      failed: 0,
      cancelled: 0
    };

    return progressMap[this._value];
  }

  // Additional utility methods
  isSuccess(): boolean {
    return this._value === 'completed';
  }

  isError(): boolean {
    return this._value === 'failed';
  }

  isInProgress(): boolean {
    return this._value === 'pending' || this._value === 'processing';
  }

  getColorCode(): string {
    const colorMap: Record<GenerationStatusValue, string> = {
      pending: '#f59e0b', // yellow
      processing: '#3b82f6', // blue
      completed: '#10b981', // green
      failed: '#ef4444', // red
      cancelled: '#6b7280' // gray
    };

    return colorMap[this._value];
  }

  getIcon(): string {
    const iconMap: Record<GenerationStatusValue, string> = {
      pending: '⏳',
      processing: '🔄',
      completed: '✅',
      failed: '❌',
      cancelled: '⏹️'
    };

    return iconMap[this._value];
  }

  getDescription(): string {
    const descriptions: Record<GenerationStatusValue, string> = {
      pending: 'Your image generation request is queued and waiting to be processed',
      processing: 'AI is currently generating your image based on the provided prompt',
      completed: 'Image generation completed successfully and is ready for use',
      failed: 'Image generation failed due to an error or invalid input',
      cancelled: 'Image generation was cancelled by the user or system'
    };

    return descriptions[this._value];
  }

  equals(other: GenerationStatus): boolean {
    return this._value === other._value;
  }

  toString(): string {
    return this._value;
  }

  // Helper method for API responses
  toJSON(): { value: GenerationStatusValue; display: string; progress: number } {
    return {
      value: this._value,
      display: this.getDisplayText(),
      progress: this.getProgressPercentage()
    };
  }

  // Static factory methods for convenience
  static pending(): GenerationStatus {
    return new GenerationStatus('pending');
  }

  static processing(): GenerationStatus {
    return new GenerationStatus('processing');
  }

  static completed(): GenerationStatus {
    return new GenerationStatus('completed');
  }

  static failed(): GenerationStatus {
    return new GenerationStatus('failed');
  }

  static cancelled(): GenerationStatus {
    return new GenerationStatus('cancelled');
  }
} 