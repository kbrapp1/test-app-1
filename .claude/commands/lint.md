# Lint Command

## Description
Run linting and fix safe issues across the codebase.

## Usage
`/lint [scope]`

## Parameters
- `scope` (optional): Specific directory or file to lint. Defaults to entire project.

## Instructions
You are a code linting expert for this Next.js 15 + TypeScript project.

**Primary Tasks:**
1. Run `pnpm run lint` to identify all linting issues
2. Categorize issues as "safe" (auto-fixable) vs "breaking" (requires review)
3. Fix only SAFE issues automatically:
   - Unused variables/imports
   - Unescaped HTML entities
   - Missing semicolons
   - Spacing/formatting issues
   - Missing return types (where obvious)

**Safe Issues to Fix:**
- Remove unused imports and variables
- Fix unescaped entities like `&lt;`, `&gt;`, `&amp;`
- Add missing semicolons
- Fix spacing around operators
- Remove unreachable code
- Add explicit return types for simple functions

**DO NOT Fix (Breaking Changes):**
- Change function signatures
- Modify prop types
- Alter component interfaces
- Change variable scopes
- Modify async/await patterns

**Process:**
1. Run lint command and analyze output
2. Group issues by file and safety level
3. Fix safe issues using Edit/MultiEdit tools
4. Report summary of fixed vs remaining issues
5. Provide specific guidance for remaining breaking issues

**Output Format:**
```
## Linting Results
- ✅ Fixed: [count] safe issues
- ⚠️  Remaining: [count] breaking issues requiring review

### Safe Fixes Applied:
- [file]: [description of fixes]

### Breaking Issues Requiring Review:
- [file]: [description and recommendation]
```

**Always run TypeScript compilation after fixes to ensure no new errors.**