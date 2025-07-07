# DAM Multi-Tenancy Integration - Build Steps

This document outlines the specific steps to refactor and enhance the Digital Asset Management (DAM) system for full multi-tenancy support, ensuring data isolation and organization-specific functionality. This complements the main [multi-tenancy-build-steps.md](mdc:docs/multi-tenant/multi-tenancy-build-steps.md).

## Pre-requisites:

*   [X] Core multi-tenancy foundation is in place (Organizations, Memberships, RLS helper `get_active_organization_id()`).
*   [X] Users have an `active_organization_id` in their JWT claims.
*   [X] A server-side utility (e.g., `getActiveOrganizationId()`) exists to retrieve this ID.

## Phase 0: Service-Role Endpoint Hardening

**Step 0.1: Secure admin-reset-password Edge Function**
*   [X] After verifying the caller is an organization admin in their active org, fetch the target user's membership in that org before calling `resetPasswordForEmail`:
    ```ts
    const targetUserId = await supabaseAdmin.auth.admin.getUserByEmail(email)
      .then(res => res.data?.user?.id);
    const { data: targetMembership } = await supabaseAdmin
      .from('organization_memberships')
      .select()
      .eq('user_id', targetUserId)
      .eq('organization_id', activeOrgId)
      .single();
    if (!targetMembership) {
      return new Response(JSON.stringify({ error: 'Forbidden: target user not in organization' }), { status: 403, headers: corsHeaders });
    }
    ```
*   [X] Only then invoke `await supabaseAdmin.auth.resetPasswordForEmail(email, { redirectTo })`.

**Step 0.2: Secure admin-resend-invitation Edge Function**
*   [X] After verifying the caller is an organization admin, lookup the profile ID by email and verify membership:
    ```ts
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('email', email)
      .single();
    const { data: membership } = await supabaseAdmin
      .from('organization_memberships')
      .select()
      .eq('user_id', profile.id)
      .eq('organization_id', organizationId)
      .single();
    if (!membership) {
      return new Response(JSON.stringify({ error: 'Forbidden: target user not in organization' }), { status: 403, headers: corsHeaders });
    }
    ```

**Step 0.3: Harden `get_users_invitation_details` RPC**
*   [X] Modify the function signature to accept an `organization_id uuid` parameter.
*   [X] Inside the SQL, join with `organization_memberships` to filter `user_ids_to_check` by that `organization_id`, ensuring the function only returns invitation details within the current org.

**Step 0.4: Audit Other Service-Role Codepaths**
*   [X] Review all Supabase Edge Functions and API routes using the service-role key (e.g., `invite-member`, `complete-onboarding-membership`, `admin-resend-invitation`) and ensure each enforces both caller and target organization context before any database or Auth API call.
    - Audited `admin-reset-password`, `admin-resend-invitation`, `invite-member`, and `complete-onboarding-membership` functions and added JWT checks, caller-org validation, and target membership guards as needed.

**Step 0.5: Harden Storage Access**
*   [X] Include `organization_id` in your asset storage paths (e.g. `org_id/user_id/filename`), implemented in the upload endpoint by prefixing paths with `${activeOrgId}/${user.id}/...`.
*   [X] Update your `storage.objects` RLS policies (in `docs/supabase/full_schema_dump.sql`) to enforce reads/inserts only when the storage path or metadata matches the `public.get_active_organization_id()` claim.

**Step 0.6: Enhance Generic DB Helpers**
*   [X] Extend `deleteData` and `insertData` to accept an `organizationId` option (in `lib/supabase/db.ts`).
*   [X] Helpers now inject `organization_id` into inserts and apply `.eq('organization_id', organizationId)` on deletes/queries to enforce tenant-scoping.

