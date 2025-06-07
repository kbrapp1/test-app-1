'use client'; // Required for usePathname

import Link from 'next/link';
import { usePathname } from 'next/navigation'; // Import hook
import { ReactNode } from 'react';
import { cn } from '@/lib/utils'; // Import cn utility
import { buttonVariants } from '@/components/ui/button'; // Import buttonVariants
import { useAuthWithSuperAdmin } from '@/lib/auth/super-admin';
import { Badge } from '@/components/ui/badge';
import { Shield } from 'lucide-react';

// Define navigation items for easier mapping
const settingsNavItems: Array<{ title: string; href: string; superAdminOnly?: boolean }> = [
  { title: 'Profile', href: '/settings/profile' },
  { title: 'Organization Roles', href: '/settings/org-roles' },
  { title: 'Password', href: '/settings/password' },
  { title: 'Email', href: '/settings/email' },
  { title: 'Security', href: '/settings/security' },
  { title: 'Danger Zone', href: '/settings/danger' },
  // Add more items here later (e.g., Email, 2FA, Delete)
];

export default function SettingsLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname(); // Get current path
  const { isSuperAdmin } = useAuthWithSuperAdmin();

  return (
    <div className="flex flex-col space-y-8 lg:flex-row lg:space-x-4 lg:space-y-0">
      <aside className="lg:w-48">
        <nav className="flex space-x-2 lg:flex-col lg:space-x-0 lg:space-y-1">
          {settingsNavItems
            .filter((item) => !item.superAdminOnly || isSuperAdmin)
            .map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    buttonVariants({ variant: "ghost" }), // Apply base button styles
                    isActive
                      ? "bg-muted hover:bg-muted" // Active state styles
                      : "hover:bg-transparent hover:underline", // Default hover
                    "justify-start" // Align text to the left
                  )}
                >
                  <div className="flex items-center gap-2">
                    {item.title}
                    {item.superAdminOnly && (
                      <Badge variant="outline" className="text-xs flex items-center gap-1">
                        <Shield className="w-2 h-2" />
                        SA
                      </Badge>
                    )}
                  </div>
                </Link>
              );
            })}
        </nav>
      </aside>
      <div className="flex-1">
        {children}
      </div>
    </div>
  );
} 