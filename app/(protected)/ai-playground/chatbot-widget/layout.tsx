'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { buttonVariants } from '@/components/ui/button';

const chatbotNavItems: Array<{ title: string; href: string }> = [
  { title: 'Configuration', href: '/ai-playground/chatbot-widget/config' },
  { title: 'Knowledge Base', href: '/ai-playground/chatbot-widget/knowledge' },
  { title: 'Lead Settings', href: '/ai-playground/chatbot-widget/leads' },
  { title: 'Parameters', href: '/ai-playground/chatbot-widget/parameters' },
  { title: 'Testing', href: '/ai-playground/chatbot-widget/testing' },
  { title: 'Analytics', href: '/ai-playground/chatbot-widget/analytics' },
];

export default function ChatbotWidgetLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex flex-col space-y-8 lg:flex-row lg:space-x-6 lg:space-y-0">
      <aside className="lg:w-52">
        <nav className="flex space-x-2 lg:flex-col lg:space-x-0 lg:space-y-1">
          {chatbotNavItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  buttonVariants({ variant: "ghost" }),
                  isActive
                    ? "bg-muted hover:bg-muted"
                    : "hover:bg-transparent hover:underline",
                  "justify-start"
                )}
              >
                {item.title}
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