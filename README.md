# Ironmark DAM & App Features

This project is a full-stack application incorporating features like Digital Asset Management (DAM), note-taking, and user settings, built using a modern tech stack.

This document provides an overview of the application's features, setup, and development practices.

**Goals:**

1.  Develop and test a robust Digital Asset Management system.
2.  Integrate other useful internal tools and features as needed.
3.  Maintain a clean, well-tested, and modern codebase.

## Table of Contents

*   [Technology Stack](#technology-stack)
*   [Getting Started](#getting-started)
    *   [Prerequisites](#prerequisites)
    *   [Installation](#installation)
    *   [Environment Variables](#environment-variables)
    *   [Database Setup (Required)](#database-setup-required)
        *   [Supabase Domain Restrictions](#supabase-domain-restrictions)
    *   [Supabase Email Redirects (Post-Deployment)](#supabase-email-redirects-post-deployment)
    *   [Running the Application](#running-the-application)
*   [Project Structure](#project-structure)
*   [Core Features](#core-features)
    *   [Authentication](#authentication)
    *   [Routing & Navigation](#routing--navigation)
    *   [Notes CRUD Feature](#notes-crud-feature)
    *   [Digital Asset Management (DAM)](#digital-asset-management-dam)
    *   [UI & Theming](#ui--theming)
    *   [Command Palette](#command-palette)
    *   [Navigation Configuration](#navigation-configuration)
    *   [Storybook Component Development](#storybook-component-development)
    *   [Team Section](#team-section)
*   [Testing](#testing)
*   [Linting & Formatting](#linting--formatting)
*   [Available Scripts](#available-scripts)
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

#### Supabase Email Redirects (Post-Deployment)

**Important:** After deploying your application (e.g., to Vercel), you need to configure Supabase to use your deployment URL in confirmation emails.

1.  Go to your Supabase Project Dashboard.
2.  Navigate to **Authentication** -> **URL Configuration**.
3.  Set the **Site URL** field to your main deployment URL (e.g., `https://your-project-name.vercel.app` or your custom domain).
4.  Ensure your deployment URL (and optionally `http://localhost:3000` for local testing) is listed under **Redirect URLs**.
5.  Save the changes.

Failure to do this will result in email confirmation links redirecting back to `localhost:3000` instead of your live application.

#### Database Table Setup (Required for Notes & DAM Features)

If you intend to use the Notes CRUD example feature (`/documents/notes`) and/or the upcoming Digital Asset Management (DAM) feature, you need to set up the necessary database tables and storage. **Run the following consolidated SQL script in your Supabase SQL Editor.** This script creates the `notes` and `assets` tables, enables Row Level Security (RLS), sets up basic policies, and adds necessary triggers.

```sql
-- Consolidated SQL Setup for Notes and DAM Assets

-- Ensure necessary extensions are enabled (usually are by default on Supabase)
CREATE EXTENSION IF NOT EXISTS moddatetime;
-- pgcrypto provides gen_random_uuid() which is used as default for UUID PKs
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. Notes Table Setup
CREATE TABLE public.notes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    -- Ensure user_id is NOT NULL if RLS relies on it
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    title TEXT,
    content TEXT,
    position INTEGER, -- Column for drag-and-drop ordering
    color_class TEXT DEFAULT 'bg-yellow-200', -- Column for note color, default yellow
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Enable Row Level Security for Notes
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Notes: Allow users full access to their own notes only
CREATE POLICY "Notes: Allow individual select access" ON public.notes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Notes: Allow individual insert access" ON public.notes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Notes: Allow individual update access" ON public.notes FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Notes: Allow individual delete access" ON public.notes FOR DELETE USING (auth.uid() = user_id);

-- Trigger for Notes: automatically update 'updated_at' timestamp
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.notes FOR EACH ROW EXECUTE FUNCTION moddatetime (updated_at);

-- 2. Assets Table Setup (For DAM)
CREATE TABLE public.assets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    -- Making user_id NOT NULL simplifies initial RLS. Handle anonymous uploads if needed later.
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    storage_path TEXT NOT NULL UNIQUE, -- Ensure storage path is unique
    mime_type TEXT NOT NULL,
    size INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
    -- No updated_at needed for assets currently
);

-- Enable Row Level Security for Assets
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Assets: Allow users full access to their own assets only
-- Assumes assets are always tied to a user (user_id is NOT NULL)
CREATE POLICY "Assets: Allow individual select access" ON public.assets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Assets: Allow individual insert access" ON public.assets FOR INSERT WITH CHECK (auth.uid() = user_id);
-- Consider if updates are needed. If only metadata updates, add policy. If file replace, different logic.
-- CREATE POLICY "Assets: Allow individual update access" ON public.assets FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Assets: Allow individual delete access" ON public.assets FOR DELETE USING (auth.uid() = user_id);

-- Grant usage on the public schema if needed (usually default)
GRANT USAGE ON SCHEMA public TO authenticated, service_role;
-- Grant specific permissions on tables
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notes TO authenticated;
GRANT SELECT, INSERT, DELETE ON public.assets TO authenticated; -- Note: Update permission omitted for now
-- Service role usually has bypass RLS implicitly, but explicit grants can be clearer
GRANT ALL ON public.notes TO service_role;
GRANT ALL ON public.assets TO service_role;


-- Note: The 'position' column in 'notes' is intentionally left without a default value.
-- The application logic ('addNote' server action) calculates and assigns the correct 
-- initial position when a new note is created.
```

**Also Required for DAM:**

*   **Create Storage Bucket:** Manually create a Storage Bucket named `assets` via the Supabase Dashboard (Storage -> Buckets -> Create Bucket). For Phase 1, you can set it to **Public**. *Remember to review security implications later.* 

**Optional: Update Existing Notes Data (If Upgrading Schema)**

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

#### Team Section Setup

To enable the Team section (team member directory with photos), you must set up the following in Supabase:

1. **Create the `team_members` Table**

```sql
CREATE TABLE public.team_members (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    title TEXT NOT NULL,
    primary_image_path TEXT NOT NULL,
    secondary_image_path TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);
```

2. **Enable Row Level Security (RLS) and Add Policies**

```sql
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to view team members
CREATE POLICY "Allow select for authenticated" ON public.team_members
    FOR SELECT USING (auth.role() = 'authenticated');

-- Allow all authenticated users to add team members
CREATE POLICY "Allow insert for authenticated" ON public.team_members
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');
```

3. **Create the `team-images` Storage Bucket**

- Go to **Storage** in the Supabase dashboard.
- Create a new bucket named `team-images`.
- Set it to **public** for read access (or configure as needed).

4. **Set Storage Bucket Policies**

In the Supabase dashboard, go to the `team-images` bucket and add a policy like:

- **Allow authenticated users to upload to `public/*`:**

```sql
CREATE POLICY "Authenticated upload to public" ON storage.objects
    FOR INSERT
    WITH CHECK (
        bucket_id = 'team-images'
        AND auth.role() = 'authenticated'
        AND (storage.foldername(name))[1] = 'public'
    );
```

- **Allow public read access to `public/*`:**

```sql
CREATE POLICY "Public read access to public" ON storage.objects
    FOR SELECT
    USING (
        bucket_id = 'team-images'
        AND (storage.foldername(name))[1] = 'public'
    );
```

5. **Troubleshooting**

If you see errors like:
- `new row violates row-level security policy for table "team_members"`
- 403 errors when uploading images

Double-check:
- RLS is enabled and policies above are applied to `team_members`.
- The `team-images` bucket exists and has the correct policies.

---

(Reference this section from the Team Section feature description as well.)

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

### Notes CRUD Feature

*   Provides full CRUD (Create, Read, Update, Delete) functionality for managing simple text notes.
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

### Digital Asset Management (DAM)

*   Feature set for uploading, viewing, and managing digital assets.
*   Located under `/dam`.
*   **Upload:** Component (`AssetUploader`) allows file selection and drag-and-drop, using a Server Action (`uploadAssets`) for backend processing and Supabase Storage integration.
*   **Gallery:** Component (`AssetGallery`) displays uploaded assets fetched from the database.
*   **Delete:** Functionality implemented within `AssetThumbnail` using a Server Action (`deleteAsset`) with confirmation dialog.
*   Refer to `docs/DAM_Build_Steps_Phase1.md` for detailed implementation steps.

### UI & Theming

*   Built with Tailwind CSS and shadcn/ui components.
*   Dark/Light/System/Ironmark theme switching provided by `next-themes`.
    *   Theme toggled via `components/theme-toggle.tsx`.
    *   Theme also controllable via the Command Palette.
*   Global styles in `styles/globals.css`.

### Command Palette

*   Triggered by `Cmd+K` / `Ctrl+K` or the search icon in the header.
*   Uses `cmdk` and `shadcn/ui` Dialog.
*   Provides quick access to navigation and theme switching.
*   State managed by `