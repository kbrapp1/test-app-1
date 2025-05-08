# Multi-Tenancy Implementation - Build Steps

This document outlines the planned steps to refactor the application for multi-tenancy. This will enable multiple distinct organizations to use the application with their data isolated.

**Note:** Steps assume incremental development and thorough testing/review between major phases. The [project-structure-full.md](mdc:docs/starters/project-structure-full.md) can be used as a reference for affected areas.

## Phase 1: Foundation - Core Tenancy Model & Database Changes

**Step 1: Design & Planning**
*   [x] **Decision:** Confirm multi-tenancy strategy (e.g., Shared Database, Shared Schema, Discriminator Column - `organization_id`).
*   [x] **Decision:** Define User-to-Organization relationship: User can belong to many organizations (via `organization_memberships` join table with roles). Active organization determined by last-used, user selection if needed, and explicit switching.
*   [x] **Planning:** Identify all database tables requiring an `organization_id`: `assets`, `folders`, `notes`, `tags` (org-specific), `tts_predictions`, and `teams` (teams will be nested within organizations).
*   [x] **Planning:** Data Handling for Existing Data: Existing data will be purged. The multi-tenant schema will be applied to a clean database. Initial setup will involve creating a primary organization and ensuring the first users are associated with it.
*   [x] **Planning:** Define how administrative super-users will interact with tenant data: A single designated super-user (developer/admin) will have overriding access via RLS policies (checking against a specific `user_id`). No in-app super-admin UI initially.

**Step 2: Database Schema - Organizations & Linking**
*   [x] **DB:** Create `organizations` table:
    *   `id` (UUID, primary key, default `gen_random_uuid()`)
    *   `name` (TEXT, not null)
    *   `created_at` (TIMESTAMPTZ, default `now()`)
    *   `updated_at` (TIMESTAMPTZ, default `now()`)
    *   Consider other fields: `slug` (for potential subdomain routing), `owner_user_id` (FK to `auth.users.id`).
*   [x] **DB:** Create `organization_domains` table (if supporting domain-based auto-join or restrictions):
    *   `organization_id` (UUID, FK to `organizations.id`, part of PK)
    *   `domain_name` (TEXT, part of PK, unique globally or per-org depending on strategy)
    *   `verified_at` (TIMESTAMPTZ, nullable)
*   [x] **DB:** Create `organization_memberships` join table to link users to organizations:
    *   `user_id` (UUID, FK to `auth.users.id`, part of PK)
    *   `organization_id` (UUID, FK to `organizations.id`, part of PK)
    *   `role` (TEXT, e.g., 'admin', 'member', default 'member')
*   [x] **DB:** Create `teams` table (for functional teams within organizations, includes `organization_id`).
*   [x] **DB:** Create `team_user_memberships` table (to link users to functional teams).
*   [x] **DB:** Add `organization_id` (UUID, FK to `organizations.id`, NOT NULL) to all identified tenant-specific data tables (`assets`, `folders`, `notes`, `tags`, `TtsPrediction`, `team_members`). Existing `team_members` data migrated to a default organization.
*   [x] **DB:** Update unique constraints to be per-organization where applicable (e.g., folder names unique *within* an `organization_id`).
*   [x] **DB:** Create Supabase migrations for all schema changes in `supabase/migrations/` (Achieved via MCP `apply_migration` for remote, local migration file needs to be updated/created if using local dev with Docker).
*   [x] **DB:** Apply migrations (Done via MCP for remote).
*   [x] **DB:** Regenerate Supabase types: `npx supabase gen types typescript --project-id zzapbmpqkqeqsrqwttzd --schema public > types/supabase.ts`.
*   [x] *Testing:* Verify schema changes in Supabase Studio and ensure types are correctly generated.

**Step 3: Backend - Row Level Security (RLS)**
*   [x] **DB:** Create a Supabase SQL helper function `get_active_organization_id()`:
    *   This function will attempt to extract the `active_organization_id` from the user's JWT custom claims.
    *   Example: `CREATE OR REPLACE FUNCTION public.get_active_organization_id() RETURNS uuid AS $$ SELECT nullif(current_setting('request.jwt.claims', true)::jsonb ->> 'active_organization_id', '')::uuid; $$ LANGUAGE sql STABLE;`
