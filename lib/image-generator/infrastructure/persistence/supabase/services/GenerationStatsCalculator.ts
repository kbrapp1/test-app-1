interface StatsRow {
  status: string;
  cost_cents: number;
  generation_time_seconds: number | null;
  saved_to_dam: boolean;
}

export interface GenerationStats {
  totalGenerations: number;
  completedGenerations: number;
  failedGenerations: number;
  totalCostCents: number;
  avgGenerationTimeSeconds: number;
  savedToDAMCount: number;
}

export class GenerationStatsCalculator {
  static calculateStats(data: StatsRow[]): GenerationStats {
    const totalGenerations = data.length;
    
    const completedGenerations = data.filter(
      row => row.status === 'completed'
    ).length;
    
    const failedGenerations = data.filter(
      row => row.status === 'failed'
    ).length;
    
    const totalCostCents = data.reduce(
      (sum, row) => sum + row.cost_cents, 
      0
    );
    
    const avgGenerationTimeSeconds = this.calculateAverageTime(data);
    
    const savedToDAMCount = data.filter(
      row => row.saved_to_dam
    ).length;

    return {
      totalGenerations,
      completedGenerations,
      failedGenerations,
      totalCostCents,
      avgGenerationTimeSeconds,
      savedToDAMCount,
    };
  }

  private static calculateAverageTime(data: StatsRow[]): number {
    if (data.length === 0) return 0;
    
    const validTimes = data
      .map(row => row.generation_time_seconds)
      .filter(time => time !== null) as number[];
    
    if (validTimes.length === 0) return 0;
    
    const totalTime = validTimes.reduce((sum, time) => sum + time, 0);
    return totalTime / validTimes.length;
  }
} 