import type { SearchFilters } from '../../../../application/dto/SearchCriteriaDTO';

type SupabaseQueryBuilder = ReturnType<ReturnType<import('@supabase/supabase-js').SupabaseClient['from']>['select']>;

/**
 * Asset Date Filter Service
 * Follows Single Responsibility Principle - only handles date filtering logic
 */
export class AssetDateFilter {
  /**
   * Apply date filters to query based on filter parameters
   */
  static applyDateFilters(query: SupabaseQueryBuilder, filters: SearchFilters): SupabaseQueryBuilder {
    if (!filters.creationDateOption) {
      return query;
    }

    const now = new Date();
    let dateFilterValue: string;
    let dateEndFilterValue: string | undefined;

    switch (filters.creationDateOption) {
      case 'today':
        dateFilterValue = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())).toISOString();
        return query.gte('created_at', dateFilterValue);

      case 'last7days':
        const last7DaysDate = new Date(now.valueOf());
        last7DaysDate.setUTCDate(now.getUTCDate() - 7);
        dateFilterValue = new Date(Date.UTC(last7DaysDate.getUTCFullYear(), last7DaysDate.getUTCMonth(), last7DaysDate.getUTCDate())).toISOString();
        return query.gte('created_at', dateFilterValue);

      case 'last30days':
        const last30DaysDate = new Date(now.valueOf());
        last30DaysDate.setUTCDate(now.getUTCDate() - 30);
        dateFilterValue = new Date(Date.UTC(last30DaysDate.getUTCFullYear(), last30DaysDate.getUTCMonth(), last30DaysDate.getUTCDate())).toISOString();
        return query.gte('created_at', dateFilterValue);

      case 'thisYear':
        dateFilterValue = new Date(Date.UTC(now.getUTCFullYear(), 0, 1)).toISOString();
        return query.gte('created_at', dateFilterValue);

      case 'lastYear':
        dateFilterValue = new Date(Date.UTC(now.getUTCFullYear() - 1, 0, 1)).toISOString();
        dateEndFilterValue = new Date(Date.UTC(now.getUTCFullYear(), 0, 1)).toISOString();
        return query.gte('created_at', dateFilterValue).lt('created_at', dateEndFilterValue);

      case 'custom':
        if (filters.dateStart) {
          const [year, month, day] = filters.dateStart.split('-').map(Number);
          dateFilterValue = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0)).toISOString();
          query = query.gte('created_at', dateFilterValue);
        }
        if (filters.dateEnd) {
          const [year, month, day] = filters.dateEnd.split('-').map(Number);
          dateEndFilterValue = new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999)).toISOString();
          query = query.lte('created_at', dateEndFilterValue);
        }
        return query;

      default:
        return query;
    }
  }

  /**
   * Validate date filter parameters
   */
  static validateDateFilters(filters: SearchFilters): { valid: boolean; error?: string } {
    if (!filters.creationDateOption) {
      return { valid: true };
    }

    if (filters.creationDateOption === 'custom') {
      if (filters.dateStart && filters.dateEnd) {
        const startDate = new Date(filters.dateStart);
        const endDate = new Date(filters.dateEnd);
        
        if (startDate > endDate) {
          return { 
            valid: false, 
            error: 'Start date cannot be after end date' 
          };
        }
      }
    }

    return { valid: true };
  }
} 
