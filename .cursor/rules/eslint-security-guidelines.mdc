# ESLint Security Guidelines

## Overview

This document provides guidelines for fixing ESLint errors while maintaining application security. Based on real-world experience with security-critical variables being incorrectly removed during lint fixes.

## 🚨 Critical Security Rules

### 1. Organization Context Variables Are Security-Critical

**NEVER remove these variables even if ESLint reports "unused":**
- `organizationId`
- `activeOrganizationId` 
- `currentOrganizationId`
- Any organization/auth/permission related variables

**Why?** These variables enforce multi-tenant data isolation and prevent privilege escalation.

### 2. Organization ID Architecture (Pure JWT-Based)

**Single Source of Truth: JWT Custom Claims**
- Organization ID is stored in JWT `custom_claims.active_organization_id`
- Set via Edge Function `set-active-org-claim` during login/organization switching
- Database function `get_active_organization_id()` extracts directly from JWT
- All RLS policies automatically scope queries to active organization from JWT
- Server-side validation ensures user has access before setting organizationId props

**No Database Fallback Required:**
- JWT custom claims provide the authoritative organization context
- RLS policies enforce organization scoping at the database level
- React hooks provide client-side access to organization context for UI validation

### 3. Proper Response to "Unused Variable" Warnings

#### ❌ WRONG Approach
```typescript
// ESLint: 'organizationId' is defined but never used
export function MyComponent({ organizationId }: Props) {
  // WRONG: Remove the variable to fix lint warning
  return <div>Content</div>;
}
```

#### ✅ CORRECT Approach
```typescript
// ESLint: 'organizationId' is defined but never used
export function MyComponent({ organizationId }: Props) {
  // CORRECT: Use organization context for validation
  const { activeOrganizationId } = useOrganizationContext();
  
  // Security validation - verify client context matches server validation
  if (activeOrganizationId !== organizationId) {
    return <SecurityErrorUI />;
  }
  
  return <div>Content</div>;
}
```

## 🎯 Optimal Lint Fix Prompt

Use this prompt when requesting ESLint fixes:

```
Please fix Priority 1 critical ESLint errors following these security guidelines:

CRITICAL SECURITY RULES:
1. NEVER remove organization-related variables (organizationId, activeOrganizationId, etc.) - these are security-critical
2. If ESLint says "unused variable" for organization context, USE the variable for validation, don't remove it
3. Follow @golden-rule.mdc patterns for proper error handling and component structure
4. Maintain React's Rules of Hooks - all hooks must be called before any conditional returns

ARCHITECTURE CONTEXT:
- Organization ID comes from JWT custom claims (single source of truth)
- Set via Edge Function during login/organization switching
- RLS policies automatically scope all database queries via JWT
- Server-side validation ensures user has access before setting organizationId props
- Client-side hooks provide additional UI validation layer

LINT FIX PRIORITY:
1. React Hooks violations (breaks functionality)
2. Missing displayName for memoized components (debugging issues)
3. Unused variables (but check if security-critical first)
4. Type safety issues ('any' types)
5. React best practices (escaped entities, dependencies)

UNIFIED CONTEXT DETECTION:
- Check if parent component uses useXXXUnifiedContext() pattern
- If YES: Child components should use underscore prefix for organizationId
- If NO: Child components should use useOrganizationContext() validation
- Never add redundant context calls to children in unified context architecture

SECURITY PATTERN:
- In unified context: Trust parent validation, use underscore prefix
- In standard context: Use useOrganizationContext() hook for validation
- Validate activeOrganizationId matches server-provided organizationId
- Show security error UI if context mismatch
- All hooks called before any conditional returns

Please analyze each "unused variable" carefully - if it's organization/security related, implement proper validation instead of removal. Check for unified context patterns to avoid performance regressions.
```

## 🔒 Security Patterns

### Organization Context Validation Pattern

```typescript
/**
 * Secure Component with Organization Context Validation
 * 
 * AI INSTRUCTIONS:
 * - organizationId prop comes from server-side validation (JWT-based)
 * - Server already verified user has access to this organization
 * - Client-side hook provides additional validation layer
 * - ALL HOOKS MUST BE CALLED BEFORE ANY CONDITIONAL RETURNS (React rules)
 */

interface SecureComponentProps {
  organizationId: string; // Server-side validation ensures access (from JWT)
}

export function SecureComponent({ organizationId }: SecureComponentProps) {
  // CRITICAL: ALL HOOKS MUST BE CALLED FIRST - React's Rules of Hooks
  // SECURITY: Get client-side organization context for validation
  const { activeOrganizationId } = useOrganizationContext();
  
  // Other hooks here...
  const [state, setState] = useState();
  const { data } = useQuery();
  
  // SECURITY VALIDATION: Verify client context matches server validation
  // This prevents organization context drift and ensures data integrity
  if (activeOrganizationId !== organizationId) {
    return (
      <div className="container mx-auto p-4">
        <div className="text-center py-8">
          <h2 className="text-xl font-semibold text-red-600 mb-2">Organization Context Mismatch</h2>
          <p className="text-gray-600">Please refresh the page or switch to the correct organization.</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Component content - all operations automatically scoped to organization */}
    </div>
  );
}
```

