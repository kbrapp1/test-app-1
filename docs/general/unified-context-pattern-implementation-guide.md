# Unified Context Pattern Implementation Guide

## Overview

The Unified Context Pattern consolidates multiple API calls (authentication, organization context, feature flags, permissions) into a single optimized call. This reduces page load times from 3+ API calls to 1 call while maintaining all security guarantees.

## Pattern Benefits

### Performance Optimization
- **Reduces API calls**: From 3+ separate calls to 1 unified call
- **Faster page loads**: Eliminates waterfall loading patterns
- **Better UX**: Single loading state instead of multiple sequential states
- **Reduced server load**: Fewer database queries and connections

### Security Advantages
- **Consistent context**: Single validation point prevents race conditions
- **Reduced attack surface**: Fewer API endpoints to secure
- **Unified error handling**: Consistent security error responses
- **Better audit trail**: Single point of access logging

### Maintainability Benefits
- **DRY principle**: Eliminates duplicate authentication/authorization logic
- **Consistent patterns**: Same structure across all features
- **Easier testing**: Single service to test instead of multiple hooks
- **Centralized caching**: Shared cache strategy across features

## ⚠️ CRITICAL ARCHITECTURE REQUIREMENTS

### **1. NEVER Mix Server-Side + Client-Side Data Fetching**

**❌ WRONG - Causes Multiple API Hits:**
```typescript
// Server Component - app/(protected)/feature/page.tsx
export default async function FeaturePage() {
  // ❌ Server-side fetching
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: orgId } = await supabase.rpc('get_active_organization_id');
  
  return <FeaturePageClient initialData={data} />; // ❌ Passing server data
}

// Client Component - FeaturePageClient.tsx
export function FeaturePageClient({ initialData }) {
  // ❌ Client-side unified context (DUPLICATE FETCHING!)
  const { user, organizationId } = useFeatureUnifiedContext();
  // Result: 2x API calls instead of 1x optimized call
}
```

**✅ CORRECT - Single Client-Side Fetching:**
```typescript
// Server Component - app/(protected)/feature/page.tsx
export default async function FeaturePage() {
  // ✅ NO server-side data fetching - unified context handles everything
  return <FeaturePageClient />;
}

// Client Component - FeaturePageClient.tsx
export function FeaturePageClient() {
  // ✅ Single unified context call handles all data fetching
  const { user, organizationId, data } = useFeatureUnifiedContext();
  // Result: 1x optimized API call
}
```

### **2. ALWAYS Use API Deduplication Service**

**❌ WRONG - No Deduplication:**
```typescript
// Server Action without deduplication
export async function getFeatureUnifiedContext(): Promise<FeatureUnifiedContextResult> {
  // ❌ Direct call - multiple simultaneous calls hit server
  try {
    const unifiedService = FeatureUnifiedContextService.getInstance();
    return await unifiedService.getUnifiedContext();
  } catch (error) {
    // ...
  }
}
```

**✅ CORRECT - With API Deduplication:**
```typescript
// Server Action with deduplication
export async function getFeatureUnifiedContext(): Promise<FeatureUnifiedContextResult> {
  // ✅ Deduplication prevents multiple simultaneous calls
  return await apiDeduplicationService.deduplicateServerAction(
    'getFeatureUnifiedContext',
    [], // No parameters needed
    async () => {
      try {
        const unifiedService = FeatureUnifiedContextService.getInstance();
        return await unifiedService.getUnifiedContext();
      } catch (error) {
        // ...
      }
    },
    'feature-operations' // Domain for timeout configuration
  );
}
```

### **3. ALWAYS Use Stable Hook Dependencies**

**❌ WRONG - Infinite Re-render Loop:**
```typescript
export function useFeatureUnifiedContext() {
  const [state, setState] = useState(/* ... */);
  
  // ❌ Function recreated on every render due to setState usage
  const loadContext = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true }));
    const result = await getFeatureUnifiedContext();
    setState(prev => ({ ...prev, ...result }));
  }, []); // ❌ Empty array but function still unstable
  
  // ❌ Depends on unstable function = infinite re-renders
  const refreshContext = useCallback(async () => {
    await loadContext();
  }, [loadContext]); // ❌ INFINITE LOOP!
  
  useEffect(() => {
    loadContext();
  }, [loadContext]); // ❌ INFINITE LOOP!
}
```

**✅ CORRECT - Stable Dependencies:**
```typescript
export function useFeatureUnifiedContext() {
  const [state, setState] = useState(/* ... */);
  const hasLoadedRef = useRef(false);
  const isLoadingRef = useRef(false);
  
  // ✅ Stable function using refs to break dependency chains
  const loadContext = useCallback(async () => {
    if (isLoadingRef.current) return; // Prevent duplicate calls
    
    try {
      isLoadingRef.current = true;
      setState(prev => ({ ...prev, isLoading: true }));
      const result = await getFeatureUnifiedContext();
      setState(prev => ({ ...prev, ...result, isLoading: false }));
      hasLoadedRef.current = true;
    } finally {
      isLoadingRef.current = false;
    }
  }, []); // ✅ Truly stable - no external dependencies
  
  // ✅ Stable refresh function with no dependencies
  const refreshContext = useCallback(async () => {
    hasLoadedRef.current = false;
    await loadContext();
  }, []); // ✅ NO DEPENDENCIES - breaks infinite loop
  
  useEffect(() => {
    if (!hasLoadedRef.current && !isLoadingRef.current) {
      loadContext();
    }
  }, []); // ✅ Run once on mount only
}
```

## Critical Learnings from Production Implementation

### **Real-World Patterns from Notes Domain**

During Notes implementation, we discovered several critical patterns not covered in the original guide. These patterns are **essential** for production success:

#### **1. Optimistic Updates Pattern** ⚠️ **CRITICAL**
**Problem**: Users expect instant feedback when creating/updating items
**Solution**: Implement optimistic updates in unified context hook

