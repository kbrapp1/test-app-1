/**
 * User Repository Interface
 * 
 * AI INSTRUCTIONS:
 * - Define data access contracts only, no implementations
 * - Use domain value objects and aggregates
 * - Keep interface focused on domain needs
 * - Never include infrastructure concerns
 */

import { UserAggregate } from '../aggregates/UserAggregate';
import { UserId } from '../value-objects/UserId';
import { OrganizationId } from '../value-objects/OrganizationId';
import { Email } from '../value-objects/Email';

export interface IUserRepository {
  // Core CRUD operations
  save(user: UserAggregate): Promise<void>;
  findById(id: UserId): Promise<UserAggregate | null>;
  findByEmail(email: Email): Promise<UserAggregate | null>;
  delete(id: UserId): Promise<void>;
  
  // Domain-specific queries
  findByOrganization(organizationId: OrganizationId): Promise<UserAggregate[]>;
  findActiveUsers(): Promise<UserAggregate[]>;
  findPendingVerification(): Promise<UserAggregate[]>;
  
  // Existence checks
  exists(id: UserId): Promise<boolean>;
  emailExists(email: Email): Promise<boolean>;
  
  // Batch operations
  saveMany(users: UserAggregate[]): Promise<void>;
  findManyById(ids: UserId[]): Promise<UserAggregate[]>;
  
  // Organization membership queries
  findByOrganizationMembership(organizationId: OrganizationId): Promise<UserAggregate[]>;
  countByOrganization(organizationId: OrganizationId): Promise<number>;
} 