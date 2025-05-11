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
        *   [X] **Location:** In your Supabase project (Dashboard -> Edge Functions -> New Function).
        *   [X] **Name:** `invite-member`.
        *   [X] **Environment Variables:** Ensure `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are available to the function.
    2.  **Function Logic (Deno/TypeScript):**
        *   [X] **Import Supabase Admin SDK:** `import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';`
        *   [X] **Initialize Admin Client:** `const supabaseAdmin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);`
        *   [X] **Request Handling:**
            *   [X] Extract `email`, `fullName` (optional), `roleId`, and `organizationId` from the incoming request body.
            *   [X] Validate inputs (e.g., ensure required fields are present, email format is valid).
        *   [X] **Check for Existing User/Membership (Optional but Recommended):**
            *   [X] *Advanced:* Before inviting, you might query if a user with this email already exists.
            *   [X] *Advanced:* If they exist, check if they are already a member of `organizationId`.
            *   [X] *Advanced:* Return specific error messages/codes if user is already a member or already invited but hasn't accepted.
        *   [X] **Supabase Auth Invitation:**
            *   [X] Call `await supabaseAdmin.auth.admin.inviteUserByEmail({ email: userEmail, data: { full_name: userFullName, target_organization_id: orgId, target_role_id: roleIdForInvite, app_name: 'YourApplicationName' /* or similar for email template */ } });`
            *   The `data` object here is critical. It will be embedded in the invitation and available in `NEW.raw_app_meta_data` when the user signs up, for use by the database trigger.
        *   [X] **Error Handling:** Wrap the `inviteUserByEmail` call in a `try...catch` block.
            *   [X] Catch errors from Supabase (e.g., user already invited, invalid email format).
            *   [X] Return appropriate error responses (e.g., JSON with an error message and status code).
        *   [X] **Success Response:** Return a success response (e.g., JSON with a success message and status code 200).
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
    1.  **SQL Function (`handle_invitation_acceptance`):**
        *   [X] **Purpose:** To be executed by the trigger after a new user is inserted into `auth.users`.
        *   [X] **Logic:**
            *   [X] Access `NEW.id` (the new user's UUID), `NEW.email`.
            *   [X] Access `NEW.raw_user_meta_data` (this contains `invited_to_org`, `assigned_role_id`, `full_name` passed from the Edge Function's invitation `data` payload).
            *   [X] Extract `invited_org_id := NEW.raw_user_meta_data->>'invited_to_org'`
            *   [X] Extract `assigned_role_id := NEW.raw_user_meta_data->>'assigned_role_id'`
            *   [X] **Create Membership:** If `invited_to_org` and `assigned_role_id` are not null, insert a row into `public.organization_memberships`.
            *   [X] **Set Active Organization:** Update `auth.users.raw_app_meta_data` to set `active_organization_id`.
            *   [X] Return `NEW`.
    2.  **Create Trigger:**
        *   [X] **Name:** `on_invitation_acceptance`
        *   [X] **Table:** `auth.users`
        *   [X] **Event:** `AFTER UPDATE` (when email is confirmed)
        *   [X] **Action:** `EXECUTE FUNCTION public.handle_invitation_acceptance();`
    3.  **Apply SQL:** Add the function and trigger to your database via a migration script or Supabase Studio.
*   **Testing (Trigger & Function):**
    1.  [ ] Ensure the Edge Function (`invite-member`) is working.
    2.  [ ] Send an invitation to a **new email address** not yet in `auth.users`.
    3.  [ ] Click the invitation link in the received email and complete the signup process.
    4.  [ ] **Verify Database State:**
        *   [ ] Check `auth.users` for the new user. Confirm `raw_user_meta_data` contains the invitation data.
        *   [ ] Check `public.profiles` for a new entry for this user with their `full_name` (if provided).
        *   [ ] Check `public.organization_memberships` for a new entry linking the user to the target organization with the target role.
        *   [ ] Verify `active_organization_id` in `auth.users.app_metadata`.
    5.  [ ] Test with and without `fullName` provided in the invitation.

---

**Phase 4: Client-Side Onboarding Experience**

*   **Task:** Create a user-friendly onboarding experience for users who accept invitations.
    1.  **Onboarding Page (`app/onboarding/page.tsx`):**
        *   [X] **Create Component:** Simple, clean onboarding form with:
            *   [X] Full Name (text input, prefilled if provided in invitation).
            *   [X] Password & Confirm Password (if new user).
        *   [X] **State Management:**
            *   [X] Parse URL parameters from Supabase Auth invitation link.
            *   [X] Extract metadata (organization, role) from user object.
            *   [X] Handle loading, error, and success states.
        *   [X] **Form Validation:**
            *   [X] Name required.
            *   [X] Passwords match and meet length requirements (if applicable).
        *   [X] **Onboarding Logic:**
            *   [X] For new users: Set password, update profile name.
            *   [X] For existing users: Just create organization membership.
            *   [X] Update active organization if needed.
            *   [X] Redirect to dashboard/home page after completion.
    2.  **Success & Error Handling:**
        *   [X] **Feedback:** Clear messages for:
            *   [X] Invalid/expired invitation links.
            *   [X] Successful account setup.
            *   [X] Server errors during setup.
*   **Testing (Onboarding):**
    1.  [ ] Test with new user invitations (should show password fields).
    2.  [ ] Test with existing user invitations (should just add to organization).
    3.  [ ] Test error paths (invalid tokens, expired links).
    4.  [ ] Verify redirection to appropriate page after completion.
    5.  [ ] Check mobile responsiveness of onboarding form.

---

**Phase 5: End-to-End Testing & Refinements**

*   **Task:** Test the entire flow from an admin's perspective and the invited user's perspective.
    1.  **Admin Flow:**
        *   [ ] Admin in Org A invites a new email address with a specific role (e.g., 'member').
        *   [ ] Verify success toast.
    2.  **Invited User Flow:**
        *   [ ] User receives email, clicks link, signs up.
        *   [ ] User logs in.
        *   [ ] Verify they have access to Org A's resources according to the 'member' role.
        *   [ ] Verify their `active_organization_id` is set correctly.
    3.  **Admin View Update:**
        *   [ ] After the invited user completes signup, the admin should now see the new user in the member list with the correct name, email, and role.
    4.  **Error Case Handling:**
        *   [ ] Test inviting an email that is already a member of the organization.
        *   [ ] Test inviting an email that has already been invited but hasn't accepted.
        *   [ ] Test any other edge cases identified.
    5.  **UI/UX Refinements:**
        *   [ ] Ensure all loading states, success messages, and error messages are clear and user-friendly.

---

**(Final Review: Add Member invitation flow is secure, reliable, and provides a good user experience for both the inviting admin and the invited user.)** 