import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import SettingsLayout from './layout';
import { cn } from '@/lib/utils'; // Assuming cn is used for styling

// Mock next/link component
vi.mock('next/link', () => ({
  // Keep simple mock for basic rendering check
  default: ({ children, href, className }: { children: React.ReactNode, href: string, className?: string }) => (
    <a href={href} className={className}>{children}</a>
  )
}));

// Mock usePathname hook
const mockUsePathname = vi.fn();
vi.mock('next/navigation', () => ({
  usePathname: () => mockUsePathname(),
}));

// Mock buttonVariants if used (adjust path as needed)
vi.mock('@/components/ui/button', () => ({
  buttonVariants: vi.fn(({ variant }) => `mock-button-variant-${variant}`),
}));

// Mock cn utility (optional, could test exact class string)
vi.mock('@/lib/utils', () => ({
  cn: (...args: any[]) => args.filter(Boolean).join(' '),
}));

describe('SettingsLayout', () => {
  beforeEach(() => {
    // Reset mocks before each test
    mockUsePathname.mockClear();
    vi.clearAllMocks(); // Clear other mocks like buttonVariants if needed
  });

  it('renders children correctly', () => {
    mockUsePathname.mockReturnValue('/some/other/path'); // Set a default path
    render(
      <SettingsLayout>
        <div>Test Child Content</div>
      </SettingsLayout>
    );
    expect(screen.getByText('Test Child Content')).toBeInTheDocument();
  });

  it('renders navigation links with correct hrefs', () => {
    mockUsePathname.mockReturnValue('/some/other/path');
    render(<SettingsLayout><div>Child</div></SettingsLayout>);

    const profileLink = screen.getByRole('link', { name: /profile/i });
    expect(profileLink).toBeInTheDocument();
    expect(profileLink).toHaveAttribute('href', '/settings/profile');

    const passwordLink = screen.getByRole('link', { name: /password/i });
    expect(passwordLink).toBeInTheDocument();
    expect(passwordLink).toHaveAttribute('href', '/settings/password');
  });

  it('applies active styles to Profile link when pathname matches', () => {
    mockUsePathname.mockReturnValue('/settings/profile'); // Set path to profile
    render(<SettingsLayout><div>Child</div></SettingsLayout>);

    const profileLink = screen.getByRole('link', { name: /profile/i });
    const passwordLink = screen.getByRole('link', { name: /password/i });

    // Check classes - depends on how cn and buttonVariants output
    // We expect 'bg-muted' related classes for the active link
    expect(profileLink.className).toContain('bg-muted'); // Or a more specific class generated
    expect(profileLink.className).not.toContain('hover:underline'); // Should not have default hover

    // Password link should have default styles
    expect(passwordLink.className).not.toContain('bg-muted');
    expect(passwordLink.className).toContain('hover:underline'); // Should have default hover
  });

  it('applies active styles to Password link when pathname matches', () => {
    mockUsePathname.mockReturnValue('/settings/password'); // Set path to password
    render(<SettingsLayout><div>Child</div></SettingsLayout>);

    const profileLink = screen.getByRole('link', { name: /profile/i });
    const passwordLink = screen.getByRole('link', { name: /password/i });

    // Check classes
    expect(passwordLink.className).toContain('bg-muted');
    expect(passwordLink.className).not.toContain('hover:underline');

    expect(profileLink.className).not.toContain('bg-muted');
    expect(profileLink.className).toContain('hover:underline');
  });
}); 