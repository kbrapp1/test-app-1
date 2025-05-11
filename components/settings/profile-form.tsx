'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { User } from '@supabase/supabase-js';
import { useToast } from '@/components/ui/use-toast';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from '@/components/ui/label';

// Define Zod schema for profile data
const profileFormSchema = z.object({
  name: z.string().min(1, { message: "Name cannot be empty." }), // Example: make name required
  // Add other fields from user_metadata here if needed
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

export function ProfileForm() {
  const supabase = createClient();
  const { toast } = useToast();
  const [email, setEmail] = useState<string>("Loading..."); // State for email display
  const [organizationName, setOrganizationName] = useState<string | null>("Loading...");
  const [userRole, setUserRole] = useState<string | null>("Loading...");

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: { name: "" },
    mode: "onChange",
  });

  const { reset, formState: { isSubmitting, isLoading, isValid, errors }, handleSubmit, control } = form;

  // Fetch user data and set default form values
  useEffect(() => {
    let isMounted = true;
    const fetchUserAndOrgData = async () => {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (!isMounted) return;

      if (userError) {
        console.error('Error fetching user:', userError.message);
        toast({ variant: "destructive", title: "Error fetching user data", description: userError.message });
        setEmail("Error loading email");
        setOrganizationName("Error loading org");
        setUserRole("Error loading role");
      } else if (userData?.user) {
        const user = userData.user;
        reset({ name: user.user_metadata?.name || "" });
        setEmail(user.email || "No email found");

        const activeOrgId = user.app_metadata?.active_organization_id;
        if (activeOrgId) {
          // Fetch organization name
          const { data: orgData, error: orgError } = await supabase
            .from('organizations')
            .select('name')
            .eq('id', activeOrgId)
            .single();
          
          if (!isMounted) return;
          if (orgError) {
            console.error('Error fetching organization:', orgError.message);
            setOrganizationName('N/A');
          } else {
            setOrganizationName(orgData?.name || 'N/A');
          }

          // Fetch user role in that organization (using role_id join to roles.name)
          const { data: membershipData, error: membershipError } = await supabase
            .from('organization_memberships')
            .select('role_id, roles(name)')
            .eq('user_id', user.id)
            .eq('organization_id', activeOrgId)
            .single<{ role_id: string; roles: { name: string } | null }>();

          if (!isMounted) return;
          if (membershipError) {
            console.error('Error fetching user role:', membershipError.message);
            setUserRole('N/A');
          } else {
            // Hide super-admin from display (should not be possible, but just in case)
            const roleName = membershipData?.roles?.name;
            setUserRole(roleName === 'super-admin' ? 'N/A' : roleName || 'N/A');
          }
        } else {
          setOrganizationName('N/A (No active org)');
          setUserRole('N/A');
        }
      } else {
        reset({ name: "" });
        setEmail("Not logged in");
        setOrganizationName("Not logged in");
        setUserRole("Not logged in");
      }
    };
    fetchUserAndOrgData();
    return () => { isMounted = false; };
  }, [supabase, toast, reset]);

  // onSubmit handler now receives validated form data
  const onSubmit = async (data: ProfileFormValues) => {
    // Fetch user again just before submit to ensure we have the latest session
    const { data: { user } } = await supabase.auth.getUser(); 
    if (!user) {
        toast({ variant: "destructive", title: "Authentication Error", description: "User not found. Please log in again." });
        return; // Exit if user is somehow null
    }

    const { error } = await supabase.auth.updateUser({
      data: { name: data.name }, // Update user_metadata with validated data
      // Add other fields from data if needed
    });

    if (error) {
      console.error('Error updating profile:', error.message);
      toast({ variant: "destructive", title: "Error updating profile", description: error.message });
    } else {
      toast({ title: "Profile updated", description: "Your name has been successfully updated." });
      // Optional: reset form state if desired after successful submit
      // reset(data); // Resets to the successfully submitted values
    }
  };

  // Display loading indicator (could check email state too)
  if (isLoading || email === "Loading..." || organizationName === "Loading..." || userRole === "Loading...") {
    return <div>Loading profile...</div>;
  }

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
         {/* Email field (disabled, now reads from state) */}
         <div className="space-y-2">
            <Label htmlFor="email-display">Email</Label>
            <Input 
                id="email-display" 
                type="email" 
                value={email} // Use email state here
                disabled 
            />
            <p className="text-sm text-muted-foreground">
                Your email address cannot be changed here.
            </p>
         </div>

        <FormField
          control={control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder="Your name" {...field} />
              </FormControl>
              <FormDescription>
                This is the name that will be displayed publicly.
              </FormDescription>
              <FormMessage /> { /* Displays validation errors */}
            </FormItem>
          )}
        />

        {/* Display Organization Name */}
        <div className="space-y-2">
          <Label htmlFor="organization-name-display">Current Organization</Label>
          <Input 
            id="organization-name-display" 
            type="text" 
            value={organizationName || 'N/A'} 
            disabled 
            className="mt-1" // Added for a little top margin for consistency if needed
          />
          {/* Optional: Add a description if needed */}
          {/* <p className="text-sm text-muted-foreground">Your current active organization.</p> */}
        </div>

        {/* Display User Role */}
        <div className="space-y-2">
          <Label htmlFor="user-role-display">Role</Label>
          <Input 
            id="user-role-display" 
            type="text" 
            value={userRole || 'N/A'} 
            disabled 
            className="mt-1" // Added for a little top margin for consistency if needed
          />
          {/* Optional: Add a description if needed */}
          {/* <p className="text-sm text-muted-foreground">Your role within the current organization.</p> */}
        </div>

        {/* Add other FormFields here if schema includes more fields */}

        <Button type="submit" disabled={isSubmitting || !isValid || isLoading || email === "Loading..." || organizationName === "Loading..." || userRole === "Loading..."}>
          {isSubmitting ? 'Updating...' : 'Update Profile'}
        </Button>
      </form>
    </Form>
  );
} 