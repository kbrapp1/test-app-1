/**
 * Mapping Result Value Object
 * 
 * AI INSTRUCTIONS:
 * - Domain value object for type-safe mapping results
 * - Encapsulates success/failure states with validation
 * - No external dependencies
 * - Contains mapping business rules
 */

export class MappingResult<T> {
  private constructor(
    private readonly _value: T | null,
    private readonly _isValid: boolean,
    private readonly _errorMessage?: string
  ) {}

  public static success<T>(value: T): MappingResult<T> {
    return new MappingResult(value, true);
  }

  public static failure<T>(errorMessage: string): MappingResult<T> {
    return new MappingResult<T>(null, false, errorMessage);
  }

  public static fromValue<T>(value: unknown, defaultValue: T): MappingResult<T> {
    if (value !== null && value !== undefined) {
      return MappingResult.success(value as T);
    }
    return MappingResult.success(defaultValue);
  }

  public get isValid(): boolean {
    return this._isValid;
  }

  public get value(): T {
    if (!this._isValid || this._value === null) {
      throw new Error(`Cannot access value of invalid mapping result: ${this._errorMessage}`);
    }
    return this._value;
  }

  public get errorMessage(): string | undefined {
    return this._errorMessage;
  }

  public getValueOrDefault(defaultValue: T): T {
    return this._isValid && this._value !== null ? this._value : defaultValue;
  }

  public map<U>(transform: (value: T) => U): MappingResult<U> {
    if (!this._isValid || this._value === null) {
      return MappingResult.failure(this._errorMessage || 'Invalid mapping result');
    }
    
    try {
      const transformed = transform(this._value);
      return MappingResult.success(transformed);
    } catch (error) {
      return MappingResult.failure(
        error instanceof Error ? error.message : 'Transformation failed'
      );
    }
  }

  public flatMap<U>(transform: (value: T) => MappingResult<U>): MappingResult<U> {
    if (!this._isValid || this._value === null) {
      return MappingResult.failure(this._errorMessage || 'Invalid mapping result');
    }
    
    try {
      return transform(this._value);
    } catch (error) {
      return MappingResult.failure(
        error instanceof Error ? error.message : 'Transformation failed'
      );
    }
  }
}