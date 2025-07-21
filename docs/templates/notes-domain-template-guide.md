# Notes Domain Template Guide

## Overview

The Notes domain serves as the **gold standard template** for implementing new feature domains. It successfully combines:

- **Gold Standard DDD**: Domain events, specifications, clean architecture (97/100 score)
- **Unified Context Pattern**: Single API call optimization (3+ calls → 1 call)
- **ESLint Security Guidelines**: Proper organization context handling
- **Performance Optimization**: Optimistic updates with cache invalidation

## 🏗️ Complete Architecture Template

### Domain Layer Structure

```
lib/{feature}/
├── domain/
│   ├── aggregates/
│   │   ├── {Feature}Aggregate.ts          # Core business logic with events
│   │   ├── __tests__/
│   │   │   └── {Feature}Aggregate.test.ts # Comprehensive tests
│   │   └── index.ts
│   ├── value-objects/
│   │   ├── {Feature}Id.ts                 # Strongly-typed identifiers
│   │   └── index.ts
│   ├── events/
│   │   ├── {Feature}Events.ts             # Domain events for state changes
│   │   └── index.ts
│   ├── specifications/
│   │   ├── {Feature}Specifications.ts     # Business rule encapsulation
│   │   └── index.ts
│   ├── services/
│   │   ├── {Feature}OrderingService.ts    # Domain services
│   │   ├── IAuthContext.ts                # Auth dependency abstraction
│   │   └── index.ts
│   ├── repositories/
│   │   ├── I{Feature}Repository.ts        # Repository interface
│   │   └── index.ts
│   ├── errors/
│   │   ├── {Feature}DomainError.ts        # Domain-specific errors
│   │   └── index.ts
│   └── index.ts                           # Barrel exports
├── application/
│   ├── use-cases/
│   │   ├── Create{Feature}UseCase.ts      # Application use cases
│   │   ├── Update{Feature}UseCase.ts
│   │   ├── Delete{Feature}UseCase.ts
│   │   └── Get{Feature}UseCase.ts
│   ├── services/
│   │   ├── {Feature}ApplicationService.ts  # Application orchestration
│   │   └── {Feature}UnifiedContextService.ts # CRITICAL: Unified context
│   ├── dto/
│   │   ├── {Feature}DTO.ts                # Data transfer objects
│   │   └── index.ts
│   └── actions/
│       ├── {feature}Actions.ts            # Server actions
│       └── {feature}UnifiedActions.ts     # CRITICAL: Unified actions
├── infrastructure/
│   ├── persistence/
│   │   ├── Supabase{Feature}Repository.ts # Database implementation
│   │   └── index.ts
│   └── composition/
│       ├── {Feature}CompositionRoot.ts    # Dependency injection
│       └── index.ts
└── presentation/
    ├── components/
    │   ├── {Feature}PageClient.tsx        # Main page component
    │   ├── {Feature}Interface.tsx         # Feature interface
    │   └── index.ts
    ├── hooks/
    │   ├── use{Feature}UnifiedContext.ts  # CRITICAL: Unified context hook
    │   └── index.ts
    └── actions/
        └── {feature}UnifiedActions.ts     # Server actions
```

## 🎯 Implementation Checklist

### Phase 1: Domain Layer (Gold Standard DDD)
- [ ] **Aggregate Root** with domain events
- [ ] **Value Objects** for strong typing
- [ ] **Domain Events** for state changes
- [ ] **Specifications** for business rules
- [ ] **Domain Services** for complex logic
- [ ] **Repository Interfaces** for data access
- [ ] **Domain Errors** with severity levels

### Phase 2: Application Layer
- [ ] **Use Cases** for application logic
- [ ] **Application Service** for orchestration
- [ ] **DTOs** for data transfer
- [ ] **Unified Context Service** for performance
- [ ] **Cache invalidation** after mutations

### Phase 3: Infrastructure Layer
- [ ] **Repository Implementation** (Supabase)
- [ ] **Composition Root** for DI
- [ ] **Database migrations** if needed

### Phase 4: Presentation Layer (Unified Context)
- [ ] **Unified Context Hook** with optimistic updates
- [ ] **Server Actions** with deduplication
- [ ] **Page Components** (no server-side fetching)
- [ ] **Interface Components** with prop drilling

### Phase 5: Security & Performance
- [ ] **Organization context** validation
- [ ] **ESLint compliance** (no variable removal)
- [ ] **API deduplication** service integration
- [ ] **Cache invalidation** strategy

## 📋 Template Files

### 1. Domain Aggregate Template

