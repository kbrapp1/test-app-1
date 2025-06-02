import { GenerationFilters } from '../../../../domain/repositories/GenerationRepository';

export class GenerationQueryBuilder {
  static applyFilters(query: any, filters: GenerationFilters) {
    let filteredQuery = query;

    // Apply status filter
    if (filters.status) {
      filteredQuery = filteredQuery.eq('status', filters.status);
    }
    
    // Apply user filter
    if (filters.userId) {
      filteredQuery = filteredQuery.eq('user_id', filters.userId);
    }
    
    // Apply organization filter
    if (filters.organizationId) {
      filteredQuery = filteredQuery.eq('organization_id', filters.organizationId);
    }
    
    // Apply savedToDAM filter
    if (filters.savedToDAM !== undefined) {
      filteredQuery = filteredQuery.eq('saved_to_dam', filters.savedToDAM);
    }
    
    // Apply date range filters
    if (filters.startDate) {
      filteredQuery = filteredQuery.gte('created_at', filters.startDate.toISOString());
    }
    
    if (filters.endDate) {
      filteredQuery = filteredQuery.lte('created_at', filters.endDate.toISOString());
    }

    return filteredQuery;
  }

  static applyOrdering(query: any) {
    return query.order('created_at', { ascending: false });
  }

  static applyPagination(query: any, filters: GenerationFilters) {
    let paginatedQuery = query;

    // Apply limit
    if (filters.limit) {
      paginatedQuery = paginatedQuery.limit(filters.limit);
    }
    
    // Apply offset/range
    if (filters.offset) {
      const limit = filters.limit || 50;
      paginatedQuery = paginatedQuery.range(
        filters.offset, 
        filters.offset + limit - 1
      );
    }

    return paginatedQuery;
  }

  static buildFindManyQuery(baseQuery: any, filters: GenerationFilters) {
    let query = baseQuery.select('*');
    
    // Apply filters
    query = this.applyFilters(query, filters);
    
    // Apply ordering
    query = this.applyOrdering(query);
    
    // Apply pagination
    query = this.applyPagination(query, filters);

    return query;
  }

  static buildStatsQuery(baseQuery: any, userId: string, organizationId: string) {
    return baseQuery
      .select('status, cost_cents, generation_time_seconds, saved_to_dam')
      .eq('user_id', userId)
      .eq('organization_id', organizationId);
  }
} 