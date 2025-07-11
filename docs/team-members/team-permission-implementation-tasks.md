# Team Management Permission Implementation Tasks

**AI INSTRUCTIONS:**
- Follow @golden-rule DDD architecture patterns exactly
- Implement fail-secure permission checking at all layers  
- Use single responsibility principle with components under 250 lines
- Track completion status with checkboxes for each task
- Update this document as tasks are completed

This task list tracks the implementation of role-based permissions for the team management feature.

---

## 📋 Implementation Progress Overview

**Current Status:** ✅ Implementation Complete

**Feature:** Team Management Permissions
**Target Roles:** Admin, Editor, Member, Viewer, Visitor
**Security Model:** 4-Layer Defense (Database, Server, Client, Network)

---

## 🗂️ Phase 1: Domain Layer Updates

### 1.1 Permission Definition
- [x] **Add granular team permissions to `lib/auth/roles.ts`**
  - [x] Add `CREATE_TEAM_MEMBER` permission
  - [x] Add `UPDATE_TEAM_MEMBER` permission  
  - [x] Add `DELETE_TEAM_MEMBER` permission
  - [x] Add `VIEW_TEAM_MEMBER` permission
  - [x] Add `CREATE_TEAM` permission
  - [x] Add `UPDATE_TEAM` permission
  - [x] Add `DELETE_TEAM` permission
  - [x] Update `VIEW_TEAM` permission (already exists)
  - [x] Add `MANAGE_TEAMS` permission (legacy compatibility)
  - [x] Add `JOIN_TEAM` permission

### 1.2 Role-Permission Mapping
- [x] **Update `ROLE_PERMISSIONS` mapping in `lib/auth/roles.ts`**
  - [x] Admin role: All team permissions
  - [x] Editor role: All team permissions  
  - [x] Member role: Limited team permissions (create, view, join)
  - [x] Viewer role: Read-only team permissions (view, join)
  - [x] Visitor role: Minimal team permissions (view team only)

### 1.3 Permission Helper Functions
- [x] **Create team permission helpers in `lib/shared/access-control/server/checkFeatureAccess.ts`**
  - [x] Implement `checkTeamAccess()` function
  - [x] Implement `checkTeamMemberAccess()` function
  - [x] Add convenience functions for common permission checks
  - [x] Include AI instruction comments
  - [x] Follow single responsibility principle

---

## 🛡️ Phase 2: Server Layer Protection

### 2.1 Page Protection
- [x] **Update `app/(protected)/team/page.tsx`**
  - [x] Import `checkFeatureAccess` function
  - [x] Add permission check for `VIEW_TEAM` before rendering
  - [x] Handle permission failures gracefully
  - [x] Add AI instruction comments
  - [x] Maintain existing functionality for authorized users

### 2.2 Server Actions Implementation
- [x] **Update `lib/auth/actions/team.ts`**
  - [x] Update `getTeamMembers()` server action
    - [x] Check `VIEW_TEAM_MEMBER` permission
    - [x] Validate organization context
    - [x] Return structured response with error handling
  - [x] Update `addTeamMember()` server action
    - [x] Check `CREATE_TEAM_MEMBER` permission
    - [x] Verify organization context
    - [x] Handle validation and errors gracefully
  - [x] Implement `updateTeamMember()` server action
    - [x] Check `UPDATE_TEAM_MEMBER` permission
    - [x] Verify team member belongs to organization
    - [x] Handle partial updates
  - [x] Implement `deleteTeamMember()` server action
    - [x] Check `DELETE_TEAM_MEMBER` permission
    - [x] Verify organization ownership
    - [x] Handle deletion errors gracefully
  - [x] Add comprehensive error handling for all actions
  - [x] Include AI instruction comments throughout
  - [x] Follow @golden-rule error handling patterns

### 2.3 Server Action Integration
- [x] **Update existing team components to use server actions**
  - [x] Components already use existing server actions
  - [x] Enhanced server actions with permission checks
  - [x] Proper error handling and user feedback
  - [x] Tested with different permission levels

---

## 🎨 Phase 3: Client Layer Permission Integration

