import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { SuperAdminBadge, SuperAdminBadgeCompact, SuperAdminIcon } from './SuperAdminBadge';
import type { Profile } from '@/lib/auth';

// Mock the UI components
vi.mock('@/components/ui/badge', () => ({
  Badge: ({
    children,
    className,
    ...props
  }: {
    children: React.ReactNode;
    className?: string;
    [key: string]: unknown;
  }) => (
    <div data-testid="badge" className={className} {...props}>
      {children}
    </div>
  ),
}));

vi.mock('@/lib/utils', () => ({
  cn: (...classes: string[]) => classes.filter(Boolean).join(' '),
}));

describe('SuperAdminBadge', () => {
  const createMockProfile = (isSuperAdmin: boolean): Profile => ({
    id: 'test-user-id',
    email: 'test@example.com',
    full_name: 'Test User',
    avatar_url: null,
    created_at: '2024-01-01T00:00:00Z',
    last_sign_in_at: '2024-01-01T00:00:00Z',
    is_super_admin: isSuperAdmin,
  });

  describe('SuperAdminBadge Component', () => {
    it('should render super admin badge when user is super admin', () => {
      const superAdminProfile = createMockProfile(true);
      
      render(<SuperAdminBadge profile={superAdminProfile} />);
      
      expect(screen.getByRole('status')).toBeInTheDocument();
      expect(screen.getByText('Super Admin')).toBeInTheDocument();
      expect(screen.getByLabelText('User has super admin privileges - can access all organizations')).toBeInTheDocument();
    });

    it('should not render when user is not super admin', () => {
      const regularProfile = createMockProfile(false);
      
      render(<SuperAdminBadge profile={regularProfile} />);
      
      expect(screen.queryByRole('status')).not.toBeInTheDocument();
      expect(screen.queryByText('Super Admin')).not.toBeInTheDocument();
    });

    it('should not render when profile is null', () => {
      render(<SuperAdminBadge profile={null} />);
      
      expect(screen.queryByRole('status')).not.toBeInTheDocument();
    });

    it('should render abbreviated text when abbreviated prop is true', () => {
      const superAdminProfile = createMockProfile(true);
      
      render(<SuperAdminBadge profile={superAdminProfile} abbreviated />);
      
      expect(screen.getByText('Admin')).toBeInTheDocument();
      expect(screen.queryByText('Super Admin')).not.toBeInTheDocument();
    });

    it('should hide icon when showIcon is false', () => {
      const superAdminProfile = createMockProfile(true);
      
      render(<SuperAdminBadge profile={superAdminProfile} showIcon={false} />);
      
      const badge = screen.getByRole('status');
      expect(badge).toBeInTheDocument();
      // Shield icon should not be present
      expect(badge.querySelector('[data-lucide="shield"]')).not.toBeInTheDocument();
    });

    it('should apply size classes correctly', () => {
      const superAdminProfile = createMockProfile(true);
      
      // Test small size
      const { rerender } = render(<SuperAdminBadge profile={superAdminProfile} size="sm" />);
      expect(screen.getByTestId('badge')).toHaveClass('text-xs', 'px-1.5', 'py-0.5');
      
      // Test large size
      rerender(<SuperAdminBadge profile={superAdminProfile} size="lg" />);
      expect(screen.getByTestId('badge')).toHaveClass('text-base', 'px-3', 'py-1.5');
    });

    it('should apply custom className', () => {
      const superAdminProfile = createMockProfile(true);
      
      render(<SuperAdminBadge profile={superAdminProfile} className="custom-class" />);
      
      expect(screen.getByTestId('badge')).toHaveClass('custom-class');
    });
  });

  describe('SuperAdminBadgeCompact Component', () => {
    it('should render with compact settings', () => {
      const superAdminProfile = createMockProfile(true);
      
      render(<SuperAdminBadgeCompact profile={superAdminProfile} />);
      
      expect(screen.getByText('Admin')).toBeInTheDocument();
      expect(screen.getByTestId('badge')).toHaveClass('text-xs', 'px-1.5', 'py-0.5');
    });

    it('should not render when user is not super admin', () => {
      const regularProfile = createMockProfile(false);
      
      render(<SuperAdminBadgeCompact profile={regularProfile} />);
      
      expect(screen.queryByRole('status')).not.toBeInTheDocument();
    });
  });

  describe('SuperAdminIcon Component', () => {
    it('should render shield icon when user is super admin', () => {
      const superAdminProfile = createMockProfile(true);
      
      render(<SuperAdminIcon profile={superAdminProfile} />);
      
      const icon = screen.getByRole('img');
      expect(icon).toBeInTheDocument();
      expect(icon).toHaveAttribute('aria-label', 'Super Admin');
    });

    it('should not render when user is not super admin', () => {
      const regularProfile = createMockProfile(false);
      
      render(<SuperAdminIcon profile={regularProfile} />);
      
      expect(screen.queryByRole('img')).not.toBeInTheDocument();
    });

    it('should not render when profile is null', () => {
      render(<SuperAdminIcon profile={null} />);
      
      expect(screen.queryByRole('img')).not.toBeInTheDocument();
    });

    it('should apply custom className', () => {
      const superAdminProfile = createMockProfile(true);
      
      render(<SuperAdminIcon profile={superAdminProfile} className="custom-icon-class" />);
      
      const icon = screen.getByRole('img');
      expect(icon).toHaveClass('custom-icon-class');
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      const superAdminProfile = createMockProfile(true);
      
      render(<SuperAdminBadge profile={superAdminProfile} />);
      
      const badge = screen.getByRole('status');
      expect(badge).toHaveAttribute('aria-label', 'User has super admin privileges - can access all organizations');
    });

    it('should have aria-hidden on decorative icon', () => {
      const superAdminProfile = createMockProfile(true);
      
      render(<SuperAdminBadge profile={superAdminProfile} />);
      
      // Check that the shield icon in the badge has aria-hidden
      const badge = screen.getByRole('status');
      const shieldIcon = badge.querySelector('[aria-hidden="true"]');
      expect(shieldIcon).toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    it('should have responsive classes for different sizes', () => {
      const superAdminProfile = createMockProfile(true);
      
      const { rerender } = render(<SuperAdminBadge profile={superAdminProfile} size="sm" />);
      expect(screen.getByTestId('badge')).toHaveClass('gap-1');
      
      rerender(<SuperAdminBadge profile={superAdminProfile} size="lg" />);
      expect(screen.getByTestId('badge')).toHaveClass('gap-2');
    });
  });
}); 