# Feature Implementation Executor

**Usage:** `/feature-implementation-executor [feature-area] [dimension]`

**Purpose:** Execute specific implementation phases from the feature upgrade audit plan with step-by-step guidance, code generation, and quality verification based on the **Notes domain gold standard**.

## Context & Prerequisites

### **Required Predecessor**
Must run `/feature-upgrade-audit [feature-area]` first to generate:
- `docs/refactor/[feature-area]-upgrade-audit-[timestamp].md`
- `docs/refactor/[feature-area]-implementation-plan-[timestamp].md`

### **Reference Implementation**
**Notes Domain Gold Standard** (`lib/notes/`):
- **DDD Score**: 97/100 (Domain events, specifications, clean architecture)
- **Unified Context**: 3+ API calls → 1 call (70% performance improvement)
- **Security**: 100/100 compliance (ESLint security guidelines)
- **Feature Flags**: Seamless organization-scoped integration
- **Permissions**: Role-based with SuperAdmin support

### **Template Resources**
- **Complete Guide**: `docs/templates/notes-domain-template-guide.md`
- **Code Templates**: Copy-paste ready implementations from Notes domain
- **Security Patterns**: `.claude/commands/eslint-security-guidelines.md`
- **Unified Context**: `docs/general/unified-context-pattern-implementation-guide.md`

## Multi-Agent Execution Workflow

### **Agent 1: Phase Validation & Setup**
**Task:** Verify prerequisites and prepare implementation environment

**Validation Checklist:**
1. **Audit Report Exists**: Load latest audit report for feature area
2. **Phase Dependencies**: Verify previous phases completed successfully
3. **Code Quality Baseline**: Run current lint/type checks
4. **Database State**: Confirm schema and RLS policies
5. **Environment Setup**: Verify development environment ready

**Output:** Phase readiness assessment and setup instructions

### **Agent 2: Implementation Guidance & Code Generation**
**Task:** Provide step-by-step implementation with Notes domain templates

**Execution Strategy:**
1. **Load Phase Plan**: Extract specific tasks from audit implementation plan
2. **Generate Code**: Create files using Notes domain templates with feature-specific adaptations
3. **Provide Guidance**: Step-by-step instructions with explanation
4. **Quality Gates**: Built-in verification checkpoints

**Output:** Complete implementation with generated code files

### **Agent 3: Quality Verification & Progress Tracking**
**Task:** Validate implementation quality and track progress

**Verification Process:**
1. **Lint Compliance**: ESLint security guidelines validation
2. **Type Safety**: TypeScript strict mode compliance
3. **DDD Patterns**: Architecture compliance scoring
4. **Security Audit**: Organization context and permission validation
5. **Performance Test**: API call consolidation verification

**Output:** Quality assessment report and updated progress tracking

## Dimension Implementation Details

### **Dimension: DDD (Domain-Driven Design)**
**Estimated Time**: 8-16 hours | **Target Score**: 90+ DDD compliance

#### **Implementation Tasks**

**TASK-001: Create Domain Aggregate**
```typescript
File: lib/[feature]/domain/aggregates/[Feature]Aggregate.ts
Template: lib/notes/domain/aggregates/NoteAggregate.ts
```

