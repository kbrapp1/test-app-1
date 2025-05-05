# Team Members Feature - Build Steps

This document outlines the step-by-step process for implementing the Team Members feature, focusing on displaying members, hover effects, and an add member functionality.

**Assumptions:**

*   Supabase credentials are set up in `.env.local`.
*   Next.js Server Actions will be used for backend logic.
*   `shadcn/ui` components and Tailwind CSS will be used for the UI.
*   `react-hook-form`, `zod`, and `react-dropzone` (or simple file inputs) are available for the form.

---

**Step 1: Setup Supabase Resources**

*   **Task:**
    1.  **Create Supabase Database Table:**
        *   Name: `team_members`
        *   Enable Row Level Security (RLS) - Define policies based on whether adding/viewing members requires authentication.
        *   Columns:
            *   `id` (uuid, primary key, default: `gen_random_uuid()`)
            *   `name` (text, not null)
            *   `title` (text, not null)
            *   `primary_image_path` (text, not null, path within the storage bucket)
            *   `secondary_image_path` (text, not null, path for the hover image)
            *   `created_at` (timestamp with time zone, default: `now()`)
            *   Optional: `sort_order` (integer) for manual ordering.
    2.  **Create or Identify Supabase Storage Bucket:**
        *   Option A (New Bucket): Create bucket named `team_images`. Set access policy (e.g., Public read access).
        *   Option B (Reuse Bucket): Use existing `assets` bucket. Plan to store team images under a specific prefix like `team/`. Ensure policy allows read access.
*   **Testing:**
    1.  Log in to Supabase Dashboard.
    2.  Navigate to Table Editor. Verify `team_members` table exists with correct columns, types, and constraints.
    3.  Navigate to Authentication -> Policies. Verify RLS settings for `team_members`.
    4.  Navigate to Storage -> Buckets. Verify the chosen bucket (`team_images` or `assets`) exists with appropriate access policies.

---

**Step 2: Implement Server Actions**

*   **Task:**
    1.  Create file: `lib/actions/team.ts` (add `"use server";` at top).
    2.  **Implement `getTeamMembers()`:**
        *   Define `async function getTeamMembers(): Promise<TeamMember[]>`. (Define `TeamMember` type, perhaps in `types/team.ts`).
        *   Create Supabase client (server component client or service role if needed).
        *   Fetch all records from `team_members` table (order by `created_at` or `sort_order`).
        *   For each record, construct full public URLs for `primary_image_path` and `secondary_image_path` using `supabase.storage.from(...).getPublicUrl(...)`.
        *   Return the array of members with URLs. Handle potential errors.
    3.  **Implement `addTeamMember(formData: FormData)`:**
        *   Define `async function addTeamMember(formData: FormData): Promise<{ success: boolean; error?: string; data?: TeamMember }>`
        *   Get user session if adding members requires authentication. Authorize user.
        *   Create Supabase service role client (needed for uploads/inserts likely).
        *   Parse `name`, `title`, `primaryImage` (File), `secondaryImage` (File) from `formData`.
        *   Validate inputs using `zod` (name, title required; files are image types). Handle validation errors.
        *   Generate unique storage paths for both images (e.g., `team/${crypto.randomUUID()}-primary.${extension}`).
        *   Upload `primaryImage` to storage. Handle errors.
        *   Upload `secondaryImage` to storage. Handle errors. If secondary upload fails, consider rolling back primary upload or proceeding without it.
        *   If uploads succeed, insert record into `team_members` table with `name`, `title`, and the two storage paths. Handle database errors.
        *   Call `revalidatePath('/team')` on success.
        *   Return status, error message, or the newly created member data.
*   **Testing:**
    1.  (Difficult to test in isolation - primarily tested via UI integration in later steps).
    2.  Create basic test scripts or use a tool like Thunder Client/Postman if you expose these via API routes temporarily for direct testing.
    3.  Check Supabase logs for errors during execution via UI.
    4.  Manually add data to the `team_members` table and call `getTeamMembers` from a test server component to verify data fetching and URL generation.

---

**Step 3: Create 'Add Member' Form Components**

*   **Task:**
    1.  Create directory `components/team`.
    2.  Create client component: `components/team/AddTeamMemberForm.tsx`.
        *   Use `react-hook-form` and a `zod` schema for validation (`name`, `title`, `primaryImage`, `secondaryImage`).
        *   Use `shadcn/ui` (`Input`, `Label`, `Button`, `Textarea` if needed).
        *   Implement file inputs for primary and secondary images. Use `react-dropzone` or styled `<input type="file">`. Show file previews. Ensure file type validation.
        *   Import `addTeamMember` action.
        *   On form submission, call the action with `FormData`.
        *   Use `useFormState` (React experimental) or `useState` to handle loading/pending state, display success/error messages from the action result.
    3.  Create client component: `components/team/AddTeamMemberDialog.tsx`.
        *   Use `shadcn/ui` `<Dialog>`, `<DialogTrigger>`, `<DialogContent>`, etc.
        *   The `<DialogTrigger>` will be the "Add Member" `<Button>`.
        *   Place `<AddTeamMemberForm />` inside the `<DialogContent>`.
        *   Manage dialog open/close state (`useState`). Close the dialog on successful form submission (e.g., via a callback prop passed to the form).
