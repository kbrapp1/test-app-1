'use client';

import React, { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
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
import Image from 'next/image';

// Define the schema for client-side validation
const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // Match API route limit (or intended limit)

// Custom file schema validation making sure it's a File object
const fileSchema = z
  .custom<File>((val) => val instanceof File, 'Image is required.')
  .refine((file) => file.size > 0, 'Image is required.') // Ensure file is not empty
  .refine((file) => file.size <= MAX_FILE_SIZE, `Max file size is 10MB.`)
  .refine(
    (file) => ACCEPTED_IMAGE_TYPES.includes(file.type),
    '.jpg, .jpeg, .png, .webp and .gif files are accepted.'
  );

const teamMemberFormSchema = z.object({
  name: z.string().min(1, { message: 'Name is required' }),
  title: z.string().min(1, { message: 'Title is required' }),
  primaryImage: fileSchema,
  secondaryImage: fileSchema,
});

type TeamMemberFormValues = z.infer<typeof teamMemberFormSchema>;

interface AddTeamMemberFormProps {
  onSuccess?: () => void; // Optional callback for when submission is successful
}

export function AddTeamMemberForm({ onSuccess }: AddTeamMemberFormProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [primaryPreview, setPrimaryPreview] = useState<string | null>(null);
  const [secondaryPreview, setSecondaryPreview] = useState<string | null>(null);

  // Refs for resetting file inputs
  const primaryInputRef = useRef<HTMLInputElement>(null);
  const secondaryInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<TeamMemberFormValues>({
    resolver: zodResolver(teamMemberFormSchema),
    defaultValues: {
      name: '',
      title: '',
      // Default values for files are tricky in RHF, handle via onChange logic
    },
    mode: 'onChange', // Validate on change to enable/disable submit button correctly
  });

  const handleFileChange = (
    event: React.ChangeEvent<HTMLInputElement>,
    field: 'primaryImage' | 'secondaryImage'
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      form.setValue(field, file, { shouldValidate: true }); // Trigger validation
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        if (field === 'primaryImage') {
          setPrimaryPreview(result);
        } else {
          setSecondaryPreview(result);
        }
      };
      reader.readAsDataURL(file);
    } else {
        // Clear the value and preview if no file is selected or selection is cancelled
        // Use any to bypass TypeScript's type checking for undefined
        form.setValue(field, undefined as any, { shouldValidate: true });
        if (field === 'primaryImage') {
          setPrimaryPreview(null);
        } else {
          setSecondaryPreview(null);
        }
    }
  };

  const onSubmit = async (values: TeamMemberFormValues) => {
    // Although schema validates, double-check File instances just in case
    if (!(values.primaryImage instanceof File) || !(values.secondaryImage instanceof File)) {
        toast({ title: 'Error', description: 'Both primary and secondary images must be valid files.', variant: 'destructive'});
        return;
    }

    setIsLoading(true);

    const formData = new FormData();
    formData.append('name', values.name);
    formData.append('title', values.title);
    formData.append('primaryImage', values.primaryImage);
    formData.append('secondaryImage', values.secondaryImage);

    try {
      const response = await fetch('/api/team/upload', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (response.ok && result.success) {
        toast({ title: 'Success', description: 'Team member added successfully.' });
        form.reset({ name: '', title: '' }); // Reset text fields
        setPrimaryPreview(null); // Clear previews
        setSecondaryPreview(null);
         // Reset file input elements visually
        if (primaryInputRef.current) primaryInputRef.current.value = '';
        if (secondaryInputRef.current) secondaryInputRef.current.value = '';
        // Need to clear the file value in RHF state after reset if not done automatically
        form.setValue('primaryImage', undefined as any, { shouldValidate: false });
        form.setValue('secondaryImage', undefined as any, { shouldValidate: false });


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
        {/* RHF doesn't bind directly to file inputs well. Handle onChange manually */}
        <FormField
          control={form.control}
          name="primaryImage"
          render={({ fieldState }) => ( // Only need fieldState for error message
            <FormItem>
              <FormLabel>Primary Image</FormLabel>
              <FormControl>
                <Input
                  type="file"
                  accept={ACCEPTED_IMAGE_TYPES.join(',')}
                  ref={primaryInputRef}
                  onChange={(e) => handleFileChange(e, 'primaryImage')}
                  />
              </FormControl>
               {primaryPreview && (
                <div className="mt-2">
                  <Image
                    src={primaryPreview}
                    alt="Primary image preview"
                    width={100}
                    height={100}
                    className="object-cover rounded"
                  />
                </div>
              )}
              <FormMessage>
                 {/* Display error message from RHF state */}
                 {fieldState.error?.message}
              </FormMessage>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="secondaryImage"
           render={({ fieldState }) => ( // Only need fieldState for error message
            <FormItem>
              <FormLabel>Secondary (Hover) Image</FormLabel>
              <FormControl>
                 <Input
                  type="file"
                  accept={ACCEPTED_IMAGE_TYPES.join(',')}
                  ref={secondaryInputRef}
                  onChange={(e) => handleFileChange(e, 'secondaryImage')}
                  />
              </FormControl>
                {secondaryPreview && (
                <div className="mt-2">
                  <Image
                    src={secondaryPreview}
                    alt="Secondary image preview"
                    width={100}
                    height={100}
                    className="object-cover rounded"
                  />
                </div>
              )}
               <FormMessage>
                   {/* Display error message from RHF state */}
                   {fieldState.error?.message}
               </FormMessage>
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isLoading || !form.formState.isValid}>
          {isLoading ? 'Adding...' : 'Add Member'}
        </Button>
      </form>
    </Form>
  );
} 