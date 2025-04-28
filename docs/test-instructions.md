# Testing Setup Instructions (Vitest + React Testing Library)

This document outlines the steps taken to set up automated testing using Vitest and React Testing Library for this Next.js project.

## 1. Installation

The following development dependencies were installed using npm:

```bash
npm install --save-dev vitest @vitest/ui @testing-library/react @testing-library/jest-dom jsdom @vitejs/plugin-react
```

*   **`vitest`**: The core testing framework.
*   **`@vitest/ui`**: Provides a graphical UI for viewing test results.
*   **`@testing-library/react`**: Utilities for testing React components in a user-centric way.
*   **`@testing-library/jest-dom`**: Adds useful custom Jest matchers for DOM assertions (e.g., `.toBeInTheDocument()`).
*   **`jsdom`**: A JavaScript implementation of the DOM and HTML standards for simulating a browser environment in Node.js.
*   **`@vitejs/plugin-react`**: Needed by Vitest to process React components (JSX, etc.).

## 2. Vitest Configuration (`vitest.config.ts`)

A configuration file `vitest.config.ts` was created in the project root:

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true, // Use global APIs like describe, it, expect
    environment: 'jsdom', // Simulate browser environment
    setupFiles: './vitest.setup.ts', // Global setup file
    alias: { // Configure path aliases (e.g., @/...)
       '@': path.resolve(__dirname, './src')
    },
    // Optional: Add reporters if needed (e.g., reporters: ['verbose'])
  },
})
```

*   This configures Vitest to use the React plugin, run tests in a simulated browser environment (`jsdom`), enable global test functions, and load a setup file.
*   It also configures the `@/` path alias to work correctly within tests.

## 3. Test Setup File (`vitest.setup.ts`)

A setup file `vitest.setup.ts` was created in the project root:

```typescript
// vitest.setup.ts
import '@testing-library/jest-dom';
```

*   This file imports the necessary Jest DOM matchers, making them available in all test files.

## 4. NPM Scripts (`package.json`)

The following scripts were added to the `"scripts"` section of `package.json`:

```json
"scripts": {
  // ... other scripts ...
  "test": "vitest",
  "test:ui": "vitest --ui"
}
```

*   `npm test` (or `npm t`): Runs all tests in the terminal.
*   `npm run test:ui`: Runs tests with the graphical UI.

## 5. Writing Tests

*   Create test files using conventional naming patterns:
    *   Files ending in `.test.ts` or `.test.tsx`.
    *   Files ending in `.spec.ts` or `.spec.tsx`.
    *   Files located within `__tests__` directories.
*   **Co-location** is recommended: Place test files or `__tests__` directories next to the code they are testing (e.g., `src/app/api/transactions/__tests__/route.test.ts`).
*   Use `describe`, `it`, `expect` from Vitest (available globally due to config).
*   Use `@testing-library/react` utilities (`render`, `screen`, `fireEvent`, etc.) for component testing.
*   Use `vi.fn()`, `vi.mock()`, `vi.doMock()`, `vi.spyOn()` for creating mocks and spies when needed.

*   **Readability Tip:** For better organization and understanding, consider:
    *   Using **nested `describe` blocks** to group tests by scenario or condition (e.g., `describe('when fetch succeeds', ...)`).
    *   Writing clear, **behavior-focused descriptions** in `it` blocks (e.g., `it('should return a 200 status code', ...)` instead of just `it('works', ...)`). 