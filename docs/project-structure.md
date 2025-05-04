# Project Structure Overview

This document provides a high-level overview of the main directories and their purpose within this full-stack application project.

## Core Structure Diagram

```
/
|-- app/                      # Next.js App Router: Routes, layouts, pages.
|   |-- (protected)/          # Route group: Applies protected layout.
|   |   |-- dashboard/        # Dashboard route (/dashboard).
|   |   |-- documents/        # Documents section root (example).
|   |   |   |-- layout.tsx    # Simple layout for document types.
|   |   |   |-- page.tsx      # Documents overview or landing page.
|   |   |   `-- notes/        # Notes CRUD example route (/documents/notes).
|   |   |       |-- page.tsx  # Displays notes, handles initial fetch.
|   |   |       `-- actions.ts # Server Actions for notes CRUD & reordering.
|   |   |-- dam/              # Digital Asset Management section.
|   |   |   |-- page.tsx      # Asset Gallery page (/dam).
|   |   |   `-- upload/       # Asset Upload page route (/dam/upload).
|   |   |       `-- page.tsx
|   |   |-- settings/         # Settings section root.
|   |   |   |-- layout.tsx    # Settings sub-navigation layout.
|   |   |   |-- page.tsx      # Redirects /settings to /settings/profile.
|   |   |   |-- profile/      # Profile settings page & route.
|   |   |   |   `-- page.tsx
|   |   |   |-- password/     # Password settings page & route.
|   |   |   |   `-- page.tsx
|   |   |   |-- email/        # Placeholder email page & route.
|   |   |   |   `-- page.tsx
|   |   |   |-- security/     # Placeholder security page & route.
|   |   |   |   `-- page.tsx
|   |   |   |-- danger/       # Placeholder danger zone page & route.
|   |   |   |   `-- page.tsx
|   |   |   |-- team/         # Team section (view/add team members)
|   |   |   |   |-- page.tsx  # Team page (protected route, shows team members)
|   |   |   |   `-- (other files)
|   |   |   `-- layout.tsx    # Main protected area layout (header, sidebar).
|   |   `-- layout.tsx        # Root layout (html, body, global providers).
|   |-- api/                  # API routes (optional).
|   |-- auth/                 # Auth callback/confirmation routes.
|   |-- login/                # Login page route (/login).
|   |-- signup/               # Signup page route (/signup).
|   |-- layout.tsx            # Root layout (html, body, global providers).
|   `-- page.tsx              # Root page (often redirects).
|
|-- components/               # Reusable React components.
|   |-- ui/                   # Base UI components (from shadcn/ui).
|   |   `-- empty-state.tsx   # Component for displaying empty lists.
|   |-- auth/                 # Authentication forms (login, signup).
|   |-- dam/                  # Components specific to the DAM feature.
|   |   |-- AssetGallery.tsx    # Renders the grid of assets.
|   |   |-- AssetThumbnail.tsx  # Renders individual asset, handles delete.
|   |   `-- AssetUploader.tsx   # UI for uploading assets.
|   |-- settings/             # Settings related components.
|   |   |-- profile-form.tsx
|   |   |-- password-form.tsx
|   |   |-- email-form.tsx      (Placeholder)
|   |   |-- security-section.tsx(Placeholder)
|   |   `-- danger-zone.tsx     (Placeholder with confirmation dialog)
|   |-- notes/                # Components specific to the Notes feature.
|   |   |-- note-list.tsx       # Renders the list/grid of notes, handles D&D context.
|   |   |-- note-list-item.tsx  # Individual note display, D&D item, edit toggle, color picker.
|   |   |-- note-edit-form.tsx  # Extracted form component for editing notes.
|   |   |-- add-note-dialog.tsx # Dialog containing the add note form.
|   |   `-- add-note-form.tsx   # Form for creating a new note.
|   |-- context/              # React Context providers (e.g., Command Palette).
|   |-- hooks/                # Custom React hooks (e.g., useToast, useMobile).
|   |-- team/                 # Components for Team feature
|   |   |-- AddTeamMemberForm.tsx      # Form for adding a team member
|   |   |-- AddTeamMemberDialog.tsx    # Dialog for the add form
|   |   |-- TeamMemberCard.tsx         # Card for displaying a team member
|   |   |-- TeamMemberList.tsx         # List/grid of team members
|   |   `-- (tests, etc.)
|   |-- forms/                # Standardized form components
|   |   |-- FormWrapper.tsx     # Main form component that handles validation and submission
|   |   |-- TextField.tsx       # Standard text input field
|   |   |-- SelectField.tsx     # Dropdown select field
|   |   |-- CheckboxField.tsx   # Checkbox input field
|   |   |-- TextareaField.tsx   # Multi-line text input
|   |   |-- SwitchField.tsx     # Toggle switch field
|   |   |-- CustomField.tsx     # Custom field wrapper
|   |   `-- index.ts            # Re-exports all form components
|   |-- error-boundary.tsx    # React error boundary for catching UI errors
|   `-- ... (Shared components like sidebar, header, data-table, etc.)
|
|-- context/                  # React Context providers (e.g., Command Palette).
|
|-- hooks/                    # Custom React hooks (e.g., useToast, useMobile).
|
|-- lib/                      # Core logic, utilities, external service integrations.
|   |-- actions/              # Server Actions.
|   |   |-- dam.ts            # Actions for Digital Asset Management (upload, delete).
|   |   `-- notes.ts          # Actions for Notes feature (add, edit, delete, reorder).
|   |-- config/               # Config files (e.g., navigation structure).
|   |-- supabase/             # Supabase client setup (client, server).
|   |-- errors/               # Error handling system.
|   |   |-- base.ts           # Base error classes (AppError, ValidationError, etc.)
|   |   |-- constants.ts      # Error codes, messages, and severity levels
|   |   |-- factory.ts        # Factory functions for creating error instances
|   |   |-- client.tsx        # Client-side error handling utilities
|   |   `-- __tests__/        # Tests for error classes and utilities
|   |-- middleware/           # Middleware for API routes and server actions.
|   |   |-- error.ts          # Error handling middleware
|   |   `-- __tests__/        # Middleware tests
|   |-- logging/              # Logging service.
|   |   `-- index.ts          # Logger implementation with different log levels
|   |-- forms/                # Form handling utilities.
|   |   |-- validation.ts     # Zod validation schemas
|   |   |-- useFormWithValidation.ts # Custom form hook
|   |   `-- error-handling.ts # Form error handling utilities
|   `-- utils.ts              # General utility functions.
|
|-- public/                   # Static assets (images, fonts, etc.).
|
|-- styles/                   # Global CSS files.
|
|-- tests/                    # Optional: End-to-end/integration test location.
|
|-- .storybook/             # Storybook configuration and stories (for UI component development & testing).
|
|-- docs/                     # Project documentation (you are here!).
|   |-- project-structure.md  # This file
|   |-- form-system-migration.md # Migration guide for the standardized form system
|   |-- error_handling_steps.md # Implementation plan for error handling system
|   |-- settings-page-steps.md
|   |-- deployment_steps.md
|   |-- stack-rules.md
|   |-- quick-tips.md
|   |-- test-instructions.md
|   |-- scaffold-checklist.md # Added/Updated
|   |-- types/notes.ts        # Added for shared Note/ColorOption types
|   `-- (other docs)
|
|-- .env.example              # Environment variable template.
|-- .env.local                # Local environment variables (Gitignored).
|-- .gitignore                # Files/folders ignored by Git.
|-- middleware.ts             # Request middleware (authentication enforcement).
|-- next.config.mjs           # Next.js configuration.
|-- package.json              # Project dependencies and scripts.
|-- postcss.config.mjs        # PostCSS configuration.
|-- tailwind.config.js        # Tailwind CSS configuration.
|-- tsconfig.json             # TypeScript configuration.
|-- vitest.config.ts          # Vitest testing configuration.
|-- vitest.setup.ts         # Vitest test setup file.
`-- README.md                 # Project overview.

```