**Generated Code Structure:**
```typescript
/**
 * [Feature] Aggregate Root - Domain Layer
 * 
 * AI INSTRUCTIONS:
 * - Aggregate root for [Feature] entity with business invariants
 * - Enforce business rules and validation  
 * - Publish domain events for significant state changes
 * - Keep business logic pure, no external dependencies
 * - Follow Notes domain patterns exactly
 */

import { [Feature]Id } from '../value-objects/[Feature]Id';
import { BusinessRuleViolationError, Invalid[Feature]DataError } from '../errors/[Feature]DomainError';
import { DomainEvent, [Feature]CreatedEvent, [Feature]UpdatedEvent } from '../events/[Feature]Events';
import { Complete[Feature]ValidSpec } from '../specifications/[Feature]Specifications';

export class [Feature]Aggregate {
  private _domainEvents: DomainEvent[] = [];
  private static readonly contentValidator = new Complete[Feature]ValidSpec();

  private constructor(
    private readonly _id: [Feature]Id,
    private _name: string,
    private _status: string,
    private readonly _userId: string,
    private readonly _organizationId: string,
    private readonly _createdAt: Date,
    private _updatedAt: Date | null
  ) {
    this.validateInvariants();
  }

  // Factory methods following Notes pattern
  public static create(
    name: string,
    userId: string,
    organizationId: string,
    status: string = 'active'
  ): [Feature]Aggregate {
    const id = [Feature]Id.generate();
    const now = new Date();
    
    const aggregate = new [Feature]Aggregate(
      id, name, status, userId, organizationId, now, null
    );
    
    // Publish domain event for creation (Notes pattern)
    aggregate.addDomainEvent(new [Feature]CreatedEvent(
      id.value, name, userId, organizationId
    ));
    
    return aggregate;
  }

  // Business methods with domain events (Notes pattern)
  public updateName(newName: string): void {
    this.validateNameUpdate(newName);
    
    const oldName = this._name;
    this._name = newName.trim();
    this._updatedAt = new Date();
    
    this.validateInvariants();
    
    // Publish domain event for updates (Notes pattern)
    if (oldName !== this._name) {
      this.addDomainEvent(new [Feature]UpdatedEvent(
        this._id.value, 
        { name: { from: oldName, to: this._name } }
      ));
    }
  }

  // Domain events management (Notes pattern)
  public getDomainEvents(): DomainEvent[] {
    return [...this._domainEvents];
  }

  public clearDomainEvents(): void {
    this._domainEvents = [];
  }

  private addDomainEvent(event: DomainEvent): void {
    this._domainEvents.push(event);
  }

  // Validation using specifications (Notes pattern)
  private validateNameUpdate(name: string): void {
    const candidate = { name };
    
    if (!this.contentValidator.isSatisfiedBy(candidate)) {
      const reason = this.contentValidator.getFailureReason!(candidate);
      throw new Invalid[Feature]DataError('name', name, { reason });
    }
  }

  // Business invariants (Notes pattern)
  private validateInvariants(): void {
    if (!this._userId || !this._organizationId) {
      throw new BusinessRuleViolationError(
        'User ID and Organization ID are required',
        { userId: this._userId, organizationId: this._organizationId }
      );
    }
  }
}
```

**TASK-002: Create Value Objects**
```typescript
File: lib/[feature]/domain/value-objects/[Feature]Id.ts
Template: lib/notes/domain/value-objects/NoteId.ts
```

**TASK-003: Create Domain Events**
```typescript
File: lib/[feature]/domain/events/[Feature]Events.ts
Template: lib/notes/domain/events/NoteEvents.ts
```

**TASK-004: Create Specifications**
```typescript
File: lib/[feature]/domain/specifications/[Feature]Specifications.ts  
Template: lib/notes/domain/specifications/NoteSpecifications.ts
```

**TASK-005: Create Domain Errors**
```typescript
File: lib/[feature]/domain/errors/[Feature]DomainError.ts
Template: lib/notes/domain/errors/NotesDomainError.ts
```

#### **DDD Dimension Verification**
- [ ] All domain files created with Notes patterns
- [ ] Aggregates publish domain events
- [ ] Value objects are immutable and validated
- [ ] Specifications encapsulate business rules
- [ ] Domain errors have severity levels
- [ ] No external dependencies in domain layer

### **Dimension: Unified-Context (Performance Optimization)**
**Estimated Time**: 12-20 hours | **Target**: 3+ API calls → 1 call

#### **Implementation Tasks**

**TASK-006: Create Unified Context Service**
```typescript
File: lib/[feature]/application/services/[Feature]UnifiedContextService.ts
Template: lib/notes/application/services/NotesUnifiedContextService.ts
```

