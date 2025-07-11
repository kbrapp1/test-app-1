import { render, screen, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { TeamMemberList } from './TeamMemberList';
import { TeamMember } from '@/types/team';

// Mock the TeamMemberCard component to isolate testing TeamMemberList
vi.mock('./TeamMemberCard', () => ({
    TeamMemberCard: ({ member }: { member: TeamMember }) => (
        <div data-testid="team-member-card">
            <span>{member.name}</span>
            <span>{member.title}</span>
        </div>
    ),
}));

const mockMembers: TeamMember[] = [
    {
        id: '1',
        name: 'Member One',
        title: 'Title One',
        organization_id: 'test-org-123',
        primary_image_url: '/img1p.jpg',
        secondary_image_url: '/img1s.jpg',
        created_at: new Date().toISOString(),
    },
    {
        id: '2',
        name: 'Member Two',
        title: 'Title Two',
        organization_id: 'test-org-123',
        primary_image_url: '/img2p.jpg',
        secondary_image_url: '/img2s.jpg',
        created_at: new Date().toISOString(),
    },
];

describe('TeamMemberList', () => {
    // Clean up the DOM after each test
    afterEach(cleanup);

    it('renders the correct number of TeamMemberCard components', () => {
        render(<TeamMemberList members={mockMembers} />);
        const cards = screen.getAllByTestId('team-member-card');
        expect(cards).toHaveLength(mockMembers.length);
        expect(screen.getByText('Member One')).toBeInTheDocument();
        expect(screen.getByText('Member Two')).toBeInTheDocument();
    });

    it('renders the empty state message when members array is empty', () => {
        render(<TeamMemberList members={[]} />);
        expect(screen.getByText(/No team members found/i)).toBeInTheDocument();
        expect(screen.queryByTestId('team-member-card')).not.toBeInTheDocument();
    });

    it('renders the empty state message when members is null', () => {
        render(<TeamMemberList members={null as any} />); // Test null
        expect(screen.getByText(/No team members found/i)).toBeInTheDocument();
    });

    it('renders the empty state message when members is undefined', () => {
        render(<TeamMemberList members={undefined as any} />); // Test undefined
        expect(screen.getByText(/No team members found/i)).toBeInTheDocument();
    });

     it('applies grid styling', () => {
        const { container } = render(<TeamMemberList members={mockMembers} />);
        // Check for a class indicative of a grid layout
        expect(container.firstChild).toHaveClass('grid'); 
    });
}); 