## Key Project Files & Purpose

*   `app/layout.tsx`: The main root layout, includes `<html>`, `<body>`, and global providers like ThemeProvider, Toaster.
*   `app/(protected)/layout.tsx`: Main layout for authenticated routes (header, sidebar).
*   `app/(protected)/dam/page.tsx`: Server Component for the main Asset Gallery view.
*   `app/(protected)/dam/upload/page.tsx`: Page containing the `AssetUploader` component.
*   `app/(protected)/documents/notes/page.tsx`: Server Component that fetches and displays notes (ordered by `position`), using the `NoteList` component. Includes the `AddNoteDialog`.
*   `app/(protected)/settings/layout.tsx`: Specific layout for the settings section, providing internal navigation.
*   `app/(protected)/settings/page.tsx`: Redirects users from `/settings` to `/settings/profile`.
*   `app/(protected)/settings/[section]/page.tsx`: Individual pages for each settings section (profile, password, etc.).
*   `app/(protected)/team/page.tsx`: Server Component for the Team page (shows all team members, protected route).
*   `components/dam/AssetGallery.tsx`: Server Component that fetches asset data from Supabase and renders the gallery grid using `AssetThumbnail`.
*   `components/dam/AssetThumbnail.tsx`: Client Component that displays an individual asset image and includes the delete button and confirmation dialog logic.
*   `components/dam/AssetUploader.tsx`: Client Component providing the UI for file selection, drag-and-drop, and triggering the upload action.
*   `components/notes/note-list.tsx`: Client Component that manages note state for D&D, renders `NoteListItem` components, handles D&D context and `onDragEnd` logic.
*   `components/notes/note-list-item.tsx`: Client Component for displaying a single note, acting as a D&D item (`useSortable`), handling edit state toggle, rendering `NoteEditForm` or display view, and rendering the color picker.
*   `components/notes/note-edit-form.tsx`: Client Component containing the form fields, state (`useActionState`), and logic for submitting note edits.
*   `components/notes/add-note-dialog.tsx`: Client Component managing the dialog state for adding a note.
*   `components/notes/add-note-form.tsx`: Client Component containing the form fields and logic for submitting a new note via a Server Action.
*   `components/ui/empty-state.tsx`: Reusable component to display when there is no data (e.g., no notes, no assets).
*   `components/forms/FormWrapper.tsx`: Core component for form handling, validation, and error display.
*   `components/error-boundary.tsx`: React error boundary for handling UI rendering errors gracefully.
*   `lib/errors/base.ts`: Defines base error classes including AppError, ValidationError, AuthorizationError, etc.
*   `lib/errors/factory.ts`: Factory functions for creating standardized error instances.
*   `lib/errors/client.tsx`: Client-side error handling utilities
*   `lib/middleware/error.ts`: Error handling middleware for API routes and server actions.
*   `lib/logging/index.ts`: Centralized logging service with different log levels.
*   `lib/forms/validation.ts`: Reusable Zod validation schemas for form fields.
*   `lib/forms/error-handling.ts`: Utilities for handling form validation errors.
*   `lib/actions/dam.ts`: Contains Server Actions (`uploadAssets`, `deleteAsset`) for managing digital assets in Supabase Storage and the database.
*   `lib/actions/notes.ts`: Contains Server Actions (`addNote`, `editNote`, `deleteNote`, `updateNoteOrder`) for managing notes data in Supabase.
*   `middleware.ts`: Enforces authentication, redirecting users based on login status and target route.
*   `lib/supabase/client.ts`: Creates the client-side Supabase instance.
*   `lib/supabase/server.ts`: Creates the server-side Supabase instance (used by Server Components/Actions).
*   `lib/config/navigation.ts`: Defines the links and structure for the main application sidebar.
*   `components/app-sidebar.tsx`: Renders the main sidebar navigation.
*   `components/site-header.tsx`: Renders the top header bar.
*   `components/auth/login-form.tsx` / `signup-form.tsx`: Components handling user login/signup logic.
*   `components/settings/profile-form.tsx` / `password-form.tsx`: Components handling settings updates.
*   `hooks/use-toast.ts`: Hook and function for triggering toast notifications.
*   `components/team/AddTeamMemberForm.tsx`: Form for adding a new team member (name, title, images).
*   `components/team/AddTeamMemberDialog.tsx`: Dialog/modal for the add form.
*   `components/team/TeamMemberCard.tsx`: Card UI for displaying a team member (with hover effect).
*   `components/team/TeamMemberList.tsx`: Renders the list/grid of team members.

