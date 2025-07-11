import { z } from 'zod';

// --- Shared Constants ---
export const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

// --- Schema for Client-Side Form (react-hook-form) ---
// Validates FileList | undefined using superRefine
const refinedFileSchemaForForm = z
  .custom<FileList | undefined>((val) => val === undefined || val instanceof FileList, {
    message: "Expected a FileList or undefined", // Base type check
  })
  .superRefine((fileList, ctx) => {
    // 1. Required check
    if (!fileList || fileList.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Image is required.",
      });
      return; // Stop validation if no file
    }

    const file = fileList[0]; // We know fileList[0] exists now

    // 2. Type check
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Invalid file type. Only ${ACCEPTED_IMAGE_TYPES.map(t => t.split('/')[1]).join(', ')} are allowed.`,
      });
      return; // Stop validation if type is invalid
    }

    // 3. Size check (only runs if type is valid)
    if (file.size > MAX_FILE_SIZE) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `File too large. Max size is ${MAX_FILE_SIZE / 1024 / 1024}MB.`,
      });
      return; 
    }
  });

export const teamMemberFormSchema = z.object({
  name: z.string().min(1, { message: "Name is required" }),
  title: z.string().min(1, { message: "Title is required" }),
  primaryImage: refinedFileSchemaForForm,
  secondaryImage: refinedFileSchemaForForm,
});

export type TeamMemberFormValues = z.infer<typeof teamMemberFormSchema>;

// For API route, accept any file-like value and defer detailed checks to upload logic
export const teamMemberApiSchema = z.object({
  name: z.string().min(1, { message: "Name is required" }),
  title: z.string().min(1, { message: "Title is required" }),
  primaryImage: z.any(),
  secondaryImage: z.any(),
}); 