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

### 2. Proper Response to "Unused Variable" Warnings

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
  
  // Security validation
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

LINT FIX PRIORITY:
1. React Hooks violations (breaks functionality)
2. Missing displayName for memoized components (debugging issues)
3. Unused variables (but check if security-critical first)
4. Type safety issues ('any' types)
5. React best practices (escaped entities, dependencies)

SECURITY PATTERN:
- Use useOrganizationContext() hook for active organization
- Validate activeOrganizationId matches server-provided organizationId
- Show security error UI if context mismatch
- All hooks called before any conditional returns

Please analyze each "unused variable" carefully - if it's organization/security related, implement proper validation instead of removal.
```

## 🔒 Security Patterns

### Organization Context Validation Pattern

```typescript
/**
 * Secure Component with Organization Context Validation
 * 
 * AI INSTRUCTIONS:
 * - Uses organization context hook for automatic organization scoping
 * - SECURITY: All operations automatically scoped to active organization
 * - ALL HOOKS MUST BE CALLED BEFORE ANY CONDITIONAL RETURNS (React rules)
 */

interface SecureComponentProps {
  organizationId: string; // Server-side validation ensures access
}

export function SecureComponent({ organizationId }: SecureComponentProps) {
  // CRITICAL: ALL HOOKS MUST BE CALLED FIRST - React's Rules of Hooks
  // SECURITY: Get active organization context for all operations
  const { activeOrganizationId } = useOrganizationContext();
  
  // Other hooks here...
  const [state, setState] = useState();
  const { data } = useQuery();
  
  // SECURITY VALIDATION: After all hooks are called, validate organization context
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
      {/* Component content */}
    </div>
  );
}
```

### Multi-Layer Security Validation

```typescript
// 1. Server-side validation (Page level): Ensures user has access to organization
// 2. Client-side context validation (Component level): Validates active organization matches  
// 3. Automatic scoping (Hook level): All operations use active organization context

export async function getServerSideProps(context) {
  // Server-side: Verify user has access to organization
  const organizationId = await validateOrganizationAccess(context);
  return { props: { organizationId } };
}

export function PageComponent({ organizationId }) {
  // Client-side: Validate context matches server validation
  const { activeOrganizationId } = useOrganizationContext();
  
  if (activeOrganizationId !== organizationId) {
    return <SecurityErrorUI />;
  }
  
  // All operations automatically scoped to active organization
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
  return <div>Unsecured content</div>;
}

// ✅ DO: Use organization context for validation
export function GoodComponent({ organizationId }: Props) {
  const { activeOrganizationId } = useOrganizationContext();
  
  if (activeOrganizationId !== organizationId) {
    return <SecurityErrorUI />;
  }
  
  return <div>Secured content</div>;
}
```

### 2. Conditional Hook Calls
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

### 3. Ignoring Type Safety in Security Areas
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

### Safe Variables to Remove (if truly unused)
- UI state variables (`isOpen`, `isVisible`, `isLoading`)
- Temporary calculation variables
- Debug/logging variables
- Non-functional props (styling, labels)

## 📚 Reference Links

- [Organization ID Enforcement Task List](../permissions/org-id-enforcement-task-list.md)
- [Comprehensive Security Design](../permissions/comprehensive-security-design.md)
- [Golden Rule DDD Guidelines](../../@golden-rule.mdc)

## 🎯 Quick Checklist

Before fixing any "unused variable" warning:

- [ ] Is this variable organization/auth/permission related?
- [ ] Does removing it create a security vulnerability?
- [ ] Should I implement validation instead of removal?
- [ ] Are all hooks called before conditional returns?
- [ ] Does the fix maintain defense-in-depth security?

**Remember:** It's better to have a lint warning than a security vulnerability! 