## Detailed Directory Contents

### `components/ui/` (Base UI Components - shadcn/ui)

*(Generally corresponds to components available from shadcn/ui)*
*   `accordion.tsx`: Vertically stacked expanding sections.
*   `alert-dialog.tsx`: Modal confirmation dialog.
*   `alert.tsx`: Callout message box.
*   `aspect-ratio.tsx`: Container with forced aspect ratio.
*   `avatar.tsx`: User image placeholder.
*   `badge.tsx`: Small status indicator.
*   `breadcrumb.tsx`: Navigation path indicator.
*   `button.tsx`: Clickable button.
*   `calendar.tsx`: Date picker.
*   `card.tsx`: Content container card.
*   `carousel.tsx`: Image or content slideshow.
*   `chart.tsx`: Charting component (Recharts).
*   `checkbox.tsx`: Checkbox input.
*   `collapsible.tsx`: Section that can be collapsed.
*   `command.tsx`: Command palette (Cmd+K).
*   `context-menu.tsx`: Right-click context menu.
*   `dialog.tsx`: Modal dialog box.
*   `drawer.tsx`: Side panel drawer.
*   `dropdown-menu.tsx`: Dropdown menu.
*   `form.tsx`: Form handling utilities (react-hook-form).
*   `hover-card.tsx`: Popover on hover.
*   `input-otp.tsx`: One-time password input.
*   `input.tsx`: Text input field.
*   `label.tsx`: Form field label.
*   `menubar.tsx`: Horizontal menu bar.
*   `navigation-menu.tsx`: Site navigation menu.
*   `pagination.tsx`: Pagination controls.
*   `popover.tsx`: Popover container.
*   `progress.tsx`: Progress bar.
*   `radio-group.tsx`: Group of radio buttons.
*   `resizable.tsx`: Resizable panel container.
*   `scroll-area.tsx`: Scrollable container.
*   `select.tsx`: Dropdown select input.
*   `separator.tsx`: Horizontal or vertical line separator.
*   `sheet.tsx`: Side sheet panel.
*   `skeleton.tsx`: Loading state placeholder.
*   `slider.tsx`: Slider input.
*   `sonner.tsx`: Toast component system (Sonner lib).
*   `switch.tsx`: On/off switch input.
*   `table.tsx`: Data table display.
*   `tabs.tsx`: Tabbed content switcher.
*   `textarea.tsx`: Multi-line text input.
*   `toast.tsx`: Individual toast message (shadcn).
*   `toaster.tsx`: Container for shadcn toasts.
*   `toggle-group.tsx`: Group of toggle buttons.
*   `toggle.tsx`: Single toggle button.
*   `tooltip.tsx`: Tooltip popover on hover.

