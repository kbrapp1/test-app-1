import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import SettingsLayout from './layout';

// Mock next/link component
vi.mock('next/link', () => ({
  default: ({ children, href, className }: { children: React.ReactNode, href: string, className?: string }) => (
    <a href={href} className={className}>{children}</a>
  )
}));

// Mock usePathname hook
const mockUsePathname = vi.fn();
vi.mock('next/navigation', () => ({
  usePathname: () => mockUsePathname(),
}));

// Mock the super admin hook directly
const mockUseAuthWithSuperAdmin = vi.fn();
vi.mock('@/lib/auth/super-admin', () => ({
  useAuthWithSuperAdmin: () => mockUseAuthWithSuperAdmin()
}));

// Mock buttonVariants
vi.mock('@/components/ui/button', () => ({
  buttonVariants: vi.fn(({ variant }) => `mock-button-variant-${variant}`),
}));

// Mock cn utility
vi.mock('@/lib/utils', () => ({
  cn: (...args: any[]) => args.filter(Boolean).join(' '),
}));

// Mock Badge component
vi.mock('@/components/ui/badge', () => ({
  Badge: ({ children, variant, className }: any) => (
    <span className={`badge ${variant} ${className || ''}`}>{children}</span>
  )
}));

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  Shield: ({ className }: any) => (
    <span className={`shield-icon ${className || ''}`}>🛡</span>
  )
}));

describe('SettingsLayout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUsePathname.mockReturnValue('/some/other/path');
    mockUseAuthWithSuperAdmin.mockReturnValue({
      isSuperAdmin: false,
      loading: false
    });
  });

  it('renders children correctly', () => {
    render(
      <SettingsLayout>
        <div>Test Child Content</div>
      </SettingsLayout>
    );
    expect(screen.getByText('Test Child Content')).toBeInTheDocument();
  });

  it('renders navigation links with correct hrefs', () => {
    render(<SettingsLayout><div>Child</div></SettingsLayout>);

    const profileLink = screen.getByRole('link', { name: /profile/i });
    expect(profileLink).toBeInTheDocument();
    expect(profileLink).toHaveAttribute('href', '/settings/profile');

    const passwordLink = screen.getByRole('link', { name: /password/i });
    expect(passwordLink).toBeInTheDocument();
    expect(passwordLink).toHaveAttribute('href', '/settings/password');

    const emailLink = screen.getByRole('link', { name: /email/i });
    expect(emailLink).toBeInTheDocument();
    expect(emailLink).toHaveAttribute('href', '/settings/email');

    const securityLink = screen.getByRole('link', { name: /security/i });
    expect(securityLink).toBeInTheDocument();
    expect(securityLink).toHaveAttribute('href', '/settings/security');

    const dangerLink = screen.getByRole('link', { name: /danger zone/i });
    expect(dangerLink).toBeInTheDocument();
    expect(dangerLink).toHaveAttribute('href', '/settings/danger');
  });

  it('applies active styles to Profile link when pathname matches', () => {
    mockUsePathname.mockReturnValue('/settings/profile');
    render(<SettingsLayout><div>Child</div></SettingsLayout>);

    const profileLink = screen.getByRole('link', { name: /profile/i });
    const passwordLink = screen.getByRole('link', { name: /password/i });

    expect(profileLink.className).toContain('bg-muted');
    expect(profileLink.className).toContain('hover:bg-muted');
    expect(passwordLink.className).toContain('hover:bg-transparent');
    expect(passwordLink.className).toContain('hover:underline');
  });

  it('applies active styles to Password link when pathname matches', () => {
    mockUsePathname.mockReturnValue('/settings/password');
    render(<SettingsLayout><div>Child</div></SettingsLayout>);

    const profileLink = screen.getByRole('link', { name: /profile/i });
    const passwordLink = screen.getByRole('link', { name: /password/i });

    expect(passwordLink.className).toContain('bg-muted');
    expect(passwordLink.className).toContain('hover:bg-muted');
    expect(profileLink.className).toContain('hover:bg-transparent');
    expect(profileLink.className).toContain('hover:underline');
  });

  it('shows super admin only links when user is super admin', () => {
    mockUseAuthWithSuperAdmin.mockReturnValue({
      isSuperAdmin: true,
      loading: false
    });

    render(<SettingsLayout><div>Child</div></SettingsLayout>);

    const networkMonitorLink = screen.getByRole('link', { name: /network monitor/i });
    expect(networkMonitorLink).toBeInTheDocument();
    expect(networkMonitorLink).toHaveAttribute('href', '/settings/network-monitor');
    
    // Check for super admin badge
    expect(screen.getByText('SA')).toBeInTheDocument();
    expect(screen.getByText('🛡')).toBeInTheDocument(); // Shield icon
  });

  it('hides super admin only links when user is not super admin', () => {
    mockUseAuthWithSuperAdmin.mockReturnValue({
      isSuperAdmin: false,
      loading: false
    });

    render(<SettingsLayout><div>Child</div></SettingsLayout>);

    expect(screen.queryByRole('link', { name: /network monitor/i })).not.toBeInTheDocument();
    expect(screen.queryByText('SA')).not.toBeInTheDocument();
  });

  it('shows Organization Roles link', () => {
    render(<SettingsLayout><div>Child</div></SettingsLayout>);

    const orgRolesLink = screen.getByRole('link', { name: /organization roles/i });
    expect(orgRolesLink).toBeInTheDocument();
    expect(orgRolesLink).toHaveAttribute('href', '/settings/org-roles');
  });
}); 