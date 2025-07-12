import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';

// Mock Next.js headers and cache
vi.mock('next/headers', () => ({ cookies: vi.fn(() => ({ get: vi.fn(), set: vi.fn(), delete: vi.fn() })) }));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));

// Mock Supabase server client (used by server component for data fetching)
const mockSupabaseClient = {
  auth: {
    getUser: vi.fn(),
  },
  from: vi.fn(),
};

const mockQueryBuilder = {
  select: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  order: vi.fn().mockReturnThis(),
};

vi.mock('@/lib/supabase/server', () => ({
  createClient: () => mockSupabaseClient,
}));

// Mock the access control function
vi.mock('@/lib/shared/access-control', () => ({
  checkFeatureAccess: vi.fn(),
  checkDamAccess: vi.fn(),
  checkChatbotAccess: vi.fn(),
  checkTtsAccess: vi.fn(),
  checkNotesAccess: vi.fn(),
}));

// Mock the NotesPageContent to reflect proper props
vi.mock('./NotesPageContent', () => ({
  default: ({ organizationId, notes, fetchError }: { 
    organizationId: string; 
    notes: any[]; 
    fetchError: string | null; 
  }) => {
    
    // Render based on props received
    if (fetchError) {
      return (
        <div data-testid="notes-page-content" data-organization-id={organizationId}>
          <p>Error: {fetchError}</p>
        </div>
      );
    }
    
    if (notes.length === 0) {
      return (
        <div data-testid="notes-page-content" data-organization-id={organizationId}>
          <h1>My Notes</h1>
          <div data-testid="empty-state">
            <h2>No Notes Yet</h2>
            <p>Get started by adding your first note.</p>
            <button data-testid="add-note-dialog-trigger">Add First Note</button>
          </div>
        </div>
      );
    }
    
    // Notes exist
    return (
      <div data-testid="notes-page-content" data-organization-id={organizationId}>
        <h1>My Notes</h1>
        <button data-testid="add-note-dialog-trigger">Add New Note</button>
        <ul data-testid="note-list">
          {notes.map((note, index) => (
            <li key={note.id || index} data-testid={`note-item-${note.id || `note-${index + 1}`}`}>
              {note.title || 'Untitled'}
            </li>
          ))}
        </ul>
      </div>
    );
  },
}));

// No need to mock individual UI components since we mock NotesPageContent entirely

// Mock access guard components
vi.mock('@/components/access-guards/NoOrganizationAccess', () => ({
  NoOrganizationAccess: () => (
    <div data-testid="no-organization-access">
      <h3>No Organization Access</h3>
      <p>You don&apos;t currently have access to any organization.</p>
    </div>
  ),
}));

vi.mock('@/components/access-guards/FeatureNotAvailable', () => ({
  FeatureNotAvailable: ({ feature }: { feature: string }) => (
    <div data-testid="feature-not-available">
      <h3>Feature Not Available</h3>
      <p>{feature} feature is not available.</p>
    </div>
  ),
}));

// Import the page and the mocked function after mocks
import NotesPage from './page';
import { checkNotesAccess } from '@/lib/shared/access-control';

const mockCheckNotesAccess = vi.mocked(checkNotesAccess);

beforeEach(() => {
  vi.clearAllMocks();
  // Setup Supabase mocks
  mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);
  mockCheckNotesAccess.mockClear();
});

