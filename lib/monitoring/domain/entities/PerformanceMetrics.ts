export interface WebVitalsMetrics {
  CLS?: number;
  LCP?: number;
  FCP?: number;
  INP?: number;
  TTFB?: number;
}

export interface PerformanceMetrics {
  cacheSize: number;
  activeMutations: number;
  isOptimized: boolean;
  lastUpdate: string;
  webVitals?: WebVitalsMetrics;
}

export interface RenderMetrics {
  count: number;
  rapidCount: number;
  lastReset: number;
}

export class PerformanceScore {
  private constructor(private readonly value: number) {
    if (value < 0 || value > 100) {
      throw new Error('Performance score must be between 0 and 100');
    }
  }

  static create(value: number): PerformanceScore {
    return new PerformanceScore(Math.max(0, Math.round(value)));
  }

  getValue(): number {
    return this.value;
  }

  getColor(): 'green' | 'yellow' | 'red' {
    if (this.value >= 90) return 'green';
    if (this.value >= 70) return 'yellow';
    return 'red';
  }
} 