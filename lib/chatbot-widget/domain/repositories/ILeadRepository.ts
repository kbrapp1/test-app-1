import { Lead } from '../entities/Lead';
import { FollowUpStatus } from '../entities/LeadLifecycleManager';

export interface ILeadRepository {
  /**
   * Find lead by ID
   */
  findById(id: string): Promise<Lead | null>;

  /**
   * Find lead by session ID
   */
  findBySessionId(sessionId: string): Promise<Lead | null>;

  /**
   * Find leads by organization ID
   */
  findByOrganizationId(organizationId: string): Promise<Lead[]>;

  /**
   * Find leads by organization ID with pagination and filters
   */
  findByOrganizationIdWithPagination(
    organizationId: string,
    page: number,
    limit: number,
    filters?: any
  ): Promise<{
    leads: Lead[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }>;

  /**
   * Find leads by email (for duplicate detection)
   */
  findByEmail(email: string, organizationId: string): Promise<Lead[]>;

  /**
   * Find leads assigned to a user
   */
  findByAssignedTo(userId: string, organizationId: string): Promise<Lead[]>;

  /**
   * Save a new lead
   */
  save(lead: Lead): Promise<Lead>;

  /**
   * Update an existing lead
   */
  update(lead: Lead): Promise<Lead>;

  /**
   * Delete a lead
   */
  delete(id: string): Promise<void>;

  /**
   * Get lead analytics and metrics
   */
  getAnalytics(
    organizationId: string,
    dateFrom: Date,
    dateTo: Date
  ): Promise<any>;

  /**
   * Get leads for export (CSV/Excel)
   */
  findForExport(
    organizationId: string,
    filters?: any
  ): Promise<Lead[]>;

  /**
   * Find leads requiring follow-up
   */
  findRequiringFollowUp(
    organizationId: string,
    daysSinceLastContact: number
  ): Promise<Lead[]>;

  /**
   * Find top leads by score
   */
  findTopByScore(organizationId: string, limit: number): Promise<Lead[]>;

  /**
   * Count leads by status
   */
  countByStatus(organizationId: string): Promise<{
    total: number;
    qualified: number;
    converted: number;
    new: number;
  }>;

  /**
   * Find recent leads
   */
  findRecent(organizationId: string, limit: number): Promise<Lead[]>;

  /**
   * Search leads by text query
   */
  searchByQuery(
    organizationId: string,
    query: string,
    limit: number
  ): Promise<Lead[]>;

  /**
   * Get lead funnel metrics
   */
  getFunnelMetrics(
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
  }>;

  /**
   * Find duplicate leads (by email/phone)
   */
  findDuplicates(organizationId: string): Promise<Array<{
    criteria: 'email' | 'phone';
    value: string;
    leads: Lead[];
  }>>;

  /**
   * Update multiple leads (bulk operations)
   */
  updateBulk(leadIds: string[], updates: {
    followUpStatus?: FollowUpStatus;
    assignedTo?: string;
    tags?: { add?: string[]; remove?: string[] };
  }): Promise<number>;

  /**
   * Create a new lead
   */
  create(lead: Lead): Promise<Lead>;
} 