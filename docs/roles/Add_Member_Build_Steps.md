# Add Organization Member - Invitation Flow Build Steps

This document outlines the step-by-step process for implementing a feature that allows administrators to add new members to their organization via an email invitation system. This flow integrates Supabase Auth for user invitation and account creation, and Supabase Edge Functions for secure backend processing.

**Assumptions:**

*   [X] You are working with a Supabase PostgreSQL database.
*   [X] You have existing tables: `organizations`, `organization_memberships`, and `roles` (as defined in `Role_System_build_Steps.md`).
*   [X] You have a `profiles` table linked to `auth.users` for storing user-specific public data.
*   [X] Your application has a UI component (e.g., `OrgRoleManager.tsx`) where an admin can manage organization members.
*   [X] RLS policies are in place to protect organizational data.

---

**Phase 1: Client-Side UI for Initiating Invitation**

*   **Task:** Implement the user interface elements that allow an administrator to start the invitation process.
    1.  **"Add Member" Button:**
        *   [X] **Location:** In the `OrgRoleManager.tsx` component (or relevant admin UI).
        *   [X] **Action:** Clicking this button should open a dialog/modal for entering invitation details.
        *   [X] **State:** Manage dialog visibility using React state (e.g., `showAddMemberDialog`).
    2.  **Invitation Dialog Component (`AddMemberDialog.tsx`):**
        *   [X] **Create Component:** `components/settings/AddMemberDialog.tsx`.
        *   [X] **Form Fields:**
            *   [X] Email (text input, required, type: email).
            *   [X] Full Name (text input, optional).
            *   [X] Role (select dropdown, required, populated from `roles` table, excluding 'super-admin').
        *   [X] **Props:**
            *   [X] `isOpen` (boolean, controls visibility).
            *   [X] `onClose` (function, to close the dialog).
            *   [X] `roles` (array of `RoleOption` objects).
            *   [X] `organizationId` (string, the ID of the organization to invite to).
            *   [X] `onMemberInvited` (function, callback on successful function invocation).
        *   [X] **State:** Manage form input values, loading state (`isInviting`).
    3.  **Dialog Submission Logic:**
        *   [X] **Handler:** `handleSubmit` function in `AddMemberDialog.tsx`.
        *   [X] **Validation:** Basic client-side check for required fields (email, role, `organizationId`).
        *   [X] **API Call:** On submit, call a Supabase Edge Function (e.g., `invite-member`) using `supabase.functions.invoke()`.
            *   [X] Pass `email`, `fullName`, `roleId`, and `organizationId` in the request body.
        *   [X] **Feedback:**
            *   [X] Show loading state on the submit button (`isInviting`).
            *   [X] On successful invocation of the Edge Function (not necessarily user signup yet), call `onMemberInvited` prop. `OrgRoleManager` shows a toast: "Invitation has been sent...".
            *   [X] On error from Edge Function invocation, show an error toast in `AddMemberDialog`.
*   **Testing (Client-Side Mock):**
    1.  [X] Verify the "Add Member" button in `OrgRoleManager.tsx` opens the `AddMemberDialog`.
    2.  [X] Verify the dialog form fields (Email, Full Name, Role dropdown) are present and functional.
    3.  [X] Verify basic form validation (e.g., submit button disabled if email/role not provided).
    4.  [X] Temporarily mock the `supabase.functions.invoke('invite-member', ...)` call to simulate success and error responses, ensuring toasts and dialog closing behavior are correct.

---

**Phase 2: Backend - Supabase Edge Function for Sending Invitations**

*   **Task:** Create a secure Supabase Edge Function to handle the invitation logic.
    1.  **Create Edge Function (`invite-member`):**
        *   [ ] **Location:** In your Supabase project (Dashboard -> Edge Functions -> New Function).
        *   [ ] **Name:** `invite-member`.
        *   [ ] **Environment Variables:** Ensure `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are available to the function.
    2.  **Function Logic (Deno/TypeScript):**
        *   [ ] **Import Supabase Admin SDK:** `import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';`
        *   [ ] **Initialize Admin Client:** `const supabaseAdmin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);`
        *   [ ] **Request Handling:**
            *   [ ] Extract `email`, `fullName` (optional), `roleId`, and `organizationId` from the incoming request body.
            *   [ ] Validate inputs (e.g., ensure required fields are present, email format is valid).
        *   [ ] **Check for Existing User/Membership (Optional but Recommended):**
            *   [ ] *Advanced:* Before inviting, you might query if a user with this email already exists.
            *   [ ] *Advanced:* If they exist, check if they are already a member of `organizationId`.
            *   [ ] *Advanced:* Return specific error messages/codes if user is already a member or already invited but hasn't accepted.
        *   [ ] **Supabase Auth Invitation:**
            *   [ ] Call `await supabaseAdmin.auth.admin.inviteUserByEmail({ email: userEmail, data: { full_name: userFullName, target_organization_id: orgId, target_role_id: roleIdForInvite, app_name: 'YourApplicationName' /* or similar for email template */ } });`
            *   The `data` object here is critical. It will be embedded in the invitation and available in `NEW.raw_app_meta_data` when the user signs up, for use by the database trigger.
        *   [ ] **Error Handling:** Wrap the `inviteUserByEmail` call in a `try...catch` block.
            *   [ ] Catch errors from Supabase (e.g., user already invited, invalid email format).
            *   [ ] Return appropriate error responses (e.g., JSON with an error message and status code).
        *   [ ] **Success Response:** Return a success response (e.g., JSON with a success message and status code 200).
    3.  **Deploy Edge Function:** Deploy the function from the Supabase CLI or dashboard.
