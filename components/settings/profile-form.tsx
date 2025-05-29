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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { OrganizationSelector } from '@/components/auth/OrganizationSelector';
import { Mail, User as UserIcon, Building2, Shield, Crown, Users } from 'lucide-react';
import type { Profile } from '@/lib/auth';

// Define Zod schema for profile data
const profileFormSchema = z.object({
  name: z.string().min(1, { message: "Name cannot be empty." }),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

export function ProfileForm() {
  const supabase = createClient();
  const { toast } = useToast();
  const [email, setEmail] = useState<string>("Loading...");
  const [organizationName, setOrganizationName] = useState<string | null>("Loading...");
  const [userRole, setUserRole] = useState<string | null>("Loading...");
  const [profile, setProfile] = useState<Profile | null>(null);
  const [activeOrganizationId, setActiveOrganizationId] = useState<string | null>(null);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: { name: "" },
    mode: "onChange",
  });

  const { reset, formState: { isSubmitting, isLoading, isValid, errors }, handleSubmit, control } = form;

  // Get user initials for avatar
  const getUserInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

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
        
        // Get profile data for OrganizationSelector
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        
        if (!isMounted) return;
        setProfile(profileData);

        // Set the form name from profile.full_name or user_metadata.name as fallback
        const displayName = profileData?.full_name || user.user_metadata?.name || "";
        reset({ name: displayName });
        setEmail(user.email || "No email found");

        // Get active organization from user_metadata (where org switching stores it)
        const activeOrgId = user.user_metadata?.active_organization_id || user.app_metadata?.active_organization_id;
        console.log('📋 Profile Form: Active org selection logic:');
        console.log('📋 Profile Form: user_metadata.active_organization_id:', user.user_metadata?.active_organization_id);
        console.log('📋 Profile Form: app_metadata.active_organization_id:', user.app_metadata?.active_organization_id);
        console.log('📋 Profile Form: Final selected activeOrgId:', activeOrgId);
        
        // Check localStorage as fallback if metadata doesn't have active org
        let finalActiveOrgId = activeOrgId;
        if (!finalActiveOrgId && typeof window !== 'undefined') {
          const fallbackOrgId = localStorage.getItem('active_organization_id');
          if (fallbackOrgId) {
            console.log('📋 Profile Form: Using localStorage fallback:', fallbackOrgId);
            finalActiveOrgId = fallbackOrgId;
          }
        }
        
        setActiveOrganizationId(finalActiveOrgId || null);
        
        if (finalActiveOrgId) {
          // Fetch organization name
          const { data: orgData, error: orgError } = await supabase
            .from('organizations')
            .select('name')
            .eq('id', finalActiveOrgId)
            .single();
          
          if (!isMounted) return;
          if (orgError) {
            console.error('Error fetching organization:', orgError.message);
            setOrganizationName('N/A');
          } else {
            setOrganizationName(orgData?.name || 'N/A');
          }

          // For super admins, don't fetch role from memberships if they're viewing an org they're not a member of
          // Just show "Super Admin" as their role
          if (profileData?.is_super_admin) {
            setUserRole('N/A'); // Will be overridden by super admin display in UI
          } else {
            // Fetch user role in that organization for regular users
            const { data: membershipData, error: membershipError } = await supabase
              .from('organization_memberships')
              .select('role_id, roles(name)')
              .eq('user_id', user.id)
              .eq('organization_id', finalActiveOrgId)
              .single<{ role_id: string; roles: { name: string } | null }>();

            if (!isMounted) return;
            if (membershipError) {
              console.error('Error fetching user role:', membershipError.message);
              setUserRole('N/A');
            } else {
              const roleName = membershipData?.roles?.name;
              setUserRole(roleName || 'N/A');
            }
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

  // Watch for changes in activeOrganizationId and update org data
  useEffect(() => {
    console.log('📋 Profile Form: activeOrganizationId changed to:', activeOrganizationId);
    console.log('📋 Profile Form: Current profile:', profile);
    
    const loadOrganizationData = async () => {
      if (!profile) {
        console.log('📋 Profile Form: No profile, returning early');
        return;
      }
      
      if (activeOrganizationId) {
        console.log('📋 Profile Form: Fetching organization data for:', activeOrganizationId);
        // Fetch organization name for the active org
        const { data: orgData, error } = await supabase
          .from('organizations')
          .select('name')
          .eq('id', activeOrganizationId)
          .single();
        
        console.log('📋 Profile Form: Organization query result:', { orgData, error });
        setOrganizationName(orgData?.name || 'N/A');
      } else {
        console.log('📋 Profile Form: No active org, setting to "All Organizations"');
        // Handle case where no org is selected (could be "All Organizations" mode)
        setOrganizationName('All Organizations');
      }
    };

    loadOrganizationData();
  }, [activeOrganizationId, profile, supabase]);

  // Handle organization change callback to force UI update
  const handleOrganizationChange = async (orgId: string | null) => {
    console.log('📋 Profile Form: handleOrganizationChange called with:', orgId);
    
    // Immediately update the active organization ID
    setActiveOrganizationId(orgId);
    
    // Refetch user data to ensure we have the latest session
    console.log('📋 Profile Form: Refetching user data after org change...');
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError) {
        console.error('📋 Profile Form: Error refetching user:', userError);
        return;
      }
      
      if (userData?.user) {
        console.log('📋 Profile Form: Refetched user data:', userData.user.user_metadata);
        // Update the form with any new data
        const displayName = profile?.full_name || userData.user.user_metadata?.name || "";
        reset({ name: displayName });
      }
    } catch (error) {
      console.error('📋 Profile Form: Error in handleOrganizationChange:', error);
    }
  };

  const onSubmit = async (data: ProfileFormValues) => {
    try {
      console.log('Form submission started with data:', data);
      
      const { data: { user }, error: getUserError } = await supabase.auth.getUser(); 
      if (getUserError || !user) {
        console.error('Authentication error:', getUserError);
        toast({ variant: "destructive", title: "Authentication Error", description: "User not found. Please log in again." });
        return;
      }

      console.log('User authenticated:', user.id);

      // Update the profile name in the profiles table
      console.log('Attempting to update profile with full_name:', data.name);
      const { error, data: updateResult } = await supabase
        .from('profiles')
        .update({ full_name: data.name })
        .eq('id', user.id)
        .select();

      console.log('Update result:', updateResult);
      console.log('Update error:', error);

      if (error) {
        console.error('Error updating profile:', error);
        toast({ variant: "destructive", title: "Error updating profile", description: error.message });
        return;
      }

      console.log('Profile updated successfully, now updating user metadata');
      
      console.log('All updates complete');
      toast({ title: "Profile updated", description: "Your name has been successfully updated." });
      
      // Force form to recognize the submission is complete
      form.reset({ name: data.name });
      
    } catch (error) {
      console.error('Error in profile update:', error);
      toast({ variant: "destructive", title: "Error", description: "Failed to update profile. Please try again." });
    }
  };

  if (isLoading || email === "Loading..." || organizationName === "Loading..." || userRole === "Loading...") {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-2">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }

  const currentName = form.watch('name');

  return (
    <div className="space-y-6">
      {/* Profile Header Card */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-start space-x-4">
            <Avatar className="w-16 h-16">
              <AvatarImage src="" />
              <AvatarFallback className="text-lg font-semibold bg-primary/10 text-primary">
                {currentName ? getUserInitials(currentName) : 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-1">
              <CardTitle className="flex items-center gap-2">
                {currentName || 'User Profile'}
                {profile?.is_super_admin && (
                  <Badge variant="destructive" className="gap-1">
                    <Crown className="w-3 h-3" />
                    Super Admin
                  </Badge>
                )}
              </CardTitle>
              <CardDescription className="flex items-center gap-1">
                <Mail className="w-4 h-4" />
                {email}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Profile Details Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserIcon className="w-5 h-5" />
            Personal Information
          </CardTitle>
          <CardDescription>
            Update your personal details and preferences.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email-display" className="flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    Email Address
                  </Label>
                  <Input 
                    id="email-display" 
                    type="email" 
                    value={email} 
                    disabled 
                    className="bg-muted"
                  />
                  <p className="text-xs text-muted-foreground">
                    Email address changes must be done through your authentication provider.
                  </p>
                </div>

                <FormField
                  control={control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <UserIcon className="w-4 h-4" />
                        Display Name
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="Enter your full name" {...field} />
                      </FormControl>
                      <FormDescription>
                        This name will be visible to other users in your organization.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex justify-end pt-4">
                <Button 
                  type="submit" 
                  disabled={isSubmitting || !isValid}
                  className="min-w-[120px]"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Organization & Access Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            Organization & Access
          </CardTitle>
          <CardDescription>
            Manage your organization membership and permissions.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                Current Organization
              </Label>
              {profile ? (
                <div className="space-y-2">
                  <div className="border rounded-md p-2 bg-background">
                    <OrganizationSelector 
                      profile={profile}
                      activeOrganizationId={activeOrganizationId}
                      size="md"
                      className="w-full"
                      onOrganizationChange={handleOrganizationChange}
                    />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {profile?.is_super_admin 
                      ? "🚀 As a super admin, click the dropdown above to switch between organizations or view all organizations."
                      : "Switch between organizations you have access to. Your role and permissions may vary by organization."
                    }
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="w-full h-10 bg-muted animate-pulse rounded-md" />
                  <p className="text-sm text-muted-foreground">Loading organizations...</p>
                </div>
              )}
            </div>

            <Separator />

            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Access Level
              </Label>
              <div className="flex items-center gap-3">
                {profile?.is_super_admin ? (
                  <Badge variant="destructive" className="gap-1 text-sm py-1 px-3">
                    <Crown className="w-4 h-4" />
                    Super Administrator
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="gap-1 text-sm py-1 px-3">
                    <Shield className="w-4 h-4" />
                    {userRole || 'Member'}
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                {profile?.is_super_admin 
                  ? "You have full administrative privileges across all organizations, including user management, billing, and system configuration."
                  : `Your current role within ${organizationName || 'this organization'} determines what actions you can perform and what data you can access.`
                }
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 