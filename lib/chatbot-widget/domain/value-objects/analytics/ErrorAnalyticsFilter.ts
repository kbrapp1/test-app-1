/**
 * Error Analytics Filter Value Object
 * 
 * AI INSTRUCTIONS:
 * - Domain value object for error analytics filtering
 * - Immutable with validation
 * - No external dependencies
 * - Business rules for valid filter combinations
 */

export interface ErrorAnalyticsFilterData {
  organizationId: string;
  timeRange: '1h' | '24h' | '7d' | '30d';
  severity?: string[];
  category?: string[];
  errorCode?: string[];
  sessionId?: string;
  userId?: string;
}

export class ErrorAnalyticsFilter {
  private constructor(private readonly data: ErrorAnalyticsFilterData) {
    this.validateFilter();
  }

  public static create(data: ErrorAnalyticsFilterData): ErrorAnalyticsFilter {
    return new ErrorAnalyticsFilter(data);
  }

  public static createForSession(sessionId: string, organizationId: string): ErrorAnalyticsFilter {
    return new ErrorAnalyticsFilter({
      organizationId,
      timeRange: '7d',
      sessionId
    });
  }

  public static createForUser(userId: string, organizationId: string): ErrorAnalyticsFilter {
    return new ErrorAnalyticsFilter({
      organizationId,
      timeRange: '7d',
      userId
    });
  }

  public get organizationId(): string {
    return this.data.organizationId;
  }

  public get timeRange(): string {
    return this.data.timeRange;
  }

  public get severity(): string[] | undefined {
    return this.data.severity;
  }

  public get category(): string[] | undefined {
    return this.data.category;
  }

  public get errorCode(): string[] | undefined {
    return this.data.errorCode;
  }

  public get sessionId(): string | undefined {
    return this.data.sessionId;
  }

  public get userId(): string | undefined {
    return this.data.userId;
  }

  public toData(): ErrorAnalyticsFilterData {
    return { ...this.data };
  }

  private validateFilter(): void {
    if (!this.data.organizationId) {
      throw new Error('Organization ID is required for error analytics filter');
    }

    const validTimeRanges = ['1h', '24h', '7d', '30d'];
    if (!validTimeRanges.includes(this.data.timeRange)) {
      throw new Error(`Invalid time range: ${this.data.timeRange}`);
    }

    // Business rule: Can't filter by both session and user simultaneously
    if (this.data.sessionId && this.data.userId) {
      throw new Error('Cannot filter by both session and user simultaneously');
    }
  }
}