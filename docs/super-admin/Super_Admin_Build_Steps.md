# Super Admin System - Implementation Build Steps

This document outlines the step-by-step process for implementing a robust super admin system that provides organization-wide access to all features and data. Super admins can only be managed through direct database access for maximum security.

**Assumptions:**

*   [X] You are working with a Supabase PostgreSQL database.
*   [X] You have existing tables: `organizations`, `organization_memberships`, `profiles`, `assets`, `folders`, etc.
*   [X] You have existing RLS policies protecting organizational data.
*   [X] Your application has authentication context and permission utilities.
*   [X] You have access to Supabase SQL editor for direct database operations.

---

**Phase 1: Database Schema Changes**

*   **Task:** Create the foundational database structure for super admin functionality.
    1.  **Add Super Admin Column:**
        *   [X] **Migration:** Create migration file `add_super_admin_support.sql`.
        *   [X] **Column:** Add `is_super_admin BOOLEAN DEFAULT FALSE NOT NULL` to `public.profiles` table.
        *   [X] **Index:** Create performance index `idx_profiles_super_admin` on `is_super_admin` column where true.
        *   [X] **Comment:** Add descriptive comment explaining the column purpose.
    2.  **Create Audit Trail Table:**
        *   [X] **Table:** Create `public.super_admin_audit` table with:
            *   [X] `id` (UUID primary key)
            *   [X] `user_id` (UUID, references auth.users)
            *   [X] `action` (TEXT, check constraint: 'granted' or 'revoked')
            *   [X] `granted_by_user_id` (UUID, references auth.users, nullable)
            *   [X] `created_at` (TIMESTAMP WITH TIME ZONE)
            *   [X] `notes` (TEXT, nullable)
        *   [X] **RLS:** Enable RLS on audit table.
        *   [X] **Policy:** Create policy allowing only super admins to view audit logs.
        *   [X] **Comments:** Add table and column comments for documentation.
    3.  **Apply Migration:**
        *   [X] **Deploy:** Apply migration to development database.
        *   [X] **Verify:** Confirm tables and columns created successfully.
        *   [X] **Test:** Ensure existing functionality still works.

*   **Testing (Database Schema):**
    1.  [X] Verify `profiles` table has `is_super_admin` column with correct default and constraints.
    2.  [X] Verify `super_admin_audit` table exists with all required columns and constraints.
    3.  [X] Verify RLS is enabled on audit table and basic policies work.
    4.  [X] Test inserting sample data into both tables manually.

---

**Phase 2: Database Functions**

*   **Task:** Create secure database functions for managing super admin privileges.
    1.  **Super Admin Check Function:**
        *   [X] **Function:** Create `public.is_super_admin(user_id UUID DEFAULT auth.uid())`.
        *   [X] **Returns:** BOOLEAN indicating super admin status.
        *   [X] **Security:** Set as STABLE and SECURITY DEFINER.
        *   [X] **Logic:** Query profiles table and return COALESCE result (default FALSE).
        *   [X] **Comment:** Add function documentation.
    2.  **Grant Super Admin Function:**
        *   [X] **Function:** Create `public.grant_super_admin(target_user_id UUID, notes TEXT DEFAULT NULL)`.
        *   [X] **Security:** SECURITY DEFINER with proper authorization checks.
        *   [X] **Logic:** 
            *   [X] Verify caller is super admin or no auth context (direct SQL).
            *   [X] Update profiles table to set `is_super_admin = TRUE`.
            *   [X] Insert audit record with action 'granted'.
        *   [X] **Returns:** BOOLEAN success indicator.
        *   [X] **Error Handling:** Proper exception handling for unauthorized access.
    3.  **Revoke Super Admin Function:**
        *   [X] **Function:** Create `public.revoke_super_admin(target_user_id UUID, notes TEXT DEFAULT NULL)`.
        *   [X] **Security:** SECURITY DEFINER with authorization checks.
        *   [X] **Logic:**
            *   [X] Verify caller is super admin or no auth context.
            *   [X] Prevent self-revocation if last super admin.
            *   [X] Update profiles table to set `is_super_admin = FALSE`.
            *   [X] Insert audit record with action 'revoked'.
        *   [X] **Returns:** BOOLEAN success indicator.
        *   [X] **Error Handling:** Handle last super admin protection.
    4.  **Deploy Functions:**
        *   [X] **Apply:** Deploy all functions to database.
        *   [X] **Test:** Test each function with direct SQL calls.

