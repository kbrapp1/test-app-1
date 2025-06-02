import { Generation } from '../entities/Generation';

// Base Specification interface
export interface Specification<T> {
  isSatisfiedBy(entity: T): boolean;
  and(other: Specification<T>): Specification<T>;
  or(other: Specification<T>): Specification<T>;
  not(): Specification<T>;
}

// Abstract base implementation
export abstract class BaseSpecification<T> implements Specification<T> {
  abstract isSatisfiedBy(entity: T): boolean;

  and(other: Specification<T>): Specification<T> {
    return new AndSpecification(this, other);
  }

  or(other: Specification<T>): Specification<T> {
    return new OrSpecification(this, other);
  }

  not(): Specification<T> {
    return new NotSpecification(this);
  }
}

// Composite specifications
class AndSpecification<T> extends BaseSpecification<T> {
  constructor(
    private left: Specification<T>,
    private right: Specification<T>
  ) {
    super();
  }

  isSatisfiedBy(entity: T): boolean {
    return this.left.isSatisfiedBy(entity) && this.right.isSatisfiedBy(entity);
  }
}

class OrSpecification<T> extends BaseSpecification<T> {
  constructor(
    private left: Specification<T>,
    private right: Specification<T>
  ) {
    super();
  }

  isSatisfiedBy(entity: T): boolean {
    return this.left.isSatisfiedBy(entity) || this.right.isSatisfiedBy(entity);
  }
}

class NotSpecification<T> extends BaseSpecification<T> {
  constructor(private spec: Specification<T>) {
    super();
  }

  isSatisfiedBy(entity: T): boolean {
    return !this.spec.isSatisfiedBy(entity);
  }
}

// Generation-specific specifications
export class CompletedGenerationSpecification extends BaseSpecification<Generation> {
  isSatisfiedBy(generation: Generation): boolean {
    return generation.status.toString() === 'completed';
  }
}

export class FailedGenerationSpecification extends BaseSpecification<Generation> {
  isSatisfiedBy(generation: Generation): boolean {
    return generation.status.toString() === 'failed';
  }
}

export class ActiveGenerationSpecification extends BaseSpecification<Generation> {
  isSatisfiedBy(generation: Generation): boolean {
    return ['pending', 'processing'].includes(generation.status.toString());
  }
}

export class SavedToDAMSpecification extends BaseSpecification<Generation> {
  isSatisfiedBy(generation: Generation): boolean {
    return generation.savedToDAM;
  }
}

export class RecentGenerationSpecification extends BaseSpecification<Generation> {
  constructor(private hoursAgo: number = 24) {
    super();
  }

  isSatisfiedBy(generation: Generation): boolean {
    const hoursAgoDate = new Date();
    hoursAgoDate.setHours(hoursAgoDate.getHours() - this.hoursAgo);
    return generation.createdAt > hoursAgoDate;
  }
}

export class ExpensiveGenerationSpecification extends BaseSpecification<Generation> {
  constructor(private minCostCents: number = 10) {
    super();
  }

  isSatisfiedBy(generation: Generation): boolean {
    return generation.costCents >= this.minCostCents;
  }
}

export class UserGenerationSpecification extends BaseSpecification<Generation> {
  constructor(private userId: string) {
    super();
  }

  isSatisfiedBy(generation: Generation): boolean {
    return generation.userId === this.userId;
  }
}

// Pre-built composite specifications
export class SuccessfulRecentGenerationSpecification extends BaseSpecification<Generation> {
  private spec: Specification<Generation>;

  constructor(hoursAgo: number = 24) {
    super();
    this.spec = new CompletedGenerationSpecification()
      .and(new RecentGenerationSpecification(hoursAgo));
  }

  isSatisfiedBy(generation: Generation): boolean {
    return this.spec.isSatisfiedBy(generation);
  }
} 