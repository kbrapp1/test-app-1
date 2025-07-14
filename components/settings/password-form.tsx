'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { User } from '@supabase/supabase-js';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

// Zod schema for password change
const passwordFormSchema = z.object({
  currentPassword: z.string().min(1, { message: "Current password is required." }),
  newPassword: z.string().min(8, { message: "New password must be at least 8 characters long." }), // Example: min length
  confirmPassword: z.string().min(1, { message: "Please confirm your new password." }),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "New passwords do not match.",
  path: ["confirmPassword"], // Error applies to the confirmation field
});

type PasswordFormValues = z.infer<typeof passwordFormSchema>;

export function PasswordForm() {
  const supabase = createClient();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  // Remove useState for passwords - handled by react-hook-form
  const [isLoadingUser, setIsLoadingUser] = useState(true);

  const form = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
    mode: "onChange",
  });

  const { reset: resetForm, formState: { isSubmitting, isValid }, handleSubmit, control } = form;

  // Fetch user data on component mount
  useEffect(() => {
    let isMounted = true;
    const fetchUser = async () => {
      setIsLoadingUser(true);
      const { data, error } = await supabase.auth.getUser();
      if (!isMounted) return;

      if (error || !data?.user) {
        console.error('Error fetching user for password change:', error?.message);
        toast({ variant: "destructive", title: "Error", description: "Could not load user data." });
        setUser(null);
      } else {
        setUser(data.user);
      }
      setIsLoadingUser(false);
    };
    fetchUser();
    return () => { isMounted = false; };
  }, [supabase, toast]);

  // onSubmit receives validated data
  const onSubmit = async (data: PasswordFormValues) => {
    if (!user || !user.email) {
      toast({ variant: "destructive", title: "Error", description: "User data not loaded." });
      return;
    }

    // Re-authentication step (using validated currentPassword)
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: data.currentPassword,
    });

    if (signInError) {
      if (signInError.message.includes('Invalid login credentials')) {
        toast({ variant: "destructive", title: "Incorrect Password", description: "The current password entered is incorrect." });
        // Optionally set form error for currentPassword field
        form.setError("currentPassword", { type: "manual", message: "Incorrect current password" });
      } else {
        console.error('Error during re-authentication:', signInError.message);
        toast({ variant: "destructive", title: "Verification Failed", description: `An error occurred: ${signInError.message}` });
      }
      return; // Stop if current password is wrong or verification fails
    }

    // Update to new password (using validated newPassword)
    const { error: updateError } = await supabase.auth.updateUser({
      password: data.newPassword,
    });

    if (updateError) {
      toast({ variant: "destructive", title: "Password Update Failed", description: updateError.message });
    } else {
      toast({ title: "Password Updated", description: "Your password changed successfully." });
      resetForm(); // Reset form fields to default values
    }
  };

  if (isLoadingUser) {
    return <div>Loading...</div>;
  }

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={control}
          name="currentPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Current Password</FormLabel>
              <FormControl>
                <Input type="password" placeholder="••••••••" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name="newPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>New Password</FormLabel>
              <FormControl>
                <Input type="password" placeholder="••••••••" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Confirm New Password</FormLabel>
              <FormControl>
                <Input type="password" placeholder="••••••••" {...field} />
              </FormControl>
              <FormMessage /> {/* Shows match error from schema refine */}
            </FormItem>
          )}
        />
        <Button type="submit" disabled={isSubmitting || !isValid || isLoadingUser}>
          {isSubmitting ? 'Updating...' : 'Update Password'}
        </Button>
      </form>
    </Form>
  );
} 