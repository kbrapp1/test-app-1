# Digital Asset Management (DAM) - Feature Roadmap

> **Note:** This roadmap is specific to the DAM (Digital Asset Management) feature. For information about the Team section (team member directory with photos), see the project structure and README documentation. The Team section is a separate feature for managing and displaying team members.

This document outlines a potential phased roadmap for enhancing the Digital Asset Management (DAM) system beyond the initial Phase 1 implementation. The order and specific features within each phase can be adjusted based on evolving priorities.

## Phase 1: Foundation (Completed)

*   **Goal:** Provide a simple way to upload, view, and manage digital assets (initially focusing on images) with a modern, highly interactive, and performant user experience.
*   **Features Implemented:**
    - [x] **Image Upload:** Interface with button and drag-and-drop area.
    - [x] **Client-Side Validation:** Checks for allowed image MIME types (JPG, PNG, GIF, WEBP).
    - [x] **Supabase Integration:** Stores uploaded files in Supabase Storage and records metadata (filename, size, type, path, user, timestamp) in a Supabase database table (`assets`).
    - [x] **Asset Gallery:** Displays uploaded images in a responsive grid format.
    - [x] **Asset Deletion:** Allows users to delete assets from the gallery (with confirmation dialog), removing the file from storage and the record from the database.
    - [x] **UI Feedback:** Includes loading states and toast notifications for upload/delete actions.
    - [x] **Smooth Updates:** Uses `revalidatePath` to refresh the gallery after deletions.

## Phase 2: Core Organization & Management

*   **Goal:** Make the DAM usable for a larger number of assets and improve management efficiency.
*   **Features:**
    - [x] **Folder/Directory Structure:** UI for creating folders, moving assets between folders, and navigating the hierarchy (tree view, breadcrumbs).
    - [x] **Tagging and Categorization:** Add/remove tags to assets (UI component, tag suggestions).
    - [ ] **Bulk Operations (Selection & Delete):** Multi-select functionality in gallery and bulk delete.

## Phase 3: Enhanced Discovery & Asset Types

*   **Goal:** Improve asset findability and broaden the types of assets supported.
*   **Features:**
    - [x] **Advanced Search:** Search bar/modal queries based on filename, tags, date ranges.
    - [x] **Filtering & Sorting:** Options to sort assets (name, date, size) and filter (by tag, folder).
    - [ ] **Video and Document Support:** Extend uploads to video/doc types and generate thumbnails.

## Phase 4: Collaboration & Control

*   **Goal:** Make the DAM suitable for team usage.
*   **Features:**
    - [x] **User Permissions and Access Control:** Roles/rules enforced in server actions and RLS policies.
    - [ ] **Version History:** Track asset changes and preserve versions with UI to view/revert.

## Phase 5: Advanced Capabilities

*   **Goal:** Add more sophisticated asset manipulation features.
*   **Features:**
    *   **Asset Editing (Cropping, Resizing):** Integrate a client-side or server-side image editing library. Add UI controls for basic transformations. Decide how edited assets are saved (overwrite, new version, new asset).
    *   **(Other Potential Features):** Sharing links, comments/annotations, analytics, AI-based tagging. 