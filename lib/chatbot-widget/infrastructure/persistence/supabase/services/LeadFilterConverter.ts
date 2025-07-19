/**
 * Lead Filter Converter Service
 * 
 * Single responsibility: Convert between different filter formats
 * Handles mapping between domain and infrastructure filter types
 * Provides clean boundaries between different layers
 */

import { LeadSearchFilters } from '../../../../domain/repositories/ILeadRepository';
import { LeadFilters, QualificationStatus } from './LeadQueryService';
import { FollowUpStatus } from '../../../../domain/entities/LeadLifecycleManager';

export class LeadFilterConverter {
  /**
   * Convert domain LeadSearchFilters to infrastructure LeadFilters
   * Handles the mapping between different filter schemas
   */
  static searchFiltersToQueryFilters(filters: LeadSearchFilters): LeadFilters {
    return {
      assignedTo: Array.isArray(filters.assignedTo) ? filters.assignedTo[0] : undefined,
      dateFrom: filters.dateFrom || filters.dateRange?.start,
      dateTo: filters.dateTo || filters.dateRange?.end,
      minScore: filters.score?.min,
      maxScore: filters.score?.max,
      tags: filters.tags,
      searchTerm: undefined // Not included in search filters
    };
  }

  /**
   * Convert generic export filters to LeadFilters format
   * Provides type safety for dynamic filter conversions
   */
  static exportFiltersToQueryFilters(filters: Record<string, unknown>): Partial<LeadFilters> {
    return {
      qualificationStatus: this.safeStringCast(filters.qualificationStatus) as QualificationStatus,
      followUpStatus: this.safeStringCast(filters.followUpStatus) as FollowUpStatus,
      assignedTo: this.safeStringCast(filters.assignedTo),
      dateFrom: this.safeDateCast(filters.dateFrom),
      dateTo: this.safeDateCast(filters.dateTo),
      minScore: this.safeNumberCast(filters.minScore),
      maxScore: this.safeNumberCast(filters.maxScore),
      tags: this.safeStringArrayCast(filters.tags),
      searchTerm: this.safeStringCast(filters.searchTerm)
    };
  }

  /**
   * Validate filter values and provide defaults where needed
   * Ensures data integrity during filter conversions
   */
  static validateAndNormalizeFilters(filters: Partial<LeadFilters>): LeadFilters {
    return {
      qualificationStatus: filters.qualificationStatus,
      followUpStatus: filters.followUpStatus,
      assignedTo: filters.assignedTo,
      dateFrom: filters.dateFrom instanceof Date ? filters.dateFrom : undefined,
      dateTo: filters.dateTo instanceof Date ? filters.dateTo : undefined,
      minScore: typeof filters.minScore === 'number' && filters.minScore >= 0 ? filters.minScore : undefined,
      maxScore: typeof filters.maxScore === 'number' && filters.maxScore <= 100 ? filters.maxScore : undefined,
      tags: Array.isArray(filters.tags) ? filters.tags : undefined,
      searchTerm: typeof filters.searchTerm === 'string' && filters.searchTerm.trim() ? filters.searchTerm.trim() : undefined
    };
  }

  /**
   * Extract pagination parameters from request filters
   * Standardizes pagination handling across different endpoints
   */
  static extractPaginationParams(filters: Record<string, unknown>): {
    page: number;
    limit: number;
  } {
    const page = this.safeNumberCast(filters.page) || 1;
    const limit = this.safeNumberCast(filters.limit) || 20;
    
    return {
      page: Math.max(1, page),
      limit: Math.min(100, Math.max(1, limit)) // Limit between 1-100
    };
  }

  /**
   * Convert search query string to structured filters
   * Enables flexible search across multiple fields
   */
  static parseSearchQuery(query: string): Partial<LeadFilters> {
    if (!query || typeof query !== 'string') {
      return {};
    }

    const trimmedQuery = query.trim();
    if (!trimmedQuery) {
      return {};
    }

    // Check if query looks like an email
    if (trimmedQuery.includes('@')) {
      return { searchTerm: trimmedQuery };
    }

    // Check if query is numeric (could be phone or score)
    if (/^\d+$/.test(trimmedQuery)) {
      const numValue = parseInt(trimmedQuery, 10);
      if (numValue <= 100) {
        return { minScore: numValue };
      }
    }

    return { searchTerm: trimmedQuery };
  }

  // Private helper methods for safe type casting
  private static safeStringCast(value: unknown): string | undefined {
    return typeof value === 'string' ? value : undefined;
  }

  private static safeNumberCast(value: unknown): number | undefined {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
      const parsed = parseFloat(value);
      return isNaN(parsed) ? undefined : parsed;
    }
    return undefined;
  }

  private static safeDateCast(value: unknown): Date | undefined {
    if (value instanceof Date) return value;
    if (typeof value === 'string') {
      const parsed = new Date(value);
      return isNaN(parsed.getTime()) ? undefined : parsed;
    }
    return undefined;
  }

  private static safeStringArrayCast(value: unknown): string[] | undefined {
    if (Array.isArray(value) && value.every(item => typeof item === 'string')) {
      return value as string[];
    }
    return undefined;
  }
}