### Multi-Layer Security Validation

```typescript
// Layer 1: JWT Claims (Database Level)
// - get_active_organization_id() extracts from JWT custom claims
// - RLS policies automatically scope all queries
// - Enforced at database level for all operations

// Layer 2: Server-side Validation (Application Level)
// - Server actions verify user has access to organization
// - organizationId props are pre-validated before reaching components

// Layer 3: Client-side Context Validation (Presentation Level)
// - React hooks provide additional validation layer
// - Prevents organization context drift in UI

export async function getServerSideProps(context) {
  // Server-side: organizationId already validated via JWT and RLS
  // User can only access data they have permission to see
  const organizationId = await getActiveOrganizationId(); // From JWT
  return { props: { organizationId } };
}

export function PageComponent({ organizationId }) {
  // Client-side: Additional validation layer
  const { activeOrganizationId } = useOrganizationContext();
  
  // Defense in depth - verify client context matches server validation
  if (activeOrganizationId !== organizationId) {
    return <SecurityErrorUI />;
  }
  
  // All operations automatically scoped to organization via RLS
  return <FeatureComponent />;
}
```

## 📋 Lint Fix Priority Order

### Priority 1: Critical Issues (Errors)
1. **React Hooks Rules Violations** - Breaks React's fundamental rules
2. **Security Variable Removal** - Creates security vulnerabilities
3. **Missing Display Names** - Breaks debugging for memoized components
4. **Critical Type Safety** - `any` types in security-sensitive areas

### Priority 2: Important Issues
1. **Unused Variables** (non-security)
2. **React Best Practices** - Hook dependencies, escaped entities
3. **Type Safety** - General `any` type replacements
4. **Import Cleanup** - Unused imports

### Priority 3: Optimization Issues
1. **Next.js Optimizations** - Image components, module assignments
2. **Performance** - Unnecessary re-renders, missing memoization
3. **Code Style** - Consistent formatting, naming conventions

## 🚫 Common Anti-Patterns to Avoid

### 1. Removing Security-Critical Variables
```typescript
// ❌ DON'T: Remove organization context
export function BadComponent() {
  // organizationId was removed to fix "unused variable" warning
  // This breaks multi-tenant security!
  return <div>Unsecured content</div>;
}

// ✅ DO: Use organization context for validation
export function GoodComponent({ organizationId }: Props) {
  const { activeOrganizationId } = useOrganizationContext();
  
  // Validate client context matches server validation
  if (activeOrganizationId !== organizationId) {
    return <SecurityErrorUI />;
  }
  
  return <div>Secured content</div>;
}
```

### 2. Redundant Context Calls in Unified Context Architecture
```typescript
// ❌ DON'T: Add context hooks to child components in unified context pattern
export function BadNotesPage() {
  // Parent uses unified context (1 API call)
  const { organizationId, notes, user } = useNotesUnifiedContext();
  
  return (
    <div>
      <NoteList organizationId={organizationId} notes={notes} />
      <AddNoteDialog organizationId={organizationId} />
    </div>
  );
}

export function BadNoteList({ organizationId, notes }: Props) {
  // ❌ WRONG: Redundant context call creates performance regression
  const { activeOrganizationId } = useOrganizationContext(); // Extra API call!
  
  if (activeOrganizationId !== organizationId) {
    return <SecurityErrorUI />;
  }
  
  return <div>{notes.map(note => <Note key={note.id} {...note} />)}</div>;
}

// ✅ DO: Use underscore prefix for unused organizationId in unified context
export function GoodNotesPage() {
  // Parent uses unified context (1 API call total)
  const { organizationId, notes, user } = useNotesUnifiedContext();
  
  return (
    <div>
      <NoteList organizationId={organizationId} notes={notes} />
      <AddNoteDialog organizationId={organizationId} />
    </div>
  );
}

export function GoodNoteList({ organizationId: _organizationId, notes }: Props) {
  // ✅ CORRECT: Trust parent's unified context validation
  // ✅ Use underscore prefix to satisfy ESLint without extra API calls
  // Parent already validated organization context via unified context
  
  return <div>{notes.map(note => <Note key={note.id} {...note} />)}</div>;
}
```

