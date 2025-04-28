import { render, screen, within } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import Link from 'next/link'
import { NavSecondary } from './nav-secondary'
import type { LucideIcon, LucideProps } from 'lucide-react'
import { SidebarProvider } from '@/components/ui/sidebar'

// Mock next/link to inspect its props (same as NavMain)
vi.mock('next/link', () => ({
  default: ({ children, href, legacyBehavior }: { children: React.ReactNode, href: string, legacyBehavior?: boolean }) => (
    <div data-testid="next-link" data-href={href} data-legacy={legacyBehavior}>
      {children} 
    </div>
  )
}));

// Mock Lucide icons
const MockDynamicIcon = (props: LucideProps) => <div data-testid="icon-dynamic">DynamicIcon</div>;
vi.mock('lucide-react', async (importOriginal) => {
  const mod = await importOriginal<typeof import('lucide-react')>();
  return { ...mod };
});

// Mock necessary sidebar UI components (simplified for this test)
vi.mock('@/components/ui/sidebar', async (importOriginal) => {
  const mod = await importOriginal<typeof import('@/components/ui/sidebar')>()
  return {
    ...mod,
    SidebarGroup: ({ children, ...props }: { children: React.ReactNode, [key: string]: any }) => <div data-testid="sidebar-group-mock" {...props}>{children}</div>,
    SidebarGroupContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    SidebarMenu: ({ children }: { children: React.ReactNode }) => <ul>{children}</ul>,
    SidebarMenuItem: ({ children }: { children: React.ReactNode }) => <li>{children}</li>,
    // Simple mock - actual button rendered inside Link/anchor
    SidebarMenuButton: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  }
})

// Helper function to wrap component with provider
const renderWithProvider = (ui: React.ReactElement) => {
  return render(<SidebarProvider>{ui}</SidebarProvider>);
};

describe('NavSecondary', () => {
  const defaultItems = [
    { title: 'Settings', url: '/settings', icon: MockDynamicIcon as LucideIcon },
    { title: 'Help', url: '/help', icon: MockDynamicIcon as LucideIcon },
  ];

  it('should render items wrapped in Links with correct legacyBehavior and href', () => {
    renderWithProvider(<NavSecondary items={defaultItems} />)

    defaultItems.forEach(item => {
       // Find the list item containing the title
       const listItem = screen.getByText(item.title).closest('li');
       expect(listItem).toBeInTheDocument();
 
       // Within that list item, find the mocked Link component
       const link = within(listItem!).getByTestId('next-link'); 
       expect(link).toBeInTheDocument();
 
       // Assert that the link has the correct href and legacyBehavior was used
       expect(link).toHaveAttribute('data-href', item.url);
       expect(link).toHaveAttribute('data-legacy', 'true');
 
       // Verify icon and title are rendered within the link structure
       expect(within(link).getByTestId('icon-dynamic')).toBeInTheDocument();
       expect(within(link).getByText(item.title)).toBeInTheDocument();
    });

    // Additionally, verify the correct number of mocked links are rendered
    const allLinks = screen.getAllByTestId('next-link');
    expect(allLinks).toHaveLength(defaultItems.length);
  })

  it('should render nothing inside the menu when items prop is empty', () => {
    renderWithProvider(<NavSecondary items={[]} />)
    // Check that no mocked links are present
    expect(screen.queryByTestId('next-link')).not.toBeInTheDocument()
    // Check that no dynamic icons are present
    expect(screen.queryByTestId('icon-dynamic')).not.toBeInTheDocument()
  })

  it('should pass additional props to SidebarGroup', () => {
    const testClassName = "my-custom-class"
    renderWithProvider(<NavSecondary items={defaultItems} className={testClassName} />)
    const sidebarGroup = screen.getByTestId('sidebar-group-mock');
    expect(sidebarGroup).toHaveClass(testClassName);
  })
}); 