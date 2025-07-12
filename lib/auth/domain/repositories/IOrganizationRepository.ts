/**
 * Organization Repository Interface
 * 
 * AI INSTRUCTIONS:
 * - Define data access contracts only, no implementations
 * - Use domain value objects and aggregates
 * - Keep interface focused on domain needs
 * - Never include infrastructure concerns
 */

import { OrganizationAggregate } from '../aggregates/OrganizationAggregate';
import { OrganizationId } from '../value-objects/OrganizationId';
import { UserId } from '../value-objects/UserId';

export interface IOrganizationRepository {
  // Core CRUD operations
  save(organization: OrganizationAggregate): Promise<void>;
  findById(id: OrganizationId): Promise<OrganizationAggregate | null>;
  delete(id: OrganizationId): Promise<void>;
  
  // Domain-specific queries
  findByOwner(ownerId: UserId): Promise<OrganizationAggregate[]>;
  findByMember(userId: UserId): Promise<OrganizationAggregate[]>;
  findActiveOrganizations(): Promise<OrganizationAggregate[]>;
  
  // Existence checks
  exists(id: OrganizationId): Promise<boolean>;
  nameExists(name: string): Promise<boolean>;
  
  // Batch operations
  saveMany(organizations: OrganizationAggregate[]): Promise<void>;
  findManyById(ids: OrganizationId[]): Promise<OrganizationAggregate[]>;
  
  // Search and filtering
  findByName(name: string): Promise<OrganizationAggregate | null>;
  searchByName(namePattern: string): Promise<OrganizationAggregate[]>;
  
  // Statistics
  countMembers(organizationId: OrganizationId): Promise<number>;
  countActiveMembers(organizationId: OrganizationId): Promise<number>;
} 