### `lib/errors/` (Error Handling System)

*   `base.ts`: Defines the core error class hierarchy:
    * `AppError`: Base error class with code, status code, and context
    * `ValidationError`: For input validation errors (400)
    * `AuthorizationError`: For permission issues (403)
    * `NotFoundError`: For missing resources (404)
    * `DatabaseError`: For database operation failures (500)
    * `ExternalServiceError`: For third-party service failures (502)
*   `constants.ts`: Defines error codes, messages, and severity levels
*   `factory.ts`: Factory functions for creating error instances
*   `client.tsx`: Client-side error handling utilities

### `public/` (Static Assets)

*   `ironmark-logo.png`
*   `IM logo only.png`
*   `placeholder.svg`
*   `placeholder.jpg`
*   `placeholder-user.jpg`
*   `placeholder-logo.svg`
*   `placeholder-logo.png`

### `docs/` (Project Documentation)

*   `project-structure.md` (This file)
*   `form-system-migration.md` (Standardized form system migration guide)
*   `error_handling_steps.md` (Error handling system implementation plan)
*   `settings-page-steps.md`
*   `deployment_steps.md`
*   `stack-rules.md`
*   `quick-tips.md`
*   `test-instructions.md`
*   `scaffold-checklist.md` (Added/Updated)
*   `types/notes.ts` (Added for shared Note/ColorOption types)

## Notes & Conventions

*   **App Router:** Uses file-based routing. Folders define routes, `page.tsx` defines UI, `layout.tsx` defines shared UI. Special files like `loading.tsx`, `error.tsx`, `template.tsx`, and directories like `api/` or `auth/` handle specific functionalities. `actions.ts` files often contain Server Actions related to the route segment.
*   **Route Groups:** Folders in parentheses `(like_this)` group routes without affecting the URL path (e.g., for organizing layouts or route protection).
*   **Components:** Feature-specific components (like `settings/` or `notes/`) are grouped in subdirectories. Base UI components from `shadcn/ui` are in `components/ui/`. Test files (`*.test.tsx`) are often colocated with the component they test.
*   **Testing:** Unit/integration tests (`*.test.ts(x)`, `*.spec.ts(x)`) often use Vitest and live alongside the code they test or in the root. End-to-end tests might live in a dedicated `tests/` directory.
*   **Types:** Shared types (like `Note`, `ColorOption`) live in the `types/` directory.
*   **Error Handling:** Structured error handling system with custom error classes, middleware, and client utilities. Errors are categorized by type and severity with appropriate HTTP status codes.
*   **Forms:** Standardized form system with reusable components, validation schemas, and consistent error handling patterns.

## Excluded Folders (for brevity)

*   `.next/`: Build output (generated).
*   `node_modules/`: Project dependencies (managed by pnpm/npm/yarn).
*   `.git/`: Git version control metadata.
 