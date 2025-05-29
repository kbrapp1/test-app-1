'use client'; // Layouts using context/hooks often need to be client components

import * as React from 'react';
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { useCompleteOnboarding } from '@/lib/auth/hooks/useCompleteOnboarding';

export default function ProtectedLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Automatically check and complete onboarding for invited users whose setup wasn't finalized
  useCompleteOnboarding();

  return (
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
  );
} 