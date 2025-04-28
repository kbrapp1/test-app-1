# Full-Stack Start (Scaffold Project)

This project is a scaffold for building full-stack applications using a modern tech stack. It provides a solid foundation with authentication, basic layout, UI components, theming, and common tooling configured.

**Goals of this Scaffold:**

1.  **Act as a Base:** Quickly start new projects with essential features already implemented.
2.  **Modular & Removable:** Allow easy removal of features or components not needed for a specific project.
3.  **Provide UX Examples:** Showcase common UX patterns and components (`shadcn/ui`, Command Palette, etc.).

## Table of Contents

*   [Technology Stack](#technology-stack)
*   [Getting Started](#getting-started)
    *   [Prerequisites](#prerequisites)
    *   [Installation](#installation)
    *   [Environment Variables](#environment-variables)
    *   [Database Setup (Required)](#database-setup-required)
        *   [Supabase Domain Restrictions](#supabase-domain-restrictions)
    *   [Running the Application](#running-the-application)
*   [Project Structure](#project-structure)
*   [Core Features](#core-features)
    *   [Authentication](#authentication)
    *   [Routing](#routing)
    *   [UI & Theming](#ui--theming)
    *   [Command Palette](#command-palette)
    *   [Navigation Configuration](#navigation-configuration)
    *   [Notes CRUD Example](#notes-crud-example)
    *   [Storybook Component Development](#storybook-component-development)
*   [Testing](#testing)
*   [Linting & Formatting](#linting--formatting)
*   [Available Scripts](#available-scripts)
*   [Removing Optional Features](#removing-optional-features)
    *   [Removing the Command Palette](#removing-the-command-palette)
    *   [Removing Example UI Blocks (Data Table/Chart)](#removing-example-ui-blocks-data-tablechart)
*   [Learn More](#learn-more)

## Technology Stack

*   **Framework:** Next.js 15+ (App Router)
*   **Language:** TypeScript
*   **UI:** React 19, Tailwind CSS, shadcn/ui
*   **State Management:** React Context (for Command Palette)
*   **Backend & Database:** Supabase (PostgreSQL)
*   **Authentication:** Supabase Auth (with middleware)
*   **Testing:** Vitest, React Testing Library, `@testing-library/user-event`
*   **Linting/Formatting:** ESLint, Prettier (config included)
*   **Package Manager:** pnpm
*   **Component Development & Testing:** Storybook

(Link to `docs/stack-rules.md` can remain if desired)

## Getting Started

### Prerequisites

*   Node.js (v18 or later recommended)
*   pnpm (check installation: `pnpm --version`)
*   A Supabase account and project ([supabase.com](https://supabase.com/))

### Installation

1.  Clone the repository:
    ```bash
    git clone https://github.com/kbrapp1/full-stack-start.git
    cd full-stack-start
    ```
2.  Install dependencies:
    ```bash
    pnpm install
    ```

### Environment Variables

This project requires environment variables for Supabase integration.

1.  Copy the example file:
        ```bash
        cp .env.example .env.local
        ```
    *(If `.env.example` does not exist, create it with the contents shown in the file structure below)*
2.  Create a Supabase project if you haven't already.
3.  Find your Project URL and `anon` public key in your Supabase project settings (**Settings** -> **API**).
4.  Open the `.env.local` file and paste your credentials:
    ```env
    NEXT_PUBLIC_SUPABASE_URL="YOUR_SUPABASE_URL"
    NEXT_PUBLIC_SUPABASE_ANON_KEY="YOUR_SUPABASE_ANON_KEY"
    ```

### Database Setup (Required)

#### Supabase Domain Restrictions

This scaffold includes functionality to restrict user signups to specific email domains (e.g., `@yourcompany.com`). This is enforced using a PostgreSQL function and trigger.

**You MUST manually create this function and trigger** in your Supabase project using the SQL Editor (**Database** -> **SQL Editor** -> **New query**):

*   **Step 1: Create the function (Customize Allowed Domains!)**
        ```sql
        -- Function to check email domain against an allowed list
        CREATE OR REPLACE FUNCTION public.check_email_domain()
        RETURNS TRIGGER AS $$
        DECLARE
      -- !!! CUSTOMIZE THIS LIST !!!
      allowed_domains TEXT[] := ARRAY['vistaonemarketing.com', 'ironmarkusa.com'];
          email_domain TEXT;
        BEGIN
          email_domain := split_part(NEW.email, '@', 2);
          IF NOT (email_domain = ANY(allowed_domains)) THEN
            RAISE EXCEPTION 'Email domain % is not allowed. Please use a valid company email.', email_domain;
          END IF;
          RETURN NEW;
        END;
        $$ LANGUAGE plpgsql SECURITY DEFINER;
        ```
    *(**Important:** Update the `allowed_domains` array!)*

*   **Step 2: Create the trigger**
        ```sql
        -- Remove existing trigger first (optional, safe to run)
        DROP TRIGGER IF EXISTS before_user_insert_check_domain ON auth.users;

    -- Create the trigger
        CREATE TRIGGER before_user_insert_check_domain
          BEFORE INSERT ON auth.users
          FOR EACH ROW
          EXECUTE FUNCTION public.check_email_domain();
        ```

#### Notes Table Schema (Required for Notes Feature)

If you intend to use the Notes CRUD example feature (located at `/documents/notes`), you need to create the `notes` table. Run the following SQL in your Supabase SQL Editor. This script creates the table with all necessary columns, enables Row Level Security (RLS), sets up policies, and adds a trigger to update the `updated_at` timestamp.

```sql
-- Consolidated Notes Table Creation
CREATE TABLE public.notes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    title TEXT,
    content TEXT,
    position INTEGER, -- Column for drag-and-drop ordering
    color_class TEXT DEFAULT 'bg-yellow-200', -- Column for note color, default yellow
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Allow users full access to their own notes only
CREATE POLICY "Allow individual select access" ON public.notes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Allow individual insert access" ON public.notes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Allow individual update access" ON public.notes FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Allow individual delete access" ON public.notes FOR DELETE USING (auth.uid() = user_id);

-- Trigger to automatically update 'updated_at' timestamp on modification
-- Requires the 'moddatetime' extension to be enabled (usually enabled by default)
-- You can enable it via SQL: CREATE EXTENSION IF NOT EXISTS moddatetime;
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.notes FOR EACH ROW EXECUTE FUNCTION moddatetime (updated_at);

-- Note: The 'position' column is intentionally left without a default value in the schema.
-- The application logic ('addNote' server action) calculates and assigns the correct 
-- initial position when a new note is created.
```

**Optional: Update Existing Data (If Upgrading Schema)**

If you previously created the `notes` table *without* the `position` or `color_class` columns and have existing data, run the following SQL **after** the script above to populate these columns for your old notes:

```sql
-- Set default color for existing notes that don't have one
UPDATE public.notes SET color_class = 'bg-yellow-200' WHERE color_class IS NULL;

-- Calculate and set initial position for existing notes based on creation date
WITH ordered_notes AS (
  SELECT id, user_id, row_number() OVER (PARTITION BY user_id ORDER BY created_at ASC) - 1 AS calculated_position
  FROM public.notes
)
UPDATE public.notes n SET position = o.calculated_position FROM ordered_notes o WHERE n.id = o.id AND n.user_id = o.user_id AND n.position IS NULL;
```

### Running the Application

    ```bash
    pnpm run dev
    ```

Open [http://localhost:3000](http://localhost:3000) (or your configured port) in your browser.

## Project Structure

For a detailed overview of the project structure, including key files and their purposes, please refer to the [Project Structure Documentation](./docs/project-structure.md).

## Core Features

### Authentication

*   Handled via Supabase Auth.
*   Email/Password based login and signup forms (`/login`, `/signup`).
*   Middleware (`middleware.ts`) protects routes based on authentication status.
*   User session management handled by Supabase SSR library.
*   Signups restricted by email domain (requires database setup - see above).
*   User menu (`components/nav-user.tsx`) displays user info and logout option.

### Routing & Navigation

*   Uses Next.js App Router with file-based routing.
*   Protected routes are grouped under `app/(protected)/`.
*   **Main sidebar navigation** structure (Main, Documents, Secondary) is configured in `lib/config/navigation.ts`.
    *   Fixed issues related to using `next/link` with custom `SidebarMenuButton` components, ensuring reliable client-side navigation (`legacyBehavior` approach used).
*   **Settings Section:**
    *   Located at `/settings`.
    *   Uses a nested layout (`app/(protected)/settings/layout.tsx`) to provide consistent sub-navigation (Profile, Password, Email, Security, Danger Zone).
    *   The root `/settings` path redirects to `/settings/profile`.
    *   Each subsection (profile, password, etc.) is its own page (`/settings/profile/page.tsx`, etc.).
    *   Includes a **Danger Zone** example (`components/settings/danger-zone.tsx`) demonstrating safe handling of destructive actions using `AlertDialog` for confirmation.

### Notes CRUD Example

*   Provides a full CRUD (Create, Read, Update, Delete) example for managing simple text notes.
*   Located under `/documents/notes`.
*   **Data Fetching:** Notes are fetched in the `page.tsx` Server Component, ordered by their `position`.
*   **Display:** Uses `NoteList` and `NoteListItem` components to display notes in a responsive grid.
*   **Drag & Drop:** Notes can be reordered using drag-and-drop (`dnd-kit`), saving the new order.
*   **Color Picker:** Note background color can be changed using a pop-up color picker on hover.
*   **Mutations:** Uses Server Actions (`app/(protected)/documents/notes/actions.ts`) for creating, editing, deleting, and reordering notes.
    *   **Add:** Uses `AddNoteDialog` containing `AddNoteForm`.
    *   **Edit:** Handled via the extracted `NoteEditForm` component, triggered by `NoteListItem`.
    *   **Delete:** Handled via a button/form within `NoteListItem`.
*   **UI Patterns:**
    *   Demonstrates `useActionState` for handling form state and feedback.

### UI & Theming

*   Built with Tailwind CSS and shadcn/ui components.
*   Dark/Light/System theme switching provided by `next-themes`.
    *   Theme toggled via `components/theme-toggle.tsx`.
    *   Theme also controllable via the Command Palette.
*   Global styles in `styles/globals.css`.

### Command Palette

*   Triggered by `Cmd+K` / `Ctrl+K` or the search icon in the header.
*   Uses `cmdk` and `shadcn/ui` Dialog.
*   Provides quick access to navigation and theme switching.
*   State managed by `AppProviders` and `PaletteContext`.
*   See "Removing Optional Features" below for removal instructions.

### Navigation Configuration

*   Sidebar navigation structure (Main, Documents, Secondary) is defined in `lib/config/navigation.ts`.
*   Modify this file to add, remove, or change sidebar links.
*   The `AppSidebar` component renders the navigation based on this configuration.

### Storybook Component Development

*   Storybook is integrated for isolated component development and visualization.
*   Run Storybook locally with `pnpm run storybook` (usually opens on `http://localhost:6006`).
*   Stories are located alongside components (e.g., `components/ui/button.stories.tsx`) or in the root `stories/` directory.
*   It's configured with Tailwind CSS and Theme support.
*   Refer to the [Storybook Documentation](https://storybook.js.org/docs/) for writing stories.

## Testing

*   Uses Vitest for running tests and assertions.
*   Uses React Testing Library (`@testing-library/react`, `@testing-library/user-event`) for component testing.
*   Component tests (`*.test.tsx`) are co-located with their components.
*   Unit tests (`*.test.ts`) for logic like middleware.
*   Run tests with `pnpm test` or `pnpm test:watch`.
*   Includes tests for navigation components (`NavMain`, `NavSecondary`, `NavDocuments`), verifying correct link rendering.
*   Includes tests for the `SettingsLayout` and basic rendering of settings sub-pages.
*   Includes tests for core forms (Login, Signup, Profile, Password) and their interactions.
*   Includes tests for the Notes feature components and Server Actions (`app/(protected)/documents/notes/actions.test.ts`).
*   **Storybook Tests:**
    *   Storybook integration includes `@storybook/experimental-addon-test`.
    *   A separate Vitest workspace configuration (`vitest.workspace.ts`) was created for Storybook tests.
    *   Run Storybook-specific tests (if any are added within stories) using `npx vitest --project=storybook`.

## Linting & Formatting

*   ESLint and Prettier are configured for code consistency.
*   Run linter with `pnpm run lint`.
*   Formatting should ideally be handled by editor extensions on save.
*   `pnpm test`: Runs tests once (main application tests via `vitest.config.ts`).
*   `pnpm test:watch`: Runs main application tests in interactive watch mode.
*   `pnpm run storybook`: Starts the Storybook development server.
*   `pnpm run build-storybook`: Builds Storybook for static deployment (if needed).

## Available Scripts

*   `pnpm run dev`: Runs the app in development mode.
*   `pnpm run build`: Builds the app for production.
*   `pnpm run start`: Starts the production server.
*   `pnpm run lint`: Runs the linter.
*   `pnpm test`: Runs tests once (main application tests via `vitest.config.ts`).
*   `pnpm test:watch`: Runs main application tests in interactive watch mode.
*   `pnpm run storybook`: Starts the Storybook development server.
*   `pnpm run build-storybook`: Builds Storybook for static deployment (if needed).

## Removing Optional Features

This section details how to remove optional features if not needed for your project.

### Removing the Command Palette

1.  **Delete Component:** Delete `components/command-palette.tsx`.
2.  **Delete Context:** Delete `context/palette-context.tsx`.
3.  **Update Providers:** Edit `components/app-providers.tsx`:
    *   Remove the `paletteOpen` and `setOpen` state variables.
    *   Remove the import for `PaletteProvider`.
    *   Remove the `<PaletteProvider>` wrapper around `{children}`.
    *   Remove the import and rendering of `<CommandPalette />`.
4.  **Update Header:** Edit `components/site-header.tsx`:
    *   Remove the import for `usePalette`.
    *   Remove the `const { setOpen: setPaletteOpen } = usePalette();` line.
    *   Remove the search icon `<Button>` component.

### Removing Example UI Blocks (Data Table/Chart)

*(These steps assume the component `components/data-table.tsx` exists)*

1.  **Identify Component Files:** Locate the component file (`components/data-table.tsx`).
2.  **Remove from Pages:** Find where this component is imported and used in your `app/` directory (e.g., likely within `/dashboard`) and remove the import and usage.
3.  **Delete Component Files:** Delete the component file itself.
4.  **Delete Tests:** Delete the corresponding test file (if any exist).

## Learn More

To learn more about the technologies used, take a look at the following resources:

*   [Next.js Documentation](https://nextjs.org/docs)
*   [React Documentation](https://react.dev/)
*   [Tailwind CSS Documentation](https://tailwindcss.com/docs)
*   [shadcn/ui Documentation](https://ui.shadcn.com/docs)
*   [Supabase Documentation](https://supabase.com/docs)
*   [Vitest Documentation](https://vitest.dev/guide/)
*   [Storybook Documentation](https://storybook.js.org/docs/) 