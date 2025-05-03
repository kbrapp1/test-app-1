# DAM Feature - Full Build Steps

This document outlines the step-by-step process for implementing the Digital Asset Management (DAM) feature, following the phases defined in `DAM_FSD.md` and building upon the completed Phase 1.

**Assumptions:**

*   Phase 1 (Foundation: Upload, View, Delete Images) is complete as per `docs/DAM_Build_Steps_Phase1.md`.
*   Supabase credentials are set up in `.env.local`.
*   Next.js Server Actions will be used for backend logic (`lib/actions/dam.ts`).
*   `shadcn/ui` components and Tailwind CSS will be used for the UI (primarily in `components/dam/`).
*   Relevant routes exist: `/app/(protected)/dam/page.tsx` (Gallery), potentially others as needed.

---

**Phase 1: Foundation (Completed)**

*   Refer to `docs/DAM_Build_Steps_Phase1.md` for details on implementation and testing of basic image upload, gallery view, and deletion.

---

**Phase 2: Core Organization & Management (Completed)**

*   **[X] Step 2.1: Update Database Schema for Folders & Tags**
    *   **Task:**
        1.  **Add `folder_id` to `assets` table:**
            *   Column: `folder_id` (uuid, nullable, foreign key potentially to a new `folders` table, or self-referencing if folders are just special assets). *Decision: For simplicity, let's assume a new `folders` table for now.*
        2.  **Create `folders` table:**
            *   Columns:
                *   `id` (uuid, primary key, default: `uuid_generate_v4()`)
                *   `user_id` (uuid, foreign key to `auth.users.id`)
                *   `name` (text, not null)
                *   `parent_folder_id` (uuid, nullable, foreign key to `folders.id` for hierarchy)
                *   `created_at` (timestamp with time zone, default: `now()`)
        3.  **Create `tags` table:**
            *   Columns:
                *   `id` (uuid, primary key, default: `uuid_generate_v4()`)
                *   `user_id` (uuid, foreign key to `auth.users.id`)
                *   `name` (text, not null, unique constraint likely needed per user)
                *   `created_at` (timestamp with time zone, default: `now()`)
        4.  **Create `asset_tags` join table:**
            *   Columns:
                *   `asset_id` (uuid, foreign key to `assets.id`, part of composite primary key)
                *   `tag_id` (uuid, foreign key to `tags.id`, part of composite primary key)
        5.  Apply schema changes via Supabase SQL editor or migrations.
        6.  Update Supabase RLS policies for new tables (`folders`, `tags`, `asset_tags`) to allow CRUD operations for authenticated users based on `user_id`.
    *   **Testing:**
        1.  Verify new tables (`folders`, `tags`, `asset_tags`) and the `folder_id` column on `assets` exist in Supabase Table Editor with correct types and constraints.
        2.  Verify RLS policies are applied to the new tables.

*   **[X] Step 2.2: Implement Folder Creation UI & Action**
    *   **Task:**
        1.  **UI:** Add a "Create Folder" button to the gallery page (`/app/(protected)/dam/page.tsx` or within `components/dam/AssetGallery.tsx`).
        2.  **Dialog:** On button click, open a `<Dialog>` prompting for the folder name using an `<Input>` and a submit button.
        3.  **Server Action:** Create `async function createFolder(name: string, parentFolderId?: string)` in `lib/actions/dam.ts`.
            *   Get `user_id`.
            *   Insert row into `folders` table with `name`, `user_id`, and `parent_folder_id` (if provided, represents current view).
            *   Handle errors.
            *   `revalidatePath('/dam')` (or specific folder path if applicable).
            *   Return success/error status.
        4.  **Client Logic:** Wire up the dialog form to call `createFolder`, handle pending state, show feedback, and close dialog on success.
    *   **Testing:**
        1.  Visit `/dam`. Click "Create Folder". Enter a name, submit.
        2.  Verify new folder appears in the gallery UI (requires Step 2.4).
        3.  Verify folder row is created in Supabase `folders` table.
        4.  Test error handling (e.g., duplicate name if constraint added).