*   **Testing:**
    1.  Create a temporary test page (e.g., `/app/team/add-test/page.tsx`).
    2.  Import and render `<AddTeamMemberDialog />` on the test page.
    3.  Run `npm run dev`. Visit `/team/add-test`.
    4.  Click "Add Member" button -> Verify dialog opens.
    5.  Test form validation: Submit empty form, submit with invalid file types, etc. -> Verify error messages appear.
    6.  Fill form with valid data and select/drop valid image files.
    7.  Submit the form.
    8.  Verify loading state is shown.
    9.  Check browser network tab for the `addTeamMember` action call.
    10. Check Supabase: Verify images are uploaded to the correct Storage path. Verify a new row exists in `team_members` table.
    11. Verify success message is shown in the dialog/form.
    12. Verify the dialog closes automatically on success (or provides a clear way to close).

---

**Step 4: Create Team Member Card Component (Display)**

*   **Task:**
    1.  Create client component: `components/team/TeamMemberCard.tsx`.
    2.  Accept `member: TeamMember` (with `name`, `title`, `primaryImageUrl`, `secondaryImageUrl`) as props.
    3.  Use `useState` to store `currentImageUrl`, initialized to `member.primaryImageUrl`.
    4.  Render a container `div`. Apply `onMouseEnter={() => setCurrentImageUrl(member.secondaryImageUrl)}` and `onMouseLeave={() => setCurrentImageUrl(member.primaryImageUrl)}` to this container.
    5.  Inside the container, render an `img` tag (or `next/image` if optimization is desired) with `src={currentImageUrl}`. Ensure consistent image dimensions/aspect ratio.
    6.  Style the image container (e.g., `rounded-t-lg overflow-hidden` for the specific look).
    7.  Below the image container, render `member.name` (e.g., bold text) and `member.title` (e.g., smaller text).
*   **Testing:**
    1.  Use Storybook or a test page.
    2.  Create mock `TeamMember` data with valid image URLs (can use placeholders initially).
    3.  Render `<TeamMemberCard member={mockMember} />`.
    4.  Verify initial display shows primary image, name, and title correctly styled.
    5.  Hover over the card -> Verify image swaps to the secondary image URL.
    6.  Move mouse off the card -> Verify image swaps back to the primary image URL.
    7.  Test with different member data.

---

**Step 5: Create Team Member List Component**

*   **Task:**
    1.  Create component: `components/team/TeamMemberList.tsx` (can be Server or Client Component).
    2.  If Server Component: Fetch data directly using `getTeamMembers()`.
    3.  If Client Component: Accept `members: TeamMember[]` as props.
    4.  Render a grid container (e.g., `<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">`).
    5.  Map over the `members` array. For each `member`, render `<TeamMemberCard member={member} />`.
    6.  Handle the case where `members` is empty (display a message or an "empty state" component).
*   **Testing:**
    1.  Use Storybook or a test page.
    2.  Create mock `TeamMember` array data (or use data fetched in Step 2 testing).
    3.  Render `<TeamMemberList members={mockMembers} />`.
    4.  Verify the grid layout displays multiple `TeamMemberCard` components correctly.
    5.  Test responsiveness by resizing the view.
    6.  Test with an empty `members` array -> Verify empty state message is shown.

---

**Step 6: Create the Page Route (`/team`)**

*   **Task:**
    1.  Create page route: `app/team/page.tsx`. Likely a Server Component.
    2.  Make the component `async`.
    3.  Call `const members = await getTeamMembers();` to fetch data.
    4.  Render the page layout (e.g., `<h1>Our Team</h1>`).
    5.  Render the `<TeamMemberList members={members} />`.
    6.  Render the `<AddTeamMemberDialog />` component (its trigger button will be visible on the page). Ensure the Dialog component is only rendered if the user has permission to add members (if applicable).
*   **Testing:**
    1.  Ensure some members exist in the database (via Step 3 testing).
    2.  Run `npm run dev`.
    3.  Visit `/team`.
    4.  Verify the page title renders.
    5.  Verify the `TeamMemberList` renders the member cards fetched from the database.
    6.  Verify the "Add Member" button (trigger for the dialog) is visible.
    7.  Test the full end-to-end flow: Click "Add Member", fill the form, submit, verify the new member appears in the list automatically (due to `revalidatePath`).

--- 