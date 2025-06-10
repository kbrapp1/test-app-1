/**
 * PredictionStatus Value Object
 * Encapsulates TTS prediction status with business rules and validation
 */

export type PredictionStatusType = 
  | 'pending'
  | 'starting' 
  | 'processing'
  | 'completed'
  | 'succeeded'  // Legacy Replicate status
  | 'failed'
  | 'canceled';

export class PredictionStatus {
  private readonly _value: PredictionStatusType;

  constructor(status: string | PredictionStatusType) {
    const normalizedStatus = this.normalizeStatus(status);
    this.validateStatus(normalizedStatus);
    this._value = normalizedStatus;
  }

  get value(): PredictionStatusType {
    return this._value;
  }

  /**
   * Check if prediction is in a final state (no more changes expected)
   */
  get isFinal(): boolean {
    return this._value === 'completed' || 
           this._value === 'succeeded' || 
           this._value === 'failed' || 
           this._value === 'canceled';
  }

  /**
   * Check if prediction is successful
   */
  get isSuccessful(): boolean {
    return this._value === 'completed' || this._value === 'succeeded';
  }

  /**
   * Check if prediction is still processing
   */
  get isProcessing(): boolean {
    return this._value === 'pending' || 
           this._value === 'starting' || 
           this._value === 'processing';
  }

  /**
   * Check if status can transition to new status (business rule)
   */
  canTransitionTo(newStatus: PredictionStatusType): boolean {
    // Can't change final states
    if (this.isFinal) {
      return false;
    }

    // Valid transitions
    const validTransitions: Record<PredictionStatusType, PredictionStatusType[]> = {
      'pending': ['starting', 'processing', 'failed', 'canceled'],
      'starting': ['processing', 'completed', 'succeeded', 'failed', 'canceled'],
      'processing': ['completed', 'succeeded', 'failed', 'canceled'],
      'completed': [], // Final state
      'succeeded': [], // Final state  
      'failed': [],    // Final state
      'canceled': []   // Final state
    };

    return validTransitions[this._value]?.includes(newStatus) ?? false;
  }

  /**
   * Create new status if transition is valid
   */
  transitionTo(newStatus: PredictionStatusType): PredictionStatus {
    if (!this.canTransitionTo(newStatus)) {
      throw new Error(`Invalid status transition from '${this._value}' to '${newStatus}'`);
    }
    return new PredictionStatus(newStatus);
  }

  /**
   * Normalize different status formats to standard format
   */
  private normalizeStatus(status: string): PredictionStatusType {
    const normalized = status.toLowerCase().trim();
    
    // Handle legacy Replicate statuses
    if (normalized === 'succeeded') return 'succeeded';
    if (normalized === 'completed') return 'completed';
    
    // Map other variations
    const statusMap: Record<string, PredictionStatusType> = {
      'pending': 'pending',
      'starting': 'starting', 
      'processing': 'processing',
      'completed': 'completed',
      'succeeded': 'succeeded',
      'failed': 'failed',
      'canceled': 'canceled',
      'cancelled': 'canceled' // British spelling
    };

    const mappedStatus = statusMap[normalized];
    if (!mappedStatus) {
      throw new Error(`Invalid prediction status: '${status}'`);
    }

    return mappedStatus;
  }

  /**
   * Validate status value
   */
  private validateStatus(status: PredictionStatusType): void {
    const validStatuses: PredictionStatusType[] = [
      'pending', 'starting', 'processing', 'completed', 'succeeded', 'failed', 'canceled'
    ];

    if (!validStatuses.includes(status)) {
      throw new Error(`Invalid prediction status: '${status}'`);
    }
  }

  /**
   * Convert to string for database storage
   */
  toString(): string {
    return this._value;
  }

  /**
   * Check equality with another status
   */
  equals(other: PredictionStatus | string): boolean {
    if (typeof other === 'string') {
      try {
        other = new PredictionStatus(other);
      } catch {
        return false;
      }
    }
    return this._value === other._value;
  }

  /**
   * Static factory methods for common statuses
   */
  static pending(): PredictionStatus {
    return new PredictionStatus('pending');
  }

  static starting(): PredictionStatus {
    return new PredictionStatus('starting');
  }

  static processing(): PredictionStatus {
    return new PredictionStatus('processing');
  }

  static completed(): PredictionStatus {
    return new PredictionStatus('completed');
  }

  static succeeded(): PredictionStatus {
    return new PredictionStatus('succeeded');
  }

  static failed(): PredictionStatus {
    return new PredictionStatus('failed');
  }

  static canceled(): PredictionStatus {
    return new PredictionStatus('canceled');
  }
} 