```typescript
/**
 * {Feature} Aggregate Root - Domain Layer
 * 
 * AI INSTRUCTIONS:
 * - Aggregate root for {Feature} entity with business invariants
 * - Enforce business rules and validation
 * - Publish domain events for significant state changes
 * - Keep business logic pure, no external dependencies
 * - Follow @golden-rule aggregate patterns exactly
 */

import { {Feature}Id } from '../value-objects/{Feature}Id';
import { BusinessRuleViolationError, Invalid{Feature}DataError } from '../errors/{Feature}DomainError';
import { DomainEvent, {Feature}CreatedEvent, {Feature}UpdatedEvent } from '../events/{Feature}Events';
import { Complete{Feature}ValidSpec, {Feature}PositionValidSpec } from '../specifications/{Feature}Specifications';

export interface {Feature}Data {
  // Define your domain properties
  name: string;
  description: string | null;
  status: string;
  userId: string;
  organizationId: string;
  createdAt: Date;
  updatedAt: Date | null;
}

export class {Feature}Aggregate {
  private _domainEvents: DomainEvent[] = [];
  private static readonly contentValidator = new Complete{Feature}ValidSpec();
  private static readonly positionValidator = new {Feature}PositionValidSpec();

  private constructor(
    private readonly _id: {Feature}Id,
    private _name: string,
    private _description: string | null,
    private _status: string,
    private readonly _userId: string,
    private readonly _organizationId: string,
    private readonly _createdAt: Date,
    private _updatedAt: Date | null
  ) {
    this.validateInvariants();
  }

  // Factory methods
  public static create(
    name: string,
    description: string | null,
    userId: string,
    organizationId: string,
    status: string = 'active'
  ): {Feature}Aggregate {
    const id = {Feature}Id.generate();
    const now = new Date();
    
    const item = new {Feature}Aggregate(
      id,
      name,
      description,
      status,
      userId,
      organizationId,
      now,
      null
    );
    
    // Publish domain event for creation
    item.addDomainEvent(new {Feature}CreatedEvent(
      id.value,
      name,
      description,
      userId,
      organizationId
    ));
    
    return item;
  }

  public static fromExisting(
    id: string,
    name: string,
    description: string | null,
    status: string,
    userId: string,
    organizationId: string,
    createdAt: Date,
    updatedAt: Date | null
  ): {Feature}Aggregate {
    return new {Feature}Aggregate(
      {Feature}Id.create(id),
      name,
      description,
      status,
      userId,
      organizationId,
      createdAt,
      updatedAt
    );
  }

  // Getters
  public get id(): {Feature}Id { return this._id; }
  public get name(): string { return this._name; }
  public get description(): string | null { return this._description; }
  public get status(): string { return this._status; }
  public get userId(): string { return this._userId; }
  public get organizationId(): string { return this._organizationId; }
  public get createdAt(): Date { return this._createdAt; }
  public get updatedAt(): Date | null { return this._updatedAt; }

  // Domain Events
  public getDomainEvents(): DomainEvent[] {
    return [...this._domainEvents];
  }

  public clearDomainEvents(): void {
    this._domainEvents = [];
  }

  private addDomainEvent(event: DomainEvent): void {
    this._domainEvents.push(event);
  }

  // Business methods
  public updateContent(name: string, description: string | null): void {
    this.validateContentUpdate(name, description);
    
    const oldName = this._name;
    const oldDescription = this._description;
    
    this._name = name.trim();
    this._description = description?.trim() || null;
    this._updatedAt = new Date();
    
    this.validateInvariants();
    
    // Publish domain event for content changes
    const changes: Record<string, { from: string | null; to: string | null }> = {};
    if (oldName !== this._name) changes.name = { from: oldName, to: this._name };
    if (oldDescription !== this._description) changes.description = { from: oldDescription, to: this._description };
    
    if (Object.keys(changes).length > 0) {
      this.addDomainEvent(new {Feature}UpdatedEvent(this._id.value, changes));
    }
  }

  // Convert to plain object for persistence
  public toData(): {Feature}Data {
    return {
      name: this._name,
      description: this._description,
      status: this._status,
      userId: this._userId,
      organizationId: this._organizationId,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt
    };
  }

  // Convert to database format
  public toDatabaseFormat(): {
    id: string;
    name: string;
    description: string | null;
    status: string;
    user_id: string;
    organization_id: string;
    created_at: string;
    updated_at: string | null;
  } {
    return {
      id: this._id.value,
      name: this._name,
      description: this._description,
      status: this._status,
      user_id: this._userId,
      organization_id: this._organizationId,
      created_at: this._createdAt.toISOString(),
      updated_at: this._updatedAt?.toISOString() || null
    };
  }

  // Validation methods
  private validateInvariants(): void {
    this.validateName(this._name);
    this.validateStatus(this._status);
    this.validateUserAndOrganization();
  }

  private validateContentUpdate(name: string, description: string | null): void {
    const candidate = { name, description };
    
    if (!{Feature}Aggregate.contentValidator.isSatisfiedBy(candidate)) {
      const reason = {Feature}Aggregate.contentValidator.getFailureReason!(candidate);
      
      // Throw appropriate error type based on validation failure
      if (reason.includes('Name cannot exceed') && name) {
        throw new Invalid{Feature}DataError('name', name, { reason });
      } else if (reason.includes('Description cannot exceed') && description) {
        throw new Invalid{Feature}DataError('description', description, { reason });
      } else {
        throw new BusinessRuleViolationError(reason, { name, description });
      }
    }
  }

  private validateName(name: string): void {
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      throw new Invalid{Feature}DataError(
        'name',
        name,
        { reason: 'Name must be a non-empty string' }
      );
    }
  }

  private validateStatus(status: string): void {
    const validStatuses = ['active', 'inactive', 'archived'];
    if (!validStatuses.includes(status)) {
      throw new Invalid{Feature}DataError(
        'status',
        status,
        { reason: `Status must be one of: ${validStatuses.join(', ')}` }
      );
    }
  }

  private validateUserAndOrganization(): void {
    if (!this._userId || typeof this._userId !== 'string') {
      throw new Invalid{Feature}DataError(
        'userId',
        this._userId,
        { reason: 'User ID must be a non-empty string' }
      );
    }

    if (!this._organizationId || typeof this._organizationId !== 'string') {
      throw new Invalid{Feature}DataError(
        'organizationId',
        this._organizationId,
        { reason: 'Organization ID must be a non-empty string' }
      );
    }
  }
}
```