*   [x] **RLS:** Implement RLS policies for ALL tenant-scoped tables.
    *   Policies should enforce that users can only `SELECT`, `INSERT`, `UPDATE`, `DELETE` data matching their `get_active_organization_id()`.
    *   Example for `notes` table:
        *   `CREATE POLICY "Enable read access for organization members" ON public.notes FOR SELECT USING (organization_id = public.get_active_organization_id());`
        *   `CREATE POLICY "Enable insert for organization members" ON public.notes FOR INSERT WITH CHECK (organization_id = public.get_active_organization_id());`
        *   (Similar policies for UPDATE and DELETE)
*   [~] SKIPPED - *Testing:* Thoroughly test RLS policies using different user roles and JWTs with varying `active_organization_id` claims. Use `EXPLAIN (ANALYZE, BUILDS) SELECT * FROM notes;` to verify RLS is being applied.

**(Review Point 1: Core database schema for multi-tenancy and foundational RLS policies are in place and tested.)**

## Phase 2: Backend Refactoring - Tenant-Aware Logic

**Step 4: Authentication & Tenant Context Establishment**
*   [x] **Auth:** Modify user sign-up flow:
    *   Allow creation of a new organization during sign-up or assign to an existing one based on email domain rules (if `organization_domains` is used).
    *   The first user of an organization could be made an admin.
*   [x] **Auth:** Modify login flow:
    *   After successful authentication, determine the user's `active_organization_id`.
        *   If user belongs to one org, set it as active.
        *   If multiple, potentially redirect to an organization selector page or use a default/last-used.
*   [x] **Auth:** Update Supabase JWT custom claims to include `active_organization_id` and potentially `organization_roles: [{org_id: 'uuid', role: 'admin'}, ...]`. This is typically done via a Supabase Edge Function triggered `on user creation/login` or by directly minting a custom JWT.
*   [ ] **Backend:** Create/Update server-side utility (e.g., in `lib/auth/server-action.ts`) to reliably get the current user's active `organization_id` from the session/JWT. This will be used by server actions.
*   [x] *Testing:* Verify tenant context (`active_organization_id`) is correctly established in JWTs/session after login/signup. Test organization assignment logic.

**Step 5: Server Actions & API Routes - Query & Logic Rewriting**
*   [ ] **Refactor:** Systematically update all Server Actions (`lib/actions/*.ts`, `app/**/actions.ts`) that interact with tenant-scoped data.
    *   Fetch the current `organization_id` using the utility from Step 4.
    *   **Crucial:** While RLS provides DB-level security, application queries should still explicitly include `organization_id` filters (`.eq('organization_id', currentOrgId)`) for clarity, performance (RLS can sometimes be less performant if not optimized), and to prevent unintended cross-tenant operations if RLS were ever misconfigured.
    *   This applies to: `listTextAssets`, `getAssetContent`, `updateAssetText`, `saveAsNewTextAsset` in `lib/actions/dam.ts`.
    *   This applies to: `startSpeechGeneration`, `getSpeechGenerationResult`, `saveTtsAudioToDam`, `getTtsHistory` in `lib/actions/tts.ts`.
    *   This applies to notes actions, team actions (if teams are now org-specific), etc.
*   [ ] **Refactor:** Update all API Route handlers (`app/api/**/*.ts`) similarly if they directly access tenant-scoped data.
*   [ ] **Refactor:** Review and update generic data access functions (e.g., `queryData` in `lib/supabase/db.ts`) to ensure they are tenant-aware or that all call sites correctly pass the `organization_id`.
*   [ ] **New Actions:**
    *   `createOrganization(name: string): Promise<{organization_id: string}>`
    *   `switchActiveOrganization(organization_id: string): Promise<void>` (updates JWT/session and redirects)
    *   Actions for managing organization members (invite, update role, remove).
    *   Actions for managing organization settings.
*   [ ] *Testing:* Update all existing unit/integration tests for actions/APIs to mock and verify tenant-scoping. Add new tests for organization management actions. Ensure RLS is still the primary guard.

**Step 6: Adapting "Team" Feature**
*   [ ] **Decision & Refactor:** Based on Phase 1 decision, refactor the "Team" feature.
    *   If teams are now organizations: Rename entities, merge logic.
    *   If teams are nested within organizations: Ensure `teams` table has `organization_id`, and all team-related logic respects this nesting and tenant scope.
*   [ ] *Testing:* Test the refactored Team feature thoroughly in a multi-tenant context.