**Step 0.7: Audit Direct Queries**
*   [X] Audited all direct `supabase.from(...)` calls across the codebase:
    - Client-side calls (e.g., in `OrgRoleManager`, TTS actions) use authenticated client or `queryData` with `organizationId` option, letting RLS enforce tenant scope.
    - Service-role calls in Edge Functions (`admin-reset-password`, `admin-resend-invitation`, `invite-member`, `complete-onboarding-membership`, `set-active-org-claim`) include explicit `.eq('organization_id', activeOrgId)` or only operate on membership metadata.
    - No remaining unscoped `supabase.from` calls found that could bypass tenant isolation.

## Phase 1: Backend - DAM Core Logic Refactoring

**Step 1: Tenant-Scope Folders**
*   [X] **DB Review:** Confirm `folders` table has `organization_id` (FK to `organizations.id`, NOT NULL) and appropriate unique constraints (e.g., `folders_org_parent_name_unique` for subfolders, `idx_folders_unique_root_name` for root folders).
*   [X] **RLS:** Ensure RLS policy for `folders` correctly uses `get_active_organization_id()` for `SELECT`, `INSERT`, `UPDATE`, `DELETE`.
    *   Example: `CREATE POLICY "Enable access for organization members on folders" ON public.folders FOR ALL USING (organization_id = public.get_active_organization_id()) WITH CHECK (organization_id = public.get_active_organization_id());`
    *   **Note on Advanced RLS:** If more granular permissions are needed (e.g., only organization admins can delete certain folders, or access is based on specific roles within the `organization_memberships` table), these RLS policies might need to become more complex. To avoid potential recursion errors when querying `organization_memberships` or other RLS-protected tables from within your `folders` policies, consider using `SECURITY DEFINER` helper functions. For example, a function like `public.is_user_admin_of_organization(org_id uuid)` (which checks if the current user is an admin for a given organization) can be safely used in RLS `USING` clauses.
*   [X] **Refactor `fetchFolders` (in `app/(protected)/dam/page.tsx` or similar):**
    *   [X] Use `getActiveOrganizationId()`.
    *   [X] Modify Supabase query to filter by `organization_id` (e.g., `.eq('organization_id', activeOrgId)`).
    *   [X] Remove or adapt direct `user_id` filtering if organization is the primary scope.
    *   [X] Handle cases where `activeOrgId` is null (e.g., show error, prompt user to select org).
*   [X] **Refactor `fetchBreadcrumbPathRecursive` (in `app/(protected)/dam/page.tsx` or similar):**
    *   [X] Ensure RPC function `get_folder_path` is tenant-aware or that the calling function scopes its usage appropriately if it queries `folders` table directly. (Relies on RLS, which is now fixed via `get_active_organization_id()` SQL function update)
    *   [X] If `get_folder_path` itself queries the `folders` table, it must respect RLS or be modified to accept `organization_id`. (Relies on RLS, now fixed)
*   [X] **Refactor Folder Creation/Update/Delete Actions (e.g., in `lib/actions/dam.ts` or specific folder actions):**
    *   [X] `createFolder` implemented:
        *   [X] Retrieves `activeOrganizationId`.
        *   [X] Uses `organization_id` in insert query.
        *   [X] Relies on RLS `WITH CHECK` for authorization.
    *   [X] `updateFolder` action:
        *   [X] Retrieve `activeOrganizationId`.
        *   [X] Use `organization_id` in update queries.
        *   [X] Ensure `WITH CHECK` clauses in RLS policies are respected.
    *   [X] `deleteFolder` action:
        *   [X] Retrieve `activeOrganizationId`.
        *   [X] Use `organization_id` in delete queries.
        *   [X] Ensure `WITH CHECK` clauses in RLS policies are respected.
        *   [X] Implement check for empty folder before deletion.
*   [X] *Testing:*
    *   [X] Verify users can only see/manage folders belonging to their active organization (Listing fixed, Create tested).
    *   [X] Test folder creation across different organizations (Manual tests passed, Automated tests added).
    *   [X] Test folder renaming across different organizations.
    *   [X] Test folder deletion across different organizations.
    *   [X] Test breadcrumb generation with nested folders in different orgs (Partially done, visual bug remains).

**Step 2: Tenant-Scope Assets**
*   [X] **DB Review:** Confirm `assets`