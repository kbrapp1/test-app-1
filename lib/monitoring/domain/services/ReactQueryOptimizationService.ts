import { NetworkPatternAnalysisService } from './NetworkPatternAnalysisService';

export interface ReactQueryOpportunity {
  suggestedKey: string;
  strategy: string;
  performanceGain: string;
}

export class ReactQueryOptimizationService {
  static analyzeOptimizationOpportunity(pattern: any): ReactQueryOpportunity | null {
    const duplicateCount = pattern.duplicateCalls.length;
    
    if (duplicateCount < 2) return null;
    
    const queryKey = NetworkPatternAnalysisService.generateQueryKey(pattern.originalCall);
    let strategy = 'Basic caching';
    let performanceGain = `${duplicateCount} fewer API calls`;
    
    if (pattern.pattern === 'rapid-fire') {
      strategy = 'Debounced queries with short stale time';
      performanceGain = `${duplicateCount} fewer calls + improved UX`;
    } else if (pattern.pattern === 'identical') {
      strategy = 'Standard caching with 5min stale time';
      performanceGain = `${duplicateCount} fewer calls + instant responses`;
    }
    
    return {
      suggestedKey: queryKey,
      strategy,
      performanceGain
    };
  }
} 