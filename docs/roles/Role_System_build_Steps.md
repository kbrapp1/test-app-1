# Role System Implementation - Lookup Table Approach

This document outlines the step-by-step process for implementing a robust role management system using a dedicated `roles` lookup table and updating the `organization_memberships` table to reference it. This approach enhances data integrity, manageability, and scalability for user roles within organizations.

**Assumptions:**

*   [X] You are working with a Supabase PostgreSQL database.
*   [X] You have existing tables: `organizations` and `organization_memberships` (where `organization_memberships` currently has a text-based `role` column).
*   [X] RLS policies and application code currently use the text-based `role` from `organization_memberships`.

---

**Step 1: Design and Create `roles` Table**

*   [X] **Task:**
    1.  [X] **Define `roles` Table Schema:**
        *   [X] Name: `roles`
        *   [X] Enable Row Level Security (RLS) if needed (e.g., only super admins can manage roles). (Assuming RLS as per screenshot/SQL)
        *   [X] Columns:
            *   [X] `id` (UUID, primary key, default: `gen_random_uuid()`) - Or `SERIAL PRIMARY KEY` if preferred.
            *   [X] `name` (TEXT, not null, unique) - e.g., 'admin', 'member', 'editor'. This will be the canonical name for the role.
            *   [X] `description` (TEXT, nullable) - A user-friendly description of the role and its permissions.
            *   [X] `created_at` (TIMESTAMPTZ, default: `now()`)
            *   [X] `updated_at` (TIMESTAMPTZ, default: `now()`)
    2.  [ ] **Create Migration Script for `roles` Table:** (Skipped - online workflow)
        ```sql
        -- Create the roles table
        CREATE TABLE public.roles (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            name TEXT NOT NULL UNIQUE,
            description TEXT,
            created_at TIMESTAMPTZ DEFAULT now(),
            updated_at TIMESTAMPTZ DEFAULT now()
        );

        -- Enable RLS (example, adjust as needed)
        ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
        CREATE POLICY "Allow public read-only access" ON public.roles FOR SELECT USING (true);
        -- CREATE POLICY "Allow admins to manage roles" ON public.roles FOR ALL USING (is_claims_admin()) WITH CHECK (is_claims_admin());


        -- Optional: Trigger to update updated_at timestamp
        CREATE OR REPLACE FUNCTION public.moddatetime()
        RETURNS TRIGGER AS $$
        BEGIN
            NEW.updated_at = now();
            RETURN NEW;
        END;
        $$ language 'plpgsql';

        CREATE TRIGGER handle_updated_at
        BEFORE UPDATE ON public.roles
        FOR EACH ROW
        EXECUTE FUNCTION public.moddatetime (updated_at);

        -- Insert initial roles (adjust to your needs)
        INSERT INTO public.roles (name, description) VALUES
        ('admin', 'Administrator with full management capabilities within the organization.'),
        ('member', 'Standard member with access to assigned resources and features.');
        -- Add other roles like 'editor', 'viewer', 'billing_manager' as required.
        ```
    3.  [X] **Apply the Migration:** (Done - table exists online)
*   [X] **Testing:**
    1.  [X] Log in to Supabase Dashboard.
    2.  [X] Navigate to Table Editor. Verify `roles` table exists with correct columns, types, and constraints.
    3.  [X] Verify the initial roles ('admin', 'member', 'editor') are present in the `roles` table.
    4.  [X] Verify RLS policies for the `roles` table are active if defined. (Assuming public read-only as per SQL example)

---

**Step 2: Modify `organization_memberships` Table (Part 1 - Additive Changes)**

