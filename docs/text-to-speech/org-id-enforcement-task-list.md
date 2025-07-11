# Organization ID Enforcement Task List

This checklist ensures that `organization_id` is always present (never null) across the entire application, enforcing strict multi-tenant data isolation and security.

## Database Layer
- [ ] **All tables have `organization_id UUID NOT NULL`**
    - [ ] Review all tenant-scoped tables (e.g., notes, assets, folders, etc.)
    - [ ] Add `NOT NULL` constraints where missing
    - [ ] Add foreign key constraints to `organizations(id)`
- [ ] **No orphaned data**
    - [ ] Check for existing rows with null `organization_id`
    - [ ] Write migration scripts to fix or remove orphaned data
- [ ] **RLS policies always use `organization_id = get_active_organization_id()`**
    - [ ] Review all RLS policies for correct org scoping
    - [ ] Add/modify policies to enforce org context
- [ ] **Prevent null inserts**
    - [ ] Add `WITH CHECK (organization_id IS NOT NULL)` to insert policies

## Application Layer
- [ ] **TypeScript types require organization context**
    - [ ] Update DTOs and domain entities to require `organizationId: string`
    - [ ] Remove optional/null org ID fields
- [ ] **All server actions require organization context**
    - [ ] Refactor server actions to call `checkOrganizationAccess` or similar
    - [ ] Throw clear error if org context is missing
- [ ] **React hooks/components always use org context**
    - [ ] Update hooks to require/use `organizationId`
    - [ ] Ensure queries/mutations are always org-scoped

## Authentication & JWT
- [ ] **JWT always contains `active_organization_id` in custom claims**
    - [ ] Review edge function for org context injection
    - [ ] Ensure org switching updates JWT
- [ ] **Require org context on login and org switch**
    - [ ] Prevent access to protected areas without org context

## Super Admin & Edge Cases
- [ ] **Super admin actions require explicit org context**
    - [ ] No implicit cross-org actions
    - [ ] All admin actions specify target org
- [ ] **Error handling for missing org context**
    - [ ] User-friendly error messages when org context is missing
    - [ ] Logging for org context errors

## Testing & Validation
- [ ] **Automated tests for org context enforcement**
    - [ ] Unit tests for server actions and RLS policies
    - [ ] Integration tests for org switching and access control
- [ ] **Manual QA for edge cases**
    - [ ] Test login, org switching, and feature access with/without org context
    - [ ] Attempt to create/access data without org context (should fail)

---

**Result:**
- All data and actions are always scoped to a valid organization
- No data can exist or be accessed without a valid `organization_id`
- Multi-tenant security and data isolation are guaranteed 