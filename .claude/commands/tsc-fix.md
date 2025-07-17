  Fix all TypeScript compilation errors in the codebase. For test files (*.test.ts), you
  can use `any` type to resolve type issues quickly. For non-test files, fix the errors
  properly without using `any` or disabling ESLint warnings.

  Run `npx tsc --noEmit` to identify all errors and fix them systematically.

  This prompt will:
  - Identify all TypeScript errors using the compiler
  - Allow flexible typing in test files
  - Require proper type fixes in production code
  - Maintain code quality standards for non-test files