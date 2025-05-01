import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { TeamMemberCard } from './TeamMemberCard';
import { TeamMember } from '@/lib/actions/team';

// Mock next/image
vi.mock('next/image', () => ({
    default: (props: any) => {
        // eslint-disable-next-line @next/next/no-img-element
        return <img {...props} />;
    },
}));

const mockMember: TeamMember = {
    id: '1',
    name: 'Test User',
    title: 'Test Title',
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
        const imageContainer = container.querySelector('.group.relative');
        expect(imageContainer).toHaveClass('rounded-tr-[4rem]');
        expect(imageContainer).toHaveClass('aspect-square');

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