# DAM Legacy Code Transition Plan

## Overview

This document outlines our strategy for safely transitioning from the legacy DAM codebase to the refactored architecture in `lib/dam`. Rather than immediately removing legacy files (which could break existing code), we've implemented a phased approach to ensure a smooth transition.

## Transition Strategy

We've implemented a three-phase approach:

### Phase 1: Wrapper Implementation (Current)

All legacy repository and service files have been refactored to:

1. **Keep the original file location and interface** - This ensures no imports break.
2. **Re-export from wrapper implementations** - The original files now re-export from new wrapper files.
3. **Implement wrappers using new architecture** - The wrappers use the new repositories and services internally.
4. **Add deprecation warnings** - Console warnings and JSDoc comments guide developers to migrate.

### Phase 2: Consumer Migration (Next)

During this phase:

1. Monitor deprecation warnings in the console during development.
2. Identify code that still uses the legacy interfaces.
3. Refactor consuming code to use the new architecture directly.
4. Update existing tests that rely on the legacy code.

### Phase 3: Legacy Code Removal (Future)

Once all consumers have been migrated:

1. Remove the legacy files and wrappers.
2. Verify no references to the legacy files remain.
3. Clean up any remaining references in documentation.

## Wrapper Files Created

| Legacy File | Wrapper Implementation |
|-------------|------------------------|
| `lib/repositories/folder-repo.ts` | `lib/repositories/legacy-wrappers/folder-repo-wrapper.ts` |
| `lib/repositories/asset.db.repo.ts` | `lib/repositories/legacy-wrappers/asset-db-repo-wrapper.ts` |
| `lib/repositories/asset.storage.repo.ts` | `lib/repositories/legacy-wrappers/asset-storage-repo-wrapper.ts` |
| `lib/repositories/asset-tag.repo.ts` | `lib/repositories/legacy-wrappers/asset-tag-repo-wrapper.ts` |
| `lib/services/asset-core.service.ts` | `lib/repositories/legacy-wrappers/asset-core-service-wrapper.ts` |

## Benefits of this Approach

1. **Zero-downtime migration** - The application continues to work while we migrate.
2. **Progressive adoption** - Teams can migrate at their own pace.
3. **Clearer deprecation** - Visible warnings help developers understand what to update.
4. **Safer refactoring** - We can catch issues early with the wrapper pattern.
5. **Training opportunity** - Developers learn how to use the new architecture before the old one is removed.

## Next Steps

1. Update consumers of the legacy code to use the new architecture directly.
2. Add additional testing for the wrappers to ensure they correctly handle edge cases.
3. Create a tracking issue for the final removal of legacy code once all consumers have migrated.

## Timeline

- **Phase 1 (Wrapper Implementation)**: Completed
- **Phase 2 (Consumer Migration)**: In progress
- **Phase 3 (Legacy Code Removal)**: Planned for [future date] 