*   [X] **Task:**
    1.  [X] **Apply Additive Schema Changes to `organization_memberships`:** This involves adding the `role_id` column, populating it based on existing text roles, setting it to `NOT NULL`, and adding the foreign key constraint. The old `role` text column will *not* be dropped in this step.
        ```sql
        -- 1. Add the new role_id column (nullable for now)
        ALTER TABLE public.organization_memberships
        ADD COLUMN role_id UUID;

        -- 2. Populate role_id based on the existing text 'role' column
        -- Ensure all existing roles in organization_memberships.role have corresponding entries in the new roles.name table first!
        UPDATE public.organization_memberships om
        SET role_id = (SELECT r.id FROM public.roles r WHERE r.name = om.role);

        -- 3. Make role_id NOT NULL (assuming all memberships should have a role)
        -- If any role_id is still NULL after the update, investigate before this step.
        -- It means some text roles in organization_memberships didn't have a match in the roles table.
        ALTER TABLE public.organization_memberships
        ALTER COLUMN role_id SET NOT NULL;

        -- 4. Add the foreign key constraint
        ALTER TABLE public.organization_memberships
        ADD CONSTRAINT fk_organization_memberships_role_id
        FOREIGN KEY (role_id) REFERENCES public.roles(id) ON DELETE RESTRICT; -- Or ON DELETE SET NULL/DEFAULT if appropriate

        -- NB: The old text 'role' column is NOT dropped here. That will happen in a later step.
        ```
    2.  [X] **Important Pre-computation Step:** Before running the update (SQL part 2), ensure every distinct value in `organization_memberships.role` (old text column) has a corresponding entry in `public.roles.name`. Add any missing ones to the `roles` table.
    3.  [X] **Apply the SQL Changes:** Execute these SQL statements directly in your Supabase Studio.
*   [X] **Testing:**
    1.  [X] In Supabase Table Editor, verify `organization_memberships` schema:
        *   [X] `role_id` column exists and is of type UUID.
        *   [X] `role_id` is NOT NULL.
        *   [X] The foreign key constraint to `public.roles` is active.
        *   [X] The old `role` text column **still exists**.
    2.  [X] Verify data: Spot-check records in `organization_memberships` to ensure `role_id` values correctly correspond to the previous text roles (by joining with `public.roles`).
    3.  [X] Attempt to insert/update `organization_memberships` with an invalid `role_id` -> Verify the FK constraint prevents it.
    4.  [X] Attempt to delete a role from `public.roles` that is still in use in `organization_memberships` -> Verify `ON DELETE RESTRICT` (or your chosen action) behaves as expected.

---

**Step 3: Update Row Level Security (RLS) Policies**

*   [X] **Task:**
    1.  [X] **Identify Affected RLS Policies:** Review all RLS policies, especially those on tables like `notes`, `assets`, `team_members`, `folders`, etc., that previously checked the `organization_memberships.role` text column.
    2.  [X] **Modify Policies:**
        *   [X] Change checks like `(om.role = 'admin'::text)` to reference the new `role_id` and join with the `roles` table.
        *   [X] Example (Conceptual - adjust to your actual policy structure):
            ```sql
            -- Old policy might have a part like:
            -- ... AND (SELECT role FROM public.organization_memberships WHERE organization_id = target_table.organization_id AND user_id = auth.uid()) = 'admin'

            -- New policy part could be:
            -- ... AND EXISTS (
            -- SELECT 1
            -- FROM public.organization_memberships om
            -- JOIN public.roles r ON om.role_id = r.id
            -- WHERE om.organization_id = target_table.organization_id
            -- AND om.user_id = auth.uid()
            -- AND r.name = 'admin'
            -- )
            ```
        *   [X] Consider creating helper functions in SQL (e.g., `get_user_org_role_name(user_uuid UUID, org_uuid UUID) RETURNS TEXT`) that encapsulate the join to simplify policy definitions. (The `is_user_admin_of_organization` function was updated).
    3.  [X] **Apply Policy Changes:** Update policies via migration scripts or directly in Supabase Studio (and then sync to local migrations). (Done directly in Studio for online workflow).
*   [X] **Testing:**
    1.  [X] Thoroughly test all RLS-protected operations (SELECT, INSERT, UPDATE, DELETE) for affected tables.
    2.  [X] Test as users with different roles (e.g., admin, member) to ensure they can only access/modify what their new role (via `role_id`) permits.
    3.  [X] Pay close attention to any policies that might have been missed or incorrectly updated.

---

**Step 4: Update Application Code (Backend/Server Logic)**

