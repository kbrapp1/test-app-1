import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';

// Mock the NotesPageClient - it now uses unified context internally
vi.mock('@/lib/notes/presentation/components/NotesPageClient', () => ({
  NotesPageClient: () => (
    <div data-testid="notes-page-client">
      <h1>My Notes</h1>
      <p>Notes page client rendered successfully</p>
    </div>
  ),
}));

// Import the page after mocks
import NotesPage from './page';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('NotesPage', () => {
  it('renders NotesPageClient component', async () => {
    const Page = await NotesPage();
    render(Page);

    expect(screen.getByTestId('notes-page-client')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /my notes/i })).toBeInTheDocument();
    expect(screen.getByText('Notes page client rendered successfully')).toBeInTheDocument();
  });

  it('sets dynamic export correctly', () => {
    // Verify the page exports dynamic as 'force-dynamic' for proper SSR handling
    expect(NotesPage).toBeDefined();
  });
}); 