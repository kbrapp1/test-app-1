# User Signup & Automatic Organization Creation - Build Steps

This document outlines the steps to implement the flow where a new user signing up automatically gets a new organization created for them, and they become the owner/admin of that organization. This complements the main `multi-tenant-build-steps.md`.

**Note:** Steps assume that the foundational database schema for `organizations` and `organization_memberships` (as detailed in `multi-tenant-build-steps.md` Phase 1) is already in place or will be implemented concurrently.

## Phase 1: Backend - Core Logic & Actions

**Step 1: Define Organization Naming Strategy & User Context**
*   [ ] **Decision:** Determine the default naming convention for newly created organizations.
    *   Example: "[User's Display Name]'s Workspace" or "My Organization".
*   [ ] **Planning:** Identify how to obtain the user's display name post-signup.
    *   This could be from the signup form data or derived from the user's email if a display name isn't explicitly provided.
*   [ ] **Decision:** Define the default role for the user in their new organization (e.g., 'owner' or 'admin').

**Step 2: Implement/Verify `createOrganizationAndAddOwner` Server Action**
*   [ ] **Action Design:** Based on `multi-tenant-build-steps.md` (Step 5 - New Actions), ensure a robust server action exists. This might be a new action or an enhancement of a basic `createOrganization` action.
    *   Name: e.g., `createOrganizationForNewUser(userId: string, userDisplayName?: string): Promise<{ success: boolean; organizationId?: string; error?: string }>`
    *   Inputs: `userId` (of the newly signed-up user), `userDisplayName` (optional, for naming).
*   [ ] **Action Logic:**
    *   [ ] Generate the organization name based on the strategy in Step 1.
    *   [ ] Create a new record in the `organizations` table (e.g., with `name`, `owner_user_id = userId`).
    *   [ ] Create a new record in the `organization_memberships` table linking the `userId` to the new `organization_id` with the defined default role (e.g., 'owner').
    *   [ ] Return the `organization_id` on success.
    *   [ ] Implement comprehensive error handling (e.g., if database insertion fails).
*   [ ] **Testing:**
    *   [ ] Write unit tests for this server action.
    *   [ ] Test successful creation and owner assignment.
    *   [ ] Test error scenarios (e.g., invalid `userId`).

**Step 3: Implement JWT/Session Update Mechanism**
*   [ ] **Planning:** Determine how the user's `active_organization_id` claim in the JWT (or session state) will be updated after the new organization is created. This is crucial for RLS to function correctly.
    *   This might involve calling a Supabase Edge Function that mints a new token with the updated claims.
    *   Alternatively, if using session cookies, update the session data server-side and ensure the cookie is refreshed.
*   [ ] **Implementation:** Develop the server-side function/utility responsible for updating the JWT claims or session.
    *   Input: `userId`, `newActiveOrganizationId`.
*   [ ] **Testing:**
    *   [ ] Verify that after this mechanism is triggered, a new JWT (if applicable) contains the correct `active_organization_id`.
    *   [ ] Test scenarios where token refresh/session update might fail.

**(Review Point 1: Core backend actions for creating an organization for a new user and updating their session context are implemented and tested.)**

## Phase 2: Signup Flow Integration

**Step 4: Modify User Signup Server-Side Logic**
*   [ ] **Integration Point:** Identify the exact location in your server-side signup handling code (e.g., Supabase auth callback handler, a dedicated server action called by the signup form) *after* the user record is successfully created in `auth.users`.
*   [ ] **Retrieve User Info:** Get the `id` and any available display name (e.g., `raw_user_meta_data.full_name` or `email`) of the newly created user.
*   [ ] **Orchestration:**
    *   [ ] Call the `createOrganizationForNewUser` action (from Step 2) with the new user's ID and display name.
    *   [ ] If organization creation is successful:
        *   [ ] Call the JWT/Session update mechanism (from Step 3) to set the new organization as active.
    *   [ ] **Error Handling:**
        *   What happens if organization creation fails? Log the error. Decide if the user signup process should be rolled back (if possible) or if the user is created but left without an initial organization (less ideal).
        *   What happens if JWT/session update fails? Log the error. The user might be logged in but without a proper organization context, potentially leading to issues.