**Why This Matters:**
- Unified context patterns consolidate multiple API calls into one
- Adding `useOrganizationContext()` to child components creates duplicate API calls
- Performance regression: 1 API call → 3+ API calls
- Violates the unified context architecture principle
- Parent already validates organization context for all children

**Detection Pattern:**
- Look for `useXXXUnifiedContext()` in parent components
- Check if child components also call `useOrganizationContext()`
- If yes, remove redundant calls and use underscore prefix for organizationId

### 3. Conditional Hook Calls
```typescript
// ❌ DON'T: Call hooks conditionally
export function BadComponent({ organizationId }: Props) {
  const { activeOrganizationId } = useOrganizationContext();
  
  if (activeOrganizationId !== organizationId) {
    return <SecurityErrorUI />;
  }
  
  // WRONG: Hook called after conditional return
  const [state, setState] = useState();
}

// ✅ DO: Call all hooks first
export function GoodComponent({ organizationId }: Props) {
  // All hooks called first
  const { activeOrganizationId } = useOrganizationContext();
  const [state, setState] = useState();
  
  // Validation after all hooks
  if (activeOrganizationId !== organizationId) {
    return <SecurityErrorUI />;
  }
}
```

### 3. Hooks in Loops/Callbacks (React Rules Violation)
```typescript
// ❌ DON'T: Call hooks inside loops, callbacks, or conditional logic
export function BadNavigation({ items }: { items: NavItem[] }) {
  return (
    <div>
      {items.filter(item => {
        // WRONG: Hook called inside filter callback
        const isEnabled = useFeatureFlag(item.featureFlag);
        return isEnabled;
      }).map(item => (
        <NavItem key={item.id} {...item} />
      ))}
    </div>
  );
}

// ✅ DO: Pre-compute all hook calls at top level
export function GoodNavigation({ items }: { items: NavItem[] }) {
  // ALL HOOKS CALLED FIRST - React's Rules of Hooks
  const { organization } = useOrganization();
  
  // Pre-compute all feature flags in a single hook call
  const featureFlags = useMemo(() => {
    const flags: Record<string, boolean> = {};
    const uniqueFlags = [...new Set(items.map(item => item.featureFlag).filter(Boolean))];
    
    uniqueFlags.forEach(flag => {
      flags[flag] = organization?.feature_flags?.[flag]?.enabled ?? true;
    });
    
    return flags;
  }, [items, organization?.feature_flags]);
  
  // Filter using pre-computed values
  const filteredItems = useMemo(() => 
    items.filter(item => 
      !item.featureFlag || featureFlags[item.featureFlag]
    ), [items, featureFlags]
  );
  
  return (
    <div>
      {filteredItems.map(item => (
        <NavItem key={item.id} {...item} />
      ))}
    </div>
  );
}
```

### 4. Ignoring Type Safety in Security Areas
```typescript
// ❌ DON'T: Use 'any' for security-sensitive data
function badSecurityCheck(user: any, permissions: any) {
  return user.role === 'admin'; // No type safety
}

// ✅ DO: Use proper types for security
interface User {
  id: string;
  role: UserRole;
  organizationId: string;
}

interface Permission {
  action: string;
  resource: string;
  organizationId: string;
}

function goodSecurityCheck(user: User, permissions: Permission[]) {
  return permissions.some(p => 
    p.organizationId === user.organizationId && 
    p.action === 'read'
  );
}
```

## 🔍 Security-Critical Variable Detection

### Variables That Should NEVER Be Removed
- `organizationId` / `activeOrganizationId` / `currentOrganizationId`
- `userId` / `currentUserId` / `activeUserId`
- `permissions` / `userPermissions` / `rolePermissions`
- `accessToken` / `authToken` / `sessionToken`
- `role` / `userRole` / `currentRole`
- Any variable ending in `Context`, `Auth`, `Permission`, `Access`

### Unified Context Pattern Detection
**Before adding organization context validation, check:**

1. **Look for unified context in parent components:**
   ```typescript
   // Unified context patterns to detect:
   const { organizationId, ... } = useNotesUnifiedContext();
   const { organizationId, ... } = useDamUnifiedContext();
   const { organizationId, ... } = useChatbotUnifiedContext();
   ```

2. **If unified context found in parent:**
   ```typescript
   // ✅ DO: Use underscore prefix in child components
   export function ChildComponent({ organizationId: _organizationId }: Props) {
     // No additional context calls needed
     return <div>Content</div>;
   }
   ```

