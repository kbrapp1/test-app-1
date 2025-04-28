# Building the Settings Page Scaffold

This document outlines the incremental steps to create a basic settings page for the application.

## Steps

1.  **Create Route and Basic Layout:**
    *   Create the file `app/(protected)/settings/page.tsx`.
    *   Add basic page structure (e.g., using `Card` components for sections) and a heading like "Settings".
    *   Ensure it's protected by the `(protected)` route group and middleware.
    *   **Testing:** Run the dev server, log in, and navigate to `/settings`. Verify the page loads, the basic layout is visible, and you are not redirected (indicating the route is protected).

2.  **Build Profile Form Component:**
    *   Create a new component file, e.g., `components/settings/profile-form.tsx`.
    *   This component should fetch the current user's data (specifically `user_metadata` if storing profile info there).
    *   Include input fields (e.g., for "Name").
    *   Manage form state (input values, loading state).
    *   On submit, call `supabase.auth.updateUser({ data: { ... } })` to update `user_metadata`.
    *   Handle potential errors from the Supabase call.
    *   **Testing (After Integration):** Load the settings page. Verify the form displays, potentially pre-filled with existing data. Change the data, submit the form, and check the Supabase dashboard (`Authentication` -> `Users` -> Select User -> `User Metadata`) to confirm the `user_metadata` was updated. Test error cases (e.g., invalid input if validation is added later).

3.  **Integrate Profile Form:**
    *   Import and render the `ProfileForm` component within `app/(protected)/settings/page.tsx`.
    *   **Testing:** Run the dev server, log in, and navigate to `/settings`. Verify the profile form component is now rendered on the page. Perform the tests described in Step 2.

4.  **Build Password Form Component:**
    *   Create a new component file, e.g., `components/settings/password-form.tsx`.
    *   Include input fields for "Current Password", "New Password", and "Confirm New Password".
    *   Manage form state (input values, loading state).
    *   On submit, call `supabase.auth.updateUser({ password: newPassword })`.
    *   Handle potential errors (e.g., incorrect current password).
    *   **Testing (After Integration):** Load the settings page. Verify the password form displays. Enter the current password and a new matching password. Submit the form. Log out and try logging back in with the *new* password. Verify login is successful. Test error cases (mismatched new passwords, incorrect current password).

5.  **Integrate Password Form:**
    *   Import and render the `PasswordForm` component within `app/(protected)/settings/page.tsx`.
    *   **Testing:** Run the dev server, log in, and navigate to `/settings`. Verify the password form component is now rendered on the page. Perform the tests described in Step 4.

6.  **Add Feedback (Toasts):**
    *   Import `useToast` from `@/components/ui/use-toast` into the form components.
    *   Call `toast()` with appropriate titles and descriptions upon successful updates or when errors occur during form submissions.
    *   **Testing:** Trigger both success and error scenarios in the Profile and Password forms. Verify that the appropriate toast messages appear.

7.  **(Optional) Enhance Validation:**
    *   Integrate `react-hook-form` and `zod` for client-side validation in both form components.
    *   Define Zod schemas for profile and password data.
    *   Use `shadcn/ui`'s `<Form>` component wrappers for better integration.
    *   **Testing:** Attempt to submit the forms with invalid data (e.g., empty required fields, mismatched passwords). Verify that validation errors are displayed correctly and the form submission is prevented. 