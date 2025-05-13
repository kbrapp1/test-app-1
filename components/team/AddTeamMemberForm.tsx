/**
 * Next.js Server Component that renders a form for adding a new team member.
 * It includes fields for name, title, primary image, and secondary image.
 * The form uses the zodResolver for validation and the useForm hook for form handling.
 * The form data is submitted to the '/api/team/upload' route for processing.
 */
'use client';

import React, { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
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
import { useToast } from '@/components/ui/use-toast';
import {
  teamMemberFormSchema, 
  type TeamMemberFormValues, 
  ACCEPTED_IMAGE_TYPES
} from '@/lib/schemas/team';

interface AddTeamMemberFormProps {
  onSuccess?: () => void; // Optional callback for when submission is successful
}

export function AddTeamMemberForm({ onSuccess }: AddTeamMemberFormProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const form = useForm<TeamMemberFormValues>({
    resolver: zodResolver(teamMemberFormSchema),
    defaultValues: {
      name: '',
      title: '',
      primaryImage: undefined,
      secondaryImage: undefined,
    },
    mode: 'onSubmit',
  });

  const onSubmit = async (values: TeamMemberFormValues) => {
    // Check FileList and get the File object
    if (!values.primaryImage?.[0] || !values.secondaryImage?.[0]) {
        toast({ title: 'Error', description: 'Both primary and secondary images must be provided.', variant: 'destructive'});
        return;
    }

    // Client-side file type validation
    const primaryType = values.primaryImage[0].type;
    const secondaryType = values.secondaryImage[0].type;
    if (!ACCEPTED_IMAGE_TYPES.includes(primaryType) || !ACCEPTED_IMAGE_TYPES.includes(secondaryType)) {
      toast({ title: 'Error', description: 'Invalid file type', variant: 'destructive' });
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
        form.reset();
        onSuccess?.();
        router.refresh();
      } else {
        // Ensure only strings are passed to the toast description
        let errorDescription = 'Failed to add team member.'; // Default message
        if (result.error) {
          if (typeof result.error === 'object' && result.error !== null && typeof result.error.message === 'string') {
            // If it's our structured error object with a message property
            errorDescription = result.error.message;
          } else if (typeof result.error === 'string') {
            // If it's just an error string
            errorDescription = result.error;
          }
          // Optionally append details if they exist and are useful for the user
          // if (result.details) { errorDescription += ` Details: ${JSON.stringify(result.details)}`; }
        }
        // Use the derived string description
        toast({ title: 'Error', description: errorDescription, variant: 'destructive' });
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