describe('NotesPage', () => {
  const mockUser = { id: 'user-123', email: 'test@example.com' };
  const mockOrg = 'org-abc-123';

  it('renders list when notes exist', async () => {
    // Mock successful access check
    mockCheckNotesAccess.mockResolvedValueOnce({
      hasAccess: true,
      organizationId: mockOrg,
      user: mockUser,
    });

    // Mock successful user fetch
    mockSupabaseClient.auth.getUser.mockResolvedValueOnce({
      data: { user: mockUser },
      error: null,
    });

    // Mock successful notes fetch
    const mockNotes = [
      { id: 'note-1', title: 'Note 1', user_id: mockUser.id, organization_id: mockOrg },
      { id: 'note-2', title: 'Untitled', user_id: mockUser.id, organization_id: mockOrg },
    ];
    mockQueryBuilder.order.mockResolvedValueOnce({
      data: mockNotes,
      error: null,
    });

    const Page = await NotesPage();
    render(Page);

    expect(screen.getByRole('heading', { name: /my notes/i })).toBeInTheDocument();
    expect(screen.getByTestId('add-note-dialog-trigger')).toHaveTextContent(/add new note/i);
    expect(screen.getByTestId('note-list')).toBeInTheDocument();
    expect(screen.getByTestId('note-item-note-1')).toBeInTheDocument();
    expect(screen.getByTestId('note-item-note-2')).toBeInTheDocument();
  });

  it('renders empty state when no notes', async () => {
    // Mock successful access check
    mockCheckNotesAccess.mockResolvedValueOnce({
      hasAccess: true,
      organizationId: mockOrg,
      user: mockUser,
    });

    // Mock successful user fetch
    mockSupabaseClient.auth.getUser.mockResolvedValueOnce({
      data: { user: mockUser },
      error: null,
    });

    // Mock empty notes fetch
    mockQueryBuilder.order.mockResolvedValueOnce({
      data: [],
      error: null,
    });

    const Page = await NotesPage();
    render(Page);

    expect(screen.getByTestId('empty-state')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /no notes yet/i })).toBeInTheDocument();
  });

  it('shows no organization access when access check throws organization error', async () => {
    mockCheckNotesAccess.mockRejectedValueOnce(new Error('Organization access required'));

    const Page = await NotesPage();
    render(Page);

    expect(screen.getByTestId('no-organization-access')).toBeInTheDocument();
    expect(screen.getByText('No Organization Access')).toBeInTheDocument();
  });

  it('shows feature not available when access check throws feature error', async () => {
    mockCheckNotesAccess.mockRejectedValueOnce(new Error('Feature \'notes\' is not enabled for this organization'));

    const Page = await NotesPage();
    render(Page);
    
    // Verify the mock was called (no arguments expected)
    expect(mockCheckNotesAccess).toHaveBeenCalledWith();
    
    expect(screen.getByTestId('feature-not-available')).toBeInTheDocument();
    expect(screen.getByText('Notes feature is not available.')).toBeInTheDocument();
  });

  it('shows insufficient permissions when access check throws permission error', async () => {
    mockCheckNotesAccess.mockRejectedValueOnce(new Error('Insufficient permissions: requires one of [view:note]'));

    const Page = await NotesPage();
    render(Page);

    expect(screen.getByText('Insufficient Permissions')).toBeInTheDocument();
    expect(screen.getByText(/You don't have the required permissions to access Notes/)).toBeInTheDocument();
  });

  it('shows error when notes fetching fails in content component', async () => {
    // Mock successful access check
    mockCheckNotesAccess.mockResolvedValueOnce({
      hasAccess: true,
      organizationId: mockOrg,
      user: mockUser,
    });

    // Mock successful user fetch
    mockSupabaseClient.auth.getUser.mockResolvedValueOnce({
      data: { user: mockUser },
      error: null,
    });

    // Mock failed notes fetch
    mockQueryBuilder.order.mockResolvedValueOnce({
      data: null,
      error: { message: 'Database error' },
    });

    const Page = await NotesPage();
    render(Page);

    expect(screen.getByText(/Error: Could not fetch notes/)).toBeInTheDocument();
  });

  it('shows error when user fetch fails in content component', async () => {
    // Mock successful access check
    mockCheckNotesAccess.mockResolvedValueOnce({
      hasAccess: true,
      organizationId: mockOrg,
      user: mockUser,
    });

    // Mock failed user fetch
    mockSupabaseClient.auth.getUser.mockResolvedValueOnce({
      data: { user: null },
      error: { message: 'Authentication failed' },
    });

    const Page = await NotesPage();
    render(Page);

    expect(screen.getByText(/Error: Authentication error occurred/)).toBeInTheDocument();
  });
}); 