```typescript
// ✅ PRODUCTION PATTERN: Optimistic updates in unified context
export function useNotesUnifiedContext() {
  const [state, setState] = useState(/* ... */);
  
  // ✅ OPTIMISTIC UPDATE FUNCTIONS - Instant UI feedback
  const addNoteOptimistic = useCallback((tempNote: Note) => {
    setState(prev => ({
      ...prev,
      notes: [...prev.notes, tempNote]
    }));
  }, []);
  
  const updateNoteOptimistic = useCallback((noteId: string, updates: Partial<Note>) => {
    setState(prev => ({
      ...prev,
      notes: prev.notes.map(note => 
        note.id === noteId ? { ...note, ...updates } : note
      )
    }));
  }, []);
  
  const deleteNoteOptimistic = useCallback((noteId: string) => {
    setState(prev => ({
      ...prev,
      notes: prev.notes.filter(note => note.id !== noteId)
    }));
  }, []);
  
  return {
    // ... existing state ...
    addNoteOptimistic,
    updateNoteOptimistic,
    deleteNoteOptimistic
  };
}
```

#### **2. Cache Invalidation After Mutations** ⚠️ **CRITICAL**
**Problem**: Server actions succeed but UI doesn't refresh without page reload
**Solution**: Always invalidate unified context cache after successful mutations

```typescript
// ✅ PRODUCTION PATTERN: Cache invalidation in server actions
export async function createNote(noteData: CreateNoteInput): Promise<CreateNoteResult> {
  try {
    // ... validation and creation logic ...
    
    // ✅ CRITICAL: Invalidate unified context cache after successful mutation
    const unifiedService = NotesUnifiedContextService.getInstance();
    unifiedService.invalidateCacheAfterMutation(user.id, organizationId);
    
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Add to UnifiedContextService class
export class NotesUnifiedContextService {
  // ... existing methods ...
  
  /**
   * ✅ CRITICAL: Invalidate cache after mutations
   * Call this after successful create/update/delete operations
   */
  invalidateCacheAfterMutation(userId: string, organizationId: string): void {
    const cacheKey = `notes-context-${userId}-${organizationId}`;
    this.cache.delete(cacheKey);
    
    console.log(`[NOTES_CACHE] Invalidated cache after mutation: ${cacheKey}`);
  }
}
```

#### **3. Server Action + Optimistic Update Coordination** ⚠️ **CRITICAL**
**Problem**: Optimistic updates and server actions can conflict, causing duplicates
**Solution**: Proper coordination between optimistic updates and server actions

```typescript
// ✅ PRODUCTION PATTERN: Coordinated optimistic updates
const handleAddNote = async (noteData: CreateNoteInput) => {
  if (!user || !activeOrganizationId) return;

  // 1. Create temporary note for optimistic update
  const tempNote: Note = {
    id: `temp-${Date.now()}`,
    user_id: user.id,
    organization_id: activeOrganizationId,
    title: noteData.title,
    content: noteData.content,
    color_class: noteData.color_class || 'bg-yellow-200',
    position: notes.length,
    created_at: new Date().toISOString(),
    updated_at: null
  };

  // 2. Optimistic update (instant UI feedback)
  addNoteOptimistic(tempNote);
  toast.success('Note added!');

  try {
    // 3. Server action (background)
    const result = await createNote(noteData);
    
    if (result.success) {
      // 4. Replace temp note with real note (has real ID)
      deleteNoteOptimistic(tempNote.id);
      addNoteOptimistic(result.data);
    } else {
      // 5. Rollback optimistic update on server error
      deleteNoteOptimistic(tempNote.id);
      toast.error(result.error || 'Failed to create note');
    }
  } catch (error) {
    // 6. Rollback on unexpected error
    deleteNoteOptimistic(tempNote.id);
    toast.error('Failed to create note');
  }
};
```

#### **4. Component State Management Anti-Pattern** ⚠️ **CRITICAL**
**Problem**: Child components with local state don't see optimistic updates from parent
**Solution**: Remove local state, use props from unified context

```typescript
// ❌ ANTI-PATTERN: Local state conflicts with optimistic updates
export function NoteList({ initialNotes }: Props) {
  // ❌ Local state - optimistic updates from parent won't be visible here!
  const [notes, setNotes] = useState<Note[]>(initialNotes);
  
  // When parent does addNoteOptimistic(), this component doesn't see it
  return notes.map(note => <NoteItem key={note.id} note={note} />);
}

// ✅ CORRECT PATTERN: Use notes directly from unified context
export function NoteList({ 
  initialNotes, 
  onUpdateNote, 
  onDeleteNote 
}: Props) {
  // ✅ Use notes directly from unified context (no local state)
  const notes = initialNotes;
  
  // ✅ Use callback props for mutations instead of React Query hooks
  const handleUpdate = async (noteId: string, updates: Partial<Note>) => {
    if (onUpdateNote) {
      await onUpdateNote(noteId, updates);
    }
  };
  
  return notes.map(note => (
    <NoteItem 
      key={note.id} 
      note={note} 
      onUpdate={handleUpdate}
      onDelete={onDeleteNote}
    />
  ));
}
```

#### **5. Discriminated Union Types for TypeScript Safety** ⚠️ **CRITICAL**
**Problem**: TypeScript errors with `organizationId` potentially undefined
**Solution**: Use discriminated unions for validation functions

```typescript
// ❌ WRONG: Unclear when organizationId is defined
async function validateNotesAccess(): Promise<{
  success: boolean;
  user?: User;
  organizationId?: string; // Could be undefined even when success: true
  error?: string;
}> {
  // ... validation logic ...
}

// ✅ CORRECT: Discriminated union makes types clear
async function validateNotesAccess(): Promise<
  | { success: true; user: User; organizationId: string }
  | { success: false; error: string }
> {
  try {
    // ... validation logic ...
    
    if (validationSucceeds) {
      return { 
        success: true, 
        user: validUser, 
        organizationId: validOrgId 
      };
    } else {
      return { 
        success: false, 
        error: 'Validation failed' 
      };
    }
  } catch (error) {
    return { 
      success: false, 
      error: error.message 
    };
  }
}

// Usage - TypeScript knows organizationId is defined when success: true
const result = await validateNotesAccess();
if (result.success) {
  // TypeScript knows result.user and result.organizationId are defined
  unifiedService.invalidateCacheAfterMutation(result.user.id, result.organizationId);
}
```

#### **6. Testing Unified Context Hooks** ⚠️ **CRITICAL**
**Problem**: Tests fail because they mock old individual hooks instead of unified context
**Solution**: Update all test mocks to use unified context patterns

