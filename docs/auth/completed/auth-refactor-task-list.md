# Auth Domain Over-Engineering Refactor - Task List

## Overview
Task list for refactoring over-engineered components in the auth domain while maintaining security and performance.

**🎯 Goal:** Remove unused complexity while preserving TTS API optimization and all security features.

---

## Phase 1: Safe Removal (Week 1)

### Preparation
- [x] **Backup current auth domain before starting refactor**
  - Create git branch: `auth-refactor-cleanup`
  - Document current file sizes and complexity metrics
  - Ensure clean working directory

### Investigation
- [x] **Search codebase to confirm if AuthenticationDomainService is actually used anywhere**
  - Search for imports of `AuthenticationDomainService`
  - Check if any methods are called in production code
  - Document findings for decision on deletion vs simplification

### AuthenticationDomainService Cleanup
- [x] **Remove detectSuspiciousActivity method from AuthenticationDomainService (lines 357-396)**
  - Delete `detectSuspiciousActivity()` method
  - Remove related interfaces and types
  - Update imports if needed

- [x] **Remove analyzeLoginAttempts method from AuthenticationDomainService (lines 231-277)**
  - Delete `analyzeLoginAttempts()` method
  - Remove `LoginAttempt` interface if unused elsewhere
  - Clean up related constants

- [x] **Remove unused IP tracking logic and credential stuffing detection from AuthenticationDomainService**
  - Remove IP address tracking code
  - Delete credential stuffing detection logic
  - Clean up related helper methods

### Validation
- [x] **Run full test suite after AuthenticationDomainService simplification**
  - Execute: `pnpm test`
  - Fix any broken tests
  - Ensure TypeScript compilation passes

- [x] **Verify TTS still works with optimized API calls (no regression to 13 calls)**
  - Test TTS functionality in browser
  - Monitor network panel for API call count
  - Confirm `SecurityAwareUserValidationService` still working

---

## Phase 2: Cache Consolidation (Week 2)

### Create New Service
- [x] **Create new SimpleCacheService.ts (~100 lines) to replace specialized cache services**
  - Create `lib/auth/infrastructure/services/SimpleCacheService.ts`
  - Implement unified cache invalidation logic
  - Include super admin cross-organization support
  - Keep under 100 lines following Golden Rule

### Update References
- [x] **Update all imports to use new SimpleCacheService instead of specialized cache services**
  - Search for imports of old cache services
  - Replace with `SimpleCacheService` imports
  - Update method calls to use new unified interface

### Remove Old Services
- [x] **Delete lib/auth/super-admin/asset-cache-service.ts**
  - Verify no remaining imports
  - Delete file
  - Update exports if needed

- [x] **Delete lib/auth/super-admin/folder-cache-service.ts**
  - Verify no remaining imports
  - Delete file
  - Update exports if needed

- [x] **Delete lib/auth/super-admin/member-cache-service.ts**
  - Verify no remaining imports
  - Delete file
  - Update exports if needed

- [x] **Delete lib/auth/super-admin/cache-orchestrator.ts**
  - Verify no remaining imports
  - Delete file
  - Update exports if needed

### Validation
- [x] **Test that cache invalidation works correctly with new SimpleCacheService**
  - Test organization switching
  - Verify super admin cache invalidation
  - Check DAM asset cache behavior

---

## Phase 3: Final Cleanup (Week 3)

### Value Object Review
- [x] **Review TokenHash and SuperAdminRole value objects to determine if they're over-abstracted**
  - Check usage patterns in codebase
  - Determine if simple types would suffice
  - Document recommendations

### Use Case Audit
- [x] **Audit LoginUserUseCase, RegisterUserUseCase, and SwitchOrganizationUseCase for over-engineering**
  - Review complexity vs business value
  - Check for unnecessary domain events
  - Identify simplification opportunities

### Comprehensive Testing
- [x] **Run complete test suite to ensure no functionality broken**
  - Execute: `pnpm test`
  - Run: `pnpm build`
  - Fix any TypeScript or linting errors

- [x] **Test super admin functionality (profile display, Notes access, organization switching)**
  - Login as super admin
  - Verify profile shows "Super Admin"
  - Test Notes access
  - Test organization switching

- [x] **Validate JWT organization context and RLS policies still work correctly**
  - Test organization isolation
  - Verify RLS policies enforced
  - Check JWT custom claims

### Performance & Documentation
- [x] **Confirm TTS API call optimization maintained and no performance regression**
  - Test TTS functionality thoroughly
  - Monitor network requests
  - Benchmark against original 13-call problem

- [x] **Update auth domain documentation to reflect simplified architecture**
  - Update DOMAIN_BOUNDARY.md
  - Revise architecture diagrams
  - Document removed components

- [x] **Complete security validation checklist to ensure all security requirements maintained**
  - Verify all security requirements from plan
  - Test authentication flows
  - Validate authorization mechanisms

---

## Success Criteria Checklist

### Performance ✅
- [x] TTS still performs with optimized API calls
- [x] No performance regression in auth flows
- [x] Cache invalidation works correctly

### Security ✅
- [x] All security validations still function
- [x] Super admin bypass mechanisms intact
- [x] JWT organization context preserved
- [x] RLS policies continue working

### Code Quality ✅
- [x] All services ≤ 250 lines
- [x] Single responsibility maintained
- [x] No redundant code
- [x] Clear, maintainable structure

### Business Value ✅
- [x] All existing functionality preserved
- [x] Reduced complexity for future development
- [x] Easier testing and maintenance
- [x] Better adherence to Golden Rule DDD

---

## Emergency Rollback Plan

If any critical issues arise:

1. **Immediate Rollback**
   ```bash
   git checkout main
   git branch -D auth-refactor-cleanup
   ```

2. **Partial Rollback**
   ```bash
   git revert <specific-commit>
   ```

3. **Issue Documentation**
   - Document what broke
   - Identify root cause
   - Plan alternative approach

---

## Files Modified Tracking

### Will Delete:
- [ ] `lib/auth/super-admin/asset-cache-service.ts`
- [ ] `lib/auth/super-admin/folder-cache-service.ts`
- [ ] `lib/auth/super-admin/member-cache-service.ts`
- [ ] `lib/auth/super-admin/cache-orchestrator.ts`

### Will Simplify:
- [ ] `lib/auth/domain/services/AuthenticationDomainService.ts` (396 → ~150 lines)

### Will Create:
- [ ] `lib/auth/infrastructure/services/SimpleCacheService.ts`

### Must Keep Unchanged:
- ✅ `lib/auth/infrastructure/SecurityAwareUserValidationService.ts`
- ✅ `lib/auth/infrastructure/composition/AuthCompositionRoot.ts`
- ✅ All JWT and RLS integration code

---

## Notes

- **Priority**: Maintain TTS performance optimization throughout
- **Security**: Never compromise security for simplicity
- **Testing**: Validate after each major change
- **Documentation**: Keep plan updated with actual findings

**Remember**: The `SecurityAwareUserValidationService` that solves the 13 API call problem is NOT over-engineered and must be preserved! 