# Notes Multi-Tenancy Integration - Build Steps

This document outlines the specific steps to refactor and enhance the Notes system for full multi-tenancy support, ensuring data isolation and organization-specific functionality. This complements the main [multi-tenancy-build-steps.md](mdc:docs/multi-tenant/multi-tenancy-build-steps.md).

## Pre-requisites:

*   [X] Core multi-tenancy foundation is in place (Organizations, Memberships, RLS helper `get_active_organization_id()`).
*   [X] Users have an `active_organization_id` in their JWT claims.
*   [X] A server-side utility (e.g., `getActiveOrganizationId()` in `lib/auth/server-action.ts`) exists to retrieve this ID.

## Phase 1: Backend - Notes Core Logic Refactoring

**Step 1: Tenant-Scope Notes Table**
*   [X] **DB Review:** Confirm `notes` table has `organization_id` (FK to `organizations.id`, NOT NULL) and appropriate unique constraints if needed (e.g., if note titles should be unique within an organization).
*   [X **RLS:** Ensure RLS policy for `notes` correctly uses `get_active_organization_id()` for `SELECT`, `INSERT`, `UPDATE`, `DELETE`.
    *   Example: `CREATE POLICY "Enable access for organization members on notes" ON public.notes FOR ALL USING (organization_id = public.get_active_organization_id()) WITH CHECK (organization_id = public.get_active_organization_id());`
    *   **Note on Advanced RLS:** If more granular permissions are needed (e.g., based on roles within `organization_memberships`), consider `SECURITY DEFINER` helper functions to avoid recursion.
*   [X] **Refactor Note Listing Logic (e.g., in `app/(protected)/documents/notes/page.tsx` or `app/(protected)/documents/notes/actions.ts`):**
    *   [X] Use `getActiveOrganizationId()`.
    *   [X] Modify Supabase query to filter by `organization_id` (e.g., `.eq('organization_id', activeOrgId)`).
    *   [X] Handle cases where `activeOrgId` is null.
*   [X] **Refactor Note Creation/Update/Delete Actions (e.g., `createNote`, `updateNote`, `deleteNote` in `app/(protected)/documents/notes/actions.ts`):**
    *   [X] `createNote` action:
        *   [X] Retrieves `activeOrganizationId`.
        *   [X] Uses `organization_id` in insert query.
        *   [X] Relies on RLS `WITH CHECK` for authorization.
    *   [X] `updateNote` action:
        *   [X] Retrieve `activeOrganizationId`.
        *   [X] Use `organization_id` in update queries.
        *   [X] Ensure `WITH CHECK` clauses in RLS policies are respected.
    *   [X] `deleteNote` action:
        *   [X] Retrieve `activeOrganizationId`.
        *   [X] Use `organization_id` in delete queries.
        *   [X] Ensure `WITH CHECK` clauses in RLS policies are respected.
*   [~] **Refactor any related entities (e.g., `tags` if they are tenant-scoped and linked to notes):**
    *   [~] If `tags` (or similar entities like `note_categories`) are tenant-specific, ensure they also have `organization_id` and appropriate RLS.
    *   [~] Update actions for managing these related entities to be tenant-aware.
*   [~] *Testing (Backend):*
    *   [~] Verify users can only see/manage notes belonging to their active organization.
    *   [~ ]~ Test note creation, update, and deletion across different organizations.
    *   [~] Test operations on related entities (like tags) if applicable.

**(Review Point 1: All Notes backend logic is tenant-aware, data is scoped by `organization_id`, and RLS serves as the security foundation.)**

## Phase 2: Frontend - Notes UI & User Experience

**Step 2: Displaying Organization Context in Notes UI**
*   [ ] **UI Review:** Ensure the current active organization's name is clearly visible on Notes pages (e.g., `app/(protected)/documents/notes/page.tsx`).
*   [ ] **Notes List Display (e.g., `NoteList` component in `components/notes/note-list.tsx`):**
    *   [ ] Confirm it correctly receives and displays notes for the active organization only.
*   [ ] **Note Creation UI (e.g., `AddNoteDialog` or `AddNoteForm` in `components/notes/`):**
    *   [ ] Ensure new notes are associated with the active organization (backend should enforce this via session `organization_id`).
*   [ ] **Note Viewing/Editing UI (e.g., `NoteEditForm` in `components/notes/note-edit-form.tsx`):**
    *   [ ] Confirm that users can only view/edit notes belonging to their active organization.
*   [ ] *Testing (Frontend):*
    *   [ ] Navigate the Notes UI as different users in different organizations.
    *   [ ] Ensure UI elements (lists, forms) reflect the correct organizational context.
    *   [ ] Test creating, viewing, editing, and deleting notes.

**Step 3: Notes Specific Settings (Optional - Future Enhancement)**
*   [ ] **Planning:** Consider if any Notes settings should be organization-specific (e.g., default note template, sort order).
*   [ ] **DB/UI:** If yes, design and implement these settings.
*   [ ] *Testing:* Test organization-specific Notes settings if implemented.

**(Review Point 2: Notes frontend accurately reflects the active organization's data and provides a clear user experience.)**

## Phase 3: Advanced Notes Features & Finalization

**Step 4: Sharing & Permissions for Notes (Within an Organization - Future Enhancement)**
*   [ ] **Planning:** Define requirements for sharing notes with other members *within the same organization*.
*   [ ] **DB/RLS:** Design necessary table structures (e.g., `note_permissions`) and RLS policies.
*   [ ] **Backend/UI:** Implement logic and UI for managing these internal sharing settings.
*   [ ] *Testing:* Test internal note sharing features.

**Step 5: Cross-Organization Sharing for Notes (Complex - Future Enhancement)**
*   [ ] **Planning:** Define if notes can be shared with users from *different* organizations.
*   [ ] **DB/RLS/Backend/UI:** If required, implement this feature.
*   [ ] *Testing:* Rigorously test cross-organization note sharing.

**Step 6: Comprehensive Notes Testing in Multi-Tenant Environment**
*   [ ] **End-to-End Testing:**
    *   [ ] Full user flows for note management for multiple organizations.
    *   [ ] Creation, viewing, editing, deletion, searching, and filtering of notes.
    *   [ ] Role-based access tests for notes (if organization roles grant different note permissions).
*   [ ] **Security Review:** Focus on any potential for data leakage between organizations in the Notes feature.
*   [ ] **Performance Testing:** Test Notes performance with many notes per organization and multiple concurrent users from different orgs.

**(Final Review: Notes system is fully integrated into the multi-tenant architecture, secure, and performs well.)** 