3. **If NO unified context in parent:**
   ```typescript
   // ✅ DO: Add organization context validation
   export function ChildComponent({ organizationId }: Props) {
     const { activeOrganizationId } = useOrganizationContext();
     
     if (activeOrganizationId !== organizationId) {
       return <SecurityErrorUI />;
     }
     
     return <div>Content</div>;
   }
   ```

### Safe Variables to Remove (if truly unused)
- UI state variables (`isOpen`, `isVisible`, `isLoading`)
- Temporary calculation variables
- Debug/logging variables
- Non-functional props (styling, labels)

## 🏗️ Architecture Reference

### JWT-Based Organization ID Flow (Pure JWT Approach)
```
1. User Login/Org Switch → Edge Function (set-active-org-claim)
2. JWT Custom Claims → { active_organization_id: "org-uuid" }
3. Database Function → get_active_organization_id() extracts from JWT
4. RLS Policies → Automatically scope ALL queries via JWT
5. Server Actions → Pre-validated organizationId props
6. React Components → Client-side validation layer
```

### Database Functions (PostgreSQL)
```sql
-- Primary: Extract organization ID from JWT custom claims
CREATE OR REPLACE FUNCTION get_active_organization_id()
RETURNS uuid AS $$
  SELECT nullif(
    (current_setting('request.jwt.claims', true)::jsonb -> 'custom_claims') ->> 'active_organization_id', 
    ''
  )::uuid;
$$ LANGUAGE sql STABLE;

-- Validation: Verify user has access to organization
CREATE OR REPLACE FUNCTION user_has_org_access(org_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_organization_permissions 
    WHERE user_id = auth.uid() 
    AND organization_id = org_id 
    AND revoked_at IS NULL
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;
```

### Edge Function: Set Active Organization Claim
```typescript
// supabase/functions/set-active-org-claim/index.ts
export async function setActiveOrganizationClaim(organizationId: string) {
  // Validate user has access to organization
  const hasAccess = await validateUserOrganizationAccess(organizationId);
  if (!hasAccess) {
    throw new Error('User does not have access to organization');
  }

  // Set JWT custom claim
  const customClaims = {
    active_organization_id: organizationId
  };

  // Update user metadata with custom claims
  await supabase.auth.admin.updateUserById(userId, {
    app_metadata: { custom_claims: customClaims }
  });
}
```

## 📚 Reference Links

- [Organization ID Enforcement Task List](../permissions/org-id-enforcement-task-list.md)
- [Comprehensive Security Design](../permissions/comprehensive-security-design.md)
- [Golden Rule DDD Guidelines](../../@golden-rule.mdc)

## ⚙️ ESLint Configuration for Unified Context

Add this to your `eslint.config.js` to help detect unified context patterns:

```javascript
// Custom rule for unified context pattern detection
{
  files: ['**/*.tsx', '**/*.ts'],
  rules: {
    // Allow organizationId with underscore prefix in unified context
    '@typescript-eslint/no-unused-vars': [
      'error',
      {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        // Custom patterns for organization context
        argsIgnorePattern: '^(_|organizationId$)',
      }
    ],
  },
},

// Specific rules for components that might use unified context
{
  files: ['**/presentation/components/**/*.tsx', '**/components/**/*.tsx'],
  rules: {
    // More lenient for presentation layer components
    '@typescript-eslint/no-unused-vars': [
      'warn', // Warning instead of error for components
      {
        argsIgnorePattern: '^(_|organizationId$|activeOrganizationId$)',
        varsIgnorePattern: '^_',
      }
    ],
  },
},
```

## 🎯 Quick Checklist

Before fixing any "unused variable" warning:

- [ ] Is this variable organization/auth/permission related?
- [ ] Does the parent component use a unified context pattern?
- [ ] Does removing it create a security vulnerability?
- [ ] Should I implement validation instead of removal?
- [ ] Are all hooks called before conditional returns?
- [ ] Does the fix maintain defense-in-depth security?
- [ ] Will this create redundant API calls in unified context?

**Remember:** It's better to have a lint warning than a security vulnerability or performance regression!

## 🔄 Security Architecture Summary

**Pure JWT-Based Multi-Layer Defense:**
1. **JWT Layer** - Organization ID in custom claims (single source of truth)
2. **Database Layer** - RLS policies with automatic JWT-based scoping
3. **Application Layer** - Server-side validation using JWT context
4. **Presentation Layer** - Client-side context validation for UI consistency

**Key Principle:** Organization variables are security-critical because they enforce multi-tenant data isolation through JWT custom claims. The JWT provides the authoritative organization context that automatically scopes all database operations via RLS policies. Never remove these variables to fix lint warnings - implement proper validation instead. 