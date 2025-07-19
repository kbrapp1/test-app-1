/**
 * Lead Supabase Repository - Refactored
 * 
 * Single responsibility: Orchestrate lead persistence operations
 * Delegates to specialized services for different concerns
 * Implements domain repository interface exactly
 * Maintains clean boundaries between different operation types
 */

import { ILeadRepository, LeadAnalytics, LeadSearchFilters } from '../../../domain/repositories/ILeadRepository';
import { Lead } from '../../../domain/entities/Lead';
import { FollowUpStatus } from '../../../domain/entities/LeadLifecycleManager';
import { createClient } from '../../../../supabase/server';
import { SupabaseClient } from '@supabase/supabase-js';
import { DatabaseError } from '../../../domain/errors/ChatbotWidgetDomainErrors';

// Import specialized services
import { LeadCrudService } from './services/LeadCrudService';
import { LeadQueryService } from './services/LeadQueryService';
import { LeadAnalyticsService } from './services/LeadAnalyticsService';
import { LeadBulkOperationsService } from './services/LeadBulkOperationsService';
import { LeadExportService } from './services/LeadExportService';
import { LeadFilterConverter } from './services/LeadFilterConverter';

export class LeadSupabaseRepository implements ILeadRepository {
  private crudService: LeadCrudService;
  private queryService: LeadQueryService;
  private analyticsService: LeadAnalyticsService;
  private bulkService: LeadBulkOperationsService;
  private exportService: LeadExportService;

  constructor(client?: SupabaseClient) {
    const supabaseClient = client || createClient();
    
    // Initialize specialized services
    this.crudService = new LeadCrudService(supabaseClient);
    this.queryService = new LeadQueryService(supabaseClient);
    this.analyticsService = new LeadAnalyticsService(supabaseClient);
    this.bulkService = new LeadBulkOperationsService(supabaseClient);
    this.exportService = new LeadExportService(supabaseClient);
  }

  // ===== BASIC CRUD OPERATIONS =====
  async findById(id: string): Promise<Lead | null> {
    return this.crudService.findById(id);
  }

  async findBySessionId(sessionId: string): Promise<Lead | null> {
    return this.crudService.findBySessionId(sessionId);
  }

  async findByOrganizationId(organizationId: string): Promise<Lead[]> {
    return this.crudService.findByOrganizationId(organizationId);
  }

  async findByEmail(email: string, organizationId: string): Promise<Lead[]> {
    return this.crudService.findByEmail(email, organizationId);
  }

  async findByAssignedTo(userId: string, organizationId: string): Promise<Lead[]> {
    return this.crudService.findByAssignedTo(userId, organizationId);
  }

  async create(lead: Lead): Promise<Lead> {
    return this.crudService.create(lead);
  }

  async save(lead: Lead): Promise<Lead> {
    return this.create(lead);
  }

  async update(lead: Lead): Promise<Lead> {
    return this.crudService.update(lead);
  }

  async delete(id: string): Promise<void> {
    return this.crudService.delete(id);
  }

  // ===== QUERY OPERATIONS =====
  async findByOrganizationIdWithPagination(
    organizationId: string,
    page: number,
    limit: number,
    filters?: LeadSearchFilters
  ): Promise<{
    leads: Lead[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    try {
      // Convert domain filters to infrastructure filters
      const convertedFilters = filters 
        ? LeadFilterConverter.searchFiltersToQueryFilters(filters)
        : undefined;
      
      const result = await this.queryService.executePaginatedQuery(
        organizationId, 
        page, 
        limit, 
        convertedFilters
      );
      
      const leads = result.data.map(record => this.queryService.mapToDomain(record));
      
      return {
        leads,
        total: result.count,
        page,
        limit,
        totalPages: result.totalPages,
      };
    } catch (error) {
      throw new DatabaseError(`Failed to find leads with pagination: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async searchByQuery(organizationId: string, query: string, limit: number): Promise<Lead[]> {
    try {
      const data = await this.queryService.executeSearchQuery(organizationId, query, limit);
      return data.map(record => this.queryService.mapToDomain(record));
    } catch (error) {
      throw new DatabaseError(`Failed to search leads: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async findRequiringFollowUp(organizationId: string, daysSinceLastContact: number): Promise<Lead[]> {
    try {
      const data = await this.queryService.findRequiringFollowUp(organizationId, daysSinceLastContact);
      return data.map(record => this.queryService.mapToDomain(record));
    } catch (error) {
      throw new DatabaseError(`Failed to find leads requiring follow-up: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async findTopByScore(organizationId: string, limit: number): Promise<Lead[]> {
    try {
      const data = await this.queryService.findTopByScore(organizationId, limit);
      return data.map(record => this.queryService.mapToDomain(record));
    } catch (error) {
      throw new DatabaseError(`Failed to find top leads by score: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async findRecent(organizationId: string, limit: number): Promise<Lead[]> {
    try {
      const data = await this.queryService.findRecent(organizationId, limit);
      return data.map(record => this.queryService.mapToDomain(record));
    } catch (error) {
      throw new DatabaseError(`Failed to find recent leads: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // ===== ANALYTICS OPERATIONS =====
  async getAnalytics(organizationId: string, dateFrom: Date, dateTo: Date): Promise<LeadAnalytics> {
    try {
      return await this.analyticsService.calculateAnalytics(organizationId, dateFrom, dateTo);
    } catch (error) {
      throw new DatabaseError(`Failed to get analytics: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async countByStatus(organizationId: string): Promise<{
    total: number;
    qualified: number;
    converted: number;
    new: number;
  }> {
    return this.analyticsService.countByStatus(organizationId);
  }

  async getFunnelMetrics(
    organizationId: string,
    dateFrom: Date,
    dateTo: Date
  ): Promise<{
    sessions: number;
    leadsGenerated: number;
    qualified: number;
    contacted: number;
    converted: number;
    conversionRates: {
      sessionToLead: number;
      leadToQualified: number;
      qualifiedToContacted: number;
      contactedToConverted: number;
    };
  }> {
    return this.analyticsService.calculateFunnelMetrics(organizationId, dateFrom, dateTo);
  }

  // ===== EXPORT OPERATIONS =====
  async findForExport(organizationId: string, filters?: Record<string, unknown>): Promise<Lead[]> {
    return this.exportService.findForExport(organizationId, filters);
  }

  // ===== BULK OPERATIONS =====
  async findDuplicates(organizationId: string): Promise<Array<{
    criteria: 'email' | 'phone';
    value: string;
    leads: Lead[];
  }>> {
    try {
      const duplicateGroups = await this.bulkService.findDuplicates(organizationId);
      return duplicateGroups.map(group => ({
        criteria: group.criteria,
        value: group.value,
        leads: group.leads
      }));
    } catch (error) {
      throw new DatabaseError(`Failed to find duplicate leads: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async updateBulk(leadIds: string[], updates: {
    followUpStatus?: FollowUpStatus;
    assignedTo?: string;
    tags?: { add?: string[]; remove?: string[] };
  }): Promise<number> {
    try {
      return await this.bulkService.updateBulk(leadIds, updates);
    } catch (error) {
      throw new DatabaseError(`Failed to bulk update leads: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}