*   **Task:**
    1.  [ ] **Identify Affected Backend Code:** Search your codebase (e.g., `lib/actions/`, `app/api/`, Supabase Edge Functions) for any logic that:
        *   [ ] Reads the `role` property from `organization_memberships`.
        *   [ ] Writes/updates the `role` property in `organization_memberships`.
    2.  [ ] **Modify Code:**
        *   [ ] When fetching user/membership details, if you need the role *name*, you will now need to join `organization_memberships` with the `roles` table or fetch the `role_id` and then make a separate query to `roles` for its name and description.
        *   [ ] When creating/updating a membership, instead of providing a role name, you will provide a `role_id`. This might involve fetching the `id` from the `roles` table based on a role name selected in the UI.
*   **Testing:**
    1.  [ ] Run existing unit/integration tests for your backend logic. Update tests to reflect the new `role_id` and interactions with the `roles` table.
    2.  [ ] Manually test application features that rely on this backend logic (e.g., fetching user permissions, assigning roles if that UI exists).

---

**Step 5: Update Application Code (Frontend/UI Components)**

*   **Task:**
    1.  [ ] **Identify Affected Frontend Code:** Review UI components that:
        *   [ ] Display the user's role.
        *   [ ] Allow selection or editing of a user's role (if such a feature exists).
    2.  [ ] **Modify Components:**
        *   [ ] Components displaying the role will need to receive the role *name* (and possibly description) fetched from the `roles` table (likely passed down as props from server components or fetched by client components that now get a `role_id`). The old text `role` column can serve as a fallback or for comparison during transition if needed.
        *   [ ] Forms or inputs for setting a role will need to deal with `role_id`. This might mean fetching all available roles (`id`, `name`, `description`) to populate a dropdown/select list, and then submitting the selected `role_id`. Ensure that any writes also update the new `role_id` column.
        *   [ ] Example: The `ProfileForm` we modified would need to fetch the role name by joining `organization_memberships` with `roles` (via `role_id`) or by using the `role_id` to look up the name.
*   **Testing:**
    1.  [ ] Run existing UI tests (e.g., Playwright, Cypress, Jest with Testing Library). Update tests as needed to reflect the new way of handling roles (via `role_id`).
    2.  [ ] Manually test all UI elements that display or interact with user roles.
        *   [ ] Verify role names (and descriptions, if used) are displayed correctly based on `role_id`.
        *   [ ] If role editing is implemented, verify it correctly updates the `role_id` in `organization_memberships`.

---

**Step 5.1: Finalize `organization_memberships` Table (Part 2 - Drop Old Column)**

*   **Task:**
    1.  [ ] **Ensure Application No Longer Uses Old `role` Column:** Confirm that all application code (Backend - Step 4, Frontend - Step 5) and RLS policies (Step 3) have been updated to use `role_id` and no longer reference the old text `role` column from `organization_memberships`.
    2.  [ ] **Drop the Old `role` Column:**
        ```sql
        -- 5. Drop the old text 'role' column
        ALTER TABLE public.organization_memberships
        DROP COLUMN role;
        ```
    3.  [ ] **Apply the SQL Change:** Execute this SQL statement directly in your Supabase Studio.
*   **Testing:**
    1.  [ ] In Supabase Table Editor, verify `organization_memberships` schema:
        *   [ ] The old `role` text column is now gone.
    2.  [ ] Thoroughly re-test application functionality related to roles to ensure no regressions occurred after dropping the column.

---

**Step 6: (Optional) Create Role Management Interface**

*   **Task (If you want admins to manage roles themselves via the app):**
    1.  [ ] **Design UI:** Create a section in your admin panel for managing roles.
    2.  [ ] **List Roles:** Display existing roles from the `public.roles` table (name, description).
    3.  [ ] **Add Role Form:** Allow creating new roles (name, description).
    4.  [ ] **Edit Role Form:** Allow updating the name and description of existing roles.
    5.  [ ] **Delete Role Functionality:** Allow deleting roles (consider implications if a role is in use – `ON DELETE RESTRICT` on the FK would prevent this unless memberships are reassigned).
    6.  [ ] **Implement Server Actions/API Endpoints:** For CRUD operations on the `public.roles` table, protected by appropriate authorization (e.g., only super admins).
*   **Testing:**
    1.  [ ] Thoroughly test the CRUD functionality for roles in the admin interface.
    2.  [ ] Verify RLS on the `roles` table itself if you implemented specific management policies.
    3.  [ ] Test edge cases (e.g., trying to create a role with a duplicate name, trying to delete a role in use).

--- 