*   **[X] Step 2.3: Update Gallery to Display Folders & Handle Navigation**
    *   **Task:**
        1.  **Fetch Folders:** Modify `AssetGallery.tsx` (or its data fetching logic) to fetch folders alongside assets, potentially based on the current `parent_folder_id` (from URL param or state).
        2.  **Render Folders:** Create a `components/dam/FolderThumbnail.tsx` component to display folders visually distinct from assets. Render these alongside assets in the gallery grid.
        3.  **Navigation:** Make `FolderThumbnail` components interactive (e.g., clickable). Clicking a folder should navigate the user "into" that folder (e.g., update URL query parameter `?folderId=...`, trigger refetch/re-render of `AssetGallery` with the new `folderId`).
        4.  **Breadcrumbs:** Add breadcrumb navigation (e.g., using `shadcn/ui` Breadcrumb) above the gallery to show the current folder path and allow navigation back up the hierarchy.
    *   **Testing:**
        1.  Visit `/dam`. Verify both assets and created folders (Step 2.2) are displayed.
        2.  Click a folder. Verify the view updates to show the contents of that folder (initially empty). Verify breadcrumbs update.
        4.  Use breadcrumbs to navigate back up.

*   **[ ] Step 2.4: Implement Asset Moving (Drag & Drop / Menu)**
    *   **Task:**
        1.  **UI:** Decide on mechanism:
            *   *Option A (Drag & Drop):* Make assets (`AssetThumbnail`) and folders draggable/droppable using a library like `dnd-kit`.
            *   *Option B (Context Menu/Button):* Add a "Move" option to each asset (e.g., in a dropdown menu) that opens a dialog/selector to choose the destination folder.
        2.  **Server Action:** Create `async function moveAsset(assetId: string, targetFolderId: string | null)` in `lib/actions/dam.ts`.
            *   Get `user_id` for authorization.
            *   Verify user owns the asset.
            *   Update the `folder_id` column on the `assets` table for the given `assetId`. Set to `null` if moving to root.
            *   Handle errors.
            *   `revalidatePath('/dam')` (or specific folder paths).
            *   Return success/error status.
        3.  **Client Logic:** Implement the chosen UI mechanism to call `moveAsset`, handle pending state, and show feedback. Update UI optimistically or rely on `revalidatePath`.
    *   **Testing:**
        1.  Visit `/dam`. Perform the move action (drag or menu).
        2.  Verify asset disappears from the source location and appears in the target folder UI (requires Step 2.4).
        3.  Verify the `folder_id` is updated correctly in the Supabase `assets` table.
        4.  Test moving into and out of folders.

*   **[ ] Step 2.5: Implement Tagging UI & Actions**
    *   **Task:**
        1.  **UI (Tag Input):** In an asset detail view/modal (or directly on `AssetThumbnail` via popover), add an interface for adding/removing tags. Could use a combobox/multi-select input (`shadcn/ui` Command or Select) that allows selecting existing tags or creating new ones.
        2.  **Server Action (Add/Create Tag):** Create `async function addTagToAsset(assetId: string, tagName: string)` in `lib/actions/dam.ts`.
            *   Get `user_id`.
            *   Check if tag `name` exists for the user in `tags`. If not, create it. Get the `tag_id`.
            *   Insert a row into `asset_tags` linking `asset_id` and `tag_id`. Handle potential conflicts (tag already added).
            *   Handle errors.
            *   `revalidatePath` (potentially for the specific asset or gallery).
            *   Return success/error.
        3.  **Server Action (Remove Tag):** Create `async function removeTagFromAsset(assetId: string, tagId: string)` in `lib/actions/dam.ts`.
            *   Get `user_id` for auth.
            *   Delete row from `asset_tags` matching `asset_id` and `tag_id`.
            *   Handle errors.
            *   `revalidatePath`.
            *   Return success/error.
        4.  **Client Logic:** Wire up the tag input UI to call the actions, display existing tags for the asset, handle pending states, and show feedback.
    *   **Testing:**
        1.  Open the tagging UI for an asset.
        2.  Add a new tag (e.g., "important"). Verify it appears on the asset. Verify `tags` and `asset_tags` tables are updated in Supabase.
        3.  Add the same tag again. Verify it handles the duplicate gracefully.
        4.  Add an existing tag (if another asset has one). Verify `asset_tags` is updated.
        5.  Remove a tag. Verify it disappears from the UI and the `asset_tags` table.