*   **Testing (Database Functions):**
    1.  [X] Test `is_super_admin()` function with regular user (should return FALSE).
    2.  [X] Test `grant_super_admin()` function to grant privileges to test user.
    3.  [X] Verify audit record is created when granting privileges.
    4.  [X] Test `revoke_super_admin()` function to remove privileges.
    5.  [X] Test last super admin protection (should prevent revocation).
    6.  [X] Test unauthorized access to grant/revoke functions.

---

**Phase 3: RLS Policy Updates**

*   **Task:** Update existing RLS policies to include super admin bypass functionality.
    1.  **Identify Existing Policies:**
        *   [X] **Audit:** List all existing RLS policies that use hardcoded UUIDs.
        *   [X] **Document:** Create list of policies that need updating.
        *   [X] **Priority:** Identify critical policies (assets, folders, organizations).
    2.  **Update Core Entity Policies:**
        *   [X] **Assets Policy:** Update to use `public.is_super_admin() OR organization_id = public.get_active_organization_id()`.
        *   [X] **Folders Policy:** Update to use super admin function in USING and WITH CHECK clauses.
        *   [X] **Organizations Policy:** Add super admin bypass for viewing and managing all organizations.
        *   [X] **Organization Memberships:** Add super admin policy for managing all memberships.
    3.  **Update Supporting Entity Policies:**
        *   [X] **Profiles Policy:** Ensure super admins can view all profiles.
        *   [X] **Roles Policy:** Allow super admins to manage roles across organizations.
        *   [X] **Asset Tags Policy:** Add super admin bypass to asset_tags table policies.
        *   [X] **Organization Domains:** Add super admin policies for organization domain management.
        *   [X] **Saved Searches:** Add super admin access to saved searches across organizations.
        *   [X] **Team Members:** Add super admin access to team member management.
        *   [X] **TTS Predictions:** Add super admin bypass to TtsPrediction table policies.
        *   [X] **Other Tables:** Update any other organization-scoped policies.
    4.  **Remove Hardcoded UUIDs:**
        *   [X] **Search:** Find all hardcoded UUID references in policies.
        *   [X] **Replace:** Replace with `public.is_super_admin()` function calls.
        *   [X] **Verify:** Ensure no hardcoded super admin UUIDs remain.
        *   [X] **Complete:** All RLS policies now include proper super admin support.

*   **Testing (RLS Policies):**
    1.  [X] Test regular user access (should be unchanged).
    2.  [X] Test super admin access to all organizations' data.
    3.  [X] Test super admin access to assets across organizations.
    4.  [X] Test super admin access to folders across organizations.
    5.  [X] Verify super admin can manage organization memberships.
    6.  [X] Test policy performance (no significant degradation).

---

**Phase 4: Application Layer Integration**

*   **Task:** Update TypeScript types and authentication context to support super admin functionality.
    1.  **TypeScript Types:**
        *   [X] **Profile Type:** Add `is_super_admin: boolean` to Profile interface.
        *   [X] **Audit Type:** Create `SuperAdminAuditEntry` interface with all audit fields.
        *   [X] **Permission Types:** Add super admin related permission types.
        *   [X] **Export Types:** Ensure types are properly exported from auth module.
    2.  **Auth Context Updates:**
        *   [X] **Context:** Add `isSuperAdmin: boolean` to AuthContextType interface.
        *   [X] **Hook:** Update `useAuth()` hook to compute `isSuperAdmin` from profile.
        *   [X] **Memoization:** Use `useMemo` for performance optimization.
        *   [X] **Provider:** Update AuthProvider to expose super admin status.
    3.  **Permission Utilities:**
        *   [X] **Function:** Create `canAccessAllOrganizations(profile)` utility.
        *   [X] **Function:** Create `canManageOrganization(profile, orgId)` utility.
        *   [X] **Function:** Create `getAccessibleOrganizations(profile, userOrgs)` utility.
        *   [X] **Export:** Export all permission utilities from auth module.
    4.  **API Integration:**
        1.  **Queries:**
            *   [X] **Enhanced Query Service:** Create `SuperAdminQueryService` that modifies organization filtering based on super admin status.
            *   [X] **Query Options:** Add `SuperAdminQueryOptions` interface with `bypassOrganizationFilter` flag.
            *   [X] **Organization Access:** Implement `getAccessibleOrganizations()` method that returns all organizations for super admin.
            *   [X] **Utility Functions:** Create `queryDataWithSuperAdmin()` wrapper function for easy integration.
        2.  **Mutations:**
            *   [X] **Enhanced Mutation Service:** Create `SuperAdminMutationService` that handles cross-organization operations.
            *   [X] **Organization Validation:** Implement `shouldSkipOrganizationValidation()` logic for super admin.
            *   [X] **Transfer Operations:** Add `transferBetweenOrganizations()` method (super admin only).
            *   [X] **Utility Functions:** Create `insertDataWithSuperAdmin()`, `updateDataWithSuperAdmin()`, `deleteDataWithSuperAdmin()` wrappers.
        3.  **Caching:**
            *   [X] **Enhanced Cache Service:** Create `SuperAdminCacheService` with organization-aware invalidation.
            *   [X] **Cross-Org Invalidation:** Implement cache invalidation for cross-organization transfers.
            *   [X] **Global Cache Patterns:** Add super admin specific cache tags (`super-admin-all-orgs`, `super-admin-data`).
            *   [X] **Utility Functions:** Create `invalidateDamCache()` and `invalidateTeamCache()` wrappers.

