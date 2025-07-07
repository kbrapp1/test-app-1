import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';

// Mock Next.js headers and cache
vi.mock('next/headers', () => ({ cookies: vi.fn(() => ({ get: vi.fn(), set: vi.fn(), delete: vi.fn() })) }));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));

// Mock Supabase server client
const mockSupabaseServer = {
  auth: { getUser: vi.fn() },
  from: vi.fn().mockReturnThis(),
  select: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  order: vi.fn().mockReturnThis(),
};
vi.mock('@/lib/supabase/server', () => ({ createClient: vi.fn(() => mockSupabaseServer) }));

// Mock UI components used by NotesPage
vi.mock('@/components/notes/add-note-dialog', () => ({
  AddNoteDialog: ({ triggerButtonText, addNoteAction }: { triggerButtonText?: string; addNoteAction: (payload: any) => any }) => (
    <button data-testid="add-note-dialog-trigger" onClick={() => addNoteAction({})}>
      {triggerButtonText}
    </button>
  ),
}));
vi.mock('@/components/notes/note-list', () => ({
  NoteList: ({ initialNotes }: { initialNotes: any[] }) => (
    <ul data-testid="note-list">
      {initialNotes.map((n: any) => (
        <li key={n.id} data-testid={`note-item-${n.id}`}>
          {n.title || 'Untitled'}
        </li>
      ))}
    </ul>
  ),
}));
vi.mock('@/components/ui/empty-state', () => ({
  EmptyState: ({ title, description, action }: { title: string; description: string; action?: React.ReactNode }) => (
    <div data-testid="empty-state">
      <h2>{title}</h2>
      <p>{description}</p>
      {action}
    </div>
  ),
}));
vi.mock('@/hooks/use-toast', () => ({ useToast: () => ({ toast: vi.fn() }) }));

// Mock the getActiveOrganizationId function
vi.mock('@/lib/auth/server-action', () => ({
  getActiveOrganizationId: vi.fn(),
}));

// Import the page and the mocked function after mocks
import NotesPage from './page';
import { getActiveOrganizationId } from '@/lib/auth/server-action';

const mockGetActiveOrganizationId = vi.mocked(getActiveOrganizationId);

beforeEach(() => {
  vi.clearAllMocks();
  // Reset Supabase client mocks
  mockSupabaseServer.auth.getUser = vi.fn();
  mockSupabaseServer.from = vi.fn().mockReturnThis();
  mockSupabaseServer.select = vi.fn().mockReturnThis();
  mockSupabaseServer.eq = vi.fn().mockReturnThis();
  mockSupabaseServer.order = vi.fn().mockReturnThis();
  // Reset getActiveOrganizationId mock
  mockGetActiveOrganizationId.mockClear();
});

describe('NotesPage', () => {
  const mockUser = { id: 'user-123', email: 'test@example.com' };
  const mockOrg = 'org-abc-123';
  const mockNotes = [
    { id: 'note-1', user_id: 'user-123', organization_id: mockOrg, title: 'Note 1', content: 'First', created_at: '', updated_at: null, position: 1 },
    { id: 'note-2', user_id: 'user-123', organization_id: mockOrg, title: null, content: 'Second', created_at: '', updated_at: null, position: 2 },
  ];

  it('renders list when notes exist', async () => {
    mockGetActiveOrganizationId.mockResolvedValueOnce(mockOrg);
    mockSupabaseServer.auth.getUser.mockResolvedValueOnce({ data: { user: mockUser }, error: null });
    mockSupabaseServer.order.mockResolvedValueOnce({ data: mockNotes, error: null });

    const Page = await NotesPage();
    render(Page);

    expect(screen.getByRole('heading', { name: /my notes/i })).toBeInTheDocument();
    expect(screen.getByTestId('add-note-dialog-trigger')).toHaveTextContent(/add new note/i);
    expect(screen.getByTestId('note-list')).toBeInTheDocument();
    expect(screen.getByTestId('note-item-note-1')).toBeInTheDocument();
    expect(screen.getByTestId('note-item-note-2')).toBeInTheDocument();
  });

  it('renders empty state when no notes', async () => {
    mockGetActiveOrganizationId.mockResolvedValueOnce(mockOrg);
    mockSupabaseServer.auth.getUser.mockResolvedValueOnce({ data: { user: mockUser }, error: null });
    mockSupabaseServer.order.mockResolvedValueOnce({ data: [], error: null });

    const Page = await NotesPage();
    render(Page);

    expect(screen.getByTestId('empty-state')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /no notes yet/i })).toBeInTheDocument();
  });

  it('shows error if getOrgId returns null', async () => {
    mockGetActiveOrganizationId.mockResolvedValueOnce(null);
    mockSupabaseServer.auth.getUser.mockResolvedValueOnce({ data: { user: mockUser }, error: null });

    const Page = await NotesPage();
    render(Page);

    expect(screen.getByText(/active organization context is missing/i)).toBeInTheDocument();
  });

  it('shows error if getOrgId throws', async () => {
    mockGetActiveOrganizationId.mockRejectedValueOnce(new Error('fail'));
    mockSupabaseServer.auth.getUser.mockResolvedValueOnce({ data: { user: mockUser }, error: null });

    const Page = await NotesPage();
    render(Page);

    expect(screen.getByText(/could not determine active organization/i)).toBeInTheDocument();
  });

  it('shows error if user fetch fails', async () => {
    mockGetActiveOrganizationId.mockResolvedValueOnce(mockOrg);
    mockSupabaseServer.auth.getUser.mockResolvedValueOnce({ data: { user: null }, error: new Error('fail') });

    const Page = await NotesPage();
    render(Page);

    expect(screen.getByText(/could not fetch user data/i)).toBeInTheDocument();
  });

  it('shows error if fetching notes fails', async () => {
    mockGetActiveOrganizationId.mockResolvedValueOnce(mockOrg);
    mockSupabaseServer.auth.getUser.mockResolvedValueOnce({ data: { user: mockUser }, error: null });
    mockSupabaseServer.order.mockResolvedValueOnce({ data: null, error: new Error('db') });

    const Page = await NotesPage();
    render(Page);

    expect(screen.getByText(/could not fetch notes/i)).toBeInTheDocument();
  });
}); 