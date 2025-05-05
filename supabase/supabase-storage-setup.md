# Supabase Storage Bucket and Policy Setup

This guide provides detailed steps for manually setting up the required Storage Buckets and Policies in your Supabase project dashboard. This is necessary for features like Digital Asset Management (DAM) and the Team Section to function correctly.

## 1. Create Storage Buckets

First, you need to create the necessary buckets:

1.  Navigate to your Supabase project dashboard.
2.  Go to the **Storage** section in the left sidebar.
3.  Click the **Buckets** tab.
4.  Click **Create Bucket**.
5.  Enter the name `assets`.
6.  You can initially set the bucket to **Public** by toggling the switch. Click **Create Bucket**.
    *   _Note: Making a bucket "Public" here primarily affects whether the base bucket URL is easily guessable. Actual file access permissions are strictly controlled by the Storage Policies you will create next._
7.  Repeat steps 4-6 to create another bucket named `team-images`.

## 2. Apply Storage Policies

Next, apply Row Level Security (RLS) policies to control access to the files within these buckets. Fine-grained access control is crucial for security.

1.  Navigate to **Storage** -> **Policies**.
2.  Use the dropdown menu at the top to select the bucket you want to configure (e.g., `assets`).
3.  Click **New policy**.
4.  It's often easiest to select **Create a policy from scratch**.

### Policies for `assets` Bucket (Standard Setup - Authenticated Access)

This setup allows any logged-in user to upload assets and read assets stored under their own user ID folder.

*   **Policy 1: Allow Authenticated Uploads**
    *   Policy Name: `Allow authenticated asset uploads` (or similar descriptive name)
    *   Allowed operation(s): Check `INSERT`
    *   Target roles: Check `authenticated`
    *   USING expression / WITH CHECK expression: Enter the following SQL:
        ```sql
        (bucket_id = 'assets')
        ```
    *   Click **Review** and then **Save policy**.

*   **Policy 2: Allow Authenticated Reads (of own assets - Recommended)**
    *   Policy Name: `Allow authenticated reads of own assets` (or similar)
    *   Allowed operation(s): Check `SELECT`
    *   Target roles: Check `authenticated`
    *   USING expression: Enter the following SQL:
        ```sql
        (bucket_id = 'assets' AND auth.uid()::text = (storage.foldername(name))[1])
        ```
        *   **Important:** This policy assumes your application code saves assets within folders named after the `user_id` (e.g., the path in the `assets` table might be `f4a5b6c7-d8e9-f0a1-b2c3-d4e5f6a7b8c9/image.jpg`). You **must** ensure your upload logic creates these user-specific paths for this policy to work correctly. Adjust the path check (`(storage.foldername(name))[1]`) if your storage structure is different.
        *   _Alternative (Less Secure):_ If you don't structure by user ID yet, you could temporarily use just `(bucket_id = 'assets')` for the `USING` expression. However, be aware this allows **any** logged-in user to read **any** asset in the bucket, which is generally not desirable.
    *   Click **Review** and then **Save policy**.

### Policies for `team-images` Bucket (Public Images Setup)

This setup allows authenticated users to upload images into a `public/` folder within the bucket, and allows anyone (including anonymous users) to read images from that specific `public/` folder.

*   **Policy 1: Allow Authenticated Uploads to `public/` folder**
    *   Policy Name: `Allow authenticated team image uploads` (or similar)
    *   Allowed operation(s): Check `INSERT`
    *   Target roles: Check `authenticated`
    *   USING expression / WITH CHECK expression: Enter the following SQL:
        ```sql
        (bucket_id = 'team-images' AND (storage.foldername(name))[1] = 'public')
        ```
        *   _Note:_ This policy enforces that authenticated users can *only* upload files *directly into* a folder named `public` at the root of the `team-images` bucket.
    *   Click **Review** and **Save policy**.

*   **Policy 2: Allow Public Reads from `public/` folder**
    *   Policy Name: `Allow public team image reads` (or similar)
    *   Allowed operation(s): Check `SELECT`
    *   Target roles: Check `anon` and `authenticated` (or leave blank, which implies public access for reads).
    *   USING expression: Enter the following SQL:
        ```sql
        (bucket_id = 'team-images' AND (storage.foldername(name))[1] = 'public')
        ```
        *   _Note:_ This policy allows anyone to read files *only* if they reside within the `public` folder at the root of the `team-images` bucket.
    *   Click **Review** and **Save policy**.

After applying these policies, your Storage setup should be complete for the core features. 