# DAM Feature - Phase 1: Build Steps

This document outlines the step-by-step process for implementing Phase 1 of the Digital Asset Management (DAM) feature, focusing on an interactive, high-quality user experience.

**Assumptions:**

*   Supabase credentials are set up in `.env.local`.
*   Next.js Server Actions will be used for backend logic.
*   `shadcn/ui` components and Tailwind CSS will be used for the UI.

---

**Step 1: [COMPLETED] Setup Supabase Resources**

*   **Task:**
    1.  **Create Supabase Storage Bucket:**
        *   Name: `assets`
        *   Configure access policy: Start with Public access for simplicity in Phase 1 (requires careful consideration of security implications later).
    2.  **Create Supabase Database Table:**
        *   Name: `assets`
        *   Enable Row Level Security (RLS) - Recommended even if policies are permissive initially.
        *   Columns:
            *   `id` (uuid, primary key, default: `uuid_generate_v4()`)
            *   `user_id` (uuid, foreign key to `auth.users.id`, nullable if auth isn't strict yet)
            *   `name` (text, not null, original filename)
            *   `storage_path` (text, not null, path within the Supabase bucket)
            *   `mime_type` (text, not null)
            *   `size` (integer, not null, bytes)
            *   `created_at` (timestamp with time zone, default: `now()`)
*   **Testing:**
    1.  Log in to Supabase Dashboard.
    2.  Navigate to Storage -> Buckets. Verify `assets` bucket exists and is Public.
    3.  Navigate to Table Editor. Verify `assets` table exists with correct columns, types, and constraints.
    4.  Navigate to Authentication -> Policies. Verify RLS is enabled for the `assets` table (even if no specific policies are added yet).

---

**Step 2: [COMPLETED] Create the Asset Upload Component (UI)**

*   **Task:**
    1.  Create directory `components/dam`.
    2.  Create client component file: `components/dam/AssetUploader.tsx` (use `"use client";` directive).
    3.  Build the UI using `shadcn/ui` components:
        *   An `<Input type="file" multiple />` (potentially hidden and triggered by a button/area).
        *   A visually distinct area (e.g., dashed border) for drag-and-drop, using `onDragOver`, `onDrop`, etc.
        *   A `<Button>` to trigger the file input or submit.
        *   Display area for selected file previews (name, size, potentially thumbnail for images client-side).
    4.  Add state (`useState`) to manage selected files, drag-over state.
    5.  Implement client-side validation for accepted image MIME types (`image/jpeg`, `image/png`, `image/gif`, `image/webp`). Provide immediate visual feedback for invalid files.
*   **Testing:**
    1.  Create a test page route: `/app/dam/upload/page.tsx`.
    2.  Import and render `<AssetUploader />` on the test page.
    3.  Run `npm run dev`.
    4.  Visit `/dam/upload`.
    5.  Verify UI elements render correctly (button, drop zone).
    6.  Test file selection via button click -> Verify selected files are shown in the preview area.
    7.  Test drag-and-drop -> Verify visual feedback on drag over, verify dropped files shown in preview.
    8.  Test selecting/dropping non-image files -> Verify client-side validation rejects them with user feedback.
    9.  Test selecting/dropping multiple files.

---

**Step 3: [COMPLETED] Implement the Upload Server Action**

*   **Task:**
    1.  Create `lib/actions/dam.ts` (add `"use server";` at top).
    2.  Define `async function uploadAssets(formData: FormData): Promise<{ success: boolean; error?: string; data?: any[] }>`.
    3.  Action Logic:
        *   Get user session (if needed for `user_id`).
        *   Get files from `formData.getAll('files')`.
        *   Create Supabase service role client (`createServerActionClient` from `@supabase/ssr` is suitable).
        *   Iterate through files:
            *   Generate a unique storage path (e.g., `user_id || 'public' / ${crypto.randomUUID()}-${file.name}`).
            *   Upload to `assets` bucket: `supabase.storage.from('assets').upload(storagePath, file)`.
            *   Handle storage errors meticulously.
            *   If upload succeeds, get metadata (`file.name`, `file.size`, `file.type`).
            *   Insert record into `assets` table (include `user_id`, `name`, `storage_path`, `mime_type`, `size`).
            *   Handle database errors (e.g., constraint violations).
        *   Aggregate results (success/failure for each file).
        *   Return overall status, errors, and data of successfully uploaded assets.
*   **Testing:**
    1.  In `AssetUploader.tsx`:
        *   Import `uploadAssets` action.
        *   Wrap UI in a `<form>` tag.
        *   Call the action using the form's `action` prop or programmatically on button click (passing `FormData`).
        *   Use `useFormState` or state management to display pending/loading state during upload.
        *   Display success/error messages based on the action's return value.
        *   (Optional: Implement progress display by making separate calls or using Supabase upload progress features if available/needed).
    2.  Run dev server.
    3.  Go to `/dam/upload`.
    4.  Select/drop one or more valid image files.
    5.  Submit the form.
    6.  Verify loading state is shown.
    7.  Check browser network tab for the server action call.
    8.  Check Supabase Dashboard:
        *   Verify files appear in the `assets` Storage bucket.
        *   Verify corresponding rows appear in the `assets` database table with correct metadata.
    9.  Verify success feedback is shown in the UI.
    10. Test error handling: Try uploading a file that violates constraints (if any set), test potential permission issues (if RLS is configured strictly).

---

**Step 4: Create the Asset Gallery Component**

*   **Task:**
    1.  Create Server Component: `components/dam/AssetGallery.tsx`.
    2.  Fetch Data: Inside the component (it's async by default):
        *   Create Supabase client (server component client from `@supabase/ssr`).
        *   Fetch records from `assets` table (`select('*').order('created_at', { ascending: false })`). Add `user_id` filter if needed.
    3.  Generate Public URLs:
        *   For each asset record, get the public URL: `supabase.storage.from('assets').getPublicUrl(asset.storage_path).data.publicUrl`.
    4.  Render Gallery:
        *   Use Tailwind CSS grid for a responsive layout.
        *   Map over assets, rendering each using a sub-component (e.g., `AssetThumbnail`). Pass asset data and public URL.
        *   Implement basic loading state (e.g., skeleton loader) while data fetches.
*   **Testing:**
    1.  Create page route `/app/dam/page.tsx`.
    2.  Import and render `<AssetGallery />` within the page (potentially wrapped in `<Suspense>`).
    3.  Ensure >0 assets are uploaded via Step 3.
    4.  Run dev server.
    5.  Visit `/dam`.
    6.  Verify loading state (if implemented).
    7.  Verify the gallery displays thumbnails of uploaded assets correctly using public URLs.
    8.  Test responsiveness by resizing the browser window.

---

**Step 5: Implement Delete Asset Functionality**

*   **Task:**
    1.  Define Server Action `async function deleteAsset(assetId: string, storagePath: string): Promise<{ success: boolean; error?: string }>` in `lib/actions/dam.ts`.
    2.  Action Logic:
        *   Get user session/ID for authorization check.
        *   Create Supabase service role client.
        *   (Authorization Check: Verify the requesting user owns the asset - fetch asset by ID and check `user_id`).
        *   Delete file from storage: `supabase.storage.from('assets').remove([storagePath])`.
        *   Handle storage deletion errors (e.g., file not found).
        *   Delete record from database: `supabase.from('assets').delete().match({ id: assetId /*, user_id: userId */ })`.
        *   Handle database deletion errors.
        *   If successful, call `revalidatePath('/dam')` to trigger gallery refresh.
        *   Return success/error status.
    3.  Create Client Component `components/dam/AssetThumbnail.tsx` (or add client logic to `AssetGallery`).
        *   Receive asset data and public URL as props.
        *   Render the `<img>` tag.
        *   Add a delete button (e.g., small 'X' icon positioned absolutely, visible on hover).
        *   Import `deleteAsset` action.
        *   Use `shadcn/ui` `<AlertDialog>` component for confirmation.
        *   On button click, show AlertDialog.
        *   On confirmation in AlertDialog, call `deleteAsset(asset.id, asset.storage_path)`. Handle pending state and display feedback (e.g., toast). Use `startTransition` for smoother UI updates if needed.
*   **Testing:**
    1.  Refactor `AssetGallery` to use `AssetThumbnail` for rendering each item.
    2.  Visit `/dam` gallery.
    3.  Hover over an asset -> Verify delete button appears.
    4.  Click delete button -> Verify confirmation dialog (`AlertDialog`) appears.
    5.  Click Cancel -> Verify dialog closes and nothing is deleted.
    6.  Click delete button again -> Confirm deletion in the dialog.
    7.  Verify loading state on the thumbnail/button while action runs.
    8.  Verify the asset is removed from the gallery UI smoothly (due to `revalidatePath`).
    9.  Verify the file is removed from the Supabase Storage bucket.
    10. Verify the row is removed from the Supabase `assets` table.
    11. Verify success feedback (e.g., toast).
    12. Test deleting an asset immediately after upload.

--- 