**Generated Code Structure:**
```typescript
/**
 * [Feature] Unified Context Service - Application Layer
 * 
 * AI INSTRUCTIONS:
 * - OPTIMIZATION: Consolidates existing services in single call
 * - Eliminates 3x API calls on [Feature] page load to 1x API call
 * - REUSES existing services instead of duplicating database queries
 * - Follows DRY principle and DDD composition patterns
 * - INCLUDES [feature] data in unified context for true single-call optimization
 * - Follow Notes domain patterns exactly
 */

import { User } from '@supabase/supabase-js';
import { createClient as createSupabaseServerClient } from '@/lib/supabase/server';
import { OrganizationContextFactory } from '@/lib/organization/infrastructure/composition/OrganizationContextFactory';
import { PermissionValidationService } from '@/lib/organization/domain/services/PermissionValidationService';

// [Feature] interface matching database structure
export interface [Feature]Item {
  id: string;
  user_id: string;
  organization_id: string;
  name: string;
  status: string;
  created_at: string;
  updated_at: string | null;
}

// Discriminated union for type safety (Notes pattern)
export type [Feature]ValidationResult = 
  | {
      isValid: true;
      user: User;
      organizationId: string;
      unifiedContext: [Feature]UnifiedContext;
      securityContext: {
        fromCache: boolean;
        timestamp: Date;
        validationMethod: string;
      };
    }
  | {
      isValid: false;
      error: string;
      user: User | null;
      organizationId: string;
      unifiedContext?: [Feature]UnifiedContext;
      securityContext: {
        fromCache: boolean;
        timestamp: Date;
        validationMethod: string;
      };
    };

// Interface for unified context data (Notes pattern)
export interface [Feature]UnifiedContext {
  user: User | null;
  organizationId: string | null;
  organizations: Array<{
    organization_id: string;
    organization_name: string;
    role: string;
  }>;
  featureFlags: Record<string, boolean>;
  is[Feature]Enabled: boolean;
  items: [Feature]Item[]; // ✅ CRITICAL: Include domain data
  fromCache: boolean;
}

export class [Feature]UnifiedContextService {
  private static instance: [Feature]UnifiedContextService;
  private cache = new Map<string, { data: [Feature]UnifiedContextResult; timestamp: number }>();
  private readonly CACHE_TTL = 5000; // 5 seconds for security

  // Singleton pattern (Notes pattern)
  static getInstance(): [Feature]UnifiedContextService {
    if (!this.instance) {
      this.instance = new [Feature]UnifiedContextService();
    }
    return this.instance;
  }

  /**
   * Get unified [Feature] context - combines user, organization, and [Feature] validation + data
   * Single API call replacing 3+ separate calls (Notes pattern)
   */
  async getUnified[Feature]Context(): Promise<[Feature]ValidationResult> {
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

      const organizationId = organizationContext.active_organization_id;
      
      // ✅ OPTIMIZATION: Check cache before expensive operations (Notes pattern)
      const cachedResult = this.getCachedContext(currentUser?.id || 'anonymous', organizationId);
      if (cachedResult) {
        const unifiedContext: [Feature]UnifiedContext = {
          user: cachedResult.user,
          organizationId: cachedResult.organizationId,
          organizations: cachedResult.organizations.map(org => ({
            organization_id: org.organization_id,
            organization_name: org.organization_name,
            role: org.role_name
          })),
          featureFlags: cachedResult.featureFlags,
          is[Feature]Enabled: cachedResult.has[Feature]Access,
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

      // Check [Feature] access via feature flags (Notes pattern)
      const featureEnabled = featureFlags.[FEATURE]_ENABLED !== false; // Default enabled
      
      if (!featureEnabled) {
        const unifiedContext: [Feature]UnifiedContext = {
          user: currentUser,
          organizationId,
          organizations: userOrganizations.map(org => ({
            organization_id: org.organization_id,
            organization_name: org.organization_name,
            role: org.role_name
          })),
          featureFlags,
          is[Feature]Enabled: false,
          items: [], // Empty when disabled
          fromCache: false
        };

        return {
          isValid: false,
          error: '[Feature] feature is not enabled for this organization',
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
      
      // Feature is enabled, check permissions and fetch data (Notes pattern)
      let has[Feature]Access = false;
      let items: [Feature]Item[] = [];
      
      if (currentUser && organizationId) {
        try {
          // Use application service to check permissions and fetch data
          const { [Feature]CompositionRoot } = await import('../../infrastructure/composition/[Feature]CompositionRoot');
          const compositionRoot = [Feature]CompositionRoot.getInstance();
          const applicationService = compositionRoot.get[Feature]ApplicationService();
          
          // Try to get items - validates permissions and fetches data
          items = await applicationService.get[Feature]Items(currentUser.id, organizationId);
          has[Feature]Access = true;
        } catch (error) {
          has[Feature]Access = false;
          console.log('[[FEATURE]_UNIFIED_CONTEXT] [Feature] permission denied:', error);
        }
      }

      // ✅ SECURITY: Cache with organization-scoped keys (Notes pattern)
      const cacheKey = `[feature]-context-${currentUser?.id || 'anonymous'}-${organizationId}`;
      const internalResult = {
        user: currentUser,
        organizationId,
        organizations: userOrganizations,
        has[Feature]Access,
        featureFlags,
        items // ✅ CRITICAL: Cache domain data
      };

      this.cache.set(cacheKey, {
        data: internalResult,
        timestamp: Date.now()
      });

      const unifiedContext: [Feature]UnifiedContext = {
        user: currentUser,
        organizationId,
        organizations: userOrganizations.map(org => ({
          organization_id: org.organization_id,
          organization_name: org.organization_name,
          role: org.role_name
        })),
        featureFlags,
        is[Feature]Enabled: has[Feature]Access,
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
   * ✅ CRITICAL: Invalidate cache after mutations (Notes pattern)
   * Call this after successful create/update/delete operations
   */
  invalidateCacheAfterMutation(userId: string, organizationId: string): void {
    const cacheKey = `[feature]-context-${userId}-${organizationId}`;
    this.cache.delete(cacheKey);
    console.log(`[[FEATURE]_CACHE] Invalidated cache after mutation: ${cacheKey}`);
  }
}
```