*   **[ ] Step 2.6: Implement Multi-Select & Bulk Delete**
    *   **Task:**
        1.  **UI (Selection):** Add checkboxes or similar UI to `AssetThumbnail` (and `FolderThumbnail`?) to allow selecting multiple items. Could appear on hover or persistently. Maintain selection state in the parent gallery component.
        2.  **UI (Bulk Actions Bar):** When one or more items are selected, display a contextual action bar (e.g., at the top or bottom) with a "Delete Selected" button.
        3.  **Server Action:** Create `async function deleteMultipleAssets(assetIds: string[])` in `lib/actions/dam.ts`. *Note: Need corresponding storage paths too, or fetch them in the action.*
            *   Get `user_id`.
            *   Fetch assets matching `assetIds` to get `storage_path` and verify ownership.
            *   Delete files from storage: `supabase.storage.from('assets').remove([array_of_storage_paths])`.
            *   Delete records from database: `supabase.from('assets').delete().in('id', assetIds)`.
            *   Handle partial failures (e.g., some delete, others fail).
            *   `revalidatePath('/dam')`.
            *   Return detailed success/error status.
        4.  **Client Logic:** Trigger the bulk delete action from the action bar, show confirmation (`AlertDialog`), handle pending state, display feedback based on return status. Clear selection state.
    *   **Testing:**
        1.  Visit `/dam`. Select multiple assets.
        2.  Verify the bulk action bar appears.
        3.  Click "Delete Selected". Confirm in the dialog.
        4.  Verify selected assets are removed from UI, storage, and database.
        5.  Test selecting a mix of assets, some deletable, some not (if permissions existed).
        6.  Test canceling the bulk delete.

---

**Phase 3: Enhanced Discovery & Asset Types**

*   **[ ] Step 3.1: Implement Search Functionality**
    *   **Task:**
        1.  **UI:** Add a search input field (`shadcn/ui Input` with search icon) to the gallery page (`/app/(protected)/dam/page.tsx`).
        2.  **Data Fetching:** Modify the data fetching logic in `AssetGallery.tsx` (or its source) to accept a search query parameter.
        3.  **Backend Query:** Update the Supabase query to filter assets based on the search term.
            *   Search `assets.name` using `ilike '%${searchTerm}%'`.
            *   Search associated tags: Join `asset_tags` and `tags`, filter where `tags.name ilike '%${searchTerm}%'`. Combine results (e.g., using `UNION` or separate queries client-side). *Consider database performance implications.*
        4.  **Client Logic:** Update the search input to trigger a refetch/navigation with the search term (e.g., update URL query parameter `?search=...`, rely on Next.js routing and `revalidatePath` or manage state manually). Add debouncing to the search input.
    *   **Testing:**
        1.  Visit `/dam`. Type a partial filename into the search box. Verify gallery filters accordingly.
        2.  Type a tag name used on some assets. Verify those assets appear.
        3.  Clear the search box. Verify the full gallery returns.
        4.  Test searching within a specific folder.

*   **[ ] Step 3.2: Implement Sorting Functionality**
    *   **Task:**
        1.  **UI:** Add a dropdown (`shadcn/ui Select`) to the gallery page allowing users to choose sort criteria (e.g., "Name (A-Z)", "Name (Z-A)", "Date Uploaded (Newest)", "Date Uploaded (Oldest)", "Size (Largest)", "Size (Smallest)").
        2.  **Data Fetching:** Modify data fetching to accept sort order parameters (column and direction).
        3.  **Backend Query:** Update the Supabase query to use `.order(column, { ascending: boolean })` based on the selected criteria.
        4.  **Client Logic:** Update the sort dropdown to trigger refetch/navigation with the sort parameters (e.g., URL query params `?sortBy=name&sortDir=asc`).
    *   **Testing:**
        1.  Visit `/dam`. Select different sorting options.
        2.  Verify the order of assets in the gallery updates correctly based on name, date, and size.
        3.  Test sorting within folders and with search terms applied.

