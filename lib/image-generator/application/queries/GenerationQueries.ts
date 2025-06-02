// Query Pattern for Read Operations
export interface Query {
  queryId: string;
  userId: string;
  organizationId: string;
  timestamp: Date;
}

export interface GetGenerationQuery extends Query {
  type: 'GetGeneration';
  generationId: string;
}

export interface GetGenerationsQuery extends Query {
  type: 'GetGenerations';
  filters?: {
    status?: string;
    limit?: number;
    offset?: number;
    startDate?: Date;
    endDate?: Date;
    savedToDAM?: boolean;
  };
}

export interface GetGenerationStatsQuery extends Query {
  type: 'GetGenerationStats';
  timeframe?: {
    startDate: Date;
    endDate: Date;
  };
}

export interface SearchGenerationsQuery extends Query {
  type: 'SearchGenerations';
  searchTerm: string;
  filters?: {
    status?: string;
    limit?: number;
    offset?: number;
  };
}

export interface GetActiveGenerationsQuery extends Query {
  type: 'GetActiveGenerations';
  limit?: number;
}

// Query Type Union
export type GenerationQuery = 
  | GetGenerationQuery
  | GetGenerationsQuery
  | GetGenerationStatsQuery
  | SearchGenerationsQuery
  | GetActiveGenerationsQuery;

// Query Result
export interface QueryResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  totalCount?: number;
  hasMore?: boolean;
} 