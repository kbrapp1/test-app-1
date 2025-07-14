import type { DamFilterParameters } from '../../../../application/dto/SearchCriteriaDTO';

type SupabaseQueryBuilder = ReturnType<ReturnType<import('@supabase/supabase-js').SupabaseClient['from']>['select']>;

/**
 * Folder Date Filter Service
 * Follows Single Responsibility Principle - handles date filtering for folders
 */
export class FolderDateFilter {
  /**
   * Apply date filters to folder query
   */
  static applyDateFilters(query: SupabaseQueryBuilder, filters: DamFilterParameters): SupabaseQueryBuilder {
    if (!filters.creationDateOption) {
      return query;
    }

    const now = new Date();
    let dateFilterValue: string;
    let dateEndFilterValue: string | undefined;

    switch (filters.creationDateOption) {
      case 'today':
        dateFilterValue = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())).toISOString();
        query = query.gte('created_at', dateFilterValue);
        break;
        
      case 'last7days':
        const last7DaysDate = new Date(now.valueOf());
        last7DaysDate.setUTCDate(now.getUTCDate() - 7);
        dateFilterValue = new Date(Date.UTC(last7DaysDate.getUTCFullYear(), last7DaysDate.getUTCMonth(), last7DaysDate.getUTCDate())).toISOString();
        query = query.gte('created_at', dateFilterValue);
        break;
        
      case 'last30days':
        const last30DaysDate = new Date(now.valueOf());
        last30DaysDate.setUTCDate(now.getUTCDate() - 30);
        dateFilterValue = new Date(Date.UTC(last30DaysDate.getUTCFullYear(), last30DaysDate.getUTCMonth(), last30DaysDate.getUTCDate())).toISOString();
        query = query.gte('created_at', dateFilterValue);
        break;
        
      case 'thisYear':
        dateFilterValue = new Date(Date.UTC(now.getUTCFullYear(), 0, 1)).toISOString();
        query = query.gte('created_at', dateFilterValue);
        break;
        
      case 'lastYear':
        dateFilterValue = new Date(Date.UTC(now.getUTCFullYear() - 1, 0, 1)).toISOString();
        dateEndFilterValue = new Date(Date.UTC(now.getUTCFullYear(), 0, 1)).toISOString();
        query = query.gte('created_at', dateFilterValue).lt('created_at', dateEndFilterValue);
        break;
        
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
        break;
    }
    
    return query;
  }

  /**
   * Validate date filter parameters
   */
  static validateDateFilters(filters: DamFilterParameters): boolean {
    if (!filters.creationDateOption) {
      return true;
    }

    if (filters.creationDateOption === 'custom') {
      if (filters.dateStart && filters.dateEnd) {
        const startDate = new Date(filters.dateStart);
        const endDate = new Date(filters.dateEnd);
        return startDate <= endDate;
      }
    }

    return true;
  }
} 
