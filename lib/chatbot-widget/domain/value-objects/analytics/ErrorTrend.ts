/**
 * Error Trend Value Object
 * 
 * AI INSTRUCTIONS:
 * - Immutable domain value object for error trends
 * - Represents time-based error patterns
 * - Contains trend analysis business logic
 * - No external dependencies
 */

export interface ErrorTrendData {
  period: string;
  errorCount: number;
  severity: string;
  category: string;
}

export class ErrorTrend {
  private constructor(private readonly data: ErrorTrendData) {
    this.validateTrend();
  }

  public static create(data: ErrorTrendData): ErrorTrend {
    return new ErrorTrend(data);
  }

  public get period(): string {
    return this.data.period;
  }

  public get errorCount(): number {
    return this.data.errorCount;
  }

  public get severity(): string {
    return this.data.severity;
  }

  public get category(): string {
    return this.data.category;
  }

  public get periodDate(): Date {
    return new Date(this.data.period);
  }

  public isCritical(): boolean {
    return this.data.severity === 'critical';
  }

  public isHighVolume(): boolean {
    return this.data.errorCount > 10;
  }

  public toData(): ErrorTrendData {
    return { ...this.data };
  }

  private validateTrend(): void {
    if (!this.data.period) {
      throw new Error('Period is required for error trend');
    }

    if (this.data.errorCount < 0) {
      throw new Error('Error count cannot be negative');
    }

    if (!this.data.severity) {
      throw new Error('Severity is required for error trend');
    }

    if (!this.data.category) {
      throw new Error('Category is required for error trend');
    }

    // Validate period is a valid date
    const periodDate = new Date(this.data.period);
    if (isNaN(periodDate.getTime())) {
      throw new Error('Period must be a valid date string');
    }
  }
}