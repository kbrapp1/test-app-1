/**
 * Error Summary Value Object
 * 
 * AI INSTRUCTIONS:
 * - Immutable domain value object
 * - Represents aggregated error data
 * - Contains business logic for summary calculations
 * - No external dependencies
 */

export interface ErrorSummaryData {
  totalErrors: number;
  errorsByCode: Record<string, number>;
  errorsBySeverity: Record<string, number>;
  errorsByCategory: Record<string, number>;
  errorsByTable: Record<string, number>;
  recentErrors: Array<{
    errorCode: string;
    errorMessage: string;
    errorCategory: string;
    severity: string;
    createdAt: string;
    tableName: string;
  }>;
}

export class ErrorSummary {
  private constructor(private readonly data: ErrorSummaryData) {}

  public static create(data: ErrorSummaryData): ErrorSummary {
    return new ErrorSummary(data);
  }

  public static createEmpty(): ErrorSummary {
    return new ErrorSummary({
      totalErrors: 0,
      errorsByCode: {},
      errorsBySeverity: {},
      errorsByCategory: {},
      errorsByTable: {},
      recentErrors: []
    });
  }

  public get totalErrors(): number {
    return this.data.totalErrors;
  }

  public get errorsByCode(): Record<string, number> {
    return { ...this.data.errorsByCode };
  }

  public get errorsBySeverity(): Record<string, number> {
    return { ...this.data.errorsBySeverity };
  }

  public get errorsByCategory(): Record<string, number> {
    return { ...this.data.errorsByCategory };
  }

  public get errorsByTable(): Record<string, number> {
    return { ...this.data.errorsByTable };
  }

  public get recentErrors(): Array<{
    errorCode: string;
    errorMessage: string;
    errorCategory: string;
    severity: string;
    createdAt: string;
    tableName: string;
  }> {
    return [...this.data.recentErrors];
  }

  public getMostFrequentErrorCode(): string | null {
    const codes = Object.entries(this.data.errorsByCode);
    if (codes.length === 0) return null;

    return codes.reduce((max, [code, count]) => 
      count > (this.data.errorsByCode[max] || 0) ? code : max, 
      codes[0][0]
    );
  }

  public getCriticalErrorCount(): number {
    return this.data.errorsBySeverity['critical'] || 0;
  }

  public hasErrors(): boolean {
    return this.data.totalErrors > 0;
  }

  public toData(): ErrorSummaryData {
    return {
      totalErrors: this.data.totalErrors,
      errorsByCode: { ...this.data.errorsByCode },
      errorsBySeverity: { ...this.data.errorsBySeverity },
      errorsByCategory: { ...this.data.errorsByCategory },
      errorsByTable: { ...this.data.errorsByTable },
      recentErrors: [...this.data.recentErrors]
    };
  }
}