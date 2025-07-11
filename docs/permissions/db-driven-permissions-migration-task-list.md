# Database-Driven Permissions Migration Task List

This checklist will guide the migration from a hardcoded, in-memory TypeScript role-permission mapping to a dynamic, database-driven permission system.

## Database Layer
- [ ] **Design normalized schema for roles and permissions**
    - [ ] Create `roles` table (id, name, description)
    - [ ] Create `permissions` table (id, name, description)
    - [ ] Create `role_permissions` join table (role_id, permission_id)
- [ ] **Seed initial data**
    - [ ] Migrate current TypeScript mapping into database seed/migration scripts
    - [ ] Ensure all roles and permissions are present
- [ ] **Add admin UI for managing roles/permissions** (optional, for future)

## Application Layer
- [ ] **Implement data loader for role-permission mapping**
    - [ ] On app startup, load mapping from database into memory
    - [ ] Add periodic refresh or webhook-based cache invalidation
- [ ] **Replace hardcoded ROLE_PERMISSIONS with dynamic loader**
    - [ ] Refactor all permission checks to use loaded mapping
    - [ ] Ensure type safety with TypeScript enums/types
- [ ] **Handle missing or inconsistent data gracefully**
    - [ ] Add error handling for missing roles/permissions
    - [ ] Fallback to safe defaults (deny access)

## Testing & Validation
- [ ] **Write unit tests for new loader and permission checks**
- [ ] **Integration tests for dynamic permission changes**
    - [ ] Test updating permissions in DB and seeing changes reflected in app
- [ ] **Manual QA for admin UI (if built)**

## Deployment & Rollout
- [ ] **Backfill production database with current mapping**
- [ ] **Deploy new code with dynamic loader**
- [ ] **Monitor for errors or permission mismatches**
- [ ] **Document migration and update developer onboarding docs**

---

**Result:**
- Permissions are managed in the database, not code
- Admins can update permissions without redeploying
- All permission checks are fast, secure, and up-to-date 