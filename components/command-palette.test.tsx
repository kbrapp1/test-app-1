import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event' // Use userEvent for interactions
import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import { CommandPalette } from './command-palette';

// --- Mock Dependencies ---

// Mock next/navigation
const mockRouterPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockRouterPush }),
  // usePathname: vi.fn().mockReturnValue('/'), // Not currently used, but could be mocked if needed
}));

// Mock next-themes
const mockSetTheme = vi.fn();
vi.mock('next-themes', () => ({
  useTheme: () => ({ setTheme: mockSetTheme }),
}));

// Mock lucide-react icons
vi.mock('lucide-react', async (importOriginal) => {
  const mod = await importOriginal<typeof import('lucide-react')>();
  // Create generic mock for any icon
  const MockIcon = ({ className }: { className?: string }) => <svg data-testid="mock-icon" className={className} />;
  return {
    ...mod,
    // Return the mock for specific icons used
    LayoutDashboard: MockIcon,
    Settings: MockIcon, 
    Sun: MockIcon,
    Moon: MockIcon,
    Laptop: MockIcon,
    // Add any other icons used if necessary
  };
});

// Mock shadcn/ui command components
vi.mock('@/components/ui/command', async (importOriginal) => {
  const mod = await importOriginal<typeof import('@/components/ui/command')>();
  return {
    ...mod,
    // Mock CommandDialog to just render children when open
    CommandDialog: ({ open, children, onOpenChange }: { open: boolean; children: React.ReactNode; onOpenChange: (open: boolean)=>void }) => {
      // Need to simulate the dialog being present in the DOM when open
      return open ? <div data-testid="command-dialog">{children}</div> : null;
    },
    // Mock others to simply render children or act as placeholders
    CommandInput: (props: any) => <input data-testid="command-input" {...props} />,
    CommandList: ({ children }: { children: React.ReactNode }) => <div data-testid="command-list">{children}</div>,
    CommandEmpty: ({ children }: { children: React.ReactNode }) => <div data-testid="command-empty">{children}</div>,
    CommandGroup: ({ heading, children }: { heading?: string; children: React.ReactNode }) => (
      <div data-testid={`command-group-${heading?.toLowerCase()}`}>
        {heading && <h4>{heading}</h4>}
        {children}
      </div>
    ),
    CommandItem: ({ children, onSelect, ...props }: { children: React.ReactNode; onSelect?: () => void; [key: string]: any }) => (
      // Simulate item click calling onSelect
      <button data-testid="command-item" onClick={onSelect} {...props}>
        {children}
      </button>
    ),
    CommandSeparator: () => <hr data-testid="command-separator" />,
  };
});

// Mock DialogTitle from shadcn/ui
vi.mock('@/components/ui/dialog', () => ({
  DialogTitle: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <h2 data-testid="dialog-title" className={className}>{children}</h2>
  ),
  DialogDescription: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <p data-testid="dialog-description" className={className}>{children}</p>
  ),
}));


describe('CommandPalette', () => {
  let mockSetOpen: (value: boolean | ((prevState: boolean) => boolean)) => void;

  beforeEach(() => {
    // Reset mocks before each test
    vi.clearAllMocks();
    mockSetOpen = vi.fn();
    // Reset timer mocks if necessary (e.g., for setTimeout in runCommand)
    vi.useRealTimers(); 
  });

  it('should not render dialog content when closed', () => {
    render(<CommandPalette open={false} setOpen={mockSetOpen} />);
    expect(screen.queryByTestId('command-dialog')).not.toBeInTheDocument();
  });

  it('should render dialog content and commands when open', () => {
    render(<CommandPalette open={true} setOpen={mockSetOpen} />);

    expect(screen.getByTestId('command-dialog')).toBeInTheDocument();
    expect(screen.getByTestId('dialog-title')).toBeInTheDocument();
    expect(screen.getByTestId('command-input')).toBeInTheDocument();
    expect(screen.getByTestId('command-list')).toBeInTheDocument();
    
    // Check for command groups
    expect(screen.getByTestId('command-group-navigation')).toBeInTheDocument();
    expect(screen.getByTestId('command-group-theme')).toBeInTheDocument();

    // Check for specific commands (using button role and text content)
    expect(screen.getByRole('button', { name: /dashboard/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /light/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /dark/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /system/i })).toBeInTheDocument();

    // Check for separator(s)
    const separators = screen.getAllByTestId('command-separator');
    expect(separators.length).toBeGreaterThan(0); // Ensure at least one separator exists
    separators.forEach(separator => expect(separator).toBeInTheDocument());
  });

  it('should call router.push and setOpen(false) when Dashboard command is selected', async () => {
    render(<CommandPalette open={true} setOpen={mockSetOpen} />);
    
    const dashboardButton = screen.getByRole('button', { name: /dashboard/i });
    
    // Use await act for user interaction and subsequent state updates
    await act(async () => {
      await userEvent.click(dashboardButton);
      // Allow time for the setTimeout(0) in runCommand to execute
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    // Check router push *before* advancing timers
    expect(mockRouterPush).toHaveBeenCalledWith('/dashboard');
    expect(mockRouterPush).toHaveBeenCalledTimes(1);

    expect(mockSetOpen).toHaveBeenCalledWith(false);
    expect(mockSetOpen).toHaveBeenCalledTimes(1);
  });

  it('should call setTheme("light") and setOpen(false) when Light command is selected', async () => {
    render(<CommandPalette open={true} setOpen={mockSetOpen} />);
    
    const lightButton = screen.getByRole('button', { name: /light/i });
    await act(async () => {
      await userEvent.click(lightButton);
      await new Promise(resolve => setTimeout(resolve, 0)); 
    });

    expect(mockSetTheme).toHaveBeenCalledWith('light');
    expect(mockSetTheme).toHaveBeenCalledTimes(1);

    expect(mockSetOpen).toHaveBeenCalledWith(false);
    expect(mockSetOpen).toHaveBeenCalledTimes(1);
  });

  it('should call setTheme("dark") and setOpen(false) when Dark command is selected', async () => {
    render(<CommandPalette open={true} setOpen={mockSetOpen} />);
    
    const darkButton = screen.getByRole('button', { name: /dark/i });
    await act(async () => {
      await userEvent.click(darkButton);
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(mockSetTheme).toHaveBeenCalledWith('dark');
    expect(mockSetTheme).toHaveBeenCalledTimes(1);

    expect(mockSetOpen).toHaveBeenCalledWith(false);
    expect(mockSetOpen).toHaveBeenCalledTimes(1);
  });

  it('should call setTheme("system") and setOpen(false) when System command is selected', async () => {
    render(<CommandPalette open={true} setOpen={mockSetOpen} />);
    
    const systemButton = screen.getByRole('button', { name: /system/i });
    await act(async () => {
      await userEvent.click(systemButton);
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(mockSetTheme).toHaveBeenCalledWith('system');
    expect(mockSetTheme).toHaveBeenCalledTimes(1);

    expect(mockSetOpen).toHaveBeenCalledWith(false);
    expect(mockSetOpen).toHaveBeenCalledTimes(1);
  });

  // Note: Testing the global keydown listener added via useEffect is complex
  // and often requires more setup (e.g., dispatching events on document.body).
  // For this scaffold, testing the command actions directly provides good value.

}); 