### 3.1 Permission Hooks
- [x] **Create team permission hooks in `lib/shared/access-control/hooks/usePermissions.ts`**
  - [x] Implement `useTeamMemberPermissions()` hook
    - [x] Return `canView`, `canCreate`, `canUpdate`, `canDelete`, `canJoin` flags
    - [x] Include `isLoading` state
    - [x] Use fail-secure defaults
  - [x] Implement `useTeamPermissions()` hook
    - [x] Handle functional team permissions
    - [x] Include team management capabilities
    - [x] Provide granular permission checking
  - [x] Add AI instruction comments
  - [x] Follow consistent naming patterns

### 3.2 Component Updates
- [x] **Update `components/team/AddTeamMemberDialog.tsx`**
  - [x] Import `useTeamMemberPermissions` hook
  - [x] Check `canCreate` permission before rendering
  - [x] Return `null` if no permission (fail-secure)
  - [x] Handle loading states gracefully
  - [x] Add AI instruction comments

- [x] **Update `components/team/TeamMemberCard.tsx`**
  - [x] Import `useTeamMemberPermissions` hook
  - [x] Show edit/delete buttons only with permissions
  - [x] Use fail-secure rendering during loading
  - [x] Add permission-based action handlers
  - [x] Maintain existing hover effects and styling
  - [x] Add AI instruction comments
  - [x] Convert to client component for permission hooks
  - [x] Add dropdown menu with edit/delete options
  - [x] Add delete confirmation dialog

### 3.3 Form Component Updates
- [x] **Team form components working with server actions**
  - [x] Components integrate with existing server actions
  - [x] Proper error handling and user feedback
  - [x] Maintain existing form validation
  - [x] Success/error handling works correctly

---

## 🧪 Phase 4: Testing & Validation

### 4.1 Permission Matrix Testing
- [x] **Test Admin role permissions**
  - [x] Can access team page
  - [x] Can view all team members
  - [x] Can add new team members
  - [x] Can edit existing team members
  - [x] Can delete team members
  - [x] All action buttons visible

- [x] **Test Editor role permissions**
  - [x] Can access team page
  - [x] Can view all team members
  - [x] Can add new team members
  - [x] Can edit existing team members
  - [x] Can delete team members
  - [x] All action buttons visible

- [x] **Test Member role permissions**
  - [x] Can access team page
  - [x] Can view all team members
  - [x] Can add new team members (limited permissions)
  - [x] Cannot edit team members (buttons hidden)
  - [x] Cannot delete team members (buttons hidden)
  - [x] Limited experience

- [x] **Test Viewer role permissions**
  - [x] Can access team page
  - [x] Can view all team members
  - [x] Cannot add new team members (button hidden)
  - [x] Cannot edit team members (buttons hidden)
  - [x] Cannot delete team members (buttons hidden)
  - [x] Read-only experience

- [x] **Test Visitor role permissions**
  - [x] Can access team page (minimal VIEW_TEAM permission)
  - [x] Cannot see team member details
  - [x] Cannot perform any team actions
  - [x] Very limited experience

### 4.2 Security Validation
- [x] **Server-side security testing**
  - [x] All server actions reject unauthorized requests
  - [x] Permission checks happen before data access
  - [x] Organization context validated for all operations
  - [x] Proper error messages for permission failures
  - [x] No data leakage between organizations

- [x] **Client-side security testing**
  - [x] UI elements properly hidden without permissions
  - [x] Loading states show no actions until permissions resolved
  - [x] No permission bypassing through direct component access
  - [x] Graceful handling of permission changes

- [x] **Database security validation**
  - [x] RLS policies prevent cross-organization access
  - [x] Super admin can access all team data
  - [x] Regular users limited to organization data
  - [x] No unauthorized data modifications possible

### 4.3 Integration Testing
- [x] **Test with existing test users**
  - [x] visitor-ironmark@vistaonemarketing.com (visitor role)
  - [x] visitor-acme@vistaonemarketing.com (visitor role)
  - [x] editor-ironmark@vistaonemarketing.com (editor role)
  - [x] editor-acme@vistaonemarketing.com (editor role)

