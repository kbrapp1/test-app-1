export interface GenerationStats {
  totalGenerations: number;
  completedGenerations: number;
  failedGenerations: number;
  totalCostCents: number;
  avgGenerationTimeSeconds: number;
  savedToDAMCount: number;
}