#### **Unified-Context Dimension Verification**
- [ ] Unified context service created following Notes pattern
- [ ] Single API call consolidates auth + org + data + permissions
- [ ] Organization-scoped cache keys prevent data leakage
- [ ] Cache invalidation after mutations implemented
- [ ] Discriminated union types for validation results

### **Dimension: Security (Security Compliance)**
**Estimated Time**: 8-16 hours | **Target**: 100/100 Security compliance

#### **Implementation Tasks**

**TASK-007: Create Unified Context Hook**
```typescript
File: lib/[feature]/presentation/hooks/use[Feature]UnifiedContext.ts
Template: lib/notes/presentation/hooks/useNotesUnifiedContext.ts
```

**TASK-008: Create Server Actions**
```typescript
File: lib/[feature]/presentation/actions/[feature]UnifiedActions.ts
Template: lib/notes/presentation/actions/notesUnifiedActions.ts
```

**TASK-009: Create Page Component**
```typescript
File: lib/[feature]/presentation/components/[Feature]PageClient.tsx
Template: lib/notes/presentation/components/NotesPageClient.tsx
```

**Generated Hook Structure (Notes Pattern):**
```typescript
/**
 * [Feature] Unified Context Hook - Presentation Layer
 * 
 * AI INSTRUCTIONS:
 * - OPTIMIZATION: Replaces useOrganizationContext() for [Feature] pages
 * - Reduces 3 API calls to 1 API call on page load
 * - CRITICAL: Uses stable dependencies to prevent infinite re-render loops
 * - INCLUDES optimistic update functions for instant UI feedback
 * - Follow Notes domain patterns exactly
 */

export function use[Feature]UnifiedContext(): [Feature]UnifiedContextData {
  const [state, setState] = useState({
    user: null,
    organizationId: null,
    organizations: [],
    featureFlags: {},
    is[Feature]Enabled: true,
    isLoading: true,
    error: null,
    fromCache: false,
    items: []
  });

  // CRITICAL: Use refs to break dependency chains (Notes pattern)
  const isLoadingRef = useRef(false);
  const hasLoadedRef = useRef(false);
  const loadContextFunctionRef = useRef<(() => Promise<void>) | null>(null);

  // Create stable load function (Notes pattern)
  loadContextFunctionRef.current = async () => {
    if (isLoadingRef.current) return;

    try {
      isLoadingRef.current = true;
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      // OPTIMIZATION: Single server action call gets everything
      const result = await get[Feature]UnifiedContext();
      
      if (result.success && result.data) {
        setState(prev => ({
          ...prev,
          user: result.data!.user,
          organizationId: result.data!.organizationId,
          organizations: result.data!.organizations,
          featureFlags: result.data!.featureFlags,
          is[Feature]Enabled: result.data!.is[Feature]Enabled,
          items: result.data!.items || [],
          isLoading: false,
          error: null,
          fromCache: result.data!.fromCache
        }));
        hasLoadedRef.current = true;
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to load [feature] context'
      }));
    } finally {
      isLoadingRef.current = false;
    }
  };

  // CRITICAL: Stable refresh function with NO dependencies (Notes pattern)
  const refreshContext = useCallback(async () => {
    hasLoadedRef.current = false;
    if (loadContextFunctionRef.current) {
      await loadContextFunctionRef.current();
    }
  }, []); // ✅ NO DEPENDENCIES - breaks infinite loop

  // ✅ OPTIMISTIC UPDATE FUNCTIONS (Notes pattern)
  const addItemOptimistic = useCallback((tempItem: [Feature]Item) => {
    setState(prev => ({
      ...prev,
      items: [...prev.items, tempItem]
    }));
  }, []);

  const updateItemOptimistic = useCallback((itemId: string, updates: Partial<[Feature]Item>) => {
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

  // Load context immediately (Notes pattern)
  useEffect(() => {
    if (!hasLoadedRef.current && !isLoadingRef.current && loadContextFunctionRef.current) {
      loadContextFunctionRef.current();
    }
  }, []); // ✅ NO DEPENDENCIES - only run once

  return {
    user: state.user,
    organizationId: state.organizationId,
    organizations: state.organizations,
    featureFlags: state.featureFlags,
    is[Feature]Enabled: state.is[Feature]Enabled,
    items: state.items,
    isLoading: state.isLoading,
    error: state.error,
    fromCache: state.fromCache,
    refreshContext,
    addItemOptimistic,
    updateItemOptimistic,
    deleteItemOptimistic
  };
}
```