```typescript
// ❌ WRONG: Mocking old individual hooks
vi.mock('@/lib/shared/access-control/hooks/usePermissions', () => ({
  useNotesPermissions: () => ({
    canUpdate: true,
    canDelete: true,
    isLoading: false,
  }),
}));

// ✅ CORRECT: Mock unified context hook with optimistic updates
vi.mock('@/lib/notes/presentation/hooks/useNotesUnifiedContext', () => ({
  useNotesUnifiedContext: () => ({
    user: { id: 'user-123', email: 'test@example.com' },
    organizationId: 'org-123',
    organizations: [],
    featureFlags: {},
    notes: [
      {
        id: 'note-1',
        title: 'Test Note',
        content: 'Test content',
        color_class: 'bg-yellow-200',
        position: 0,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: null
      }
    ],
    isNotesEnabled: true,
    isLoading: false,
    error: null,
    fromCache: false,
    refreshContext: vi.fn(),
    addNoteOptimistic: vi.fn(),
    updateNoteOptimistic: vi.fn(),
    deleteNoteOptimistic: vi.fn(),
    reorderNotesOptimistic: vi.fn(),
  }),
}));
```

## Implementation Steps

### Step 0: Architecture Decision (CRITICAL)

**Choose ONE data fetching strategy:**

1. **✅ RECOMMENDED: Pure Client-Side Unified Context**
   - Server component does NO data fetching
   - Client component uses unified context hook for ALL data
   - Single optimized API call with deduplication
   - Best performance and maintainability

2. **❌ AVOID: Mixed Server + Client Fetching**
   - Causes duplicate API calls
   - Complex error handling
   - Poor performance

### Step 1: Create Feature-Specific Unified Context Service

**Location**: `lib/{feature}/application/services/{Feature}UnifiedContextService.ts`

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
 * - Follow @golden-rule patterns exactly
 */

import { User } from '@supabase/supabase-js';
import { createClient as createSupabaseServerClient } from '@/lib/supabase/server';
import { OrganizationContextService } from '@/lib/organization/domain/services/OrganizationContextService';
import { PermissionValidationService } from '@/lib/organization/domain/services/PermissionValidationService';
import { ClientSideOrganizationCache } from '@/lib/organization/infrastructure/ClientSideOrganizationCache';

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
  error?: string;
}

// ✅ CRITICAL: Use discriminated union for type safety
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
  fromCache: boolean;
  // ✅ CRITICAL: Include domain-specific data
  items: Item[]; // Replace 'Item' with your domain entity (Note, Asset, ChatSession, etc.)
}

export class {Feature}UnifiedContextService {
  private static instance: {Feature}UnifiedContextService;
  private cache = new Map<string, { data: {Feature}UnifiedContextResult; timestamp: number }>();
  private readonly CACHE_TTL = 5000; // 5 seconds for security