### 2. Unified Context Service Template

```typescript
/**
 * {Feature} Unified Context Service - Application Layer
 * 
 * AI INSTRUCTIONS:
 * - OPTIMIZATION: Consolidates existing services in single call
 * - Eliminates 3x API calls on {Feature} page load to 1x API call
 * - REUSES existing services instead of duplicating database queries
 * - Follows DRY principle and DDD composition patterns
 * - Compatible with existing {Feature}ContextService interface
 * - INCLUDES {feature} data in unified context for true single-call optimization
 * - Follow @golden-rule patterns exactly
 */

import { User } from '@supabase/supabase-js';
import { createClient as createSupabaseServerClient } from '@/lib/supabase/server';
import { OrganizationContextFactory } from '@/lib/organization/infrastructure/composition/OrganizationContextFactory';
import { PermissionValidationService } from '@/lib/organization/domain/services/PermissionValidationService';

// {Feature} interface matching database structure
export interface {Feature}Item {
  id: string;
  user_id: string;
  organization_id: string;
  name: string;
  description: string | null;
  status: string;
  created_at: string;
  updated_at: string | null;
}

// Internal interface for unified context result
export interface {Feature}UnifiedContextResult {
  user: User | null;
  organizationId: string | null;
  organizations: Array<{
    organization_id: string;
    organization_name: string;
    role_name: string;
    granted_at: string;
    role_id: string;
  }>;
  has{Feature}Access: boolean;
  featureFlags: Record<string, boolean>;
  items: {Feature}Item[]; // ✅ CRITICAL: Include domain data
  error?: string;
}

// Discriminated union for type safety
export type {Feature}ValidationResult = 
  | {
      isValid: true;
      user: User;
      organizationId: string;
      unifiedContext: {Feature}UnifiedContext;
      securityContext: {
        fromCache: boolean;
        timestamp: Date;
        validationMethod: string;
        tokenHash?: string;
        securityVersion?: number;
      };
    }
  | {
      isValid: false;
      error: string;
      user: User | null;
      organizationId: string;
      unifiedContext?: {Feature}UnifiedContext;
      securityContext: {
        fromCache: boolean;
        timestamp: Date;
        validationMethod: string;
        tokenHash?: string;
        securityVersion?: number;
      };
    };

// Interface for unified context data expected by presentation layer
export interface {Feature}UnifiedContext {
  user: User | null;
  organizationId: string | null;
  organizations: Array<{
    organization_id: string;
    organization_name: string;
    role: string;
  }>;
  featureFlags: Record<string, boolean>;
  is{Feature}Enabled: boolean;
  items: {Feature}Item[]; // ✅ CRITICAL: Include domain data
  fromCache: boolean;
}

export class {Feature}UnifiedContextService {
  private static instance: {Feature}UnifiedContextService;
  private cache = new Map<string, { data: {Feature}UnifiedContextResult; timestamp: number }>();
  private readonly CACHE_TTL = 5000; // 5 seconds for security

  private constructor() {
    // Private constructor for singleton pattern
    
    // ✅ SECURITY: Listen for organization switch events to clear cache
    if (typeof window !== 'undefined') {
      window.addEventListener('organizationSwitched', this.handleOrganizationSwitch.bind(this) as EventListener);
      
      // Expose service instance for direct cache invalidation
      (window as typeof window & { {feature}UnifiedContextService?: {Feature}UnifiedContextService }).{feature}UnifiedContextService = this;
    }
  }

  static getInstance(): {Feature}UnifiedContextService {
    if (!this.instance) {
      this.instance = new {Feature}UnifiedContextService();
    }
    return this.instance;
  }

  /**
   * ✅ SECURITY: Handle organization switch events
   */
  private handleOrganizationSwitch(event: Event): void {
    const customEvent = event as CustomEvent;
    const { userId, newOrganizationId, previousOrganizationId } = customEvent.detail;
    
    if (userId && newOrganizationId) {
      this.clearCacheOnOrganizationSwitch(userId, newOrganizationId);
      console.log(`[{FEATURE}_SECURITY] Cache cleared due to org switch event: ${previousOrganizationId} → ${newOrganizationId}`);
    }
  }

  /**
   * Get unified {Feature} context - combines user, organization, and {Feature} validation + data
   * Single API call replacing 3+ separate calls
   */
  async getUnified{Feature}Context(): Promise<{Feature}ValidationResult> {
    try {
      // Create server-side Supabase client for server actions
      const supabaseServer = createSupabaseServerClient();
      
      // Initialize services with server-side client
      const organizationService = OrganizationContextFactory.createWithClient(supabaseServer);
      const permissionService = new PermissionValidationService(supabaseServer);

      // Execute all services in parallel (was 3+ separate API calls)
      const [
        currentUser,
        organizationContext,
        userOrganizations
      ] = await Promise.all([
        permissionService.getCurrentUser(),
        organizationService.getCurrentContext(),
        permissionService.getUserAccessibleOrganizations()
      ]);

      // Validate organization context
      if (!organizationContext || !organizationContext.active_organization_id) {
        throw new Error('Organization context not available');
      }

      // Extract organization data
      const organizationId = organizationContext.active_organization_id;
      
      // ✅ OPTIMIZATION: Check cache before expensive operations
      const cachedResult = this.getCachedContext(currentUser?.id || 'anonymous', organizationId);
      if (cachedResult) {
        // Transform cached result to presentation format
        const transformedOrganizations = cachedResult.organizations.map(org => ({
          organization_id: org.organization_id,
          organization_name: org.organization_name,
          role: org.role_name
        }));

        const unifiedContext: {Feature}UnifiedContext = {
          user: cachedResult.user,
          organizationId: cachedResult.organizationId,
          organizations: transformedOrganizations,
          featureFlags: cachedResult.featureFlags,
          is{Feature}Enabled: cachedResult.has{Feature}Access,
          items: cachedResult.items, // ✅ CRITICAL: Include cached data
          fromCache: true
        };

        return {
          isValid: true,
          user: cachedResult.user as User,
          organizationId: cachedResult.organizationId as string,
          unifiedContext,
          securityContext: {
            fromCache: true,
            timestamp: new Date(),
            validationMethod: 'UNIFIED_CACHED'
          }
        };
      }

      const featureFlags = organizationContext.feature_flags || {};

      // Check {Feature} access via feature flags
      const featureEnabled = featureFlags.{FEATURE_FLAG_NAME} !== false; // Default enabled
      
      if (!featureEnabled) {
        // Create unified context when feature is disabled
        const transformedOrganizations = userOrganizations.map(org => ({
          organization_id: org.organization_id,
          organization_name: org.organization_name,
          role: org.role_name
        }));

        const unifiedContext: {Feature}UnifiedContext = {
          user: currentUser,
          organizationId,
          organizations: transformedOrganizations,
          featureFlags,
          is{Feature}Enabled: false,
          items: [], // Empty when disabled
          fromCache: false
        };

        return {
          isValid: false,
          error: '{Feature} feature is not enabled for this organization',
          user: currentUser,
          organizationId,
          unifiedContext,
          securityContext: {
            fromCache: false,
            timestamp: new Date(),
            validationMethod: 'UNIFIED_FEATURE_DISABLED'
          }
        };
      }
      
      // Feature is enabled, check user permissions and fetch data
      let has{Feature}Access = false;
      let items: {Feature}Item[] = [];
      let permissionError = '';
      
      if (currentUser && organizationId) {
        try {
          // Use application service to check permissions and fetch data
          const { {Feature}CompositionRoot } = await import('../../infrastructure/composition/{Feature}CompositionRoot');
          const compositionRoot = {Feature}CompositionRoot.getInstance();
          const applicationService = compositionRoot.get{Feature}ApplicationService();
          
          // Try to get items - this validates permissions and fetches data
          items = await applicationService.get{Feature}Items(currentUser.id, organizationId);
          has{Feature}Access = true;
        } catch (error) {
          has{Feature}Access = false;
          permissionError = error instanceof Error ? error.message : 'Permission denied';
          console.log('[{FEATURE}_UNIFIED_CONTEXT] {Feature} permission denied:', permissionError);
        }
      }
      
      if (!has{Feature}Access) {
        const transformedOrganizations = userOrganizations.map(org => ({
          organization_id: org.organization_id,
          organization_name: org.organization_name,
          role: org.role_name
        }));

        const unifiedContext: {Feature}UnifiedContext = {
          user: currentUser,
          organizationId,
          organizations: transformedOrganizations,
          featureFlags,
          is{Feature}Enabled: false,
          items: [], // Empty when no access
          fromCache: false
        };

        return {
          isValid: false,
          error: permissionError.includes('permission') || permissionError.includes('access denied') 
            ? permissionError 
            : 'You do not have permission to access {feature}',
          user: currentUser,
          organizationId,
          unifiedContext,
          securityContext: {
            fromCache: false,
            timestamp: new Date(),
            validationMethod: 'UNIFIED_PERMISSION_DENIED'
          }
        };
      }

      // ✅ SECURITY FIX: Cache the internal result with organization ID
      const cacheKey = `{feature}-context-${currentUser?.id || 'anonymous'}-${organizationId}`;
      const internalResult: {Feature}UnifiedContextResult = {
        user: currentUser,
        organizationId,
        organizations: userOrganizations,
        has{Feature}Access,
        featureFlags,
        items // ✅ CRITICAL: Cache domain data
      };

      this.cache.set(cacheKey, {
        data: internalResult,
        timestamp: Date.now()
      });

      // Transform organizations to match expected interface
      const transformedOrganizations = userOrganizations.map(org => ({
        organization_id: org.organization_id,
        organization_name: org.organization_name,
        role: org.role_name
      }));

      // Create unified context for presentation layer
      const unifiedContext: {Feature}UnifiedContext = {
        user: currentUser,
        organizationId,
        organizations: transformedOrganizations,
        featureFlags,
        is{Feature}Enabled: has{Feature}Access,
        items, // ✅ CRITICAL: Include domain data
        fromCache: false
      };

      return {
        isValid: true,
        user: currentUser,
        organizationId,
        unifiedContext,
        securityContext: {
          fromCache: false,
          timestamp: new Date(),
          validationMethod: 'UNIFIED_COMPOSED'
        }
      };

    } catch (error) {
      console.error('[{FEATURE}_UNIFIED_CONTEXT] UNIFIED_VALIDATION_ERROR:', {
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });

      return {
        isValid: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        user: null,
        organizationId: '',
        securityContext: {
          fromCache: false,
          timestamp: new Date(),
          validationMethod: 'UNIFIED_ERROR'
        }
      };
    }
  }

  /**
   * Get cached context for user and organization
   * ✅ SECURITY: Cache keys MUST include organization ID to prevent data leakage
   */
  getCachedContext(userId: string, organizationId: string): {Feature}UnifiedContextResult | null {
    const cacheKey = `{feature}-context-${userId}-${organizationId}`;
    const cached = this.cache.get(cacheKey);
    
    if (!cached) {
      return null;
    }
    
    const isExpired = Date.now() - cached.timestamp > this.CACHE_TTL;
    if (isExpired) {
      this.cache.delete(cacheKey);
      return null;
    }
    
    return cached.data;
  }

  /**
   * ✅ CRITICAL: Invalidate cache after mutations
   * Call this after successful create/update/delete operations
   */
  invalidateCacheAfterMutation(userId: string, organizationId: string): void {
    const cacheKey = `{feature}-context-${userId}-${organizationId}`;
    this.cache.delete(cacheKey);
    console.log(`[{FEATURE}_CACHE] Invalidated cache after mutation: ${cacheKey}`);
  }

  /**
   * Clear cache for specific user and organization
   */
  clearCache(userId: string, organizationId: string): void {
    const cacheKey = `{feature}-context-${userId}-${organizationId}`;
    this.cache.delete(cacheKey);
  }

  /**
   * ✅ SECURITY: Clear cache on organization switch (super admin)
   */
  clearCacheOnOrganizationSwitch(userId: string, newOrganizationId: string): void {
    const keysToDelete = Array.from(this.cache.keys())
      .filter(key => key.startsWith(`{feature}-context-${userId}-`));
    
    keysToDelete.forEach(key => this.cache.delete(key));
    
    console.log(`[{FEATURE}_SECURITY] Cache cleared for user ${userId} org switch to ${newOrganizationId}`);
    console.log(`[{FEATURE}_SECURITY] Cleared ${keysToDelete.length} cache entries for all organizations`);
  }

  /**
   * Clear all cached contexts (admin function)
   */
  clearAllCache(): void {
    this.cache.clear();
  }
}
```