*   **[ ] Step 3.3: Implement Filtering Functionality (By Tag)**
    *   **Task:**
        1.  **UI:** Add a filter mechanism, perhaps another dropdown or a multi-select combobox, allowing users to select one or more tags to filter by. Display available tags dynamically.
        2.  **Data Fetching:** Modify data fetching to accept selected tag IDs.
        3.  **Backend Query:** Update Supabase query to filter assets based on selected tags. Requires joining `asset_tags` and filtering where `asset_tags.tag_id` is in the list of selected tag IDs. Handle logic for multiple tags (AND vs OR).
        4.  **Client Logic:** Update the filter UI to trigger refetch/navigation with filter parameters (e.g., URL query params `?tags=id1,id2`).
    *   **Testing:**
        1.  Visit `/dam`. Select a tag from the filter UI. Verify only assets with that tag are shown.
        2.  Select multiple tags (if supported). Verify results match AND/OR logic.
        3.  Combine filtering with sorting and searching. Clear filters.

*   **[ ] Step 3.4: Implement List View Toggle**
    *   **Task:**
        1.  **UI (Toggle):** Add UI controls (e.g., buttons with grid and list icons) to switch between Gallery View and List View.
        2.  **UI (List View Component):** Create `components/dam/AssetListView.tsx` to render assets and folders in a table or list format, showing columns like Name, Type, Date Modified, Size.
        3.  **Client Logic:** Manage the view state (list or grid). Conditionally render either `AssetGallery.tsx` (or the relevant grid component) or `AssetListView.tsx`.
        4.  **Integration:** Ensure sorting, filtering, selection, and navigation functionalities work correctly within the List View.
    *   **Testing:**
        1.  Visit `/dam`. Verify the default view (Grid/Gallery).
        2.  Click the List View toggle. Verify the view changes to a list/table format showing relevant columns.
        3.  Test sorting, filtering, folder navigation, and selection in List View.
        4.  Toggle back to Grid View. Verify state (like current folder, sort order) is preserved if appropriate.

*   **[ ] Step 3.5: Extend Upload for Video & Documents**
    *   **Task:**
        1.  **Client Validation:** Update `AssetUploader.tsx`'s client-side MIME type validation to include common video types (e.g., `video/mp4`, `video/webm`) and document types (e.g., `application/pdf`).
        2.  **Server Action:** Ensure `uploadAssets` doesn't have server-side validation preventing these types (it likely relies on storage policies).
        3.  **Supabase Policy:** Review the `assets` bucket policy; ensure it allows uploads for the desired new MIME types.
    *   **Testing:**
        1.  Go to `/dam/upload`. Attempt to select/drop MP4, WEBM, PDF files. Verify they are accepted by the UI validator.
        2.  Upload these files. Verify success.
        3.  Check Supabase storage and `assets` table to confirm upload and correct metadata (esp. `mime_type`).

*   **[ ] Step 3.6: Implement Non-Image Thumbnails & Previews**
    *   **Task:**
        1.  **Thumbnails:** Modify `AssetThumbnail.tsx`. If `asset.mime_type` is not an image, display a generic file-type icon (e.g., video icon, PDF icon) instead of using the `publicUrl` in an `<img>` tag. Include the filename.
        2.  **Preview Logic (Modal/Detail View):** Implement or enhance the asset preview mechanism (e.g., when an `AssetThumbnail` is clicked, open a `<Dialog>`).
            *   If image, show the image.
            *   If video (`video/*`), render an HTML5 `<video>` tag with `src={publicUrl}` and controls.
            *   If PDF (`application/pdf`), render an `<iframe>` or `<embed>` tag with `src={publicUrl}` to leverage browser PDF viewing.
            *   Handle other document types (display icon, filename, download link).
    *   **Testing:**
        1.  Visit `/dam`. Verify video and PDF assets show appropriate icons in the gallery grid.
        2.  Click on a video asset thumbnail. Verify the preview modal opens and plays the video.
        3.  Click on a PDF asset thumbnail. Verify the preview modal opens and displays the PDF content.
        4.  Click on an image asset. Verify the image preview still works.

