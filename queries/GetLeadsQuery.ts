/**
 * Get Leads Query
 * 
 * CQRS Query for retrieving leads data.
 * Represents a read operation request for lead information.
 * 
 * Single Responsibility: Encapsulate leads query parameters
 */

import { Lead } from '../../domain/entities/Lead';

export interface GetLeadsQuery {
  organizationId: string;
  configId?: string;
  status?: 'UNQUALIFIED' | 'QUALIFIED' | 'CONVERTED';
  dateFrom?: Date;
  dateTo?: Date;
  limit?: number;
  offset?: number;
}

export interface GetLeadsResult {
  leads: Lead[];
  totalLeads: number;
  hasMore: boolean;
  leadsAnalytics: {
    totalCount: number;
    qualifiedCount: number;
    conversionRate: number;
    averageScore: number;
    recentTrends: {
      thisWeek: number;
      lastWeek: number;
      percentageChange: number;
    };
    qualificationBreakdown: {
      unqualified: number;
      qualified: number;
      converted: number;
    };
  };
} 