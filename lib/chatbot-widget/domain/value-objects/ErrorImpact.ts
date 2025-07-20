/**
 * Error Impact Value Object
 * 
 * Immutable domain value object representing the business impact of errors.
 * Provides structured assessment of error scope, severity, and user impact.
 */

export type ErrorScope = 'user' | 'organization' | 'system';
export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface ErrorImpactData {
  scope: ErrorScope;
  severity: ErrorSeverity;
  userFacing: boolean;
  description?: string;
}

export class ErrorImpact {
  private constructor(
    private readonly data: ErrorImpactData
  ) {
    Object.freeze(this.data);
  }

  static create(data: ErrorImpactData): ErrorImpact {
    ErrorImpact.validateImpactData(data);
    return new ErrorImpact(data);
  }

  static createUserImpact(severity: ErrorSeverity, userFacing = true): ErrorImpact {
    return ErrorImpact.create({
      scope: 'user',
      severity,
      userFacing
    });
  }

  static createOrganizationImpact(severity: ErrorSeverity, userFacing = false): ErrorImpact {
    return ErrorImpact.create({
      scope: 'organization',
      severity,
      userFacing
    });
  }

  static createSystemImpact(severity: ErrorSeverity = 'critical', userFacing = true): ErrorImpact {
    return ErrorImpact.create({
      scope: 'system',
      severity,
      userFacing
    });
  }

  private static validateImpactData(data: ErrorImpactData): void {
    const validScopes: ErrorScope[] = ['user', 'organization', 'system'];
    const validSeverities: ErrorSeverity[] = ['low', 'medium', 'high', 'critical'];

    if (!validScopes.includes(data.scope)) {
      throw new Error(`Invalid error scope: ${data.scope}. Must be one of: ${validScopes.join(', ')}`);
    }

    if (!validSeverities.includes(data.severity)) {
      throw new Error(`Invalid error severity: ${data.severity}. Must be one of: ${validSeverities.join(', ')}`);
    }

    // Business rule: System errors should typically be high or critical severity
    if (data.scope === 'system' && !['high', 'critical'].includes(data.severity)) {
      throw new Error('System-scoped errors should be high or critical severity');
    }
  }

  get scope(): ErrorScope {
    return this.data.scope;
  }

  get severity(): ErrorSeverity {
    return this.data.severity;
  }

  get userFacing(): boolean {
    return this.data.userFacing;
  }

  get description(): string | undefined {
    return this.data.description;
  }

  getSeverityLevel(): number {
    const levels = { low: 1, medium: 2, high: 3, critical: 4 };
    return levels[this.severity];
  }

  getScopeLevel(): number {
    const levels = { user: 1, organization: 2, system: 3 };
    return levels[this.scope];
  }

  isHighPriority(): boolean {
    return this.getSeverityLevel() >= 3 || this.scope === 'system';
  }

  requiresImmediateAttention(): boolean {
    return this.severity === 'critical' || (this.scope === 'system' && this.userFacing);
  }

  toLogData(): Record<string, unknown> {
    return {
      scope: this.scope,
      severity: this.severity,
      userFacing: this.userFacing,
      severityLevel: this.getSeverityLevel(),
      scopeLevel: this.getScopeLevel(),
      highPriority: this.isHighPriority(),
      requiresAttention: this.requiresImmediateAttention(),
      ...(this.description && { description: this.description })
    };
  }

  withDescription(description: string): ErrorImpact {
    return ErrorImpact.create({ ...this.data, description });
  }

  equals(other: ErrorImpact): boolean {
    return JSON.stringify(this.data) === JSON.stringify(other.data);
  }
}