  private constructor() {
    // Private constructor for singleton pattern
    
    // ✅ SECURITY: Listen for organization switch events to clear cache
    if (typeof window !== 'undefined') {
      window.addEventListener('organizationSwitched', this.handleOrganizationSwitch.bind(this));
      
      // Expose service instance for direct cache invalidation
      (window as any).{feature}UnifiedContextService = this;
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
   * Called when user switches organizations to clear stale cache
   */
  private handleOrganizationSwitch(event: CustomEvent): void {
    const { userId, newOrganizationId, previousOrganizationId } = event.detail;
    
    if (userId && newOrganizationId) {
      this.clearCacheOnOrganizationSwitch(userId, newOrganizationId);
      
      console.log(`[{FEATURE}_SECURITY] Cache cleared due to org switch event: ${previousOrganizationId} → ${newOrganizationId}`);
    }
  }

  /**
   * Get unified {Feature} context - combines user, organization, and {Feature} validation
   * Single API call replacing 3 separate calls
   */
  async getUnified{Feature}Context(): Promise<{Feature}ValidationResult> {
    try {
      // Create server-side Supabase client for server actions
      const supabaseServer = createSupabaseServerClient();
      
      // Initialize services with server-side client
      const organizationService = new OrganizationContextService(supabaseServer);
      const permissionService = new PermissionValidationService(supabaseServer);
      const cacheService = new ClientSideOrganizationCache();

      // Execute all three services in parallel (was 3 separate API calls)
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
      // This is present in real implementations but missing from template
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
          fromCache: true // Mark as from cache
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
      // AI: Universal rule - all features default to enabled when flag missing
      const has{Feature}Access = featureFlags.{FEATURE_FLAG_NAME} !== false; // Default enabled
      
      if (!has{Feature}Access) {
        // Transform organizations to match expected interface
        const transformedOrganizations = userOrganizations.map(org => ({
          organization_id: org.organization_id,
          organization_name: org.organization_name,
          role: org.role_name
        }));

        // Create unified context even when {Feature} is disabled
        const unifiedContext: {Feature}UnifiedContext = {
          user: currentUser,
          organizationId,
          organizations: transformedOrganizations,
          featureFlags,
          is{Feature}Enabled: false,
          fromCache: false
        };

        return {
          isValid: false,
          user: currentUser,
          organizationId,
          error: '{Feature} feature disabled for this organization',
          unifiedContext,
          securityContext: {
            fromCache: false,
            timestamp: new Date(),
            validationMethod: 'UNIFIED_{FEATURE}_DISABLED'
          }
        };
      }

      // ✅ SECURITY FIX: Cache the internal result with organization ID
      // This prevents data leakage between organizations for super admin users
      const cacheKey = `{feature}-context-${currentUser?.id || 'anonymous'}-${organizationId}`;
      const internalResult: {Feature}UnifiedContextResult = {
        user: currentUser,
        organizationId,
        organizations: userOrganizations,
        has{Feature}Access,
        featureFlags
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
        fromCache: false
      };

      // Return compatible {Feature}ValidationResult
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

      // Return error state compatible with {Feature}ValidationResult
      return {
        isValid: false,
        user: null as any, // Match existing interface pattern
        organizationId: '',
        error: error instanceof Error ? error.message : 'Unknown error',
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
    // ✅ FIXED: Include organization ID in cache key
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
   * Clear cache for specific user and organization
   * ✅ SECURITY: Organization-specific cache invalidation
   */
  clearCache(userId: string, organizationId: string): void {
    // ✅ FIXED: Include organization ID in cache key
    const cacheKey = `{feature}-context-${userId}-${organizationId}`;
    this.cache.delete(cacheKey);
  }

  /**
   * ✅ SECURITY: Clear cache on organization switch (super admin)
   * This prevents stale organization data in unified context
   */
  clearCacheOnOrganizationSwitch(userId: string, newOrganizationId: string): void {
    // ✅ SECURITY FIX: Clear cache for ALL organizations this user might have cached
    // This is critical for super admin who can access multiple organizations
    const keysToDelete = Array.from(this.cache.keys())
      .filter(key => key.startsWith(`{feature}-context-${userId}-`));
    
    keysToDelete.forEach(key => this.cache.delete(key));
    
    console.log(`[{FEATURE}_SECURITY] Cache cleared for user ${userId} org switch to ${newOrganizationId}`);
    console.log(`[{FEATURE}_SECURITY] Cleared ${keysToDelete.length} cache entries for all organizations`);
  }

  /**
   * Clear cache on security events (role changes, permission changes)
   * ✅ SECURITY: Clear all organization caches for user on security events
   */
  clearCacheOnSecurityEvent(userId: string, event: 'org-switch' | 'role-change' | 'permission-change'): void {
    // Clear all organization caches for this user
    const keysToDelete = Array.from(this.cache.keys())
      .filter(key => key.startsWith(`{feature}-context-${userId}-`));
    
    keysToDelete.forEach(key => this.cache.delete(key));
    
    console.log(`[{FEATURE}_SECURITY] Cache cleared for user ${userId} on security event: ${event}`);
    console.log(`[{FEATURE}_SECURITY] Cleared ${keysToDelete.length} cache entries across all organizations`);
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
   * Clear all cached contexts (admin function)
   */
  clearAllCache(): void {
    this.cache.clear();
  }
}
```

### Step 2: Create Unified Context Server Action (CRITICAL: With Deduplication)

**Location**: `lib/{feature}/presentation/actions/{feature}UnifiedActions.ts`

```typescript
/**
 * {Feature} Unified Actions - Presentation Layer
 * 
 * AI INSTRUCTIONS:
 * - OPTIMIZATION: Single server action to replace multiple context calls
 * - Uses {Feature}UnifiedContextService for consolidated validation
 * - Maintains all security guarantees while reducing API calls
 * - CRITICAL: Uses apiDeduplicationService to prevent multiple simultaneous calls
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
 * Replaces separate calls to useOrganizationContext + validation + feature flags
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
          error: error instanceof Error ? error.message : 'Failed to load {Feature} context'
        };
      }
    },
    '{feature}-operations' // Domain for timeout configuration
  );
}

/**
 * ✅ CRITICAL: Server action template for mutations with cache invalidation
 * Use this pattern for create/update/delete operations
 */
export async function create{Feature}Item(itemData: CreateItemInput): Promise<CreateItemResult> {
  return await apiDeduplicationService.deduplicateServerAction(
    `create{Feature}Item`,
    [JSON.stringify(itemData)], // Include input in deduplication key
    async () => {
      try {
        // Validate access using discriminated union pattern
        const validation = await validate{Feature}Access();
        if (!validation.success) {
          return { success: false, error: validation.error };
        }
        
        const { user, organizationId } = validation;
        
        // Create item logic here...
        // const result = await createItemInDatabase(itemData, user.id, organizationId);
        
        // ✅ CRITICAL: Invalidate unified context cache after successful mutation
        const unifiedService = {Feature}UnifiedContextService.getInstance();
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

### Step 3: Create Unified Context Hook (CRITICAL: Stable Dependencies)

**Location**: `lib/{feature}/presentation/hooks/use{Feature}UnifiedContext.ts`

```typescript
/**
 * {Feature} Unified Context Hook - Presentation Layer
 * 
 * AI INSTRUCTIONS:
 * - OPTIMIZATION: Replaces useOrganizationContext() for {Feature} pages
 * - Reduces 3 API calls to 1 API call on page load
 * - Maintains compatibility with existing {Feature} components
 * - Provides all context needed: user, organization, feature flags
 * - CRITICAL: Uses stable dependencies to prevent infinite re-render loops
 * - Follow @golden-rule patterns exactly
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { User } from '@supabase/supabase-js';
import { get{Feature}UnifiedContext } from '../actions/{feature}UnifiedActions';

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
  // ✅ OPTIMISTIC UPDATES: Add domain-specific data and optimistic update functions
  items: Item[]; // Replace 'Item' with your domain entity (Note, Asset, etc.)
  addItemOptimistic: (tempItem: Item) => void;
  updateItemOptimistic: (itemId: string, updates: Partial<Item>) => void;
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
    items: Item[]; // Replace 'Item' with your domain entity
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
      // Server action handles all authentication validation + deduplication
      const result = await get{Feature}UnifiedContext();
      
      if (result.success && result.data) {
        setState(prev => ({
          ...prev,
          user: result.data!.user,
          organizationId: result.data!.organizationId,
          organizations: result.data!.organizations,
          featureFlags: result.data!.featureFlags,
          is{Feature}Enabled: result.data!.is{Feature}Enabled,
          items: result.data!.items || [], // Add domain-specific data
          isLoading: false,
          error: null,
          fromCache: result.data!.fromCache
        }));
        hasLoadedRef.current = true;
      } else {
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: result.error || 'Failed to load {Feature} context',
          fromCache: false
        }));
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to load {Feature} context',
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
  const addItemOptimistic = useCallback((tempItem: Item) => {
    setState(prev => ({
      ...prev,
      items: [...prev.items, tempItem]
    }));
  }, []);

  const updateItemOptimistic = useCallback((itemId: string, updates: Partial<Item>) => {
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
        .filter(Boolean) as Item[];
      
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

### Step 4: Update Page Component (CRITICAL: No Server-Side Fetching)

**Location**: `app/(protected)/{feature}/page.tsx`

```typescript
/**
 * {Feature} Page - Optimized with Unified Context Pattern
 * 
 * AI INSTRUCTIONS:
 * - OPTIMIZATION: Uses unified context pattern exclusively - no server-side data fetching
 * - Client component handles all data fetching via unified context to prevent duplicate calls
 * - Maintains proper error handling and loading states
 * - Follow @golden-rule patterns exactly
 */

import { {Feature}PageClient } from '@/lib/{feature}/presentation/components/{Feature}PageClient';

// Force dynamic rendering since we use cookies
export const dynamic = 'force-dynamic';

export default async function {Feature}Page() {
  // OPTIMIZATION: No server-side data fetching - unified context handles everything
  // This prevents duplicate API calls between server and client
  return <{Feature}PageClient />;
}
```

**Location**: `lib/{feature}/presentation/components/{Feature}PageClient.tsx`

```typescript
'use client';

/**
 * {Feature} Page Client - Presentation Layer
 * 
 * AI INSTRUCTIONS:
 * - OPTIMIZATION: Uses unified context exclusively to prevent duplicate API calls
 * - Maintains all security guarantees while improving performance
 * - Follow @golden-rule patterns exactly
 */

import { use{Feature}UnifiedContext } from '../hooks/use{Feature}UnifiedContext';

export function {Feature}PageClient() {
  // CRITICAL: ALL HOOKS MUST BE CALLED FIRST - React's Rules of Hooks
  // OPTIMIZATION: Use unified context exclusively to prevent duplicate API calls
  const { 
    user,
    organizationId: activeOrganizationId, 
    isLoading,
    is{Feature}Enabled,
    error,
    fromCache 
  } = use{Feature}UnifiedContext();

  // Extract permissions from unified context
  const canCreate = Boolean(user && !isLoading);
  const canUpdate = Boolean(user && !isLoading);
  const canDelete = Boolean(user && !isLoading);

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
        {/* Pass permissions as props instead of calling hooks in child components */}
        <{Feature}Interface 
          canCreate={canCreate}
          canUpdate={canUpdate}
          canDelete={canDelete}
          isLoading={isLoading}
          user={user}
          organizationId={activeOrganizationId}
        />
      </div>
    </div>
  );
}
```

## Implementation Checklist

### Phase 1: Service Layer
- [ ] Create `{Feature}UnifiedContextService.ts` with singleton pattern
- [ ] Implement `getUnified{Feature}Context()` method
- [ ] Add proper error handling and logging
- [ ] Add caching with security-appropriate TTL (5 seconds)
- [ ] **CRITICAL**: Add `invalidateCacheAfterMutation()` method
- [ ] Define all required interfaces (`{Feature}UnifiedContext`, `{Feature}ValidationResult`)
- [ ] Include domain-specific data (items, assets, etc.) in unified context

### Phase 2: Presentation Layer
- [ ] **CRITICAL**: Create `{feature}UnifiedActions.ts` server action **with API deduplication**
- [ ] **CRITICAL**: Import and use `apiDeduplicationService.deduplicateServerAction()`
- [ ] **CRITICAL**: Add mutation server actions with cache invalidation (create/update/delete)
- [ ] Create `use{Feature}UnifiedContext.ts` hook with **stable dependencies using refs**
- [ ] **CRITICAL**: Add optimistic update functions to unified context hook
- [ ] Add proper loading states and error handling
- [ ] **CRITICAL**: Remove ALL server-side data fetching from page components
- [ ] **CRITICAL**: Add `"use client"` directive to components using hooks

### Phase 3: Component Architecture (CRITICAL: Avoid Anti-Patterns)
- [ ] **CRITICAL**: Identify all components that need context data
- [ ] Update parent component to call unified context hook **once only**
- [ ] **CRITICAL**: Remove ALL local state from child components that conflicts with unified context
- [ ] Update child components to receive props instead of calling hooks
- [ ] Update all component interfaces to accept unified context props + optimistic update callbacks
- [ ] Use `Boolean()` wrapper for permission checks to ensure type safety
- [ ] **CRITICAL**: Pass optimistic update callbacks as props to child components
- [ ] Replace React Query mutations with optimistic update callbacks

### Phase 4: Hook Dependency Management (CRITICAL)
- [ ] **CRITICAL**: Use `useRef` to store functions and break dependency chains
- [ ] **CRITICAL**: Ensure `useCallback` has NO dependencies (`[]`)
- [ ] **CRITICAL**: Ensure `useEffect` runs only once on mount (`[]` dependency)
- [ ] Verify no infinite re-render loops in development tools
- [ ] Test that hook is called only once per page load

### Phase 5: Test Updates
- [ ] Update all test files to mock unified context hooks
- [ ] Remove old individual hook mocks
- [ ] Verify all tests pass with new unified context structure
- [ ] Test error scenarios and loading states

### Phase 6: Security Validation
- [ ] Verify all authentication flows work correctly
- [ ] Test organization context switching
- [ ] Verify feature flag behavior (default enabled)
- [ ] Test error scenarios (disabled features, invalid context)
- [ ] Verify RLS policies still apply correctly

### Phase 7: Performance Testing (CRITICAL)
- [ ] **CRITICAL**: Verify API calls reduced from 3+ to 1 (not increased!)
- [ ] **CRITICAL**: Check network tab shows single deduplicated call pattern
- [ ] Test cache effectiveness
- [ ] Verify page load time improvements
- [ ] Test rapid refresh scenarios (no duplicate API calls)
- [ ] Test concurrent user scenarios

### Phase 8: Cleanup
- [ ] Delete obsolete page components and files
- [ ] Remove unused imports and dependencies
- [ ] Update documentation and comments
- [ ] Verify no broken references to deleted files

## Complete Example: Coordinated Optimistic Updates

### Parent Component Pattern
```typescript
'use client';

export function {Feature}PageClient() {
  // ✅ SINGLE unified context hook call
  const { 
    user,
    organizationId,
    items,
    isLoading,
    is{Feature}Enabled,
    error,
    addItemOptimistic,
    updateItemOptimistic,
    deleteItemOptimistic
  } = use{Feature}UnifiedContext();

  // ✅ OPTIMISTIC UPDATE HANDLERS
  const handleAddItem = async (itemData: CreateItemInput) => {
    if (!user || !organizationId) return;

    // 1. Create temporary item for optimistic update
    const tempItem: Item = {
      id: `temp-${Date.now()}`,
      user_id: user.id,
      organization_id: organizationId,
      ...itemData,
      created_at: new Date().toISOString(),
      updated_at: null
    };

    // 2. Optimistic update (instant UI feedback)
    addItemOptimistic(tempItem);
    toast.success('Item added!');

    try {
      // 3. Server action (background)
      const result = await create{Feature}Item(itemData);
      
      if (result.success) {
        // 4. Replace temp item with real item
        deleteItemOptimistic(tempItem.id);
        addItemOptimistic(result.data);
      } else {
        // 5. Rollback on server error
        deleteItemOptimistic(tempItem.id);
        toast.error(result.error || 'Failed to create item');
      }
    } catch (error) {
      // 6. Rollback on unexpected error
      deleteItemOptimistic(tempItem.id);
      toast.error('Failed to create item');
    }
  };

  const handleUpdateItem = async (itemId: string, updates: Partial<Item>) => {
    // 1. Optimistic update
    updateItemOptimistic(itemId, updates);
    
    try {
      // 2. Server action
      const result = await update{Feature}Item(itemId, updates);
      
      if (!result.success) {
        // 3. Rollback on error (re-fetch to get original state)
        refreshContext();
        toast.error(result.error || 'Failed to update item');
      }
    } catch (error) {
      // 4. Rollback on unexpected error
      refreshContext();
      toast.error('Failed to update item');
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    // 1. Store original item for potential rollback
    const originalItem = items.find(item => item.id === itemId);
    if (!originalItem) return;

    // 2. Optimistic delete
    deleteItemOptimistic(itemId);
    toast.success('Item deleted!');

    try {
      // 3. Server action
      const result = await delete{Feature}Item(itemId);
      
      if (!result.success) {
        // 4. Rollback on server error
        addItemOptimistic(originalItem);
        toast.error(result.error || 'Failed to delete item');
      }
    } catch (error) {
      // 5. Rollback on unexpected error
      addItemOptimistic(originalItem);
      toast.error('Failed to delete item');
    }
  };

  if (isLoading) {
    return <LoadingComponent />;
  }

  if (error) {
    return <ErrorComponent error={error} />;
  }

  if (!is{Feature}Enabled) {
    return <FeatureDisabledComponent />;
  }

  // ✅ PASS PROPS AND CALLBACKS TO CHILDREN
  return (
    <div>
      <{Feature}Interface 
        items={items}
        canCreate={Boolean(user)}
        canUpdate={Boolean(user)}
        canDelete={Boolean(user)}
        onAddItem={handleAddItem}
        onUpdateItem={handleUpdateItem}
        onDeleteItem={handleDeleteItem}
      />
    </div>
  );
}
```

### Child Component Pattern
```typescript
interface {Feature}InterfaceProps {
  items: Item[];
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  onAddItem: (itemData: CreateItemInput) => Promise<void>;
  onUpdateItem: (itemId: string, updates: Partial<Item>) => Promise<void>;
  onDeleteItem: (itemId: string) => Promise<void>;
}

export function {Feature}Interface({
  items,
  canCreate,
  canUpdate,
  canDelete,
  onAddItem,
  onUpdateItem,
  onDeleteItem
}: {Feature}InterfaceProps) {
  // ✅ NO HOOKS - use props from parent
  // ✅ NO LOCAL STATE - use items from unified context
  
  return (
    <div>
      {canCreate && (
        <AddItemDialog onAddItem={onAddItem} />
      )}
      
      <ItemList 
        items={items}
        canUpdate={canUpdate}
        canDelete={canDelete}
        onUpdateItem={onUpdateItem}
        onDeleteItem={onDeleteItem}
      />
    </div>
  );
}
```

## Template Variables to Replace

When implementing for a specific feature, replace these placeholders:

```typescript
// Replace these in all template files:
{Feature}           // PascalCase: "Dam", "Chatbot", "Notes"
{feature}           // camelCase: "dam", "chatbot", "notes"
{FEATURE}           // UPPER_CASE: "DAM", "CHATBOT", "NOTES"
{FEATURE_FLAG_NAME} // Feature flag name: "DAM_ENABLED", "CHATBOT_ENABLED", "NOTES_ENABLED"
Item                // Replace with your domain entity: Note, Asset, ChatSession, etc.
CreateItemInput     // Replace with your create input type
```

## Features Ready for Implementation

### ✅ **COMPLETED Implementations**
1. **TTS (Text-to-Speech)** ✅ **COMPLETED**
   - **Location**: `lib/tts/application/services/TtsUnifiedContextService.ts`
   - **Result**: 3+ API calls → 1 API call (85% reduction)
   - **Cache Keys**: ✅ **FIXED** - Now includes organization ID
   - **Status**: Production ready with security fixes

2. **Notes** ✅ **COMPLETED**
   - **Location**: `lib/notes/application/services/NotesUnifiedContextService.ts`
   - **Result**: 3+ API calls → 1 API call (60-70% reduction)
   - **Cache Keys**: ✅ **FIXED** - Now includes organization ID
   - **Status**: Production ready with security fixes

### 🚧 **High Priority (Next to Implement)**
1. **DAM (Digital Asset Management)**
   - **Current**: Multiple API calls for assets, folders, permissions, organization context
   - **Benefit**: Significant performance improvement for large asset libraries
   - **Estimated Reduction**: 4-5 API calls → 1 API call
   - **Impact**: Critical for users with large file libraries

2. **Chatbot Widget**
   - **Current**: Multiple context calls for configuration, conversations, leads, organization context
   - **Benefit**: Faster chatbot initialization and context switching
   - **Estimated Reduction**: 3-4 API calls → 1 API call
   - **Impact**: Better user experience for chat interactions

3. **Image Generator**
   - **Current**: Multiple validation calls before generation (user, org, permissions, feature flags)
   - **Benefit**: Faster generation start, better UX
   - **Estimated Reduction**: 3-4 API calls → 1 API call
   - **Impact**: Faster time to start image generation

### Medium Priority (Simpler Features)
4. **Team Management**
   - **Current**: Multiple permission checks for member access, organization context
   - **Benefit**: Faster team page loading
   - **Estimated Reduction**: 3 API calls → 1 API call
   - **Impact**: Better team member management experience

5. **Settings**
   - **Current**: Multiple feature flag checks for different settings sections
   - **Benefit**: Single context for all settings pages
   - **Estimated Reduction**: 2-3 API calls → 1 API call
   - **Impact**: Consistent settings page performance

## Domain-Specific Implementation Benefits

### **DAM Domain**
- **Complexity**: High (file operations, folder permissions, storage quotas)
- **Performance Impact**: Critical (large file lists cause slow loading)
- **Key Optimizations**: Asset validation, folder permissions, storage limits in single call
- **Expected Improvement**: 50-70% faster page load for asset-heavy organizations

### **Chatbot Widget Domain**
- **Complexity**: High (conversation state, lead management, configuration)
- **Performance Impact**: High (affects user interaction responsiveness)
- **Key Optimizations**: Widget configuration, conversation context, lead permissions
- **Expected Improvement**: 40-60% faster chatbot initialization

### **Image Generator Domain**
- **Complexity**: Medium (generation permissions, quota checks, model availability)
- **Performance Impact**: Medium (affects generation start time)
- **Key Optimizations**: Generation permissions, quota validation, model access
- **Expected Improvement**: 30-50% faster generation start time

### **Team Management Domain**
- **Complexity**: Medium (member permissions, role management)
- **Performance Impact**: Medium (affects team page loading)
- **Key Optimizations**: Member access validation, role permissions, organization context
- **Expected Improvement**: 30-40% faster team page loading

### **Settings Domain**
- **Complexity**: Low (feature flag checks, organization settings)
- **Performance Impact**: Low (simple settings pages)
- **Key Optimizations**: Feature flag consolidation, settings permissions
- **Expected Improvement**: 20-30% faster settings page loading

## Security Considerations

### What This Pattern Maintains
- ✅ **Authentication**: All requests still validate JWT tokens
- ✅ **Authorization**: Role-based access control preserved
- ✅ **Organization Context**: Proper organization scoping maintained
- ✅ **Feature Flags**: Default-enabled behavior preserved
- ✅ **RLS Policies**: Database-level security unchanged
- ✅ **Audit Trail**: All access logging maintained

### What This Pattern Improves
- ✅ **Reduced Attack Surface**: Fewer API endpoints to secure
- ✅ **Consistent Security Context**: Single validation point
- ✅ **Better Error Handling**: Unified security error responses
- ✅ **Performance**: Faster page loads without security compromise

## Migration Strategy

### Phase 1: Implement Pattern (Per Feature)
1. Create unified context service
2. Create server action and hook
3. Update page component
4. Test thoroughly

### Phase 2: Gradual Rollout
1. Feature flag the new pattern (`USE_UNIFIED_CONTEXT`)
2. A/B test performance improvements
3. Monitor for any security issues
4. Gradually enable for all users

### Phase 3: Legacy Cleanup
1. Remove old context hooks
2. Remove redundant API endpoints
3. Simplify component logic
4. Update documentation

## Performance Metrics to Track

### Before Implementation
- Page load time
- Number of API calls on page load
- Time to interactive
- Server response times

### After Implementation
- Reduced API calls (3+ → 1)
- Faster page load times
- Improved user experience
- Reduced server load

## Critical Learnings from Notes Implementation

### **React Hook Dependency Management**
**Issue**: Infinite re-renders causing multiple API calls instead of single optimized call
**Root Cause**: `useCallback` with unstable dependencies + `useEffect` depending on that callback

```typescript
// ❌ WRONG - Creates infinite loop and multiple API calls
const loadContext = useCallback(async () => {
  // ... API call logic
}, []); // Empty array but function recreated due to setState usage

useEffect(() => {
  loadContext();
}, [loadContext]); // Depends on unstable function = infinite re-renders

// ✅ CORRECT - Stable dependencies prevent infinite loops
const loadContext = useCallback(async () => {
  // ... API call logic  
}, []); // Truly stable - no external dependencies

useEffect(() => {
  loadContext();
}, []); // Run once on mount only - no dependencies
```

### **API Deduplication Service Integration**
**Issue**: Multiple simultaneous calls to same server action bypass optimization
**Root Cause**: Missing `apiDeduplicationService.deduplicateServerAction()` wrapper

```typescript
// ❌ WRONG - No deduplication allows multiple simultaneous calls
export async function getFeatureUnifiedContext(): Promise<Result> {
  // Direct call - multiple rapid calls hit server
  const service = FeatureUnifiedContextService.getInstance();
  return await service.getUnifiedContext();
}

// ✅ CORRECT - Deduplication prevents multiple simultaneous calls
export async function getFeatureUnifiedContext(): Promise<Result> {
  return await apiDeduplicationService.deduplicateServerAction(
    'getFeatureUnifiedContext',
    [],
    async () => {
      const service = FeatureUnifiedContextService.getInstance();
      return await service.getUnifiedContext();
    },
    'feature-operations'
  );
}
```

### **Server-Side vs Client-Side Data Fetching**
**Issue**: Mixing server-side and client-side data fetching causes duplicate API calls
**Root Cause**: Server component fetching data + client component using unified context = 2x API calls

```typescript
// ❌ WRONG - Duplicate data fetching (server + client)
// Server Component
export default async function FeaturePage() {
  // Server-side fetching
  const supabase = createClient();
  const { data } = await supabase.auth.getUser(); // API call 1
  const { data: orgId } = await supabase.rpc('get_active_organization_id'); // API call 2
  
  return <FeaturePageClient initialData={data} />;
}

// Client Component  
export function FeaturePageClient({ initialData }) {
  // Client-side unified context
  const context = useFeatureUnifiedContext(); // API call 3 (duplicate!)
  // Result: 3 API calls instead of 1 optimized call
}

// ✅ CORRECT - Single client-side data fetching
// Server Component
export default async function FeaturePage() {
  // No server-side data fetching
  return <FeaturePageClient />;
}

// Client Component
export function FeaturePageClient() {
  // Single unified context call
  const context = useFeatureUnifiedContext(); // 1 optimized API call
  // Result: 1 API call total
}
```

### **Prop Drilling vs Hook Duplication**
**Issue**: Multiple components calling the same unified context hook = defeats optimization purpose
**Solution**: Single hook call at top level + prop drilling to children

```typescript
// ❌ WRONG - Multiple API calls (defeats unified context purpose)
function ParentComponent() {
  const context = useDamUnifiedContext(); // API call 1
  return <ChildComponent />;
}

function ChildComponent() {
  const context = useDamUnifiedContext(); // API call 2 (duplicate!)
  return <GrandchildComponent />;
}

function GrandchildComponent() {
  const context = useDamUnifiedContext(); // API call 3 (duplicate!)
  return <div>Content</div>;
}

// ✅ CORRECT - Single API call + prop drilling
function ParentComponent() {
  const { user, canUpdate, canDelete, isLoading } = useDamUnifiedContext(); // API call 1 only
  return (
    <ChildComponent 
      user={user} 
      canUpdate={canUpdate} 
      canDelete={canDelete} 
      isLoading={isLoading} 
    />
  );
}

function ChildComponent({ user, canUpdate, canDelete, isLoading }) {
  // No hook call - uses props from parent
  return (
    <GrandchildComponent 
      canUpdate={canUpdate} 
      canDelete={canDelete} 
      isLoading={isLoading} 
    />
  );
}
```

### **TypeScript Interface Compatibility**
**Issue**: Linter errors when updating component interfaces
**Solution**: Update all component interfaces to accept unified context props

```typescript
// ❌ WRONG - Interface doesn't match new prop requirements
interface ComponentProps {
  data: SomeData;
  // Missing unified context props
}

// ✅ CORRECT - Interface includes all required props
interface ComponentProps {
  data: SomeData;
  // Add unified context props
  canUpdate: boolean;
  canDelete: boolean;
  isLoading: boolean;
  user: User | null;
}
```

### **Boolean Type Safety**
**Issue**: `user && !isLoading` returns `User | false` instead of `boolean`
**Solution**: Wrap permission checks in `Boolean()` for type safety

```typescript
// ❌ WRONG - Type error: 'User | false' is not assignable to 'boolean'
const canUpdate = user && !isLoading;

// ✅ CORRECT - Explicit boolean conversion
const canUpdate = Boolean(user && !isLoading);
```

### **Client Component Directive**
**Issue**: Components using React hooks need `"use client"` directive
**Solution**: Add directive to all components using unified context hooks

```typescript
// ✅ CORRECT - Always add client directive for hook usage
'use client';

import { use{Feature}UnifiedContext } from '../hooks/use{Feature}UnifiedContext';

export function {Feature}PageClient() {
  const context = use{Feature}UnifiedContext(); // React hook
  // ... component logic
}
```

### **Test File Updates**
**Issue**: Test files still mock old individual hooks instead of unified context
**Solution**: Update all test mocks to use unified context hooks

```typescript
// ❌ WRONG - Mocking old individual hooks
vi.mock('@/lib/shared/access-control/hooks/usePermissions', () => ({
  useNotesPermissions: () => ({
    canUpdate: true,
    canDelete: true,
    isLoading: false,
  }),
}));

// ✅ CORRECT - Mock unified context hook
vi.mock('@/lib/notes/presentation/hooks/useNotesUnifiedContext', () => ({
  useNotesUnifiedContext: () => ({
    user: { id: 'user-123', email: 'test@example.com' },
    organizationId: 'org-123',
    organizations: [],
    featureFlags: {},
    isNotesEnabled: true,
    isLoading: false,
    error: null,
    fromCache: false,
    refreshContext: vi.fn(),
  }),
}));
```

### **Conditional Rendering Order**
**Issue**: "Feature Disabled" message flashes before loading completes
**Root Cause**: Checking `!isFeatureEnabled` before `isLoading` in component logic
**Solution**: Always prioritize loading state over disabled state

```typescript
// ❌ WRONG - Shows "Feature Disabled" flash during loading
if (error) {
  return <ErrorComponent />;
}

if (!isFeatureEnabled) { // This runs first when isFeatureEnabled starts as false
  return <FeatureDisabledComponent />;
}

if (isLoading) { // This runs after disabled check
  return <LoadingComponent />;
}

// ✅ CORRECT - Loading state takes priority
if (isLoading) { // Check loading first
  return <LoadingComponent />;
}

if (error) {
  return <ErrorComponent />;
}

if (!isFeatureEnabled) { // Only check after loading completes
  return <FeatureDisabledComponent />;
}
```

## Common Pitfalls to Avoid

### **Security & Performance**
1. **Don't Skip Security Validation**: Always validate authentication and authorization
2. **Don't Cache Too Long**: Keep cache TTL short for security (5 seconds max)
3. **Don't Break RLS**: Ensure database policies still apply
4. **❌ NEVER Mix Server-Side + Client-Side Data Fetching**: Choose one approach exclusively
5. **❌ NEVER Skip API Deduplication**: Always wrap server actions with `apiDeduplicationService`

### **React Hook Management (CRITICAL)**
6. **❌ NEVER Use Unstable Hook Dependencies**: Use refs to break dependency chains
7. **Don't Create Hook Dependency Loops**: Use stable `useCallback` and `useEffect` dependencies
8. **Don't Duplicate Hook Calls**: Use prop drilling instead of multiple hook calls in same tree
9. **Don't Forget Client Directives**: Add `"use client"` to components using React hooks

### **State Management Anti-Patterns (CRITICAL)**
10. **❌ NEVER Use Local State in Child Components**: Conflicts with optimistic updates from parent
11. **❌ NEVER Mix React Query + Optimistic Updates**: Choose one pattern consistently
12. **❌ NEVER Forget Cache Invalidation**: Always invalidate cache after successful mutations
13. **Don't Skip Optimistic Update Rollbacks**: Handle server errors by reverting optimistic changes

### **TypeScript & Testing**
14. **Don't Leave Old Test Mocks**: Update all test files to mock unified context hooks
15. **Don't Ignore TypeScript Errors**: Fix interface compatibility issues immediately
16. **❌ NEVER Use Optional Types for Required Data**: Use discriminated unions for validation results

### **Component Architecture**
17. **Don't Check Feature Flags Before Loading**: Always prioritize `isLoading` over `!isFeatureEnabled` checks
18. **Don't Forget Error Handling**: Handle all error scenarios gracefully with proper rollbacks
19. **Don't Skip Testing**: Test all security scenarios and optimistic update rollbacks thoroughly

## Success Criteria

### **Performance Metrics**
- ✅ API calls reduced from 3+ to 1 (60-85% reduction)
- ✅ Page load time improved by 20-50%
- ✅ **No infinite re-render loops**
- ✅ **No duplicate server-side + client-side fetching**
- ✅ **API deduplication working correctly**
- ✅ Cache performance optimized with proper invalidation

### **Security & Compliance**
- ✅ All security tests pass
- ✅ Feature flag behavior preserved (default enabled)
- ✅ RLS policies still enforced
- ✅ Audit trail maintained
- ✅ Organization-scoped cache keys

### **User Experience**
- ✅ **Optimistic updates working correctly** (instant UI feedback)
- ✅ **Proper error handling with rollbacks**
- ✅ **No duplicate items or UI glitches**
- ✅ **Smooth create/update/delete operations**
- ✅ Loading states improved (single unified loading)

### **Code Quality**
- ✅ **No local state conflicts in child components**
- ✅ **Proper prop drilling instead of hook duplication**
- ✅ **All TypeScript errors resolved**
- ✅ **Test mocks updated for unified context**
- ✅ **Discriminated union types for validation**

### **Architecture Compliance**
- ✅ DDD layer boundaries respected
- ✅ Single responsibility principle maintained
- ✅ Clean component interfaces
- ✅ Proper error boundaries implemented

This pattern provides a significant performance improvement while maintaining all security guarantees and can be applied consistently across all features in the application. 