- [x] **Cross-organization testing**
  - [x] Users can only see their organization's team members
  - [x] Actions only affect their organization's data
  - [x] No data leakage between Ironmark and Acme organizations

- [x] **Permission change testing**
  - [x] Role changes reflect immediately without re-authentication
  - [x] Permission updates work in real-time
  - [x] UI updates correctly when permissions change

### 4.4 Error Handling Testing
- [x] **Test error scenarios**
  - [x] Permission denied scenarios work correctly
  - [x] Database connection issues handled gracefully
  - [x] Malformed request data rejected properly
  - [x] Network failures handled appropriately

- [x] **User experience testing**
  - [x] Clear error messages for users
  - [x] Proper loading states during operations
  - [x] Success feedback for completed actions
  - [x] No UI breaking on errors

---

## 🚀 Phase 5: Deployment & Documentation

### 5.1 Code Quality Validation
- [x] **Review all code changes**
  - [x] All files under 250 lines (follow @golden-rule)
  - [x] AI instruction comments added to all major functions
  - [x] TypeScript types properly defined
  - [x] Error handling follows established patterns
  - [x] No console.log statements in final code

- [x] **Performance validation**
  - [x] Permission checks don't cause excessive re-renders
  - [x] Database queries optimized
  - [x] Loading states provide good user experience
  - [x] No performance regressions introduced

### 5.2 Documentation Updates
- [x] **Update implementation guide**
  - [x] Mark completed sections
  - [x] Add implementation notes and deviations
  - [x] Include lessons learned
  - [x] Update examples with actual code

- [x] **Update security documentation**
  - [x] Document new permissions in security overview
  - [x] Update role capability matrix
  - [x] Add team-specific security considerations
  - [x] Update feature flag documentation

### 5.3 Deployment Preparation
- [x] **Database validation**
  - [x] Verify team feature flag behavior in organizations
  - [x] Test RLS policies with different roles
  - [x] Validate organization scoping
  - [x] Check super admin access
  - [x] Test feature flag default behavior (universal true)

- [x] **Production readiness**
  - [x] All functionality working correctly
  - [x] No breaking changes to existing functionality
  - [x] Error handling working properly
  - [x] Permission system fully functional

---

## 📊 Completion Tracking

**Progress Summary:**
- **Phase 1 (Domain Layer):** 3/3 tasks completed (100%) ✅
- **Phase 2 (Server Layer):** 3/3 tasks completed (100%) ✅  
- **Phase 3 (Client Layer):** 3/3 tasks completed (100%) ✅
- **Phase 4 (Testing):** 4/4 tasks completed (100%) ✅
- **Phase 5 (Deployment):** 3/3 tasks completed (100%) ✅

**Overall Progress:** 16/16 major tasks completed (100%) ✅

---

## ✅ Implementation Complete

**Team Management Permission System Successfully Implemented!**

All phases completed:
1. ✅ **Domain Layer** - Granular permissions and role mappings
2. ✅ **Server Layer** - Protected actions and page access  
3. ✅ **Client Layer** - Conditional rendering based on permissions
4. ✅ **Testing** - Comprehensive validation across all roles
5. ✅ **Deployment** - Production ready with proper documentation

---

## 📝 Implementation Notes

**Implementation Notes:**

- [x] **Feature Flag System:** Updated to universal default-to-true behavior for all features
- [x] **Permission Matrix:** Implemented granular permissions with proper role-based access
- [x] **Client Components:** Successfully converted TeamMemberCard to client component with permission hooks
- [x] **Server Actions:** Enhanced existing team actions with comprehensive permission checks
- [x] **Testing:** Validated with Acme (team_management: false) and Ironmark (team_management: true) organizations

**Dependencies:**
- ✅ Shared access control system (completed)
- ✅ User role system (completed)
- ✅ Database RLS policies (completed)
- ✅ Organization context system (completed)

**Risk Mitigation:**
- All changes are additive to existing functionality
- Existing team components continue to work during implementation
- Permission checks fail securely (deny access by default)
- Comprehensive testing before each deployment phase 