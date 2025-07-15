/**
 * Get Leads Query Handler
 * 
 * CQRS Query Handler that processes leads retrieval requests.
 * Accesses repositories directly for optimized read operations.
 * 
 * Single Responsibility: Handle GetLeadsQuery processing
 */

import { GetLeadsQuery, GetLeadsResult } from './GetLeadsQuery';
import { ILeadRepository } from '../../domain/repositories/ILeadRepository';

export class GetLeadsQueryHandler {
  constructor(
    private readonly leadRepository: ILeadRepository
  ) {}

  /** Handle the get leads query */
  async handle(query: GetLeadsQuery): Promise<GetLeadsResult> {
    try {
      // 1. Build filters from query
      const filters: Record<string, unknown> = {};
      if (query.status) {
        filters.qualificationStatus = query.status.toLowerCase();
      }
      if (query.dateFrom) {
        filters.dateFrom = query.dateFrom;
      }
      if (query.dateTo) {
        filters.dateTo = query.dateTo;
      }

      // 2. Load leads with pagination
      const page = Math.floor((query.offset || 0) / (query.limit || 20)) + 1;
      const leadsResult = await this.leadRepository.findByOrganizationIdWithPagination(
        query.organizationId,
        page,
        query.limit || 20,
        filters
      );

      // 3. Check if there are more leads
      const hasMore = leadsResult.page < leadsResult.totalPages;

      // 4. Get analytics for the date range
      const dateFrom = query.dateFrom || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
      const dateTo = query.dateTo || new Date();
      
      const analytics = await this.leadRepository.getAnalytics(
        query.organizationId,
        dateFrom,
        dateTo
      );

      // 5. Get count by status for breakdown
      const _statusCounts = await this.leadRepository.countByStatus(query.organizationId);
      void _statusCounts;

      // 6. Calculate recent trends (this week vs last week)
      const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
      
      const thisWeekAnalytics = await this.leadRepository.getAnalytics(
        query.organizationId,
        oneWeekAgo,
        new Date()
      );
      
      const lastWeekAnalytics = await this.leadRepository.getAnalytics(
        query.organizationId,
        twoWeeksAgo,
        oneWeekAgo
      );

      // 7. Build analytics response
      const leadsAnalytics = {
        totalCount: analytics.totalLeads,
        qualifiedCount: analytics.qualifiedLeads,
        conversionRate: analytics.conversionRate,
        averageScore: analytics.avgLeadScore,
        recentTrends: {
          thisWeek: thisWeekAnalytics.totalLeads,
          lastWeek: lastWeekAnalytics.totalLeads,
          percentageChange: lastWeekAnalytics.totalLeads > 0 
            ? ((thisWeekAnalytics.totalLeads - lastWeekAnalytics.totalLeads) / lastWeekAnalytics.totalLeads) * 100
            : 0
        },
        qualificationBreakdown: {
          unqualified: analytics.qualificationDistribution.not_qualified + 
                      analytics.qualificationDistribution.disqualified,
          qualified: analytics.qualificationDistribution.qualified,
          converted: analytics.convertedLeads
        }
      };

      return {
        leads: leadsResult.leads,
        totalLeads: leadsResult.total,
        hasMore,
        leadsAnalytics
      };
    } catch (error) {
      // Re-throw with context for upper layers to handle
      throw new Error(`Failed to get leads: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
} 