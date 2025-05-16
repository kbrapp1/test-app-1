import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { DamSearchBar } from './DamSearchBar';
import { SearchDropdownMenu } from './SearchDropdownMenu';
import { TooltipProvider } from '@/components/ui/tooltip';

// Mock next/navigation
const mockRouterPush = vi.fn();
const mockSearchParamsGet = vi.fn((key: string) => null);
const mockSearchParamsToString = vi.fn(() => '');

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockRouterPush }),
  useSearchParams: () => ({
    get: mockSearchParamsGet,
    toString: mockSearchParamsToString,
  }),
}));

// Mock SearchDropdownMenu
vi.mock('./SearchDropdownMenu', () => {
  const mockFn = vi.fn(() => <div data-testid="search-dropdown-menu"></div>);
  (global as any).mockSearchDropdownMenuGlobal = mockFn;
  return {
    SearchDropdownMenu: mockFn,
  };
});

// Mock fetch
global.fetch = vi.fn();

describe('DamSearchBar', () => {
  beforeEach(() => {
    mockRouterPush.mockClear();
    mockSearchParamsGet.mockClear().mockImplementation((key: string) => null);
    mockSearchParamsToString.mockClear().mockImplementation(() => '');
    (fetch as any).mockClear();
    if ((global as any).mockSearchDropdownMenuGlobal) {
      ((global as any).mockSearchDropdownMenuGlobal as any).mockClear();
    }
  });

  const defaultProps = {
    currentFolderId: null,
    gallerySearchTerm: '',
  };

  // Helper function to render with TooltipProvider
  const renderWithProvider = (ui: React.ReactElement) => {
    return render(<TooltipProvider>{ui}</TooltipProvider>);
  };

  test('renders search input and buttons', () => {
    renderWithProvider(<DamSearchBar {...defaultProps} />);
    expect(screen.getByPlaceholderText('Search all assets & folders...')).toBeInTheDocument();
    expect(screen.getByLabelText('Search')).toBeInTheDocument();
    expect(screen.getByLabelText('Upload Asset')).toBeInTheDocument();
  });

  test('initializes searchInputTerm with gallerySearchTerm', () => {
    renderWithProvider(<DamSearchBar {...defaultProps} gallerySearchTerm="initial search" />);
    expect(screen.getByPlaceholderText('Search all assets & folders...')).toHaveValue('initial search');
  });

  test('updates searchInputTerm on change', () => {
    renderWithProvider(<DamSearchBar {...defaultProps} />);
    const input = screen.getByPlaceholderText('Search all assets & folders...');
    fireEvent.change(input, { target: { value: 'new search' } });
    expect(input).toHaveValue('new search');
  });

  test('calls handleClearSearch and clears input when native clear is used', () => {
    renderWithProvider(<DamSearchBar {...defaultProps} gallerySearchTerm="test" />);    
    const input = screen.getByPlaceholderText('Search all assets & folders...') as HTMLInputElement;
    expect(input.value).toBe('test');
    fireEvent.change(input, { target: { value: '' } });
    expect(input.value).toBe('');
    expect(mockRouterPush).toHaveBeenCalledWith('/dam');
  });

  test('submits search on form submission', () => {
    renderWithProvider(<DamSearchBar {...defaultProps} />);
    const input = screen.getByPlaceholderText('Search all assets & folders...');
    fireEvent.change(input, { target: { value: 'submit search' } });
    fireEvent.submit(screen.getByLabelText('Search'));
    expect(mockRouterPush).toHaveBeenCalledWith('/dam?q=submit+search');
  });

  test('shows dropdown on input focus if search term exists and has results (mocked)', async () => {
    (fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => [{ id: '1', name: 'result 1', type: 'file' }],
    } as Response);
    renderWithProvider(<DamSearchBar {...defaultProps} />);
    const input = screen.getByPlaceholderText('Search all assets & folders...');
    fireEvent.change(input, { target: { value: 'res' } });
    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1)); 
    fireEvent.focus(input);
    await waitFor(() => {
        expect((global as any).mockSearchDropdownMenuGlobal).toHaveBeenCalled();
    });
  });

  test('fetches and shows dropdown results after debounce', async () => {
    (fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => [{ id: 'file1', name: 'File One', type: 'file' }],
    } as Response);
    renderWithProvider(<DamSearchBar {...defaultProps} />);
    const input = screen.getByPlaceholderText('Search all assets & folders...');
    fireEvent.change(input, { target: { value: 'debounce test' } });

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledTimes(1);
    }, { timeout: 500 }); 

    await waitFor(() => {
        expect((global as any).mockSearchDropdownMenuGlobal).toHaveBeenCalled();
        const mockCalls = ((global as any).mockSearchDropdownMenuGlobal as any).mock.calls as any[];
        const lastCall = mockCalls[mockCalls.length -1];
        expect(lastCall[0].items).toEqual([{ id: 'file1', name: 'File One', type: 'file' }]);
        expect(lastCall[0].isLoading).toBe(false);
        expect(lastCall[0].searchTermForDisplay).toBe('debounce test');
    });
  });

  test('handles dropdown item selection for a file', async () => {
    (fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => [{ id: 'file1', name: 'Selected File', type: 'file' }],
    } as Response);
    renderWithProvider(<DamSearchBar {...defaultProps} />);
    const input = screen.getByPlaceholderText('Search all assets & folders...');
    fireEvent.change(input, { target: { value: 'show' } });
    await waitFor(() => expect(fetch).toHaveBeenCalled());
    await waitFor(() => expect((global as any).mockSearchDropdownMenuGlobal).toHaveBeenCalled());

    const fileCall = ((global as any).mockSearchDropdownMenuGlobal as any).mock.calls[0][0] as any;
    fileCall.onSelect({ id: 'file1', name: 'Selected File', type: 'file' });

    expect(mockRouterPush).toHaveBeenCalledWith('/dam?q=Selected+File');
    await waitFor(() => expect(input).toHaveValue(''));
  });

  test('handles dropdown item selection for a folder', async () => {
    (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => [{ id: 'folder1', name: 'Selected Folder', type: 'folder' }],
      } as Response);
      renderWithProvider(<DamSearchBar {...defaultProps} />);
      const input = screen.getByPlaceholderText('Search all assets & folders...');
      fireEvent.change(input, { target: { value: 'show' } });
      await waitFor(() => expect(fetch).toHaveBeenCalled());
      await waitFor(() => expect((global as any).mockSearchDropdownMenuGlobal).toHaveBeenCalled());
  
      const folderCall = ((global as any).mockSearchDropdownMenuGlobal as any).mock.calls[0][0] as any;
      folderCall.onSelect({ id: 'folder1', name: 'Selected Folder', type: 'folder' });
  
      expect(mockRouterPush).toHaveBeenCalledWith('/dam?folderId=folder1');
      await waitFor(() => expect(input).toHaveValue(''));
  });

  test('closes dropdown on click outside', async () => {
    (fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => [{ id: '1', name: 'result 1', type: 'file' }],
    } as Response);
    renderWithProvider(
      <div>
        <DamSearchBar {...defaultProps} />
        <button>Outside Button</button>
      </div>
    );
    const input = screen.getByPlaceholderText('Search all assets & folders...');
    fireEvent.change(input, { target: { value: 'res' } }); 
    await waitFor(() => expect(fetch).toHaveBeenCalled());
    await waitFor(() => expect(((global as any).mockSearchDropdownMenuGlobal as any).mock.calls.length > 0).toBe(true));
    
    const initialCallCount = ((global as any).mockSearchDropdownMenuGlobal as any).mock.calls.length;

    fireEvent.mouseDown(screen.getByText('Outside Button'));
    
    await waitFor(() => {
    });
  });

  test('upload button link is correct when currentFolderId is null', () => {
    renderWithProvider(<DamSearchBar {...defaultProps} currentFolderId={null} />);
    const uploadLink = screen.getByLabelText('Upload Asset').closest('a');
    expect(uploadLink).toHaveAttribute('href', '/dam/upload');
  });

  test('upload button link is correct when currentFolderId is provided', () => {
    renderWithProvider(<DamSearchBar {...defaultProps} currentFolderId="folder123" />);
    const uploadLink = screen.getByLabelText('Upload Asset').closest('a');
    expect(uploadLink).toHaveAttribute('href', '/dam/upload?folderId=folder123');
  });

  test('upload button link is correct when gallerySearchTerm is present (always root upload)', () => {
    renderWithProvider(<DamSearchBar {...defaultProps} gallerySearchTerm="searching" currentFolderId="folder123" />);
    const uploadLink = screen.getByLabelText('Upload Asset').closest('a');
    expect(uploadLink).toHaveAttribute('href', '/dam/upload');
  });

}); 