### 3. Unified Context Hook Template

```typescript
/**
 * {Feature} Unified Context Hook - Presentation Layer
 * 
 * AI INSTRUCTIONS:
 * - OPTIMIZATION: Replaces useOrganizationContext() for {Feature} pages
 * - Reduces 3 API calls to 1 API call on page load
 * - Maintains compatibility with existing {Feature} components
 * - Provides all context needed: user, organization, feature flags, data
 * - CRITICAL: Uses stable dependencies to prevent infinite re-render loops
 * - INCLUDES optimistic update functions for instant UI feedback
 * - Follow @golden-rule patterns exactly
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { User } from '@supabase/supabase-js';
import { get{Feature}UnifiedContext } from '../actions/{feature}UnifiedActions';

// Import your domain types
export interface {Feature}Item {
  id: string;
  user_id: string;
  organization_id: string;
  name: string;
  description: string | null;
  status: string;
  created_at: string;
  updated_at: string | null;
}

export interface {Feature}UnifiedContextData {
  user: User | null;
  organizationId: string | null;
  organizations: Array<{
    organization_id: string;
    organization_name: string;
    role: string;
  }>;
  featureFlags: Record<string, boolean>;
  is{Feature}Enabled: boolean;
  isLoading: boolean;
  error: string | null;
  fromCache: boolean;
  refreshContext: () => Promise<void>;
  // ✅ OPTIMISTIC UPDATES: Domain-specific data and update functions
  items: {Feature}Item[];
  addItemOptimistic: (tempItem: {Feature}Item) => void;
  updateItemOptimistic: (itemId: string, updates: Partial<{Feature}Item>) => void;
  deleteItemOptimistic: (itemId: string) => void;
  reorderItemsOptimistic?: (orderedItemIds: string[]) => void; // Optional for reorderable items
}

/**
 * OPTIMIZATION: Unified context hook for {Feature} pages
 * Replaces multiple hooks with single optimized call
 */
export function use{Feature}UnifiedContext(): {Feature}UnifiedContextData {
  const [state, setState] = useState<{
    user: User | null;
    organizationId: string | null;
    organizations: Array<{ organization_id: string; organization_name: string; role: string }>;
    featureFlags: Record<string, boolean>;
    is{Feature}Enabled: boolean;
    isLoading: boolean;
    error: string | null;
    fromCache: boolean;
    items: {Feature}Item[];
  }>({
    user: null,
    organizationId: null,
    organizations: [],
    featureFlags: {},
    is{Feature}Enabled: true,
    isLoading: true,
    error: null,
    fromCache: false,
    items: []
  });

  // CRITICAL: Use refs to break dependency chains and prevent infinite loops
  const isLoadingRef = useRef(false);
  const hasLoadedRef = useRef(false);
  const loadContextFunctionRef = useRef<(() => Promise<void>) | null>(null);

  // Create the load function and store it in ref to break dependency chains
  loadContextFunctionRef.current = async () => {
    // Prevent multiple simultaneous calls
    if (isLoadingRef.current) {
      return;
    }

    try {
      isLoadingRef.current = true;
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      // OPTIMIZATION: Single server action call gets everything
      const result = await get{Feature}UnifiedContext();
      
      if (result.success && result.data) {
        setState(prev => ({
          ...prev,
          user: result.data!.user,
          organizationId: result.data!.organizationId,
          organizations: result.data!.organizations,
          featureFlags: result.data!.featureFlags,
          is{Feature}Enabled: result.data!.is{Feature}Enabled,
          items: result.data!.items || [],
          isLoading: false,
          error: null,
          fromCache: result.data!.fromCache
        }));
        hasLoadedRef.current = true;
      } else {
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: result.error || 'Failed to load {feature} context',
          fromCache: false
        }));
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to load {feature} context',
        fromCache: false
      }));
    } finally {
      isLoadingRef.current = false;
    }
  };

  // CRITICAL: Create stable refresh function with NO dependencies to break infinite loop
  const refreshContext = useCallback(async () => {
    hasLoadedRef.current = false; // Allow refresh to reload
    if (loadContextFunctionRef.current) {
      await loadContextFunctionRef.current();
    }
  }, []); // ✅ NO DEPENDENCIES - breaks the infinite loop

  // ✅ OPTIMISTIC UPDATE FUNCTIONS - Instant UI feedback
  const addItemOptimistic = useCallback((tempItem: {Feature}Item) => {
    setState(prev => ({
      ...prev,
      items: [...prev.items, tempItem]
    }));
  }, []);

  const updateItemOptimistic = useCallback((itemId: string, updates: Partial<{Feature}Item>) => {
    setState(prev => ({
      ...prev,
      items: prev.items.map(item => 
        item.id === itemId ? { ...item, ...updates } : item
      )
    }));
  }, []);

  const deleteItemOptimistic = useCallback((itemId: string) => {
    setState(prev => ({
      ...prev,
      items: prev.items.filter(item => item.id !== itemId)
    }));
  }, []);

  const reorderItemsOptimistic = useCallback((orderedItemIds: string[]) => {
    setState(prev => {
      const itemMap = new Map(prev.items.map(item => [item.id, item]));
      const reorderedItems = orderedItemIds
        .map(id => itemMap.get(id))
        .filter(Boolean) as {Feature}Item[];
      
      return {
        ...prev,
        items: reorderedItems
      };
    });
  }, []);

  // Load context immediately - server action handles auth validation
  useEffect(() => {
    // Only load if we haven't loaded yet (prevents React Strict Mode double-invocation)
    if (!hasLoadedRef.current && !isLoadingRef.current && loadContextFunctionRef.current) {
      loadContextFunctionRef.current();
    }
  }, []); // ✅ NO DEPENDENCIES - only run once on mount

  return {
    user: state.user,
    organizationId: state.organizationId,
    organizations: state.organizations,
    featureFlags: state.featureFlags,
    is{Feature}Enabled: state.is{Feature}Enabled,
    items: state.items,
    isLoading: state.isLoading,
    error: state.error,
    fromCache: state.fromCache,
    refreshContext,
    addItemOptimistic,
    updateItemOptimistic,
    deleteItemOptimistic,
    reorderItemsOptimistic
  };
}
```

