'use client';

import React, { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  DialogClose
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';

// Define the schema for client-side validation
const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // Match API route limit (or intended limit)

// Use superRefine for conditional logic based on file presence, type, and size
const refinedFileSchema = z
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

    // We know fileList[0] exists now
    const file = fileList[0];

    // 2. Type check
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Invalid file type. Only ${ACCEPTED_IMAGE_TYPES.map(t => t.split('/')[1]).join(', ')} are allowed.`,
      });
      return; // <-- RETURN HERE if type is invalid
    }

    // 3. Size check (only runs if type is valid)
    if (file.size > MAX_FILE_SIZE) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `File too large. Max size is ${MAX_FILE_SIZE / 1024 / 1024}MB.`,
      });
      // Optional: return here too, though it's the last check
      return; 
    }
  });

const teamMemberFormSchema = z.object({
  name: z.string().min(1, { message: "Name is required" }),
  title: z.string().min(1, { message: "Title is required" }),
  primaryImage: refinedFileSchema,
  secondaryImage: refinedFileSchema,
});

type TeamMemberFormValues = z.infer<typeof teamMemberFormSchema>;

interface AddTeamMemberFormProps {
  onSuccess?: () => void; // Optional callback for when submission is successful
}

export function AddTeamMemberForm({ onSuccess }: AddTeamMemberFormProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<TeamMemberFormValues>({
    resolver: zodResolver(teamMemberFormSchema),
    defaultValues: {
      name: '',
      title: '',
      primaryImage: undefined,
      secondaryImage: undefined,
    },
    mode: 'onSubmit', // Validate on submit (default, better for testing required fields)
  });

  const onSubmit = async (values: TeamMemberFormValues) => {
    // Check FileList and get the File object
    if (!values.primaryImage?.[0] || !values.secondaryImage?.[0]) {
        toast({ title: 'Error', description: 'Both primary and secondary images must be provided.', variant: 'destructive'});
        return;
    }

    setIsLoading(true);

    const formData = new FormData();
    formData.append('name', values.name);
    formData.append('title', values.title);
    // Append the actual File object from the FileList
    formData.append('primaryImage', values.primaryImage[0]);
    formData.append('secondaryImage', values.secondaryImage[0]);

    try {
      const response = await fetch('/api/team/upload', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (response.ok && result.success) {
        toast({ title: 'Success', description: 'Team member added successfully.' });
        form.reset(); // Reset should now clear registered file inputs too
        onSuccess?.(); // Call the success callback if provided (e.g., to close a dialog)
      } else {
        // Handle specific validation errors if provided by API
        let errorMessage = result.error || 'Failed to add team member.';
        if (result.details) {
             errorMessage = `Validation failed: ${JSON.stringify(result.details)}`;
        }
        toast({ title: 'Error', description: errorMessage, variant: 'destructive' });
      }
    } catch (error) {
      console.error('API submission error:', error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder="Enter member name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input placeholder="Enter member title" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {/* Simplify file inputs using form.register */}
        <FormItem>
          <FormLabel>Primary Image</FormLabel>
          <FormControl>
            <Input 
              type="file"
              accept={ACCEPTED_IMAGE_TYPES.join(',')}
              {...form.register('primaryImage')} 
            />
          </FormControl>
          <FormMessage>{form.formState.errors.primaryImage?.message}</FormMessage>
        </FormItem>
        
        <FormItem>
          <FormLabel>Secondary (Hover) Image</FormLabel>
          <FormControl>
            <Input 
              type="file"
              accept={ACCEPTED_IMAGE_TYPES.join(',')}
              {...form.register('secondaryImage')} 
            />
          </FormControl>
           <FormMessage>{form.formState.errors.secondaryImage?.message}</FormMessage>
        </FormItem>

        <div className="flex justify-end space-x-2 pt-4">
            <DialogClose asChild>
                <Button type="button" variant="outline" disabled={isLoading}>
                    Cancel
                </Button>
            </DialogClose>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Adding...' : 'Add Member'}
          </Button>
        </div>
      </form>
    </Form>
  );
} 