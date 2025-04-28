import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import NotesPage from './page';

// --- Mocks ---

// Mock next/headers
vi.mock('next/headers', () => ({
  cookies: vi.fn(() => ({
    get: vi.fn(), // Mock methods used by createClient if any remain
    set: vi.fn(),
    delete: vi.fn(),
    // Add other methods if needed by your Supabase setup
  })),
}));

// Mock next/cache
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

// Mock Supabase server client (only needed for NotesPage data fetching)
const mockSupabaseServer = {
  auth: { getUser: vi.fn() },
  from: vi.fn().mockReturnThis(),
  select: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  order: vi.fn().mockReturnThis(),
};
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => mockSupabaseServer),
}));

// --- Mock Client Components ---
// We mock the actual client components to isolate the NotesPage
// and to provide mocked actions easily.

// Mock AddNoteDialog (represents the trigger button)
vi.mock('@/components/notes/add-note-dialog', () => ({
  AddNoteDialog: ({ triggerButtonText }: { triggerButtonText?: string }) => (
    <button data-testid="add-note-dialog-trigger">{triggerButtonText || 'Add Note'}</button>
  )
}));

// Mock NoteList (renders mocked NoteListItems)
vi.mock('@/components/notes/note-list', () => ({
  NoteList: ({ initialNotes }: { initialNotes: any[] }) => (
    <ul data-testid="note-list">
      {initialNotes.map(note => (
        // Render a simplified representation for testing NotesPage
        <li key={note.id} data-testid={`note-item-${note.id}`}> 
           <span>{note.title || 'Untitled Note'}</span> 
           <span>{note.content}</span> 
        </li>
      ))}
    </ul>
  )
}));

// Mock EmptyState
vi.mock('@/components/ui/empty-state', () => ({
    EmptyState: ({ title, description, action }: { title: string, description: string, action?: React.ReactNode }) => (
        <div data-testid="empty-state">
            <h2>{title}</h2>
            <p>{description}</p>
            {action}
        </div>
    )
}));

// Mock useToast 
vi.mock('@/hooks/use-toast', () => ({ useToast: () => ({ toast: vi.fn() }) }));


// --- Test Setup ---
beforeEach(() => {
  vi.clearAllMocks();
  // Reset server mocks
  mockSupabaseServer.from = vi.fn().mockReturnThis();
  mockSupabaseServer.select = vi.fn().mockReturnThis();
  mockSupabaseServer.eq = vi.fn().mockReturnThis();
  mockSupabaseServer.order = vi.fn().mockReturnThis();
});

// --- Tests ---

describe('NotesPage', () => {
  const mockUser = { id: 'user-123', email: 'test@example.com' };
  const mockNotes = [
    { id: 'note-1', user_id: 'user-123', title: 'Note 1 Title', content: 'First test note', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: 'note-2', user_id: 'user-123', title: null, content: 'Second test note', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  ];

  it('renders the title, add button, and note list when notes exist', async () => {
    // Arrange
    mockSupabaseServer.auth.getUser.mockResolvedValueOnce({ data: { user: mockUser }, error: null });
    mockSupabaseServer.order.mockResolvedValueOnce({ data: mockNotes, error: null });

    // Act
    const PageComponent = await NotesPage();
    render(PageComponent);

    // Assert
    expect(screen.getByRole('heading', { name: /my notes/i })).toBeInTheDocument();
    // Check for the Add Note Dialog trigger button (since notes exist)
    expect(screen.getByTestId('add-note-dialog-trigger')).toHaveTextContent(/add new note/i);
    // Check that the NoteList mock was rendered
    expect(screen.getByTestId('note-list')).toBeInTheDocument();
    // Check content from the mocked NoteListItems
    expect(screen.getByText('Note 1 Title')).toBeInTheDocument(); 
    expect(screen.getByText('Second test note')).toBeInTheDocument();
    expect(screen.queryByTestId('empty-state')).not.toBeInTheDocument(); // Empty state should NOT be present
  });

  it('renders the EmptyState component when no notes are found', async () => {
     // Arrange
     mockSupabaseServer.auth.getUser.mockResolvedValueOnce({ data: { user: mockUser }, error: null });
     mockSupabaseServer.order.mockResolvedValueOnce({ data: [], error: null }); // No notes

     // Act
     const PageComponent = await NotesPage();
     render(PageComponent);

     // Assert
     const emptyState = screen.getByTestId('empty-state');
     expect(emptyState).toBeInTheDocument();
     // Check for text within the EmptyState mock
     expect(screen.getByRole('heading', { name: /no notes yet/i })).toBeInTheDocument();
     expect(screen.getByText(/get started by adding your first note./i)).toBeInTheDocument();
     // Check that the AddNoteDialog trigger is rendered inside the EmptyState action slot
     expect(screen.getByTestId('add-note-dialog-trigger')).toHaveTextContent(/add first note/i);
     expect(screen.queryByTestId('note-list')).not.toBeInTheDocument(); // List should NOT be present
  });

  // Error state tests remain the same
  it('renders an error message if fetching user fails', async () => {
     const userError = new Error('Failed to fetch user');
     mockSupabaseServer.auth.getUser.mockResolvedValueOnce({ data: { user: null }, error: userError });
     const PageComponent = await NotesPage();
     render(PageComponent);
     expect(screen.getByText(/error: could not fetch user data./i)).toBeInTheDocument();
     expect(screen.queryByTestId('note-list')).not.toBeInTheDocument();
     expect(screen.queryByTestId('empty-state')).not.toBeInTheDocument();
  });

   it('renders an error message if fetching notes fails', async () => {
     const notesError = new Error('Database connection failed');
     mockSupabaseServer.auth.getUser.mockResolvedValueOnce({ data: { user: mockUser }, error: null });
     mockSupabaseServer.order.mockResolvedValueOnce({ data: null, error: notesError });
     const PageComponent = await NotesPage();
     render(PageComponent);
     expect(screen.getByText(/error: could not fetch notes./i)).toBeInTheDocument();
     expect(screen.queryByTestId('note-list')).not.toBeInTheDocument();
     expect(screen.queryByTestId('empty-state')).not.toBeInTheDocument();
  });

});

// NOTE: Testing the actual client-side interactions (edit mode toggle, button states)
// within NoteListItem requires testing that component directly, not just mocking it.
// This file now primarily tests that NotesPage renders and passes the correct actions. 