### 4. Server Action Template

```typescript
/**
 * {Feature} Unified Actions - Presentation Layer
 * 
 * AI INSTRUCTIONS:
 * - OPTIMIZATION: Single server action to replace multiple context calls
 * - Uses {Feature}UnifiedContextService for consolidated validation
 * - Maintains all security guarantees while reducing API calls
 * - CRITICAL: Uses apiDeduplicationService to prevent multiple simultaneous calls
 * - INCLUDES cache invalidation for mutations
 * - Follow @golden-rule patterns exactly
 */

'use server';

import { {Feature}UnifiedContextService, {Feature}UnifiedContext } from '../../application/services/{Feature}UnifiedContextService';
import { apiDeduplicationService } from '@/lib/shared/infrastructure/ApiDeduplicationService';

export interface {Feature}UnifiedContextResult {
  success: boolean;
  data?: {Feature}UnifiedContext;
  error?: string;
}

/**
 * OPTIMIZATION: Get all {Feature} context in single server action
 * Replaces separate calls to useOrganizationContext + validation + feature flags + data
 * CRITICAL: Uses deduplication to prevent multiple simultaneous calls
 */
export async function get{Feature}UnifiedContext(): Promise<{Feature}UnifiedContextResult> {
  return await apiDeduplicationService.deduplicateServerAction(
    'get{Feature}UnifiedContext',
    [], // No parameters needed
    async () => {
      try {
        // Log for debugging rapid refresh issues
        if (process.env.NODE_ENV === 'development') {
          console.log('[{FEATURE}_UNIFIED_ACTION] Processing request at', new Date().toISOString());
        }
        
        const unifiedService = {Feature}UnifiedContextService.getInstance();
        const result = await unifiedService.getUnified{Feature}Context();
        
        if (!result.isValid) {
          return {
            success: false,
            error: result.error || '{Feature} context validation failed'
          };
        }

        if (!result.unifiedContext) {
          return {
            success: false,
            error: 'Unified context data not available'
          };
        }

        return {
          success: true,
          data: result.unifiedContext
        };

      } catch (error) {
        console.error('[{FEATURE}_UNIFIED_ACTION] Error:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to load {feature} context'
        };
      }
    },
    '{feature}-operations' // Domain for timeout configuration
  );
}

// Template for mutation actions with cache invalidation
export interface Create{Feature}ItemInput {
  name: string;
  description?: string;
  status?: string;
}

export interface Create{Feature}ItemResult {
  success: boolean;
  data?: {Feature}Item;
  error?: string;
}

/**
 * ✅ CRITICAL: Server action template for mutations with cache invalidation
 * Use this pattern for create/update/delete operations
 */
export async function create{Feature}Item(itemData: Create{Feature}ItemInput): Promise<Create{Feature}ItemResult> {
  return await apiDeduplicationService.deduplicateServerAction(
    `create{Feature}Item`,
    [JSON.stringify(itemData)], // Include input in deduplication key
    async () => {
      try {
        // Validate access using discriminated union pattern
        const unifiedService = {Feature}UnifiedContextService.getInstance();
        const validation = await unifiedService.getUnified{Feature}Context();
        
        if (!validation.isValid) {
          return { success: false, error: validation.error };
        }
        
        const { user, organizationId } = validation;
        
        // Create item logic here...
        const { {Feature}CompositionRoot } = await import('../../infrastructure/composition/{Feature}CompositionRoot');
        const compositionRoot = {Feature}CompositionRoot.getInstance();
        const applicationService = compositionRoot.get{Feature}ApplicationService();
        
        const result = await applicationService.create{Feature}Item({
          ...itemData,
          userId: user.id,
          organizationId
        });
        
        // ✅ CRITICAL: Invalidate unified context cache after successful mutation
        unifiedService.invalidateCacheAfterMutation(user.id, organizationId);
        
        return { success: true, data: result };
      } catch (error) {
        console.error('[{FEATURE}_CREATE_ACTION] Error:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to create {feature} item'
        };
      }
    },
    '{feature}-operations'
  );
}
```

