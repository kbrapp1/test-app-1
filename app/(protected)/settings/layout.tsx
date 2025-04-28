'use client'; // Required for usePathname

import Link from 'next/link';
import { usePathname } from 'next/navigation'; // Import hook
import { ReactNode } from 'react';
import { cn } from '@/lib/utils'; // Import cn utility
import { buttonVariants } from '@/components/ui/button'; // Import buttonVariants

// Define navigation items for easier mapping
const settingsNavItems = [
  { title: 'Profile', href: '/settings/profile' },
  { title: 'Password', href: '/settings/password' },
  { title: 'Email', href: '/settings/email' },
  { title: 'Security', href: '/settings/security' },
  { title: 'Danger Zone', href: '/settings/danger' },
  // Add more items here later (e.g., Email, 2FA, Delete)
];

export default function SettingsLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname(); // Get current path

  return (
    // Use grid or flex for better layout control if needed
    <div className="flex flex-col space-y-8 lg:flex-row lg:space-x-12 lg:space-y-0">
      <aside className="-mx-4 lg:w-1/5">
        <nav className="flex space-x-2 lg:flex-col lg:space-x-0 lg:space-y-1">
          {settingsNavItems.map((item) => {
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
                {item.title}
              </Link>
            );
          })}
        </nav>
      </aside>
      <div className="flex-1 lg:max-w-2xl">
        {children}
      </div>
    </div>
  );
} 