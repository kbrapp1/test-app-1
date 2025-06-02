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

# Test App 1

## AI Image Generator Enhancement

We've successfully upgraded the image generator from FLUX Pro to **FLUX Kontext Max**, adding comprehensive image editing capabilities alongside text-to-image generation with premium performance and improved typography.

### 🎨 New Features

#### 1. **Dual Generation Modes**
- **Text-to-Image**: Create entirely new images from text prompts
- **Image Editing**: Transform existing images with text prompts using FLUX Kontext Max

#### 2. **Image Upload & DAM Integration**
- Upload images directly to use as base for editing
- Select images from Digital Asset Management (DAM) library
- Support for various image formats with preview

#### 3. **Advanced Editing Types**
- **General Editing**: Modify any aspect of an image ("put a sunrise behind the mountain")
- **Style Transfer**: Change artistic style ("make it look like a watercolor painting")
- **Background Swap**: Replace backgrounds ("place this in a magical forest")

#### 4. **Enhanced UI/UX**
- Tabbed interface for generation vs editing modes
- Visual base image preview with editing context
- Edit buttons on completed generations for easy iteration
- Generation type badges to distinguish creation methods

#### 5. **Premium Typography Generation** 
- FLUX Kontext Max delivers superior text rendering in images
- Enhanced prompt adherence for better results
- Maximum performance without speed compromise

### 🔧 Technical Implementation

#### Model Upgrade
```typescript
// Before: FLUX 1.1 Pro (text-to-image only)
'black-forest-labs/flux-1.1-pro'

// After: FLUX Kontext Max (text-to-image + editing + premium features)
'black-forest-labs/flux-kontext-max'
```

#### Enhanced Domain Model
- Extended `Generation` entity with image editing properties:
  - `baseImageUrl`: Source image for editing
  - `editType`: Type of generation/editing operation
  - `aspectRatio`: Flexible aspect ratio support
  - `damAssetId`: Reference to DAM assets
  - `sourceDamAssetId`: Tracks source assets for editing

#### DDD Architecture Compliance
- **Domain Layer**: Enhanced entities and value objects for editing
- **Application Layer**: Updated DTOs and use cases for both generation and editing
- **Infrastructure Layer**: FLUX Kontext Max provider with premium image editing support
- **Presentation Layer**: Enhanced UI components with editing workflows

### 📊 API Capabilities

Based on [Replicate FLUX Kontext Max documentation](https://replicate.com/black-forest-labs/flux-kontext-max):

- **Premium Performance**: Maximum performance with improved prompt adherence
- **Superior Typography**: Enhanced text generation and rendering in images
- **Text-to-Image Generation**: Create 1024x1024 images with flexible aspect ratios
- **Advanced Image Editing**: Transform images with natural language prompts
- **Aspect Ratio Support**: From 3:7 (portrait) to 7:3 (landscape)
- **Premium Pricing**: ~$0.08 per generation (premium tier)
- **Fast Processing**: ~25 seconds average with enhanced quality

### 🚀 Usage Examples

#### Text-to-Image Generation
```typescript
// Generate new image with premium quality
const result = await generateImage({
  prompt: "A magical forest with glowing mushrooms, cinematic lighting",
  generationType: "text-to-image",
  aspectRatio: "16:9"
});
```

#### Image Editing with Premium Features
```typescript
// Edit existing image with superior typography and detail
const result = await generateImage({
  prompt: "Add elegant golden text saying 'ADVENTURE AWAITS' above the mountain",
  generationType: "image-editing", 
  baseImageUrl: "data:image/jpeg;base64,/9j/4AAQ...",
  aspectRatio: "1:1"
});
```

### 📁 Updated File Structure

Key files modified/created:

```
lib/image-generator/
├── infrastructure/providers/replicate/
│   ├── FluxModelService.ts          # Updated to use flux-kontext-max
│   └── ReplicateFluxProvider.ts     # Added image editing support
├── domain/entities/
│   ├── Generation.ts                # Enhanced with editing properties  
│   └── services/GenerationSerializer.ts # Updated interfaces
├── application/
│   ├── dto/GenerationDto.ts         # Added editing types
│   └── use-cases/GenerateImageUseCase.ts # Updated for editing
└── presentation/components/
    ├── GeneratorForm.tsx            # Enhanced UI with upload/editing
    ├── GenerationActions.tsx        # Added edit image button
    └── ImageGeneratorMain.tsx       # Integrated editing workflow
```

### 🔄 Migration Notes

- **Backward Compatible**: Existing text-to-image functionality unchanged
- **Enhanced Capabilities**: All existing features work with new premium editing features
- **Database Schema**: Requires migration to add new columns for editing support
- **Premium Pricing**: Updated to $0.08 per generation for premium quality
- **Typography Excellence**: Superior text rendering for images with text content

### 🧪 Testing

The system now supports:
1. Creating new images from text with premium quality (existing functionality enhanced)
2. Uploading images for premium editing  
3. Selecting images from DAM for premium editing
4. Using completed generations as base for further premium editing
5. Different editing types with enhanced typography (general, style transfer, background swap)
6. Superior text generation and rendering in images

All features maintain DDD principles with proper separation of concerns and domain-driven design patterns.