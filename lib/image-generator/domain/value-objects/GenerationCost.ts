// GenerationCost Value Object - DDD Domain Layer
// Single Responsibility: Handle generation cost calculations and pricing
// Pure value object with immutability and business pricing rules

export class GenerationCost {
  private readonly _cents: number;
  private readonly _modelName: string;

  private constructor(cents: number, modelName: string) {
    this.validateCost(cents);
    this._cents = cents;
    this._modelName = modelName;
  }

  get cents(): number { return this._cents; }
  get modelName(): string { return this._modelName; }
  get dollars(): number { return this._cents / 100; }

  static fromModel(modelName: string): GenerationCost {
    const cents = GenerationCost.getModelCost(modelName);
    return new GenerationCost(cents, modelName);
  }

  static fromCents(cents: number, modelName: string = 'unknown'): GenerationCost {
    return new GenerationCost(cents, modelName);
  }

  equals(other: GenerationCost): boolean {
    return this._cents === other._cents && this._modelName === other._modelName;
  }

  toDisplayString(): string {
    if (this._cents === 0) return 'Free';
    if (this._cents < 100) return `${this._cents}¢`;
    return `$${this.dollars.toFixed(2)}`;
  }

  add(other: GenerationCost): GenerationCost {
    return GenerationCost.fromCents(
      this._cents + other._cents,
      `${this._modelName}+${other._modelName}`
    );
  }

  multiply(factor: number): GenerationCost {
    if (factor < 0) throw new Error('Cost factor cannot be negative');
    return GenerationCost.fromCents(
      Math.round(this._cents * factor),
      this._modelName
    );
  }

  isZero(): boolean {
    return this._cents === 0;
  }

  isFree(): boolean {
    return this.isZero();
  }

  private validateCost(cents: number): void {
    if (!Number.isInteger(cents)) {
      throw new Error('Cost must be an integer (cents)');
    }
    if (cents < 0) {
      throw new Error('Cost cannot be negative');
    }
    if (cents > 10000) { // $100 max
      throw new Error('Cost cannot exceed $100');
    }
  }

  private static getModelCost(modelName: string): number {
    const modelCosts: Record<string, number> = {
      'flux-schnell': 1,         // 1 cent - fast model
      'flux-kontext-max': 8,     // 8 cents - high quality
      'flux-pro': 5,             // 5 cents - balanced
      'flux-1.1-pro': 5,         // 5 cents - legacy
      'stable-diffusion': 2,     // 2 cents - standard
      'dalle-3': 10,             // 10 cents - premium
    };
    
    return modelCosts[modelName] || 1; // Default to lowest cost
  }
} 