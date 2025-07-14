'use client';

import { useState, useEffect } from 'react';
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
import { OrganizationSwitcher } from "@/lib/organization/presentation/components/OrganizationSwitcher";
import { SuperAdminBadge } from "@/components/auth/SuperAdminBadge";
import { Mail, Building2, Shield, Users } from 'lucide-react';
import { useOrganization } from "@/lib/organization/application/providers/OrganizationProvider";
import { useUserProfile } from "@/lib/auth";
import { createClient } from '@/lib/supabase/client';

/**
 * Profile Form Component - Presentation Layer
 * 
 * Single Responsibility: Profile editing form
 * Now uses centralized UserProfileProvider to eliminate redundant profile fetching
 * Reduced complexity by leveraging shared state management
 */

const profileFormSchema = z.object({
  name: z.string().min(1, { message: "Name cannot be empty." }),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

export function ProfileForm() {
  const supabase = createClient();
  const { toast } = useToast();
  const { user, profile, isLoading: isProfileLoading, refreshProfile } = useUserProfile();
  const [organizationName, setOrganizationName] = useState<string>("Loading...");
  const [userRole, setUserRole] = useState<string>("Loading...");
  const [isFormLoading, setIsFormLoading] = useState(false);

  // Use organization context for role/org info
  const { 
    currentContext, 
    activeOrganizationId, 
    accessibleOrganizations,
    isLoading: isOrgLoading 
  } = useOrganization();

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: { name: "" },
  });

  const { reset } = form;

  const getUserInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Update form when profile changes
  useEffect(() => {
    if (profile) {
      const displayName = profile.full_name || user?.user_metadata?.name || "";
      reset({ name: displayName });
    }
  }, [profile, user, reset]);

  // Update organization info when context changes
  useEffect(() => {
    if (isOrgLoading || !activeOrganizationId) return;

    if (currentContext) {
      const currentOrg = accessibleOrganizations.find(org => org.organization_id === activeOrganizationId);
      setOrganizationName(currentOrg?.organization_name || 'Unknown Organization');

      // Always check super admin status first, regardless of organization
      if (profile?.is_super_admin) {
        setUserRole('Super Admin');
      } else {
        setUserRole(currentOrg?.role_name || 'N/A');
      }
    } else {
      setOrganizationName('No Active Organization');
      // Still check super admin status even when no active organization
      if (profile?.is_super_admin) {
        setUserRole('Super Admin');
      } else {
        setUserRole('N/A');
      }
    }
  }, [activeOrganizationId, currentContext, accessibleOrganizations, isOrgLoading, profile]);

  const onSubmit = async (data: ProfileFormValues) => {
    if (!user?.id) {
      toast({ variant: "destructive", title: "Authentication Error", description: "User not found. Please log in again." });
      return;
    }

    setIsFormLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ full_name: data.name })
        .eq('id', user.id);

      if (error) {
        toast({ variant: "destructive", title: "Error updating profile", description: error.message });
        return;
      }

      toast({ title: "Profile updated", description: "Your name has been successfully updated." });
      await refreshProfile(); // Refresh the shared profile state
      form.reset({ name: data.name });
      
    } catch (_error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to update profile. Please try again." });
    } finally {
      setIsFormLoading(false);
    }
  };

  const isLoading = isProfileLoading || isOrgLoading || !user;

  if (isLoading) {
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
  const email = user?.email || "No email found";

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-3xl font-bold">Profile Settings</h1>
          <p className="text-muted-foreground">
            Manage your personal information and account preferences.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <Card className="md:col-span-1">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <Avatar className="h-20 w-20">
                  <AvatarImage src="" alt={currentName} />
                  <AvatarFallback className="text-lg">{getUserInitials(currentName)}</AvatarFallback>
                </Avatar>
              </div>
              <CardTitle className="text-xl">{currentName || 'No Name'}</CardTitle>
              <CardDescription className="flex items-center justify-center gap-2">
                <Mail className="h-4 w-4" />
                {email}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Building2 className="h-4 w-4" />
                  <span>Organization</span>
                </div>
                <p className="font-medium">{organizationName}</p>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Shield className="h-4 w-4" />
                  <span>Role</span>
                </div>
                <div className="flex items-center gap-2">
                  {userRole === 'Super Admin' ? (
                    <SuperAdminBadge profile={profile} />
                  ) : (
                    <Badge variant="secondary">
                      {userRole}
                    </Badge>
                  )}
                </div>
              </div>

              <Separator />
              
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span>Switch Organization</span>
                </div>
                <div className="w-full overflow-hidden">
                  <OrganizationSwitcher />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>
                Update your personal details below.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        disabled
                        className="bg-muted"
                      />
                      <p className="text-xs text-muted-foreground">
                        Email cannot be changed from this form.
                      </p>
                    </div>

                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Name</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Enter your full name" 
                              {...field} 
                              disabled={isFormLoading}
                            />
                          </FormControl>
                          <FormDescription>
                            This is the name that will be displayed across the platform.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="flex justify-end">
                    <Button 
                      type="submit" 
                      disabled={!form.formState.isDirty || isFormLoading}
                    >
                      {isFormLoading ? "Updating..." : "Update Profile"}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 