#### **Security Dimension Verification**
- [ ] Unified context hook with stable dependencies (no infinite loops)
- [ ] Server actions use apiDeduplicationService
- [ ] Page components follow ESLint security guidelines
- [ ] Optimistic updates with proper rollback handling
- [ ] Organization context validation implemented

### **Dimension: Feature-Flags (Organization-Scoped Features)**
**Estimated Time**: 4-8 hours | **Target**: 95/100 Feature flag integration

#### **Implementation Tasks**

**TASK-007: Integrate Feature Flags into Unified Context**
```typescript
File: lib/[feature]/application/services/[Feature]UnifiedContextService.ts
Template: lib/notes/application/services/NotesUnifiedContextService.ts
```

**Generated Feature Flag Integration:**
```typescript
// Check [Feature] access via feature flags (Notes pattern)
const featureEnabled = featureFlags.[FEATURE]_ENABLED !== false; // Default enabled

if (!featureEnabled) {
  return {
    isValid: false,
    error: '[Feature] feature is not enabled for this organization',
    unifiedContext: {
      is[Feature]Enabled: false,
      items: [], // Empty when disabled
      fromCache: false
    }
  };
}
```

#### **Feature-Flags Dimension Verification**
- [ ] Organization-scoped feature flags implemented
- [ ] Default-enabled behavior (feature !== false)
- [ ] Graceful degradation when feature disabled
- [ ] Unified context integration complete
- [ ] Single API call includes feature flag checks

