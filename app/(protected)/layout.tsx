'use client'; // Layouts using context/hooks often need to be client components

import * as React from 'react';
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { useCompleteOnboarding } from '@/lib/auth/hooks/useCompleteOnboarding';
import { OrganizationProvider } from '@/lib/organization/application/providers/OrganizationProvider';
import { UserProfileProvider } from "@/lib/auth/providers/UserProfileProvider";
import { TeamMembersProvider } from "@/lib/auth/providers/TeamMembersProvider";
import { IdleTimeoutProvider } from "@/lib/auth/providers/IdleTimeoutProvider";
import ReactScanIntegration from '@/lib/monitoring/infrastructure/development/ReactScanIntegration';

export default function ProtectedLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Automatically check and complete onboarding for invited users whose setup wasn't finalized
  useCompleteOnboarding();

  return (
    <IdleTimeoutProvider 
      idleTimeoutMinutes={60}  // 60 minutes of inactivity before logout
      warningTimeoutMinutes={1}  // Show warning 55 minutes before logout
    >
      <OrganizationProvider>
        <UserProfileProvider>
          <TeamMembersProvider>
            <ReactScanIntegration />
            <SidebarProvider>
              {/* Assuming the inset variant is desired for all protected pages */}
              <AppSidebar variant="inset" /> 
              <SidebarInset>
                <SiteHeader />
                <main className="flex flex-1 flex-col p-4 md:p-6">
                  {/* Render the specific page content here */}
                  {children} 
                </main>
              </SidebarInset>
            </SidebarProvider>
          </TeamMembersProvider>
        </UserProfileProvider>
      </OrganizationProvider>
    </IdleTimeoutProvider>
  );
} 