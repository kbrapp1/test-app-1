/**
 * Message Processing Metrics Value Object
 * 
 * Tracks processing steps, performance metrics, and execution details for chat messages.
 * Encapsulates business logic for performance analysis and debugging.
 */

export interface MessageProcessingMetricsProps {
  processingSteps: ProcessingStep[];
  responseTime?: number;
  cacheHit?: boolean;
  processingTime?: number;
}

export interface ProcessingStep {
  step: string;
  duration: number;
  success: boolean;
  error?: string;
}

export class MessageProcessingMetrics {
  private constructor(private readonly props: MessageProcessingMetricsProps) {
    this.validateProps(props);
  }

  static create(props: MessageProcessingMetricsProps): MessageProcessingMetrics {
    return new MessageProcessingMetrics(props);
  }

  static createEmpty(): MessageProcessingMetrics {
    return new MessageProcessingMetrics({
      processingSteps: [],
    });
  }

  static createWithResponseTime(responseTime: number, cacheHit: boolean = false): MessageProcessingMetrics {
    return new MessageProcessingMetrics({
      processingSteps: [],
      responseTime,
      cacheHit,
      processingTime: responseTime,
    });
  }

  private validateProps(props: MessageProcessingMetricsProps): void {
    if (!Array.isArray(props.processingSteps)) {
      throw new Error('Processing steps must be an array');
    }

    props.processingSteps.forEach((step, index) => {
      if (!step.step?.trim()) {
        throw new Error(`Processing step at index ${index} must have a step name`);
      }
      if (typeof step.duration !== 'number' || step.duration < 0) {
        throw new Error(`Processing step at index ${index} must have a non-negative duration`);
      }
      if (typeof step.success !== 'boolean') {
        throw new Error(`Processing step at index ${index} must have a success boolean`);
      }
    });

    if (props.responseTime !== undefined && (typeof props.responseTime !== 'number' || props.responseTime < 0)) {
      throw new Error('Response time must be a non-negative number');
    }

    if (props.processingTime !== undefined && (typeof props.processingTime !== 'number' || props.processingTime < 0)) {
      throw new Error('Processing time must be a non-negative number');
    }
  }

  // Getters
  get processingSteps(): ProcessingStep[] { return [...this.props.processingSteps]; }
  get responseTime(): number | undefined { return this.props.responseTime; }
  get cacheHit(): boolean | undefined { return this.props.cacheHit; }
  get processingTime(): number | undefined { return this.props.processingTime; }

  // Business methods
  addProcessingStep(step: string, duration: number, success: boolean, error?: string): MessageProcessingMetrics {
    const newStep: ProcessingStep = { step, duration, success, error };
    
    return new MessageProcessingMetrics({
      ...this.props,
      processingSteps: [...this.props.processingSteps, newStep],
    });
  }

  updateResponseTime(responseTime: number): MessageProcessingMetrics {
    return new MessageProcessingMetrics({
      ...this.props,
      responseTime,
      processingTime: responseTime,
    });
  }

  markAsCacheHit(): MessageProcessingMetrics {
    return new MessageProcessingMetrics({
      ...this.props,
      cacheHit: true,
    });
  }

  markAsCacheMiss(): MessageProcessingMetrics {
    return new MessageProcessingMetrics({
      ...this.props,
      cacheHit: false,
    });
  }

  // Query methods
  getTotalProcessingDuration(): number {
    return this.props.processingSteps.reduce((total, step) => total + step.duration, 0);
  }

  hasFailedSteps(): boolean {
    return this.props.processingSteps.some(step => !step.success);
  }

  getFailedSteps(): ProcessingStep[] {
    return this.props.processingSteps.filter(step => !step.success);
  }

  getSuccessfulSteps(): ProcessingStep[] {
    return this.props.processingSteps.filter(step => step.success);
  }

  getStepByName(stepName: string): ProcessingStep | undefined {
    return this.props.processingSteps.find(step => step.step === stepName);
  }

  hasSteps(): boolean {
    return this.props.processingSteps.length > 0;
  }

  isFastResponse(threshold: number = 1000): boolean {
    const responseTime = this.props.responseTime || this.getTotalProcessingDuration();
    return responseTime <= threshold;
  }

  isSlowResponse(threshold: number = 5000): boolean {
    const responseTime = this.props.responseTime || this.getTotalProcessingDuration();
    return responseTime >= threshold;
  }

  wasCacheHit(): boolean {
    return this.props.cacheHit === true;
  }

  getPerformanceCategory(): 'fast' | 'normal' | 'slow' {
    const responseTime = this.props.responseTime || this.getTotalProcessingDuration();
    
    if (responseTime <= 1000) return 'fast';
    if (responseTime <= 5000) return 'normal';
    return 'slow';
  }

  getSuccessRate(): number {
    if (this.props.processingSteps.length === 0) return 1;
    
    const successfulSteps = this.getSuccessfulSteps().length;
    return successfulSteps / this.props.processingSteps.length;
  }

  getLongestStep(): ProcessingStep | null {
    if (this.props.processingSteps.length === 0) return null;
    
    return this.props.processingSteps.reduce((longest, current) => 
      current.duration > longest.duration ? current : longest
    );
  }

  getStepsSummary(): string {
    if (this.props.processingSteps.length === 0) return 'No processing steps recorded';
    
    const total = this.getTotalProcessingDuration();
    const successful = this.getSuccessfulSteps().length;
    const failed = this.getFailedSteps().length;
    
    return `${this.props.processingSteps.length} steps (${successful} successful, ${failed} failed) in ${total}ms`;
  }

  // Performance analysis
  getBottleneckStep(): ProcessingStep | null {
    return this.getLongestStep();
  }

  hasPerformanceIssues(): boolean {
    return this.isSlowResponse() || this.hasFailedSteps();
  }

  equals(other: MessageProcessingMetrics): boolean {
    return (
      this.props.processingSteps.length === other.props.processingSteps.length &&
      this.props.responseTime === other.props.responseTime &&
      this.props.cacheHit === other.props.cacheHit &&
      this.props.processingTime === other.props.processingTime
    );
  }

  toPlainObject(): MessageProcessingMetricsProps {
    return { ...this.props };
  }
} 