### **Dimension: Role-Permissions (Access Control)**
**Estimated Time**: 8-12 hours | **Target**: 95/100 Permission compliance

#### **Implementation Tasks**

**TASK-008: Create Permission Service Integration**
```typescript
File: lib/[feature]/infrastructure/services/[Feature]PermissionService.ts
Template: lib/notes/infrastructure/services/NotesPermissionService.ts
```

**TASK-009: Add Permission Validation to Use Cases**
```typescript
Files: lib/[feature]/application/use-cases/
Template: lib/notes/application/use-cases/
```

#### **Role-Permissions Dimension Verification**
- [ ] Permission checks in all operations
- [ ] SuperAdmin bypass logic implemented
- [ ] UI conditional rendering based on permissions
- [ ] Server-side permission validation
- [ ] Granular permission error messages


## Quality Verification Framework

### **Automated Checks**
```bash
# ESLint Security Compliance
npx eslint lib/[feature]/ --config .eslintrc.security.js

# TypeScript Strict Mode  
npx tsc --noEmit --strict --project tsconfig.json

# DDD Architecture Compliance
npm run ddd-audit [feature]

# Performance Benchmark
npm run perf-test [feature]-page-load
```

### **Manual Verification Checklist**

#### **Security Compliance (CRITICAL)**
- [ ] ✅ organizationId variables never removed (ESLint security)
- [ ] ✅ All React hooks called before conditionals
- [ ] ✅ Stable dependencies in useCallback/useEffect
- [ ] ✅ Organization-scoped cache keys prevent data leakage
- [ ] ✅ JWT-based organization scoping implemented
- [ ] ✅ Permission validation on all operations

#### **Performance Verification (HIGH)**
- [ ] ✅ API calls reduced from 3+ to 1 (unified context)
- [ ] ✅ Cache invalidation working properly
- [ ] ✅ Optimistic updates with rollback handling
- [ ] ✅ No redundant context calls in child components
- [ ] ✅ Page load time improvement measured

#### **DDD Architecture (HIGH)**
- [ ] ✅ Domain events published for state changes
- [ ] ✅ Specifications encapsulate business rules  
- [ ] ✅ Aggregates enforce business invariants
- [ ] ✅ Clean layer boundaries maintained
- [ ] ✅ No external dependencies in domain layer

#### **Feature Flag Integration (MEDIUM)**
- [ ] ✅ Organization-scoped feature flags
- [ ] ✅ Graceful degradation when feature disabled
- [ ] ✅ Default-enabled behavior compliance
- [ ] ✅ Unified context integration

## Progress Tracking & File Management

### **Generated Progress Files**
```
docs/refactor/[feature-area]-implementation-progress-[timestamp].md
docs/refactor/[feature-area]-quality-report-[timestamp].md
```