### 5. Page Component Template

```typescript
/**
 * {Feature} Page Client - Presentation Layer
 * 
 * AI INSTRUCTIONS:
 * - OPTIMIZATION: Uses unified context exclusively to prevent duplicate API calls
 * - Maintains all security guarantees while improving performance
 * - INCLUDES optimistic updates for instant UI feedback
 * - Follow @golden-rule patterns exactly
 */

'use client';

import { use{Feature}UnifiedContext } from '../hooks/use{Feature}UnifiedContext';
import { create{Feature}Item, update{Feature}Item, delete{Feature}Item } from '../actions/{feature}UnifiedActions';
import { toast } from 'react-hot-toast';

export function {Feature}PageClient() {
  // CRITICAL: ALL HOOKS MUST BE CALLED FIRST - React's Rules of Hooks
  // OPTIMIZATION: Use unified context exclusively to prevent duplicate API calls
  const { 
    user,
    organizationId: activeOrganizationId, 
    isLoading,
    is{Feature}Enabled,
    error,
    fromCache,
    items,
    addItemOptimistic,
    updateItemOptimistic,
    deleteItemOptimistic,
    refreshContext
  } = use{Feature}UnifiedContext();

  // Extract permissions from unified context
  const canCreate = Boolean(user && !isLoading);
  const canUpdate = Boolean(user && !isLoading);
  const canDelete = Boolean(user && !isLoading);

  // ✅ OPTIMISTIC UPDATE HANDLERS
  const handleAddItem = async (itemData: Create{Feature}ItemInput) => {
    if (!user || !activeOrganizationId) return;

    // 1. Create temporary item for optimistic update
    const tempItem: {Feature}Item = {
      id: `temp-${Date.now()}`,
      user_id: user.id,
      organization_id: activeOrganizationId,
      name: itemData.name,
      description: itemData.description || null,
      status: itemData.status || 'active',
      created_at: new Date().toISOString(),
      updated_at: null
    };

    // 2. Optimistic update (instant UI feedback)
    addItemOptimistic(tempItem);
    toast.success('{Feature} item added!');

    try {
      // 3. Server action (background)
      const result = await create{Feature}Item(itemData);
      
      if (result.success) {
        // 4. Replace temp item with real item (has real ID)
        deleteItemOptimistic(tempItem.id);
        addItemOptimistic(result.data!);
      } else {
        // 5. Rollback optimistic update on server error
        deleteItemOptimistic(tempItem.id);
        toast.error(result.error || 'Failed to create {feature} item');
      }
    } catch (error) {
      // 6. Rollback on unexpected error
      deleteItemOptimistic(tempItem.id);
      toast.error('Failed to create {feature} item');
    }
  };

  const handleUpdateItem = async (itemId: string, updates: Partial<{Feature}Item>) => {
    // 1. Optimistic update
    updateItemOptimistic(itemId, updates);
    
    try {
      // 2. Server action
      const result = await update{Feature}Item(itemId, updates);
      
      if (!result.success) {
        // 3. Rollback on error (re-fetch to get original state)
        refreshContext();
        toast.error(result.error || 'Failed to update {feature} item');
      }
    } catch (error) {
      // 4. Rollback on unexpected error
      refreshContext();
      toast.error('Failed to update {feature} item');
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    // 1. Store original item for potential rollback
    const originalItem = items.find(item => item.id === itemId);
    if (!originalItem) return;

    // 2. Optimistic delete
    deleteItemOptimistic(itemId);
    toast.success('{Feature} item deleted!');

    try {
      // 3. Server action
      const result = await delete{Feature}Item(itemId);
      
      if (!result.success) {
        // 4. Rollback on server error
        addItemOptimistic(originalItem);
        toast.error(result.error || 'Failed to delete {feature} item');
      }
    } catch (error) {
      // 5. Rollback on unexpected error
      addItemOptimistic(originalItem);
      toast.error('Failed to delete {feature} item');
    }
  };

  // OPTIMIZATION: Log cache performance in development
  if (fromCache && process.env.NODE_ENV === 'development') {
    console.log('[{FEATURE}_OPTIMIZATION] Using cached unified context - no API calls needed');
  }

  // SECURITY: Wait for organization context to load before rendering (check loading first)
  if (isLoading) {
    return (
      <div className="container mx-auto p-4">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading organization context...</p>
          {process.env.NODE_ENV === 'development' && (
            <p className="text-xs text-gray-400 mt-2">Optimized (1 API call)</p>
          )}
        </div>
      </div>
    );
  }

  // Handle {Feature} feature access error
  if (error) {
    return (
      <div className="container mx-auto p-4">
        <div className="text-center py-8">
          <div className="text-red-600 mb-4">
            <h2 className="text-xl font-semibold">{Feature} Access Error</h2>
            <p className="text-sm mt-2">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  // Handle {Feature} feature disabled (business feature flag) - only after loading completes
  if (!is{Feature}Enabled) {
    return (
      <div className="container mx-auto p-4">
        <div className="text-center py-8">
          <div className="text-yellow-600 mb-4">
            <h2 className="text-xl font-semibold">{Feature} Feature Disabled</h2>
            <p className="text-sm mt-2">{Feature} is not enabled for your organization.</p>
          </div>
        </div>
      </div>
    );
  }

  // SECURITY: Server actions handle all validation with organization context
  return (
    <div className="space-y-6" data-organization-id={activeOrganizationId}>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{Feature} Dashboard</h1>
      </div>
      
      <div className="mt-4">
        {/* ✅ PASS PROPS AND CALLBACKS TO CHILDREN - No additional hook calls */}
        <{Feature}Interface 
          items={items}
          canCreate={canCreate}
          canUpdate={canUpdate}
          canDelete={canDelete}
          isLoading={isLoading}
          user={user}
          organizationId={activeOrganizationId} // ✅ ESLint: Used for validation, not removed
          onAddItem={handleAddItem}
          onUpdateItem={handleUpdateItem}
          onDeleteItem={handleDeleteItem}
        />
      </div>
    </div>
  );
}
```