*   **Testing (Application Layer):**
    1.  [X] Test auth context correctly identifies super admin status.
    2.  [X] Test permission utilities return correct values for super admins.
    3.  [X] Test permission utilities return correct values for regular users.
    4.  [X] Verify TypeScript compilation with new types.
    5.  [X] Test API calls work correctly for super admin users.

---

**(Phase 4 Summary: Application Layer Integration completed with DDD architecture. Created focused modules for types, permissions, hooks, queries, mutations, and caching with comprehensive test coverage. Super admin functionality now available through clean, type-safe APIs with full cross-organization support.)**

---

**Phase 5: UI Components**

*   **Task:** Create UI components to display and manage super admin functionality.
    1.  **Super Admin Badge Component:**
        *   [X] **Component:** Create `components/auth/SuperAdminBadge.tsx`.
        *   [X] **Props:** Accept `profile` prop and conditionally render.
        *   [X] **Design:** Red badge with shield icon and "Super Admin" text.
        *   [X] **Responsive:** Ensure badge works on mobile and desktop.
        *   [X] **Accessibility:** Add proper ARIA labels and screen reader support.
        *   [X] **Variants:** Create compact and icon-only variants for different UI contexts.
        *   [X] **Tests:** Comprehensive test coverage for all component variants.
    2.  **Organization Selector Updates:**
        *   [X] **Component:** Create `components/auth/OrganizationSelector.tsx`.
        *   [X] **Super Admin View:** Add "All Organizations" option for super admins.
        *   [X] **Data Fetching:** Fetch all organizations when user is super admin.
        *   [X] **Icon:** Add shield icon to indicate super admin mode.
        *   [X] **State Management:** Handle switching between specific org and all orgs.
        *   [X] **Loading States:** Proper loading and error handling.
        *   [X] **Accessibility:** Accessible dropdown with proper ARIA labels.
    3.  **Navigation Updates:**
        *   [X] **Header:** Show super admin badge in user profile area.
        *   [X] **Sidebar:** Integrate super admin badge in nav-user component.
        *   [X] **Breadcrumbs:** Show organization context clearly for super admins.
        *   [X] **Profile Integration:** Fetch and display user profile with super admin status.
    4.  **Admin Interface (Optional):**
        *   [ ] **Component:** Create super admin management interface (if needed).
        *   [ ] **Audit View:** Show audit trail of super admin changes.
        *   [ ] **Note:** Remember that granting/revoking must be done via database.

*   **Testing (UI Components):**
    1.  [ ] Test SuperAdminBadge shows only for super admin users.
    2.  [ ] Test OrganizationSelector shows all organizations for super admins.
    3.  [ ] Test organization switching works correctly for super admins.
    4.  [ ] Test navigation clearly indicates super admin status.
    5.  [ ] Test responsive design on various screen sizes.
    6.  [ ] Test accessibility with screen readers.

---

**Phase 6: Security Setup & Initial Configuration**

*   **Task:** Set up the first super admin and establish security procedures.
    1.  **Create First Super Admin:**
        *   [ ] **Identify User:** Determine who should be the initial super admin.
        *   [ ] **Get User ID:** Find user UUID from Supabase auth.users table.
        *   [ ] **Grant Privileges:** Use SQL to call `grant_super_admin()` function.
        *   [ ] **Verify:** Confirm super admin status in profiles table.
        *   [ ] **Test Access:** Verify super admin can access all organizations.
    2.  **Document Procedures:**
        *   [ ] **Document:** Create procedure for granting super admin access.
        *   [ ] **Document:** Create procedure for revoking super admin access.
        *   [ ] **Document:** Create procedure for auditing super admin changes.
        *   [ ] **Access Control:** Document who has database access for management.
    3.  **Security Validation:**
        *   [ ] **Verify:** Confirm no API endpoints exist for granting super admin.
        *   [ ] **Verify:** Confirm audit trail is working correctly.
        *   [ ] **Verify:** Confirm super admin status is visible in UI.
        *   [ ] **Test:** Attempt to grant super admin via application (should fail).

