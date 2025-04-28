# Project Technology Stack (Current)

_General Rule: Use the versions specified in `package.json`. Avoid manual installation of different versions unless necessary._

## Frontend (Client-Side & UI - Runs in Browser, Built with Next.js)

*   **Framework:** Next.js (`^15.2.4`)
    *   _Purpose:_ Full-stack framework handling UI rendering (React), routing, and server-side logic via Server Components & API Routes.
*   **UI Library:** React (`^19`)
    *   _Purpose:_ Core library for building the user interface components.
*   **Language:** TypeScript (`^5`)
    *   _Purpose:_ Adds static typing to JavaScript for improved code quality across frontend and backend logic within Next.js.
*   **Core UI Component System:** shadcn/ui (installed via CLI, uses Radix UI & Tailwind)
    *   _Purpose:_ Provides foundational, accessible UI components (layout, forms, tables, controls) built using Radix UI (`~1.x.x`) and styled with Tailwind CSS. Components are copied into the codebase (`components/ui`) for full customization.
*   **Styling:** Tailwind CSS (`^3.4.17`)
    *   _Purpose:_ Utility-first CSS framework used directly and underpinning shadcn/ui for styling the user interface. Requires `autoprefixer` (`^10.4.20`) and `postcss` (`^8`).
*   **Key Frontend Libraries:**
    *   `class-variance-authority` (`^0.7.1`): For creating type-safe variants of UI components.
    *   `clsx` (`^2.1.1`): Utility for conditionally joining class names.
    *   `tailwind-merge` (`^2.5.5`): Merges Tailwind CSS classes without style conflicts.
    *   `tailwindcss-animate` (`^1.0.7`): Adds animation utilities for Tailwind CSS.
    *   `lucide-react` (`^0.454.0`): Provides a set of simply beautiful icons.
    *   `next-themes` (`^0.4.4`): Handles theme switching (e.g., light/dark mode).
    *   `framer-motion` (`^12.9.2`): Animation library for creating fluid user interfaces.
    *   `react-hook-form` (`^7.54.1`): Manages form state and validation.
    *   `zod` (`^3.24.1`): Schema validation library, often used with `react-hook-form` via `@hookform/resolvers` (`^3.9.1`).
    *   `sonner` (`^1.7.1`): Provides toast notifications.
    *   `recharts` (`^2.15.0`): Composable charting library.
    *   `cmdk` (`^1.0.4`): Command menu component.
    *   `date-fns` (`^4.1.0`): Modern date utility library.
    *   `react-day-picker` (`^8.10.1`): Date picker component.
    *   `react-dropzone` (`^14.x.x`): Simplifies drag-and-drop file uploads.
    *   `vaul` (`^0.9.6`): Drawer component.
    *   `@dnd-kit/*` (`~6-10`): Drag and drop toolkit.
    *   `@tanstack/react-table` (`^8.21.3`): Headless UI for building tables and datagrids.
    *   `react-resizable-panels` (`^2.1.7`): Resizable panel components.
    *   `embla-carousel-react` (`^8.5.1`): Carousel component.
    *   `input-otp` (`^1.4.1`): One-time password input component.

## Backend (Server-Side - Primarily Handled by Next.js)

*   **Runtime Environment:** Node.js (`^22` specified in `@types/node`)
    *   _Purpose:_ Executes server-side JavaScript/TypeScript.
*   **API Structure:** Next.js (App Router - Server Components, Route Handlers)
    *   _Purpose:_ Provides the structure within the Next.js application for server-side logic, data fetching, and API endpoints.
*   **Language:** TypeScript (`^5`)
    *   _Purpose:_ The primary language for writing server-side logic.
*   **Database/Auth Client:** See Supabase section below.
*   **Configuration:** Next.js Environment Variables (`.env.local`)
    *   _Purpose:_ Securely loads environment variables (API keys, database URLs, secrets).

## Database

*   **Platform:** Supabase
    *   _Purpose:_ Provides the backend-as-a-service platform, including the database and authentication.
*   **Database Type:** PostgreSQL
    *   _Purpose:_ The underlying powerful, open-source relational database managed by Supabase.

## Authentication

*   **Provider:** Supabase Auth
    *   _Purpose:_ Handles user sign-up, sign-in, password recovery, and session management.
*   **Integration Libraries:**
    *   `@supabase/supabase-js` (`^2.49.4`): Core JavaScript library for interacting with Supabase (DB & Auth).
    *   `@supabase/ssr` (`^0.6.1`): Helpers for Supabase Auth in server-side rendering environments (Next.js).
    *   `@supabase/auth-helpers-nextjs` (`^0.10.0`): (Potentially legacy or specific use case) Helpers specifically for older Next.js versions or Pages Router. `@supabase/ssr` is generally preferred for App Router.

## Testing Framework & Libraries

*   **Test Runner & Framework:** Vitest (`^3.1.1`)
    *   _Purpose:_ Runs unit and integration tests. Configured via `vite.config.ts`.
*   **React Testing Utilities:** `@testing-library/react` (`^16.3.0`)
    *   _Purpose:_ Facilitates testing React components in a user-centric way.
*   **DOM Matchers:** `@testing-library/jest-dom` (`^6.6.3`)
    *   _Purpose:_ Adds custom Jest-style matchers for asserting on DOM nodes (e.g., `toBeInTheDocument`).
*   **DOM Environment:** jsdom (`^26.1.0`)
    *   _Purpose:_ Simulates a browser environment within Node.js for running tests.
*   **Vite Plugin:** `@vitejs/plugin-react` (`^4.4.1`)
    *   _Purpose:_ Integrates React support into the Vite build process used by Vitest.

## Supporting Tools

*   **Package Manager:** pnpm (`~10.8.1` based on recent logs)
    *   _Purpose:_ Installs and manages project dependencies via `pnpm install`. Uses `pnpm-lock.yaml`.
*   **UI Development & Testing:** Storybook (`^8.6.12`)
    *   _Purpose:_ Develops and tests UI components in isolation. Uses packages like `@storybook/react`, `@storybook/addon-essentials`, etc. Configured in `.storybook/`.
*   **Code Formatter:** Prettier (Assumed, usually configured via `.prettierrc` and `.prettierignore`)
    *   _Purpose:_ Ensures consistent code style. Should ideally have `prettier-plugin-tailwindcss` if not already present.
*   **Linter:** ESLint (Assumed via `next lint` script, usually configured via `.eslintrc.json`)
    *   _Purpose:_ Analyzes code for potential errors and style issues.
*   **Version Control:** Git
    *   _Purpose:_ Tracks code changes. Uses `.gitignore`.