## 🎯 Template Variable Replacements

When implementing for a specific feature, replace these placeholders:

```typescript
// Case-sensitive replacements:
{Feature}           // PascalCase: "Dam", "Chatbot", "Analytics"
{feature}           // camelCase: "dam", "chatbot", "analytics"
{FEATURE}           // UPPER_CASE: "DAM", "CHATBOT", "ANALYTICS"
{FEATURE_FLAG_NAME} // Feature flag: "DAM_ENABLED", "CHATBOT_ENABLED"

// Domain-specific:
{Feature}Item       // Replace with your entity: Asset, ChatSession, Report
Create{Feature}ItemInput // CreateAssetInput, CreateChatSessionInput
```

## 🏆 Implementation Benefits

Using Notes as a template provides:

1. **Gold Standard DDD** (97/100 score)
   - Domain events and specifications
   - Clean architecture patterns
   - Comprehensive error handling

2. **Unified Context Performance** (3+ calls → 1 call)
   - Single API call optimization
   - Proper cache invalidation
   - Organization-scoped security

3. **ESLint Security Compliance**
   - Organization context protection
   - No redundant API calls
   - Proper React hooks usage

4. **Optimistic Updates**
   - Instant UI feedback
   - Proper error rollbacks
   - Cache coordination

5. **Production Ready**
   - Comprehensive test coverage
   - Real-world proven patterns
   - Security best practices

## 📚 Next Steps

1. **Choose your feature** to implement
2. **Copy the template files** and replace variables
3. **Implement domain-specific logic** (entities, business rules)
4. **Test thoroughly** (unit, integration, E2E)
5. **Verify performance** (API calls reduced, page load improved)
6. **Security validation** (organization context, permissions)

The Notes domain provides a **complete, production-ready template** that can be adapted for any feature while maintaining architectural excellence and performance optimization.