*   **Testing (Security Setup):**
    1.  [ ] Verify first super admin has access to all organization data.
    2.  [ ] Test that super admin status persists across login sessions.
    3.  [ ] Verify audit trail captures super admin privilege changes.
    4.  [ ] Test that regular users cannot access super admin functions.
    5.  [ ] Verify no application-level endpoints can grant super admin access.

---

**Phase 7: End-to-End Testing & Documentation**

*   **Task:** Comprehensive testing and documentation of the super admin system.
    1.  **Complete Feature Testing:**
        *   [ ] **Cross-Organization Access:** Test super admin accessing multiple organizations' data.
        *   [ ] **Asset Management:** Test super admin managing assets across organizations.
        *   [ ] **User Management:** Test super admin managing users across organizations.
        *   [ ] **Folder Management:** Test super admin managing folders across organizations.
        *   [ ] **Permission Inheritance:** Verify super admin bypasses all RLS policies.
    2.  **Security Testing:**
        *   [ ] **Privilege Escalation:** Test that regular users cannot escalate to super admin.
        *   [ ] **Function Security:** Test grant/revoke functions with unauthorized access.
        *   [ ] **Audit Integrity:** Verify audit trail cannot be tampered with.
        *   [ ] **Session Security:** Test super admin session handling.
    3.  **Performance Testing:**
        *   [ ] **Query Performance:** Test that super admin queries perform adequately.
        *   [ ] **RLS Performance:** Verify updated policies don't significantly impact performance.
        *   [ ] **Large Data Sets:** Test super admin access with large amounts of data.
    4.  **Documentation:**
        *   [ ] **Update README:** Add super admin documentation to project README.
        *   [ ] **API Documentation:** Document any super admin related API changes.
        *   [ ] **Deployment Guide:** Create deployment checklist for production.
        *   [ ] **Troubleshooting:** Document common issues and solutions.
    5.  **Rollback Plan:**
        *   [ ] **Document:** Create rollback procedures for super admin system.
        *   [ ] **Test:** Test rollback procedures in development.
        *   [ ] **SQL Scripts:** Prepare rollback SQL scripts.

*   **Testing (End-to-End):**
    1.  [ ] Test complete user journey from regular user to super admin (via database).
    2.  [ ] Test super admin performing cross-organizational tasks.
    3.  [ ] Test system behavior with multiple super admins.
    4.  [ ] Test system behavior with no super admins (emergency scenarios).
    5.  [ ] Test rollback procedures restore system to pre-super-admin state.
    6.  [ ] Load test system with super admin accessing large data sets.

---

**Phase 8: Production Deployment**

*   **Task:** Deploy super admin system to production with proper safeguards.
    1.  **Pre-Deployment Checklist:**
        *   [ ] **Testing:** All phases tested and verified in staging environment.
        *   [ ] **Documentation:** All documentation complete and reviewed.
        *   [ ] **Backup:** Database backup taken before deployment.
        *   [ ] **Rollback:** Rollback procedures tested and ready.
        *   [ ] **Team Training:** Team trained on super admin management procedures.
    2.  **Deployment Steps:**
        *   [ ] **Database Migration:** Apply super admin migration to production.
        *   [ ] **Function Deployment:** Deploy super admin functions to production.
        *   [ ] **Application Deployment:** Deploy application changes to production.
        *   [ ] **Verification:** Verify deployment successful and system functional.
    3.  **Post-Deployment:**
        *   [ ] **Create Super Admin:** Create initial production super admin.
        *   [ ] **Test Access:** Verify super admin access works in production.
        *   [ ] **Monitor:** Monitor system for any issues or performance impacts.
        *   [ ] **Document:** Document production super admin accounts.

*   **Testing (Production):**
    1.  [ ] Verify migration applied successfully to production database.
    2.  [ ] Test super admin functionality in production environment.
    3.  [ ] Verify existing users and functionality unaffected.
    4.  [ ] Test performance under production load.
    5.  [ ] Verify audit trail working in production.

---

**(Final Review: Super admin system is secure, auditable, and provides appropriate access controls for organization-wide administration.)** 