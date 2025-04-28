# Digital Asset Management (DAM) - Feature Roadmap

This document outlines a potential phased roadmap for enhancing the Digital Asset Management (DAM) system beyond the initial Phase 1 implementation. The order and specific features within each phase can be adjusted based on evolving priorities.

## Phase 1: Foundation (Completed)

*   **Goal:** Provide a simple way to upload, view, and manage digital assets (initially focusing on images) with a modern, highly interactive, and performant user experience.
*   **Features Implemented:**
    *   **Image Upload:** Interface with button and drag-and-drop area.
    *   **Client-Side Validation:** Checks for allowed image MIME types (JPG, PNG, GIF, WEBP).
    *   **Supabase Integration:** Stores uploaded files in Supabase Storage and records metadata (filename, size, type, path, user, timestamp) in a Supabase database table (`assets`).
    *   **Asset Gallery:** Displays uploaded images in a responsive grid format.
    *   **Asset Deletion:** Allows users to delete assets from the gallery (with confirmation dialog), removing the file from storage and the record from the database.
    *   **UI Feedback:** Includes loading states and toast notifications for upload/delete actions.
    *   **Smooth Updates:** Uses `revalidatePath` to refresh the gallery after deletions.

## Phase 2: Core Organization & Management

*   **Goal:** Make the DAM usable for a larger number of assets and improve management efficiency.
*   **Features:**
    *   **Folder/Directory Structure:** Implement UI for creating folders, moving assets between folders, and navigating the hierarchy (e.g., tree view, breadcrumbs). Update database schema (`assets` table might need a `folder_id` or similar).
    *   **Tagging and Categorization:** Add functionality to add/remove tags to assets (UI component for tag input, potentially with suggestions). Update database schema (likely a separate `tags` table and a join table like `asset_tags`).
    *   **Bulk Operations (Selection & Delete):** Implement multi-select functionality in the gallery (e.g., checkboxes on hover/click). Add the ability to delete selected assets in bulk (with confirmation).

## Phase 3: Enhanced Discovery & Asset Types

*   **Goal:** Improve asset findability and broaden the types of assets supported.
*   **Features:**
    *   **Advanced Search:** Implement a search bar/modal that queries based on filename, tags, potentially date ranges, etc.
    *   **Filtering & Sorting:** Add options to the gallery view to sort assets (by name, date uploaded, size) and filter (by tag, potentially folder if not handled by navigation alone).
    *   **Video and Document Support:** Extend upload validation to accept common video/doc types. Implement appropriate server-side handling (metadata extraction). Develop thumbnail generation/display logic for non-image files (e.g., generic icons, video thumbnails if possible). Update gallery/preview components to handle different types.

## Phase 4: Collaboration & Control

*   **Goal:** Make the DAM suitable for team usage.
*   **Features:**
    *   **User Permissions and Access Control:** Define roles or rules (e.g., view only, upload, manage). Implement checks in Server Actions and potentially database RLS policies based on ownership, folder permissions, or roles. Update UI to reflect permissions (e.g., hide delete button if user lacks permission).
    *   **Version History:** Implement tracking of asset changes (initially might just be replacing a file, later potentially preserving old versions). Requires schema changes and adjustments to upload/delete logic. UI to view/revert versions.

## Phase 5: Advanced Capabilities

*   **Goal:** Add more sophisticated asset manipulation features.
*   **Features:**
    *   **Asset Editing (Cropping, Resizing):** Integrate a client-side or server-side image editing library. Add UI controls for basic transformations. Decide how edited assets are saved (overwrite, new version, new asset).
    *   **(Other Potential Features):** Sharing links, comments/annotations, analytics, AI-based tagging. 