*   [ ] **Client Response:** Ensure the server response to the client-side signup attempt indicates overall success and potentially includes information to guide redirection (e.g., to a dashboard within the new organization).
*   [ ] **Testing:**
    *   [ ] Conduct end-to-end testing of the entire signup flow.
    *   [ ] Verify:
        *   A new user is created in `auth.users`.
        *   A new organization is created in `organizations` linked to the user.
        *   A membership record is created in `organization_memberships`.
        *   The user's JWT/session correctly reflects the `active_organization_id`.
    *   [ ] Test edge cases (e.g., network errors during one of the action calls).

**Step 5: Client-Side Signup Flow Adjustments (Minimal)**
*   [ ] **Redirection:** Ensure that upon successful signup and organization creation, the client-side application redirects the user to an appropriate page (e.g., the main dashboard of their new organization, a welcome page).
    *   This redirection logic should now be able to rely on the `active_organization_id` being present in the user's context.
*   [ ] **UI Feedback:** Provide clear UI feedback to the user during the signup process (e.g., "Creating your workspace...").
*   [ ] **No Naming Prompt (Initially):** For fully automatic creation, the user is not prompted to name the organization during signup. Renaming can be a post-signup feature.
*   [ ] **Testing:**
    *   [ ] Verify smooth redirection after successful signup.
    *   [ ] Check that the user lands in a state where their new organization is active.

**(Review Point 2: User signup flow correctly triggers automatic organization creation and establishes the user's context within that new organization.)**

## Phase 3: Post-Signup - Organization Management UI (Placeholder for Renaming)

**Step 6: Plan for Organization Renaming UI (Reference)**
*   [ ] **Requirement:** Users (especially owners/admins) should be able to rename their organization after it's created.
*   [ ] **UI Location:** Confirm where this functionality will reside. As per `multi-tenant-build-steps.md` (Step 8 - Organization Management UI), this would likely be in a dedicated "Organization Settings" section.
    *   Example Path: `Settings > Organization > General Settings`.
*   [ ] **Components:** A simple form with an input field for the new organization name and a save button.
*   [ ] *Note:* This phase focuses on *planning the placeholder* for future UI work, ensuring the automatic creation flow doesn't preclude later customization. The actual implementation of this UI can follow separately.

**Step 7: Design `renameOrganization` Server Action (High-Level)**
*   [ ] **Action Definition (Future):** `renameOrganization(organizationId: string, newName: string): Promise<{ success: boolean; error?: string }>`
*   [ ] **Logic (Future):**
    *   [ ] Authorization: Verify the calling user is an admin/owner of the `organizationId`.
    *   [ ] Validation: Check if `newName` is valid (e.g., not empty, length constraints).
    *   [ ] Database: Update the `name` of the organization in the `organizations` table.
    *   [ ] Cache/Path Revalidation: `revalidatePath` if the organization name is displayed in cached components.
*   [ ] *Note:* Detailed implementation and testing of this action can occur when building the Organization Management UI.

**(Review Point 3: The automatic organization creation flow is designed to integrate with future organization management capabilities like renaming.)**

## Phase 4: Documentation & Final Review

**Step 8: Update User Documentation**
*   [ ] Document the new user signup experience, explaining that a personal workspace/organization is automatically created.
*   [ ] Briefly mention how users can later manage their organization settings (including renaming, once that feature is built).

**Step 9: Technical Documentation**
*   [ ] Ensure server actions, new flows, and any Supabase functions or triggers involved are documented for developers.
*   [ ] Link this document from the main `multi-tenant-build-steps.md` where relevant (e.g., in Step 4 - Auth - Modify user sign-up flow).

**Step 10: Final Testing & Review**
*   [ ] Conduct a final round of end-to-end testing with new user signups.
*   [ ] Review code changes related to this flow for clarity, security, and error handling.
*   [ ] Ensure RLS policies are respected and effective with the new `active_organization_id`.

**(Final Review: New users are seamlessly onboarded into their own dedicated organization, setting the stage for a multi-tenant experience.)** 