*   **Testing (Edge Function):**
    1.  [ ] **Invoke Manually:** Use a tool like `curl`, Postman, or the Supabase CLI to invoke the deployed Edge Function directly with test payloads (various email addresses, role IDs, org IDs).
    2.  [ ] **Verify Email Delivery:** Confirm invitation emails are sent to the test email addresses.
    3.  [ ] **Check Supabase Auth Users:** Observe the `auth.users` table for invited users (they will have an `invited_at` timestamp).
    4.  [ ] **Test Error Cases:**
        *   [ ] Invalid email format.
        *   [ ] Missing required parameters.
        *   [ ] Attempting to invite an email that has already been invited.
        *   [ ] (If implemented) Attempting to invite an email that is already an active user and member.

---

**Phase 3: Backend - Database Trigger for User Onboarding**

*   **Task:** Create a database trigger and SQL function to automatically set up the user's profile and organization membership when they accept the invitation and complete signup.
    1.  **SQL Function (`handle_invited_user_setup`):**
        *   [ ] **Purpose:** To be executed by the trigger after a new user is inserted into `auth.users`.
        *   [ ] **Logic:**
            *   [ ] Access `NEW.id` (the new user's UUID), `NEW.email`.
            *   [ ] Access `NEW.raw_app_meta_data` (this contains `target_organization_id`, `target_role_id`, `full_name` passed from the Edge Function's invitation `data` payload).
            *   [ ] Extract `target_organization_id_val := (NEW.raw_app_meta_data->>'target_organization_id')::UUID;`
            *   [ ] Extract `target_role_id_val := (NEW.raw_app_meta_data->>'target_role_id')::UUID;`
            *   [ ] Extract `user_full_name_val := NEW.raw_app_meta_data->>'full_name';`
            *   [ ] **Create Profile:** If `target_organization_id_val` is not null (i.e., this was an invited user), insert a row into `public.profiles` (`id = NEW.id`, `email = NEW.email`, `full_name = user_full_name_val`).
            *   [ ] **Create Membership:** If `target_organization_id_val` and `target_role_id_val` are not null, insert a row into `public.organization_memberships` (`user_id = NEW.id`, `organization_id = target_organization_id_val`, `role_id = target_role_id_val`).
            *   [ ] **Set Active Organization (Important Consideration):**
                *   Ideally, `NEW.app_metadata` should be updated to set `active_organization_id = target_organization_id_val`.
                *   *Challenge:* Directly updating `NEW.app_metadata` within an `auth.users` trigger can be complex or restricted.
                *   *Alternative 1:* The client application, on first login after signup, checks if `active_organization_id` is null. If the user has only one membership (the invited one), set it as active. If multiple, prompt.
                *   *Alternative 2 (Advanced):* A separate, `SECURITY DEFINER` SQL function called by the trigger could potentially use an admin role to update `auth.users` metadata, but this requires careful security consideration.
            *   [ ] Return `NEW`.
    2.  **Create Trigger:**
        *   [ ] **Name:** e.g., `on_auth_user_created_setup_invited_user`
        *   [ ] **Table:** `auth.users`
        *   [ ] **Event:** `AFTER INSERT`
        *   [ ] **Action:** `EXECUTE FUNCTION public.handle_invited_user_setup();`
    3.  **Apply SQL:** Add the function and trigger to your database via a migration script or Supabase Studio.
*   **Testing (Trigger & Function):**
    1.  [ ] Ensure the Edge Function (`invite-member`) is working.
    2.  [ ] Send an invitation to a **new email address** not yet in `auth.users`.
    3.  [ ] Click the invitation link in the received email and complete the signup process.
    4.  [ ] **Verify Database State:**
        *   [ ] Check `auth.users` for the new user. Confirm `raw_app_meta_data` contains the `target_organization_id`, `target_role_id`, etc.
        *   [ ] Check `public.profiles` for a new entry for this user with their `full_name` (if provided).
        *   [ ] Check `public.organization_memberships` for a new entry linking the user to the target organization with the target role.
        *   [ ] Verify `active_organization_id` in `auth.users.app_metadata` (if that part of the trigger/flow is implemented).
    5.  [ ] Test with and without `fullName` provided in the invitation.

---

**Phase 4: End-to-End Testing & Refinements**

*   **Task:** Test the entire flow from an admin's perspective and the invited user's perspective.
    1.  **Admin Flow:**
        *   [ ] Admin in Org A invites a new email address with a specific role (e.g., 'member').
        *   [ ] Verify success toast.
    2.  **Invited User Flow:**
        *   [ ] User receives email, clicks link, signs up.
        *   [ ] User logs in.
        *   [ ] Verify they have access to Org A's resources according to the 'member' role.
        *   [ ] Verify their `active_organization_id` is set correctly (or they are prompted to set it).
    3.  **Admin View Update:**
        *   [ ] After the invited user completes signup, the admin (after a page refresh or list re-fetch in `OrgRoleManager`) should now see the new user in the member list with the correct name, email, and role.
    4.  **Error Case Handling:**
        *   [ ] Test inviting an email that is already a member of the organization. (Edge function should handle this gracefully).
        *   [ ] Test inviting an email that has already been invited but hasn't accepted. (Edge function should handle this).
        *   [ ] Test any other edge cases identified.
    5.  **UI/UX Refinements:**
        *   [ ] Ensure all loading states, success messages, and error messages are clear and user-friendly.
        *   [ ] Consider if the admin's member list in `OrgRoleManager` should automatically refresh or provide a manual refresh button after an invitation is successfully processed by the Edge Function (even before the user accepts).

---

**(Final Review: Add Member invitation flow is secure, reliable, and provides a good user experience for both the inviting admin and the invited user.)** 