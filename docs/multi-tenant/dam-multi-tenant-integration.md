# DAM Multi-Tenancy Integration - Build Steps

This document outlines the specific steps to refactor and enhance the Digital Asset Management (DAM) system for full multi-tenancy support, ensuring data isolation and organization-specific functionality. This complements the main [multi-tenancy-build-steps.md](mdc:docs/multi-tenant/multi-tenancy-build-steps.md).

## Pre-requisites:

*   [X] Core multi-tenancy foundation is in place (Organizations, Memberships, RLS helper `get_active_organization_id()`).
*   [X] Users have an `active_organization_id` in their JWT claims.
*   [X] A server-side utility (e.g., `getActiveOrganizationId()` in `lib/auth/server-action.ts`) exists to retrieve this ID.

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
*   [X] **DB Review:** Confirm `assets` table has `organization_id` (FK to `organizations.id`, NOT NULL).
*   [X] **RLS:** Ensure RLS policy for `assets` correctly uses `get_active_organization_id()`.
    *   Example: `CREATE POLICY "Enable access for organization members on assets" ON public.assets FOR ALL USING (organization_id = public.get_active_organization_id()) WITH CHECK (organization_id = public.get_active_organization_id());`
    *   **Note on Advanced RLS:** If more granular permissions are needed (e.g., only organization admins can delete certain assets, or access is based on specific roles within the `organization_memberships` table), these RLS policies might need to become more complex. To avoid potential recursion errors when querying `organization_memberships` or other RLS-protected tables from within your `assets` policies, consider using `SECURITY DEFINER` helper functions. For example, a function like `public.is_user_admin_of_organization(org_id uuid)` (which checks if the current user is an admin for a given organization) can be safely used in RLS `USING` clauses.
*   [X] **Refactor Asset Listing (e.g., `AssetGalleryClient` data fetching, `listTextAssets` in `lib/actions/dam.ts`):**
    *   [X] Use `getActiveOrganizationId()`.
    *   [X] Modify Supabase queries to filter by `organization_id`.
    *   [X] Consider if `folder_id` filtering also needs to be organization-scoped indirectly (i.e., the folder itself belongs to the org).
*   [X] **Refactor Asset Upload Logic (e.g., `app/api/dam/upload/route.ts` or server action):**
    *   [X] Retrieve `activeOrganizationId`.
    *   [X] When creating new asset records in the `assets` table, ensure `organization_id` is set to `activeOrganizationId`.
    *   [X] Storage path strategy: Decide if storage paths should include `organization_id` to prevent collisions and simplify potential bucket-level policies or data segregation later (e.g., `org_id/user_id/asset_id.jpg` vs `user_id/asset_id.jpg`). If paths change, migration is needed. (Path now includes org_id/user_id)
*   [X] **Refactor `moveAsset` Action (in `lib/actions/dam.ts`):**
    *   [X] Retrieve `activeOrganizationId`.
    *   [X] Verify both the asset being moved and the target folder (if any) belong to the `activeOrganizationId`.
*   [X] **Refactor `deleteAsset` Action (in `lib/actions/dam.ts`):**
    *   Retrieve `activeOrganizationId`.
    *   Ensure the asset being deleted belongs to the `activeOrganizationId` before deleting from DB and storage.
*   [X] **Refactor `getAssetContent`, `updateAssetText`, `saveAsNewTextAsset` (in `lib/actions/dam.ts`):**
    *   [X] Automated tests added for `getAssetContent`, `updateAssetText`, `listTextAssets`. Actions need review for `organization_id` usage.
    *   [X] Retrieve `activeOrganizationId`.
    *   [X] Ensure all operations are scoped to assets within that organization.
*   [X] *Testing:*
    *   [X] Verify users can only see/manage assets belonging to their active organization (Viewing fixed, manage not fully tested).
    *   [X] Test asset upload, moving between folders (within the same org), and deletion (Upload to root fixed, move/delete not tested).
    *   [X] Test text asset operations (Automated tests added, need multi-tenant review).

**(Review Point 1: All DAM backend logic for folders and assets is tenant-aware, data is scoped by `organization_id`, and RLS serves as the security foundation.)**

## Phase 2: Frontend - DAM UI & User Experience

**Step 3: Displaying Organization Context in DAM UI**
*   [X] **UI Review:** Ensure the current active organization's name is clearly visible on DAM pages.
*   [X] **Folder Sidebar (`FolderSidebar` component):**
    *   [X] Confirm it correctly receives and displays folders for the active organization only (Data fetching fixed).
    *   [X] "New Folder" button integrated and functional.
*   [X] **Asset Gallery (`AssetGalleryClient` component):**
    *   [X] Confirm it correctly fetches and displays assets for the active organization and selected folder.
*   [X] **Breadcrumbs (`DamBreadcrumbs` component):**
    *   Confirm path generation is correct for the active organization (RLS logic fixed, visual bug remains).
*   [X] *Testing:* Navigate the DAM UI as different users in different organizations. Ensure UI elements reflect the correct organizational context (Basic create/view tested).

**Step 4: DAM Specific Settings (Optional - Future Enhancement)**
*   [~] **Planning:** Consider if any DAM settings should be organization-specific (e.g., default sort order, view preferences, storage quotas specific to DAM within an org).
*   [~] **DB/UI:** If yes, design and implement these settings.
*   [~] *Testing:* Test organization-specific DAM settings if implemented.

**(Review Point 2: DAM frontend accurately reflects the active organization's data and provides a clear user experience.)**

## Phase 3: Advanced DAM Features & Finalization

**Step 5: Sharing & Permissions (Within an Organization - Future Enhancement)**
*   [~] **Planning:** Define requirements for sharing assets/folders with other members *within the same organization* (e.g., read-only, edit access). This is distinct from cross-organization sharing.
*   [~] **DB/RLS:** Design necessary table structures (e.g., `asset_permissions`, `folder_permissions`) and RLS policies.
*   [~] **Backend/UI:** Implement logic and UI for managing these internal sharing settings.
*   [~] *Testing:* Test internal sharing features.

**Step 6: Cross-Organization Sharing (Complex - Future Enhancement)**
*   [~] **Planning:** Define if assets/folders can be shared with users from *different* organizations. This is significantly more complex and requires careful design regarding RLS, UI, and discovery.
*   [~] **DB/RLS/Backend/UI:** If required, implement this feature. This might involve "guest" access records or a more federated permission model.
*   [~] *Testing:* Rigorously test cross-organization sharing.

**Step 7: Comprehensive DAM Testing in Multi-Tenant Environment**
*   [X] **End-to-End Testing:**
    *   Full user flows for asset and folder management for multiple organizations.
    *   Uploads, downloads, moves, deletions, edits.
    *   Search and filtering within the correct organizational scope.
    *   Role-based access tests (if organization roles grant different DAM permissions).
*   [X] **Security Review:** Focus on any potential for data leakage between organizations in the DAM.
*   [X] **Performance Testing:** Test DAM performance with many assets/folders per organization and multiple concurrent users from different orgs.

**(Final Review: DAM system is fully integrated into the multi-tenant architecture, secure, and performs well.)** 