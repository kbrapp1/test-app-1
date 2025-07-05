/**
 * Prompt Performance Types
 * 
 * AI INSTRUCTIONS:
 * - Shared types and interfaces for prompt performance domain
 * - Keep types pure and focused on domain concepts
 * - Follow @golden-rule patterns for type definitions
 * - No business logic, only type definitions
 */

// ===== CORE PERFORMANCE METRICS =====

export interface PromptMetrics {
  promptTokens: number;
  completionTokens: number;
  moduleTokens: Record<string, number>;
  responseRelevance?: number;
  entityExtractionAccuracy?: number;
  leadQualificationAccuracy?: number;
  conversationProgression?: number;
  userEngagement?: number;
  conversionRate?: number;
  averageSessionLength?: number;
  escalationRate?: number;
}

// ===== TOKEN ANALYSIS TYPES =====

export interface TokenAnalysis {
  totalTokens: number;
  promptTokens: number;
  completionTokens: number;
  promptRatio: number;
  efficiency: number;
  breakdown: ModuleTokenBreakdown;
  recommendations: string[];
}

export interface ModuleTokenBreakdown {
  total: number;
  modules: ModuleTokenInfo[];
  distribution: TokenDistribution;
  wasteIdentification: TokenWasteAnalysis[];
}

export interface ModuleTokenInfo {
  module: string;
  tokens: number;
  percentage: number;
  efficiency: number;
  status: 'optimal' | 'acceptable' | 'oversized' | 'critical';
}

export interface TokenDistribution {
  core: { tokens: number; percentage: number };
  context: { tokens: number; percentage: number };
  enhancement: { tokens: number; percentage: number };
  balance: number;
}

export interface TokenWasteAnalysis {
  module: string;
  currentTokens: number;
  optimalTokens: number;
  wastedTokens: number;
  wastePercentage: number;
  recommendations: string[];
}

// ===== EFFECTIVENESS ANALYSIS TYPES =====

export interface EffectivenessAnalysis {
  responseRelevance: number;
  entityExtractionAccuracy: number;
  leadQualificationAccuracy: number;
  conversationProgression: number;
  userEngagement: number;
  conversionRate: number;
  averageSessionLength: number;
  escalationRate: number;
}

// ===== OPTIMIZATION TYPES =====

export interface OptimizationRecommendation {
  type: string;
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  effort: 'high' | 'medium' | 'low';
  actions: string[];
}

// ===== PERFORMANCE ANALYSIS TYPES =====

export interface PromptPerformanceAnalysis {
  tokenAnalysis: TokenAnalysis;
  effectivenessAnalysis: EffectivenessAnalysis;
  optimizationRecommendations: OptimizationRecommendation[];
  overallScore: number;
  timestamp: Date;
}

// ===== REPORTING TYPES =====

export interface PromptPerformanceReport {
  currentPerformance: PromptPerformanceAnalysis;
  trends: PerformanceTrends;
  benchmarks: BenchmarkComparisons;
  recommendations: ConsolidatedRecommendations;
  generatedAt: Date;
}

export interface PerformanceTrends {
  tokenEfficiency: TrendData;
  responseRelevance: TrendData;
  overallScore: TrendData;
}

export interface TrendData {
  trend: 'improving' | 'stable' | 'declining';
  change: number;
}

export interface BenchmarkComparisons {
  tokenEfficiency: BenchmarkComparison;
  responseRelevance: BenchmarkComparison;
  overallScore: BenchmarkComparison;
}

export interface BenchmarkComparison {
  current: number;
  benchmark: number;
  status: 'above' | 'below';
}

export interface ConsolidatedRecommendations {
  immediate: RecommendationSummary[];
  planned: RecommendationSummary[];
  future: RecommendationSummary[];
}

export interface RecommendationSummary {
  type: string;
  frequency: number;
  latestRecommendation: OptimizationRecommendation;
  consistentIssue: boolean;
}

// ===== DOMAIN CONSTANTS =====

export const OPTIMAL_TOKEN_RANGES = {
  total: { min: 1000, max: 2000, optimal: 1500 },
  core: { min: 600, max: 900, optimal: 750 },
  context: { min: 200, max: 500, optimal: 350 },
  realtime: { min: 100, max: 300, optimal: 200 }
} as const;

export const PERFORMANCE_THRESHOLDS = {
  tokenEfficiency: 0.8, // 80% efficient token usage
  responseRelevance: 0.85, // 85% response relevance
  conversionRate: 0.15, // 15% lead conversion
  engagementScore: 7.0 // Average engagement score
} as const;

export const MODULE_OPTIMAL_TOKENS = {
  'core': 750,
  'userProfile': 50,
  'companyContext': 70,
  'conversationPhase': 60,
  'knowledgeBase': 100,
  'industrySpecific': 45,
  'conversationHistory': 50,
  'businessHours': 25,
  'engagementOptimization': 35
} as const; 