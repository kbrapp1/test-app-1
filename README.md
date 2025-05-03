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

For a complete database setup, including tables, Row Level Security (RLS) policies, and necessary triggers for all features (Domain Restriction, Notes, DAM, Team Section), run the SQL script located at [`supabase/setup.sql`](mdc:supabase/setup.sql) in your Supabase project's SQL Editor (**SQL Editor** -> **New query**).

**Key components created by the script:**

-   **Domain Restriction:** A function and trigger to ensure only users with allowed email domains can sign up.
-   **Notes Feature:** `notes` table with policies for user-specific CRUD.
-   **DAM Feature:** `folders`, `assets`, `tags`, and `asset_tags` tables with appropriate policies.
-   **Team Section:** `team_members` table with policies.
-   **Required Extensions:** `moddatetime` and `pgcrypto`.

**Important: You must still manually create Storage Buckets & Policies via the Dashboard.**

See the [Supabase Storage Setup Guide](docs/supabase-storage-setup.md) for detailed step-by-step instructions on creating the required `assets` and `team-images` buckets and applying the necessary security policies.

#### Supabase Email Redirects (Post-Deployment)

**Important:** After deploying your application (e.g., to Vercel), you need to configure Supabase to use your deployment URL in confirmation emails.

1.  Go to your Supabase Project Dashboard.
2.  Navigate to **Authentication** -> **URL Configuration**.
3.  Set the **Site URL** field to your main deployment URL (e.g., `https://your-project-name.vercel.app` or your custom domain).
4.  Ensure your deployment URL (and optionally `http://localhost:3000` for local testing) is listed under **Redirect URLs**.
5.  Save the changes.

Failure to do this will result in email confirmation links redirecting back to `localhost:3000` instead of your live application.

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