**(Review Point 2: Backend logic (actions, APIs, auth) is fully tenant-aware. Data operations are scoped, and RLS is the safety net.)**

## Phase 3: Frontend Integration & User Experience

**Step 7: Frontend - Tenant Context Management**
*   [ ] **Frontend:** Create a React context (e.g., `OrganizationContext`) to hold the current `activeOrganization` details (ID, name, user's role in it).
*   [ ] **Frontend:** Populate this context after login or when the active organization changes.
*   [ ] **Frontend:** Components should consume this context to:
    *   Display current organization name.
    *   Conditionally render UI elements based on organization or user's role within it.
    *   Pass `organization_id` to server actions/API calls if strictly necessary (though ideally, backend derives it from session).
*   [ ] **UI:** Implement an organization switcher UI element (e.g., dropdown in header) if users can belong to multiple organizations. This would call `switchActiveOrganization`.
*   [ ] *Testing:* Test UI changes, organization context propagation, and organization switcher functionality.

**Step 8: Organization Management UI**
*   [ ] **UI:** Create pages/components for:
    *   Creating a new organization.
    *   Viewing/editing organization settings (name, domains, etc.).
    *   Managing organization members (inviting users, changing roles, removing members).
    *   (Potentially) Billing/subscription management per organization.
*   [ ] *Testing:* Test all organization management user flows.

**Step 9: Adapting Existing Feature UIs**
*   [ ] **UI Review:** Review all existing feature UIs (DAM, TTS, Notes, etc.) to ensure they behave correctly in a multi-tenant context.
    *   Lists should only show data for the active organization.
    *   Creation forms should associate new items with the active organization.
    *   Permissions for actions (edit, delete) should respect roles within the organization.
*   [ ] *Testing:* Perform UI/UX testing for all features with different users and organizations.

**(Review Point 3: Frontend is fully tenant-aware, providing a seamless experience for users within their organizational context.)**

## Phase 4: Data Migration, Advanced Considerations & Finalization

**Step 10: Data Migration (Execution)**
*   [ ] **Scripting:** Develop and rigorously test data migration scripts.
    *   For existing users, decide on a strategy:
        *   Create a default "Personal Workspace" organization for each existing user and migrate their current data to it.
        *   Or, if users are already grouped (e.g., by email domain), attempt to map them to pre-created organizations.
*   [ ] **Staging:** Perform a dry run of the migration in a staging environment.
*   [ ] **Production:** Plan and execute the data migration in production during a maintenance window.
*   [ ] *Testing:* Verify data integrity and user access post-migration.

**Step 11: Advanced Features & Considerations**
*   [ ] **Subdomains (Optional):** If desired, implement routing based on organization slugs (e.g., `acme.yourapp.com`). This requires DNS configuration and Next.js middleware adjustments.
*   [ ] **Custom Branding (Optional):** Allow organizations to customize aspects of the UI (logo, colors).
*   [ ] **Audit Logging:** Implement audit logs that capture user actions, including the `organization_id` context.
*   [ ] **Super Admin Panel:** Develop a secure super-admin interface for managing all organizations, users, and system settings (if not already built).

**Step 12: Comprehensive Testing & Security Review**
*   [ ] **End-to-End Testing:** Conduct thorough end-to-end testing across all features with multiple simulated organizations and users, focusing on:
    *   Data isolation (critical).
    *   Role-based access within organizations.
    *   All user flows.
*   [ ] **Security Audit:** Perform a comprehensive security audit, specifically targeting multi-tenancy vulnerabilities (e.g., RLS bypass, tenant data leakage, privilege escalation within/across tenants).
*   [ ] **Performance Testing:** Assess application performance under load with a significant number of organizations and users. Optimize queries and RLS policies.
*   [ ] **Scalability Testing:** Ensure the system can scale to accommodate future growth in tenants and data.

**Step 13: Documentation & Go-Live Preparation**
*   [ ] **Docs:** Update all user-facing and internal documentation to reflect the multi-tenant architecture.
*   [ ] **Monitoring:** Set up robust monitoring and alerting, including tenant-specific metrics if possible.
*   [ ] **Support:** Prepare support teams for handling multi-tenant specific queries.
*   [ ] **Final Review:** Conduct a final review of all changes before going live with the multi-tenant system.

**(Final Review: Application is fully multi-tenant, secure, performant, well-tested, and documented.)** 