---

*(Phases 4 and 5 follow the same structure: Define steps based on FRs, including UI, Server Actions, DB changes, and Testing procedures)*

---

**Phase 4: Collaboration & Control (Outline)**

*   **[ ] Step 4.1: Define User Roles/Permissions Model:**
    *   Task: Decide on roles (e.g., Viewer, Uploader, Manager). Update database (maybe `user_roles` table or add role column to `users`). Implement logic (potentially in middleware or actions) to check roles.
    *   Testing: Verify role assignment and retrieval.
*   **[ ] Step 4.2: Enforce Permissions in Actions:**
    *   Task: Modify `createFolder`, `moveAsset`, `addTagToAsset`, `removeTagFromAsset`, `deleteMultipleAssets`, `deleteAsset`, `uploadAssets` actions to check user roles/permissions before proceeding.
    *   Testing: Attempt actions with users having insufficient permissions; verify failure with appropriate error. Verify success for authorized users.
*   **[ ] Step 4.3: Adapt UI based on Permissions:**
    *   Task: Conditionally render UI elements (buttons like Delete, Create Folder, Upload) based on user permissions fetched server-side or client-side.
    *   Testing: Log in as users with different roles; verify UI elements appear/are hidden correctly.
*   **[ ] Step 4.4: Implement Version History Backend:**
    *   Task: Modify `assets` table or create a new `asset_versions` table to store previous versions (storage path, timestamp). Update upload/edit actions to create versions.
    *   Testing: Upload a file, upload a new version with the same name (or implement explicit versioning action); verify version records are created.
*   **[ ] Step 4.5: Implement Version History UI:**
    *   Task: Add UI (e.g., in asset detail view) to list versions. Add "Revert" button.
    *   Task: Create `revertAssetVersion` server action to update the main `assets` record's `storage_path` (or swap records).
    *   Testing: View version history. Click revert; verify asset updates to the previous version.

---

**Phase 5: Advanced Capabilities (Outline)**

*   **[ ] Step 5.1: Basic Image Editing (Crop/Resize):**
    *   Task: Integrate a client-side image editing library (e.g., Cropper.js) into the asset detail/preview modal. Add Save button.
    *   Task: Update `uploadAssets` or create `editImageAsset` action to handle saving the edited image data (overwrite, new version, or new asset).
    *   Testing: Open image, crop/resize, save. Verify changes are reflected based on the chosen save strategy.
*   **[ ] Step 5.2: Shareable Links (Placeholder):**
    *   Task: Add "Share" button. Generate signed URLs (Supabase storage) or create a sharing table/mechanism. Display link in UI.
    *   Testing: Generate link, access it (authenticated/unauthenticated as per design).
*   **[ ] Step 5.3: Comments/Annotations (Placeholder):**
    *   Task: Add comments table (`asset_comments`). Add comment input UI to asset detail view. Implement actions to add/fetch comments.
    *   Testing: Add/view comments on an asset.
*   **[ ] Step 5.4: Basic Analytics (Placeholder):**
    *   Task: Add tracking (e.g., `view_count`, `download_count` columns to `assets`, or separate analytics table). Increment counts in relevant actions/views. Create simple display UI.
    *   Testing: View/download assets; verify counts increment. View analytics UI.
*   **[ ] Step 5.5: AI Auto-Tagging (Placeholder):**
    *   Task: Integrate external AI service (e.g., AWS Rekognition, Google Vision AI) or Supabase Edge Function. Trigger on upload. Add results via `addTagToAsset` action.
    *   Testing: Upload image; verify relevant tags are automatically added. 