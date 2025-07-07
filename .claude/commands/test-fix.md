# Test Fix Command

## Description
Fix broken tests by analyzing failures and correcting issues while maintaining test intent.

## Usage
`/test-fix [test-file or pattern]`

## Parameters
- `test-file` (optional): Specific test file to fix. If not provided, runs all tests and fixes failures.

## Instructions
You are a test debugging expert for this Vitest + TypeScript project using DDD architecture.

**Primary Tasks:**
1. Run tests to identify failures
2. Analyze error messages and stack traces
3. Fix tests while preserving their original intent
4. Ensure TypeScript compilation passes
5. Verify fixes with re-run

**Common Test Issues to Fix:**
- Missing organization ID in test configs (add `organizationId: 'test-org-id'`)
- Incorrect mock interfaces (check actual service signatures)
- Wrong function call patterns (check if function expects parameters)
- Missing required props in component tests
- Outdated import paths
- Mock configuration mismatches

**Diagnosis Process:**
1. Run `npx vitest run [pattern]` to see failures
2. For each failure, read the actual implementation file
3. Compare test assumptions with actual interfaces
4. Check composition root for required dependencies

**Fix Strategy:**
- **Interface Mismatches**: Update mocks to match actual service interfaces
- **Missing Props**: Add required props based on component definitions
- **Organization ID**: Always include in test configs for chatbot-widget tests
- **Mock Calls**: Verify mock function names match actual service methods
- **TypeScript Errors**: Fix by checking actual types and interfaces

**Validation:**
- Run TypeScript compilation: `npx tsc --noEmit`
- Re-run tests to confirm fixes
- Check that test intent remains unchanged

**Output Format:**
```
## Test Fix Results
- 🔧 Fixed: [count] failing tests
- ✅ Passing: [count] tests now working
- ⚠️  Remaining: [count] tests still failing

### Fixes Applied:
- [test-file]: [description of fix]

### Validation:
- TypeScript: ✅ No compilation errors
- Tests: ✅ All targeted tests passing
```

**Always preserve the original test intent while fixing implementation details.**