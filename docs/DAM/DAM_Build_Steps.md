# DAM Feature - Full Build Steps

This document outlines the step-by-step process for implementing the Digital Asset Management (DAM) feature, following the phases defined in `DAM_FSD.md`.

**Assumptions:**

*   Supabase credentials are set up in `.env.local`.
*   Next.js Server Actions will be used for backend logic (`lib/actions/dam.ts`).
*   `shadcn/ui` components and Tailwind CSS will be used for the UI (primarily in `components/dam/`).
*   Relevant routes exist: `/app/(protected)/dam/page.tsx` (Gallery), potentially others as needed.

## Phase 1: Foundation

**Step 1: Setup Supabase Resources**
*   [x] **Create Supabase Storage Bucket:**
    *   [x] Name: `assets`
    *   [x] Configure access policy: Start with Public access for simplicity in Phase 1 (requires careful consideration of security implications later).
*   [x] **Create Supabase Database Table:**
    *   [x] Name: `assets`
    *   [x] Enable Row Level Security (RLS) - Recommended even if policies are permissive initially.
    *   [x] Columns:
        *   [x] `id` (uuid, primary key, default: `uuid_generate_v4()`)
        *   [x] `user_id` (uuid, foreign key to `auth.users.id`, nullable if auth isn't strict yet)
        *   [x] `name` (text, not null, original filename)
        *   [x] `storage_path` (text, not null, path within the Supabase bucket)
        *   [x] `mime_type` (text, not null)
        *   [x] `size` (integer, not null, bytes)
        *   [x] `created_at` (timestamp with time zone, default: `now()`)
*   [x] **Testing:**
    *   [x] Log in to Supabase Dashboard.
    *   [x] Navigate to Storage -> Buckets. Verify `assets` bucket exists and is Public.
    *   [x] Navigate to Table Editor. Verify `assets` table exists with correct columns, types, and constraints.
    *   [x] Navigate to Authentication -> Policies. Verify RLS is enabled for the `assets` table (even if no specific policies are added yet).

**Step 2: Create the Asset Upload Component (UI)**
*   [x] **Create directory `components/dam`.**
*   [x] **Create client component file: `components/dam/AssetUploader.tsx` (use `"use client";` directive).**
*   [x] **Build the UI using `shadcn/ui` components:**
    *   [x] An `<Input type="file" multiple />` (potentially hidden and triggered by a button/area).
    *   [x] A visually distinct area (e.g., dashed border) for drag-and-drop, using `onDragOver`, `onDrop`, etc.
    *   [x] A `<Button>` to trigger the file input or submit.
    *   [x] Display area for selected file previews (name, size, potentially thumbnail for images client-side).
*   [x] **Add state (`useState`) to manage selected files, drag-over state.**
*   [x] **Implement client-side validation for accepted file types**
    *   [x] Original validation was image-only (MIME types: `image/jpeg`, `image/png`, `image/gif`, `image/webp`)
    *   [x] **Update:** Expanded to include audio, documents, and other common file types
*   [x] **Testing:**
    *   [x] Create a test page route: `/app/dam/upload/page.tsx`.
    *   [x] Import and render `<AssetUploader />` on the test page.
    *   [x] Run `npm run dev`.
    *   [x] Visit `/dam/upload`.
    *   [x] Verify UI elements render correctly (button, drop zone).
    *   [x] Test file selection via button click -> Verify selected files are shown in the preview area.
    *   [x] Test drag-and-drop -> Verify visual feedback on drag over, verify dropped files shown in preview.
    *   [x] Test selecting/dropping multiple files.
    *   [x] **Update:** Test uploading non-image files (audio, PDFs, etc.) -> Verify client accepts them

**Step 3: Implement the Upload Server Action**
*   [x] **Create `lib/actions/dam.ts` (add `"use server";` at top).**
*   [x] **Define `async function uploadAssets(formData: FormData): Promise<{ success: boolean; error?: string; data?: any[] }>`.**
*   [x] **Action Logic:**
    *   [x] Get user session (if needed for `user_id`).
    *   [x] Get files from `formData.getAll('files')`.
    *   [x] Create Supabase service role client (`createServerActionClient` from `@supabase/ssr` is suitable).
    *   [x] Iterate through files:
        *   [x] Generate a unique storage path (e.g., `user_id || 'public' / ${crypto.randomUUID()}-${file.name}`).
        *   [x] Upload to `assets` bucket: `supabase.storage.from('assets').upload(storagePath, file)`.
        *   [x] Handle storage errors meticulously.
        *   [x] If upload succeeds, get metadata (`file.name`, `file.size`, `file.type`).
        *   [x] Insert record into `assets` table (include `user_id`, `name`, `storage_path`, `mime_type`, `size`).
        *   [x] Handle database errors (e.g., constraint violations).
    *   [x] Aggregate results (success/failure for each file).
    *   [x] Return overall status, errors, and data of successfully uploaded assets.
    *   [x] **Update:** Modified to accept all file types, not just images
*   [x] **Testing:**
    *   [x] In `AssetUploader.tsx`:
        *   [x] Import `uploadAssets` action.
        *   [x] Wrap UI in a `<form>` tag.
        *   [x] Call the action using the form's `action` prop or programmatically on button click (passing `FormData`).
        *   [x] Use `useFormState` or state management to display pending/loading state during upload.
        *   [x] Display success/error messages based on the action's return value.
    *   [x] Run dev server.
    *   [x] Go to `/dam/upload`.
    *   [x] Select/drop one or more valid files.
    *   [x] Submit the form.
    *   [x] Verify loading state is shown.
    *   [x] Check browser network tab for the server action call.
    *   [x] Check Supabase Dashboard:
        *   [x] Verify files appear in the `assets` Storage bucket.
        *   [x] Verify corresponding rows appear in the `assets` database table with correct metadata.
    *   [x] Verify success feedback is shown in the UI.
    *   [x] **Update:** Test uploading non-image files and verify they're processed correctly

**Step 4: Create the Asset Gallery Component**
*   [x] **Create Server Component: `components/dam/AssetGallery.tsx`.**
*   [x] **Fetch Data: Inside the component (it's async by default):**
    *   [x] Create Supabase client (server component client from `@supabase/ssr`).
    *   [x] Fetch records from `assets` table (`select('*').order('created_at', { ascending: false })`). Add `user_id` filter if needed.
*   [x] **Generate Public URLs:**
    *   [x] For each asset record, get the public URL: `supabase.storage.from('assets').getPublicUrl(asset.storage_path).data.publicUrl`.
*   [x] **Render Gallery:**
    *   [x] Use Tailwind CSS grid for a responsive layout.
    *   [x] Map over assets, rendering each using a sub-component (e.g., `AssetThumbnail`). Pass asset data and public URL.
    *   [x] Implement basic loading state (e.g., skeleton loader) while data fetches.
*   [x] **Testing:**
    *   [x] Create page route `/app/dam/page.tsx`.
    *   [x] Import and render `<AssetGallery />` within the page (potentially wrapped in `<Suspense>`).
    *   [x] Ensure >0 assets are uploaded via Step 3.
    *   [x] Run dev server.
    *   [x] Visit `/dam`.
    *   [x] Verify loading state (if implemented).
    *   [x] Verify the gallery displays thumbnails of uploaded assets correctly using public URLs.
    *   [x] Test responsiveness by resizing the browser window.
    *   [x] **Update:** Verify different file types display appropriate thumbnails/icons

**Step 5: Implement Delete Asset Functionality**
*   [x] **Define Server Action `async function deleteAsset(assetId: string, storagePath: string): Promise<{ success: boolean; error?: string }>`** in `lib/actions/dam.ts`.
*   [x] **Action Logic:**
    *   [x] Get user session/ID for authorization check.
    *   [x] Create Supabase service role client.
    *   [x] (Authorization Check: Verify the requesting user owns the asset - fetch asset by ID and check `user_id`).
    *   [x] Delete file from storage: `supabase.storage.from('assets').remove([storagePath])`.
    *   [x] Handle storage deletion errors (e.g., file not found).
    *   [x] Delete record from database: `supabase.from('assets').delete().match({ id: assetId /*, user_id: userId */ })`.
    *   [x] Handle database deletion errors.
    *   [x] If successful, call `revalidatePath('/dam')` to trigger gallery refresh.
    *   [x] Return success/error status.
*   [x] **Create Client Component `components/dam/AssetThumbnail.tsx` (or add client logic to `AssetGallery`).**
    *   [x] Receive asset data and public URL as props.
    *   [x] Render the `<img>` tag.
    *   [x] Add a delete button (e.g., small 'X' icon positioned absolutely, visible on hover).
    *   [x] Import `deleteAsset` action.
    *   [x] Use `shadcn/ui` `<AlertDialog>` component for confirmation.
    *   [x] On button click, show AlertDialog.
    *   [x] On confirmation in AlertDialog, call `deleteAsset(asset.id, asset.storage_path)`. Handle pending state and display feedback (e.g., toast). Use `startTransition` for smoother UI updates if needed.
    *   [x] **Update:** Enhanced to display appropriate icons/placeholders for different file types
*   [x] **Testing:**
    *   [x] Refactor `AssetGallery` to use `AssetThumbnail` for rendering each item.
    *   [x] Visit `/dam` gallery.
    *   [x] Hover over an asset -> Verify delete button appears.
    *   [x] Click delete button -> Verify confirmation dialog (`AlertDialog`) appears.
    *   [x] Click Cancel -> Verify dialog closes and nothing is deleted.
    *   [x] Click delete button again -> Confirm deletion in the dialog.
    *   [x] Verify loading state on the thumbnail/button while action runs.
    *   [x] Verify the asset is removed from the gallery UI smoothly (due to `revalidatePath`).
    *   [x] Verify the file is removed from the Supabase Storage bucket.
    *   [x] Verify the row is removed from the Supabase `assets` table.
    *   [x] Verify success feedback (e.g., toast).
    *   [x] Test deleting an asset immediately after upload.

## Phase 2: Core Organization & Management

**Step 2.1: Update Database Schema for Folders & Tags**
*   [x] **Add `folder_id` to `assets` table:**
    *   [x] Column: `folder_id` (uuid, nullable, foreign key to the new `folders` table). This links an asset to the specific folder it resides in.
*   [x] **Create `folders` table:**
    *   [x] Columns:
        *   [x] `id` (uuid, primary key, default: `uuid_generate_v4()`)
        *   [x] `user_id` (uuid, foreign key to `auth.users.id`)
        *   [x] `name` (text, not null)
        *   [x] `parent_folder_id` (uuid, nullable, foreign key to `folders.id`). This column enables the **hierarchical structure (subfolders)** by linking a folder to its parent. A `null` value indicates a root-level folder.
        *   [x] `created_at` (timestamp with time zone, default: `now()`)
*   [x] **Create `tags` table:**
    *   [x] Columns:
        *   [x] `id` (uuid, primary key, default: `uuid_generate_v4()`)
        *   [x] `user_id` (uuid, foreign key to `auth.users.id`)
        *   [x] `name` (text, not null, unique constraint likely needed per user)
        *   [x] `created_at` (timestamp with time zone, default: `now()`)
*   [x] **Create `asset_tags` join table:**
    *   [x] Columns:
        *   [x] `asset_id` (uuid, foreign key to `assets.id`, part of composite primary key)
        *   [x] `tag_id` (uuid, foreign key to `tags.id`, part of composite primary key)
*   [x] **Testing:**
    *   [x] Verify new tables (`folders`, `tags`, `asset_tags`) and the `folder_id` column on `assets` exist in Supabase Table Editor with correct types and constraints.
    *   [x] Verify RLS policies are applied to the new tables.

**Step 2.2: Implement Folder Creation UI & Action**
*   [x] **UI:** Add a "Create Folder" button to the gallery page (`/app/(protected)/dam/page.tsx` or within `components/dam/AssetGallery.tsx`).
*   [x] **Dialog:** On button click, open a `<Dialog>` prompting for the folder name using an `<Input>` and a submit button.
*   [x] **Server Action:** Create `async function createFolder(name: string, parentFolderId?: string)` in `lib/actions/dam.ts`.
    *   [x] Get `user_id`.
    *   [x] Insert row into `folders` table with `name`, `user_id`, and `parent_folder_id`. `parentFolderId` should be the ID of the folder currently being viewed, allowing creation of **subfolders**. If creating in the root, `parentFolderId` will be `null` or undefined.
    *   [x] Handle errors.
    *   [x] `revalidatePath('/dam')` (or specific folder path if applicable).
    *   [x] Return success/error status.
*   [x] **Client Logic:** Wire up the dialog form to call `createFolder`, handle pending state, show feedback, and close dialog on success.
*   [x] **Testing:**
    *   [x] Visit `/dam`. Click "Create Folder". Enter a name, submit.
    *   [x] Verify new folder appears in the gallery UI.
    *   [x] Verify folder row is created in Supabase `folders` table.
    *   [x] Test error handling (e.g., duplicate name if constraint added).

**Step 2.3: Update Gallery to Display Folders & Handle Navigation**
*   [x] **Fetch Folders:** Modify `AssetGallery.tsx` (or its data fetching logic) to fetch folders alongside assets, based on the current `parent_folder_id` (from URL param or state, `null` for root).
*   [x] **Render Folders:** Create a `components/dam/FolderThumbnail.tsx` component to display folders visually distinct from assets. Render these alongside assets in the gallery grid.
*   [x] **Navigation:** Make `FolderThumbnail` components interactive (e.g., clickable). Clicking a folder should navigate the user "into" that folder (e.g., update URL query parameter `?folderId=...`, trigger refetch/re-render of `AssetGallery` with the new `folderId` as the `parent_folder_id` for the next fetch), enabling navigation through the **folder hierarchy**.
*   [x] **Breadcrumbs:** Add breadcrumb navigation (e.g., using `shadcn/ui` Breadcrumb) above the gallery to show the current folder path (**reflecting the hierarchy**) and allow navigation back up level by level (or directly to root).
*   [x] **Testing:**
    *   [x] Visit `/dam`. Verify both assets and created folders are displayed at the root level.
    *   [x] Click a folder. Verify the view updates to show the contents of that folder (initially empty). Verify breadcrumbs update showing the parent folder.
    *   [x] Create a subfolder within the current folder. Verify it appears. Click into the subfolder. Verify breadcrumbs update further.
    *   [x] Use breadcrumbs to navigate back up one level, and then back to the root.

**Step 2.4: Implement Asset Moving (Drag & Drop / Menu)**
*   [x] **UI:** Implement drag and drop using `dnd-kit` library.
*   [x] **Server Action:** Create `async function moveAsset(assetId: string, targetFolderId: string | null)` in `lib/actions/dam.ts`.
    *   [x] Get `user_id` for authorization.
    *   [x] Verify user owns the asset.
    *   [x] Update the `folder_id` column on the `assets` table for the given `assetId`. Set to `null` if moving to root.
    *   [x] Handle errors.
    *   [x] `revalidatePath('/dam')` (or specific folder paths).
    *   [x] Return success/error status.
*   [x] **Client Logic:** Implement drag and drop to call `moveAsset`, handle pending state, and show feedback.
*   [x] **Testing:**
    *   [x] Visit `/dam`. Drag an asset to a folder.
    *   [x] Verify asset disappears from the source location and appears in the target folder UI.
    *   [x] Verify the `folder_id` is updated correctly in the Supabase `assets` table.
    *   [x] Test moving into and out of folders.

**Step 2.5: Implement Tagging UI & Actions**
*   [x] **UI (Tag Input):** In an asset detail view/modal (or directly on `AssetThumbnail` via popover), add an interface for adding/removing tags. Could use a combobox/multi-select input (`shadcn/ui` Command or Select) that allows selecting existing tags or creating new ones.
*   [x] **Server Action (Add/Create Tag):** Create `async function addTagToAsset(assetId: string, tagName: string)` in `lib/actions/dam.ts`.
    *   [x] Get `user_id`.
    *   [x] Check if tag `name` exists for the user in `tags`. If not, create it. Get the `tag_id`.
    *   [x] Insert a row into `asset_tags` linking `asset_id` and `tag_id`. Handle potential conflicts (tag already added).
    *   [x] Handle errors.
    *   [x] `revalidatePath` (potentially for the specific asset or gallery).
    *   [x] Return success/error.
*   [x] **Server Action (Remove Tag):** Create `async function removeTagFromAsset(assetId: string, tagId: string)` in `lib/actions/dam.ts`.
    *   [x] Get `user_id` for auth.
    *   [x] Delete row from `asset_tags` matching `asset_id` and `tag_id`.
    *   [x] Handle errors.
    *   [x] `revalidatePath`.
    *   [x] Return success/error.
*   [x] **Client Logic:** Wire up the tag input UI to call the actions, display existing tags for the asset, handle pending states, and show feedback.
*   [x] **Testing:**
    *   [x] Open the tagging UI for an asset.
    *   [x] Add a new tag (e.g., "important"). Verify it appears on the asset. Verify `tags` and `asset_tags` tables are updated in Supabase.
    *   [x] Add the same tag again. Verify it handles the duplicate gracefully.
    *   [x] Add an existing tag (if another asset has one). Verify `asset_tags` is updated.
    *   [x] Remove a tag. Verify it disappears from the UI and the `asset_tags` table.

**Step 2.6: Implement Multi-Select & Bulk Delete**
*   [ ] **UI (Selection):** Add checkboxes or similar UI to `AssetThumbnail` (and `FolderThumbnail`?) to allow selecting multiple items. Could appear on hover or persistently. Maintain selection state in the parent gallery component.
*   [ ] **UI (Bulk Actions Bar):** When one or more items are selected, display a contextual action bar (e.g., at the top or bottom) with a "Delete Selected" button.
*   [ ] **Server Action:** Create `async function deleteMultipleAssets(assetIds: string[])` in `lib/actions/dam.ts`. 
    *   [ ] Get `user_id`.
    *   [ ] Fetch assets matching `assetIds` to get `storage_path` and verify ownership.
    *   [ ] Delete files from storage: `supabase.storage.from('assets').remove([array_of_storage_paths])`.
    *   [ ] Delete records from database: `supabase.from('assets').delete().in('id', assetIds)`.
    *   [ ] Handle partial failures (e.g., some delete, others fail).
    *   [ ] `revalidatePath('/dam')`.
    *   [ ] Return detailed success/error status.
*   [ ] **Client Logic:** Trigger the bulk delete action from the action bar, show confirmation (`AlertDialog`), handle pending state, display feedback based on return status. Clear selection state.
*   [ ] **Testing:**
    *   [ ] Visit `/dam`. Select multiple assets.
    *   [ ] Verify the bulk action bar appears.
    *   [ ] Click "Delete Selected". Confirm in the dialog.
    *   [ ] Verify selected assets are removed from UI, storage, and database.
    *   [ ] Test selecting a mix of assets, some deletable, some not (if permissions existed).
    *   [ ] Test canceling the bulk delete.

## Phase 3: Enhanced Discovery & Asset Types

**Step 3.1: Implement Search Functionality**
*   [x] **UI:** Add a search input field (`shadcn/ui Input` with search icon) to the gallery page (`/app/(protected)/dam/page.tsx`).
*   [x] **Data Fetching:** Modify the data fetching logic in `AssetGallery.tsx` (or its source) to accept a search query parameter.
*   [x] **Backend Query:** Update the Supabase query to filter assets based on the search term.
    *   [x] Search `assets.name` using `ilike '%${searchTerm}%'`.
    *   [x] Search associated tags: Join `asset_tags` and `tags`, filter where `tags.name ilike '%${searchTerm}%'`. Combine results (e.g., using `UNION` or separate queries client-side).
*   [x] **Client Logic:** Update the search input to trigger a refetch/navigation with the search term (e.g., update URL query parameter `?search=...`, rely on Next.js routing and `revalidatePath` or manage state manually). Add debouncing to the search input.
*   [x] **Testing:**
    *   [x] Visit `/dam`. Type a partial filename into the search box. Verify gallery filters accordingly.
    *   [x] Type a tag name used on some assets. Verify those assets appear.
    *   [x] Clear the search box. Verify the full gallery returns.
    *   [x] Test searching within a specific folder.

**Step 3.2: Implement Sorting Functionality**
*   [x] **UI:** Add a dropdown (`shadcn/ui Select`) to the gallery page allowing users to choose sort criteria (e.g., "Name (A-Z)", "Name (Z-A)", "Date Uploaded (Newest)", "Date Uploaded (Oldest)", "Size (Largest)", "Size (Smallest)").
*   [x] **Data Fetching:** Modify data fetching to accept sort order parameters (column and direction).
*   [x] **Backend Query:** Update the Supabase query to use `.order(column, { ascending: boolean })` based on the selected criteria.
*   [x] **Client Logic:** Update the sort dropdown to trigger refetch/navigation with the sort parameters (e.g., URL query params `?sortBy=name&sortDir=asc`).
*   [x] **Testing:**
    *   [x] Visit `/dam`. Select different sorting options.
    *   [x] Verify the order of assets in the gallery updates correctly based on name, date, and size.
    *   [x] Test sorting within folders and with search terms applied.

**Step 3.3: Implement Filtering Functionality (By Tag)**
*   [x] **UI:** Add a filter mechanism, perhaps another dropdown or a multi-select combobox, allowing users to select one or more tags to filter by. Display available tags dynamically.
*   [x] **Data Fetching:** Modify data fetching to accept selected tag IDs.
*   [x] **Backend Query:** Update Supabase query to filter assets based on selected tags. Requires joining `asset_tags` and filtering where `asset_tags.tag_id` is in the list of selected tag IDs. Handle logic for multiple tags (AND vs OR).
*   [x] **Client Logic:** Update the filter UI to trigger refetch/navigation with filter parameters (e.g., URL query params `?tags=id1,id2`).
*   [x] **Testing:**
    *   [x] Visit `/dam`. Select a tag from the filter UI. Verify only assets with that tag are shown.
    *   [x] Select multiple tags (if supported). Verify results match AND/OR logic.
    *   [x] Combine filtering with sorting and searching. Clear filters.

**Step 3.4: Implement List View Toggle**
*   [x] **UI (Toggle):** Add UI controls (e.g., buttons with grid and list icons) to switch between Gallery View and List View.
*   [x] **UI (List View Component):** Create `components/dam/AssetListView.tsx` to render assets and folders in a table or list format, showing columns like Name, Type, Date Modified, Size.
*   [x] **Client Logic:** Manage the view state (list or grid). Conditionally render either `AssetGallery.tsx` (or the relevant grid component) or `AssetListView.tsx`.
*   [x] **Integration:** Ensure sorting, filtering, selection, and navigation functionalities work correctly within the List View.
*   [x] **Testing:**
    *   [x] Visit `/dam`. Verify the default view (Grid/Gallery).
    *   [x] Click the List View toggle. Verify the view changes to a list/table format showing relevant columns.
    *   [x] Test sorting, filtering, folder navigation, and selection in List View.
    *   [x] Toggle back to Grid View. Verify state (like current folder, sort order) is preserved if appropriate.

**Step 3.5: Extend Upload for Video & Documents**
*   [x] **Client Validation:** Update `AssetUploader.tsx`'s client-side MIME type validation to include common file types:
    *   [x] Audio types: `audio/mpeg` (.mp3), `audio/wav` (.wav), `audio/ogg` (.ogg)
    *   [x] Document types: `application/pdf` (.pdf), `text/plain` (.txt), `text/markdown` (.md), etc.
    *   [ ] Video types: `video/mp4`, `video/webm`
*   [x] **Server Action:** Remove server-side filters that skipped non-image files in the `uploadAssets` function
*   [x] **Testing:**
    *   [x] Go to `/dam/upload`. Attempt to select/drop MP3, WAV, PDF files. Verify they are accepted by the UI validator.
    *   [x] Upload these files. Verify success.
    *   [x] Check Supabase storage and `assets` table to confirm upload and correct metadata (esp. `mime_type`).

**Step 3.6: Implement Non-Image Thumbnails & Previews**
*   [x] **Thumbnails:** Modify `AssetThumbnail.tsx`.
    *   [x] Add placeholders SVGs in `public/placeholders/` directory for different file types:
        *   [x] `audio.svg` for audio files
        *   [x] `document.svg` for document files
        *   [x] `generic.svg` as fallback
    *   [x] Conditionally display appropriate placeholder based on MIME type
    *   [x] Pass `mimeType` prop to AssetThumbnail from AssetGridItem
*   [ ] **Preview Logic (Modal/Detail View):** Implement or enhance the asset preview mechanism.
    *   [ ] If image, show the image
    *   [ ] If video, render HTML5 `<video>` tag with controls
    *   [ ] If audio, render `<audio>` tag with controls
    *   [ ] If PDF, render `<iframe>` or `<embed>` tag
    *   [ ] Handle other document types appropriately
*   [ ] **Testing:**
    *   [x] Visit `/dam`. Verify different file types show appropriate icons in the gallery grid.
    *   [ ] Click on different asset types. Verify preview modal opens with appropriate rendering.

## Phase 4: Collaboration & Control

**Step 4.1: Define User Roles/Permissions Model**
*   [ ] **Decide on roles:** Define roles such as Viewer, Uploader, Manager
*   [ ] **Update database:** Create user_roles table or add role column to users
*   [ ] **Implement logic:** Add middleware or action logic to check roles
*   [ ] **Testing:** Verify role assignment and retrieval works correctly

**Step 4.2: Enforce Permissions in Actions**
*   [ ] Modify all server actions to check user roles/permissions
*   [ ] Handle unauthorized access attempts gracefully with proper error messages
*   [ ] **Testing:** Test actions with users having different permission levels

**Step 4.3: Adapt UI based on Permissions**
*   [ ] Conditionally render UI elements based on user permissions
*   [ ] Hide buttons and controls for unauthorized actions
*   [ ] **Testing:** Verify UI elements appear/hide correctly for different user roles

**Step 4.4: Implement Version History Backend**
*   [ ] Modify database schema to track asset versions
*   [ ] Update upload/edit actions to create version records
*   [ ] **Testing:** Verify version records are created when assets are updated

**Step 4.5: Implement Version History UI**
*   [ ] Add UI to list asset versions
*   [ ] Implement revert functionality
*   [ ] **Testing:** Test viewing history and reverting to previous versions

## Phase 5: Advanced Capabilities

**Step 5.1: Basic Image Editing**
*   [ ] Integrate client-side image editing library
*   [ ] Create server action to save edited images
*   [ ] **Testing:** Verify edit operations and saving work correctly

**Step 5.2: Shareable Links**
*   [ ] Implement share button and link generation
*   [ ] Create necessary database tables or functions
*   [ ] **Testing:** Generate and test shared links

**Step 5.3: Comments/Annotations**
*   [ ] Add comments table and UI components
*   [ ] Implement comment add/view actions
*   [ ] **Testing:** Add and view comments on assets

**Step 5.4: Basic Analytics**
*   [ ] Add view/download tracking
*   [ ] Create analytics display UI
*   [ ] **Testing:** Verify analytics data collection and display

**Step 5.5: AI Auto-Tagging**
*   [ ] Integrate external AI service
*   [ ] Add automatic tag generation on upload
*   [ ] **Testing:** Verify relevant tags are automatically added 