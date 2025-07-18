import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { TeamMemberCard } from './TeamMemberCard';
import type { TeamMember } from '@/types/team';

// Mock Supabase client creation to prevent initialization errors
vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(() => ({
    auth: {
      getSession: vi.fn(),
      getUser: vi.fn(),
      onAuthStateChange: vi.fn(),
    },
    from: vi.fn(),
  })),
}));

// Mock Supabase server client
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => ({
    auth: {
      getSession: vi.fn(),
      getUser: vi.fn(),
      refreshSession: vi.fn(),
    },
    rpc: vi.fn(),
    from: vi.fn(),
  })),
}));

// Mock organization service to prevent Supabase client creation
vi.mock('@/lib/auth/services/organization-service', () => ({
  OrganizationService: vi.fn(() => ({
    getOrganizations: vi.fn(),
    switchOrganization: vi.fn(),
  })),
}));

// Mock the useUser hook to prevent Supabase client creation
vi.mock('@/lib/hooks/useUser', () => ({
  useUser: vi.fn(() => ({
    user: null,
    isLoading: false,
    hasPermission: vi.fn(() => false),
    hasAnyPermission: vi.fn(() => false),
    hasAllPermissions: vi.fn(() => false),
    hasRole: vi.fn(() => false),
    hasAnyRole: vi.fn(() => false),
    role: undefined,
    permissions: [],
  })),
}));

// Mock the permissions hook
vi.mock('@/lib/shared/access-control/hooks/usePermissions', () => ({
  useTeamMemberPermissions: () => ({
    canUpdate: true,
    canDelete: true,
    isLoading: false,
  }),
}));

// Mock the auth actions
vi.mock('@/lib/auth', () => ({
  deleteTeamMember: vi.fn(),
}));

// Mock next/image
vi.mock('next/image', () => ({
    __esModule: true,
    default: (props: { src: string; alt: string; fill?: boolean; priority?: boolean }) => {
        const { fill: _fill, priority: _priority, ...rest } = props;
        // eslint-disable-next-line @next/next/no-img-element
        return <img {...rest} alt={rest.alt || ""} />;
    },
}));

const mockMember: TeamMember = {
    id: '1',
    name: 'Test User',
    title: 'Test Title',
    organization_id: 'test-org-123',
    primary_image_url: '/test-primary.jpg',
    secondary_image_url: '/test-secondary.jpg',
    created_at: new Date().toISOString(),
};

describe('TeamMemberCard', () => {
    it('renders member name and title', () => {
        render(<TeamMemberCard member={mockMember} />);
        expect(screen.getByText('Test User')).toBeInTheDocument();
        expect(screen.getByText('Test Title')).toBeInTheDocument();
    });

    it('renders the primary image initially', () => {
        render(<TeamMemberCard member={mockMember} />);
        const primaryImage = screen.getByAltText(`Photo of ${mockMember.name}`) as HTMLImageElement;
        expect(primaryImage).toBeInTheDocument();
        expect(primaryImage.src).toContain(mockMember.primary_image_url);
    });

    it('renders the secondary image for hover effect', () => {
        render(<TeamMemberCard member={mockMember} />);
        const secondaryImage = screen.getByAltText(`Hover photo of ${mockMember.name}`) as HTMLImageElement;
        expect(secondaryImage).toBeInTheDocument();
        expect(secondaryImage.src).toContain(mockMember.secondary_image_url);
    });

    it('applies correct styling classes', () => {
        const { container } = render(<TeamMemberCard member={mockMember} />);
        
        // Find the container div that *should* have the rounding and overflow hidden
        const roundedContainer = container.querySelector('div[class*="overflow-hidden"]');
        expect(roundedContainer).toBeInTheDocument(); 
        expect(roundedContainer).toHaveClass('rounded-tr-[4rem]');
        expect(roundedContainer).toHaveClass('w-full'); // Add another check for certainty

        // Optionally, find the AspectRatio element within it if needed for other checks
        const imageGroup = roundedContainer?.querySelector('.group.relative');
        expect(imageGroup).toBeInTheDocument();

        // Test image classes as before
        const primaryImage = screen.getByAltText(`Photo of ${mockMember.name}`);
        expect(primaryImage).toHaveClass('grayscale'); // Initially grayscale
        expect(primaryImage).toHaveClass('group-hover:grayscale-0');
        
        const secondaryImage = screen.getByAltText(`Hover photo of ${mockMember.name}`);
        expect(secondaryImage).toHaveClass('grayscale');
        expect(secondaryImage).toHaveClass('group-hover:grayscale-0');
        expect(secondaryImage).toHaveClass('opacity-0'); // Initially hidden
        expect(secondaryImage).toHaveClass('group-hover:opacity-100');
        expect(secondaryImage).toHaveClass('transition-opacity');
        expect(secondaryImage).toHaveClass('duration-500');

    });

    // Note: Testing the actual hover interaction visually requires E2E tests (e.g., Playwright/Cypress).
    // These tests verify the setup for the hover effect (classes, two images present).
}); 