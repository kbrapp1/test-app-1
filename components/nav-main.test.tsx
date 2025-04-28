import { render, screen, within } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import Link from 'next/link'
import { NavMain } from './nav-main'
import type { LucideIcon, LucideProps } from 'lucide-react'

// Mock next/link to inspect its props
vi.mock('next/link', () => ({
  default: ({ children, href, legacyBehavior }: { children: React.ReactNode, href: string, legacyBehavior?: boolean }) => (
    <div data-testid="next-link" data-href={href} data-legacy={legacyBehavior}>
      {children}
    </div>
  )
}));

// Define a mock icon component *outside* the vi.mock factory
const MockDynamicIcon = (props: LucideProps) => <div data-testid="icon-dynamic">DynamicIcon</div>;

vi.mock('lucide-react', async (importOriginal) => {
  const mod = await importOriginal<typeof import('lucide-react')>();
  return {
    ...mod,
    // Simplify mock to avoid prop conflicts
    PlusCircleIcon: (props: LucideProps) => <div data-testid="icon-plus-circle">PlusCircleIcon</div>,
    MailIcon: (props: LucideProps) => <div data-testid="icon-mail">MailIcon</div>,
    // Export the mock component under a name if needed, but we'll use the direct reference
  };
});

// Mock necessary sidebar UI components
vi.mock('@/components/ui/sidebar', async (importOriginal) => {
  const mod = await importOriginal<typeof import('@/components/ui/sidebar')>()
  return {
    ...mod,
    // Mock components to simply render children
    SidebarGroup: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    SidebarGroupContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    SidebarMenu: ({ children }: { children: React.ReactNode }) => <ul>{children}</ul>,
    SidebarMenuItem: ({ children }: { children: React.ReactNode }) => <li>{children}</li>,
    SidebarMenuButton: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  }
})

// Mock Button component from shadcn/ui
vi.mock('@/components/ui/button', () => ({
  Button: ({ children, ...props }: { children: React.ReactNode, [key: string]: any }) => <button {...props}>{children}</button>
}))

describe('NavMain', () => {
  // Use the direct reference to the mock component function
  const defaultItems = [
    { title: 'Dashboard', url: '/dashboard', icon: MockDynamicIcon as LucideIcon },
    { title: 'Projects', url: '/projects', icon: MockDynamicIcon as LucideIcon },
    { title: 'Team', url: '/team', icon: MockDynamicIcon as LucideIcon },
  ];

  it('should render static Quick Create button', () => {
    render(<NavMain items={[]} />)
    expect(screen.getByText('Quick Create')).toBeInTheDocument()
    expect(screen.getByTestId('icon-plus-circle')).toBeInTheDocument()
  })

  it('should render static Inbox button', () => {
    render(<NavMain items={[]} />) // Pass empty array for this test
    // Find by role or other attribute if text isn't unique enough
    const inboxButton = screen.getByRole('button', { name: /inbox/i })
    expect(inboxButton).toBeInTheDocument()
    expect(screen.getByTestId('icon-mail')).toBeInTheDocument()
  })

  it('should render dynamic items wrapped in Links with correct legacyBehavior and href', () => {
    render(<NavMain items={defaultItems} />);

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
  });

  it('should render only static buttons when items prop is empty', () => {
    render(<NavMain items={[]} />)

    expect(screen.getByText('Quick Create')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /inbox/i })).toBeInTheDocument()

    // Check that no dynamic item titles are present within list items
    const listItems = screen.queryAllByRole('listitem');
    listItems.forEach(li => {
        defaultItems.forEach(item => {
            expect(within(li).queryByText(item.title)).not.toBeInTheDocument();
        })
    })
  })
}); 