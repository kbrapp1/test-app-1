import { render, screen, within } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { NavDocuments } from './nav-documents';
import type { LucideIcon, LucideProps } from 'lucide-react';

// Define mock icons BEFORE the lucide-react mock that uses them
const MockDynamicIcon = (_props: LucideProps) => <div data-testid="icon-dynamic">DocIcon</div>;

// Mock next/link to inspect its props
vi.mock('next/link', () => ({
  default: ({
    children,
    href,
    legacyBehavior
  }: {
    children: React.ReactNode;
    href: string;
    legacyBehavior?: boolean;
  }) => (
    <div data-testid="next-link" data-href={href} data-legacy={legacyBehavior}>
      {children}
    </div>
  )
}));

// Mock Lucide icons
vi.mock('lucide-react', async (importOriginal) => {
  const mod = await importOriginal<typeof import('lucide-react')>();
  return {
    ...mod,
    MoreHorizontalIcon: (_props: LucideProps) => <div data-testid="icon-more">MoreIcon</div>,
    // Other icons used in dropdown can be mocked if dropdown testing is added
    FolderIcon: (_props: LucideProps) => <div data-testid="icon-folder">FolderIcon</div>,
    ShareIcon: (_props: LucideProps) => <div data-testid="icon-share">ShareIcon</div>,
  };
});

// Mock necessary sidebar UI components
vi.mock('@/components/ui/sidebar', async (importOriginal) => {
  const mod = await importOriginal<typeof import('@/components/ui/sidebar')>()
  return {
    ...mod,
    useSidebar: vi.fn(() => ({ isMobile: false })), // Mock useSidebar hook
    SidebarGroup: ({ children }: { children: React.ReactNode }) => <div data-testid="sidebar-group">{children}</div>,
    SidebarGroupLabel: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    SidebarMenu: ({ children }: { children: React.ReactNode }) => <ul>{children}</ul>,
    SidebarMenuItem: ({ children }: { children: React.ReactNode }) => <li>{children}</li>,
    SidebarMenuButton: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    SidebarMenuAction: ({ children }: { children: React.ReactNode }) => <button>{children}</button>, // Simple mock for action button
  }
});

// Mock DropdownMenu components
vi.mock('@/components/ui/dropdown-menu', async (importOriginal) => {
    const mod = await importOriginal<typeof import('@/components/ui/dropdown-menu')>();
    return {
        ...mod,
        DropdownMenu: ({ children }: { children: React.ReactNode }) => <div>{children}</div>, // Mock wrapper
        DropdownMenuTrigger: ({ children }: { children: React.ReactNode }) => <div>{children}</div>, // Mock trigger
        DropdownMenuContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>, // Mock content (initially hidden)
        DropdownMenuItem: ({ children }: { children: React.ReactNode }) => <div>{children}</div>, // Mock item
    };
});

describe('NavDocuments', () => {
  const defaultItems = [
    { name: 'Data Library', url: '/docs/data', icon: MockDynamicIcon as LucideIcon },
    { name: 'Reports', url: '/docs/reports', icon: MockDynamicIcon as LucideIcon },
    { name: 'Word Assistant', url: '/docs/word', icon: MockDynamicIcon as LucideIcon },
  ];

  it('should render the Documents label', () => {
    render(<NavDocuments items={defaultItems} />);
    expect(screen.getByText('Documents')).toBeInTheDocument();
  });

  it('should render items wrapped in Links with correct legacyBehavior and href', () => {
    render(<NavDocuments items={defaultItems} />);

    defaultItems.forEach(item => {
      const listItem = screen.getByText(item.name).closest('li');
      expect(listItem).toBeInTheDocument();

      const link = within(listItem!).getByTestId('next-link');
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute('data-href', item.url);
      expect(link).toHaveAttribute('data-legacy', 'true');

      expect(within(link).getByTestId('icon-dynamic')).toBeInTheDocument();
      expect(within(link).getByText(item.name)).toBeInTheDocument();
    });

    const allLinks = screen.getAllByTestId('next-link');
    expect(allLinks).toHaveLength(defaultItems.length);
  });

  it('should render the static More button at the end', () => {
    render(<NavDocuments items={defaultItems} />);

    // Find all list items
    const listItems = screen.getAllByRole('listitem');
    // Get the last list item
    const lastListItem = listItems[listItems.length - 1];
    // Check for the visible "More" text specifically within the last item
    expect(within(lastListItem).getByText('More', { selector: 'span:not(.sr-only)' })).toBeInTheDocument();
    // Check for the "More" icon specifically within the last item
    expect(within(lastListItem).getByTestId('icon-more')).toBeInTheDocument();
  });

  it('should render only the label and More button when items prop is empty', () => {
    render(<NavDocuments items={[]} />);
    expect(screen.getByText('Documents')).toBeInTheDocument();
    expect(screen.getByText('More')).toBeInTheDocument();
    expect(screen.queryByTestId('next-link')).not.toBeInTheDocument();
    expect(screen.queryByTestId('icon-dynamic')).not.toBeInTheDocument();
  });
}); 