### **Progress Format**
```markdown
# [Feature] Implementation Progress

## Overall Status: Phase 2 of 4 (IN PROGRESS)
**Started**: 2025-01-21 14:30
**Current Phase**: Application Layer (Unified Context)
**Estimated Completion**: 2025-01-22 16:00

## Phase Completion Status

### ✅ Phase 1: Domain Foundation (COMPLETED)
- [x] **[TASK-001]** [Feature]Aggregate with domain events ✅ 2025-01-21 15:30
- [x] **[TASK-002]** Value objects implementation ✅ 2025-01-21 16:15  
- [x] **[TASK-003]** Domain events structure ✅ 2025-01-21 17:00
- [x] **[TASK-004]** Specifications for business rules ✅ 2025-01-21 17:45
- [x] **[TASK-005]** Domain errors with severity ✅ 2025-01-21 18:30

**Quality Score**: 92/100 DDD compliance ✅
**Issues**: None - ready for Phase 2

### 🔄 Phase 2: Application Layer (IN PROGRESS)
- [x] **[TASK-006]** Unified context service structure ✅ 2025-01-22 10:30
- [ ] **[TASK-007]** Permission integration (IN PROGRESS)
- [ ] **[TASK-008]** Cache invalidation implementation (PENDING)
- [ ] **[TASK-009]** Application service orchestration (PENDING)

**Quality Score**: 75/100 (Target: 90+)
**Current Issue**: Permission service integration complexity
**ETA**: 2025-01-22 16:00

### ⏳ Phase 3: Presentation Layer (PENDING)
**Dependencies**: Phase 2 complete
**Estimated Start**: 2025-01-22 16:30

### ⏳ Phase 4: Testing & Documentation (PENDING)  
**Dependencies**: Phase 1, 2, 3 complete
**Estimated Start**: 2025-01-23 14:00

## Implementation Notes
- Phase 1 exceeded expectations - 92/100 DDD score
- Permission integration more complex than estimated
- Performance targets on track (API consolidation working)
- Security compliance: 100% (no violations found)

## Next Steps
1. Complete permission service integration
2. Test cache invalidation thoroughly  
3. Begin Phase 3 presentation layer
4. Monitor performance benchmarks
```

### **Quality Report Format**
```markdown
# [Feature] Quality Assessment Report

## Overall Scores
- **DDD Architecture**: 92/100 (Target: 90+) ✅
- **Security Compliance**: 100/100 (Target: 95+) ✅  
- **Performance**: 85/100 (Target: 80+) ✅
- **Unified Context**: 78/100 (Target: 90+) ⚠️
- **Feature Flags**: 95/100 (Target: 90+) ✅

## Detailed Assessment

### ✅ Security Compliance (100/100)
- Organization context variables protected
- React hooks rules followed correctly
- JWT-based organization scoping implemented
- Cache keys include organization ID
- No ESLint security violations found

### ⚠️ Unified Context (78/100) - NEEDS IMPROVEMENT
- API consolidation: ✅ 3+ calls → 1 call
- Cache implementation: ✅ Working correctly
- Optimistic updates: ⚠️ Partially implemented (60%)
- Performance: ✅ 70% improvement measured
- **Action Required**: Complete optimistic update functions

### ✅ DDD Architecture (92/100)
- Domain events: ✅ Implemented correctly
- Specifications: ✅ Business rules encapsulated  
- Aggregates: ✅ Business invariants enforced
- Layer boundaries: ✅ Clean separation maintained
- Error handling: ✅ Severity levels implemented

## Recommendations
1. **Priority 1**: Complete optimistic update implementation
2. **Priority 2**: Add comprehensive error rollback handling
3. **Priority 3**: Performance optimization for large datasets
4. **Priority 4**: Documentation updates

## Comparison to Notes Domain Baseline
- **DDD Score**: 92/100 vs Notes 97/100 (Gap: 5 points)
- **Performance**: 70% improvement vs Notes 85% (Gap: 15%)
- **Security**: 100/100 vs Notes 100/100 (Match)
- **Overall**: 89/100 vs Notes 95/100 (Gap: 6 points)

**Status**: ON TRACK to meet Notes domain standard
```

## Implementation Process

When this command is executed:

1. **Load Audit Report**: Read latest audit for feature area
2. **Validate Dimension**: Check prerequisites and dependencies
3. **Execute Implementation**: Generate code using Notes domain templates
4. **Quality Verification**: Run automated and manual checks
5. **Update Progress**: Track completion and issues
6. **Prepare Next Dimension**: Set up for subsequent implementation

### **Multi-Agent Coordination**
- **Agent 1**: Validates readiness and loads dimension plan
- **Agent 2**: Generates implementation with Notes domain templates  
- **Agent 3**: Verifies quality and tracks progress

**Output**: Complete dimension implementation with quality validation and progress tracking, following the **Notes domain gold standard** (97/100 DDD + unified context + security compliance).

---

This executor provides hands-on implementation guidance using the **Notes domain as the gold standard template**, ensuring consistent, high-quality implementations across all feature areas.